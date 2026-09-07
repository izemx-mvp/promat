import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Info,
  Send,
  Sparkles,
} from "lucide-react";
import { AppShell, TenderList, StatusDot } from "@/components/promat/shell";
import { EmptyWorkspace, Field, Pill, SectionCard, Stepper } from "@/components/promat/ui";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePromat } from "@/lib/promat/store";
import { noGoReasons, type Article, type Tender } from "@/lib/promat/data";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agent AO & Analyse — PROMAT Maroc" },
      {
        name: "description",
        content:
          "Espace guidé PROMAT : analyse IA des appels d'offres, décision GO/NO GO, articles, sourcing et consultation fournisseurs.",
      },
      { property: "og:title", content: "Agent AO & Analyse — PROMAT Maroc" },
      {
        property: "og:description",
        content:
          "De l'appel d'offres à la consultation fournisseurs dans un seul espace de travail guidé par l'IA.",
      },
    ],
  }),
  component: AgentAO,
});

const steps = [
  { id: 1, label: "Analyse" },
  { id: 2, label: "Décision" },
  { id: 3, label: "Articles" },
  { id: 4, label: "Fournisseurs" },
  { id: 5, label: "Consultation" },
];

const filters = ["Tous", "À analyser", "Décision requise", "En consultation", "Prêt pour chiffrage"];

function AgentAO() {
  const { tenders, states, update, setHandoffId } = usePromat();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("Tous");
  const [selectedId, setSelectedId] = useState("onee");
  const [step, setStep] = useState(1);

  const list = useMemo(
    () => tenders.filter((t) => filter === "Tous" || t.status === filter),
    [tenders, filter],
  );
  const tender = tenders.find((t) => t.id === selectedId);
  const state = states[selectedId];

  useEffect(() => setStep(1), [selectedId]);

  const completed = [1];
  if (state?.decision === "go") completed.push(2);
  if (state?.articlesValidated) completed.push(3);
  if (state?.selectedSuppliers.length) completed.push(4);
  if (state?.consultationCreated) completed.push(5);

  const unlocked = [1, 2];
  if (state?.decision === "go") unlocked.push(3);
  if (state?.articlesValidated) unlocked.push(4);
  if (state?.selectedSuppliers.length) unlocked.push(5);

  return (
    <AppShell>
      <div className="flex h-full">
        <TenderList
          title="Appels d'offres"
          filters={filters}
          activeFilter={filter}
          onFilter={setFilter}
          items={list}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        {!tender || !state ? (
          <EmptyWorkspace
            title="Sélectionnez un appel d'offres"
            text="L'Agent prépare l'analyse dès l'ouverture du dossier."
          />
        ) : (
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl px-8 pb-28 pt-8">
              <TenderHeader tender={tender} onExamine={() => setStep(2)} />
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
                {step === 1 && <StepAnalyse tender={tender} onNext={() => setStep(2)} />}
                {step === 2 && (
                  <StepDecision
                    tender={tender}
                    decision={state.decision}
                    onGo={() => update(tender.id, { decision: "go" })}
                    onNoGo={(reason) =>
                      update(tender.id, { decision: "nogo", noGoReason: reason })
                    }
                    onArticles={() => setStep(3)}
                  />
                )}
                {step === 3 && (
                  <StepArticles
                    tender={tender}
                    validated={state.articlesValidated}
                    onValidate={() => {
                      update(tender.id, { articlesValidated: true });
                      toast.success("Articles validés", {
                        description: "L'Agent a proposé les fournisseurs à consulter.",
                      });
                      setStep(4);
                    }}
                  />
                )}
                {step === 4 && (
                  <StepSuppliers
                    tender={tender}
                    selected={state.selectedSuppliers}
                    onToggle={(id) =>
                      update(tender.id, {
                        selectedSuppliers: state.selectedSuppliers.includes(id)
                          ? state.selectedSuppliers.filter((s) => s !== id)
                          : [...state.selectedSuppliers, id],
                      })
                    }
                    onCreate={() => {
                      update(tender.id, { consultationCreated: true });
                      setStep(5);
                    }}
                  />
                )}
                {step === 5 && (
                  <StepConsultation
                    tender={tender}
                    selected={state.selectedSuppliers}
                    offersReceived={state.offersReceived}
                    onReceive={() => update(tender.id, { offersReceived: true })}
                    onHandoff={() => {
                      update(tender.id, { sentToCosting: true, offersReceived: true });
                      setHandoffId(tender.id);
                      navigate({ to: "/chiffrage" });
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

function TenderHeader({ tender, onExamine }: { tender: Tender; onExamine: () => void }) {
  return (
    <header className="card-soft p-7">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-muted-foreground">{tender.client}</p>
            <span className="text-xs tabular-nums text-muted-foreground">{tender.reference}</span>
          </div>
          <h1 className="page-title mt-2 leading-tight">{tender.object}</h1>
          <div className="mt-4 flex items-center gap-3">
            <Pill tone={tender.recommendation === "GO recommandé" ? "ok" : "warn"}>
              <Sparkles className="size-3.5" /> {tender.recommendation}
            </Pill>
            <StatusDot status={tender.status} />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="label-xs">Score pertinence</p>
          <p className="font-display text-4xl font-bold tabular-nums text-ai">{tender.score}%</p>
          <Button className="mt-4" onClick={onExamine}>
            Examiner la décision
          </Button>
        </div>
      </div>
      <div className="mt-7 grid grid-cols-3 gap-6 border-t border-border pt-5">
        <Field label="Budget" value={tender.budget} />
        <Field label="Caution" value={tender.caution} />
        <Field label="Échéance" value={tender.deadlineLong} />
      </div>
    </header>
  );
}

function StepAnalyse({ tender, onNext }: { tender: Tender; onNext: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div>
        <h2 className="page-title">Analyse IA du dossier</h2>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          Les informations essentielles pour décider rapidement.
        </p>
      </div>

      <SectionCard title="L'opportunité">
        <div className="grid grid-cols-2 gap-6">
          <Field label="Client" value={tender.client} />
          <Field label="Objet" value={tender.title} />
          <Field label="Budget" value={tender.budget} />
          <Field label="Échéance" value={tender.deadlineLong} />
        </div>
      </SectionCard>

      <SectionCard title="Ce qui est demandé">
        <ul className="space-y-2.5">
          {tender.demand.slice(0, 4).map((d) => (
            <li key={d} className="flex gap-3 text-[15px]">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ai" />
              {d}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard
        title="Points de vigilance"
        action={
          <button
            onClick={() => setOpen(true)}
            className="text-sm font-medium text-ai underline-offset-4 hover:underline"
          >
            Voir l'analyse complète
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {tender.vigilance.map((v) => (
            <div
              key={v.text}
              className={`flex items-start gap-2.5 rounded-xl p-3.5 text-sm ${
                v.tone === "warn" ? "bg-warning-soft text-warning" : "bg-success-soft text-success"
              }`}
            >
              {v.tone === "warn" ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              ) : (
                <Check className="mt-0.5 size-4 shrink-0" />
              )}
              <span className="font-medium leading-snug">{v.text}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="rounded-2xl border border-ai/25 bg-ai-soft p-6">
        <div className="flex items-center gap-2 text-ai">
          <Sparkles className="size-4" />
          <p className="text-sm font-semibold">Recommandation de l'Agent</p>
        </div>
        <p className="mt-3 font-display text-2xl font-bold">{tender.recommendation}</p>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-foreground/80">
          « {tender.aiComment} »
        </p>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={onNext}>
            Continuer <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline" onClick={() => setOpen(true)}>
            Voir les points à vérifier
          </Button>
          <span className="ml-auto text-sm text-muted-foreground">
            Confiance <span className="font-semibold text-ai">{tender.score}%</span>
          </span>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Analyse complète — {tender.reference}</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 p-4 pt-0 text-sm">
            {[
              {
                t: "Administratif",
                items: [
                  "Caution provisoire : " + tender.caution,
                  "Dossier administratif : modèles ONEE à jour",
                  "Attestations fiscales et CNSS requises",
                ],
              },
              {
                t: "Technique",
                items: [
                  "Spécifications détaillées au CPS articles 4 à 9",
                  "Documentation fabricant en français exigée",
                  "Certificats d'étalonnage usine à fournir",
                ],
              },
              {
                t: "Financier",
                items: [
                  "Montant estimé : " + tender.budget,
                  "Paiement à 60 jours après réception",
                  "Révision de prix non applicable",
                ],
              },
              {
                t: "Documents",
                items: ["CPS (42 pages)", "Bordereau des prix", "Règlement de consultation"],
              },
              {
                t: "Clauses à surveiller",
                items: [
                  "Pénalités de retard : 1‰ par jour",
                  "Garantie 24 mois pièces et main d'œuvre",
                ],
              },
            ].map((b) => (
              <div key={b.t}>
                <p className="label-xs">{b.t}</p>
                <ul className="mt-2 space-y-1.5">
                  {b.items.map((i) => (
                    <li key={i} className="flex gap-2 text-foreground/85">
                      <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function StepDecision({
  tender,
  decision,
  onGo,
  onNoGo,
  onArticles,
}: {
  tender: Tender;
  decision: "pending" | "go" | "nogo";
  onGo: () => void;
  onNoGo: (reason: string) => void;
  onArticles: () => void;
}) {
  const [modal, setModal] = useState(false);

  return (
    <>
      <div>
        <h2 className="page-title">Décision GO / NO GO</h2>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          Cinq critères d'éligibilité, une décision.
        </p>
      </div>

      <SectionCard>
        <ul className="divide-y divide-border">
          {tender.matrix.map((m) => (
            <li key={m.label} className="flex items-center justify-between py-3.5">
              <span className="text-[15px] font-medium">{m.label}</span>
              <Pill tone={m.tone === "ok" ? "ok" : "warn"}>
                {m.value} {m.tone === "ok" ? "✓" : "⚠"}
              </Pill>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-end justify-between rounded-xl bg-muted/70 p-5">
          <div>
            <p className="label-xs">Éligibilité estimée</p>
            <p className="font-display text-3xl font-bold tabular-nums">{tender.score}%</p>
          </div>
          <Pill tone="ai">
            <Sparkles className="size-3.5" /> {tender.recommendation}
          </Pill>
        </div>
      </SectionCard>

      {decision === "go" ? (
        <div className="rounded-2xl border border-success/30 bg-success-soft p-6">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="size-5" />
            <p className="font-display text-lg font-bold">GO validé</p>
          </div>
          <p className="mt-1.5 text-[15px] text-foreground/80">
            L'Agent a préparé les articles à sourcer.
          </p>
          <Button className="mt-4" onClick={onArticles}>
            Voir les articles <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : decision === "nogo" ? (
        <div className="card-soft p-6">
          <p className="font-display text-lg font-bold">Dossier classé NO GO</p>
          <p className="mt-1 text-sm text-muted-foreground">Motif retenu : {"—"}</p>
          <Button variant="outline" className="mt-4" onClick={onGo}>
            Rouvrir le dossier
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button size="lg" className="h-14 flex-1 text-base" onClick={onGo}>
            Valider GO
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 flex-1 text-base"
            onClick={() => setModal(true)}
          >
            Classer NO GO
          </Button>
        </div>
      )}

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pourquoi ?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {noGoReasons.map((r) => (
              <button
                key={r}
                onClick={() => {
                  onNoGo(r);
                  setModal(false);
                  toast("Dossier classé NO GO", { description: r });
                }}
                className="w-full rounded-lg border border-border px-4 py-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
              >
                {r}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StepArticles({
  tender,
  validated,
  onValidate,
}: {
  tender: Tender;
  validated: boolean;
  onValidate: () => void;
}) {
  const [detail, setDetail] = useState<Article | null>(null);
  const total = tender.articles.length;
  const ok = tender.articles.filter((a) => a.status === "Validé").length;

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="page-title">Articles &amp; besoins</h2>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            {total} articles détectés · {ok} validés · {total - ok} à vérifier
          </p>
        </div>
        <Button onClick={onValidate} disabled={validated}>
          {validated ? "Articles validés" : "Valider les articles"}
        </Button>
      </div>

      <div className="card-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              {["Référence", "Désignation", "Qté", "Unité", "Spécifications", "Statut"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tender.articles.map((a) => (
              <tr
                key={a.id}
                onClick={() => setDetail(a)}
                className="cursor-pointer border-b border-border/70 transition-colors last:border-0 hover:bg-muted/50"
              >
                <td className="px-4 py-3.5 tabular-nums text-muted-foreground">{a.ref}</td>
                <td className="px-4 py-3.5 font-medium">{a.designation}</td>
                <td className="px-4 py-3.5 tabular-nums">{a.qty}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{a.unit}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{a.specs}</td>
                <td className="px-4 py-3.5">
                  <Pill tone={a.status === "Validé" ? "ok" : "warn"}>{a.status}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{detail?.designation}</SheetTitle>
          </SheetHeader>
          {detail && (
            <div className="space-y-6 p-4 pt-0 text-sm">
              <div>
                <p className="label-xs">Spécification technique</p>
                <ul className="mt-2 space-y-1.5">
                  {detail.fullSpec.map((s) => (
                    <li key={s} className="flex gap-2 text-foreground/85">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ai" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <Field label="Document source" value={detail.source} />
              <div className="rounded-xl border border-ai/25 bg-ai-soft p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-ai">
                  <Sparkles className="size-4" /> Référence similaire détectée dans l'historique
                  PROMAT.
                </p>
                <p className="mt-2 text-foreground/80">{detail.history}</p>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <Field label="Fournisseur précédent" value={detail.prevSupplier} />
                  <Field label="Prix précédent" value={detail.prevPrice} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  Modifier
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setDetail(null);
                    toast.success("Article validé");
                  }}
                >
                  Valider l'article
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function StepSuppliers({
  tender,
  selected,
  onToggle,
  onCreate,
}: {
  tender: Tender;
  selected: string[];
  onToggle: (id: string) => void;
  onCreate: () => void;
}) {
  const [why, setWhy] = useState<string | null>(null);
  const supplier = tender.suppliers.find((s) => s.id === why);

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="page-title">Fournisseurs recommandés</h2>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            Pour {tender.articles.length} articles · {tender.suppliers.length} fournisseurs suggérés
            · {selected.length} sélectionnés
          </p>
        </div>
        <Button onClick={onCreate} disabled={selected.length === 0}>
          Créer la consultation
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tender.suppliers.map((s) => {
          const active = selected.includes(s.id);
          return (
            <div
              key={s.id}
              className={`card-soft p-5 transition-all ${active ? "border-primary/40 ring-1 ring-primary/20" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[17px] font-semibold leading-tight">{s.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.country}</p>
                </div>
                <Pill tone="ai">{s.match}% match</Pill>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <p>{s.kind}</p>
                <p>Délai moyen : {s.delay}</p>
                {s.lastConsult && <p>Dernière consultation : {s.lastConsult}</p>}
              </div>
              <div className="mt-5 flex items-center gap-2">
                <Button
                  variant={active ? "secondary" : "default"}
                  size="sm"
                  onClick={() => onToggle(s.id)}
                >
                  {active ? "Sélectionné ✓" : "Sélectionner"}
                </Button>
                <button
                  onClick={() => setWhy(s.id)}
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-ai hover:underline"
                >
                  <Info className="size-3.5" /> Pourquoi ce fournisseur ?
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={!!why} onOpenChange={(o) => !o && setWhy(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Pourquoi {supplier?.name} ?</SheetTitle>
          </SheetHeader>
          {supplier && (
            <div className="space-y-5 p-4 pt-0 text-sm">
              <Field label="Compatibilité produit" value={supplier.why.compat} />
              <Field label="Historique PROMAT" value={supplier.why.history} />
              <Field label="Temps de réponse moyen" value={supplier.why.response} />
              <Field label="Compétitivité prix" value={supplier.why.price} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function StepConsultation({
  tender,
  selected,
  offersReceived,
  onReceive,
  onHandoff,
}: {
  tender: Tender;
  selected: string[];
  offersReceived: boolean;
  onReceive: () => void;
  onHandoff: () => void;
}) {
  const suppliers = tender.suppliers.filter((s) => selected.includes(s.id));

  return (
    <>
      <div className="card-soft p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label-xs">Consultation</p>
            <h2 className="page-title mt-1">RFQ-2026-0048</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              AO : {tender.client} – {tender.reference}
            </p>
          </div>
          <div className="flex gap-8">
            <Field label="Fournisseurs" value={`${suppliers.length}`} />
            <Field label="Articles" value={`${tender.articles.length}`} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {suppliers.map((s, i) => {
          const status = offersReceived ? "Offre reçue" : i === 0 ? "Envoyée" : i === 1 ? "Offre reçue" : "En attente";
          return (
            <div key={s.id} className="card-soft p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[17px] font-semibold leading-tight">{s.name}</p>
                <Pill
                  tone={status === "Offre reçue" ? "ok" : status === "Envoyée" ? "ai" : "warn"}
                >
                  {status}
                </Pill>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {status === "Offre reçue"
                  ? "Reçue aujourd'hui"
                  : status === "Envoyée"
                    ? "Réponse attendue le 15 juil."
                    : "Relance possible"}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toast("Relance envoyée")}>
                  Relancer
                </Button>
                <Button variant="ghost" size="sm" onClick={onReceive}>
                  Ajouter une réponse
                </Button>
                {status === "Offre reçue" && (
                  <Button variant="secondary" size="sm">
                    Voir l'offre
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 -mx-8 border-t border-border bg-card/95 px-8 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[15px] font-semibold">
              {offersReceived ? suppliers.length : Math.min(2, suppliers.length)} offres
              fournisseurs reçues
            </p>
            <p className="text-sm text-muted-foreground">Le dossier est prêt pour le chiffrage.</p>
          </div>
          <Button size="lg" onClick={onHandoff}>
            <Send className="size-4" /> Transmettre au chiffrage
          </Button>
        </div>
      </div>
    </>
  );
}
