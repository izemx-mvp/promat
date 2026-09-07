import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Download, FileText, GitCompare, Plus, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { GhostButton, StickyBar, TenderWorkflow } from "@/components/promat/workflow";
import { fmtMAD, fmtNum, type Tender } from "@/lib/promat/data";
import { computeCosts, useTender, type OfferVersion, type TenderState } from "@/lib/promat/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/offres/$id")({
  head: () => ({
    meta: [
      { title: "Offre finale, remises et versions — PROMAT" },
      {
        name: "description",
        content:
          "Offre commerciale finale PROMAT : remises globales, par article ou par famille, quantités proposées partielles, historique des versions et vue client sans données internes.",
      },
      { property: "og:title", content: "Offre finale, remises et versions — PROMAT" },
      {
        property: "og:description",
        content:
          "Remises commerciales, offres partielles et versionnage de l'offre, avec vue client sans donnée interne.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OffrePage,
});

type Params = {
  globalDiscount: number;
  lineDiscounts: Record<string, number>;
  proposedQty: Record<string, number>;
};

const MARGIN_THRESHOLD = 15;

function familyOf(designation: string) {
  return designation.split(" ")[0] ?? "Autres";
}

function buildLines(tender: Tender, state: TenderState, p: Params) {
  const { achat, revient } = computeCosts(tender.purchaseBase, state.cost);
  const landedFactor = revient / achat;
  const factor = landedFactor * (1 + state.margin / 100);

  return tender.articles.map((a) => {
    const eur = Number(a.prevPrice.replace(/[^\d]/g, "")) || 500;
    const purchase = eur * state.cost.rate;
    const landed = purchase * landedFactor;
    const puInit = purchase * factor;
    const discount = p.lineDiscounts[a.id] ?? p.globalDiscount;
    const puFinal = puInit * (1 - discount / 100);
    const qtyAsked = a.qty;
    const qtyProposed = p.proposedQty[a.id] ?? a.qty;
    return {
      ...a,
      family: familyOf(a.designation),
      purchase,
      landed,
      puInit,
      discount,
      puFinal,
      qtyAsked,
      qtyProposed,
      totalInit: puInit * qtyAsked,
      totalFinal: puFinal * qtyProposed,
      landedTotal: landed * qtyProposed,
      partial: qtyProposed < qtyAsked,
    };
  });
}

function totalsOf(tender: Tender, state: TenderState, p: Params) {
  const lines = buildLines(tender, state, p);
  const totalInit = lines.reduce((s, l) => s + l.totalInit, 0);
  const totalFinal = lines.reduce((s, l) => s + l.totalFinal, 0);
  const landedTotal = lines.reduce((s, l) => s + l.landedTotal, 0);
  const askedQty = lines.reduce((s, l) => s + l.qtyAsked, 0);
  const proposedQty = lines.reduce((s, l) => s + l.qtyProposed, 0);
  const covered = lines.filter((l) => l.qtyProposed >= l.qtyAsked && l.qtyProposed > 0).length;
  const marginAfter = totalFinal > 0 ? ((totalFinal - landedTotal) / totalFinal) * 100 : 0;
  return {
    lines,
    totalInit,
    totalFinal,
    landedTotal,
    marginAfter,
    covered,
    lineCount: lines.length,
    coverage: askedQty > 0 ? (proposedQty / askedQty) * 100 : 100,
    partialLines: lines.filter((l) => l.partial).length,
    discountPct: totalInit > 0 ? ((totalInit - totalFinal) / totalInit) * 100 : 0,
  };
}

function discountLabel(p: Params) {
  const perLine = Object.keys(p.lineDiscounts).length;
  if (perLine > 0) return `Remise partielle sur ${perLine} article${perLine > 1 ? "s" : ""}`;
  if (p.globalDiscount > 0) return `Remise globale ${fmtNum(p.globalDiscount, 1)} %`;
  return "Aucune remise";
}

function OffrePage() {
  const { id } = useParams({ from: "/offres/$id" });
  const { tender, state, update, addLog } = useTender(id);
  const [view, setView] = useState<"client" | "interne">("client");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkDiscount, setBulkDiscount] = useState(5);
  const [family, setFamily] = useState("");
  const [familyDiscount, setFamilyDiscount] = useState(5);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  if (!tender || !state) {
    return (
      <AppShell>
        <div className="p-8 text-sm text-muted-foreground">Dossier introuvable.</div>
      </AppShell>
    );
  }

  const params: Params = {
    globalDiscount: state.globalDiscount,
    lineDiscounts: state.lineDiscounts,
    proposedQty: state.proposedQty,
  };
  const t = totalsOf(tender, state, params);
  const lines = t.lines;
  const supplierName =
    tender.suppliers.find((s) => s.id === state.retainedSupplier)?.name ?? "FlowTech Germany";
  const families = Array.from(new Set(tender.articles.map((a) => familyOf(a.designation))));

  const activeVersion =
    state.versions.find((v) => v.id === state.activeVersion) ?? state.versions[0];
  const partialOffer = t.partialLines > 0;
  const marginLow = t.marginAfter < MARGIN_THRESHOLD;

  const setGlobal = (v: number) => update(id, { globalDiscount: Math.max(0, Math.min(60, v)) });

  const setLineDiscount = (articleId: string, v: number) =>
    update(id, {
      lineDiscounts: { ...state.lineDiscounts, [articleId]: Math.max(0, Math.min(60, v)) },
    });

  const setQty = (articleId: string, v: number, max: number) =>
    update(id, {
      proposedQty: { ...state.proposedQty, [articleId]: Math.max(0, Math.min(max, v)) },
    });

  const applyBulk = () => {
    if (selected.length === 0) {
      toast.error("Sélectionnez d'abord des lignes");
      return;
    }
    const next = { ...state.lineDiscounts };
    selected.forEach((a) => {
      next[a] = bulkDiscount;
    });
    update(id, { lineDiscounts: next });
    toast.success(`Remise ${bulkDiscount} % appliquée à ${selected.length} ligne(s)`);
  };

  const applyFamily = () => {
    if (!family) {
      toast.error("Choisissez une famille");
      return;
    }
    const next = { ...state.lineDiscounts };
    lines
      .filter((l) => l.family === family)
      .forEach((l) => {
        next[l.id] = familyDiscount;
      });
    update(id, { lineDiscounts: next });
    toast.success(`Remise ${familyDiscount} % appliquée à la famille ${family}`);
  };

  const resetDiscounts = () => {
    update(id, { globalDiscount: 0, lineDiscounts: {} });
    setSelected([]);
    toast.success("Remises réinitialisées");
  };

  const saveVersion = (duplicate?: OfferVersion) => {
    const base: Params = duplicate
      ? {
          globalDiscount: duplicate.globalDiscount,
          lineDiscounts: { ...duplicate.lineDiscounts },
          proposedQty: { ...duplicate.proposedQty },
        }
      : params;
    const totals = totalsOf(tender, state, base);
    const label = `V${state.versions.length + 1}`;
    const version: OfferVersion = {
      id: `${Date.now()}`,
      label,
      date: new Date().toLocaleDateString("fr-FR"),
      by: "Houda Bennani",
      discountLabel: discountLabel(base),
      total: totals.totalFinal,
      status: "Brouillon",
      globalDiscount: base.globalDiscount,
      lineDiscounts: { ...base.lineDiscounts },
      proposedQty: { ...base.proposedQty },
    };
    update(id, {
      versions: [...state.versions, version],
      activeVersion: version.id,
      globalDiscount: base.globalDiscount,
      lineDiscounts: { ...base.lineDiscounts },
      proposedQty: { ...base.proposedQty },
    });
    addLog({
      who: "Houda Bennani",
      action: `${label} créée — ${discountLabel(base)} · ${fmtMAD(totals.totalFinal)}`,
      tender: tender.reference,
      module: "Offres finales",
    });
    toast.success(`${label} enregistrée`);
  };

  const restore = (v: OfferVersion) => {
    update(id, {
      activeVersion: v.id,
      globalDiscount: v.globalDiscount,
      lineDiscounts: { ...v.lineDiscounts },
      proposedQty: { ...v.proposedQty },
    });
    toast.success(`${v.label} restaurée`);
  };

  const validateVersion = () => {
    const target = activeVersion;
    if (!target) return;
    const versions = state.versions.map((v) =>
      v.id === target.id
        ? { ...v, status: "Validée" as const, total: t.totalFinal, discountLabel: discountLabel(params) }
        : v.status === "Validée"
          ? { ...v, status: "En révision" as const }
          : v,
    );
    update(id, { versions, offerValidated: true });
    addLog({
      who: "Houda Bennani",
      action: `${target.label} validée — ${fmtMAD(t.totalFinal)}`,
      tender: tender.reference,
      module: "Offres finales",
    });
    setSummaryOpen(false);
    toast.success(`${target.label} validée`);
  };

  const toggleCompare = (vid: string) =>
    setCompare((prev) =>
      prev.includes(vid) ? prev.filter((x) => x !== vid) : [...prev.slice(-1), vid],
    );

  const clientCols = [
    "Version",
    "Code",
    "Désignation",
    "Unité",
    "Qté demandée",
    "Qté proposée",
    "PU initial",
    ...(state.showDiscountToClient ? ["Remise %"] : []),
    "PU final",
    "Total final",
  ];
  const internalCols = [
    "Code",
    "Désignation",
    "Fournisseur",
    "Prix d'achat",
    "Prix de revient",
    "Marge avant",
    "Remise %",
    "Marge après",
    "PU final",
  ];

  return (
    <AppShell>
      <TenderWorkflow tender={tender} state={state} current="offre">
        <div className="grid gap-6 sm:grid-cols-4">
          <div className="card-soft p-5">
            <p className="label-xs">Total initial HT</p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums">
              {fmtMAD(t.totalInit)}
            </p>
          </div>
          <div className="card-soft p-5">
            <p className="label-xs">Total final HT</p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums">
              {fmtMAD(t.totalFinal)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Remise {fmtNum(t.discountPct, 1)} %
            </p>
          </div>
          <div className="card-soft p-5">
            <p className="label-xs">Marge après remise</p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums">
              {fmtNum(t.marginAfter, 1)} %
            </p>
            <p className="mt-2">
              <Pill tone={marginLow ? "warn" : "ok"}>
                {marginLow ? "Marge sous seuil" : "Marge saine"}
              </Pill>
            </p>
          </div>
          <div className="card-soft p-5">
            <p className="label-xs">État de l'offre</p>
            <p className="mt-2">
              <Pill tone={partialOffer ? "warn" : "ok"}>
                {partialOffer ? "Offre partielle" : "Offre complète"}
              </Pill>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Articles couverts {t.covered} / {t.lineCount} · Quantités {fmtNum(t.coverage, 0)} %
            </p>
          </div>
        </div>

        <SectionCard
          title="Remises commerciales"
          subtitle="Remise globale, par famille ou partielle sur une sélection de lignes."
          action={<GhostButton onClick={resetDiscounts}>Réinitialiser</GhostButton>}
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <p className="label-xs">Remise globale</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  value={state.globalDiscount}
                  onChange={(e) => setGlobal(Number(e.target.value))}
                  className="w-20 rounded-lg border border-border bg-card px-3 py-2 text-sm tabular-nums"
                />
                <span className="text-sm text-muted-foreground">%</span>
                <div className="flex gap-1">
                  {[0, 2, 5, 7, 10].map((v) => (
                    <button
                      key={v}
                      onClick={() => setGlobal(v)}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        state.globalDiscount === v
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground hover:bg-muted/70",
                      )}
                    >
                      {v} %
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {fmtMAD(t.totalInit)} → <span className="font-medium text-foreground">{fmtMAD(t.totalFinal)}</span>
              </p>
            </div>

            <div>
              <p className="label-xs">Remise par lot / famille</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <option value="">Choisir une famille</option>
                  {families.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={familyDiscount}
                  onChange={(e) => setFamilyDiscount(Number(e.target.value))}
                  className="w-16 rounded-lg border border-border bg-card px-3 py-2 text-sm tabular-nums"
                />
                <GhostButton onClick={applyFamily}>Appliquer</GhostButton>
              </div>
            </div>

            <div>
              <p className="label-xs">Remise partielle (lignes sélectionnées)</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  value={bulkDiscount}
                  onChange={(e) => setBulkDiscount(Number(e.target.value))}
                  className="w-16 rounded-lg border border-border bg-card px-3 py-2 text-sm tabular-nums"
                />
                <span className="text-sm text-muted-foreground">%</span>
                <GhostButton onClick={applyBulk}>
                  Appliquer à {selected.length} ligne(s)
                </GhostButton>
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={state.showDiscountToClient}
                  onChange={(e) => update(id, { showDiscountToClient: e.target.checked })}
                />
                Afficher la colonne Remise dans la vue client
              </label>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Offre"
          subtitle={
            view === "client"
              ? "Aucune donnée interne n'apparaît dans cette vue."
              : `Fournisseur retenu : ${supplierName} · seuil de marge ${MARGIN_THRESHOLD} %`
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
                  {view === "interne" && <th className="pb-3 pr-3" />}
                  {(view === "client" ? clientCols : internalCols).map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => {
                  const marginBefore = state.margin;
                  const marginAfterLine =
                    l.puFinal > 0 ? ((l.puFinal - l.landed) / l.puFinal) * 100 : 0;
                  return (
                    <tr key={l.id} className="border-b border-border/60 last:border-0">
                      {view === "interne" && (
                        <td className="py-3.5 pr-3">
                          <input
                            type="checkbox"
                            checked={selected.includes(l.id)}
                            onChange={(e) =>
                              setSelected((prev) =>
                                e.target.checked
                                  ? [...prev, l.id]
                                  : prev.filter((x) => x !== l.id),
                              )
                            }
                          />
                        </td>
                      )}
                      {view === "client" ? (
                        <>
                          <td className="py-3.5 pr-4 text-xs text-muted-foreground">
                            {activeVersion?.label}
                          </td>
                          <td className="py-3.5 pr-4 tabular-nums text-muted-foreground">{l.ref}</td>
                          <td className="py-3.5 pr-4 font-medium">
                            {l.designation}
                            {l.partial && (
                              <span className="ml-2 align-middle">
                                <Pill tone="warn">Réponse partielle</Pill>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 pr-4 text-muted-foreground">{l.unit}</td>
                          <td className="py-3.5 pr-4 tabular-nums">{l.qtyAsked}</td>
                          <td className="py-3.5 pr-4">
                            <input
                              type="number"
                              value={l.qtyProposed}
                              onChange={(e) => setQty(l.id, Number(e.target.value), l.qtyAsked)}
                              className="w-20 rounded-md border border-border bg-card px-2 py-1 text-sm tabular-nums"
                            />
                            {l.partial && (
                              <span className="ml-2 text-xs text-warning">
                                {fmtNum((l.qtyProposed / l.qtyAsked) * 100, 0)} % couvert
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 pr-4 tabular-nums text-muted-foreground">
                            {fmtMAD(l.puInit)}
                          </td>
                          {state.showDiscountToClient && (
                            <td className="py-3.5 pr-4">
                              <input
                                type="number"
                                value={l.discount}
                                onChange={(e) => setLineDiscount(l.id, Number(e.target.value))}
                                className="w-16 rounded-md border border-border bg-card px-2 py-1 text-sm tabular-nums"
                              />
                            </td>
                          )}
                          <td className="py-3.5 pr-4 tabular-nums">{fmtMAD(l.puFinal)}</td>
                          <td className="py-3.5 font-medium tabular-nums">{fmtMAD(l.totalFinal)}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-3.5 pr-4 tabular-nums text-muted-foreground">{l.ref}</td>
                          <td className="py-3.5 pr-4 font-medium">{l.designation}</td>
                          <td className="py-3.5 pr-4 text-muted-foreground">{supplierName}</td>
                          <td className="py-3.5 pr-4 tabular-nums">{fmtMAD(l.purchase)}</td>
                          <td className="py-3.5 pr-4 tabular-nums">{fmtMAD(l.landed)}</td>
                          <td className="py-3.5 pr-4 tabular-nums">{fmtNum(marginBefore, 1)} %</td>
                          <td className="py-3.5 pr-4">
                            <input
                              type="number"
                              value={l.discount}
                              onChange={(e) => setLineDiscount(l.id, Number(e.target.value))}
                              className="w-16 rounded-md border border-border bg-card px-2 py-1 text-sm tabular-nums"
                            />
                          </td>
                          <td
                            className={cn(
                              "py-3.5 pr-4 tabular-nums",
                              marginAfterLine < MARGIN_THRESHOLD && "font-medium text-warning",
                            )}
                          >
                            {fmtNum(marginAfterLine, 1)} %
                          </td>
                          <td className="py-3.5 font-medium tabular-nums">{fmtMAD(l.puFinal)}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
                <tr>
                  <td
                    colSpan={
                      view === "client" ? clientCols.length - 1 : internalCols.length
                    }
                    className="pt-4 text-right font-medium"
                  >
                    Total {view === "client" ? "final HT" : "PU final"}
                  </td>
                  <td className="pt-4 font-display text-lg font-bold tabular-nums">
                    {fmtMAD(t.totalFinal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Versions de l'offre"
          subtitle="Aucune version n'est écrasée : chaque modification de prix crée une nouvelle version."
          action={
            <div className="flex flex-wrap gap-2">
              <GhostButton onClick={() => saveVersion()}>
                <Plus className="size-4" /> Créer une nouvelle version
              </GhostButton>
              <GhostButton
                onClick={() => (activeVersion ? saveVersion(activeVersion) : undefined)}
              >
                <Copy className="size-4" /> Dupliquer la version
              </GhostButton>
              <GhostButton
                onClick={() =>
                  compare.length === 2
                    ? setCompareOpen(true)
                    : toast.error("Sélectionnez deux versions à comparer")
                }
              >
                <GitCompare className="size-4" /> Comparer les versions
              </GhostButton>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["", "Version", "Date", "Créée par", "Remise", "Total", "Statut", "Actions"].map(
                    (h, i) => (
                      <th
                        key={i}
                        className="whitespace-nowrap pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {state.versions.map((v) => {
                  const vp: Params = {
                    globalDiscount: v.globalDiscount,
                    lineDiscounts: v.lineDiscounts,
                    proposedQty: v.proposedQty,
                  };
                  const vt = totalsOf(tender, state, vp);
                  const isActive = v.id === state.activeVersion;
                  return (
                    <tr key={v.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3.5 pr-4">
                        <input
                          type="checkbox"
                          checked={compare.includes(v.id)}
                          onChange={() => toggleCompare(v.id)}
                        />
                      </td>
                      <td className="py-3.5 pr-4 font-medium">
                        {v.label}
                        {isActive && (
                          <span className="ml-2 align-middle">
                            <Pill tone="primary">Active</Pill>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">{v.date}</td>
                      <td className="py-3.5 pr-4 text-muted-foreground">{v.by}</td>
                      <td className="py-3.5 pr-4">{isActive ? discountLabel(params) : v.discountLabel}</td>
                      <td className="py-3.5 pr-4 tabular-nums">
                        {fmtMAD(isActive ? t.totalFinal : vt.totalFinal)}
                      </td>
                      <td className="py-3.5 pr-4">
                        <Pill
                          tone={
                            v.status === "Validée" ? "ok" : v.status === "En révision" ? "warn" : "neutral"
                          }
                        >
                          {v.status}
                        </Pill>
                      </td>
                      <td className="py-3.5">
                        <div className="flex gap-3 text-xs font-medium">
                          <button
                            onClick={() => restore(v)}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <RotateCcw className="size-3.5" /> Restaurer
                          </button>
                          <button
                            onClick={() => {
                              restore(v);
                              setSummaryOpen(true);
                            }}
                            className="text-primary hover:underline"
                          >
                            Valider cette version
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Checklist de dépôt">
          <ul className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["Articles validés", state.articlesValidated],
                ["Fournisseurs retenus", Boolean(state.retainedSupplier)],
                ["Prix de revient calculé", state.costValidated],
                ["Marge validée", state.marginValidated],
                ["Marge après remise au-dessus du seuil", !marginLow],
                ["Quantités proposées confirmées", !partialOffer],
              ] as [string, boolean][]
            ).map(([label, ok]) => (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  ok ? "text-success" : "text-warning",
                )}
              >
                <Check className="size-4" strokeWidth={3} /> {label}
              </li>
            ))}
          </ul>
        </SectionCard>

        <StickyBar
          message={
            <>
              {activeVersion?.label} · {fmtMAD(t.totalFinal)} · remise {fmtNum(t.discountPct, 1)} % ·
              marge {fmtNum(t.marginAfter, 1)} %
              {partialOffer && ` · ${t.partialLines} ligne(s) partielle(s)`}
            </>
          }
        >
          <GhostButton onClick={() => saveVersion()}>
            <Plus className="size-4" /> Enregistrer comme nouvelle version
          </GhostButton>
          <GhostButton onClick={() => toast.success("Export Excel généré")}>
            <Download className="size-4" /> Exporter Excel
          </GhostButton>
          <GhostButton onClick={() => toast.success("PDF généré")}>
            <FileText className="size-4" /> Générer PDF
          </GhostButton>
          <button
            onClick={() => setSummaryOpen(true)}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Valider cette version
          </button>
        </StickyBar>

        <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Valider {activeVersion?.label}</DialogTitle>
              <DialogDescription>
                Vérifiez le récapitulatif avant de figer cette version de l'offre.
              </DialogDescription>
            </DialogHeader>
            <dl className="space-y-2 text-sm">
              {[
                ["Version", activeVersion?.label ?? "V1"],
                ["Total initial", fmtMAD(t.totalInit)],
                ["Remise", `${fmtNum(t.discountPct, 1)} % (${discountLabel(params)})`],
                ["Total final", fmtMAD(t.totalFinal)],
                ["Lignes partielles", String(t.partialLines)],
                ["Marge après remise", `${fmtNum(t.marginAfter, 1)} %`],
                [
                  "État",
                  `${partialOffer ? "Offre partielle" : "Offre complète"} · ${t.covered}/${t.lineCount} articles`,
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-border/60 pb-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            {marginLow && (
              <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
                Marge sous seuil ({MARGIN_THRESHOLD} %) — attention avant validation.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <GhostButton onClick={() => saveVersion()}>
                Enregistrer comme nouvelle version
              </GhostButton>
              <button
                onClick={validateVersion}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Valider cette version
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Sheet open={compareOpen} onOpenChange={setCompareOpen}>
          <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Comparer les versions</SheetTitle>
            </SheetHeader>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {compare.map((vid) => {
                const v = state.versions.find((x) => x.id === vid);
                if (!v) return null;
                const vt = totalsOf(tender, state, {
                  globalDiscount: v.globalDiscount,
                  lineDiscounts: v.lineDiscounts,
                  proposedQty: v.proposedQty,
                });
                return (
                  <div key={vid} className="card-soft p-4">
                    <p className="font-display text-lg font-bold">{v.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {v.date} · {v.by}
                    </p>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div>
                        <dt className="label-xs">Remise</dt>
                        <dd>{v.discountLabel}</dd>
                      </div>
                      <div>
                        <dt className="label-xs">Total final</dt>
                        <dd className="tabular-nums">{fmtMAD(vt.totalFinal)}</dd>
                      </div>
                      <div>
                        <dt className="label-xs">Marge après remise</dt>
                        <dd className="tabular-nums">{fmtNum(vt.marginAfter, 1)} %</dd>
                      </div>
                      <div>
                        <dt className="label-xs">Lignes partielles</dt>
                        <dd className="tabular-nums">{vt.partialLines}</dd>
                      </div>
                      <div>
                        <dt className="label-xs">Statut</dt>
                        <dd>{v.status}</dd>
                      </div>
                    </dl>
                    <div className="mt-4">
                      <GhostButton onClick={() => restore(v)}>Restaurer</GhostButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </TenderWorkflow>
    </AppShell>
  );
}
