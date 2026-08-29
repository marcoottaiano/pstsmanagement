import { z } from "zod";

export const groupNodeSchema = z.object({
  id: z.string().uuid(),
  sectorId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  name: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  isArchived: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const groupNodeDatabaseSchema = z
  .object({
    id: z.string().uuid(),
    sector_id: z.string().uuid(),
    parent_id: z.string().uuid().nullable(),
    name: z.string().min(1),
    sort_order: z.number().int().nonnegative(),
    is_archived: z.boolean(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .transform((node) => ({
    id: node.id,
    sectorId: node.sector_id,
    parentId: node.parent_id,
    name: node.name,
    sortOrder: node.sort_order,
    isArchived: node.is_archived,
    createdAt: node.created_at,
    updatedAt: node.updated_at,
  }));

const groupNameSchema = z
  .string()
  .trim()
  .min(1, "Inserisci un nome.")
  .max(120, "Il nome è troppo lungo.");
const groupNodeIdSchema = z.string().uuid("Il gruppo selezionato non è valido.");

export const createGroupNodeSchema = z.object({
  sectorId: groupNodeIdSchema,
  parentId: groupNodeIdSchema.nullable(),
  name: groupNameSchema,
});

export const renameGroupNodeSchema = z.object({
  sectorId: groupNodeIdSchema,
  nodeId: groupNodeIdSchema,
  name: groupNameSchema,
});

export const moveGroupNodeSchema = z.object({
  sectorId: groupNodeIdSchema,
  nodeId: groupNodeIdSchema,
  parentId: groupNodeIdSchema.nullable(),
});

export const reorderGroupNodeSchema = z.object({
  sectorId: groupNodeIdSchema,
  nodeId: groupNodeIdSchema,
  direction: z.enum(["up", "down"]),
});

export const archiveGroupNodeSchema = z.object({
  sectorId: groupNodeIdSchema,
  nodeId: groupNodeIdSchema,
  archived: z.boolean(),
});

export const deleteGroupNodeSchema = z.object({
  sectorId: groupNodeIdSchema,
  nodeId: groupNodeIdSchema,
});

export const groupScopeRowSchema = z.object({
  group_id: z.string().uuid(),
});
