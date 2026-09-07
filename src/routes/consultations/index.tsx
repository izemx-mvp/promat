import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/promat/shell";
import { ModuleTenderList } from "@/components/promat/workflow";

export const Route = createFileRoute("/consultations/")({
  head: () => ({
    meta: [
      { title: "Consultations fournisseurs — PROMAT" },
      {
        name: "description",
        content:
          "Sélectionnez les fournisseurs recommandés, créez la demande de prix et suivez les réponses reçues dossier par dossier.",
      },
      { property: "og:title", content: "Consultations fournisseurs — PROMAT" },
      {
        property: "og:description",
        content: "Recommandations fournisseurs, RFQ et suivi des réponses au même endroit.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ModuleTenderList
        title="Consultations fournisseurs"
        subtitle="Fournisseurs recommandés, demandes de prix et suivi des réponses."
        to="/consultations/$id"
        rows={(t, s) => (
          <span className="text-muted-foreground">
            {s.selectedSuppliers.length} fournisseur(s) · {t.suppliers.length} recommandés
          </span>
        )}
      />
    </AppShell>
  ),
});
