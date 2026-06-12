/**
 * Ven, sígueme — lógica de selección de lección.
 *
 * La lección que se muestra depende ÚNICAMENTE de la fecha actual:
 *   - Cada lección cubre una semana (lunes startDate → domingo endDate).
 *   - Al pasar el domingo (endDate), la siguiente lección toma el relevo
 *     el lunes siguiente (que es el startDate de la próxima).
 *
 * No hay BD ni admin: las 52 lecciones son estáticas (curriculum oficial
 * de la Iglesia). Solo calculamos cuál corresponde a "hoy".
 *
 * Ejemplo:
 *   hoy = martes 2026-06-09  → lección semana 8–14 junio (lessonNumber 24)
 *   hoy = domingo 2026-06-14 → misma lección 24 (último día de la semana)
 *   hoy = lunes 2026-06-15   → cambia a lección 15–21 junio (lessonNumber 25)
 */
import {
  COME_FOLLOW_ME_2026,
  COME_FOLLOW_ME_BASE_URL,
  type ComeFollowMeLesson,
} from "@/db/come-follow-me-data";
import { todayIso } from "@/lib/agenda/dates";

/** La lección "de esta semana" según la fecha dada (default: hoy). */
export function getCurrentLesson(
  dateIso: string = todayIso(),
): ComeFollowMeLesson | null {
  // startDate <= hoy <= endDate
  const match = COME_FOLLOW_ME_2026.find(
    (l) => l.startDate <= dateIso && dateIso <= l.endDate,
  );
  if (match) return match;

  // Fuera del rango del curriculum (antes del 29-dic-2025 o después del
  // 27-dic-2026). Mostramos la primera o la última como fallback razonable.
  const first = COME_FOLLOW_ME_2026[0];
  const last = COME_FOLLOW_ME_2026[COME_FOLLOW_ME_2026.length - 1];
  if (first && dateIso < first.startDate) return first;
  if (last && dateIso > last.endDate) return last;
  return null;
}

/** La lección siguiente a la dada (o null si es la última). */
export function getNextLesson(
  current: ComeFollowMeLesson,
): ComeFollowMeLesson | null {
  const idx = COME_FOLLOW_ME_2026.findIndex(
    (l) => l.lessonNumber === current.lessonNumber,
  );
  if (idx === -1 || idx + 1 >= COME_FOLLOW_ME_2026.length) return null;
  return COME_FOLLOW_ME_2026[idx + 1] ?? null;
}

/** URL completa del manual para una lección. */
export function lessonUrl(lesson: ComeFollowMeLesson): string {
  return `${COME_FOLLOW_ME_BASE_URL}/${lesson.urlSlug}?lang=spa`;
}

export type { ComeFollowMeLesson };
