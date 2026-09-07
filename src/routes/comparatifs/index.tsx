import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/promat/shell";
import { ModuleTenderList } from "@/components/promat/workflow";

export const Route = createFileRoute("/comparatifs/")({
  head: () => ({
    meta: [
      { title: "Comparatifs fournisseurs — PROMAT" },
      {
        name: "description",
        content:
          "Comparez les offres fournisseurs article par article : prix, Genuine/OEM, délai et conformité, avec la recommandation de l'Agent Chiffrage.",
      },
      { property: "og:title", content: "Comparatifs fournisseurs — PROMAT" },
      {
        property: "og:description",
        content: "Comparaison lisible des offres reçues et choix du fournisseur retenu.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ModuleTenderList
        title="Comparatifs fournisseurs"
        subtitle="Comparez les offres reçues et retenez un fournisseur."
        to="/comparatifs/$id"
        rows={(t, s) => (
          <span className="text-muted-foreground">
            {s.retainedSupplier
              ? `Retenu : ${t.suppliers.find((x) => x.id === s.retainedSupplier)?.name}`
              : "À comparer"}
          </span>
        )}
      />
    </AppShell>
  ),
});
