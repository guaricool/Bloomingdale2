/**
 * Zod validation schemas for the agendas module.
 *
 * Used by both the API routes (server-side) and forms (client-side, via
 * importing the same schema). Keep these in lockstep with the DB layer.
 */
import { z } from "zod";

// --- Hymn schemas ---------------------------------------------------------

export const hymnNumberSchema = z
  .number()
  .int("El número de himno debe ser entero")
  .min(1, "El número de himno mínimo es 1")
  .max(341, "El número de himno máximo es 341");

// --- Member schemas (used by /api/miembros/rapido too, but defined here
//     for the speaker picker flow inside the agenda editor). --------------

export const createMemberSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido").max(80),
  lastName: z.string().min(1, "El apellido es requerido").max(80),
  membershipNumber: z.string().max(80).optional().nullable(),
  familyGroupId: z.number().int().positive().optional().nullable(),
});

// --- Agenda schemas -------------------------------------------------------

/** `YYYY-MM-DD` (no time component). */
export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD");

export const agendaStatusSchema = z.enum(["draft", "published", "completed"]);

export const createAgendaSchema = z.object({
  date: dateOnlySchema,
});

export const updateAgendaSchema = z.object({
  date: dateOnlySchema.optional(),
  status: agendaStatusSchema.optional(),
});

// --- AgendaItem schemas ---------------------------------------------------

export const agendaItemTypeSchema = z.enum([
  "hymn",
  "speaker",
  "prayer",
  "announcement",
  "business_rama",
  "business_estaca",
  "sacrament",
  "other",
  "hymn_opening",
  "prayer_opening",
  "sacrament_hymn",
  "hymn_closing",
  "prayer_closing",
]);

export const createAgendaItemSchema = z.object({
  type: agendaItemTypeSchema,
  /** Polymorphic ref. hymn.number for hymns, member.id for speakers/prayers, event.id for announcements, null for plain text. */
  refId: z.number().int().positive().nullable().optional().default(null),
  note: z.string().max(2000).nullable().optional().default(null),
  /**
   * Optional explicit `order`. If omitted, the item is appended at the end
   * of the agenda (max(order) + 1).
   */
  order: z.number().int().min(0).optional(),
});

export const updateAgendaItemSchema = z.object({
  type: agendaItemTypeSchema.optional(),
  refId: z.number().int().positive().nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  order: z.number().int().min(0).optional(),
});

export const reorderAgendaItemsSchema = z.object({
  /**
   * Array of {id, order}. Server validates the id belongs to the agenda.
   * Order values do not need to be contiguous; we use the array's array as
   * a tie-breaker (lower index wins).
   */
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        order: z.number().int().min(0),
      }),
    )
    .min(1, "Se requiere al menos un item"),
});

// --- List filters (GET /api/agendas) --------------------------------------

export const listAgendasQuerySchema = z.object({
  status: agendaStatusSchema.optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  /** 'upcoming' = date >= today, 'past' = date < today. Overrides from/to. */
  range: z.enum(["upcoming", "past", "all"]).optional().default("all"),
});

// --- Hymn search ----------------------------------------------------------

export const hymnSearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});
