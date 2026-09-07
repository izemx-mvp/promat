import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { AppShell } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { GhostButton, NextButton, StickyBar, TenderWorkflow } from "@/components/promat/workflow";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fmtNum } from "@/lib/promat/data";
import { useTender } from "@/lib/promat/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/comparatifs/$id")({
  head: () => ({
    meta: [
      { title: "Comparatif du dossier — PROMAT" },
      {
        name: "description",
        content:
          "Offres fournisseurs comparées article par article, recommandation de l'Agent Chiffrage et choix final du fournisseur.",
      },
      { property: "og:title", content: "Comparatif du dossier — PROMAT" },
      {
        property: "og:description",
        content: "Prix, délai, conformité et Genuine/OEM comparés en un écran.",
      },
    ],
  }),
  component: ComparatifPage,
});

function ComparatifPage() {
  const { id } = useParams({ from: "/comparatifs/$id" });
  const { tender, state, update, addLog } = useTender(id);
  const [detail, setDetail] = useState(false);

  if (!tender || !state) {
    return (
      <AppShell>
        <div className="p-8 text-sm text-muted-foreground">Dossier introuvable.</div>
      </AppShell>
    );
  }

  const supplierIds = Array.from(new Set(tender.offers.map((o) => o.supplierId)));
  const suppliers = supplierIds
    .map((sid) => tender.suppliers.find((s) => s.id === sid))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const articles = tender.articles.filter((a) => tender.offers.some((o) => o.articleId === a.id));
  const best = suppliers[0];

  const retain = (sid: string) => {
    update(id, { retainedSupplier: sid });
    addLog({
      who: "Houda Bennani",
      action: `Fournisseur retenu : ${tender.suppliers.find((s) => s.id === sid)?.name}`,
      tender: tender.reference,
      module: "Comparatifs",
    });
    toast.success("Fournisseur retenu");
  };

  return (
    <AppShell>
      <TenderWorkflow tender={tender} state={state} current="comparatif">
        <SectionCard className="border-ai/30 bg-ai-soft/40">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Pill tone="ai">
                <Sparkles className="size-3.5" /> Fournisseur recommandé
              </Pill>
              <p className="mt-3 font-display text-2xl font-bold">{best?.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">Score : 91 / 100</p>
              <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
                {["Conforme", "Genuine", "Délai compatible", "Historique fiable"].map((r) => (
                  <li key={r} className="flex items-center gap-2 text-success">
                    <Check className="size-4" strokeWidth={3} /> {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              <GhostButton onClick={() => setDetail(true)}>Voir le comparatif détaillé</GhostButton>
              <button
                onClick={() => best && retain(best.id)}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Retenir ce fournisseur
              </button>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-3">
          {articles.map((a) => (
            <div key={a.id} className="card-soft p-5">
              <p className="text-[15px] font-semibold">{a.designation}</p>
              <p className="text-xs text-muted-foreground">
                Réf. {a.ref} · {a.qty} {a.unit}
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {suppliers.map((s) => {
                  const o = tender.offers.find((x) => x.articleId === a.id && x.supplierId === s.id);
                  if (!o) return null;
                  const retained = state.retainedSupplier === s.id;
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "rounded-xl border p-4",
                        retained ? "border-primary/40 bg-primary/[0.03]" : "border-border",
                      )}
                    >
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="mt-1 font-display text-xl font-bold tabular-nums">
                        {fmtNum(o.price)} EUR
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Pill>{o.kind}</Pill>
                        <Pill>{o.delay}</Pill>
                        <Pill tone={o.compliance === "Conforme" ? "ok" : "warn"}>
                          {o.compliance}
                        </Pill>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          PROMAT reste libre de retenir un autre fournisseur que celui recommandé par l'Agent.
        </p>

        <StickyBar
          message={
            state.retainedSupplier
              ? `Fournisseur retenu : ${
                  tender.suppliers.find((s) => s.id === state.retainedSupplier)?.name
                }`
              : "Retenez un fournisseur pour lancer le chiffrage."
          }
        >
          <NextButton
            to="/chiffrages/$id"
            id={id}
            label="Retenir ce fournisseur et passer au chiffrage"
            disabled={!state.retainedSupplier}
          />
        </StickyBar>
      </TenderWorkflow>

      <Sheet open={detail} onOpenChange={setDetail}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Comparatif détaillé</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            {suppliers.map((s) => {
              const o = tender.offers.find((x) => x.supplierId === s.id);
              return (
                <div key={s.id} className="rounded-xl border border-border p-4 text-sm">
                  <p className="font-semibold">{s.name}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    <dt className="text-muted-foreground">Incoterm</dt>
                    <dd>{o?.incoterm}</dd>
                    <dt className="text-muted-foreground">Origine</dt>
                    <dd>{o?.origin}</dd>
                    <dt className="text-muted-foreground">Validité</dt>
                    <dd>30 jours</dd>
                    <dt className="text-muted-foreground">Historique</dt>
                    <dd>{s.why.history}</dd>
                    <dt className="text-muted-foreground">Coût rendu estimé</dt>
                    <dd>+ 14 % vs prix d'achat</dd>
                    <dt className="text-muted-foreground">Documentation</dt>
                    <dd>Notices FR fournies</dd>
                  </dl>
                  <button
                    onClick={() => {
                      retain(s.id);
                      setDetail(false);
                    }}
                    className="mt-4 rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium hover:bg-muted"
                  >
                    Retenir {s.name}
                  </button>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
