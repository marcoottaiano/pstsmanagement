import type { GroupNode } from "./groups.types";

export function getGroupNodePath(
  nodes: readonly GroupNode[],
  selectedNode: GroupNode,
): readonly GroupNode[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const path: GroupNode[] = [];
  let currentNode: GroupNode | undefined = selectedNode;

  while (currentNode) {
    path.unshift(currentNode);
    currentNode = currentNode.parentId ? nodesById.get(currentNode.parentId) : undefined;
  }

  return path;
}

export function getChildNodes(
  nodes: readonly GroupNode[],
  parentId: string | null,
): readonly GroupNode[] {
  return nodes.filter((node) => node.parentId === parentId).toSorted(compareGroupNodes);
}

export function getTreeRoots(nodes: readonly GroupNode[]): readonly GroupNode[] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  return nodes
    .filter((node) => !node.parentId || !nodeIds.has(node.parentId))
    .toSorted(compareGroupNodes);
}

export function compareGroupNodes(first: GroupNode, second: GroupNode): number {
  return first.sortOrder - second.sortOrder || first.name.localeCompare(second.name, "it");
}

export function getDescendantNodeIds(
  nodes: readonly GroupNode[],
  nodeId: string,
): ReadonlySet<string> {
  const childrenByParent = new Map<string | null, GroupNode[]>();

  for (const node of nodes) {
    const siblings = childrenByParent.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  }

  const descendantIds = new Set<string>();
  const pending = [nodeId];

  while (pending.length > 0) {
    const currentId = pending.pop();
    if (!currentId || descendantIds.has(currentId)) {
      continue;
    }

    descendantIds.add(currentId);
    for (const child of childrenByParent.get(currentId) ?? []) {
      pending.push(child.id);
    }
  }

  return descendantIds;
}
