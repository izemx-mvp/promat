import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowUpDown, Check, MoreHorizontal, Plus, Search, Sparkles, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/promat/shell";
import { GhostButton, Modal, PrimaryButton } from "@/components/promat/form-kit";
import { Pill, SectionCard } from "@/components/promat/ui";
import { NextButton, StickyBar } from "@/components/promat/workflow";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePromat } from "@/lib/promat/store";
import {
  ignoreReasons,
  opportunities,
  readinessMeta,
  type Opportunity,
} from "@/lib/promat/opportunities";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recherches AO — PROMAT Maroc" },
      {
        name: "description",
        content:
          "Configurez vos recherches d'appels d'offres, préqualifiez les opportunités détectées par l'Agent AO & Analyse et décidez lesquelles mériter une analyse complète.",
      },
      { property: "og:title", content: "Recherches AO — PROMAT Maroc" },
      {
        property: "og:description",
        content:
          "Recherches enregistrées, opportunités détectées et préqualification avant analyse complète.",
      },
    ],
  }),
  component: RecherchesPage,
});

type SavedSearch = {
  id: string;
  name: string;
  keywords: string;
  last: string;
  frequency: string;
  sources: string[];
  active: boolean;
};

const frequencies = ["Toutes les heures", "Tous les jours", "Chaque semaine", "Manuelle"];
const allSources = ["Portail des marchés publics", "ONEE", "OCP", "Autres sources configurées"];
const wizardSteps = ["Mots-clés", "Sources", "Filtres", "Fréquence", "Récapitulatif"];


const initialSearches: SavedSearch[] = [
  { id: "r1", name: "Pièces de rechange", keywords: "Terex, Grove, Potain, pièces détachées", last: "Aujourd'hui à 08:00", frequency: "Tous les jours", sources: allSources.slice(0, 3), active: true },
  { id: "r2", name: "Levage & manutention", keywords: "grue, palan, treuil, manutention portuaire", last: "Hier à 08:00", frequency: "Chaque semaine", sources: allSources.slice(0, 2), active: true },
  { id: "r3", name: "Équipements hydrauliques", keywords: "groupe hydraulique, vérin, pompe, flexible", last: "Aujourd'hui à 08:00", frequency: "Tous les jours", sources: allSources.slice(0, 3), active: true },
  { id: "r4", name: "Instrumentation", keywords: "débitmètre, capteur de pression, transmetteur", last: "Aujourd'hui à 08:00", frequency: "Toutes les heures", sources: allSources, active: true },
  { id: "r5", name: "Équipements industriels", keywords: "compresseur, vanne, réducteur", last: "Il y a 3 jours", frequency: "Manuelle", sources: allSources.slice(0, 1), active: false },
];

const filters = [
  { id: "all", label: "Tous" },
  { id: "top", label: "Très pertinents > 90 %" },
  { id: "budget", label: "Budget" },
  { id: "deadline", label: "Échéance proche" },
  { id: "today", label: "Nouveaux aujourd'hui" },
  { id: "seen", label: "Déjà consultés" },
];

const sorts = [
  { id: "score", label: "Pertinence" },
  { id: "budget", label: "Budget" },
  { id: "deadline", label: "Échéance" },
];

type Processed = Record<string, "added" | "ignored">;

function ReadinessCard({ o }: { o: Opportunity }) {
  const meta = readinessMeta[o.readiness];
  const tones = {
    ok: "border-success/30 bg-success-soft text-success",
    warn: "border-warning/30 bg-warning-soft text-warning",
    bad: "border-destructive/30 bg-destructive/10 text-destructive",
  } as const;
  return (
    <div className={cn("rounded-xl border p-4", tones[meta.tone])}>
      <p className="text-xs font-semibold uppercase tracking-wide">Possibilité d'analyse</p>
      <p className="mt-1 text-[17px] font-semibold">{meta.label}</p>
      <p className="mt-1.5 text-sm text-foreground/75">{o.readinessText}</p>
    </div>
  );
}

function RecherchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>(initialSearches);
  const [query, setQuery] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const [immediate, setImmediate] = useState<string | null>(null);
  const [cfgOpen, setCfgOpen] = useState(false);

  const [freq, setFreq] = useState("Tous les jours");
  const [sources, setSources] = useState<string[]>(allSources.slice(0, 3));
  const [minBudget, setMinBudget] = useState("");
  const [client, setClient] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("score");
  const [processed, setProcessed] = useState<Processed>({});
  const [detail, setDetail] = useState<Opportunity | null>(null);
  const [askIgnore, setAskIgnore] = useState(false);
  const navigate = useNavigate();
  const { addLog } = usePromat();

  const remaining = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of searches) {
      map[s.id] = opportunities.filter((o) => o.searchId === s.id && !processed[o.id]).length;
    }
    return map;
  }, [processed, searches]);

  const list = useMemo(() => {
    let l = opportunities.filter((o) => {
      if (processed[o.id] === "ignored") return false;
      if (immediate !== null) {
        const terms = immediate
          .toLowerCase()
          .split(/[,\s]+/)
          .filter(Boolean);
        if (terms.length === 0) return true;
        const hay = `${o.client} ${o.object} ${o.title} ${o.ref}`.toLowerCase();
        return terms.some((t) => hay.includes(t));
      }
      return o.searchId === active;
    });
    if (filter === "top") l = l.filter((o) => o.score > 90);
    if (filter === "budget") l = l.filter((o) => o.budget >= 1000000);
    if (filter === "deadline") l = l.filter((o) => o.daysLeft <= 10);
    if (filter === "today") l = l.filter((o) => o.today);
    if (filter === "seen") l = l.filter((o) => o.seen);
    const sorted = [...l];
    if (sort === "score") sorted.sort((a, b) => b.score - a.score);
    if (sort === "budget") sorted.sort((a, b) => b.budget - a.budget);
    if (sort === "deadline") sorted.sort((a, b) => a.daysLeft - b.daysLeft);
    return sorted;
  }, [active, filter, sort, processed, immediate]);

  const savedSearch = searches.find((s) => s.id === active);
  const activeSearch: SavedSearch | undefined =
    immediate !== null
      ? {
          id: "__immediate",
          name: immediate || "Recherche immédiate",
          keywords: immediate,
          last: "À l'instant",
          frequency: "Recherche immédiate",
          sources: allSources,
          active: false,
        }
      : savedSearch;

  function close() {
    setDetail(null);
    setAskIgnore(false);
  }

  function goNext(o: Opportunity) {
    if (o.tenderId) {
      navigate({ to: "/analyses/$id", params: { id: o.tenderId } });
    } else {
      toast.info("Dossier créé. L'analyse sera disponible dès réception des documents.");
    }
  }

  function addOnly(o: Opportunity) {
    setProcessed((p) => ({ ...p, [o.id]: "added" }));
    addLog({ who: "Houda Bennani", action: "Opportunité ajoutée aux AO", tender: o.client, module: "Recherches AO" });
    toast.success(`${o.ref} ajouté aux AO suivis`);
    close();
    goNext(o);
  }

  function addAndAnalyse(o: Opportunity) {
    setProcessed((p) => ({ ...p, [o.id]: "added" }));
    addLog({ who: "Houda Bennani", action: "Analyse complète lancée", tender: o.client, module: "Recherches AO" });
    close();
    if (o.tenderId) toast.success("Analyse complète lancée par l'Agent AO");
    goNext(o);
  }

  function ignore(o: Opportunity, reason: string) {
    setProcessed((p) => ({ ...p, [o.id]: "ignored" }));
    addLog({ who: "Houda Bennani", action: `Opportunité ignorée — ${reason}`, tender: o.client, module: "Recherches AO" });
    toast.success("Opportunité ignorée. Merci, l'Agent en tiendra compte.");
    close();
  }

  function patchSearch(id: string, patch: Partial<SavedSearch>) {
    setSearches((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function openResults(id: string) {
    setImmediate(null);
    setActive(id);
    setFilter("all");
  }

  function runNow(s: SavedSearch) {
    patchSearch(s.id, { last: "À l'instant" });
    const n = opportunities.filter((o) => o.searchId === s.id && !processed[o.id]).length;
    toast.success(`${n} nouvelles opportunités détectées pour ${s.name}`);
    openResults(s.id);
  }

  function runImmediate() {
    const kw = quickQuery.trim();
    if (!kw) return;
    setQuickOpen(false);
    setActive(null);
    setImmediate(kw);
    setFilter("all");
    toast.success(`Recherche lancée pour « ${kw} »`);
  }

  function openConfig() {
    setQuery("");
    setFreq("Tous les jours");
    setSources(allSources.slice(0, 3));
    setMinBudget("");
    setClient("");
    setCfgOpen(true);
  }

  function saveSearch() {
    const kw = query.trim();
    if (!kw || sources.length === 0) return;
    const id = `r${Date.now()}`;
    setSearches((p) => [
      {
        id,
        name: kw,
        keywords: [kw, client && `client : ${client}`, minBudget && `budget ≥ ${minBudget} MAD`]
          .filter(Boolean)
          .join(" · "),
        last: "À l'instant",
        frequency: freq,
        sources,
        active: freq !== "Manuelle",
      },
      ...p,
    ]);
    setCfgOpen(false);
    toast.success(`Recherche automatique enregistrée — relance ${freq.toLowerCase()}`);
  }



  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
        {activeSearch ? (
          <>
            <button
              onClick={() => {
                setActive(null);
                setImmediate(null);
              }}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Retour aux recherches
            </button>
            <PageHeader
              eyebrow={`Résultats · ${activeSearch.frequency.toLowerCase()}`}
              title={activeSearch.name}
              subtitle="Consultez les informations essentielles avant de décider si l'appel d'offres doit être analysé."
              action={
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {immediate !== null ? list.length : remaining[activeSearch.id]} opportunités
                  </p>
                  <p className="text-xs text-muted-foreground">Dernière recherche : {activeSearch.last}</p>
                </div>
              }
            />
          </>
        ) : (
          <>
            <PageHeader
              title="Recherches AO"
              subtitle="L'Agent AO surveille les sources et remonte les opportunités. Vous les préqualifiez avant toute analyse complète."
              action={
                <div className="flex items-center gap-2">
                  <GhostButton onClick={openConfig}>
                    <Settings2 className="size-4" /> Configuration
                  </GhostButton>
                  <button
                    onClick={() => {
                      setQuickQuery("");
                      setQuickOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Search className="size-4" /> Nouvelle recherche
                  </button>
                </div>
              }
            />

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border pb-4">
              <p className="label-xs text-primary">Étape 1 sur 7 · Recherches AO</p>
              <p className="text-xs text-muted-foreground">Prochaine étape : Analyses</p>
            </div>
          </>
        )}

        <div className={cn("grid gap-3 lg:grid-cols-2", activeSearch && "hidden")}>

          {searches.map((s) => {
            const n = remaining[s.id] ?? 0;
            return (
              <div
                key={s.id}
                className={cn(
                  "card-soft p-5 transition-shadow",
                  active === s.id ? "border-primary/40 shadow-lift" : "",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold">{s.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.active ? "Recherche automatique" : "Recherche en pause"} · {s.frequency}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {n > 0 ? (
                      <button onClick={() => openResults(s.id)} className="rounded-full transition-transform hover:scale-[1.03]">
                        <Pill tone={n > 3 ? "ai" : "primary"} className="cursor-pointer">
                          {n} nouvelles
                        </Pill>
                      </button>
                    ) : (
                      <Pill tone="ok">
                        <Check className="size-3.5" strokeWidth={3} /> À jour
                      </Pill>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label="Actions de la recherche"
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Fréquence</DropdownMenuLabel>
                        {frequencies.map((f) => (
                          <DropdownMenuItem
                            key={f}
                            onClick={() => {
                              patchSearch(s.id, { frequency: f });
                              toast.success(`Fréquence mise à jour : ${f.toLowerCase()}`);
                            }}
                          >
                            {f}
                            {s.frequency === f && <Check className="ml-auto size-3.5 text-success" strokeWidth={3} />}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => runNow(s)}>Lancer maintenant</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            patchSearch(s.id, { active: !s.active });
                            toast.success(s.active ? "Recherche mise en pause" : "Recherche réactivée");
                          }}
                        >
                          {s.active ? "Mettre en pause" : "Réactiver"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSearches((p) => p.filter((x) => x.id !== s.id));
                            if (active === s.id) setActive(null);
                            toast.success("Recherche supprimée");
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{s.keywords}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    <p>Dernière recherche : {s.last}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5">
                      <span className={cn("size-2 rounded-full", s.active ? "bg-success" : "bg-muted-foreground/50")} />
                      {s.active ? "Active" : "En pause"}
                    </p>
                  </div>
                  {n > 0 && (
                    <button
                      onClick={() => openResults(s.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted"
                    >
                      Voir les résultats
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {activeSearch && (
          <SectionCard
            title="Nouvelles opportunités détectées"
            subtitle="Sélectionnez « Voir » pour préqualifier une opportunité."
          >

            <div className="mb-5 flex flex-wrap items-center gap-2">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                    filter === f.id
                      ? "bg-navy text-navy-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent",
                  )}
                >
                  {f.label}
                </button>
              ))}
              <span className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
                <ArrowUpDown className="size-3.5" /> Trier par
                {sorts.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSort(s.id)}
                    className={cn(
                      "rounded-md px-2 py-1 text-[13px] font-medium transition-colors",
                      sort === s.id ? "bg-primary/10 text-primary" : "hover:bg-muted",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Pertinence", "Client", "Référence", "Objet", "Budget", "Échéance", "Source", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {list.map((o) => (
                    <tr key={o.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3.5 pr-4 font-semibold tabular-nums text-ai">{o.score} %</td>
                      <td className="py-3.5 pr-4 font-medium">
                        {o.client}
                        {processed[o.id] === "added" && (
                          <Pill tone="ok" className="ml-2">
                            Ajouté
                          </Pill>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 tabular-nums text-muted-foreground">{o.ref}</td>
                      <td className="py-3.5 pr-4">{o.object}</td>
                      <td className="py-3.5 pr-4 tabular-nums">{o.budgetLabel.replace(" TTC", "")}</td>
                      <td className="py-3.5 pr-4 text-muted-foreground">{o.deadline}</td>
                      <td className="py-3.5 pr-4 text-muted-foreground">{o.source}</td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => {
                            setDetail(o);
                            setAskIgnore(false);
                          }}
                          className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted"
                        >
                          Voir
                        </button>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                        Aucune opportunité pour ce filtre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

      </div>

      {/* Assistant de création de recherche */}
      <Modal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title="Nouvelle recherche automatique"
        subtitle={`Étape ${step + 1} sur ${wizardSteps.length} · ${wizardSteps[step]}`}
        width="max-w-2xl"
        footer={
          <>
            <GhostButton
              onClick={() => (step === 0 ? setWizardOpen(false) : setStep(step - 1))}
              className="mr-auto"
            >
              {step === 0 ? "Annuler" : "Retour"}
            </GhostButton>
            {step < wizardSteps.length - 1 ? (
              <PrimaryButton
                onClick={() => setStep(step + 1)}
                disabled={(step === 0 && !query.trim()) || (step === 1 && sources.length === 0)}
              >
                Continuer
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={saveSearch}>
                <Plus className="size-4" /> Enregistrer la recherche
              </PrimaryButton>
            )}
          </>
        }
      >
        <div className="pb-4">
          <ol className="mb-6 flex items-center gap-2">
            {wizardSteps.map((label, i) => (
              <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    i < step
                      ? "bg-success text-white"
                      : i === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden truncate text-[11.5px] font-medium sm:block",
                    i === step ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
                {i < wizardSteps.length - 1 && <span className="h-px flex-1 bg-border" />}
              </li>
            ))}
          </ol>

          {step === 0 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex : débitmètre, Terex, pompe hydraulique, pièces de rechange…"
                  className="h-14 w-full rounded-xl border border-border bg-background pl-12 pr-4 text-[16px] outline-none transition placeholder:text-muted-foreground focus:border-ring"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Séparez les mots-clés par des virgules. L'Agent AO les utilise pour analyser les avis publiés.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2">
              {allSources.map((s) => {
                const on = sources.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => setSources((p) => (on ? p.filter((x) => x !== s) : [...p, s]))}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                      on ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-md border",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {on && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    {s}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label-xs">Budget minimum (MAD)</span>
                <input
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  placeholder="500 000"
                  className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-ring"
                />
              </label>
              <label className="block">
                <span className="label-xs">Client ciblé</span>
                <input
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="ONEE"
                  className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-ring"
                />
              </label>
              <p className="text-sm text-muted-foreground sm:col-span-2">
                Ces filtres sont optionnels. Laissez vide pour recevoir toutes les opportunités correspondantes.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {frequencies.map((f) => (
                <button
                  key={f}
                  onClick={() => setFreq(f)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-[13px] font-medium transition-colors",
                    freq === f ? "border-primary/40 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {[
                ["Mots-clés", query.trim()],
                ["Sources", sources.join(", ")],
                ["Budget minimum", minBudget ? `${minBudget} MAD` : "Aucun"],
                ["Client ciblé", client || "Tous"],
                ["Fréquence", freq],
                ["Statut", freq === "Manuelle" ? "En pause (lancement manuel)" : "Active"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label-xs">{k}</dt>
                  <dd className="mt-0.5 text-[15px] font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Modal>


      {selectedTenderId && (
        <StickyBar message="Opportunité ajoutée. Le dossier est prêt pour l’analyse complète.">
          <NextButton to="/analyses/$id" id={selectedTenderId} label="Passer à l'analyse" />
        </StickyBar>
      )}

      {/* Détail préqualification */}
      <Sheet open={!!detail} onOpenChange={(v) => !v && close()}>
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-2xl">
          {detail && (
            <>
              <SheetHeader>
                <p className="text-sm font-medium text-muted-foreground">{detail.client}</p>
                <SheetTitle className="text-[22px] leading-snug">
                  AO {detail.ref}
                  <span className="mt-1 block text-[17px] font-semibold text-foreground/85">
                    {detail.title}
                  </span>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6 pb-4">
                <div>
                  <h4 className="section-title text-[17px]">Informations clés</h4>
                  <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {[
                      ["Client", detail.client],
                      ["Référence", detail.ref],
                      ["Budget", detail.budgetLabel],
                      ["Échéance", detail.deadlineLong],
                      ["Lieu", detail.place],
                      ["Source", detail.sourceLong],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="label-xs">{k}</dt>
                        <dd className="mt-0.5 text-[15px] font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="rounded-xl border border-ai/25 bg-ai-soft/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="inline-flex items-center gap-2 text-[16px] font-semibold text-ai">
                      <Sparkles className="size-4" /> Pourquoi cette opportunité ?
                    </h4>
                    <span className="text-sm font-semibold tabular-nums text-ai">
                      Pertinence {detail.score} %
                    </span>
                  </div>
                  <p className="mt-3 label-xs">Correspondances détectées</p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {detail.matches.map((m) => (
                      <li key={m} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={3} />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="section-title text-[17px]">Résumé de l'opportunité</h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {detail.summary}
                  </p>
                </div>

                <div>
                  <h4 className="section-title text-[17px]">Documents disponibles</h4>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {detail.documents.map((d) => (
                      <li key={d.label} className="flex items-center gap-2">
                        {d.ok ? (
                          <Check className="size-4 shrink-0 text-success" strokeWidth={3} />
                        ) : (
                          <AlertTriangle className="size-4 shrink-0 text-warning" />
                        )}
                        <span className={d.ok ? "" : "text-muted-foreground"}>
                          {d.ok ? d.label : `${d.label} non récupéré`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <ReadinessCard o={detail} />

                {askIgnore && (
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Pourquoi ignorer ?</p>
                      <button
                        onClick={() => setAskIgnore(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ignoreReasons.map((r) => (
                        <button
                          key={r}
                          onClick={() => ignore(detail, r)}
                          className="rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-accent"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  onClick={() => setAskIgnore(true)}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Ignorer
                </button>
                <button
                  onClick={() => addOnly(detail)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  Ajouter aux AO
                </button>
                <button
                  onClick={() => addAndAnalyse(detail)}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Ajouter et analyser
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </AppShell>
  );
}
