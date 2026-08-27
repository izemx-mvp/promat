import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/promat/AppShell";
import { Metric, PageHeader, SectionCard } from "@/components/promat/ui";
import { usePromat } from "@/lib/promat/store";
import { fmtDate, fmtMAD } from "@/lib/promat/calc";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/articles")({
  head: () => ({
    meta: [
      { title: "Référentiel articles — PROMAT" },
      { name: "description", content: "Référentiel articles PROMAT : références internes, familles, codes douaniers et historique de prix." },
      { property: "og:title", content: "Référentiel articles — PROMAT" },
      { property: "og:description", content: "Références internes, familles, douane et derniers prix d'achat." },
    ],
  }),
  component: ArticlesReferentiel,
});

function ArticlesReferentiel() {
  const promat = usePromat();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const map = new Map<string, (typeof promat.articles)[number]>();
    promat.articles.forEach((a) => map.set(a.refInterne || a.designation, a));
    return [...map.values()].filter((a) =>
      q ? `${a.refInterne} ${a.designation} ${a.famille} ${a.codeDouane}`.toLowerCase().includes(q.toLowerCase()) : true,
    );
  }, [promat.articles, q]);

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <PageHeader title="Référentiel articles" subtitle="Références internes réutilisables, codes douaniers et historique de prix." />

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Articles référencés" value={String(rows.length)} />
          <Metric label="Familles" value={String(new Set(promat.articles.map((a) => a.famille)).size)} />
          <Metric label="Avec historique de prix" value={String(promat.articles.filter((a) => a.historique).length)} />
        </div>

        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une référence, une famille, un code douanier…" className="max-w-md" />

        <SectionCard noPadding>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                <tr>{["Réf. interne", "Désignation", "Marque", "Famille", "Unité", "Poids (kg)", "Origine", "Code douane", "Dernier prix", "Dernier achat"].map((h) => <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-accent/60">
                    <td className="num px-3 py-2 font-semibold whitespace-nowrap">{a.refInterne || "—"}</td>
                    <td className="max-w-[280px] truncate px-3 py-2">{a.designation}</td>
                    <td className="px-3 py-2">{a.marque}</td>
                    <td className="px-3 py-2">{a.famille}</td>
                    <td className="px-3 py-2">{a.unite}</td>
                    <td className="num px-3 py-2 text-right">{a.poidsKg}</td>
                    <td className="px-3 py-2">{a.origine}</td>
                    <td className="num px-3 py-2">{a.codeDouane}</td>
                    <td className="num px-3 py-2 text-right">{a.historique ? `${fmtMAD(a.historique.prix)} ${a.historique.devise}` : "—"}</td>
                    <td className="num px-3 py-2 whitespace-nowrap">{a.historique ? fmtDate(a.historique.date) : "—"}</td>
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
