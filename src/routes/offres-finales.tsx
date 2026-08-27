import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { FileDown, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/promat/AppShell";
import { Metric, PageHeader, SectionCard, StatusBadge } from "@/components/promat/ui";
import { usePromat } from "@/lib/promat/store";
import { computeCosting, fmtDate, fmtInt } from "@/lib/promat/calc";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/offres-finales")({
  head: () => ({
    meta: [
      { title: "Offres finales — PROMAT" },
      { name: "description", content: "Dossiers d'offres PROMAT prêts au dépôt : bordereau, pièces administratives et suivi." },
      { property: "og:title", content: "Offres finales — PROMAT" },
      { property: "og:description", content: "Constitution et dépôt des offres PROMAT." },
    ],
  }),
  component: OffresFinalesPage,
});

function OffresFinalesPage() {
  const promat = usePromat();
  const navigate = useNavigate();

  const dossiers = useMemo(
    () =>
      promat.costings
        .filter((c) => c.statut === "Validé" || c.statut === "À valider")
        .map((c) => {
          const tender = promat.tenders.find((t) => t.id === c.tenderId)!;
          const articles = promat.articles.filter((a) => a.tenderId === c.tenderId);
          const { totals } = computeCosting(articles, c, promat.quotes, promat.suppliers, promat.rates);
          const pieces = tender?.admin ?? [];
          const pretes = pieces.filter((p) => p.statut === "Disponible").length;
          return { c, tender, totals, pieces, pretes };
        })
        .filter((d) => !!d.tender),
    [promat],
  );

  return (
    <AppShell variant="finance">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
        <PageHeader title="Offres finales" subtitle="Constituez le dossier complet et suivez le dépôt de chaque offre PROMAT." />

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Dossiers en préparation" value={String(dossiers.length)} />
          <Metric label="Montant total proposé" value={`${fmtInt(dossiers.reduce((s, d) => s + d.totals.venteHT, 0))} MAD`} />
          <Metric label="Offres déposées" value={String(promat.tenders.filter((t) => t.statut === "Déposé").length)} tone="success" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {dossiers.map(({ c, tender, totals, pieces, pretes }) => (
            <SectionCard
              key={c.id}
              title={tender.ref}
              description={`${tender.client} — dépôt le ${fmtDate(tender.dateLimite)}`}
              actions={<StatusBadge>{c.statut}</StatusBadge>}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Offre HT" value={`${fmtInt(totals.venteHT)} MAD`} />
                <Metric label="Marge" value={`${totals.margeMoyenne.toFixed(1)} %`} tone={totals.margeMoyenne < 15 ? "danger" : "success"} />
                <Metric label="Pièces prêtes" value={`${pretes}/${pieces.length}`} tone={pretes === pieces.length ? "success" : "warning"} />
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {pieces.map((p) => (
                  <li key={p.label} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-1.5">
                    <span>{p.label}</span>
                    <StatusBadge>{p.statut}</StatusBadge>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate({ to: "/chiffrages/$id", params: { id: c.id } })}>Ouvrir le chiffrage</Button>
                <Button variant="outline" size="sm" onClick={() => toast.success("Dossier d'offre généré (bordereau + pièces).")}>
                  <FileDown className="size-4" /> Générer le dossier
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    promat.updateTender(tender.id, { statut: "Déposé", stageIndex: 9, avancement: 100 });
                    promat.log("Offre déposée", tender.ref, tender.statut, "Déposé");
                    promat.notify({ type: "AO", titre: "Offre déposée", message: `${tender.ref} déposée pour ${fmtInt(totals.venteHT)} MAD HT`, priorite: "Haute" });
                    toast.success("Offre marquée comme déposée.");
                  }}
                >
                  <Send className="size-4" /> Marquer comme déposée
                </Button>
              </div>
            </SectionCard>
          ))}
          {!dossiers.length ? (
            <SectionCard title="Aucun dossier prêt">
              <p className="text-sm text-muted-foreground">Validez un chiffrage pour constituer une offre finale.</p>
              <Button className="mt-3" onClick={() => navigate({ to: "/chiffrages" })}>Aller aux chiffrages</Button>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
