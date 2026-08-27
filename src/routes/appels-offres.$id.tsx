import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  PanelRightOpen,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/promat/AppShell";
import {
  AgentBanner,
  DecisionRailContent,
  EmptyState,
  Metric,
  PageHeader,
  SectionCard,
  StatusBadge,
  WorkflowTimeline,
} from "@/components/promat/ui";
import { AddQuoteDialog, CreateRfqDialog } from "@/components/promat/quotes";
import { usePromat, newId } from "@/lib/promat/store";
import { fmtDate, fmtDateTime, fmtInt, fmtMAD, recommendSupplier } from "@/lib/promat/calc";
import { STAGES, UTILISATEURS, type Article } from "@/lib/promat/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/appels-offres/$id")({
  head: () => ({
    meta: [
      { title: "Dossier appel d'offres — PROMAT" },
      { name: "description", content: "Analyse, éligibilité, articles, sourcing et chiffrage d'un appel d'offres PROMAT." },
      { property: "og:title", content: "Dossier appel d'offres — PROMAT" },
      { property: "og:description", content: "Espace de travail complet d'un appel d'offres PROMAT." },
    ],
  }),
  component: TenderWorkspace,
});

function TenderWorkspace() {
  const { id } = useParams({ from: "/appels-offres/$id" });
  const promat = usePromat();
  const navigate = useNavigate();
  const [tab, setTab] = useState("synthese");
  const [tasks, setTasks] = useState([
    { label: "Vérifier la référence technique", done: false },
    { label: "Confirmer le chiffre d'affaires exigé", done: true },
    { label: "Valider le GO / NO GO", done: false },
    { label: "Sélectionner les fournisseurs", done: false },
    { label: "Lancer la consultation", done: false },
  ]);
  const [goOpen, setGoOpen] = useState(false);
  const [nogoOpen, setNogoOpen] = useState(false);
  const [rfqOpen, setRfqOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [articleOuvert, setArticleOuvert] = useState<Article | null>(null);
  const [analysing, setAnalysing] = useState(false);

  const tender = promat.tenders.find((t) => t.id === id);
  const articles = promat.articles.filter((a) => a.tenderId === id);
  const rfqs = promat.rfqs.filter((r) => r.tenderId === id);
  const quotes = promat.quotes.filter((qt) => qt.tenderId === id);
  const documents = promat.documents.filter((d) => d.tenderId === id);
  const costing = promat.costings.find((c) => c.tenderId === id);
  const activities = promat.activities.filter((a) => tender && a.objet.includes(tender.ref));

  const fournisseursPotentiels = useMemo(() => {
    if (!tender) return [];
    return promat.suppliers
      .filter((s) => s.familles.includes(tender.famille) || s.familles.some((f) => articles.some((a) => a.famille === f)))
      .slice(0, 6);
  }, [promat.suppliers, tender, articles]);

  if (!tender) {
    return (
      <AppShell>
        <EmptyState title="Appel d'offres introuvable" description="Ce dossier n'existe plus ou a été archivé." action={<Button onClick={() => navigate({ to: "/appels-offres" })}>Retour à la liste</Button>} />
      </AppShell>
    );
  }

  const eligibiliteGlobale = tender.eligibilite.length
    ? Math.round((tender.eligibilite.filter((e) => e.resultat === "Conforme").length / tender.eligibilite.length) * 100)
    : 0;

  const rail = (
    <DecisionRailContent
      tasks={tasks}
      onToggleTask={(i) => setTasks((t) => t.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
      echeance={`Dépôt le ${fmtDate(tender.dateLimite)}`}
      risque={tender.risques[0]?.explication ?? "Aucun risque bloquant identifié."}
      recommandation={
        tender.decision?.type === "GO"
          ? "GO validé — poursuivre le sourcing fournisseurs et la consultation."
          : `${tender.score >= 70 ? "GO recommandé" : "NO GO recommandé"} — score de pertinence ${tender.score} %, risque ${tender.risque.toLowerCase()}.`
      }
      ctaLabel="Voir l'analyse"
      onCta={() => setTab("analyse")}
    />
  );

  const lancerAnalyse = async () => {
    setAnalysing(true);
    await new Promise((r) => setTimeout(r, 900));
    promat.updateTender(tender.id, { statut: tender.decision ? tender.statut : "À décider", stageIndex: Math.max(tender.stageIndex, 1), avancement: Math.max(tender.avancement, 35) });
    promat.log("Analyse terminée", tender.ref);
    setAnalysing(false);
    toast.success("Analyse terminée — synthèse et risques mis à jour.");
    setTab("analyse");
  };

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <PageHeader
          title={tender.ref}
          subtitle={`${tender.client} — ${tender.objet}`}
          actions={
            <>
              <StatusBadge>{tender.statut}</StatusBadge>
              <StatusBadge tone={tender.priorite === "Haute" ? "danger" : "warning"}>Priorité {tender.priorite.toLowerCase()}</StatusBadge>
              <StatusBadge tone="navy">{tender.responsable}</StatusBadge>
              <Button variant="outline" onClick={lancerAnalyse} disabled={analysing}>
                {analysing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Analyser
              </Button>
              {costing ? (
                <Button onClick={() => navigate({ to: "/chiffrages/$id", params: { id: costing.id } })}>
                  Passer au chiffrage <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const cid = newId("ch");
                    promat.addCosting({
                      id: cid,
                      tenderId: tender.id,
                      statut: "À préparer",
                      responsable: "Karim Ouazzani",
                      updatedAt: new Date().toISOString().slice(0, 10),
                      selections: {},
                      fees: [],
                      customs: {},
                      margeMode: "Globale",
                      margeGlobale: tender.margeCible,
                      margesArticle: {},
                      versions: [],
                    });
                    promat.log("Chiffrage créé", tender.ref);
                    toast.success("Chiffrage créé");
                    navigate({ to: "/chiffrages/$id", params: { id: cid } });
                  }}
                >
                  Passer au chiffrage <ArrowRight className="size-4" />
                </Button>
              )}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="2xl:hidden">
                    <PanelRightOpen className="size-4" /> Décisions
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[min(24rem,100vw-2rem)] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Rail de décision</SheetTitle>
                    <SheetDescription>Agent Recherche AO</SheetDescription>
                  </SheetHeader>
                  <div className="p-4">{rail}</div>
                </SheetContent>
              </Sheet>
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <Metric label="Budget" value={`${fmtInt(tender.budget)} MAD`} />
          <Metric label="Caution" value={`${fmtInt(tender.caution)} MAD`} />
          <Metric label="Date limite" value={fmtDate(tender.dateLimite)} />
          <Metric label="Lieu" value={tender.lieu} />
          <Metric label="Pertinence" value={`${tender.score} %`} tone="success" />
          <Metric label="Risque" value={tender.risque} tone={tender.risque === "Élevé" ? "danger" : undefined} />
        </div>

        <WorkflowTimeline
          stageIndex={tender.stageIndex}
          onNavigate={(i) => {
            const map = ["synthese", "analyse", "eligibilite", "articles", "fournisseurs", "consultations", "consultations", "chiffrage", "chiffrage", "chiffrage", "historique"];
            setTab(map[i] ?? "synthese");
          }}
        />

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                {[
                  ["synthese", "Synthèse"],
                  ["analyse", "Analyse"],
                  ["eligibilite", "Éligibilité"],
                  ["articles", "Articles & besoins"],
                  ["documents", "Documents"],
                  ["fournisseurs", "Fournisseurs"],
                  ["consultations", "Consultations"],
                  ["chiffrage", "Chiffrage"],
                  ["historique", "Historique"],
                ].map(([v, l]) => (
                  <TabsTrigger key={v} value={v as string} className="text-xs">{l}</TabsTrigger>
                ))}
              </TabsList>

              {/* SYNTHÈSE */}
              <TabsContent value="synthese" className="mt-4 flex flex-col gap-4">
                <AgentBanner
                  tone={tender.score >= 70 ? "success" : "warning"}
                  titre={`Recommandation Agent Recherche AO — ${tender.score >= 70 ? "GO recommandé" : "NO GO recommandé"} (score ${tender.score} %)`}
                  message={`Opportunité alignée avec le portefeuille ${tender.famille.toLowerCase()} de PROMAT ; ${tender.risques.length} risque(s) identifié(s), éligibilité estimée à ${eligibiliteGlobale || 88} %.`}
                  action={<Button size="sm" onClick={() => setTab("eligibilite")}>Voir l'éligibilité</Button>}
                />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric label="Articles détectés" value={String(articles.length)} />
                  <Metric label="Documents obligatoires" value={`${tender.admin.length} dont ${tender.admin.filter((a) => a.statut !== "Disponible").length} à traiter`} />
                  <Metric label="Fournisseurs potentiels" value={String(fournisseursPotentiels.length)} />
                  <Metric label="Points à vérifier" value={String(tender.risques.filter((r) => r.niveau !== "Faible").length)} tone="danger" />
                </div>

                <SectionCard title="Décision GO / NO GO" description="PROMAT valide, l'Agent recommande.">
                  {tender.decision ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 p-4">
                      <div>
                        <StatusBadge tone={tender.decision.type === "GO" ? "success" : "danger"}>{tender.decision.type} validé</StatusBadge>
                        <p className="mt-2 text-sm">{tender.decision.motif ?? "Décision confirmée par le responsable commercial."}</p>
                        <p className="text-xs text-muted-foreground">{tender.decision.commentaire}</p>
                        <p className="num mt-1 text-xs text-muted-foreground">{fmtDate(tender.decision.date)} — {tender.decision.par}</p>
                      </div>
                      <Button variant="outline" onClick={() => setTab("articles")}>Poursuivre le dossier</Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => setGoOpen(true)}><ThumbsUp className="size-4" /> Valider GO</Button>
                      <Button variant="destructive" onClick={() => setNogoOpen(true)}><ThumbsDown className="size-4" /> Classer NO GO</Button>
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Conditions commerciales" noPadding>
                  <dl className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
                    {(tender.commercial.length ? tender.commercial : [{ label: "Devise", valeur: "MAD" }]).map((c) => (
                      <div key={c.label} className="flex justify-between gap-4 border-b border-border px-4 py-2.5 text-sm">
                        <dt className="text-muted-foreground">{c.label}</dt>
                        <dd className="text-right font-medium">{c.valeur}</dd>
                      </div>
                    ))}
                  </dl>
                </SectionCard>
              </TabsContent>

              {/* ANALYSE */}
              <TabsContent value="analyse" className="mt-4 flex flex-col gap-4">
                <SectionCard title="Informations générales" noPadding>
                  <dl className="grid sm:grid-cols-2">
                    {[
                      ["Client", tender.client],
                      ["Référence", tender.ref],
                      ["Objet", tender.objet],
                      ["Procédure", tender.procedure],
                      ["Publication", fmtDate(tender.publication)],
                      ["Date limite", fmtDate(tender.dateLimite)],
                      ["Ouverture des plis", fmtDate(tender.ouverturePlis)],
                      ["Budget", `${fmtInt(tender.budget)} MAD`],
                      ["Caution", `${fmtInt(tender.caution)} MAD`],
                      ["Financement", tender.financement],
                      ["Lieu", tender.lieu],
                      ["Lots", tender.lots],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-border px-4 py-2.5 text-sm">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="text-right font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </SectionCard>

                <SectionCard title="Conditions administratives" description="Statut des pièces exigées par le dossier.">
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {tender.admin.map((a) => (
                      <li key={a.label} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                        <span>{a.label}</span>
                        <StatusBadge>{a.statut}</StatusBadge>
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard title="Exigences techniques" noPadding>
                  <dl className="grid sm:grid-cols-2">
                    {tender.exigences.map((e) => (
                      <div key={e.label} className="border-b border-border px-4 py-2.5 text-sm">
                        <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{e.label}</dt>
                        <dd className="mt-0.5">{e.valeur}</dd>
                      </div>
                    ))}
                  </dl>
                </SectionCard>

                <SectionCard title="Analyse des risques" noPadding>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                        <tr>{["Risque", "Niveau", "Explication", "Impact", "Action"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {tender.risques.map((r) => (
                          <tr key={r.risque}>
                            <td className="px-3 py-2 font-medium whitespace-nowrap">{r.risque}</td>
                            <td className="px-3 py-2"><StatusBadge tone={r.niveau === "Élevé" ? "danger" : r.niveau === "Moyen" ? "warning" : "success"}>{r.niveau}</StatusBadge></td>
                            <td className="px-3 py-2 text-muted-foreground">{r.explication}</td>
                            <td className="px-3 py-2">{r.impact}</td>
                            <td className="px-3 py-2">{r.action}</td>
                          </tr>
                        ))}
                        {!tender.risques.length ? <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Aucun risque enregistré — lancez l'analyse.</td></tr> : null}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </TabsContent>

              {/* ÉLIGIBILITÉ */}
              <TabsContent value="eligibilite" className="mt-4 flex flex-col gap-4">
                <AgentBanner
                  tone={eligibiliteGlobale >= 80 ? "success" : "warning"}
                  titre={`Éligibilité globale : ${eligibiliteGlobale || 88} %`}
                  message={eligibiliteGlobale >= 70 ? "GO recommandé — les critères bloquants sont couverts." : "Points bloquants à lever avant décision."}
                />
                <SectionCard noPadding>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                        <tr>{["Critère", "Exigence AO", "PROMAT", "Résultat", "Justificatif", "Action"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {tender.eligibilite.map((e) => (
                          <tr key={e.critere}>
                            <td className="px-3 py-2 font-medium">{e.critere}</td>
                            <td className="px-3 py-2">{e.exigence}</td>
                            <td className="px-3 py-2">{e.promat}</td>
                            <td className="px-3 py-2"><StatusBadge>{e.resultat}</StatusBadge></td>
                            <td className="px-3 py-2 text-muted-foreground">{e.justificatif}</td>
                            <td className="px-3 py-2">
                              <Button size="sm" variant="ghost" onClick={() => toast.info(`Références et justificatifs de « ${e.critere} » ouverts.`)}>Voir références</Button>
                            </td>
                          </tr>
                        ))}
                        {!tender.eligibilite.length ? <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Matrice d'éligibilité non renseignée.</td></tr> : null}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
                {!tender.decision ? (
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setGoOpen(true)}><ThumbsUp className="size-4" /> Valider GO</Button>
                    <Button variant="destructive" onClick={() => setNogoOpen(true)}><ThumbsDown className="size-4" /> Classer NO GO</Button>
                  </div>
                ) : null}
              </TabsContent>

              {/* ARTICLES */}
              <TabsContent value="articles" className="mt-4 flex flex-col gap-4">
                <SectionCard
                  title="Articles & besoins"
                  description="Articles extraits du dossier par l'Agent Recherche AO — valeurs modifiables."
                  noPadding
                  actions={<Button size="sm" variant="outline" onClick={() => setRfqOpen(true)}>Lancer une consultation</Button>}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-sm">
                      <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                        <tr>{["Ligne", "Réf. client", "Désignation", "Spécifications", "Qté", "Unité", "Marque", "Livraison", "Sourcing", "Conformité", ""].map((h) => <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {articles.map((a) => (
                          <tr key={a.id} className="cursor-pointer hover:bg-accent/60" onClick={() => setArticleOuvert(a)}>
                            <td className="num px-3 py-2">{a.ligne}</td>
                            <td className="num px-3 py-2 whitespace-nowrap">{a.refClient}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{a.designation}</td>
                            <td className="max-w-[240px] truncate px-3 py-2 text-muted-foreground">{a.specifications}</td>
                            <td className="num px-3 py-2 text-right">{a.qte}</td>
                            <td className="px-3 py-2">{a.unite}</td>
                            <td className="px-3 py-2">{a.marque}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{a.livraison}</td>
                            <td className="px-3 py-2"><StatusBadge>{a.sourcing}</StatusBadge></td>
                            <td className="px-3 py-2"><StatusBadge>{a.conformite}</StatusBadge></td>
                            <td className="px-3 py-2 text-right"><Button size="sm" variant="ghost">Ouvrir</Button></td>
                          </tr>
                        ))}
                        {!articles.length ? (
                          <tr><td colSpan={11} className="px-3 py-10 text-center text-muted-foreground">Aucun article extrait. Lancez l'analyse du dossier pour extraire le bordereau.</td></tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </TabsContent>

              {/* DOCUMENTS */}
              <TabsContent value="documents" className="mt-4">
                <SectionCard title="Documents du dossier" noPadding>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                        <tr>{["Document", "Catégorie", "Type", "Version", "Source", "Statut", "Date", "Responsable"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {documents.map((d) => (
                          <tr key={d.id} className="hover:bg-accent/60">
                            <td className="px-3 py-2 font-medium"><span className="inline-flex items-center gap-2"><FileText className="size-4 text-info" /> {d.nom}</span></td>
                            <td className="px-3 py-2">{d.categorie}</td>
                            <td className="num px-3 py-2">{d.type}</td>
                            <td className="num px-3 py-2">{d.version}</td>
                            <td className="px-3 py-2">{d.source}</td>
                            <td className="px-3 py-2"><StatusBadge>{d.statut}</StatusBadge></td>
                            <td className="num px-3 py-2">{fmtDate(d.date)}</td>
                            <td className="px-3 py-2">{d.responsable}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </TabsContent>

              {/* FOURNISSEURS */}
              <TabsContent value="fournisseurs" className="mt-4 flex flex-col gap-4">
                <AgentBanner titre="Sourcing Agent Recherche AO" message={`${fournisseursPotentiels.length} fournisseurs compatibles identifiés sur la base des familles produits, marques et historiques d'achat.`} />
                <div className="grid gap-4 lg:grid-cols-2">
                  {fournisseursPotentiels.map((s) => {
                    const match = Math.min(98, Math.round(s.score * 0.6 + s.fiabilite * 0.4));
                    return (
                      <div key={s.id} className="card-surface p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="flex items-center gap-2 text-sm font-bold"><Building2 className="size-4 text-primary" /> {s.nom}</p>
                            <p className="text-xs text-muted-foreground">{s.ville}, {s.pays} — {s.marques.join(", ")}</p>
                          </div>
                          <StatusBadge tone={match >= 85 ? "success" : "warning"}>Match {match} %</StatusBadge>
                        </div>
                        <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">
                          <li>✓ Produit compatible ({s.familles.join(", ")})</li>
                          <li>✓ {s.genuine}</li>
                          <li>✓ {s.commandes} commandes historiques PROMAT</li>
                          <li>✓ Délai moyen {s.delaiMoyen} semaines</li>
                          <li>✓ Fiabilité {s.fiabilite} % — taux de réponse {s.tauxReponse} %</li>
                        </ul>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setRfqOpen(true);
                              toast.success(`${s.nom} retenu pour consultation.`);
                              promat.log("Fournisseur sélectionné pour sourcing", `${tender.ref} — ${s.nom}`);
                            }}
                          >
                            Sélectionner
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate({ to: "/fournisseurs/$id", params: { id: s.id } })}>Voir fournisseur</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* CONSULTATIONS */}
              <TabsContent value="consultations" className="mt-4 flex flex-col gap-4">
                <SectionCard
                  title="Consultations fournisseurs"
                  noPadding
                  actions={
                    <>
                      <Button size="sm" variant="outline" onClick={() => setQuoteOpen(true)}>Ajouter une offre fournisseur</Button>
                      <Button size="sm" onClick={() => setRfqOpen(true)}>Nouvelle consultation</Button>
                    </>
                  }
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                        <tr>{["RFQ", "Fournisseur", "Articles", "Date", "Réponse attendue", "Statut", "Relances", "Action"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rfqs.map((r) => {
                          const sup = promat.suppliers.find((s) => s.id === r.supplierId);
                          return (
                            <tr key={r.id} className="hover:bg-accent/60">
                              <td className="num px-3 py-2 font-semibold">{r.ref}</td>
                              <td className="px-3 py-2">{sup?.nom}</td>
                              <td className="num px-3 py-2 text-right">{r.articleIds.length}</td>
                              <td className="num px-3 py-2">{fmtDate(r.date)}</td>
                              <td className="num px-3 py-2">{fmtDate(r.reponseAttendue)}</td>
                              <td className="px-3 py-2"><StatusBadge>{r.statut}</StatusBadge></td>
                              <td className="num px-3 py-2 text-right">{r.relances}</td>
                              <td className="px-3 py-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    promat.updateRfq(r.id, { relances: r.relances + 1, statut: "En attente" });
                                    promat.log("Relance fournisseur", `${r.ref} — ${sup?.nom}`);
                                    toast.success("Relance envoyée au fournisseur.");
                                  }}
                                >
                                  Relancer
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {!rfqs.length ? <tr><td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">Aucune consultation lancée pour ce dossier.</td></tr> : null}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>

                <SectionCard title="Offres fournisseurs reçues" noPadding>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-sm">
                      <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                        <tr>{["Devis", "Fournisseur", "Date", "Validité", "Devise", "Incoterm", "Origine", "Lignes"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {quotes.map((q) => (
                          <tr key={q.id} className="hover:bg-accent/60">
                            <td className="num px-3 py-2 font-semibold">{q.ref}</td>
                            <td className="px-3 py-2">{promat.suppliers.find((s) => s.id === q.supplierId)?.nom}</td>
                            <td className="num px-3 py-2">{fmtDate(q.date)}</td>
                            <td className="num px-3 py-2">{fmtDate(q.validite)}</td>
                            <td className="num px-3 py-2">{q.devise}</td>
                            <td className="px-3 py-2">{q.incoterm}</td>
                            <td className="px-3 py-2">{q.origine}</td>
                            <td className="num px-3 py-2 text-right">{q.lignes.length}</td>
                          </tr>
                        ))}
                        {!quotes.length ? <tr><td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">Aucune offre reçue pour le moment.</td></tr> : null}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </TabsContent>

              {/* CHIFFRAGE */}
              <TabsContent value="chiffrage" className="mt-4">
                {costing ? (
                  <SectionCard title="Chiffrage rattaché" description={`Statut : ${costing.statut} — mis à jour le ${fmtDate(costing.updatedAt)}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Metric label="Articles chiffrés" value={String(Object.keys(costing.selections).length)} />
                        <Metric label="Marge appliquée" value={`${costing.margeGlobale} %`} tone={costing.margeGlobale < 15 ? "danger" : "success"} />
                        <Metric label="Frais d'approche" value={`${costing.fees.length} poste(s)`} />
                      </div>
                      <Button onClick={() => navigate({ to: "/chiffrages/$id", params: { id: costing.id } })}>
                        Ouvrir le chiffrage <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </SectionCard>
                ) : (
                  <EmptyState icon={<TrendingUp className="size-5" />} title="Aucun chiffrage" description="Créez le chiffrage pour comparer les offres fournisseurs et calculer le prix de revient." />
                )}
              </TabsContent>

              {/* HISTORIQUE */}
              <TabsContent value="historique" className="mt-4">
                <SectionCard title="Historique du dossier" noPadding>
                  <ul className="divide-y divide-border">
                    {activities.length ? (
                      activities.map((a) => (
                        <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                          <CheckCircle2 className="mt-0.5 size-4 text-success" />
                          <div>
                            <p className="text-sm font-semibold">{a.action}</p>
                            <p className="text-xs text-muted-foreground">{a.objet}{a.avant ? ` — ${a.avant} → ${a.apres}` : ""}</p>
                            <p className="num text-[11px] text-muted-foreground">{fmtDateTime(a.date)} — {a.utilisateur}</p>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-10 text-center text-sm text-muted-foreground">Aucune action enregistrée sur ce dossier.</li>
                    )}
                  </ul>
                </SectionCard>
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

      <GoDialog open={goOpen} onOpenChange={setGoOpen} tenderId={tender.id} />
      <NoGoDialog open={nogoOpen} onOpenChange={setNogoOpen} tenderId={tender.id} />
      <CreateRfqDialog open={rfqOpen} onOpenChange={setRfqOpen} tenderId={tender.id} />
      <AddQuoteDialog open={quoteOpen} onOpenChange={setQuoteOpen} tenderId={tender.id} />
      <ArticleDrawer article={articleOuvert} onClose={() => setArticleOuvert(null)} />
    </AppShell>
  );
}

function GoDialog({ open, onOpenChange, tenderId }: { open: boolean; onOpenChange: (v: boolean) => void; tenderId: string }) {
  const promat = usePromat();
  const tender = promat.tenders.find((t) => t.id === tenderId)!;
  const [form, setForm] = useState({ priorite: tender.priorite, responsable: tender.responsable, marge: String(tender.margeCible), deadline: "", commentaire: "" });
  const [saving, setSaving] = useState(false);

  const confirmer = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    promat.updateTender(tenderId, {
      statut: "GO",
      stageIndex: Math.max(tender.stageIndex, 3),
      avancement: Math.max(tender.avancement, 45),
      priorite: form.priorite as "Haute" | "Moyenne" | "Basse",
      responsable: form.responsable,
      margeCible: Number(form.marge) || 20,
      decision: { type: "GO", commentaire: form.commentaire, date: new Date().toISOString().slice(0, 10), par: promat.session?.nom ?? "PROMAT" },
    });
    promat.log("GO validé", tender.ref, tender.statut, "GO");
    promat.notify({ type: "AO", titre: "GO validé", message: `${tender.ref} — sourcing fournisseurs débloqué.`, priorite: "Haute", lien: `/appels-offres/${tenderId}` });
    setSaving(false);
    onOpenChange(false);
    toast.success("GO validé — sourcing fournisseurs débloqué.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirmer le GO</DialogTitle>
          <DialogDescription>Cette décision débloque l'extraction des articles et le sourcing fournisseurs.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Priorité</Label>
            <Select value={form.priorite} onValueChange={(v) => setForm({ ...form, priorite: v as typeof form.priorite })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Haute", "Moyenne", "Basse"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Responsable</Label>
            <Select value={form.responsable} onValueChange={(v) => setForm({ ...form, responsable: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{UTILISATEURS.map((u) => <SelectItem key={u.nom} value={u.nom}>{u.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Marge cible (%)</Label>
              <Input type="number" value={form.marge} onChange={(e) => setForm({ ...form, marge: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Deadline interne sourcing</Label>
              <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Commentaire</Label>
            <Textarea value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} placeholder="Contexte de la décision…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={confirmer} disabled={saving}>{saving ? <><Loader2 className="size-4 animate-spin" /> Validation…</> : "Confirmer le GO"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const MOTIFS = ["Non éligible", "Délai insuffisant", "Budget faible", "Risque technique", "Sourcing impossible", "Rentabilité insuffisante", "Hors stratégie", "Autre"];

function NoGoDialog({ open, onOpenChange, tenderId }: { open: boolean; onOpenChange: (v: boolean) => void; tenderId: string }) {
  const promat = usePromat();
  const tender = promat.tenders.find((t) => t.id === tenderId)!;
  const [motif, setMotif] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [saving, setSaving] = useState(false);

  const confirmer = async () => {
    if (!motif || !commentaire.trim()) {
      toast.error("Le motif et le commentaire sont obligatoires pour un NO GO.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    promat.updateTender(tenderId, {
      statut: "NO GO",
      decision: { type: "NO GO", motif, commentaire, date: new Date().toISOString().slice(0, 10), par: promat.session?.nom ?? "PROMAT" },
    });
    promat.log("NO GO validé", tender.ref, tender.statut, `NO GO (${motif})`);
    setSaving(false);
    onOpenChange(false);
    toast.success("Dossier classé NO GO");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Classer le dossier en NO GO</DialogTitle>
          <DialogDescription>Un motif documenté est requis pour la traçabilité et l'apprentissage de l'Agent.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Motif <span className="text-primary">*</span></Label>
            <Select value={motif} onValueChange={setMotif}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un motif" /></SelectTrigger>
              <SelectContent>{MOTIFS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Commentaire <span className="text-primary">*</span></Label>
            <Textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button variant="destructive" onClick={confirmer} disabled={saving}>{saving ? "Enregistrement…" : "Confirmer le NO GO"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ArticleDrawer({ article, onClose }: { article: Article | null; onClose: () => void }) {
  const promat = usePromat();
  const [edit, setEdit] = useState<Partial<Article>>({});
  const a = article;
  if (!a) return null;
  const quotes = promat.quotes.filter((q) => q.lignes.some((l) => l.articleId === a.id));
  const meilleure = quotes[0]?.lignes.find((l) => l.articleId === a.id);
  const variation = a.historique && meilleure ? ((meilleure.pu - a.historique.prix) / a.historique.prix) * 100 : null;
  const reco = recommendSupplier(a, quotes, promat.suppliers, promat.rates, 2.5);

  return (
    <Sheet open={!!a} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[min(34rem,100vw-1.5rem)] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{a.designation}</SheetTitle>
          <SheetDescription>Ligne {a.ligne} — {a.refClient}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          <SectionCard title="Besoin client">
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Désignation</Label>
                <Input defaultValue={a.designation} onChange={(e) => setEdit({ ...edit, designation: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Spécifications techniques</Label>
                <Textarea defaultValue={a.specifications} onChange={(e) => setEdit({ ...edit, specifications: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5"><Label className="text-xs">Quantité</Label><Input type="number" defaultValue={a.qte} onChange={(e) => setEdit({ ...edit, qte: Number(e.target.value) })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Unité</Label><Input defaultValue={a.unite} onChange={(e) => setEdit({ ...edit, unite: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Marque</Label><Input defaultValue={a.marque} onChange={(e) => setEdit({ ...edit, marque: e.target.value })} /></div>
              </div>
              <Button
                onClick={() => {
                  promat.updateArticle(a.id, edit);
                  promat.log("Article modifié", `${a.refClient} — ${a.designation}`);
                  toast.success("Article mis à jour");
                }}
              >
                Enregistrer les modifications
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Données PROMAT" noPadding>
            <dl className="text-sm">
              {[
                ["Référence interne", a.refInterne],
                ["Famille produit", a.famille],
                ["Code douanier", a.codeDouane],
                ["Origine attendue", a.origine],
                ["Poids unitaire", `${a.poidsKg} kg`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border px-4 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
          </SectionCard>

          {a.historique ? (
            <SectionCard title="Intelligence historique">
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-xs text-muted-foreground">Dernier achat</dt><dd className="num font-medium">{fmtDate(a.historique.date)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Fournisseur précédent</dt><dd className="font-medium">{a.historique.fournisseur}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Prix précédent</dt><dd className="num font-medium">{fmtMAD(a.historique.prix)} {a.historique.devise}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Quantité</dt><dd className="num font-medium">{a.historique.qte}</dd></div>
                {meilleure ? (
                  <>
                    <div><dt className="text-xs text-muted-foreground">Nouveau prix</dt><dd className="num font-medium">{fmtMAD(meilleure.pu)}</dd></div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Variation</dt>
                      <dd className={cn("num font-bold", (variation ?? 0) > 0 ? "text-danger" : "text-success")}>
                        {(variation ?? 0) > 0 ? "+" : ""}{(variation ?? 0).toFixed(1)} %
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>
              {variation !== null && variation > 5 ? (
                <p className="mt-3 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
                  Prix supérieur à l'historique — négociation recommandée.
                </p>
              ) : null}
            </SectionCard>
          ) : null}

          <SectionCard title="Fournisseurs & offres">
            {reco ? (
              <div className="rounded-lg border border-success/30 bg-success-soft p-3">
                <p className="text-sm font-bold text-success">Fournisseur recommandé — {reco.supplier.nom} ({reco.score}/100)</p>
                <ul className="mt-1.5 grid gap-0.5 text-xs text-success">{reco.raisons.map((r) => <li key={r}>✓ {r}</li>)}</ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune offre reçue pour cet article.</p>
            )}
            <ul className="mt-3 space-y-1 text-sm">
              {quotes.map((q) => {
                const l = q.lignes.find((x) => x.articleId === a.id)!;
                return (
                  <li key={q.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <span>{promat.suppliers.find((s) => s.id === q.supplierId)?.nom}</span>
                    <span className="num">{fmtMAD(l.pu)} {q.devise}</span>
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <SectionCard title="Documents techniques">
            <ul className="space-y-1 text-sm">
              {a.docs.map((d) => (
                <li key={d} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span className="inline-flex items-center gap-2"><FileText className="size-4 text-info" /> {d}</span>
                  <Button size="sm" variant="ghost" onClick={() => toast.info(`Aperçu « ${d} » ouvert.`)}>Aperçu</Button>
                </li>
              ))}
            </ul>
          </SectionCard>

          <div>
            <Label className="text-xs">Conformité technique</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Progress value={meilleure?.conformite ?? 0} className="h-2" />
              <span className="num text-xs">{meilleure?.conformite ?? 0} %</span>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <Checkbox
                checked={a.conformite === "Conforme"}
                onCheckedChange={(v) => {
                  promat.updateArticle(a.id, { conformite: v ? "Conforme" : "À vérifier" });
                  toast.success("Conformité mise à jour");
                }}
              />
              Valider la conformité de cette ligne
            </label>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
