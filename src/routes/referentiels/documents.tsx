import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { ImportDialog } from "@/components/promat/import-dialog";
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
  const [importOpen, setImportOpen] = useState(false);
  const [docType, setDocType] = useState("Appel d'offres");
  const [linkTo, setLinkTo] = useState("ONEE – AO 24/DRC/CI/2026");
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
          action={
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Upload className="size-4" /> Importer des documents
            </button>
          }
        />

        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importer des documents"
          subtitle="PDF, Word, Excel ou images. Glissez vos fichiers puis choisissez leur type."
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          acceptLabel="Formats acceptés : PDF, Word, Excel, images"
          confirmLabel="Importer"
          extra={
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label-xs">Type de document</span>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring"
                >
                  {["Appel d'offres", "Document technique", "Document administratif", "Devis fournisseur", "Bordereau", "Offre finale", "Autre"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label-xs">Rattacher à (optionnel)</span>
                <select
                  value={linkTo}
                  onChange={(e) => setLinkTo(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring"
                >
                  {["ONEE – AO 24/DRC/CI/2026", "AO ONCF", "AO Marsa Maroc", "FlowTech Germany", "HydroTech France", "Article PRM-DEB-600", "Aucun rattachement"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
          }
          onConfirm={(files) =>
            toast.success(
              `${files.length} document${files.length > 1 ? "s" : ""} importé${files.length > 1 ? "s" : ""} · ${docType} · ${linkTo}`,
            )
          }
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
