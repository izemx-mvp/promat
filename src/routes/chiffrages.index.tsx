import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/promat/AppShell";
import { PageHeader, SectionCard, StatusBadge } from "@/components/promat/ui";
import { usePromat } from "@/lib/promat/store";
import { computeCosting, fmtDate, fmtInt } from "@/lib/promat/calc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chiffrages/")({
  head: () => ({
    meta: [
      { title: "Chiffrages — PROMAT" },
      { name: "description", content: "Comparez les offres fournisseurs et calculez les prix de vente PROMAT." },
      { property: "og:title", content: "Chiffrages — PROMAT" },
      { property: "og:description", content: "Prix de revient, frais d'approche, douane et marge PROMAT." },
    ],
  }),
  component: ChiffragesPage,
});

const TABS = ["À préparer", "En cours", "À valider", "Validé", "Archivé"];

function ChiffragesPage() {
  const promat = usePromat();
  const navigate = useNavigate();
  const [tab, setTab] = useState("tous");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      promat.costings
        .map((c) => {
          const tender = promat.tenders.find((t) => t.id === c.tenderId);
          const articles = promat.articles.filter((a) => a.tenderId === c.tenderId);
          const quotes = promat.quotes.filter((qt) => qt.tenderId === c.tenderId);
          const { totals } = computeCosting(articles, c, quotes, promat.suppliers, promat.rates);
          return { c, tender, articles, totals, fournisseurs: new Set(Object.values(c.selections)).size };
        })
        .filter((r) => (tab === "tous" ? true : r.c.statut === tab))
        .filter((r) => (q ? `${r.tender?.ref} ${r.tender?.client}`.toLowerCase().includes(q.toLowerCase()) : true)),
    [promat, tab, q],
  );

  return (
    <AppShell variant="finance">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <PageHeader title="Chiffrages" subtitle="Comparez les offres fournisseurs et calculez les prix de vente PROMAT." />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="tous">Tous</TabsTrigger>
              {TABS.map((t) => (
                <TabsTrigger key={t} value={t}>
                  {t}
                  <span className="num ml-1.5 rounded bg-muted px-1 text-[10px]">{promat.costings.filter((c) => c.statut === t).length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un AO ou un client…" className="max-w-xs" />
        </div>

        <SectionCard noPadding>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-sm">
              <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                <tr>
                  {["AO", "Client", "Articles", "Fournisseurs", "Coût achat", "Frais", "Prix de revient", "Offre PROMAT", "Marge", "Statut", "Responsable", "Mise à jour", "Action"].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ c, tender, articles, totals, fournisseurs }) => (
                  <tr key={c.id} className="cursor-pointer hover:bg-accent/60" onClick={() => navigate({ to: "/chiffrages/$id", params: { id: c.id } })}>
                    <td className="num px-3 py-2 font-semibold whitespace-nowrap">{tender?.ref}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{tender?.client}</td>
                    <td className="num px-3 py-2 text-right">{articles.length}</td>
                    <td className="num px-3 py-2 text-right">{fournisseurs}</td>
                    <td className="num px-3 py-2 text-right">{fmtInt(totals.achats)}</td>
                    <td className="num px-3 py-2 text-right">{fmtInt(totals.frais + totals.douane)}</td>
                    <td className="num px-3 py-2 text-right font-semibold">{fmtInt(totals.prixRevient)}</td>
                    <td className="num px-3 py-2 text-right font-semibold">{fmtInt(totals.venteHT)}</td>
                    <td className={cn("num px-3 py-2 text-right font-bold", totals.margeMoyenne < 12 ? "text-danger" : totals.margeMoyenne < 15 ? "text-warning-foreground" : "text-success")}>
                      {totals.margeMoyenne.toFixed(1)} %
                    </td>
                    <td className="px-3 py-2"><StatusBadge>{c.statut}</StatusBadge></td>
                    <td className="px-3 py-2 whitespace-nowrap">{c.responsable}</td>
                    <td className="num px-3 py-2 whitespace-nowrap">{fmtDate(c.updatedAt)}</td>
                    <td className="px-3 py-2 text-right"><Button size="sm" variant="outline">Ouvrir <ArrowRight className="size-3.5" /></Button></td>
                  </tr>
                ))}
                {!rows.length ? <tr><td colSpan={13} className="px-3 py-10 text-center text-muted-foreground">Aucun chiffrage pour ce filtre.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
