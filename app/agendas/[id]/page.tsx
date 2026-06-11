/**
 * `/agendas/[id]` — Public read-only view of one agenda.
 *
 * Anyone signed in can read. The page shows the agenda's items in order
 * with hymn popups (modal-less: hymn title rendered inline with the
 * Spanish title + a "ver letra" link to the churchofjesuschrist.org
 * page in a new tab — we do NOT scrape or duplicate hymn content).
 *
 * Hymn popup behavior: we render a `<details>` element on each hymn row
 * so users can expand to see full title (ES/EN) and an external link
 * to the official lds.org hymn page. The polling refresh in the
 * member-dashboard task will refetch this page in the background.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionForPage } from "@/lib/authz";
import { getAgendaById } from "@/lib/agenda/queries";
import { formatSpanishDate } from "@/lib/agenda/dates";
import { ITEM_TYPE_LABELS } from "@/lib/agenda/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function PublicAgendaView({ params }: PageProps) {
  await requireSessionForPage();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const agenda = await getAgendaById(id);
  if (!agenda) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/agendas" className="hover:text-slate-700">
          ← Agendas
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-900">
        {formatSpanishDate(agenda.date)}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Estado:{" "}
        <span className="font-medium uppercase tracking-wide">
          {agenda.status === "draft"
            ? "Borrador (no publicada aún)"
            : agenda.status === "published"
              ? "Publicada"
              : "Completada"}
        </span>
      </p>

      {agenda.status === "draft" ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Esta agenda aún está en borrador y no debería ser visible para
          miembros. Si la ves por error, avisa a un administrador.
        </div>
      ) : null}

      <ol className="mt-8 space-y-3">
        {agenda.items.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Esta agenda aún no tiene items.
          </li>
        ) : (
          agenda.items.map((item, idx) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <span className="text-sm font-semibold text-slate-400">
                {idx + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
                    {ITEM_TYPE_LABELS[item.type]}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-900">
                  {item.type === "hymn" && item.hymn ? (
                    <details>
                      <summary className="cursor-pointer text-brand-700 underline hover:text-brand-800">
                        Himno {item.hymn.number} — {item.hymn.titleEs}
                      </summary>
                      <div className="mt-2 space-y-1 text-sm text-slate-700">
                        {item.hymn.titleEn ? (
                          <p>
                            <span className="text-xs uppercase tracking-wide text-slate-500">
                              Inglés:
                            </span>{" "}
                            {item.hymn.titleEn}
                          </p>
                        ) : null}
                        <p>
                          <a
                            href={`https://www.churchofjesuschrist.org/study/library/hymns/${item.hymn.number}?lang=spa`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-700 underline hover:text-brand-800"
                          >
                            Ver letra completa (churchofjesuschrist.org) ↗
                          </a>
                        </p>
                      </div>
                    </details>
                  ) : null}
                  {(item.type === "speaker" || item.type === "prayer") && item.member ? (
                    <p>
                      <strong>
                        {item.member.firstName} {item.member.lastName}
                      </strong>
                      {item.type === "prayer" ? (
                        <span className="ml-2 text-xs text-slate-500">
                          (Oración)
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  {item.type === "announcement" && item.event ? (
                    <p>
                      <strong>{item.event.title}</strong>
                      <span className="ml-2 text-xs text-slate-500">
                        ({item.event.type})
                      </span>
                      {item.note ? (
                        <span className="ml-2 text-sm text-slate-700">
                          {item.note}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  {!item.hymn && !item.member && !item.event && item.note ? (
                    <p className="text-sm text-slate-700">{item.note}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
