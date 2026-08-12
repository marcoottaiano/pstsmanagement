import { z } from "zod";

import {
  archiveGroupNodeSchema,
  createGroupNodeSchema,
  deleteGroupNodeSchema,
  groupNodeSchema,
  moveGroupNodeSchema,
  renameGroupNodeSchema,
  reorderGroupNodeSchema,
} from "./groups.schemas";

export type GroupNode = z.infer<typeof groupNodeSchema>;
export type GroupNodeType = GroupNode["nodeType"];
export type CreateGroupNodeInput = z.infer<typeof createGroupNodeSchema>;
export type RenameGroupNodeInput = z.infer<typeof renameGroupNodeSchema>;
export type MoveGroupNodeInput = z.infer<typeof moveGroupNodeSchema>;
export type ReorderGroupNodeInput = z.infer<typeof reorderGroupNodeSchema>;
export type ArchiveGroupNodeInput = z.infer<typeof archiveGroupNodeSchema>;
export type DeleteGroupNodeInput = z.infer<typeof deleteGroupNodeSchema>;

export type GroupFilterContext = Readonly<{
  nodes: readonly GroupNode[];
  selectedNode: GroupNode | null;
  selectedPath: readonly GroupNode[];
  scopeGroupIds: readonly string[];
  invalidSelection: boolean;
}>;

export type GroupActionResult = Readonly<{
  error?: string;
  success?: string;
}>;
