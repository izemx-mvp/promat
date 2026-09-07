import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Search } from "lucide-react";
import { AppShell, PageHeader } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/referentiels/documents")({
  head: () => ({
    meta: [
      { title: "Bibliothèque documents — PROMAT" },
      {
        name: "description",
        content:
          "Bibliothèque documentaire PROMAT : dossiers d'appel d'offres, documents techniques et administratifs, devis fournisseurs et offres finales.",
      },
      { property: "og:title", content: "Bibliothèque documents — PROMAT" },
      {
        property: "og:description",
        content: "Tous les documents liés à un dossier, un fournisseur ou une offre.",
      },
    ],
  }),
  component: DocumentsPage,
});

const categories = [
  "Tous",
  "Appels d'offres",
  "Documents techniques",
  "Documents administratifs",
  "Devis fournisseurs",
  "Offres finales",
];

const docs = [
  { name: "CPS – AO 24/DRC/CI/2026.pdf", cat: "Appels d'offres", link: "ONEE – AO 24/DRC/CI/2026", date: "12/06/2026" },
  { name: "Bordereau des prix ONEE.xlsx", cat: "Appels d'offres", link: "ONEE – AO 24/DRC/CI/2026", date: "12/06/2026" },
  { name: "Fiche technique FlowTech DN600.pdf", cat: "Documents techniques", link: "FlowTech Germany", date: "18/06/2026" },
  { name: "Certificat étalonnage usine.pdf", cat: "Documents techniques", link: "Article PRM-DEB-600", date: "20/06/2026" },
  { name: "Attestation fiscale PROMAT.pdf", cat: "Documents administratifs", link: "PROMAT Maroc", date: "02/01/2026" },
  { name: "Devis HydroTech RFQ-2026-0048.pdf", cat: "Devis fournisseurs", link: "HydroTech France", date: "28/06/2026" },
  { name: "Offre ONEE v2.pdf", cat: "Offres finales", link: "ONEE – AO 24/DRC/CI/2026", date: "01/07/2026" },
];

function DocumentsPage() {
  const [cat, setCat] = useState("Tous");
  const [q, setQ] = useState("");
  const list = docs.filter(
    (d) =>
      (cat === "Tous" || d.cat === cat) && d.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
        <PageHeader
          title="Documents"
          subtitle="Chaque document reste rattaché à un dossier, un fournisseur, un article ou une offre."
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un document…"
              className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-ring"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                  cat === c
                    ? "bg-navy text-navy-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <SectionCard>
          <div className="divide-y divide-border">
            {list.map((d) => (
              <div key={d.name} className="flex items-center justify-between gap-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">Lié à : {d.link}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Pill>{d.cat}</Pill>
                  <span className="text-xs tabular-nums text-muted-foreground">{d.date}</span>
                </div>
              </div>
            ))}
            {list.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucun document.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
