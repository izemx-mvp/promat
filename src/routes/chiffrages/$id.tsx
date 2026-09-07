import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { GhostButton, NextButton, StickyBar, TenderWorkflow } from "@/components/promat/workflow";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fmtMAD, fmtNum } from "@/lib/promat/data";
import { computeCosts, useTender, type CostParams } from "@/lib/promat/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/chiffrages/$id")({
  head: () => ({
    meta: [
      { title: "Chiffrage du dossier — PROMAT" },
      {
        name: "description",
        content:
          "Prix de revient détaillé, frais d'approche éditables en ligne, taux de change et simulateur de marge pour un dossier PROMAT.",
      },
      { property: "og:title", content: "Chiffrage du dossier — PROMAT" },
      {
        property: "og:description",
        content: "Calcul du prix de revient et de la marge en temps réel.",
      },
    ],
  }),
  component: ChiffragePage,
});

const presets = [15, 18, 20, 22, 25];

function MoneyRow({
  label,
  value,
  onChange,
  suffix = "MAD",
}: {
  label: string;
  value: number;
  onChange?: (n: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-3.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {onChange ? (
        <span className="flex items-center gap-1.5">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            className="w-32 rounded-lg border border-transparent bg-transparent px-2 py-1 text-right text-[15px] font-medium tabular-nums outline-none hover:border-border focus:border-ring"
          />
          <span className="text-sm text-muted-foreground">{suffix}</span>
        </span>
      ) : (
        <span className="text-[15px] font-medium tabular-nums">
          {fmtNum(value)} {suffix}
        </span>
      )}
    </div>
  );
}

function ChiffragePage() {
  const { id } = useParams({ from: "/chiffrages/$id" });
  const { tender, state, update, addLog } = useTender(id);
  const [detail, setDetail] = useState(false);
  const [perLine, setPerLine] = useState(false);

  if (!tender || !state) {
    return (
      <AppShell>
        <div className="p-8 text-sm text-muted-foreground">Dossier introuvable.</div>
      </AppShell>
    );
  }

  const c = state.cost;
  const setCost = (patch: Partial<CostParams>) => update(id, { cost: { ...c, ...patch } });
  const { achat, douane, revient } = computeCosts(tender.purchaseBase, c);
  const vente = revient * (1 + state.margin / 100);
  const brute = vente - revient;
  const marginTone = state.margin >= 15 ? "ok" : state.margin >= 12 ? "warn" : "warn";
  const marginLabel =
    state.margin >= 15 ? "Marge saine" : state.margin >= 12 ? "Marge faible" : "Marge critique";

  return (
    <AppShell>
      <TenderWorkflow tender={tender} state={state} current="chiffrage">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Pill>{tender.articles.length} articles</Pill>
          <Pill>{state.selectedSuppliers.length || 3} fournisseurs consultés</Pill>
          <Pill tone="ai">Taux EUR/MAD {fmtNum(c.rate, 2)}</Pill>
          <Pill tone="ai">Taux USD/MAD {fmtNum(c.usdRate, 2)}</Pill>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <SectionCard
            title="Prix de revient"
            subtitle="Modifiez une valeur : le calcul se met à jour immédiatement."
            action={<GhostButton onClick={() => setDetail(true)}>Voir le détail</GhostButton>}
          >
            <MoneyRow label="Achat fournisseur" value={achat} />
            <MoneyRow label={`Conversion au taux EUR/MAD ${fmtNum(c.rate, 2)}`} value={achat} />
            <MoneyRow label="Fret" value={c.fret} onChange={(n) => setCost({ fret: n })} />
            <MoneyRow label={`Douane (${fmtNum(c.douanePct, 1)} %)`} value={douane} />
            <MoneyRow label="Transit" value={c.transit} onChange={(n) => setCost({ transit: n })} />
            <MoneyRow label="Assurance & banque" value={c.banque} onChange={(n) => setCost({ banque: n })} />
            <MoneyRow label="Autres frais" value={c.autres} onChange={(n) => setCost({ autres: n })} />
            <div className="mt-4 flex items-center justify-between rounded-xl bg-navy px-5 py-4 text-navy-foreground">
              <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                Prix de revient
              </span>
              <span className="font-display text-2xl font-bold tabular-nums">{fmtMAD(revient)}</span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label-xs">Taux EUR/MAD</span>
                <input
                  type="number"
                  step="0.01"
                  value={c.rate}
                  onChange={(e) => setCost({ rate: Number(e.target.value) || 0 })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm tabular-nums outline-none focus:border-ring"
                />
              </label>
              <label className="block">
                <span className="label-xs">Taux USD/MAD</span>
                <input
                  type="number"
                  step="0.01"
                  value={c.usdRate}
                  onChange={(e) => setCost({ usdRate: Number(e.target.value) || 0 })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm tabular-nums outline-none focus:border-ring"
                />
              </label>
            </div>
          </SectionCard>

          <SectionCard title="Marge globale">
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => update(id, { margin: p })}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    state.margin === p
                      ? "bg-navy text-navy-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent",
                  )}
                >
                  {p} %
                </button>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="label-xs">Valeur personnalisée</span>
              <input
                type="number"
                value={state.margin}
                onChange={(e) => update(id, { margin: Number(e.target.value) || 0 })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm tabular-nums outline-none focus:border-ring"
              />
            </label>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Prix de revient</dt>
                <dd className="tabular-nums">{fmtMAD(revient)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Marge</dt>
                <dd className="tabular-nums">{fmtNum(state.margin, 0)} %</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Marge brute</dt>
                <dd className="tabular-nums">{fmtMAD(brute)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <dt className="font-medium">Prix de vente</dt>
                <dd className="font-display text-xl font-bold tabular-nums">{fmtMAD(vente)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between">
              <Pill tone={marginTone}>{marginLabel}</Pill>
              <button
                onClick={() => setPerLine(true)}
                className="text-[13px] text-muted-foreground underline-offset-4 hover:underline"
              >
                Ajuster la marge par article
              </button>
            </div>
          </SectionCard>
        </div>

        <StickyBar
          message={
            state.costValidated && state.marginValidated
              ? "Chiffrage validé. Vous pouvez préparer l'offre finale."
              : `Prix de revient ${fmtMAD(revient)} · marge ${fmtNum(state.margin, 0)} %`
          }
        >
          {state.costValidated && state.marginValidated ? (
            <NextButton to="/offres/$id" id={id} label="Préparer l'offre finale" />
          ) : (
            <NextButton
              label="Valider le chiffrage"
              onClick={() => {
                update(id, { costValidated: true, marginValidated: true });
                addLog({
                  who: "Houda Bennani",
                  action: `Chiffrage validé — marge ${state.margin} %`,
                  tender: tender.reference,
                  module: "Chiffrages",
                });
                toast.success("Chiffrage validé");
              }}
            />
          )}
        </StickyBar>
      </TenderWorkflow>

      <Sheet open={detail} onOpenChange={setDetail}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Détail du calcul</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 text-sm">
            <p className="text-muted-foreground">
              Répartition des frais d'approche au prorata de la valeur d'achat.
            </p>
            {[
              ["Achat fournisseur", achat],
              ["Fret", c.fret],
              ["Douane", douane],
              ["Transit", c.transit],
              ["Banque", c.banque],
              ["Autres frais", c.autres],
            ].map(([label, v]) => (
              <div key={label as string} className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">{label as string}</span>
                <span className="tabular-nums">
                  {fmtMAD(v as number)} · {fmtNum(((v as number) / revient) * 100, 1)} %
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-medium">
              <span>Prix de revient</span>
              <span className="tabular-nums">{fmtMAD(revient)}</span>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={perLine} onOpenChange={setPerLine}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Marge par article</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {tender.articles.slice(0, 8).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3 text-sm"
              >
                <span className="min-w-0 truncate">{a.designation}</span>
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    defaultValue={state.margin}
                    className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-right tabular-nums outline-none focus:border-ring"
                  />
                  <span className="text-muted-foreground">%</span>
                </span>
              </div>
            ))}
            <button
              onClick={() => {
                setPerLine(false);
                toast.success("Marges par article enregistrées");
              }}
              className="mt-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Enregistrer
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
