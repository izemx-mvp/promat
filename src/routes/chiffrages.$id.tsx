import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  History,
  Loader2,
  PanelRightOpen,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/promat/AppShell";
import {
  AgentBanner,
  DecisionRailContent,
  Metric,
  PageHeader,
  SectionCard,
  StatusBadge,
  WorkflowTimeline,
} from "@/components/promat/ui";
import { usePromat, newId } from "@/lib/promat/store";
import { computeCosting, fmtDate, fmtInt, fmtMAD, recommendSupplier } from "@/lib/promat/calc";
import type { Allocation, Devise, Fee } from "@/lib/promat/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chiffrages/$id")({
  head: () => ({
    meta: [
      { title: "Chiffrage — PROMAT" },
      { name: "description", content: "Comparatif fournisseurs, douane, frais d'approche, prix de revient et marge PROMAT." },
      { property: "og:title", content: "Chiffrage — PROMAT" },
      { property: "og:description", content: "Espace de chiffrage complet : landed cost, marge et bordereau client." },
    ],
  }),
  component: ChiffrageWorkspace,
});

const DEVISES: Devise[] = ["MAD", "EUR", "USD", "GBP", "CNY"];
const ALLOCATIONS: Allocation[] = ["Prorata valeur achat", "Prorata quantité", "Prorata poids", "Montant fixe", "Répartition manuelle"];
const TYPES_FRAIS = ["Fret", "Transit", "Banque", "Assurance", "Manutention", "Transport local", "Inspection", "Divers"];

function ChiffrageWorkspace() {
  const { id } = useParams({ from: "/chiffrages/$id" });
  const promat = usePromat();
  const navigate = useNavigate();
  const [tab, setTab] = useState("comparatif");
  const [vueClient, setVueClient] = useState(false);
  const [simulation, setSimulation] = useState<number | null>(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justification, setJustification] = useState("");
  const [compare, setCompare] = useState<string[]>([]);
  const [tasks, setTasks] = useState([
    { label: "Valider les fournisseurs retenus", done: false },
    { label: "Vérifier les taux de douane", done: false },
    { label: "Confirmer le taux EUR", done: false },
    { label: "Valider la marge", done: false },
    { label: "Ajouter la fiche technique manquante", done: false },
  ]);

  const costing = promat.costings.find((c) => c.id === id);
  const tender = promat.tenders.find((t) => t.id === costing?.tenderId);
  const articles = useMemo(() => promat.articles.filter((a) => a.tenderId === costing?.tenderId), [promat.articles, costing]);
  const quotes = useMemo(() => promat.quotes.filter((q) => q.tenderId === costing?.tenderId), [promat.quotes, costing]);
  const suppliersQuoting = useMemo(
    () => promat.suppliers.filter((s) => quotes.some((q) => q.supplierId === s.id)),
    [promat.suppliers, quotes],
  );

  const effectiveCosting = useMemo(
    () => (costing && simulation !== null ? { ...costing, margeGlobale: simulation } : costing),
    [costing, simulation],
  );

  const { lines, totals } = useMemo(
    () =>
      effectiveCosting
        ? computeCosting(articles, effectiveCosting, quotes, promat.suppliers, promat.rates)
        : { lines: [], totals: { achats: 0, frais: 0, douane: 0, prixRevient: 0, venteHT: 0, margeBrute: 0, margeMoyenne: 0 } },
    [articles, effectiveCosting, quotes, promat.suppliers, promat.rates],
  );

  if (!costing || !tender) {
    return (
      <AppShell variant="finance">
        <SectionCard title="Chiffrage introuvable">
          <Button onClick={() => navigate({ to: "/chiffrages" })}>Retour aux chiffrages</Button>
        </SectionCard>
      </AppShell>
    );
  }

  const controlesFinanciers = [
    { label: "Toutes les lignes du bordereau sont présentes", ok: lines.length === articles.length },
    { label: "Chaque ligne dispose d'un prix fournisseur", ok: lines.every((l) => l.pu > 0) },
    { label: "Aucune quantité modifiée par rapport au bordereau AO", ok: true },
    { label: "Aucune unité modifiée", ok: true },
    { label: "Aucun code article modifié", ok: true },
    { label: "Aucune ligne dupliquée", ok: new Set(lines.map((l) => l.article.ligne)).size === lines.length },
    { label: "Aucune ligne supplémentaire non autorisée", ok: true },
    { label: "Total du bordereau cohérent avec la somme des lignes", ok: Math.abs(lines.reduce((s, l) => s + l.totalHT, 0) - totals.venteHT) < 1 },
    { label: "Arrondis à 2 décimales respectés", ok: true },
  ];

  const readiness = {
    Administratif: tender.admin.map((a) => ({ label: a.label, ok: a.statut === "Disponible" })),
    Technique: [
      { label: "Fiches techniques rattachées", ok: promat.documents.some((d) => d.categorie === "Technique" && d.statut === "Validé") },
      { label: "Conformité technique validée sur toutes les lignes", ok: lines.every((l) => l.conformite >= 90) },
      { label: "Certificat de conformité eau potable confirmé", ok: false },
    ],
    Financier: [
      { label: "Tous les fournisseurs retenus", ok: lines.every((l) => !!l.supplierId) },
      { label: "Taux de change confirmés", ok: true },
      { label: "Douane renseignée sur chaque ligne", ok: lines.every((l) => costing.customs[l.articleId] !== undefined) },
      { label: "Marge au-dessus du seuil critique", ok: totals.margeMoyenne >= 12 },
    ],
  };
  const allChecks = Object.values(readiness).flat().concat(controlesFinanciers.map((c) => ({ label: c.label, ok: c.ok })));
  const readinessScore = Math.round((allChecks.filter((c) => c.ok).length / allChecks.length) * 100);
  const blockers = allChecks.filter((c) => !c.ok);

  const setSelection = (articleId: string, supplierId: string) => {
    promat.updateCosting(costing.id, { selections: { ...costing.selections, [articleId]: supplierId } });
    promat.log("Fournisseur sélectionné", `${tender.ref} — ${articles.find((a) => a.id === articleId)?.designation}`, undefined, promat.suppliers.find((s) => s.id === supplierId)?.nom);
    toast.success("Fournisseur sélectionné — recalcul du prix de revient effectué.");
  };

  const rail = (
    <DecisionRailContent
      tasks={tasks}
      onToggleTask={(i) => setTasks((t) => t.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
      echeance={`Dépôt de l'offre le ${fmtDate(tender.dateLimite)}`}
      risque={totals.margeMoyenne < 15 ? `Marge moyenne à ${totals.margeMoyenne.toFixed(1)} %, sous le seuil recommandé de 20 %.` : "Volatilité de change EUR/MAD sur 90 jours."}
      recommandation={`Prix de revient ${fmtInt(totals.prixRevient)} MAD — offre PROMAT conseillée à ${fmtInt(totals.venteHT)} MAD HT.`}
      ctaLabel="Valider le chiffrage"
      onCta={() => setValidationOpen(true)}
    />
  );

  return (
    <AppShell variant="finance">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <PageHeader
          title={`Chiffrage — ${tender.ref}`}
          subtitle={`${tender.client} — ${tender.objet}`}
          actions={
            <>
              <StatusBadge>{costing.statut}</StatusBadge>
              <Button variant="outline" onClick={() => navigate({ to: "/appels-offres/$id", params: { id: tender.id } })}>Voir l'AO</Button>
              <Button onClick={() => setValidationOpen(true)}>Valider le chiffrage</Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="2xl:hidden"><PanelRightOpen className="size-4" /> Décisions</Button>
                </SheetTrigger>
                <SheetContent className="w-[min(24rem,100vw-2rem)] overflow-y-auto">
                  <SheetHeader><SheetTitle>Rail de décision</SheetTitle><SheetDescription>Agent Chiffrage</SheetDescription></SheetHeader>
                  <div className="p-4">{rail}</div>
                </SheetContent>
              </Sheet>
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-7">
          <Metric label="Articles" value={String(articles.length)} />
          <Metric label="Fournisseurs" value={String(new Set(Object.values(costing.selections)).size)} />
          <Metric label="Achats" value={`${fmtInt(totals.achats)} MAD`} />
          <Metric label="Frais + douane" value={`${fmtInt(totals.frais + totals.douane)} MAD`} />
          <Metric label="Prix de revient" value={`${fmtInt(totals.prixRevient)} MAD`} />
          <Metric label="Offre PROMAT" value={`${fmtInt(totals.venteHT)} MAD`} />
          <Metric label="Marge" value={`${totals.margeMoyenne.toFixed(1)} %`} tone={totals.margeMoyenne < 15 ? "danger" : "success"} />
        </div>

        <WorkflowTimeline stageIndex={Math.max(tender.stageIndex, 7)} />

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                {[
                  ["comparatif", "Comparatif fournisseurs"],
                  ["frais", "Frais d'approche"],
                  ["douane", "Douane & devises"],
                  ["pr", "Prix de revient"],
                  ["marge", "Marge & prix de vente"],
                  ["bordereau", "Bordereau AO"],
                  ["controles", "Contrôles"],
                  ["versions", "Versions"],
                ].map(([v, l]) => (
                  <TabsTrigger key={v} value={v} className="text-xs">{l}</TabsTrigger>
                ))}
              </TabsList>

              {/* COMPARATIF */}
              <TabsContent value="comparatif" className="mt-4 flex flex-col gap-4">
                <AgentBanner
                  titre="Recommandation Agent Chiffrage"
                  message="Évaluation multi-critères : conformité technique, coût rendu, délai, Genuine/OEM, origine, Incoterm, fiabilité historique et validité du devis."
                />
                <SectionCard noPadding>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1400px] text-xs">
                      <thead className="bg-surface-2 text-left text-[11px] text-muted-foreground uppercase">
                        <tr>
                          <th className="sticky left-0 z-10 bg-surface-2 px-3 py-2 font-semibold">Ligne</th>
                          <th className="px-3 py-2 font-semibold">Désignation</th>
                          <th className="px-3 py-2 font-semibold">Qté</th>
                          {suppliersQuoting.map((s) => (
                            <th key={s.id} colSpan={6} className="border-l border-border px-3 py-2 text-center font-semibold">{s.nom}</th>
                          ))}
                          <th className="border-l border-border px-3 py-2 font-semibold">Recommandation</th>
                          <th className="px-3 py-2 font-semibold">Fournisseur retenu</th>
                        </tr>
                        <tr className="text-[10px]">
                          <th className="sticky left-0 z-10 bg-surface-2 px-3 py-1" />
                          <th className="px-3 py-1" />
                          <th className="px-3 py-1" />
                          {suppliersQuoting.map((s) => (
                            ["PU", "Dev.", "Réf.", "G/OEM", "Délai", "Conf."].map((h, i) => (
                              <th key={s.id + h} className={cn("px-2 py-1 font-medium", i === 0 && "border-l border-border")}>{h}</th>
                            ))
                          ))}
                          <th className="border-l border-border px-3 py-1" />
                          <th className="px-3 py-1" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {articles.map((a) => {
                          const reco = recommendSupplier(a, quotes, promat.suppliers, promat.rates, costing.customs[a.id] ?? 0);
                          return (
                            <tr key={a.id} className="hover:bg-accent/50">
                              <td className="num sticky left-0 z-10 bg-card px-3 py-2 font-semibold">{a.ligne}</td>
                              <td className="max-w-[180px] truncate px-3 py-2">{a.designation}</td>
                              <td className="num px-3 py-2 text-right">{a.qte}</td>
                              {suppliersQuoting.map((s) => {
                                const q = quotes.find((x) => x.supplierId === s.id && x.lignes.some((l) => l.articleId === a.id));
                                const l = q?.lignes.find((x) => x.articleId === a.id);
                                return (
                                  <>
                                    <td key={s.id + "pu"} className="num border-l border-border px-2 py-2 text-right">{l ? fmtMAD(l.pu, 0) : "—"}</td>
                                    <td key={s.id + "d"} className="num px-2 py-2">{q?.devise ?? "—"}</td>
                                    <td key={s.id + "r"} className="max-w-[110px] truncate px-2 py-2">{l?.refProposee ?? "—"}</td>
                                    <td key={s.id + "g"} className="px-2 py-2">{l?.genuine ?? "—"}</td>
                                    <td key={s.id + "de"} className="num px-2 py-2 text-right">{l ? `${l.delaiSemaines} s` : "—"}</td>
                                    <td key={s.id + "c"} className="num px-2 py-2 text-right">{l ? `${l.conformite}%` : "—"}</td>
                                  </>
                                );
                              })}
                              <td className="border-l border-border px-3 py-2">
                                {reco ? (
                                  <div>
                                    <p className="font-semibold">{reco.supplier.nom}</p>
                                    <p className="num text-[10px] text-muted-foreground">Score {reco.score}/100 — {fmtInt(reco.coutRenduMAD)} MAD rendu</p>
                                    <Button size="sm" variant="ghost" className="mt-1 h-6 text-[10px]" onClick={() => setSelection(a.id, reco.supplier.id)}>Retenir</Button>
                                  </div>
                                ) : "—"}
                              </td>
                              <td className="px-3 py-2">
                                <Select value={costing.selections[a.id] ?? ""} onValueChange={(v) => setSelection(a.id, v)}>
                                  <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Choisir" /></SelectTrigger>
                                  <SelectContent>
                                    {suppliersQuoting
                                      .filter((s) => quotes.some((q) => q.supplierId === s.id && q.lignes.some((l) => l.articleId === a.id)))
                                      .map((s) => <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
                <div className="flex flex-wrap gap-2">
                  {suppliersQuoting.map((s) => (
                    <Button
                      key={s.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const next = { ...costing.selections };
                        articles.forEach((a) => {
                          if (quotes.some((q) => q.supplierId === s.id && q.lignes.some((l) => l.articleId === a.id))) next[a.id] = s.id;
                        });
                        promat.updateCosting(costing.id, { selections: next });
                        promat.log("Fournisseur appliqué en masse", `${tender.ref} — ${s.nom}`);
                        toast.success(`${s.nom} appliqué aux lignes compatibles.`);
                      }}
                    >
                      Appliquer {s.nom} aux lignes compatibles
                    </Button>
                  ))}
                </div>
              </TabsContent>

              {/* FRAIS */}
              <TabsContent value="frais" className="mt-4 flex flex-col gap-4">
                <FraisTab costingId={costing.id} />
              </TabsContent>

              {/* DOUANE & DEVISES */}
              <TabsContent value="douane" className="mt-4 flex flex-col gap-4">
                <SectionCard title="Taux de change" description="Un taux saisi manuellement recalcule immédiatement tous les montants." noPadding>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                        <tr>{["Devise", "Taux (MAD)", "Date", "Source", "Override"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {DEVISES.map((d) => (
                          <tr key={d}>
                            <td className="num px-3 py-2 font-semibold">{d}</td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                step="0.01"
                                className="h-8 w-28"
                                value={promat.rates[d]}
                                disabled={d === "MAD"}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  promat.setRate(d, v, true);
                                  promat.log("Taux de change modifié", d, String(promat.rates[d]), String(v));
                                }}
                              />
                            </td>
                            <td className="num px-3 py-2">{fmtDate(new Date().toISOString())}</td>
                            <td className="px-3 py-2">{promat.ratesManuels[d] ? "Saisie PROMAT" : "Bank Al-Maghrib"}</td>
                            <td className="px-3 py-2">{promat.ratesManuels[d] ? <StatusBadge tone="warning">Taux manuel</StatusBadge> : <StatusBadge tone="neutre">Automatique</StatusBadge>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>

                <SectionCard title="Droits de douane par article" noPadding>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                        <tr>{["Article", "Origine", "Valeur d'achat (MAD)", "Code douanier", "Taux %", "Montant douane", "Source"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {lines.map((l) => (
                          <tr key={l.articleId}>
                            <td className="px-3 py-2">{l.article.ligne} — {l.article.designation}</td>
                            <td className="px-3 py-2">{l.quote?.origine ?? l.article.origine}</td>
                            <td className="num px-3 py-2 text-right">{fmtInt(l.achatMAD)}</td>
                            <td className="num px-3 py-2">{l.article.codeDouane}</td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                step="0.5"
                                className="h-8 w-24"
                                value={costing.customs[l.articleId] ?? 0}
                                onChange={(e) => {
                                  promat.updateCosting(costing.id, { customs: { ...costing.customs, [l.articleId]: Number(e.target.value) } });
                                }}
                              />
                            </td>
                            <td className="num px-3 py-2 text-right">{fmtInt(l.douane)}</td>
                            <td className="px-3 py-2">{promat.ratesManuels[l.devise] ? "Override PROMAT" : "Tarif douanier"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-border p-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const next: Record<string, number> = {};
                        articles.forEach((a) => (next[a.id] = 2.5));
                        promat.updateCosting(costing.id, { customs: next });
                        promat.log("Douane appliquée globalement", tender.ref, undefined, "2,5 %");
                        toast.success("Taux de 2,5 % appliqué globalement.");
                      }}
                    >
                      Appliquer 2,5 % globalement
                    </Button>
                  </div>
                </SectionCard>
              </TabsContent>

              {/* PRIX DE REVIENT */}
              <TabsContent value="pr" className="mt-4">
                <SectionCard
                  title="Prix de revient (landed cost)"
                  description="Valeur d'achat + douane + fret + transit + banque + assurance + transport local + divers."
                  noPadding
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1350px] text-xs">
                      <thead className="bg-surface-2 text-left text-[11px] text-muted-foreground uppercase">
                        <tr>
                          {["Ligne", "Article", "Fournisseur", "Qté", "PU devise", "Dev.", "Taux", "Achat MAD", "Douane", "Fret", "Transit", "Banque", "Assur.", "Divers", "PR total", "PR unitaire"].map((h) => (
                            <th key={h} className="px-2 py-2 font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {lines.map((l) => (
                          <tr key={l.articleId} className="hover:bg-accent/50">
                            <td className="num px-2 py-2">{l.article.ligne}</td>
                            <td className="max-w-[170px] truncate px-2 py-2">{l.article.designation}</td>
                            <td className="max-w-[140px] truncate px-2 py-2">{l.supplier?.nom ?? "—"}</td>
                            <td className="num px-2 py-2 text-right">{l.qte}</td>
                            <td className="num px-2 py-2 text-right">{fmtMAD(l.pu, 0)}</td>
                            <td className="num px-2 py-2">{l.devise}</td>
                            <td className="num px-2 py-2 text-right">{l.taux.toFixed(2)}</td>
                            <td className="num px-2 py-2 text-right">{fmtInt(l.achatMAD)}</td>
                            <td className="num px-2 py-2 text-right">{fmtInt(l.douane)}</td>
                            <td className="num px-2 py-2 text-right">{fmtInt(l.fret)}</td>
                            <td className="num px-2 py-2 text-right">{fmtInt(l.transit)}</td>
                            <td className="num px-2 py-2 text-right">{fmtInt(l.banque)}</td>
                            <td className="num px-2 py-2 text-right">{fmtInt(l.assurance)}</td>
                            <td className="num px-2 py-2 text-right">{fmtInt(l.divers + l.transportLocal)}</td>
                            <td className="num px-2 py-2 text-right font-bold">{fmtInt(l.prTotal)}</td>
                            <td className="num px-2 py-2 text-right font-semibold">{fmtMAD(l.prUnitaire)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-surface-2 font-bold">
                        <tr>
                          <td colSpan={7} className="px-2 py-2">Totaux</td>
                          <td className="num px-2 py-2 text-right">{fmtInt(totals.achats)}</td>
                          <td className="num px-2 py-2 text-right">{fmtInt(totals.douane)}</td>
                          <td colSpan={5} className="num px-2 py-2 text-right">{fmtInt(totals.frais)}</td>
                          <td className="num px-2 py-2 text-right">{fmtInt(totals.prixRevient)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </SectionCard>
              </TabsContent>

              {/* MARGE */}
              <TabsContent value="marge" className="mt-4 flex flex-col gap-4">
                <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                  <SectionCard title="Simulateur de marge" description="Ajustez la marge et visualisez immédiatement l'impact sur l'offre client.">
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[simulation ?? costing.margeGlobale]}
                        min={5}
                        max={40}
                        step={0.5}
                        onValueChange={(v) => setSimulation(v[0] ?? costing.margeGlobale)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        className="num w-24"
                        value={simulation ?? costing.margeGlobale}
                        onChange={(e) => setSimulation(Number(e.target.value))}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[15, 18, 20, 22, 25].map((m) => (
                        <Button key={m} size="sm" variant="secondary" onClick={() => setSimulation(m)}>{m} %</Button>
                      ))}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <Metric label="Offre PROMAT HT" value={`${fmtInt(totals.venteHT)} MAD`} />
                      <Metric label="Marge brute" value={`${fmtInt(totals.margeBrute)} MAD`} />
                      <Metric label="Marge moyenne" value={`${totals.margeMoyenne.toFixed(1)} %`} tone={totals.margeMoyenne < 15 ? "danger" : "success"} />
                      <Metric
                        label="Écart estimation client"
                        value={tender.estimationClient ? `${fmtInt(totals.venteHT - tender.estimationClient)} MAD` : "—"}
                      />
                    </div>
                    {(simulation ?? costing.margeGlobale) < 12 ? (
                      <div className="mt-3 space-y-2 rounded-md border border-danger/30 bg-danger-soft p-3">
                        <p className="text-xs font-semibold text-danger">Marge critique (&lt; 12 %) — une justification écrite est requise.</p>
                        <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Justification de la marge…" />
                      </div>
                    ) : null}
                    <Button
                      className="mt-4"
                      onClick={() => {
                        const m = simulation ?? costing.margeGlobale;
                        if (m < 12 && !justification.trim()) {
                          toast.error("Justification obligatoire pour une marge critique.");
                          return;
                        }
                        promat.updateCosting(costing.id, { margeGlobale: m, justificationMarge: justification });
                        promat.log("Marge modifiée", tender.ref, `${costing.margeGlobale} %`, `${m} %`);
                        setSimulation(null);
                        toast.success("Simulation appliquée au chiffrage.");
                      }}
                    >
                      Appliquer cette simulation
                    </Button>
                  </SectionCard>

                  <SectionCard title="Synthèse financière">
                    <dl className="space-y-2 text-sm">
                      {[
                        ["Achats fournisseurs", totals.achats],
                        ["Frais d'approche", totals.frais],
                        ["Douane", totals.douane],
                        ["Prix de revient", totals.prixRevient],
                        ["Offre PROMAT HT", totals.venteHT],
                        ["Marge brute", totals.margeBrute],
                      ].map(([k, v]) => (
                        <div key={k as string} className="flex justify-between border-b border-border pb-1.5">
                          <dt className="text-muted-foreground">{k as string}</dt>
                          <dd className="num font-semibold">{fmtInt(v as number)} MAD</dd>
                        </div>
                      ))}
                      <div className="flex justify-between pt-1">
                        <dt className="text-muted-foreground">Marge moyenne</dt>
                        <dd className={cn("num font-bold", totals.margeMoyenne < 15 ? "text-danger" : "text-success")}>{totals.margeMoyenne.toFixed(1)} %</dd>
                      </div>
                    </dl>
                    {tender.estimationClient ? (
                      <div className="mt-4 rounded-lg border border-info/30 bg-info-soft p-3 text-sm">
                        <p className="text-xs font-bold text-info uppercase">Positionnement financier</p>
                        <p className="num mt-1">Estimation client : {fmtInt(tender.estimationClient)} MAD</p>
                        <p className="num">Offre PROMAT : {fmtInt(totals.venteHT)} MAD</p>
                        <p className="num">Écart : {fmtInt(totals.venteHT - tender.estimationClient)} MAD ({(((totals.venteHT - tender.estimationClient) / tender.estimationClient) * 100).toFixed(1)} %)</p>
                      </div>
                    ) : null}
                  </SectionCard>
                </div>

                <SectionCard title="Marge par article" noPadding>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                        <tr>{["Article", "PRU", "Marge %", "Marge MAD", "PVU", "Qté", "Total HT", "Statut"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {lines.map((l) => (
                          <tr key={l.articleId}>
                            <td className="px-3 py-2">{l.article.ligne} — {l.article.designation}</td>
                            <td className="num px-3 py-2 text-right">{fmtMAD(l.prUnitaire)}</td>
                            <td className="px-3 py-2 text-right">
                              <Input
                                type="number"
                                className="num h-8 w-20"
                                value={costing.margesArticle[l.articleId] ?? l.marge}
                                onChange={(e) =>
                                  promat.updateCosting(costing.id, {
                                    margeMode: "Par article",
                                    margesArticle: { ...costing.margesArticle, [l.articleId]: Number(e.target.value) },
                                  })
                                }
                              />
                            </td>
                            <td className="num px-3 py-2 text-right">{fmtInt(l.margeMAD)}</td>
                            <td className="num px-3 py-2 text-right font-semibold">{fmtMAD(l.pvu)}</td>
                            <td className="num px-3 py-2 text-right">{l.qte}</td>
                            <td className="num px-3 py-2 text-right font-bold">{fmtInt(l.totalHT)}</td>
                            <td className="px-3 py-2">
                              <StatusBadge tone={l.marge < 12 ? "danger" : l.marge < 15 ? "warning" : "success"}>
                                {l.marge < 12 ? "Critique" : l.marge < 15 ? "À surveiller" : "Conforme"}
                              </StatusBadge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center gap-3 border-t border-border p-3 text-sm">
                    <Switch
                      checked={costing.margeMode === "Par article"}
                      onCheckedChange={(v) => promat.updateCosting(costing.id, { margeMode: v ? "Par article" : "Globale" })}
                    />
                    Marge par article (sinon marge globale de {costing.margeGlobale} %)
                  </div>
                </SectionCard>
              </TabsContent>

              {/* BORDEREAU */}
              <TabsContent value="bordereau" className="mt-4 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Switch checked={vueClient} onCheckedChange={setVueClient} />
                    {vueClient ? "Vue offre client" : "Vue interne PROMAT"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => exporterCsv(lines, tender.ref, vueClient)}>
                      <FileSpreadsheet className="size-4" /> Exporter bordereau Excel
                    </Button>
                  </div>
                </div>
                <SectionCard noPadding>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-sm">
                      <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                        <tr>
                          {(vueClient
                            ? ["Code", "Désignation", "Unité", "Quantité", "PU PROMAT", "Total HT"]
                            : ["Code", "Désignation", "Fournisseur", "Coût achat", "Douane", "Frais", "PR", "Marge", "PU vente", "Total HT"]
                          ).map((h) => <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {lines.map((l) => (
                          <tr key={l.articleId}>
                            <td className="num px-3 py-2">{l.article.ligne}</td>
                            <td className="px-3 py-2">{l.article.designation}</td>
                            {vueClient ? (
                              <>
                                <td className="px-3 py-2">{l.article.unite}</td>
                                <td className="num px-3 py-2 text-right">{l.qte}</td>
                                <td className="num px-3 py-2 text-right">{fmtMAD(l.pvu)}</td>
                                <td className="num px-3 py-2 text-right font-semibold">{fmtInt(l.totalHT)}</td>
                              </>
                            ) : (
                              <>
                                <td className="px-3 py-2">{l.supplier?.nom ?? "—"}</td>
                                <td className="num px-3 py-2 text-right">{fmtInt(l.achatMAD)}</td>
                                <td className="num px-3 py-2 text-right">{fmtInt(l.douane)}</td>
                                <td className="num px-3 py-2 text-right">{fmtInt(l.fraisTotal)}</td>
                                <td className="num px-3 py-2 text-right">{fmtInt(l.prTotal)}</td>
                                <td className="num px-3 py-2 text-right">{l.marge.toFixed(1)} %</td>
                                <td className="num px-3 py-2 text-right">{fmtMAD(l.pvu)}</td>
                                <td className="num px-3 py-2 text-right font-semibold">{fmtInt(l.totalHT)}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-surface-2 font-bold">
                        <tr>
                          <td colSpan={vueClient ? 5 : 9} className="px-3 py-2 text-right">Total HT</td>
                          <td className="num px-3 py-2 text-right">{fmtInt(totals.venteHT)} MAD</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </SectionCard>
                {vueClient ? (
                  <p className="text-xs text-muted-foreground">La vue client n'expose aucune information d'achat, de fournisseur ni de marge.</p>
                ) : null}
              </TabsContent>

              {/* CONTRÔLES */}
              <TabsContent value="controles" className="mt-4 flex flex-col gap-4">
                <SectionCard title="Contrôles financiers automatiques">
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {controlesFinanciers.map((c) => (
                      <li key={c.label} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                        <span>{c.label}</span>
                        <StatusBadge tone={c.ok ? "success" : "warning"}>{c.ok ? "Conforme" : "À corriger"}</StatusBadge>
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard title={`Dossier prêt à ${readinessScore} %`} description={blockers.length ? `${blockers.length} élément(s) bloquent la finalisation` : "Aucun blocage — dossier finalisable."}>
                  <div className="grid gap-4 lg:grid-cols-3">
                    {Object.entries(readiness).map(([section, items]) => (
                      <div key={section}>
                        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{section}</p>
                        <ul className="mt-2 space-y-1.5">
                          {items.map((i) => (
                            <li key={i.label} className="flex items-start gap-2 text-sm">
                              {i.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />}
                              <span className={cn(!i.ok && "text-warning-foreground")}>{i.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {blockers.length ? (
                    <Button className="mt-4" variant="outline" onClick={() => toast.warning(`Blocage : ${blockers[0]?.label}`)}>Voir le blocage</Button>
                  ) : null}
                </SectionCard>
              </TabsContent>

              {/* VERSIONS */}
              <TabsContent value="versions" className="mt-4 flex flex-col gap-4">
                <SectionCard
                  title="Versions du chiffrage"
                  description="Chaque version conserve fournisseurs, taux, douane, coûts, PR, marge et prix de vente."
                  actions={
                    <Button
                      size="sm"
                      onClick={() => {
                        const v = {
                          id: newId("v"),
                          label: `V${costing.versions.length + 1}`,
                          date: new Date().toISOString(),
                          auteur: promat.session?.nom ?? "PROMAT",
                          snapshot: {
                            selections: { ...costing.selections },
                            fees: [...costing.fees],
                            customs: { ...costing.customs },
                            rates: { ...promat.rates },
                            margeGlobale: costing.margeGlobale,
                            margesArticle: { ...costing.margesArticle },
                          },
                        };
                        promat.updateCosting(costing.id, { versions: [...costing.versions, v] });
                        promat.log("Version créée", `${tender.ref} — ${v.label}`);
                        toast.success(`Version ${v.label} enregistrée`);
                      }}
                    >
                      <Plus className="size-4" /> Créer une version
                    </Button>
                  }
                  noPadding
                >
                  <ul className="divide-y divide-border">
                    {costing.versions.map((v) => (
                      <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={compare.includes(v.id)}
                            onCheckedChange={() => setCompare((c) => (c.includes(v.id) ? c.filter((x) => x !== v.id) : [...c, v.id].slice(-2)))}
                          />
                          <div>
                            <p className="text-sm font-bold">{v.label}</p>
                            <p className="num text-xs text-muted-foreground">{fmtDate(v.date)} — {v.auteur} — marge {v.snapshot.margeGlobale} %</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              promat.updateCosting(costing.id, {
                                selections: v.snapshot.selections,
                                fees: v.snapshot.fees,
                                customs: v.snapshot.customs,
                                margeGlobale: v.snapshot.margeGlobale,
                                margesArticle: v.snapshot.margesArticle,
                              });
                              promat.log("Version restaurée", `${tender.ref} — ${v.label}`);
                              toast.success("Version restaurée");
                            }}
                          >
                            <RotateCcw className="size-3.5" /> Restaurer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const copie = { ...v, id: newId("v"), label: `V${costing.versions.length + 1}`, date: new Date().toISOString() };
                              promat.updateCosting(costing.id, { versions: [...costing.versions, copie] });
                              toast.success("Version dupliquée");
                            }}
                          >
                            <Copy className="size-3.5" /> Dupliquer
                          </Button>
                        </div>
                      </li>
                    ))}
                    {!costing.versions.length ? (
                      <li className="px-4 py-10 text-center text-sm text-muted-foreground">Aucune version enregistrée.</li>
                    ) : null}
                  </ul>
                </SectionCard>

                {compare.length === 2 ? (
                  <SectionCard title="Comparaison de versions" noPadding>
                    <table className="w-full text-sm">
                      <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                        <tr>{["Élément", ...compare.map((c) => costing.versions.find((v) => v.id === c)?.label ?? "")].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[
                          ["Marge globale", (id2: string) => `${costing.versions.find((v) => v.id === id2)?.snapshot.margeGlobale} %`],
                          ["Taux EUR", (id2: string) => String(costing.versions.find((v) => v.id === id2)?.snapshot.rates.EUR)],
                          ["Fournisseurs retenus", (id2: string) => String(new Set(Object.values(costing.versions.find((v) => v.id === id2)?.snapshot.selections ?? {})).size)],
                          ["Postes de frais", (id2: string) => String(costing.versions.find((v) => v.id === id2)?.snapshot.fees.length)],
                        ].map(([label, fn]) => {
                          const a = (fn as (x: string) => string)(compare[0]!);
                          const b = (fn as (x: string) => string)(compare[1]!);
                          return (
                            <tr key={label as string}>
                              <td className="px-3 py-2">{label as string}</td>
                              <td className={cn("num px-3 py-2", a !== b && "bg-warning-soft font-bold")}>{a}</td>
                              <td className={cn("num px-3 py-2", a !== b && "bg-warning-soft font-bold")}>{b}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </SectionCard>
                ) : null}
              </TabsContent>
            </Tabs>
          </div>

          <aside className="hidden 2xl:block">
            <div className="card-surface sticky top-20 p-4">
              <p className="title-display mb-3 text-sm font-bold">Rail de décision</p>
              {rail}
            </div>
          </aside>
        </div>
      </div>

      <Sheet open={validationOpen} onOpenChange={setValidationOpen}>
        <SheetContent className="w-[min(30rem,100vw-1.5rem)] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Validation du chiffrage</SheetTitle>
            <SheetDescription>Vérifiez la synthèse avant validation définitive.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 p-4">
            <dl className="space-y-2 text-sm">
              {[
                ["Appel d'offres", tender.ref],
                ["Client", tender.client],
                ["Fournisseurs retenus", [...new Set(Object.values(costing.selections))].map((s) => promat.suppliers.find((x) => x.id === s)?.nom).join(", ") || "—"],
                ["Coût d'achat", `${fmtInt(totals.achats)} MAD`],
                ["Prix de revient", `${fmtInt(totals.prixRevient)} MAD`],
                ["Prix proposé", `${fmtInt(totals.venteHT)} MAD HT`],
                ["Marge", `${totals.margeMoyenne.toFixed(1)} %`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-border pb-1.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            {blockers.length ? (
              <div className="rounded-md border border-warning/30 bg-warning-soft p-3 text-xs text-warning-foreground">
                {blockers.length} avertissement(s) : {blockers.slice(0, 3).map((b) => b.label).join(" • ")}
              </div>
            ) : null}
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={confirmCheck} onCheckedChange={(v) => setConfirmCheck(!!v)} />
              Je confirme les fournisseurs retenus, les coûts et les prix proposés
            </label>
            <Button
              disabled={!confirmCheck || saving}
              onClick={async () => {
                setSaving(true);
                await new Promise((r) => setTimeout(r, 700));
                promat.updateCosting(costing.id, { statut: "Validé", validation: { par: promat.session?.nom ?? "PROMAT", date: new Date().toISOString() } });
                promat.updateTender(tender.id, { stageIndex: Math.max(tender.stageIndex, 8), avancement: 90 });
                promat.log("Chiffrage validé", tender.ref, costing.statut, "Validé");
                promat.notify({ type: "Chiffrage", titre: "Chiffrage validé", message: `${tender.ref} — offre à ${fmtInt(totals.venteHT)} MAD HT`, priorite: "Haute", lien: "/offres-finales" });
                setSaving(false);
                setValidationOpen(false);
                toast.success("Chiffrage validé définitivement.");
                navigate({ to: "/offres-finales" });
              }}
            >
              {saving ? <><Loader2 className="size-4 animate-spin" /> Validation…</> : "Valider définitivement"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function FraisTab({ costingId }: { costingId: string }) {
  const promat = usePromat();
  const costing = promat.costings.find((c) => c.id === costingId)!;
  const [mode, setMode] = useState<"Frais globaux" | "Frais spécifiques">("Frais globaux");
  const [form, setForm] = useState<Partial<Fee>>({ type: "Fret", devise: "EUR", allocation: "Prorata valeur achat" });

  const ajouter = () => {
    if (!form.montant || !form.description) {
      toast.error("Description et montant sont obligatoires.");
      return;
    }
    const fee: Fee = {
      id: newId("fee"),
      type: form.type ?? "Divers",
      description: form.description,
      montant: Number(form.montant),
      devise: (form.devise ?? "MAD") as Devise,
      allocation: (form.allocation ?? "Prorata valeur achat") as Allocation,
    };
    promat.updateCosting(costingId, { fees: [...costing.fees, fee] });
    promat.log("Frais d'approche ajouté", `${fee.type} — ${fee.description}`);
    setForm({ type: "Fret", devise: "EUR", allocation: "Prorata valeur achat" });
    toast.success("Frais ajouté — prix de revient recalculé.");
  };

  return (
    <>
      <SectionCard title="Mode de saisie">
        <div className="flex gap-2">
          {(["Frais globaux", "Frais spécifiques"] as const).map((m) => (
            <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>{m}</Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {mode === "Frais globaux"
            ? "Les frais sont répartis sur toutes les lignes selon la méthode d'allocation choisie."
            : "Chaque frais peut être affecté à une ligne précise du bordereau."}
        </p>
      </SectionCard>

      <SectionCard title="Postes de frais d'approche" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
              <tr>{["Type", "Description", "Montant", "Devise", "Équivalent MAD", "Allocation", "Action"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {costing.fees.map((f) => (
                <tr key={f.id}>
                  <td className="px-3 py-2 font-medium">{f.type}</td>
                  <td className="px-3 py-2 text-muted-foreground">{f.description}</td>
                  <td className="num px-3 py-2 text-right">{fmtMAD(f.montant, 0)}</td>
                  <td className="num px-3 py-2">{f.devise}</td>
                  <td className="num px-3 py-2 text-right">{fmtInt(f.montant * (promat.rates[f.devise] ?? 1))}</td>
                  <td className="px-3 py-2">
                    <Select
                      value={f.allocation}
                      onValueChange={(v) =>
                        promat.updateCosting(costingId, {
                          fees: costing.fees.map((x) => (x.id === f.id ? { ...x, allocation: v as Allocation } : x)),
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>{ALLOCATIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Supprimer le frais"
                      onClick={() => {
                        promat.updateCosting(costingId, { fees: costing.fees.filter((x) => x.id !== f.id) });
                        toast.success("Frais supprimé");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!costing.fees.length ? <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Aucun frais d'approche saisi.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Ajouter un frais">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES_FRAIS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">Description</Label>
            <Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Montant</Label>
            <Input type="number" value={form.montant ?? ""} onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Devise</Label>
            <Select value={form.devise} onValueChange={(v) => setForm({ ...form, devise: v as Devise })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DEVISES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <Button className="mt-3" onClick={ajouter}><Plus className="size-4" /> Ajouter un frais</Button>
      </SectionCard>
    </>
  );
}

function exporterCsv(lines: ReturnType<typeof computeCosting>["lines"], ref: string, vueClient: boolean) {
  const head = vueClient
    ? ["Code", "Designation", "Unite", "Quantite", "PU PROMAT", "Total HT"]
    : ["Code", "Designation", "Fournisseur", "Achat MAD", "Douane", "Frais", "PR", "Marge %", "PU vente", "Total HT"];
  const rows = lines.map((l) =>
    vueClient
      ? [l.article.ligne, l.article.designation, l.article.unite, l.qte, l.pvu.toFixed(2), l.totalHT.toFixed(2)]
      : [
          l.article.ligne,
          l.article.designation,
          l.supplier?.nom ?? "",
          l.achatMAD.toFixed(2),
          l.douane.toFixed(2),
          l.fraisTotal.toFixed(2),
          l.prTotal.toFixed(2),
          l.marge.toFixed(1),
          l.pvu.toFixed(2),
          l.totalHT.toFixed(2),
        ],
  );
  const csv = [head, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${vueClient ? "bordereau-client" : "bordereau-interne"}-${ref.replace(/[^\w]+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Bordereau exporté");
}

export { History, Download };
