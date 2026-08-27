import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/promat/AppShell";
import { Metric, PageHeader, SectionCard, StatusBadge } from "@/components/promat/ui";
import { newId, usePromat } from "@/lib/promat/store";
import { fmtDate } from "@/lib/promat/calc";
import type { SavedSearch } from "@/lib/promat/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/recherches")({
  head: () => ({
    meta: [
      { title: "Recherches AO — PROMAT" },
      { name: "description", content: "Veille automatisée des appels d'offres pertinents pour PROMAT Morocco." },
      { property: "og:title", content: "Recherches AO — PROMAT" },
      { property: "og:description", content: "Profils de veille, mots-clés et détection d'appels d'offres." },
    ],
  }),
  component: RecherchesPage,
});

function RecherchesPage() {
  const promat = usePromat();
  const [form, setForm] = useState({ nom: "", motsCles: "", exclus: "", region: "National", budgetMin: "", budgetMax: "" });
  const [running, setRunning] = useState<string | null>(null);

  const creer = () => {
    if (!form.nom.trim() || !form.motsCles.trim()) {
      toast.error("Nom et mots-clés sont obligatoires.");
      return;
    }
    const s: SavedSearch = {
      id: newId("rec"),
      nom: form.nom,
      motsCles: form.motsCles.split(",").map((x) => x.trim()),
      exclus: form.exclus ? form.exclus.split(",").map((x) => x.trim()) : [],
      familles: [],
      clients: [],
      region: form.region,
      budgetMin: Number(form.budgetMin || 0),
      budgetMax: Number(form.budgetMax || 0),
      frequence: "Quotidien",
      derniereAnalyse: new Date().toISOString(),
      resultats: 0,
      statut: "Active",
    };
    promat.addSearch(s);
    promat.log("Profil de recherche créé", s.nom);
    setForm({ nom: "", motsCles: "", exclus: "", region: "National", budgetMin: "", budgetMax: "" });
    toast.success("Profil de veille créé.");
  };

  const lancer = async (s: SavedSearch) => {
    setRunning(s.id);
    await new Promise((r) => setTimeout(r, 900));
    const trouves = promat.tenders.filter((t) =>
      s.motsCles.some((m) => `${t.objet} ${t.famille} ${t.client}`.toLowerCase().includes(m.toLowerCase())),
    ).length;
    promat.updateSearch(s.id, { derniereAnalyse: new Date().toISOString(), resultats: trouves });
    promat.log("Recherche exécutée", s.nom, undefined, `${trouves} résultat(s)`);
    setRunning(null);
    toast.success(`${trouves} appel(s) d'offres correspondant à « ${s.nom} ».`);
  };

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
        <PageHeader title="Recherches AO" subtitle="Définissez des profils de veille et détectez les appels d'offres pertinents." />

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Profils enregistrés" value={String(promat.searches.length)} />
          <Metric label="Profils actifs" value={String(promat.searches.filter((s) => s.statut === "Active").length)} tone="success" />
          <Metric label="Résultats cumulés" value={String(promat.searches.reduce((a, s) => a + s.resultats, 0))} />
        </div>

        <SectionCard title="Nouveau profil de recherche">
          <div className="grid gap-3 md:grid-cols-3">
            {([["nom", "Nom du profil"], ["motsCles", "Mots-clés (virgules)"], ["exclus", "Mots exclus"], ["region", "Région"], ["budgetMin", "Budget min (MAD)"], ["budgetMax", "Budget max (MAD)"]] as const).map(([k, l]) => (
              <div key={k} className="space-y-1.5">
                <Label className="text-xs">{l}</Label>
                <Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
          </div>
          <Button className="mt-3" onClick={creer}><Plus className="size-4" /> Créer le profil</Button>
        </SectionCard>

        <div className="grid gap-4 lg:grid-cols-2">
          {promat.searches.map((s) => (
            <SectionCard
              key={s.id}
              title={s.nom}
              description={`${s.region} — analyse ${s.frequence.toLowerCase()}`}
              actions={<StatusBadge tone={s.statut === "Active" ? "success" : "neutre"}>{s.statut}</StatusBadge>}
            >
              <p className="text-sm"><span className="text-muted-foreground">Mots-clés :</span> {s.motsCles.join(", ")}</p>
              {s.exclus.length ? <p className="text-sm"><span className="text-muted-foreground">Exclus :</span> {s.exclus.join(", ")}</p> : null}
              <p className="num text-sm text-muted-foreground">Dernière analyse : {fmtDate(s.derniereAnalyse)} — {s.resultats} résultat(s)</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" disabled={running === s.id} onClick={() => lancer(s)}>
                  <Play className="size-4" /> {running === s.id ? "Analyse…" : "Lancer l'analyse"}
                </Button>
                <div className="flex items-center gap-2 text-sm">
                  <Switch checked={s.statut === "Active"} onCheckedChange={(v) => promat.updateSearch(s.id, { statut: v ? "Active" : "En pause" })} />
                  Actif
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    promat.deleteSearch(s.id);
                    toast.success("Profil supprimé");
                  }}
                >
                  <Trash2 className="size-4" /> Supprimer
                </Button>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
