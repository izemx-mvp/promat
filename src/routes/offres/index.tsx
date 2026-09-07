import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/promat/shell";
import { ModuleTenderList } from "@/components/promat/workflow";

export const Route = createFileRoute("/offres/")({
  head: () => ({
    meta: [
      { title: "Offres finales — PROMAT" },
      {
        name: "description",
        content:
          "Générez l'offre commerciale finale PROMAT : vue interne avec marges et vue client sans données internes, export Excel et PDF.",
      },
      { property: "og:title", content: "Offres finales — PROMAT" },
      {
        property: "og:description",
        content: "Vue interne et vue client de l'offre, checklist de dépôt et exports.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ModuleTenderList
        title="Offres finales"
        subtitle="Préparez et validez l'offre à déposer chez le client."
        to="/offres/$id"
        rows={(_t, s) => (
          <span className="text-muted-foreground">
            {s.offerValidated ? "Prête à déposer" : "En préparation"}
          </span>
        )}
      />
    </AppShell>
  ),
});
