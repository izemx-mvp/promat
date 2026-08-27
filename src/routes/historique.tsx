import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/promat/AppShell";
import { Metric, PageHeader, SectionCard } from "@/components/promat/ui";
import { usePromat } from "@/lib/promat/store";
import { fmtDate } from "@/lib/promat/calc";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/historique")({
  head: () => ({
    meta: [
      { title: "Historique — PROMAT" },
      { name: "description", content: "Journal complet des actions PROMAT : qui a fait quoi, quand et quelle valeur a changé." },
      { property: "og:title", content: "Historique — PROMAT" },
      { property: "og:description", content: "Traçabilité intégrale des décisions et modifications." },
    ],
  }),
  component: HistoriquePage,
});

function HistoriquePage() {
  const promat = usePromat();
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      promat.activities.filter((a) =>
        q ? `${a.action} ${a.objet} ${a.utilisateur}`.toLowerCase().includes(q.toLowerCase()) : true,
      ),
    [promat.activities, q],
  );

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
        <PageHeader title="Historique" subtitle="Chaque action est tracée : auteur, date, valeur avant et après." />

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Événements" value={String(promat.activities.length)} />
          <Metric label="Utilisateurs" value={String(new Set(promat.activities.map((a) => a.utilisateur)).size)} />
          <Metric label="Dernière action" value={promat.activities[0] ? fmtDate(promat.activities[0].date) : "—"} />
        </div>

        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une action, un objet, un utilisateur…" className="max-w-md" />

        <SectionCard noPadding>
          <ul className="divide-y divide-border">
            {rows.map((a) => (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.objet}</p>
                  {a.avant || a.apres ? (
                    <p className="num mt-1 text-xs">
                      <span className="text-danger line-through">{a.avant ?? "—"}</span> → <span className="text-success">{a.apres ?? "—"}</span>
                    </p>
                  ) : null}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">{a.utilisateur}</p>
                  <p className="num">{fmtDate(a.date)}</p>
                </div>
              </li>
            ))}
            {!rows.length ? <li className="px-4 py-10 text-center text-sm text-muted-foreground">Aucun événement.</li> : null}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
