import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/promat/AppShell";
import { Metric, PageHeader, ScoreBadge, SectionCard, StatusBadge } from "@/components/promat/ui";
import { usePromat } from "@/lib/promat/store";
import { fmtDate, fmtInt } from "@/lib/promat/calc";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/analyses")({
  head: () => ({
    meta: [
      { title: "Analyses AO — PROMAT" },
      { name: "description", content: "Analyse assistée des appels d'offres : pertinence, risques et décision GO / NO GO." },
      { property: "og:title", content: "Analyses AO — PROMAT" },
      { property: "og:description", content: "Pertinence, risques et recommandations de décision." },
    ],
  }),
  component: AnalysesPage,
});

function AnalysesPage() {
  const promat = usePromat();
  const navigate = useNavigate();
  const aAnalyser = promat.tenders.filter((t) => ["Nouveau", "À analyser", "À décider"].includes(t.statut));

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
        <PageHeader title="Analyses" subtitle="Chaque appel d'offres analysé : pertinence, risques et recommandation de décision." />

        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="À analyser" value={String(promat.tenders.filter((t) => t.statut === "À analyser").length)} />
          <Metric label="À décider" value={String(promat.tenders.filter((t) => t.statut === "À décider").length)} tone="warning" />
          <Metric label="GO" value={String(promat.tenders.filter((t) => t.decision?.type === "GO").length)} tone="success" />
          <Metric label="NO GO" value={String(promat.tenders.filter((t) => t.decision?.type === "NO GO").length)} tone="danger" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {aAnalyser.map((t) => (
            <SectionCard
              key={t.id}
              title={t.ref}
              description={`${t.client} — ${t.objet}`}
              actions={<ScoreBadge score={t.score} />}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Budget" value={`${fmtInt(t.budget)} MAD`} />
                <Metric label="Date limite" value={fmtDate(t.dateLimite)} />
                <Metric label="Risque" value={t.risque} tone={t.risque === "Élevé" ? "danger" : t.risque === "Moyen" ? "warning" : "success"} />
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {t.risques.slice(0, 3).map((r) => (
                  <li key={r.risque} className="rounded-md border border-border px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{r.risque}</span>
                      <StatusBadge>{r.niveau}</StatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.action}</p>
                  </li>
                ))}
              </ul>
              <Button className="mt-3" size="sm" onClick={() => navigate({ to: "/appels-offres/$id", params: { id: t.id } })}>
                Ouvrir l'analyse complète
              </Button>
            </SectionCard>
          ))}
          {!aAnalyser.length ? (
            <SectionCard title="Aucune analyse en attente">
              <p className="text-sm text-muted-foreground">Tous les appels d'offres détectés ont été traités.</p>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
