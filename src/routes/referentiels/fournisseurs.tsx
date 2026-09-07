import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { ImportDialog } from "@/components/promat/import-dialog";
import { AppShell, PageHeader } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/referentiels/fournisseurs")({
  head: () => ({
    meta: [
      { title: "Référentiel fournisseurs — PROMAT" },
      {
        name: "description",
        content:
          "Annuaire des fournisseurs PROMAT : pays, marques, familles de produits, délai moyen de réponse et score de performance.",
      },
      { property: "og:title", content: "Référentiel fournisseurs — PROMAT" },
      {
        property: "og:description",
        content: "Annuaire fournisseurs avec historique de consultations et prix.",
      },
    ],
  }),
  component: FournisseursPage,
});

type Row = {
  name: string;
  country: string;
  brands: string;
  families: string;
  response: string;
  score: number;
};

const rows: Row[] = [
  {
    name: "FlowTech Germany",
    country: "Allemagne",
    brands: "FlowTech, Endress",
    families: "Instrumentation, débitmétrie",
    response: "3 jours",
    score: 92,
  },
  {
    name: "HydroTech France",
    country: "France",
    brands: "HydroTech, Sofrel",
    families: "Débitmétrie, télégestion",
    response: "5 jours",
    score: 84,
  },
  {
    name: "EuroFlow Turkey",
    country: "Turquie",
    brands: "EuroFlow",
    families: "Débitmétrie, vannes",
    response: "2 jours",
    score: 78,
  },
  {
    name: "MecaFlux Maroc",
    country: "Maroc",
    brands: "MecaFlux, Grove",
    families: "Accessoires mécaniques, levage",
    response: "1 jour",
    score: 81,
  },
  {
    name: "AquaSense Italy",
    country: "Italie",
    brands: "AquaSense",
    families: "Capteurs, instrumentation",
    response: "7 jours",
    score: 66,
  },
];

function FournisseursPage() {
  const [open, setOpen] = useState<Row | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
        <PageHeader
          title="Fournisseurs"
          subtitle="Annuaire PROMAT. Cliquez un fournisseur pour son historique complet."
          action={
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                <Plus className="size-4" /> Ajouter un fournisseur
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Upload className="size-4" /> Importer
              </button>
            </div>
          }
        />
        <SectionCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Fournisseur", "Pays", "Marques", "Familles", "Réponse moy.", "Score"].map(
                    (h) => (
                      <th
                        key={h}
                        className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.name}
                    onClick={() => setOpen(r)}
                    className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/60"
                  >
                    <td className="py-3.5 pr-4 font-medium">{r.name}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{r.country}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{r.brands}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{r.families}</td>
                    <td className="py-3.5 pr-4 tabular-nums">{r.response}</td>
                    <td className="py-3.5">
                      <Pill tone={r.score >= 80 ? "ok" : "warn"}>{r.score} / 100</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importer des fournisseurs"
        subtitle="Fichier Excel ou CSV. Les colonnes reconnues sont associées automatiquement."
        accept=".xlsx,.xls,.csv"
        acceptLabel="Formats acceptés : Excel (.xlsx, .xls) ou CSV"
        columns={["Nom fournisseur", "Contact", "Email", "Téléphone", "Pays", "Marques", "Familles produits", "Devise", "Incoterm"]}
        stats={{ detected: 125, valid: 120, toCheck: 5 }}
        confirmLabel="Importer les fournisseurs"
        onConfirm={() => toast.success("120 fournisseurs importés · 5 lignes à vérifier")}
      />

      <Sheet open={Boolean(open)} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{open?.name}</SheetTitle>
          </SheetHeader>
          {open && (
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              {[
                ["Contact", "commercial@" + open.name.split(" ")[0]!.toLowerCase() + ".com"],
                ["Marques", open.brands],
                ["Familles", open.families],
                ["Devises", "EUR, USD"],
                ["Incoterms", "CIF Casablanca, FOB"],
                ["Genuine / OEM", "Genuine"],
                ["Consultations précédentes", "4 (2023 – 2025)"],
                ["Derniers prix", "4 050 EUR · 2 380 EUR · 780 EUR"],
                ["Délai moyen", "4 semaines"],
                ["Taux de réponse", "86 %"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label-xs">{k}</dt>
                  <dd className="mt-1">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
