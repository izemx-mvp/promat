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
  const lines = tender.articles.map((a) => {
    const eur = Number(a.prevPrice.replace(/[^\d]/g, "")) || 500;
    const unit = eur * state.cost.rate * factor;
    return { ...a, unit, total: unit * a.qty, purchase: eur * state.cost.rate };
  });
  const totalHT = lines.reduce((s, l) => s + l.total, 0);

  const checklist = [
    ["Articles validés", state.articlesValidated],
    ["Fournisseurs retenus", Boolean(state.retainedSupplier)],
    ["Prix de revient calculé", state.costValidated],
    ["Marge validée", state.marginValidated],
    ["Tous les prix renseignés", true],
  ] as const;

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
                        <td className="py-3.5 pr-4 text-muted-foreground">{l.unit > 0 ? l.unit && l.unit ? l.unit : 0 : 0 ? "" : l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{l.unit ? "" : ""}{a.unit ? "" : ""}</td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </TenderWorkflow>
    </AppShell>
  );
}
