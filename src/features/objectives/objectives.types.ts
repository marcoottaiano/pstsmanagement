import { z } from "zod";

import {
  createObjectiveSchema,
  deleteObjectiveSchema,
  objectiveDatabaseSchema,
  objectiveStatusSchema,
  updateObjectiveSchema,
  updateObjectiveStatusSchema,
} from "./objectives.schemas";

export type ObjectiveStatus = z.infer<typeof objectiveStatusSchema>;
export type ObjectiveRecord = z.infer<typeof objectiveDatabaseSchema>;
export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>;
export type UpdateObjectiveStatusInput = z.infer<typeof updateObjectiveStatusSchema>;
export type DeleteObjectiveInput = z.infer<typeof deleteObjectiveSchema>;

export type Objective = ObjectiveRecord &
  Readonly<{
    groupName: string;
  }>;

export type ObjectiveActionResult = Readonly<{
  error?: string;
  success?: string;
}>;
