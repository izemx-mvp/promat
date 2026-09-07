import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Download, FileText } from "lucide-react";
import { AppShell } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { GhostButton, StickyBar, TenderWorkflow } from "@/components/promat/workflow";
import { fmtMAD, fmtNum } from "@/lib/promat/data";
import { computeCosts, useTender } from "@/lib/promat/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/offres/$id")({
  head: () => ({
    meta: [
      { title: "Offre finale du dossier — PROMAT" },
      {
        name: "description",
        content:
          "Offre commerciale finale : vue interne (achat, revient, marge) et vue client (code, désignation, quantité, prix), checklist et exports.",
      },
      { property: "og:title", content: "Offre finale du dossier — PROMAT" },
      {
        property: "og:description",
        content: "Vue client sans donnée interne, prête à déposer.",
      },
    ],
  }),
  component: OffrePage,
});

function OffrePage() {
  const { id } = useParams({ from: "/offres/$id" });
  const { tender, state, update, addLog } = useTender(id);
  const [view, setView] = useState<"client" | "interne">("client");

  if (!tender || !state) {
    return (
      <AppShell>
        <div className="p-8 text-sm text-muted-foreground">Dossier introuvable.</div>
      </AppShell>
    );
  }

  const { achat, revient } = computeCosts(tender.purchaseBase, state.cost);
  const factor = (revient / achat) * (1 + state.margin / 100);
  const supplierName =
    tender.suppliers.find((s) => s.id === state.retainedSupplier)?.name ?? "FlowTech Germany";

  const lines = tender.articles.map((a) => {
    const eur = Number(a.prevPrice.replace(/[^\d]/g, "")) || 500;
    const purchase = eur * state.cost.rate;
    const landed = purchase * (revient / achat);
    const unit = purchase * factor;
    return { ...a, purchase, landed, unit, total: unit * a.qty };
  });
  const totalHT = lines.reduce((s, l) => s + l.total, 0);

  const checklist: [string, boolean][] = [
    ["Articles validés", state.articlesValidated],
    ["Fournisseurs retenus", Boolean(state.retainedSupplier)],
    ["Prix de revient calculé", state.costValidated],
    ["Marge validée", state.marginValidated],
    ["Tous les prix renseignés", true],
  ];

  return (
    <AppShell>
      <TenderWorkflow tender={tender} state={state} current="offre">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="card-soft p-5">
            <p className="label-xs">Montant HT</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums">{fmtMAD(totalHT)}</p>
          </div>
          <div className="card-soft p-5">
            <p className="label-xs">Marge moyenne</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums">
              {fmtNum(state.margin, 1)} %
            </p>
          </div>
          <div className="card-soft p-5">
            <p className="label-xs">État</p>
            <p className="mt-2">
              <Pill tone={state.offerValidated ? "ok" : "warn"}>
                {state.offerValidated ? "Prête à déposer" : "Prêt"}
              </Pill>
            </p>
          </div>
        </div>

        <SectionCard
          title="Offre"
          subtitle={
            view === "client"
              ? "Aucune donnée interne n'apparaît dans cette vue."
              : `Fournisseur retenu : ${supplierName}`
          }
          action={
            <div className="flex rounded-lg bg-muted p-1">
              {(["client", "interne"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                    view === v ? "bg-card shadow-soft" : "text-muted-foreground",
                  )}
                >
                  {v === "client" ? "Vue client" : "Vue interne PROMAT"}
                </button>
              ))}
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {(view === "client"
                    ? ["Code", "Désignation", "Unité", "Quantité", "Prix unitaire", "Total"]
                    : [
                        "Code",
                        "Désignation",
                        "Fournisseur",
                        "Prix d'achat",
                        "Prix de revient",
                        "Marge",
                        "Prix de vente",
                      ]
                  ).map((h) => (
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
                {lines.map((l) => (
                  <tr key={l.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3.5 pr-4 tabular-nums text-muted-foreground">{l.ref}</td>
                    <td className="py-3.5 pr-4 font-medium">{l.designation}</td>
                    {view === "client" ? (
                      <>
                        <td className="py-3.5 pr-4 text-muted-foreground">{l.unit_ ?? l.unit}</td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Checklist de dépôt">
          <ul className="grid gap-2 sm:grid-cols-2">
            {checklist.map(([label, ok]) => (
              <li
                key={label}
                className={cn("flex items-center gap-2 text-sm", ok ? "text-success" : "text-muted-foreground")}
              >
                <Check className="size-4" strokeWidth={3} /> {label}
              </li>
            ))}
          </ul>
        </SectionCard>

        <StickyBar
          message={
            state.offerValidated
              ? "Offre validée — prête à déposer."
              : `Montant HT ${fmtMAD(totalHT)} · marge ${fmtNum(state.margin, 1)} %`
          }
        >
          <GhostButton onClick={() => toast.success("Export Excel généré")}>
            <Download className="size-4" /> Exporter Excel
          </GhostButton>
          <GhostButton onClick={() => toast.success("PDF généré")}>
            <FileText className="size-4" /> Générer PDF
          </GhostButton>
          <button
            onClick={() => {
              update(id, { offerValidated: true });
              addLog({
                who: "Houda Bennani",
                action: "Offre finale validée",
                tender: tender.reference,
                module: "Offres finales",
              });
              toast.success("Offre finale validée");
            }}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Valider l'offre finale
          </button>
        </StickyBar>
      </TenderWorkflow>
    </AppShell>
  );
}
