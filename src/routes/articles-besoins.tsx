import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/promat/AppShell";
import { Metric, PageHeader, SectionCard, StatusBadge } from "@/components/promat/ui";
import { usePromat } from "@/lib/promat/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/articles-besoins")({
  head: () => ({
    meta: [
      { title: "Articles & besoins — PROMAT" },
      { name: "description", content: "Toutes les lignes de besoin extraites des appels d'offres PROMAT et leur état de sourcing." },
      { property: "og:title", content: "Articles & besoins — PROMAT" },
      { property: "og:description", content: "Lignes de bordereau, spécifications et sourcing." },
    ],
  }),
  component: ArticlesBesoinsPage,
});

function ArticlesBesoinsPage() {
  const promat = usePromat();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      promat.articles.filter((a) =>
        q ? `${a.designation} ${a.marque} ${a.famille} ${a.refClient}`.toLowerCase().includes(q.toLowerCase()) : true,
      ),
    [promat.articles, q],
  );

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <PageHeader title="Articles & besoins" subtitle="Toutes les lignes de besoin, leur conformité et leur état de sourcing." />

        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Lignes de besoin" value={String(promat.articles.length)} />
          <Metric label="À sourcer" value={String(promat.articles.filter((a) => a.sourcing === "À sourcer").length)} tone="warning" />
          <Metric label="Offres reçues" value={String(promat.articles.filter((a) => a.sourcing === "Offres reçues").length)} tone="info" />
          <Metric label="Fournisseur retenu" value={String(promat.articles.filter((a) => a.sourcing === "Fournisseur retenu").length)} tone="success" />
        </div>

        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un article, une marque, une famille…" className="max-w-md" />

        <SectionCard noPadding>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                <tr>{["AO", "Ligne", "Désignation", "Marque", "Qté", "Unité", "Famille", "Origine", "Conformité", "Sourcing", "Action"].map((h) => <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((a) => {
                  const t = promat.tenders.find((x) => x.id === a.tenderId);
                  return (
                    <tr key={a.id} className="hover:bg-accent/60">
                      <td className="num px-3 py-2 whitespace-nowrap">{t?.ref}</td>
                      <td className="num px-3 py-2">{a.ligne}</td>
                      <td className="max-w-[280px] truncate px-3 py-2">{a.designation}</td>
                      <td className="px-3 py-2">{a.marque}</td>
                      <td className="num px-3 py-2 text-right">{a.qte}</td>
                      <td className="px-3 py-2">{a.unite}</td>
                      <td className="px-3 py-2">{a.famille}</td>
                      <td className="px-3 py-2">{a.origine}</td>
                      <td className="px-3 py-2"><StatusBadge>{a.conformite}</StatusBadge></td>
                      <td className="px-3 py-2"><StatusBadge>{a.sourcing}</StatusBadge></td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => t && navigate({ to: "/appels-offres/$id", params: { id: t.id } })}>Ouvrir l'AO</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
