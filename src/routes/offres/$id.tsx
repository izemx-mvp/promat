import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Download, FileText, Plus, Save } from "lucide-react";
import { AppShell } from "@/components/promat/shell";
import { Pill } from "@/components/promat/ui";
import { GhostButton, StickyBar, TenderWorkflow } from "@/components/promat/workflow";
import { fmtMAD, fmtNum, type Tender } from "@/lib/promat/data";
import { computeCosts, useTender, type TenderState } from "@/lib/promat/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/offres/$id")({
  head: () => ({
    meta: [
      { title: "Offre finale, remises et versions — PROMAT" },
      {
        name: "description",
        content:
          "Offre commerciale finale PROMAT : quantités proposées, remise globale ou par article, versions de l'offre et total final.",
      },
      { property: "og:title", content: "Offre finale, remises et versions — PROMAT" },
      {
        property: "og:description",
        content:
          "Ajustez les quantités proposées, appliquez une remise et créez des versions de l'offre PROMAT.",
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

function buildLines(tender: Tender, state: TenderState, raw: Partial<Params>) {
  const p: Params = {
    globalDiscount: raw.globalDiscount ?? 0,
    lineDiscounts: raw.lineDiscounts ?? {},
    proposedQty: raw.proposedQty ?? {},
  };
  const { achat, revient } = computeCosts(tender.purchaseBase, state.cost);
  const factor = (revient / achat) * (1 + state.margin / 100);

  return tender.articles.map((a) => {
    const eur = Number(a.prevPrice.replace(/[^\d]/g, "")) || 500;
    const puInit = eur * state.cost.rate * factor;
    const discount = p.lineDiscounts[a.id] ?? p.globalDiscount;
    const puFinal = puInit * (1 - discount / 100);
    const qtyProposed = p.proposedQty[a.id] ?? a.qty;
    return {
      ...a,
      puInit,
      discount,
      puFinal,
      qtyAsked: a.qty,
      qtyProposed,
      totalInit: puInit * a.qty,
      totalFinal: puFinal * qtyProposed,
      partial: qtyProposed < a.qty,
    };
  });
}

function totalsOf(tender: Tender, state: TenderState, p: Partial<Params>) {
  const lines = buildLines(tender, state, p);
  const totalInit = lines.reduce((s, l) => s + l.totalInit, 0);
  const totalFinal = lines.reduce((s, l) => s + l.totalFinal, 0);
  return {
    lines,
    totalInit,
    totalFinal,
    discountPct: totalInit > 0 ? ((totalInit - totalFinal) / totalInit) * 100 : 0,
    partialLines: lines.filter((l) => l.partial).length,
  };
}

function discountLabel(p: Partial<Params>) {
  const perLine = Object.keys(p.lineDiscounts ?? {}).length;
  if (perLine > 0) return `Remise sur ${perLine} article${perLine > 1 ? "s" : ""}`;
  if ((p.globalDiscount ?? 0) > 0) return `Remise ${fmtNum(p.globalDiscount ?? 0, 0)} %`;
  return "Offre initiale";
}

function OffrePage() {
  const { id } = useParams({ from: "/offres/$id" });
  const { tender, state, update, addLog } = useTender(id);
  const [view, setView] = useState<"interne" | "client">("interne");
  const [customOpen, setCustomOpen] = useState(false);

  if (!tender || !state) {
    return (
      <AppShell>
        <div className="p-8 text-sm text-muted-foreground">Dossier introuvable.</div>
      </AppShell>
    );
  }

  const params: Params = {
    globalDiscount: state.globalDiscount ?? 0,
    lineDiscounts: state.lineDiscounts ?? {},
    proposedQty: state.proposedQty ?? {},
  };
  const t = totalsOf(tender, state, params);
  const versions = state.versions ?? [];
  const active = versions.find((v) => v.id === state.activeVersion) ?? versions[0];

  const setGlobal = (v: number) => {
    update(id, { globalDiscount: Math.max(0, Math.min(60, v)), lineDiscounts: {} });
  };

  const setLineDiscount = (articleId: string, v: number) => {
    update(id, {
      lineDiscounts: {
        ...(state.lineDiscounts ?? {}),
        [articleId]: Math.max(0, Math.min(60, v)),
      },
    });
  };

  const setQty = (articleId: string, v: number, max: number) => {
    update(id, {
      proposedQty: { ...(state.proposedQty ?? {}), [articleId]: Math.max(0, Math.min(max, v)) },
    });
  };

  const newVersion = (duplicate = false) => {
    const label = `V${versions.length + 1}`;
    const version = {
      id: `v${versions.length + 1}-${Date.now()}`,
      label,
      date: new Date().toLocaleDateString("fr-FR"),
      by: "Houda Bennani",
      discountLabel: discountLabel(params),
      total: t.totalFinal,
      status: "Brouillon" as const,
      globalDiscount: params.globalDiscount,
      lineDiscounts: { ...params.lineDiscounts },
      proposedQty: { ...params.proposedQty },
    };
    update(id, { versions: [...versions, version], activeVersion: version.id });
    addLog({
      who: "Houda Bennani",
      action: duplicate ? `${label} dupliquée` : `${label} créée`,
      tender: `AO ${tender.client}`,
      module: "Offres finales",
    });
    toast.success(`${label} enregistrée`);
  };

  const loadVersion = (vid: string) => {
    const v = versions.find((x) => x.id === vid);
    if (!v) return;
    update(id, {
      activeVersion: v.id,
      globalDiscount: v.globalDiscount ?? 0,
      lineDiscounts: { ...(v.lineDiscounts ?? {}) },
      proposedQty: { ...(v.proposedQty ?? {}) },
    });
  };

  const validate = () => {
    update(id, {
      offerValidated: true,
      versions: versions.map((v) =>
        v.id === active?.id
          ? { ...v, status: "Validée" as const, total: t.totalFinal, discountLabel: discountLabel(params) }
          : v,
      ),
    });
    addLog({
      who: "Houda Bennani",
      action: `Offre ${active?.label ?? "V1"} validée`,
      tender: `AO ${tender.client}`,
      module: "Offres finales",
    });
    toast.success("Offre validée");
  };

  const presets = [0, 5, 10];

  return (
    <AppShell>
      <TenderWorkflow tender={tender} state={state} current="offre">
        {/* Version + vue */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Offre finale</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajustez les quantités proposées et la remise, puis enregistrez une version.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="label-xs">Version</span>
              <select
                value={active?.id ?? ""}
                onChange={(e) => loadVersion(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} — {v.discountLabel}
                  </option>
                ))}
              </select>
            </label>
            <GhostButton onClick={() => newVersion()}>
              <Plus className="size-4" /> Nouvelle version
            </GhostButton>
            <GhostButton onClick={() => newVersion(true)}>
              <Copy className="size-4" /> Dupliquer
            </GhostButton>
          </div>
        </div>

        {/* Remise globale */}
        <div className="card-soft flex flex-wrap items-center gap-x-6 gap-y-3 p-5">
          <p className="label-xs">Remise globale</p>
          <div className="flex flex-wrap items-center gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setCustomOpen(false);
                  setGlobal(p);
                }}
                className={cn(
                  "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                  !customOpen &&
                    params.globalDiscount === p &&
                    Object.keys(params.lineDiscounts).length === 0
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                {p} %
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomOpen(true)}
              className={cn(
                "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                customOpen ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:bg-muted",
              )}
            >
              Personnalisée
            </button>
            {customOpen && (
              <input
                type="number"
                min={0}
                max={60}
                value={params.globalDiscount}
                onChange={(e) => setGlobal(Number(e.target.value))}
                className="w-20 rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
            )}
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-lg bg-muted p-1">
            {(["interne", "client"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                  view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {v === "interne" ? "Vue interne" : "Vue client"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card-soft overflow-x-auto p-2">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left label-xs">
                <th className="px-4 py-3">Article</th>
                {view === "interne" && <th className="px-4 py-3 text-right">Qté demandée</th>}
                <th className="px-4 py-3 text-right">Qté proposée</th>
                <th className="px-4 py-3 text-right">Prix unitaire</th>
                <th className="px-4 py-3 text-right">Remise</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {t.lines.map((l) => (
                <tr key={l.id} className="border-t border-border/60">
                  <td className="px-4 py-4">
                    <p className="font-medium">{l.designation}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {l.ref} · {l.unit}
                    </p>
                  </td>
                  {view === "interne" && (
                    <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">
                      {l.qtyAsked}
                    </td>
                  )}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {view === "interne" ? (
                        <input
                          type="number"
                          min={0}
                          max={l.qtyAsked}
                          value={l.qtyProposed}
                          onChange={(e) => setQty(l.id, Number(e.target.value), l.qtyAsked)}
                          className="w-20 rounded-lg border border-border bg-card px-2.5 py-1.5 text-right text-sm tabular-nums"
                        />
                      ) : (
                        <span className="tabular-nums">{l.qtyProposed}</span>
                      )}
                      {l.partial && <Pill tone="warn">Partiel</Pill>}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums">{fmtMAD(l.puFinal)}</td>
                  <td className="px-4 py-4 text-right">
                    {view === "interne" ? (
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={l.discount}
                        onChange={(e) => setLineDiscount(l.id, Number(e.target.value))}
                        className="w-16 rounded-lg border border-border bg-card px-2.5 py-1.5 text-right text-sm tabular-nums"
                      />
                    ) : (
                      <span className="tabular-nums">{fmtNum(l.discount, 0)} %</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold tabular-nums">
                    {fmtMAD(l.totalFinal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="card-soft ml-auto w-full max-w-sm p-6">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Total avant remise</span>
            <span className="tabular-nums">{fmtMAD(t.totalInit)}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Remise</span>
            <span className="tabular-nums">{fmtNum(t.discountPct, 1)} %</span>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <p className="label-xs">Total final</p>
            <p className="mt-1 font-display text-[30px] font-bold tabular-nums">
              {fmtMAD(t.totalFinal)}
            </p>
            {t.partialLines > 0 && (
              <Pill tone="warn" className="mt-2">
                {t.partialLines} ligne{t.partialLines > 1 ? "s" : ""} partielle
                {t.partialLines > 1 ? "s" : ""}
              </Pill>
            )}
          </div>
        </div>

        {state.offerValidated && (
          <div>
            <h2 className="section-title">Envoyer l'offre au client</h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Choisissez le canal, vérifiez le contact et le message, puis envoyez.
            </p>
            <OfferSendPanel
              tender={tender}
              state={state}
              versionLabel={active?.label ?? "V1"}
              total={t.totalFinal}
              onSend={(send) => {
                update(id, { sends: [...(state.sends ?? []), send] });
                addLog({
                  who: "Houda Bennani",
                  action: `Offre ${send.version} envoyée par ${send.channel} à ${send.recipient}`,
                  tender: `AO ${tender.client}`,
                  module: "Offres finales",
                });
              }}
              onOutcome={(outcome) => update(id, { clientOutcome: outcome })}
              onNewVersion={() => {
                newVersion();
                update(id, { offerValidated: false });
              }}
            />
          </div>
        )}


        <StickyBar
          message={
            <>
              {active?.label ?? "V1"} · {discountLabel(params)} ·{" "}
              <span className="font-semibold text-foreground">{fmtMAD(t.totalFinal)}</span>
            </>
          }
        >
          <GhostButton onClick={() => toast.success("Export Excel généré (démo)")}>
            <Download className="size-4" /> Exporter Excel
          </GhostButton>
          <GhostButton onClick={() => toast.success("PDF généré (démo)")}>
            <FileText className="size-4" /> Générer PDF
          </GhostButton>
          <GhostButton onClick={() => toast.success("Offre enregistrée")}>
            <Save className="size-4" /> Enregistrer
          </GhostButton>
          <GhostButton onClick={() => newVersion()}>
            <Plus className="size-4" /> Créer une nouvelle version
          </GhostButton>
          <button
            type="button"
            onClick={validate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Check className="size-4" /> Valider l'offre
          </button>
        </StickyBar>
      </TenderWorkflow>
    </AppShell>
  );
}
