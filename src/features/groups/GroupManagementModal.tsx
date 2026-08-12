"use client";

import {
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Radio,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAlertCircle,
  IconArchive,
  IconArrowDown,
  IconArrowUp,
  IconFolder,
  IconFolderOpen,
  IconGripVertical,
  IconPlus,
  IconRestore,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { DragEvent } from "react";
import { useState } from "react";

import type { Sector } from "@/features/auth/auth.types";

import {
  createGroupNode,
  deleteGroupNode,
  moveGroupNode,
  renameGroupNode,
  reorderGroupNode,
  setGroupSubtreeArchiveState,
} from "./groups.actions";
import { groupNodeTypeSchema } from "./groups.schemas";
import type { GroupActionResult, GroupNode, GroupNodeType } from "./groups.types";
import { getChildNodes, getDescendantNodeIds, getTreeRoots } from "./groups.utils";

type GroupManagementModalProps = Readonly<{
  sector: Sector;
  nodes: readonly GroupNode[];
}>;

type Feedback = Readonly<{
  color: "green" | "red";
  message: string;
}>;

const ROOT_VALUE = "__root__";

function getNodeLabel(node: GroupNode): string {
  return `${node.name} · ${node.nodeType === "CATEGORY" ? "Categoria" : "Gruppo"}`;
}

function GroupTreeNode({
  node,
  nodes,
  selectedNodeId,
  onSelect,
  onDropNode,
}: Readonly<{
  node: GroupNode;
  nodes: readonly GroupNode[];
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
  onDropNode: (nodeId: string, parentId: string) => void;
}>) {
  const children = getChildNodes(nodes, node.id);

  function onDragStart(event: DragEvent<HTMLDivElement>): void {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", node.id);
  }

  function onDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    const draggedNodeId = event.dataTransfer.getData("text/plain");
    if (draggedNodeId && draggedNodeId !== node.id) {
      onDropNode(draggedNodeId, node.id);
    }
  }

  return (
    <li className="group-tree-node">
      <div
        className={`group-tree-row${selectedNodeId === node.id ? " group-tree-row-selected" : ""}`}
        draggable
        onDragStart={onDragStart}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <Button
          variant="subtle"
          color="dark"
          justify="start"
          fullWidth
          leftSection={<IconGripVertical size={16} aria-hidden="true" />}
          onClick={() => onSelect(node.id)}
        >
          <Group gap="xs" wrap="nowrap">
            {node.nodeType === "CATEGORY" ? <IconFolder size={16} /> : <IconFolderOpen size={16} />}
            <Text size="sm" truncate>
              {node.name}
            </Text>
            <Badge
              size="xs"
              variant="light"
              color={node.nodeType === "CATEGORY" ? "blue" : "grape"}
            >
              {node.nodeType === "CATEGORY" ? "Categoria" : "Gruppo"}
            </Badge>
          </Group>
        </Button>
      </div>
      {children.length > 0 ? (
        <ul className="group-tree-children">
          {children.map((child) => (
            <GroupTreeNode
              key={child.id}
              node={child}
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              onDropNode={onDropNode}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function GroupManagementModal({ sector, nodes }: GroupManagementModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const router = useRouter();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeType, setNewNodeType] = useState<GroupNodeType>("CATEGORY");
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [moveParentId, setMoveParentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, setPending] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const activeNodes = nodes.filter((node) => !node.isArchived);
  const archivedNodes = nodes.filter((node) => node.isArchived);
  const selectedDescendantIds = selectedNode
    ? getDescendantNodeIds(nodes, selectedNode.id)
    : new Set<string>();
  const eligibleParents = activeNodes.filter((node) => !selectedDescendantIds.has(node.id));
  const parentOptions = [{ value: ROOT_VALUE, label: "Radice del settore" }].concat(
    eligibleParents.map((node) => ({ value: node.id, label: getNodeLabel(node) })),
  );

  async function runAction(action: () => Promise<GroupActionResult>): Promise<void> {
    setPending(true);
    setFeedback(null);
    const result = await action();
    setPending(false);

    if (result.error) {
      setFeedback({ color: "red", message: result.error });
      return;
    }

    setFeedback({ color: "green", message: result.success ?? "Modifica salvata." });
    router.refresh();
  }

  function selectNode(nodeId: string): void {
    const node = nodes.find((candidate) => candidate.id === nodeId);
    setSelectedNodeId(nodeId);
    setRenameValue(node?.name ?? "");
    setMoveParentId(node?.parentId ?? ROOT_VALUE);
    setNewParentId(nodeId);
  }

  function updateNewNodeType(value: string): void {
    const parsed = groupNodeTypeSchema.safeParse(value);
    if (parsed.success) {
      setNewNodeType(parsed.data);
    }
  }

  function handleDrop(draggedNodeId: string, parentId: string): void {
    void runAction(() => moveGroupNode({ sectorId: sector.id, nodeId: draggedNodeId, parentId }));
  }

  return (
    <>
      <Button leftSection={<IconSettings size={16} />} onClick={open}>
        Gestisci gruppi
      </Button>
      <Modal opened={opened} onClose={close} title={`Gestisci gruppi · ${sector.name}`} size="xl">
        <Stack gap="lg">
          <Text c="dimmed" size="sm">
            Trascina un nodo sopra il nuovo genitore per spostarlo. Le frecce restano disponibili
            per il riordino accessibile.
          </Text>

          {feedback ? (
            <Alert
              color={feedback.color}
              icon={<IconAlertCircle size={18} aria-hidden="true" />}
              role="status"
            >
              {feedback.message}
            </Alert>
          ) : null}

          <Tabs defaultValue="active">
            <Tabs.List>
              <Tabs.Tab value="active">Attivi ({activeNodes.length})</Tabs.Tab>
              <Tabs.Tab value="archived">Archiviati ({archivedNodes.length})</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="active" pt="md">
              {activeNodes.length > 0 ? (
                <ul className="group-tree" aria-label="Gerarchia gruppi attivi">
                  {getTreeRoots(activeNodes).map((node) => (
                    <GroupTreeNode
                      key={node.id}
                      node={node}
                      nodes={activeNodes}
                      selectedNodeId={selectedNodeId}
                      onSelect={selectNode}
                      onDropNode={handleDrop}
                    />
                  ))}
                </ul>
              ) : (
                <Text c="dimmed" size="sm">
                  Nessun nodo attivo.
                </Text>
              )}
            </Tabs.Panel>
            <Tabs.Panel value="archived" pt="md">
              {archivedNodes.length > 0 ? (
                <ul className="group-tree" aria-label="Gerarchia gruppi archiviati">
                  {getTreeRoots(archivedNodes).map((node) => (
                    <GroupTreeNode
                      key={node.id}
                      node={node}
                      nodes={archivedNodes}
                      selectedNodeId={selectedNodeId}
                      onSelect={selectNode}
                      onDropNode={handleDrop}
                    />
                  ))}
                </ul>
              ) : (
                <Text c="dimmed" size="sm">
                  Nessun nodo archiviato.
                </Text>
              )}
            </Tabs.Panel>
          </Tabs>

          <Divider />
          <Stack gap="sm">
            <Text fw={600}>Nuovo nodo</Text>
            <TextInput
              label="Nome"
              value={newNodeName}
              onChange={(event) => setNewNodeName(event.currentTarget.value)}
            />
            <Radio.Group label="Tipo" value={newNodeType} onChange={updateNewNodeType}>
              <Group mt="xs">
                <Radio value="CATEGORY" label="Categoria" />
                <Radio value="GROUP" label="Gruppo" />
              </Group>
            </Radio.Group>
            <Select
              label="Genitore"
              data={[{ value: ROOT_VALUE, label: "Radice del settore" }].concat(
                activeNodes.map((node) => ({ value: node.id, label: getNodeLabel(node) })),
              )}
              value={newParentId ?? ROOT_VALUE}
              onChange={(value) =>
                setNewParentId(value === ROOT_VALUE || value === null ? null : value)
              }
              searchable
            />
            <Button
              leftSection={<IconPlus size={16} />}
              loading={pending}
              onClick={() =>
                void runAction(async () => {
                  const result = await createGroupNode({
                    sectorId: sector.id,
                    parentId: newParentId,
                    name: newNodeName,
                    nodeType: newNodeType,
                  });
                  if (!result.error) {
                    setNewNodeName("");
                  }
                  return result;
                })
              }
            >
              Crea nodo
            </Button>
          </Stack>

          {selectedNode ? (
            <>
              <Divider />
              <Stack gap="sm">
                <Text fw={600}>Nodo selezionato: {selectedNode.name}</Text>
                <TextInput
                  label="Rinomina"
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.currentTarget.value)}
                />
                <Button
                  variant="light"
                  loading={pending}
                  onClick={() =>
                    void runAction(() =>
                      renameGroupNode({
                        sectorId: sector.id,
                        nodeId: selectedNode.id,
                        name: renameValue,
                      }),
                    )
                  }
                >
                  Salva nome
                </Button>
                {!selectedNode.isArchived ? (
                  <>
                    <Select
                      label="Sposta sotto"
                      data={parentOptions}
                      value={moveParentId ?? ROOT_VALUE}
                      onChange={(value) =>
                        setMoveParentId(value === ROOT_VALUE || value === null ? null : value)
                      }
                      searchable
                    />
                    <Group grow>
                      <Button
                        variant="light"
                        loading={pending}
                        onClick={() =>
                          void runAction(() =>
                            moveGroupNode({
                              sectorId: sector.id,
                              nodeId: selectedNode.id,
                              parentId: moveParentId,
                            }),
                          )
                        }
                      >
                        Sposta
                      </Button>
                      <Button
                        variant="light"
                        leftSection={<IconArrowUp size={16} />}
                        loading={pending}
                        onClick={() =>
                          void runAction(() =>
                            reorderGroupNode({
                              sectorId: sector.id,
                              nodeId: selectedNode.id,
                              direction: "up",
                            }),
                          )
                        }
                      >
                        Su
                      </Button>
                      <Button
                        variant="light"
                        leftSection={<IconArrowDown size={16} />}
                        loading={pending}
                        onClick={() =>
                          void runAction(() =>
                            reorderGroupNode({
                              sectorId: sector.id,
                              nodeId: selectedNode.id,
                              direction: "down",
                            }),
                          )
                        }
                      >
                        Giù
                      </Button>
                    </Group>
                    <Group grow>
                      <Button
                        color="orange"
                        variant="light"
                        leftSection={<IconArchive size={16} />}
                        loading={pending}
                        onClick={() =>
                          void runAction(() =>
                            setGroupSubtreeArchiveState({
                              sectorId: sector.id,
                              nodeId: selectedNode.id,
                              archived: true,
                            }),
                          )
                        }
                      >
                        Archivia sottoalbero
                      </Button>
                      <Button
                        color="red"
                        variant="light"
                        leftSection={<IconTrash size={16} />}
                        onClick={() => setDeleteConfirmationOpen(true)}
                      >
                        Elimina nodo vuoto
                      </Button>
                    </Group>
                  </>
                ) : (
                  <Button
                    color="teal"
                    variant="light"
                    leftSection={<IconRestore size={16} />}
                    loading={pending}
                    onClick={() =>
                      void runAction(() =>
                        setGroupSubtreeArchiveState({
                          sectorId: sector.id,
                          nodeId: selectedNode.id,
                          archived: false,
                        }),
                      )
                    }
                  >
                    Ripristina sottoalbero
                  </Button>
                )}
              </Stack>
            </>
          ) : null}
        </Stack>
      </Modal>
      <Modal
        opened={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
        title="Eliminare il nodo?"
        centered
      >
        <Stack gap="md">
          <Text>
            L&apos;eliminazione è definitiva. Il database bloccherà comunque l&apos;operazione se il
            nodo ha figli o dati storici associati.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteConfirmationOpen(false)}>
              Annulla
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              loading={pending}
              onClick={() =>
                void runAction(async () => {
                  const result = selectedNode
                    ? await deleteGroupNode({ sectorId: sector.id, nodeId: selectedNode.id })
                    : { error: "Il nodo selezionato non è più disponibile." };
                  if (!result.error) {
                    setDeleteConfirmationOpen(false);
                    setSelectedNodeId(null);
                  }
                  return result;
                })
              }
            >
              Elimina definitivamente
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
