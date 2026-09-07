import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, FileDown, FileSpreadsheet, Sparkles } from "lucide-react";
import { AppShell, TenderList } from "@/components/promat/shell";
import { EmptyWorkspace, Field, Pill, SectionCard, Stepper } from "@/components/promat/ui";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { computeCosts, usePromat, type CostParams } from "@/lib/promat/store";
import { fmtMAD, fmtNum, type Tender } from "@/lib/promat/data";
import { toast } from "sonner";

export const Route = createFileRoute("/chiffrage")({
  head: () => ({
    meta: [
      { title: "Agent Chiffrage — PROMAT Maroc" },
      {
        name: "description",
        content:
          "Comparez les offres fournisseurs, calculez le prix de revient, simulez la marge et générez l'offre client PROMAT.",
      },
      { property: "og:title", content: "Agent Chiffrage — PROMAT Maroc" },
      {
        property: "og:description",
        content:
          "Offres fournisseurs, comparatif IA, coût de revient, marge et offre finale dans un seul espace guidé.",
      },
    ],
  }),
  component: AgentChiffrage,
});

const steps = [
  { id: 1, label: "Offres fournisseurs" },
  { id: 2, label: "Comparatif" },
  { id: 3, label: "Coûts" },
  { id: 4, label: "Marge" },
  { id: 5, label: "Offre finale" },
];

const filters = ["Tous", "Prêt pour chiffrage", "Chiffrage en cours", "Offre validée"];

function AgentChiffrage() {
  const { tenders, states, update, handoffId } = usePromat();
  const [filter, setFilter] = useState("Tous");
  const ready = tenders.filter((t) => states[t.id]?.sentToCosting);
  const [selectedId, setSelectedId] = useState(handoffId ?? ready[0]?.id ?? "");
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (handoffId) setSelectedId(handoffId);
  }, [handoffId]);

  const list = useMemo(
    () => ready.filter((t) => filter === "Tous" || t.status === filter),
    [ready, filter],
  );
  const tender = tenders.find((t) => t.id === selectedId);
  const state = states[selectedId];

  const completed: number[] = [1];
  if (state?.retainedSupplier) completed.push(2);
  if (state?.costValidated) completed.push(3);
  if (state?.marginValidated) completed.push(4);
  if (state?.offerValidated) completed.push(5);

  const unlocked = [1, 2];
  if (state?.retainedSupplier) unlocked.push(3);
  if (state?.costValidated) unlocked.push(4);
  if (state?.marginValidated) unlocked.push(5);

  return (
    <AppShell>
      <div className="flex h-full">
        <TenderList
          title="Dossiers à chiffrer"
          filters={filters}
          activeFilter={filter}
          onFilter={setFilter}
          items={list}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        {!tender || !state ? (
          <EmptyWorkspace
            title="Aucun dossier en chiffrage"
            text="Transmettez un dossier depuis l'Agent AO & Analyse pour démarrer le chiffrage."
          />
        ) : (
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl px-8 pb-24 pt-8">
              <header className="card-soft p-7">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-muted-foreground">{tender.client}</p>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {tender.reference}
                      </span>
                    </div>
                    <h1 className="page-title mt-2 leading-tight">Chiffrage — {tender.title}</h1>
                  </div>
                  <div className="text-right">
                    <p className="label-xs">Budget client</p>
                    <p className="mt-1 text-[15px] font-medium">{tender.budget}</p>
                  </div>
                </div>
              </header>

              <div className="mt-8">
                <Stepper
                  steps={steps}
                  current={step}
                  completed={completed}
                  unlocked={unlocked}
                  onSelect={setStep}
                />
              </div>

              <div className="mt-8 space-y-6">
                {step === 1 && <StepOffers tender={tender} onNext={() => setStep(2)} />}
                {step === 2 && (
                  <StepComparatif
                    tender={tender}
                    retained={state.retainedSupplier}
                    onRetain={(id) => {
                      update(tender.id, { retainedSupplier: id });
                      setStep(3);
                    }}
                  />
                )}
                {step === 3 && (
                  <StepCosts
                    tender={tender}
                    cost={state.cost}
                    onChange={(cost) => update(tender.id, { cost })}
                    onValidate={() => {
                      update(tender.id, { costValidated: true });
                      setStep(4);
                    }}
                  />
                )}
                {step === 4 && (
                  <StepMargin
                    tender={tender}
                    cost={state.cost}
                    margin={state.margin}
                    onMargin={(margin) => update(tender.id, { margin })}
                    onValidate={() => {
                      update(tender.id, { marginValidated: true });
                      setStep(5);
                    }}
                  />
                )}
                {step === 5 && (
                  <StepFinal
                    tender={tender}
                    cost={state.cost}
                    margin={state.margin}
                    validated={state.offerValidated}
                    onValidate={() => {
                      update(tender.id, { offerValidated: true });
                      toast.success("Offre finale validée");
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StepOffers({ tender, onNext }: { tender: Tender; onNext: () => void }) {
  const [detail, setDetail] = useState<string | null>(null);
  const articles = tender.articles.filter((a) =>
    tender.offers.some((o) => o.articleId === a.id),
  );

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="page-title">Offres fournisseurs</h2>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            {tender.suppliers.length} fournisseurs · {tender.articles.length} articles ·{" "}
            {tender.offers.length} propositions reçues
          </p>
        </div>
        <Button onClick={onNext}>
          Comparer <ArrowRight className="size-4" />
        </Button>
      </div>

      {articles.map((a) => (
        <SectionCard key={a.id} title={a.designation} subtitle={`${a.qty} ${a.unit} · ${a.specs}`}>
          <ul className="divide-y divide-border">
            {tender.offers
              .filter((o) => o.articleId === a.id)
              .map((o) => {
                const s = tender.suppliers.find((x) => x.id === o.supplierId);
                return (
                  <li
                    key={o.supplierId}
                    className="flex cursor-pointer items-center justify-between gap-4 py-3.5"
                    onClick={() => setDetail(`${a.id}-${o.supplierId}`)}
                  >
                    <span className="text-[15px] font-medium">{s?.name}</span>
                    <span className="flex items-center gap-6 text-sm text-muted-foreground">
                      <Pill tone="neutral">{o.kind}</Pill>
                      <span>{o.delay}</span>
                      <span className="w-24 text-right font-display text-base font-semibold tabular-nums text-foreground">
                        {fmtNum(o.price)} EUR
                      </span>
                    </span>
                  </li>
                );
              })}
          </ul>
        </SectionCard>
      ))}

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Détail de la proposition</SheetTitle>
          </SheetHeader>
          {detail &&
            (() => {
              const [aid, sid] = detail.split("-");
              const o = tender.offers.find((x) => x.articleId === aid && x.supplierId === sid);
              const s = tender.suppliers.find((x) => x.id === sid);
              if (!o) return null;
              return (
                <div className="space-y-5 p-4 pt-0">
                  <Field label="Fournisseur" value={s?.name ?? ""} />
                  <Field label="Prix unitaire" value={`${fmtNum(o.price)} EUR`} />
                  <Field label="Type" value={o.kind} />
                  <Field label="Délai" value={o.delay} />
                  <Field label="Incoterm" value={o.incoterm} />
                  <Field label="Origine" value={o.origin} />
                  <Field label="Conformité technique" value={o.compliance} />
                </div>
              );
            })()}
        </SheetContent>
      </Sheet>
    </>
  );
}

function StepComparatif({
  tender,
  retained,
  onRetain,
}: {
  tender: Tender;
  retained?: string | undefined;
  onRetain: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const best = tender.suppliers[0];
  const price = best ? (tender.offers.find((o) => o.supplierId === best.id)?.price ?? 0) : 0;
  if (!best) return null;

  return (
    <>
      <div>
        <h2 className="page-title">Comparatif</h2>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          L'Agent a comparé prix, conformité, délai, origine et historique PROMAT.
        </p>
      </div>

      <div className="rounded-2xl border border-ai/25 bg-ai-soft p-7">
        <div className="flex items-center gap-2 text-ai">
          <Sparkles className="size-4" />
          <p className="text-sm font-semibold">Recommandation Agent</p>
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-display text-2xl font-bold">{best.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Prix de référence : {fmtNum(price)} EUR
            </p>
          </div>
          <div className="text-right">
            <p className="label-xs">Score</p>
            <p className="font-display text-4xl font-bold tabular-nums text-ai">91 / 100</p>
          </div>
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {["Conforme", "Genuine", "Délai compatible", "Historique fiable"].map((r) => (
            <li key={r} className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" /> {r}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => onRetain(best.id)}>
            {retained === best.id ? "Fournisseur retenu ✓" : "Retenir ce fournisseur"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(true)}>
            Comparer en détail
          </Button>
        </div>
      </div>

      <SectionCard title="Autres fournisseurs" subtitle="PROMAT garde toujours la décision finale.">
        <ul className="divide-y divide-border">
          {tender.suppliers.slice(1).map((s) => {
            const p = tender.offers.find((o) => o.supplierId === s.id)?.price;
            return (
              <li key={s.id} className="flex items-center justify-between gap-4 py-3.5">
                <span>
                  <span className="block text-[15px] font-medium">{s.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.kind} · {s.delay}
                  </span>
                </span>
                <span className="flex items-center gap-5">
                  {p && (
                    <span className="font-display text-base font-semibold tabular-nums">
                      {fmtNum(p)} EUR
                    </span>
                  )}
                  <Button variant="outline" size="sm" onClick={() => onRetain(s.id)}>
                    {retained === s.id ? "Retenu ✓" : "Retenir"}
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Comparaison détaillée</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2">Critère</th>
                  {tender.suppliers.slice(0, 3).map((s) => (
                    <th key={s.id} className="py-2">
                      {s.name.split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Prix (EUR)", (id: string) => fmtNum(tender.offers.find((o) => o.supplierId === id)?.price ?? 0)],
                  ["Conformité", (id: string) => tender.offers.find((o) => o.supplierId === id)?.compliance ?? "—"],
                  ["Genuine / OEM", (id: string) => tender.offers.find((o) => o.supplierId === id)?.kind ?? "—"],
                  ["Délai", (id: string) => tender.suppliers.find((s) => s.id === id)?.delay ?? "—"],
                  ["Incoterm", (id: string) => tender.offers.find((o) => o.supplierId === id)?.incoterm ?? "—"],
                  ["Origine", (id: string) => tender.offers.find((o) => o.supplierId === id)?.origin ?? "—"],
                  ["Historique PROMAT", (id: string) => tender.suppliers.find((s) => s.id === id)?.lastConsult ?? "—"],
                ].map(([label, fn]) => (
                  <tr key={label as string} className="border-b border-border/60">
                    <td className="py-2.5 text-muted-foreground">{label as string}</td>
                    {tender.suppliers.slice(0, 3).map((s) => (
                      <td key={s.id} className="py-2.5 font-medium">
                        {(fn as (id: string) => string)(s.id)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function CostRow({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-[15px]">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="h-9 w-32 rounded-lg border border-border bg-background px-3 text-right text-sm font-medium tabular-nums outline-none focus:border-ring"
        />
        <span className="w-12 text-xs text-muted-foreground">{suffix}</span>
      </span>
    </div>
  );
}

function StepCosts({
  tender,
  cost,
  onChange,
  onValidate,
}: {
  tender: Tender;
  cost: CostParams;
  onChange: (c: CostParams) => void;
  onValidate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { achat, douane, revient } = computeCosts(tender.purchaseBase, cost);
  const set = (k: keyof CostParams) => (v: number) => onChange({ ...cost, [k]: v });

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="page-title">Coûts</h2>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            Chaque modification recalcule immédiatement le prix de revient.
          </p>
        </div>
        <Button onClick={onValidate}>Valider les coûts</Button>
      </div>

      <SectionCard title="Composition du prix de revient">
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between py-3">
            <span className="text-[15px]">Achat fournisseur</span>
            <span className="font-display text-base font-semibold tabular-nums">
              {fmtMAD(achat)}
            </span>
          </div>
          <CostRow label="Taux EUR/MAD" value={cost.rate} suffix="MAD" onChange={set("rate")} />
          <CostRow label="Fret" value={cost.fret} suffix="MAD" onChange={set("fret")} />
          <CostRow label="Transit" value={cost.transit} suffix="MAD" onChange={set("transit")} />
          <CostRow label="Banque" value={cost.banque} suffix="MAD" onChange={set("banque")} />
          <CostRow
            label="Assurance"
            value={cost.assurance}
            suffix="MAD"
            onChange={set("assurance")}
          />
          <CostRow label="Douane" value={cost.douanePct} suffix="%" onChange={set("douanePct")} />
          <CostRow label="Autres frais" value={cost.autres} suffix="MAD" onChange={set("autres")} />
          <div className="flex items-center justify-between py-3 text-muted-foreground">
            <span className="text-sm">Droits de douane calculés</span>
            <span className="text-sm tabular-nums">{fmtMAD(douane)}</span>
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-navy p-7 text-navy-foreground">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-navy-muted">
            Prix de revient
          </p>
          <p className="mt-2 font-display text-4xl font-bold tabular-nums">{fmtMAD(revient)}</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-navy-foreground/80 underline-offset-4 hover:underline"
        >
          Voir le détail du calcul
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Détail du calcul</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 p-4 pt-0 text-sm">
            {[
              ["Achat fournisseur", achat],
              ["Fret", cost.fret],
              ["Transit", cost.transit],
              ["Banque", cost.banque],
              ["Assurance", cost.assurance],
              [`Douane (${cost.douanePct} %)`, douane],
              ["Autres frais", cost.autres],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between border-b border-border/60 py-2">
                <span className="text-muted-foreground">{l as string}</span>
                <span className="tabular-nums">{fmtMAD(v as number)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 font-semibold">
              <span>Prix de revient</span>
              <span className="tabular-nums">{fmtMAD(revient)}</span>
            </div>
            <p className="pt-4 text-xs text-muted-foreground">
              Taux de conversion appliqué : 1 EUR = {cost.rate} MAD
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

const presets = [15, 18, 20, 22, 25];

function StepMargin({
  tender,
  cost,
  margin,
  onMargin,
  onValidate,
}: {
  tender: Tender;
  cost: CostParams;
  margin: number;
  onMargin: (m: number) => void;
  onValidate: () => void;
}) {
  const [perArticle, setPerArticle] = useState(false);
  const { revient } = computeCosts(tender.purchaseBase, cost);
  const vente = revient * (1 + margin / 100);
  const gain = vente - revient;
  const health = margin >= 20 ? "Marge saine" : margin >= 16 ? "Marge faible" : "Marge critique";
  const tone = margin >= 20 ? "ok" : margin >= 16 ? "warn" : "primary";

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="page-title">Marge</h2>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            Simulez la marge et son impact immédiat sur le prix de vente.
          </p>
        </div>
        <Button onClick={onValidate}>Valider la marge</Button>
      </div>

      <SectionCard>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => onMargin(p)}
              className={`h-11 w-20 rounded-xl border text-sm font-semibold transition-colors ${
                margin === p
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {p}%
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Personnalisée</span>
            <input
              type="number"
              value={margin}
              onChange={(e) => onMargin(Number(e.target.value) || 0)}
              className="h-11 w-20 rounded-xl border border-border bg-background px-3 text-right text-sm font-semibold tabular-nums outline-none focus:border-ring"
            />
          </div>
        </div>
        <div className="mt-7">
          <Slider
            value={[margin]}
            min={5}
            max={40}
            step={0.5}
            onValueChange={(v) => onMargin(v[0] ?? margin)}
          />
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-4">
          <Field label="Prix de revient" value={fmtMAD(revient)} />
          <Field label="Marge" value={`${fmtNum(margin, margin % 1 ? 1 : 0)} %`} />
          <Field label="Prix de vente" value={fmtMAD(vente)} />
          <Field label="Gain brut" value={fmtMAD(gain)} />
        </div>
        <div className="mt-6 flex items-center justify-between">
          <Pill tone={tone as "ok" | "warn" | "primary"}>{health}</Pill>
          <button
            onClick={() => setPerArticle((v) => !v)}
            className="text-sm font-medium text-ai hover:underline"
          >
            Ajuster par article
          </button>
        </div>
        {perArticle && (
          <div className="mt-5 divide-y divide-border border-t border-border pt-3">
            {tender.articles.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 py-3">
                <span className="truncate text-sm">{a.designation}</span>
                <input
                  type="number"
                  defaultValue={margin}
                  className="h-9 w-20 shrink-0 rounded-lg border border-border bg-background px-3 text-right text-sm tabular-nums outline-none focus:border-ring"
                />
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}

function StepFinal({
  tender,
  cost,
  margin,
  validated,
  onValidate,
}: {
  tender: Tender;
  cost: CostParams;
  margin: number;
  validated: boolean;
  onValidate: () => void;
}) {
  const { achat, revient } = computeCosts(tender.purchaseBase, cost);
  const overhead = revient / achat;
  const lines = tender.articles.map((a) => {
    const eur = Number(a.prevPrice.replace(/[^\d]/g, "")) || 500;
    const unit = eur * cost.rate * overhead * (1 + margin / 100);
    return { ...a, unit, total: unit * a.qty };
  });
  const totalHT = lines.reduce((s, l) => s + l.total, 0);

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="page-title">Offre finale</h2>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            Aperçu client — aucune donnée interne n'est affichée.
          </p>
        </div>
        <Button onClick={onValidate} disabled={validated}>
          {validated ? "Offre validée ✓" : "Valider l'offre finale"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-soft p-6">
          <p className="label-xs">Montant total HT</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums">{fmtMAD(totalHT)}</p>
        </div>
        <div className="card-soft p-6">
          <p className="label-xs">Marge moyenne</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums">
            {fmtNum(margin, 1)} %
          </p>
        </div>
        <div className="card-soft p-6">
          <p className="label-xs">État du dossier</p>
          <p className="mt-2 font-display text-2xl font-bold">{validated ? "Validé" : "Prêt"}</p>
        </div>
      </div>

      <SectionCard title={`Offre client — ${tender.client}`} subtitle={tender.reference}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2.5">Code</th>
              <th className="py-2.5">Désignation</th>
              <th className="py-2.5">Unité</th>
              <th className="py-2.5 text-right">Quantité</th>
              <th className="py-2.5 text-right">Prix unitaire</th>
              <th className="py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-b border-border/60 last:border-0">
                <td className="py-3 tabular-nums text-muted-foreground">{l.ref}</td>
                <td className="py-3 font-medium">{l.designation}</td>
                <td className="py-3 text-muted-foreground">{l.unit}</td>
                <td className="py-3 text-right tabular-nums">{l.qty}</td>
                <td className="py-3 text-right tabular-nums">{fmtMAD(l.unit)}</td>
                <td className="py-3 text-right font-semibold tabular-nums">{fmtMAD(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-5 flex justify-end border-t border-border pt-4">
          <div className="text-right">
            <p className="label-xs">Montant total HT</p>
            <p className="font-display text-xl font-bold tabular-nums">{fmtMAD(totalHT)}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Checklist du dossier">
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {[
            "Articles validés",
            "Fournisseurs sélectionnés",
            "Coûts calculés",
            "Marge validée",
            "Prix renseignés",
          ].map((c) => (
            <li key={c} className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" /> {c}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => toast("Export Excel généré")}>
            <FileSpreadsheet className="size-4" /> Exporter Excel
          </Button>
          <Button variant="outline" onClick={() => toast("PDF généré")}>
            <FileDown className="size-4" /> Générer PDF
          </Button>
        </div>
      </SectionCard>
    </>
  );
}
