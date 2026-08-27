import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/promat/AppShell";
import { Metric, PageHeader, SectionCard, StatusBadge } from "@/components/promat/ui";
import { usePromat } from "@/lib/promat/store";
import { fmtInt, recommendSupplier } from "@/lib/promat/calc";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/comparatifs")({
  head: () => ({
    meta: [
      { title: "Comparatifs fournisseurs — PROMAT" },
      { name: "description", content: "Comparez les offres fournisseurs ligne par ligne : coût rendu, délai, conformité et origine." },
      { property: "og:title", content: "Comparatifs fournisseurs — PROMAT" },
      { property: "og:description", content: "Analyse multi-critères des offres reçues." },
    ],
  }),
  component: ComparatifsPage,
});

function ComparatifsPage() {
  const promat = usePromat();
  const navigate = useNavigate();
  const tendersAvecOffres = useMemo(
    () => promat.tenders.filter((t) => promat.quotes.some((q) => q.tenderId === t.id)),
    [promat.tenders, promat.quotes],
  );
  const [tenderId, setTenderId] = useState(tendersAvecOffres[0]?.id ?? "");

  const tender = promat.tenders.find((t) => t.id === tenderId);
  const articles = promat.articles.filter((a) => a.tenderId === tenderId);
  const quotes = promat.quotes.filter((q) => q.tenderId === tenderId);
  const costing = promat.costings.find((c) => c.tenderId === tenderId);

  return (
    <AppShell variant="finance">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <PageHeader
          title="Comparatifs fournisseurs"
          subtitle="Recommandation multi-critères : coût rendu, délai, conformité, Genuine/OEM et fiabilité."
          actions={
            costing ? (
              <Button onClick={() => navigate({ to: "/chiffrages/$id", params: { id: costing.id } })}>Ouvrir le chiffrage</Button>
            ) : null
          }
        />

        <Select value={tenderId} onValueChange={setTenderId}>
          <SelectTrigger className="max-w-md"><SelectValue placeholder="Choisir un appel d'offres" /></SelectTrigger>
          <SelectContent>
            {tendersAvecOffres.map((t) => <SelectItem key={t.id} value={t.id}>{t.ref} — {t.client}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Lignes comparées" value={String(articles.length)} />
          <Metric label="Offres reçues" value={String(quotes.length)} />
          <Metric label="Fournisseurs" value={String(new Set(quotes.map((q) => q.supplierId)).size)} />
        </div>

        <SectionCard title={tender ? `Recommandations — ${tender.ref}` : "Recommandations"} noPadding>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                <tr>{["Ligne", "Article", "Fournisseur recommandé", "Coût rendu", "Score", "Raisons", "Décision"].map((h) => <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {articles.map((a) => {
                  const reco = recommendSupplier(a, quotes, promat.suppliers, promat.rates, costing?.customs[a.id] ?? 0);
                  const retenu = costing?.selections[a.id];
                  return (
                    <tr key={a.id} className="hover:bg-accent/60">
                      <td className="num px-3 py-2">{a.ligne}</td>
                      <td className="max-w-[240px] truncate px-3 py-2">{a.designation}</td>
                      <td className="px-3 py-2 font-medium">{reco?.supplier.nom ?? "—"}</td>
                      <td className="num px-3 py-2 text-right">{reco ? `${fmtInt(reco.coutRenduMAD)} MAD` : "—"}</td>
                      <td className="num px-3 py-2 text-right">{reco?.score ?? "—"}</td>
                      <td className="max-w-[280px] px-3 py-2 text-xs text-muted-foreground">{reco?.raisons.slice(0, 2).join(" • ")}</td>
                      <td className="px-3 py-2">
                        <StatusBadge tone={retenu ? "success" : "warning"}>
                          {retenu ? promat.suppliers.find((s) => s.id === retenu)?.nom ?? "Retenu" : "À décider"}
                        </StatusBadge>
                      </td>
                    </tr>
                  );
                })}
                {!articles.length ? <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">Sélectionnez un appel d'offres avec des offres reçues.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
