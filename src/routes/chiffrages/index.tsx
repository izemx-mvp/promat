import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/promat/shell";
import { ModuleTenderList } from "@/components/promat/workflow";
import { fmtMAD } from "@/lib/promat/data";

export const Route = createFileRoute("/chiffrages/")({
  head: () => ({
    meta: [
      { title: "Chiffrages — PROMAT" },
      {
        name: "description",
        content:
          "Calculez le prix de revient réel et le prix de vente PROMAT : frais d'approche éditables, taux de change et simulateur de marge.",
      },
      { property: "og:title", content: "Chiffrages — PROMAT" },
      {
        property: "og:description",
        content: "Prix de revient, marge et prix de vente calculés instantanément.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ModuleTenderList
        title="Chiffrages"
        subtitle="Prix de revient, frais d'approche et marge par dossier."
        to="/chiffrages/$id"
        rows={(t) => (
          <span className="tabular-nums text-muted-foreground">
            Achat {fmtMAD(t.purchaseBase)}
          </span>
        )}
      />
    </AppShell>
  ),
});
