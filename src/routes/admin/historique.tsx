import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { usePromat } from "@/lib/promat/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/historique")({
  head: () => ({
    meta: [
      { title: "Historique & traçabilité — PROMAT" },
      {
        name: "description",
        content:
          "Journal complet des actions PROMAT : décisions GO/NO GO, validations d'articles, consultations, chiffrages, marges et offres validées.",
      },
      { property: "og:title", content: "Historique & traçabilité — PROMAT" },
      {
        property: "og:description",
        content: "Qui a fait quoi, quand, sur quel dossier.",
      },
    ],
  }),
  component: HistoriquePage,
});

const seed = [
  { time: "Aujourd'hui 10:04", who: "Houda Bennani", action: "Analyse consultée", tender: "ONEE – AO 24/DRC/CI/2026", module: "Analyse" },
  { time: "Aujourd'hui 09:41", who: "Yassine El Mansouri", action: "Décision GO validée", tender: "ONEE – AO 24/DRC/CI/2026", module: "Décision" },
  { time: "Hier 17:40", who: "Salma Cherkaoui", action: "Consultation RFQ-2026-0048 créée", tender: "ONEE – AO 24/DRC/CI/2026", module: "Consultation" },
  { time: "Hier 16:02", who: "Omar Idrissi", action: "Marge fixée à 20 %", tender: "Marsa Maroc – AO 08/MM/2026", module: "Chiffrage" },
  { time: "Hier 11:15", who: "Nadia Alaoui", action: "Offre finale validée", tender: "Marsa Maroc – AO 08/MM/2026", module: "Offre" },
  { time: "05/09/2026 14:20", who: "Yassine El Mansouri", action: "Dossier classé NO GO — Prix non compétitif", tender: "OCP Group – AO 112/OCP/2026", module: "Décision" },
];

const modules = ["Tous", "Analyse", "Décision", "Consultation", "Chiffrage", "Offre"];

function HistoriquePage() {
  const { log } = usePromat();
  const [mod, setMod] = useState("Tous");
  const rows = [...log, ...seed];
  const list = mod === "Tous" ? rows : rows.filter((r) => r.module === mod);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 px-8 py-8">
        <PageHeader
          title="Historique"
          subtitle="Traçabilité des décisions et validations sur chaque dossier."
        />

        <div className="flex flex-wrap gap-1.5">
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setMod(m)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                mod === m
                  ? "bg-navy text-navy-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent",
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <SectionCard>
          <ol className="relative space-y-5 border-l border-border pl-6">
            {list.map((r, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1.5 size-2.5 rounded-full border-2 border-card bg-primary" />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{r.action}</p>
                  <Pill>{r.module}</Pill>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.who} · {r.tender} · {r.time}
                </p>
              </li>
            ))}
            {list.length === 0 && (
              <li className="text-sm text-muted-foreground">Aucune action dans ce filtre.</li>
            )}
          </ol>
        </SectionCard>
      </div>
    </AppShell>
  );
}
