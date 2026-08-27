import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/promat/AppShell";
import { Metric, PageHeader, SectionCard, StatusBadge } from "@/components/promat/ui";
import { newId, usePromat } from "@/lib/promat/store";
import { fmtDate } from "@/lib/promat/calc";
import type { DocItem } from "@/lib/promat/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — PROMAT" },
      { name: "description", content: "Centre documentaire PROMAT : dossiers AO, pièces administratives, fiches techniques et devis." },
      { property: "og:title", content: "Documents — PROMAT" },
      { property: "og:description", content: "Lecture assistée des documents et extraction des exigences." },
    ],
  }),
  component: DocumentsPage,
});

const CATS = ["Dossier AO", "Administratif", "Technique", "Fournisseurs"];

function DocumentsPage() {
  const promat = usePromat();
  const [tab, setTab] = useState("tous");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<DocItem | null>(null);

  const rows = useMemo(
    () =>
      promat.documents
        .filter((d) => (tab === "tous" ? true : d.categorie === tab))
        .filter((d) => (q ? `${d.nom} ${d.type} ${d.source}`.toLowerCase().includes(q.toLowerCase()) : true)),
    [promat.documents, tab, q],
  );

  const importer = () => {
    const d: DocItem = {
      id: newId("doc"),
      nom: `Document importé ${new Date().toLocaleTimeString("fr-FR")}.pdf`,
      categorie: "Dossier AO",
      type: "PDF",
      version: "V1",
      source: "Import manuel",
      statut: "À vérifier",
      date: new Date().toISOString(),
      responsable: promat.session?.nom ?? "PROMAT",
      extraction: {
        infos: ["Document analysé automatiquement"],
        exigences: ["Vérification manuelle recommandée"],
        dates: [],
        articles: [],
        alertes: ["Extraction partielle — relecture nécessaire"],
      },
    };
    promat.addDocument(d);
    promat.log("Document importé", d.nom);
    toast.success("Document importé et analysé.");
  };

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <PageHeader
          title="Documents"
          subtitle="Centre documentaire et lecture assistée : exigences, dates et articles extraits."
          actions={<Button onClick={importer}><Upload className="size-4" /> Importer un document</Button>}
        />

        <div className="grid gap-3 sm:grid-cols-4">
          {CATS.map((c) => (
            <Metric key={c} label={c} value={String(promat.documents.filter((d) => d.categorie === c).length)} />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="tous">Tous</TabsTrigger>
              {CATS.map((c) => <TabsTrigger key={c} value={c} className="text-xs">{c}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un document…" className="max-w-xs" />
        </div>

        <SectionCard noPadding>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                <tr>{["Nom", "Catégorie", "Type", "Version", "Source", "Date", "Responsable", "Statut", "Action"].map((h) => <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((d) => (
                  <tr key={d.id} className="hover:bg-accent/60">
                    <td className="px-3 py-2 font-medium"><FileText className="mr-1.5 inline size-4 text-muted-foreground" />{d.nom}</td>
                    <td className="px-3 py-2">{d.categorie}</td>
                    <td className="px-3 py-2">{d.type}</td>
                    <td className="num px-3 py-2">{d.version}</td>
                    <td className="px-3 py-2">{d.source}</td>
                    <td className="num px-3 py-2 whitespace-nowrap">{fmtDate(d.date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{d.responsable}</td>
                    <td className="px-3 py-2"><StatusBadge>{d.statut}</StatusBadge></td>
                    <td className="px-3 py-2 text-right"><Button size="sm" variant="outline" onClick={() => setOpen(d)}>Lecture assistée</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent className="w-[min(30rem,100vw-1.5rem)] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{open?.nom}</SheetTitle>
            <SheetDescription>Éléments extraits automatiquement du document.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 p-4 text-sm">
            {open
              ? ([
                  ["Informations clés", open.extraction.infos],
                  ["Exigences", open.extraction.exigences],
                  ["Dates importantes", open.extraction.dates],
                  ["Articles détectés", open.extraction.articles],
                  ["Alertes", open.extraction.alertes],
                ] as const).map(([titre, items]) => (
                  <div key={titre}>
                    <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{titre}</p>
                    <ul className="mt-1.5 space-y-1">
                      {items.length ? items.map((i) => <li key={i} className="rounded-md border border-border px-2.5 py-1.5">{i}</li>) : <li className="text-muted-foreground">Aucun élément.</li>}
                    </ul>
                  </div>
                ))
              : null}
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
