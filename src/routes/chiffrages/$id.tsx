import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { AppShell } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { GhostButton, NextButton, StickyBar, TenderWorkflow } from "@/components/promat/workflow";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fmtMAD, fmtNum, type Article, type Tender } from "@/lib/promat/data";
import { useTender, type CostParams, type TenderState } from "@/lib/promat/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/chiffrages/$id")({
  head: () => ({
    meta: [
      { title: "Chiffrage du dossier — PROMAT" },
      {
        name: "description",
        content:
          "Comparatif fournisseurs, frais d'approche, douane et devises, prix de revient, marge et bordereau AO d'un dossier PROMAT.",
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

type SectionKey = "comparatif" | "frais" | "douane" | "revient" | "marge" | "bordereau";

const sections: { key: SectionKey; label: string }[] = [
  { key: "comparatif", label: "Comparatif fournisseurs" },
  { key: "frais", label: "Frais d'approche" },
  { key: "douane", label: "Douane & devises" },
  { key: "revient", label: "Prix de revient" },
  { key: "marge", label: "Marge & prix de vente" },
  { key: "bordereau", label: "Bordereau AO" },
];

type Extra = {
  assurance: number;
  transportLocal: number;
  gbpRate: number;
  allocation: "prorata" | "manuelle";
  customs: Record<string, number>;
  lineMargins: Record<string, number>;
};

const marginPresets = [15, 18, 20, 22];

function parsePrice(s: string): { price: number; currency: "EUR" | "USD" | "GBP" | "MAD" } {
  const num = Number(s.replace(/[^\d,.]/g, "").replace(/\s/g, "").replace(",", ".")) || 0;
  const currency = s.includes("USD") ? "USD" : s.includes("GBP") ? "GBP" : s.includes("MAD") ? "MAD" : "EUR";
  return { price: num, currency };
}

type Line = {
  article: Article;
  supplier: string;
  qty: number;
  unitPrice: number;
  currency: "EUR" | "USD" | "GBP" | "MAD";
  rate: number;
  delay: string;
  compliance: string;
  achat: number;
  customsPct: number;
  douane: number;
  share: number;
  fret: number;
  transit: number;
  banque: number;
  assurance: number;
  transportLocal: number;
  autres: number;
  fees: number;
  revient: number;
};

function buildLines(tender: Tender, cost: CostParams, extra: Extra): Line[] {
  const rates = { EUR: cost.rate, USD: cost.usdRate, GBP: extra.gbpRate, MAD: 1 } as const;

  const base = tender.articles.map((a) => {
    const offers = tender.offers.filter((o) => o.articleId === a.id);
    const best = offers.slice().sort((x, y) => x.price - y.price)[0];
    const fallback = parsePrice(a.prevPrice);
    const supplierName = best
      ? tender.suppliers.find((s) => s.id === best.supplierId)?.name || a.prevSupplier
      : a.prevSupplier;
    const currency = best ? ("EUR" as const) : fallback.currency;
    const unitPrice = best ? best.price : fallback.price;
    const rate = rates[currency];
    const achat = unitPrice * a.qty * rate;
    return {
      article: a,
      supplier: supplierName,
      qty: a.qty,
      unitPrice,
      currency,
      rate,
      delay: best?.delay ?? "4 sem.",
      compliance: best?.compliance ?? "Conforme",
      achat,
      customsPct: extra.customs[a.id] ?? cost.douanePct,
    };
  });

  const totalAchat = base.reduce((s, l) => s + l.achat, 0) || 1;
  const n = base.length || 1;

  return base.map((l) => {
    const share = extra.allocation === "prorata" ? l.achat / totalAchat : 1 / n;
    const fret = cost.fret * share;
    const transit = cost.transit * share;
    const banque = cost.banque * share;
    const assurance = extra.assurance * share;
    const transportLocal = extra.transportLocal * share;
    const autres = cost.autres * share;
    const fees = fret + transit + banque + assurance + transportLocal + autres;
    const douane = (l.achat * l.customsPct) / 100;
    return { ...l, share, fret, transit, banque, assurance, transportLocal, autres, fees, douane, revient: l.achat + douane + fees };
  });
}

function SectionNav({
  current,
  done,
  onSelect,
}: {
  current: SectionKey;
  done: SectionKey[];
  onSelect: (k: SectionKey) => void;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1.5">
      {sections.map((s, i) => {
        const active = s.key === current;
        const isDone = done.includes(s.key);
        return (
          <div key={s.key} className="flex items-center">
            <button
              type="button"
              onClick={() => onSelect(s.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
                active
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {isDone && !active ? (
                <Check className="size-3.5 text-success" strokeWidth={3} />
              ) : (
                <span className={cn("size-2 rounded-full", active ? "bg-primary" : "bg-border")} />
              )}
              {s.label}
            </button>
            {i < sections.length - 1 && <span className="mx-0.5 h-px w-3 bg-border" />}
          </div>
        );
      })}
    </nav>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-3.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-32 rounded-lg border border-transparent bg-transparent px-2 py-1 text-right text-[15px] font-medium tabular-nums outline-none hover:border-border focus:border-ring"
        />
        <span className="text-sm text-muted-foreground">MAD</span>
      </span>
    </div>
  );
}

function ChiffragePage() {
  const { id } = useParams({ from: "/chiffrages/$id" });
  const navigate = useNavigate();
  const { tender, state, update, addLog } = useTender(id);

  const [section, setSection] = useState<SectionKey>("comparatif");
  const [visited, setVisited] = useState<SectionKey[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [perLine, setPerLine] = useState(false);
  const [bulkRate, setBulkRate] = useState(2.5);
  const [extra, setExtra] = useState<Extra>({
    assurance: 2500,
    transportLocal: 4000,
    gbpRate: 12.5,
    allocation: "prorata",
    customs: {},
    lineMargins: {},
  });

  if (!tender || !state) {
    return (
      <AppShell>
        <div className="p-8 text-sm text-muted-foreground">Dossier introuvable.</div>
      </AppShell>
    );
  }

  const c = state.cost;
  const setCost = (patch: Partial<CostParams>) => update(id, { cost: { ...c, ...patch } });
  const go = (k: SectionKey) => {
    setVisited((v) => (v.includes(section) ? v : [...v, section]));
    setSection(k);
  };

  const lines = buildLines(tender, c, extra);
  const totalAchat = lines.reduce((s, l) => s + l.achat, 0);
  const totalDouane = lines.reduce((s, l) => s + l.douane, 0);
  const totalFees =
    c.fret + c.transit + c.banque + extra.assurance + extra.transportLocal + c.autres;
  const revient = totalAchat + totalDouane + totalFees;
  const vente = revient * (1 + state.margin / 100);
  const brute = vente - revient;
  const marginTone = state.margin >= 15 ? "ok" : "warn";
  const marginLabel = state.margin >= 15 ? "Marge saine" : "Marge faible";
  const detail = lines.find((l) => l.article.id === detailId) || null;

  return (
    <AppShell>
      <TenderWorkflow tender={tender} state={state} current="chiffrage">
        <SectionNav current={section} done={visited} onSelect={go} />

        {section === "comparatif" && (
          <SectionCard
            title="Comparatif fournisseurs"
            subtitle="Le fournisseur retenu et son prix alimentent automatiquement le chiffrage."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Article", "Fournisseur retenu", "Qté", "PU fournisseur", "Devise", "Délai", "Conformité"].map(
                      (h) => (
                        <th key={h} className="label-xs py-2.5 pr-4 font-medium">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.article.id} className="border-b border-border/60">
                      <td className="py-3 pr-4">{l.article.designation}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{l.supplier}</td>
                      <td className="py-3 pr-4 tabular-nums">{l.qty}</td>
                      <td className="py-3 pr-4 tabular-nums">{fmtNum(l.unitPrice)}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{l.currency}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{l.delay}</td>
                      <td className="py-3 pr-4">
                        <Pill tone={l.compliance === "Conforme" ? "ok" : "warn"}>{l.compliance}</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {section === "frais" && (
          <SectionCard
            title="Frais d'approche"
            subtitle="Ajoutez les coûts nécessaires pour obtenir le coût réel rendu PROMAT."
          >
            <MoneyField label="Fret" value={c.fret} onChange={(n) => setCost({ fret: n })} />
            <MoneyField label="Transit" value={c.transit} onChange={(n) => setCost({ transit: n })} />
            <MoneyField label="Frais bancaires" value={c.banque} onChange={(n) => setCost({ banque: n })} />
            <MoneyField
              label="Assurance"
              value={extra.assurance}
              onChange={(n) => setExtra({ ...extra, assurance: n })}
            />
            <MoneyField
              label="Transport local"
              value={extra.transportLocal}
              onChange={(n) => setExtra({ ...extra, transportLocal: n })}
            />
            <MoneyField label="Autres frais" value={c.autres} onChange={(n) => setCost({ autres: n })} />

            <div className="mt-4 flex items-center justify-between rounded-xl bg-navy px-5 py-4 text-navy-foreground">
              <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                Total frais d'approche
              </span>
              <span className="font-display text-2xl font-bold tabular-nums">{fmtMAD(totalFees)}</span>
            </div>

            <div className="mt-5">
              <p className="label-xs">Répartition des frais</p>
              <div className="mt-2 flex gap-2">
                {(["prorata", "manuelle"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setExtra({ ...extra, allocation: mode })}
                    className={cn(
                      "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                      extra.allocation === mode
                        ? "bg-navy text-navy-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {mode === "prorata" ? "Au prorata de la valeur d'achat" : "Manuelle"}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {section === "douane" && (
          <>
            <SectionCard title="Devises" subtitle="Devises utilisées dans ce dossier.">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "EUR / MAD", value: c.rate, set: (n: number) => setCost({ rate: n }) },
                  { label: "USD / MAD", value: c.usdRate, set: (n: number) => setCost({ usdRate: n }) },
                  {
                    label: "GBP / MAD",
                    value: extra.gbpRate,
                    set: (n: number) => setExtra({ ...extra, gbpRate: n }),
                  },
                ].map((f) => (
                  <label key={f.label} className="block">
                    <span className="label-xs">{f.label}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={f.value}
                      onChange={(e) => f.set(Number(e.target.value) || 0)}
                      className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm tabular-nums outline-none focus:border-ring"
                    />
                  </label>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Douane"
              subtitle="Modifiez le taux par ligne, ou appliquez le même taux à toutes les lignes."
              action={
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={bulkRate}
                    onChange={(e) => setBulkRate(Number(e.target.value) || 0)}
                    className="h-10 w-20 rounded-lg border border-border bg-background px-3 text-sm tabular-nums outline-none focus:border-ring"
                  />
                  <GhostButton
                    onClick={() => {
                      setExtra({
                        ...extra,
                        customs: Object.fromEntries(tender.articles.map((a) => [a.id, bulkRate])),
                      });
                      toast.success(`Taux ${fmtNum(bulkRate, 1)} % appliqué à toutes les lignes`);
                    }}
                  >
                    Appliquer le même taux
                  </GhostButton>
                </span>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {["Article", "Valeur achat MAD", "Taux douane", "Montant douane"].map((h) => (
                        <th key={h} className="label-xs py-2.5 pr-4 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.article.id} className="border-b border-border/60">
                        <td className="py-3 pr-4">{l.article.designation}</td>
                        <td className="py-3 pr-4 tabular-nums">{fmtMAD(l.achat)}</td>
                        <td className="py-3 pr-4">
                          <span className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.1"
                              value={l.customsPct}
                              onChange={(e) =>
                                setExtra({
                                  ...extra,
                                  customs: {
                                    ...extra.customs,
                                    [l.article.id]: Number(e.target.value) || 0,
                                  },
                                })
                              }
                              className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-right tabular-nums outline-none focus:border-ring"
                            />
                            <span className="text-muted-foreground">%</span>
                          </span>
                        </td>
                        <td className="py-3 pr-4 tabular-nums">{fmtMAD(l.douane)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </>
        )}

        {section === "revient" && (
          <SectionCard
            title="Prix de revient"
            subtitle="Prix de revient = Achat + Douane + Fret + Transit + Banque + Assurance + Transport local + Autres frais"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {[
                      "Ligne",
                      "Article",
                      "Fournisseur",
                      "Qté",
                      "PU devise",
                      "Devise",
                      "Taux",
                      "Achat MAD",
                      "Douane",
                      "Fret",
                      "Transit",
                      "Banque",
                      "Prix de revient",
                    ].map((h) => (
                      <th key={h} className="label-xs whitespace-nowrap py-2.5 pr-4 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr
                      key={l.article.id}
                      onClick={() => setDetailId(l.article.id)}
                      className="cursor-pointer border-b border-border/60 hover:bg-muted/60"
                    >
                      <td className="py-3 pr-4 font-mono text-xs tabular-nums text-muted-foreground">
                        {l.article.ref}
                      </td>
                      <td className="max-w-[240px] truncate py-3 pr-4">{l.article.designation}</td>
                      <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">{l.supplier}</td>
                      <td className="py-3 pr-4 tabular-nums">{l.qty}</td>
                      <td className="py-3 pr-4 tabular-nums">{fmtNum(l.unitPrice)}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{l.currency}</td>
                      <td className="py-3 pr-4 tabular-nums">{fmtNum(l.rate, 2)}</td>
                      <td className="whitespace-nowrap py-3 pr-4 tabular-nums">{fmtMAD(l.achat)}</td>
                      <td className="whitespace-nowrap py-3 pr-4 tabular-nums">{fmtMAD(l.douane)}</td>
                      <td className="whitespace-nowrap py-3 pr-4 tabular-nums">{fmtMAD(l.fret)}</td>
                      <td className="whitespace-nowrap py-3 pr-4 tabular-nums">{fmtMAD(l.transit)}</td>
                      <td className="whitespace-nowrap py-3 pr-4 tabular-nums">{fmtMAD(l.banque)}</td>
                      <td className="whitespace-nowrap py-3 pr-4 font-semibold tabular-nums">
                        {fmtMAD(l.revient)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total achat</dt>
                <dd className="tabular-nums">{fmtMAD(totalAchat)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total douane</dt>
                <dd className="tabular-nums">{fmtMAD(totalDouane)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total frais d'approche</dt>
                <dd className="tabular-nums">{fmtMAD(totalFees)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-navy px-5 py-4 text-navy-foreground">
              <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                Prix de revient global
              </span>
              <span className="font-display text-2xl font-bold tabular-nums">{fmtMAD(revient)}</span>
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground">
              Cliquez sur une ligne pour voir le détail par article.
            </p>
          </SectionCard>
        )}

        {section === "marge" && (
          <SectionCard title="Marge & prix de vente">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prix de revient global</span>
              <span className="tabular-nums">{fmtMAD(revient)}</span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {marginPresets.map((p) => (
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
              <span className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={state.margin}
                  onChange={(e) => update(id, { margin: Number(e.target.value) || 0 })}
                  className="h-10 w-24 rounded-lg border border-border bg-background px-3 text-sm tabular-nums outline-none focus:border-ring"
                />
                <span className="text-sm text-muted-foreground">Personnalisée</span>
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="label-xs">Prix de vente</p>
                <p className="font-display text-[32px] font-bold tabular-nums">{fmtMAD(vente)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Marge brute {fmtMAD(brute)} · {fmtNum(state.margin, 0)} %
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Pill tone={marginTone}>{marginLabel}</Pill>
                <button
                  onClick={() => setPerLine(true)}
                  className="text-[13px] text-muted-foreground underline-offset-4 hover:underline"
                >
                  Ajuster par article
                </button>
              </div>
            </div>
          </SectionCard>
        )}

        {section === "bordereau" && (
          <SectionCard
            title="Bordereau AO"
            subtitle="Vue client : aucune donnée fournisseur ni coût interne n'apparaît."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {[
                      "Code",
                      "Désignation",
                      "Unité",
                      "Qté demandée",
                      "Qté proposée",
                      "Prix unitaire",
                      "Remise",
                      "Total",
                    ].map((h) => (
                      <th key={h} className="label-xs whitespace-nowrap py-2.5 pr-4 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => {
                    const marginPct = extra.lineMargins[l.article.id] ?? state.margin;
                    const unitBase = (l.revient / (l.qty || 1)) * (1 + marginPct / 100);
                    const remise = state.lineDiscounts?.[l.article.id] ?? state.globalDiscount ?? 0;
                    const unit = unitBase * (1 - remise / 100);
                    const proposed = state.proposedQty?.[l.article.id] ?? l.qty;
                    return (
                      <tr key={l.article.id} className="border-b border-border/60">
                        <td className="py-3 pr-4 font-mono text-xs tabular-nums text-muted-foreground">
                          {l.article.ref}
                        </td>
                        <td className="py-3 pr-4">{l.article.designation}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{l.article.unit}</td>
                        <td className="py-3 pr-4 tabular-nums">{l.qty}</td>
                        <td className="py-3 pr-4 tabular-nums">{proposed}</td>
                        <td className="whitespace-nowrap py-3 pr-4 tabular-nums">{fmtMAD(unit)}</td>
                        <td className="py-3 pr-4 tabular-nums">{fmtNum(remise, 0)} %</td>
                        <td className="whitespace-nowrap py-3 pr-4 font-semibold tabular-nums">
                          {fmtMAD(unit * proposed)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        <ChiffrageBar
          section={section}
          go={go}
          state={state}
          revient={revient}
          totalFees={totalFees}
          margin={state.margin}
          id={id}
          onValidate={() => {
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
      </TenderWorkflow>

      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{detail?.article.designation ?? "Détail"}</SheetTitle>
          </SheetHeader>
          {detail && (
            <div className="mt-6 space-y-2 text-sm">
              {[
                ["Prix fournisseur", `${fmtNum(detail.unitPrice)} ${detail.currency}`],
                ["Quantité", String(detail.qty)],
                ["Devise", detail.currency],
                ["Taux de change", fmtNum(detail.rate, 2)],
                ["Valeur achat MAD", fmtMAD(detail.achat)],
                ["Douane", fmtMAD(detail.douane)],
                ["Part fret", fmtMAD(detail.fret)],
                ["Part transit", fmtMAD(detail.transit)],
                ["Part banque", fmtMAD(detail.banque)],
                ["Part assurance", fmtMAD(detail.assurance)],
                ["Part transport local", fmtMAD(detail.transportLocal)],
                ["Autres frais", fmtMAD(detail.autres)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="tabular-nums">{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Prix de revient unitaire</span>
                <span className="tabular-nums">{fmtMAD(detail.revient / (detail.qty || 1))}</span>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-navy px-4 py-3 text-navy-foreground">
                <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                  Prix de revient total
                </span>
                <span className="font-display text-xl font-bold tabular-nums">
                  {fmtMAD(detail.revient)}
                </span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={perLine} onOpenChange={setPerLine}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Marge par article</SheetTitle>
          </SheetHeader>
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Article", "Prix de revient", "Marge %", "Prix de vente"].map((h) => (
                  <th key={h} className="label-xs py-2 pr-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const m = extra.lineMargins[l.article.id] ?? state.margin;
                const unit = l.revient / (l.qty || 1);
                return (
                  <tr key={l.article.id} className="border-b border-border/60">
                    <td className="max-w-[160px] truncate py-2.5 pr-3">{l.article.designation}</td>
                    <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums">{fmtMAD(unit)}</td>
                    <td className="py-2.5 pr-3">
                      <input
                        type="number"
                        value={m}
                        onChange={(e) =>
                          setExtra({
                            ...extra,
                            lineMargins: {
                              ...extra.lineMargins,
                              [l.article.id]: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-right tabular-nums outline-none focus:border-ring"
                      />
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums">
                      {fmtMAD(unit * (1 + m / 100))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function ChiffrageBar({
  section,
  go,
  revient,
  totalFees,
  margin,
  id,
  state,
  onValidate,
}: {
  section: SectionKey;
  go: (k: SectionKey) => void;
  revient: number;
  totalFees: number;
  margin: number;
  id: string;
  state: TenderState;
  onValidate: () => void;
}) {
  if (section === "bordereau") {
    return (
      <StickyBar message={`Bordereau prêt · prix de vente basé sur une marge de ${fmtNum(margin, 0)} %`}>
        {state.costValidated ? (
          <NextButton to="/offres/$id" id={id} label="Préparer l'offre finale" />
        ) : (
          <NextButton label="Valider le chiffrage" onClick={onValidate} />
        )}
      </StickyBar>
    );
  }

  const next: Record<Exclude<SectionKey, "bordereau">, { key: SectionKey; label: string; msg: string }> = {
    comparatif: {
      key: "frais",
      label: "Valider et continuer vers les frais d'approche",
      msg: "Le fournisseur retenu alimente automatiquement le chiffrage.",
    },
    frais: {
      key: "douane",
      label: "Continuer vers Douane & devises",
      msg: `Total frais d'approche ${fmtMAD(totalFees)}`,
    },
    douane: {
      key: "revient",
      label: "Calculer le prix de revient",
      msg: "Les taux de change et de douane sont pris en compte immédiatement.",
    },
    revient: {
      key: "marge",
      label: "Définir la marge",
      msg: `Prix de revient global ${fmtMAD(revient)}`,
    },
    marge: {
      key: "bordereau",
      label: "Générer le bordereau",
      msg: `Prix de vente ${fmtMAD(revient * (1 + margin / 100))}`,
    },
  };
  const n = next[section as Exclude<SectionKey, "bordereau">];

  return (
    <StickyBar message={n.msg}>
      <NextButton label={n.label} onClick={() => go(n.key)} />
    </StickyBar>
  );
}
