import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/promat/AppShell";
import { Metric, PageHeader, ScoreBadge, SectionCard, StatusBadge } from "@/components/promat/ui";
import { newId, usePromat } from "@/lib/promat/store";
import { fmtDate } from "@/lib/promat/calc";
import type { Supplier } from "@/lib/promat/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/fournisseurs/")({
  head: () => ({
    meta: [
      { title: "Fournisseurs — PROMAT" },
      { name: "description", content: "Référentiel des fournisseurs PROMAT : marques, familles, délais et fiabilité." },
      { property: "og:title", content: "Fournisseurs — PROMAT" },
      { property: "og:description", content: "Référentiel fournisseurs, scores de fiabilité et historique de consultation." },
    ],
  }),
  component: FournisseursPage,
});

function FournisseursPage() {
  const promat = usePromat();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", pays: "", ville: "", email: "", marques: "" });

  const rows = useMemo(
    () =>
      promat.suppliers.filter((s) =>
        q ? `${s.nom} ${s.pays} ${s.marques.join(" ")} ${s.familles.join(" ")}`.toLowerCase().includes(q.toLowerCase()) : true,
      ),
    [promat.suppliers, q],
  );

  const creer = () => {
    if (!form.nom.trim()) {
      toast.error("Le nom du fournisseur est obligatoire.");
      return;
    }
    const s: Supplier = {
      id: newId("sup"),
      nom: form.nom,
      pays: form.pays || "Maroc",
      ville: form.ville || "—",
      site: "",
      email: form.email,
      telephone: "",
      marques: form.marques ? form.marques.split(",").map((m) => m.trim()) : [],
      familles: [],
      genuine: "Genuine / OEM",
      delaiMoyen: 6,
      dernierDevis: new Date().toISOString(),
      consultations: 0,
      commandes: 0,
      score: 60,
      statut: "En évaluation",
      devises: ["EUR", "MAD"],
      incoterms: ["EXW", "CIF"],
      paiement: "30 jours",
      tauxReponse: 0,
      delaiReponse: 0,
      fiabilite: 60,
      notes: "Fournisseur créé manuellement.",
    };
    promat.upsertSupplier(s);
    promat.log("Fournisseur créé", s.nom);
    setOpen(false);
    setForm({ nom: "", pays: "", ville: "", email: "", marques: "" });
    toast.success("Fournisseur ajouté au référentiel.");
  };

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <PageHeader
          title="Fournisseurs"
          subtitle="Référentiel complet : marques, familles, délais, réactivité et fiabilité."
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="size-4" /> Nouveau fournisseur</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau fournisseur</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  {([["nom", "Nom"], ["pays", "Pays"], ["ville", "Ville"], ["email", "Email"], ["marques", "Marques (séparées par des virgules)"]] as const).map(([k, l]) => (
                    <div key={k} className="space-y-1.5">
                      <Label className="text-xs">{l}</Label>
                      <Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <DialogFooter><Button onClick={creer}>Créer le fournisseur</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Fournisseurs" value={String(promat.suppliers.length)} />
          <Metric label="Actifs" value={String(promat.suppliers.filter((s) => s.statut === "Actif").length)} tone="success" />
          <Metric label="En évaluation" value={String(promat.suppliers.filter((s) => s.statut === "En évaluation").length)} tone="warning" />
          <Metric label="Pays couverts" value={String(new Set(promat.suppliers.map((s) => s.pays)).size)} />
        </div>

        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un fournisseur, une marque, une famille…" className="max-w-md" />

        <SectionCard noPadding>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                <tr>{["Fournisseur", "Pays", "Marques", "Familles", "Genuine/OEM", "Délai moyen", "Taux réponse", "Consultations", "Commandes", "Dernier devis", "Score", "Statut"].map((h) => <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => (
                  <tr key={s.id} className="cursor-pointer hover:bg-accent/60" onClick={() => navigate({ to: "/fournisseurs/$id", params: { id: s.id } })}>
                    <td className="px-3 py-2 font-semibold whitespace-nowrap">{s.nom}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{s.pays}</td>
                    <td className="max-w-[220px] truncate px-3 py-2">{s.marques.join(", ")}</td>
                    <td className="max-w-[200px] truncate px-3 py-2">{s.familles.join(", ")}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{s.genuine}</td>
                    <td className="num px-3 py-2 text-right">{s.delaiMoyen} sem.</td>
                    <td className="num px-3 py-2 text-right">{s.tauxReponse} %</td>
                    <td className="num px-3 py-2 text-right">{s.consultations}</td>
                    <td className="num px-3 py-2 text-right">{s.commandes}</td>
                    <td className="num px-3 py-2 whitespace-nowrap">{fmtDate(s.dernierDevis)}</td>
                    <td className="px-3 py-2"><ScoreBadge score={s.score} /></td>
                    <td className="px-3 py-2"><StatusBadge>{s.statut}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
