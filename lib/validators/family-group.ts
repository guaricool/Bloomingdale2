/**
 * Zod validators for the FamilyGroup module.
 *
 * Shared between server actions, API routes, and react-hook-form.
 * All error messages are in es-MX Spanish.
 */
import { z } from "zod";

export const familyGroupBaseSchema = z.object({
  name: z
    .string({ required_error: "El nombre del grupo es requerido" })
    .trim()
    .min(1, "El nombre del grupo es requerido")
    .max(120, "El nombre no puede tener más de 120 caracteres"),
  headMemberId: z
    .union([z.number().int().positive(), z.null()])
    .optional()
    .transform((v) => (typeof v === "number" ? v : null)),
});

export const familyGroupCreateSchema = familyGroupBaseSchema;

export const familyGroupUpdateSchema = familyGroupBaseSchema.extend({
  id: z.number().int().positive(),
});

export type FamilyGroupCreateInput = z.infer<typeof familyGroupCreateSchema>;
export type FamilyGroupUpdateInput = z.infer<typeof familyGroupUpdateSchema>;
