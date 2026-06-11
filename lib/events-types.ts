/**
 * Client-safe event types and constants.
 *
 * The full events module (`lib/events.ts`) imports `getDb` and is
 * server-only. Client components (forms, pickers) need only the type
 * union and the canonical list of values, so we keep those here as a
 * tree-shakable, no-side-effect import target.
 */
export const EVENT_TYPES = [
  "actividad",
  "evento_especial",
  "servicio",
  "reunion",
  "otro",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  actividad: "Actividad",
  evento_especial: "Evento especial",
  servicio: "Servicio",
  reunion: "Reunión",
  otro: "Otro",
};

/** Plain row shape — also exported from server-only `lib/events.ts`. */
export interface EventRow {
  id: number;
  title: string;
  description: string | null;
  eventDate: string;
  type: EventType;
  createdBy: number;
  createdAt: string;
}
