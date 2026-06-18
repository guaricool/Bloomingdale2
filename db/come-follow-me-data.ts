/**
 * Ven, sígueme — Para el hogar y la Iglesia: Antiguo Testamento 2026
 *
 * Datos extraídos del manual oficial:
 * https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-old-testament-2026?lang=spa
 *
 * Cada lección cubre una semana (lunes a domingo). El campo `lessonNumber`
 * corresponde al número de lección en la URL del manual (ej. /02, /03...).
 *
 * NOTA: Las semanas "Ideas a tener presentes" (XX-thoughts) y los materiales
 * de introducción NO se incluyen aquí — son material de estudio, no lecciones
 * semanales con fecha. Solo incluimos las 52 lecciones fechadas.
 *
 * Auto-generado. Para regenerar cuando cambie el año, ver scripts/come-follow-me-fetch.ts
 */

export interface ComeFollowMeLesson {
  /** Número de lección en la URL del manual (01-52) */
  lessonNumber: number;
  /** Lunes de la semana — YYYY-MM-DD */
  startDate: string;
  /** Domingo de la semana — YYYY-MM-DD */
  endDate: string;
  /** Rango legible en español, ej. "5 – 11 enero" */
  dateRange: string;
  /** Tema / referencia de escritura, ej. "Moisés 1; Abraham 3" */
  title: string;
  /** Slug de la URL del manual */
  urlSlug: string;
}

/** El año del curriculum actual. */
export const COME_FOLLOW_ME_YEAR = 2026;

/** Base URL del manual (sin el slug de lección). */
export const COME_FOLLOW_ME_BASE_URL =
  "https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-old-testament-2026";

/**
 * Las 52 lecciones del Antiguo Testamento 2026.
 * startDate = lunes, endDate = domingo.
 */
export const COME_FOLLOW_ME_2026: ComeFollowMeLesson[] = [
  {
    lessonNumber: 1,
    startDate: "2025-12-29",
    endDate: "2026-01-04",
    dateRange: "29 diciembre – 4 enero",
    title: "Introducción al Antiguo Testamento",
    urlSlug: "01",
  },
  {
    lessonNumber: 2,
    startDate: "2026-01-05",
    endDate: "2026-01-11",
    dateRange: "5 – 11 enero",
    title: "Moisés 1; Abraham 3",
    urlSlug: "02",
  },
  {
    lessonNumber: 3,
    startDate: "2026-01-12",
    endDate: "2026-01-18",
    dateRange: "12 – 18 enero",
    title: "Génesis 1–2; Moisés 2–3; Abraham 4–5",
    urlSlug: "03",
  },
  {
    lessonNumber: 4,
    startDate: "2026-01-19",
    endDate: "2026-01-25",
    dateRange: "19 – 25 enero",
    title: "Génesis 3–4; Moisés 4–5",
    urlSlug: "04",
  },
  {
    lessonNumber: 5,
    startDate: "2026-01-26",
    endDate: "2026-02-01",
    dateRange: "26 enero – 1 febrero",
    title: "Génesis 5; Moisés 6",
    urlSlug: "05",
  },
  {
    lessonNumber: 6,
    startDate: "2026-02-02",
    endDate: "2026-02-08",
    dateRange: "2 – 8 febrero",
    title: "Moisés 7",
    urlSlug: "06",
  },
  {
    lessonNumber: 7,
    startDate: "2026-02-09",
    endDate: "2026-02-15",
    dateRange: "9 – 15 febrero",
    title: "Génesis 6–11; Moisés 8",
    urlSlug: "07",
  },
  {
    lessonNumber: 8,
    startDate: "2026-02-16",
    endDate: "2026-02-22",
    dateRange: "16 – 22 febrero",
    title: "Génesis 12–17; Abraham 1–2",
    urlSlug: "08",
  },
  {
    lessonNumber: 9,
    startDate: "2026-02-23",
    endDate: "2026-03-01",
    dateRange: "23 febrero – 1 marzo",
    title: "Génesis 18–23",
    urlSlug: "09",
  },
  {
    lessonNumber: 10,
    startDate: "2026-03-02",
    endDate: "2026-03-08",
    dateRange: "2 – 8 marzo",
    title: "Génesis 24–33",
    urlSlug: "10",
  },
  {
    lessonNumber: 11,
    startDate: "2026-03-09",
    endDate: "2026-03-15",
    dateRange: "9 – 15 marzo",
    title: "Génesis 37–41",
    urlSlug: "11",
  },
  {
    lessonNumber: 12,
    startDate: "2026-03-16",
    endDate: "2026-03-22",
    dateRange: "16 – 22 marzo",
    title: "Génesis 42–50",
    urlSlug: "12",
  },
  {
    lessonNumber: 13,
    startDate: "2026-03-23",
    endDate: "2026-03-29",
    dateRange: "23 – 29 marzo",
    title: "Éxodo 1–6",
    urlSlug: "13",
  },
  {
    lessonNumber: 14,
    startDate: "2026-03-30",
    endDate: "2026-04-05",
    dateRange: "30 marzo – 5 abril",
    title: "Pascua de Resurrección",
    urlSlug: "14",
  },
  {
    lessonNumber: 15,
    startDate: "2026-04-06",
    endDate: "2026-04-12",
    dateRange: "6 – 12 abril",
    title: "Éxodo 7–13",
    urlSlug: "15",
  },
  {
    lessonNumber: 16,
    startDate: "2026-04-13",
    endDate: "2026-04-19",
    dateRange: "13 – 19 abril",
    title: "Éxodo 14–18",
    urlSlug: "16",
  },
  {
    lessonNumber: 17,
    startDate: "2026-04-20",
    endDate: "2026-04-26",
    dateRange: "20 – 26 abril",
    title: "Éxodo 19–20; 24; 31–34",
    urlSlug: "17",
  },
  {
    lessonNumber: 18,
    startDate: "2026-04-27",
    endDate: "2026-05-03",
    dateRange: "27 abril – 3 mayo",
    title: "Éxodo 35–40; Levítico 1; 4; 16; 19",
    urlSlug: "18",
  },
  {
    lessonNumber: 19,
    startDate: "2026-05-04",
    endDate: "2026-05-10",
    dateRange: "4 – 10 mayo",
    title: "Números 11–14; 20–24; 27",
    urlSlug: "19",
  },
  {
    lessonNumber: 20,
    startDate: "2026-05-11",
    endDate: "2026-05-17",
    dateRange: "11 – 17 mayo",
    title: "Deuteronomio 6–8; 15; 18; 29–30; 34",
    urlSlug: "20",
  },
  {
    lessonNumber: 21,
    startDate: "2026-05-18",
    endDate: "2026-05-24",
    dateRange: "18 – 24 mayo",
    title: "Josué 1–8; 23–24",
    urlSlug: "21",
  },
  {
    lessonNumber: 22,
    startDate: "2026-05-25",
    endDate: "2026-05-31",
    dateRange: "25 – 31 mayo",
    title: "Jueces 2–4; 6–8; 13–16",
    urlSlug: "22",
  },
  {
    lessonNumber: 23,
    startDate: "2026-06-01",
    endDate: "2026-06-07",
    dateRange: "1 – 7 junio",
    title: "Rut; 1 Samuel 1–7",
    urlSlug: "23",
  },
  {
    lessonNumber: 24,
    startDate: "2026-06-08",
    endDate: "2026-06-14",
    dateRange: "8 – 14 junio",
    title: "1 Samuel 8–10; 13; 15–16",
    urlSlug: "24",
  },
  {
    lessonNumber: 25,
    startDate: "2026-06-15",
    endDate: "2026-06-21",
    dateRange: "15 – 21 junio",
    title: "1 Samuel 17–18, 24–26; 2 Samuel 5–7",
    urlSlug: "25",
  },
  {
    lessonNumber: 26,
    startDate: "2026-06-22",
    endDate: "2026-06-28",
    dateRange: "22 – 28 junio",
    title: "2 Samuel 11–12; 1 Reyes 3; 6–9; 11",
    urlSlug: "26",
  },
  {
    lessonNumber: 27,
    startDate: "2026-06-29",
    endDate: "2026-07-05",
    dateRange: "29 junio – 5 julio",
    title: "1 Reyes 12–13; 17–22",
    urlSlug: "27",
  },
  {
    lessonNumber: 28,
    startDate: "2026-07-06",
    endDate: "2026-07-12",
    dateRange: "6 – 12 julio",
    title: "2 Reyes 2–7",
    urlSlug: "28",
  },
  {
    lessonNumber: 29,
    startDate: "2026-07-13",
    endDate: "2026-07-19",
    dateRange: "13 – 19 julio",
    title: "2 Reyes 16–25",
    urlSlug: "29",
  },
  {
    lessonNumber: 30,
    startDate: "2026-07-20",
    endDate: "2026-07-26",
    dateRange: "20 – 26 julio",
    title: "2 Crónicas 14–20; 26; 30",
    urlSlug: "30",
  },
  {
    lessonNumber: 31,
    startDate: "2026-07-27",
    endDate: "2026-08-02",
    dateRange: "27 julio – 2 agosto",
    title: "Esdras 1; 3–7; Nehemías 2; 4–6; 8",
    urlSlug: "31",
  },
  {
    lessonNumber: 32,
    startDate: "2026-08-03",
    endDate: "2026-08-09",
    dateRange: "3 – 9 agosto",
    title: "Ester",
    urlSlug: "32",
  },
  {
    lessonNumber: 33,
    startDate: "2026-08-10",
    endDate: "2026-08-16",
    dateRange: "10 – 16 agosto",
    title: "Job 1–3; 12–14; 19; 21–24; 38–40; 42",
    urlSlug: "33",
  },
  {
    lessonNumber: 34,
    startDate: "2026-08-17",
    endDate: "2026-08-23",
    dateRange: "17 – 23 agosto",
    title: "Salmos 1–2; 8; 19–33; 40; 46",
    urlSlug: "34",
  },
  {
    lessonNumber: 35,
    startDate: "2026-08-24",
    endDate: "2026-08-30",
    dateRange: "24 – 30 agosto",
    title: "Salmos 49–51; 61–66; 69–72; 77–78; 85–86",
    urlSlug: "35",
  },
  {
    lessonNumber: 36,
    startDate: "2026-08-31",
    endDate: "2026-09-06",
    dateRange: "31 agosto – 6 septiembre",
    title: "Salmos 102–103; 110; 116–119; 127–128; 135–139; 146–150",
    urlSlug: "36",
  },
  {
    lessonNumber: 37,
    startDate: "2026-09-07",
    endDate: "2026-09-13",
    dateRange: "7 – 13 septiembre",
    title: "Proverbios 1–4; 15–16; 22; 31; Eclesiastés 1–3; 11–12",
    urlSlug: "37",
  },
  {
    lessonNumber: 38,
    startDate: "2026-09-14",
    endDate: "2026-09-20",
    dateRange: "14 – 20 septiembre",
    title: "Isaías 1–12",
    urlSlug: "38",
  },
  {
    lessonNumber: 39,
    startDate: "2026-09-21",
    endDate: "2026-09-27",
    dateRange: "21 – 27 septiembre",
    title: "Isaías 13–14; 22; 24–30; 35",
    urlSlug: "39",
  },
  {
    lessonNumber: 40,
    startDate: "2026-09-28",
    endDate: "2026-10-04",
    dateRange: "28 septiembre – 4 octubre",
    title: "Isaías 40–49",
    urlSlug: "40",
  },
  {
    lessonNumber: 41,
    startDate: "2026-10-05",
    endDate: "2026-10-11",
    dateRange: "5 – 11 octubre",
    title: "Isaías 50–57",
    urlSlug: "41",
  },
  {
    lessonNumber: 42,
    startDate: "2026-10-12",
    endDate: "2026-10-18",
    dateRange: "12 – 18 octubre",
    title: "Isaías 58–66",
    urlSlug: "42",
  },
  {
    lessonNumber: 43,
    startDate: "2026-10-19",
    endDate: "2026-10-25",
    dateRange: "19 – 25 octubre",
    title: "Jeremías 1–3; 7; 16–18; 20",
    urlSlug: "43",
  },
  {
    lessonNumber: 44,
    startDate: "2026-10-26",
    endDate: "2026-11-01",
    dateRange: "26 octubre – 1 noviembre",
    title: "Jeremías 31–33; 36–38; Lamentaciones 1; 3",
    urlSlug: "44",
  },
  {
    lessonNumber: 45,
    startDate: "2026-11-02",
    endDate: "2026-11-08",
    dateRange: "2 – 8 noviembre",
    title: "Ezequiel 1–3; 33–34; 36–37; 47",
    urlSlug: "45",
  },
  {
    lessonNumber: 46,
    startDate: "2026-11-09",
    endDate: "2026-11-15",
    dateRange: "9 – 15 noviembre",
    title: "Daniel 1–7",
    urlSlug: "46",
  },
  {
    lessonNumber: 47,
    startDate: "2026-11-16",
    endDate: "2026-11-22",
    dateRange: "16 – 22 noviembre",
    title: "Oseas 1–6; 10–14; Joel",
    urlSlug: "47",
  },
  {
    lessonNumber: 48,
    startDate: "2026-11-23",
    endDate: "2026-11-29",
    dateRange: "23 – 29 noviembre",
    title: "Amós; Abdías; Jonás",
    urlSlug: "48",
  },
  {
    lessonNumber: 49,
    startDate: "2026-11-30",
    endDate: "2026-12-06",
    dateRange: "30 noviembre – 6 diciembre",
    title: "Miqueas; Nahúm; Habacuc; Sofonías",
    urlSlug: "49",
  },
  {
    lessonNumber: 50,
    startDate: "2026-12-07",
    endDate: "2026-12-13",
    dateRange: "7 – 13 diciembre",
    title: "Hageo 1–2; Zacarías 1–4; 7–14",
    urlSlug: "50",
  },
  {
    lessonNumber: 51,
    startDate: "2026-12-14",
    endDate: "2026-12-20",
    dateRange: "14 – 20 diciembre",
    title: "Malaquías",
    urlSlug: "51",
  },
  {
    lessonNumber: 52,
    startDate: "2026-12-21",
    endDate: "2026-12-27",
    dateRange: "21 – 27 diciembre",
    title: "Navidad",
    urlSlug: "52",
  },
];
