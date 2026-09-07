import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/promat/shell";
import { ModuleTenderList } from "@/components/promat/workflow";

export const Route = createFileRoute("/analyses/")({
  head: () => ({
    meta: [
      { title: "Analyses des appels d'offres — PROMAT" },
      {
        name: "description",
        content:
          "Résumés IA, points à vérifier et éligibilité : l'Agent AO analyse chaque appel d'offres pour préparer la décision GO / NO GO.",
      },
      { property: "og:title", content: "Analyses des appels d'offres — PROMAT" },
      {
        property: "og:description",
        content: "Analyse assistée par IA des dossiers d'appels d'offres PROMAT.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ModuleTenderList
        title="Analyses"
        subtitle="Sélectionnez un dossier pour lire le résumé de l'Agent et décider GO / NO GO."
        to="/analyses/$id"
        rows={(t) => <span className="tabular-nums text-ai">{t.score} % pertinence</span>}
      />
    </AppShell>
  ),
});
