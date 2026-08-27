import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, Bookmark, FileUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/promat/AppShell";
import { FilterChips, PageHeader, ScoreBadge, SectionCard, StatusBadge } from "@/components/promat/ui";
import { usePromat, newId } from "@/lib/promat/store";
import { fmtDate, fmtInt } from "@/lib/promat/calc";
import { FAMILLES, STAGES, UTILISATEURS, type Tender } from "@/lib/promat/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/appels-offres/")({
  head: () => ({
    meta: [
      { title: "Appels d'offres — PROMAT" },
      { name: "description", content: "Centralisez, analysez et qualifiez les opportunités commerciales PROMAT." },
      { property: "og:title", content: "Appels d'offres — PROMAT" },
      { property: "og:description", content: "Liste des appels d'offres détectés, analysés et qualifiés." },
    ],
  }),
  component: ListePage,
});

const TABS: { key: string; label: string; match: (t: Tender) => boolean }[] = [
  { key: "tous", label: "Tous", match: () => true },
  { key: "nouveaux", label: "Nouveaux", match: (t) => t.statut === "Nouveau" },
  { key: "analyser", label: "À analyser", match: (t) => t.statut === "À analyser" },
  { key: "decider", label: "À décider", match: (t) => t.statut === "À décider" },
  { key: "go", label: "GO", match: (t) => t.statut === "GO" },
  { key: "nogo", label: "NO GO", match: (t) => t.statut === "NO GO" },
  { key: "traitement", label: "En traitement", match: (t) => t.statut === "En traitement" },
  { key: "deposes", label: "Déposés", match: (t) => t.statut === "Déposé" },
  { key: "gagnes", label: "Gagnés", match: (t) => t.statut === "Gagné" },
  { key: "perdus", label: "Perdus", match: (t) => t.statut === "Perdu" },
];

const PAGE_SIZE = 8;

function ListePage() {
  const promat = usePromat();
  const navigate = useNavigate();
  const [tab, setTab] = useState("tous");
  const [q, setQ] = useState("");
  const [client, setClient] = useState("");
  const [famille, setFamille] = useState("");
  const [responsable, setResponsable] = useState("");
  const [scoreMin, setScoreMin] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [sort, setSort] = useState<{ col: keyof Tender; dir: 1 | -1 }>({ col: "dateLimite", dir: 1 });
  const [page, setPage] = useState(1);
  const [openNew, setOpenNew] = useState(false);

  const clients = [...new Set(promat.tenders.map((t) => t.client))];

  const filtered = useMemo(() => {
    const tabDef = TABS.find((t) => t.key === tab)!;
    const list = promat.tenders.filter((t) => {
      if (!tabDef.match(t)) return false;
      if (q && ![t.ref, t.client, t.objet].join(" ").toLowerCase().includes(q.toLowerCase())) return false;
      if (client && t.client !== client) return false;
      if (famille && t.famille !== famille) return false;
      if (responsable && t.responsable !== responsable) return false;
      if (scoreMin && t.score < Number(scoreMin)) return false;
      if (budgetMin && t.budget < Number(budgetMin)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const va = a[sort.col] as string | number;
      const vb = b[sort.col] as string | number;
      return (va > vb ? 1 : va < vb ? -1 : 0) * sort.dir;
    });
  }, [promat.tenders, tab, q, client, famille, responsable, scoreMin, budgetMin, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const chips = [
    q && { key: "q", label: `Recherche : ${q}` },
    client && { key: "client", label: `Client : ${client}` },
    famille && { key: "famille", label: `Famille : ${famille}` },
    responsable && { key: "responsable", label: `Responsable : ${responsable}` },
    scoreMin && { key: "scoreMin", label: `Score > ${scoreMin} %` },
    budgetMin && { key: "budgetMin", label: `Budget ≥ ${fmtInt(Number(budgetMin))} MAD` },
  ].filter(Boolean) as { key: string; label: string }[];

  const removeChip = (key: string) => {
    const setters: Record<string, (v: string) => void> = {
      q: setQ,
      client: setClient,
      famille: setFamille,
      responsable: setResponsable,
      scoreMin: setScoreMin,
      budgetMin: setBudgetMin,
    };
    setters[key]?.("");
  };
  const reset = () => {
    [setQ, setClient, setFamille, setResponsable, setScoreMin, setBudgetMin].forEach((s) => s(""));
    setPage(1);
  };

  const applyView = (v: { filtres: Record<string, string> }) => {
    reset();
    if (v.filtres['statut']) setTab(TABS.find((t) => t.label === v.filtres['statut'])?.key ?? "tous");
    if (v.filtres['scoreMin']) setScoreMin(v.filtres['scoreMin']);
    if (v.filtres['priorite']) setQ("");
    toast.success("Vue appliquée");
  };

  const sortBy = (col: keyof Tender) => setSort((s) => ({ col, dir: s.col === col && s.dir === 1 ? -1 : 1 }));

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <PageHeader
          title="Appels d'offres"
          subtitle="Centralisez, analysez et qualifiez les opportunités commerciales."
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => toast.success("Dossier AO importé — 6 documents détectés et rattachés.")}
              >
                <FileUp className="size-4" /> Importer un dossier AO
              </Button>
              <Button onClick={() => setOpenNew(true)}>
                <Plus className="size-4" /> Ajouter un AO
              </Button>
            </>
          }
        />

        <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="text-xs">
                {t.label}
                <span className="num ml-1.5 rounded bg-muted px-1 text-[10px]">
                  {promat.tenders.filter(t.match).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <SectionCard>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="space-y-1">
              <Label className="text-xs">Recherche</Label>
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Référence, client, objet…" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Client</Label>
              <Select value={client || "all"} onValueChange={(v) => setClient(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {clients.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Famille produit</Label>
              <Select value={famille || "all"} onValueChange={(v) => setFamille(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les familles</SelectItem>
                  {FAMILLES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Responsable</Label>
              <Select value={responsable || "all"} onValueChange={(v) => setResponsable(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {UTILISATEURS.map((u) => <SelectItem key={u.nom} value={u.nom}>{u.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Score minimum</Label>
              <Input type="number" value={scoreMin} onChange={(e) => setScoreMin(e.target.value)} placeholder="0 – 100" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Budget minimum (MAD)</Label>
              <Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <FilterChips chips={chips} onRemove={removeChip} onReset={reset} />
            <div className="flex flex-wrap items-center gap-2">
              {promat.views.filter((v) => v.page === "appels-offres").map((v) => (
                <Button key={v.id} variant="secondary" size="sm" onClick={() => applyView(v)} className="h-7 text-xs">
                  <Bookmark className="size-3" /> {v.nom}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const nom = `Vue du ${new Date().toLocaleDateString("fr-FR")}`;
                  promat.addView({
                    id: newId("v"),
                    nom,
                    page: "appels-offres",
                    filtres: { scoreMin, statut: TABS.find((t) => t.key === tab)?.label ?? "" },
                  });
                  toast.success("Vue enregistrée");
                }}
              >
                Enregistrer la vue
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard noPadding>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="sticky top-0 z-10 bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                <tr>
                  {([
                    ["score", "Score"],
                    ["ref", "Référence"],
                    ["client", "Client"],
                    ["objet", "Objet"],
                    ["budget", "Budget"],
                    ["caution", "Caution"],
                    ["dateLimite", "Date limite"],
                    ["stageIndex", "Étape"],
                    ["responsable", "Responsable"],
                  ] as [keyof Tender, string][]).map(([col, label]) => (
                    <th key={col} className="px-3 py-2 font-semibold whitespace-nowrap">
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => sortBy(col)}>
                        {label} <ArrowUpDown className="size-3" />
                      </button>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {current.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-accent/60">
                    <td className="px-3 py-2"><ScoreBadge score={t.score} /></td>
                    <td className="num px-3 py-2 font-semibold whitespace-nowrap">{t.ref}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{t.client}</td>
                    <td className="max-w-[240px] truncate px-3 py-2">{t.objet}</td>
                    <td className="num px-3 py-2 text-right whitespace-nowrap">{fmtInt(t.budget)}</td>
                    <td className="num px-3 py-2 text-right whitespace-nowrap">{fmtInt(t.caution)}</td>
                    <td className="num px-3 py-2 whitespace-nowrap">{fmtDate(t.dateLimite)}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><StatusBadge tone="navy">{STAGES[t.stageIndex]}</StatusBadge></td>
                    <td className="px-3 py-2 whitespace-nowrap">{t.responsable}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => navigate({ to: "/appels-offres/$id", params: { id: t.id } })}>
                          Ouvrir
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            promat.updateTender(t.id, { statut: "À décider", stageIndex: Math.max(t.stageIndex, 1) });
                            promat.log("Analyse lancée", t.ref);
                            toast.success(`Analyse de ${t.ref} terminée — synthèse disponible.`);
                          }}
                        >
                          Analyser
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!current.length ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-sm text-muted-foreground">
                      Aucun appel d'offres ne correspond à ces critères.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span className="num">{filtered.length} résultat(s)</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Précédent</Button>
              {Array.from({ length: pages }).map((_, i) => (
                <Button key={i} size="sm" variant={page === i + 1 ? "default" : "ghost"} className={cn("num w-8")} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
            </div>
          </div>
        </SectionCard>
      </div>

      <NouveauAoDialog open={openNew} onOpenChange={setOpenNew} />
    </AppShell>
  );
}

function NouveauAoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const promat = usePromat();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ref: "",
    client: "ONEE – Branche Eau",
    objet: "",
    budget: "",
    caution: "",
    dateLimite: "",
    famille: "Équipements industriels",
    responsable: "Yassine El Mansouri",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.ref.trim() || !form.objet.trim() || !form.dateLimite) {
      toast.error("Référence, objet et date limite sont obligatoires.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    const id = newId("ao");
    const tender = {
      id,
      ref: form.ref,
      client: form.client,
      objet: form.objet,
      budget: Number(form.budget) || 0,
      caution: Number(form.caution) || 0,
      publication: new Date().toISOString().slice(0, 10),
      dateLimite: form.dateLimite,
      ouverturePlis: form.dateLimite,
      lieu: "Maroc",
      procedure: "Appel d'offres ouvert",
      financement: "À préciser",
      lots: "Lot unique",
      score: 60 + Math.round(Math.random() * 30),
      risque: "Moyen" as const,
      stageIndex: 0,
      statut: "Nouveau" as const,
      responsable: form.responsable,
      priorite: "Moyenne" as const,
      famille: form.famille,
      region: "National",
      margeCible: 20,
      avancement: 5,
      admin: [],
      exigences: [],
      commercial: [],
      risques: [],
      eligibilite: [],
    };
    promat.addTender(tender);
    promat.log("AO créé", form.ref);
    promat.notify({ type: "AO", titre: "Nouvel AO créé", message: `${form.ref} — ${form.client}`, priorite: "Moyenne", lien: `/appels-offres/${id}` });
    setSaving(false);
    onOpenChange(false);
    toast.success("AO créé avec succès");
    navigate({ to: "/appels-offres/$id", params: { id } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un appel d'offres</DialogTitle>
          <DialogDescription>Renseignez les informations essentielles, l'Agent Recherche AO complètera l'analyse.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Référence <span className="text-primary">*</span></Label>
            <Input value={form.ref} onChange={(e) => set("ref", e.target.value)} placeholder="AO 00/CLIENT/2026" />
          </div>
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select value={form.client} onValueChange={(v) => set("client", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["ONEE – Branche Eau", "ONEE – Branche Électricité", "OCP Group", "Marsa Maroc", "ONCF", "ADM – Autoroutes du Maroc"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Objet <span className="text-primary">*</span></Label>
            <Input value={form.objet} onChange={(e) => set("objet", e.target.value)} placeholder="Acquisition de…" />
          </div>
          <div className="space-y-1.5">
            <Label>Budget (MAD)</Label>
            <Input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Caution (MAD)</Label>
            <Input type="number" value={form.caution} onChange={(e) => set("caution", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Date limite <span className="text-primary">*</span></Label>
            <Input type="date" value={form.dateLimite} onChange={(e) => set("dateLimite", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Famille produit</Label>
            <Select value={form.famille} onValueChange={(v) => set("famille", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FAMILLES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Enregistrement…" : "Créer l'AO"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
