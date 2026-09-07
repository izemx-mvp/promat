import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";

export const Route = createFileRoute("/referentiels/articles")({
  head: () => ({
    meta: [
      { title: "Référentiel articles — PROMAT" },
      {
        name: "description",
        content:
          "Base articles PROMAT : références fabricant, familles, fournisseurs connus, dernier prix d'achat et alertes de variation de prix.",
      },
      { property: "og:title", content: "Référentiel articles — PROMAT" },
      {
        property: "og:description",
        content: "Historique des prix d'achat et alertes de variation détectées par l'IA.",
      },
    ],
  }),
  component: ArticlesRefPage,
});

const rows = [
  {
    ref: "PRM-DEB-600",
    mfr: "FT-EM600-PN25",
    designation: "Débitmètre électromagnétique DN600",
    brand: "FlowTech",
    family: "Débitmétrie",
    suppliers: "FlowTech, HydroTech",
    last: "4 050 EUR",
    date: "11/2025",
    tenders: "ONEE 2024, ONEE 2026",
    variation: 11.1,
  },
  {
    ref: "PRM-DEB-400",
    mfr: "HT-EM400",
    designation: "Débitmètre électromagnétique DN400",
    brand: "HydroTech",
    family: "Débitmétrie",
    suppliers: "HydroTech, EuroFlow",
    last: "2 380 EUR",
    date: "06/2025",
    tenders: "ONEE 2023",
    variation: -4.2,
  },
  {
    ref: "PRM-CVT-001",
    mfr: "FT-CVT-RTU",
    designation: "Convertisseur de mesure déporté",
    brand: "FlowTech",
    family: "Instrumentation",
    suppliers: "FlowTech",
    last: "780 EUR",
    date: "11/2025",
    tenders: "ONEE 2024",
    variation: 3.8,
  },
  {
    ref: "PRM-MAN-600",
    mfr: "MF-MAN600",
    designation: "Manchettes de raccordement DN600",
    brand: "MecaFlux",
    family: "Accessoires",
    suppliers: "MecaFlux",
    last: "620 EUR",
    date: "03/2025",
    tenders: "ONCF 2024",
    variation: 0,
  },
];

function ArticlesRefPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
        <PageHeader
          title="Articles"
          subtitle="Historique des références PROMAT et alertes de variation de prix."
        />

        <SectionCard className="border-warning/30 bg-warning-soft/50">
          <p className="text-sm font-medium text-warning">Alerte prix — Débitmètre DN600</p>
          <p className="mt-1 text-sm text-warning">
            Dernier prix 4 050 EUR · nouvelle offre 4 500 EUR · variation + 11,1 %
          </p>
        </SectionCard>

        <SectionCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {[
                    "Réf. PROMAT",
                    "Réf. fabricant",
                    "Désignation",
                    "Marque",
                    "Famille",
                    "Fournisseurs",
                    "Dernier prix",
                    "Variation",
                  ].map((h) => (
                    <th
                      key={h}
                      className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.ref} className="border-b border-border/60 last:border-0">
                    <td className="py-3.5 pr-4 tabular-nums text-muted-foreground">{r.ref}</td>
                    <td className="py-3.5 pr-4 tabular-nums text-muted-foreground">{r.mfr}</td>
                    <td className="py-3.5 pr-4 font-medium">{r.designation}</td>
                    <td className="py-3.5 pr-4">{r.brand}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{r.family}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{r.suppliers}</td>
                    <td className="py-3.5 pr-4 tabular-nums">
                      {r.last}
                      <span className="block text-xs text-muted-foreground">{r.date}</span>
                    </td>
                    <td className="py-3.5">
                      <Pill tone={r.variation > 5 ? "warn" : r.variation < 0 ? "ok" : "neutral"}>
                        {r.variation > 0 ? "+" : ""}
                        {r.variation.toLocaleString("fr-FR", { minimumFractionDigits: 1 })} %
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
