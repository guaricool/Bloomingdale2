/**
 * Seed the Post table with a few sample posts so the landing page
 * (`/`) has content on first run. Idempotent: only seeds if the table
 * is empty.
 *
 * The first User (admin) is used as the author. If no user exists, the
 * script just logs a hint and exits.
 */
import { getDb, closeDb } from "../lib/db";

interface SamplePost {
  title: string | null;
  body: string;
  pinned: boolean;
}

const SAMPLE: SamplePost[] = [
  {
    pinned: true,
    title: "Bienvenidos a la plataforma de la Rama Bloomingdale 2",
    body: "Queridos hermanos y hermanas: hoy estrenamos este espacio digital para mantenernos unidos como rama. Aquí encontrarán las agendas dominicales, los himnos, el calendario de eventos, y un lugar para compartir noticias y testimonios. ¡Que el Señor bendiga a cada uno de ustedes!",
  },
  {
    pinned: false,
    title: "Conferencia de Estaca — domingo próximo",
    body: "Recordamos a todos los miembros que la Conferencia de Estaca se transmitirá el próximo domingo a las 10:00 AM. Las reuniones sacramentales regulares se reanudarán el domingo siguiente. Favor de llegar con tiempo y traer sus himnarios si gustan.",
  },
  {
    pinned: false,
    title: null,
    body: "Tuvimos una noche familiar increíble. Gracias a las familias que organizaron y a todos los que asistieron. Ya estamos planeando la próxima — si tienen ideas de actividades, compártanlas con la presidencia.",
  },
  {
    pinned: false,
    title: "Servicio comunitario — sábado",
    body: "Este sábado nos reuniremos a las 9:00 AM para el servicio mensual de limpieza en el centro comunitario. Vengan con ropa cómoda y muchas ganas. Habrá refrigerio después.",
  },
];

function main(): void {
  const db = getDb();
  const existing = (db.prepare("SELECT COUNT(*) AS c FROM Post").get() as { c: number }).c;
  if (existing > 0) {
    console.log(`[seed-posts] skip: ${existing} posts already in DB`);
    closeDb();
    return;
  }

  const admin = db
    .prepare("SELECT id FROM User WHERE role = 'admin' ORDER BY id ASC LIMIT 1")
    .get() as { id: number } | undefined;

  if (!admin) {
    console.log(
      "[seed-posts] no admin user found — register the first user via /register, then re-run this script.",
    );
    closeDb();
    return;
  }

  const insert = db.prepare(
    "INSERT INTO Post (authorId, title, body, pinned) VALUES (?, ?, ?, ?)",
  );
  const tx = db.transaction(() => {
    for (const p of SAMPLE) {
      insert.run(admin.id, p.title, p.body, p.pinned ? 1 : 0);
    }
  });
  tx();
  const total = (db.prepare("SELECT COUNT(*) AS c FROM Post").get() as { c: number }).c;
  console.log(`[seed-posts] inserted ${SAMPLE.length}, total: ${total}`);
  closeDb();
}

main();
