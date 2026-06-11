/**
 * Zod validators for the Member module.
 *
 * Shared between server actions, API routes, and react-hook-form
 * (via @hookform/resolvers/zod) so the same rules apply everywhere.
 *
 * Conventions:
 *  - firstName / lastName required, trimmed, max 80 chars
 *  - membershipNumber optional; if present, must be digits only (max 20)
 *  - familyGroupId optional; if present, must be a positive integer
 *
 * All error messages are in es-MX Spanish.
 */
import { z } from "zod";

const trimmed = (label: string, max: number) =>
  z
    .string({ required_error: `El ${label} es requerido` })
    .trim()
    .min(1, `El ${label} es requerido`)
    .max(max, `El ${label} no puede tener más de ${max} caracteres`);

export const memberBaseSchema = z.object({
  firstName: trimmed("nombre", 80),
  lastName: trimmed("apellido", 80),
  membershipNumber: z
    .string()
    .trim()
    .max(20, "El número de miembro no puede tener más de 20 caracteres")
    .regex(/^[0-9]*$/, "El número de miembro solo puede contener dígitos")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null)),
  familyGroupId: z
    .union([z.number().int().positive(), z.null()])
    .optional()
    .transform((v) => (typeof v === "number" ? v : null)),
});

export const memberCreateSchema = memberBaseSchema;

export const memberUpdateSchema = memberBaseSchema.extend({
  id: z.number().int().positive(),
});

export const memberQuickCreateSchema = z.object({
  firstName: trimmed("nombre", 80),
  lastName: trimmed("apellido", 80),
  membershipNumber: z
    .string()
    .trim()
    .max(20, "El número de miembro no puede tener más de 20 caracteres")
    .regex(/^[0-9]*$/, "El número de miembro solo puede contener dígitos")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type MemberCreateInput = z.infer<typeof memberCreateSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
export type MemberQuickCreateInput = z.infer<typeof memberQuickCreateSchema>;
