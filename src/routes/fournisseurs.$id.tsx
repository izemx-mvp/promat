import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/promat/AppShell";
import { Metric, PageHeader, ScoreBadge, SectionCard, StatusBadge } from "@/components/promat/ui";
import { usePromat } from "@/lib/promat/store";
import { fmtDate, fmtInt } from "@/lib/promat/calc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/fournisseurs/$id")({
  head: () => ({
    meta: [
      { title: "Fiche fournisseur — PROMAT" },
      { name: "description", content: "Fiche fournisseur PROMAT : marques, performance, consultations et offres." },
      { property: "og:title", content: "Fiche fournisseur — PROMAT" },
      { property: "og:description", content: "Performance, historique de consultation et offres du fournisseur." },
    ],
  }),
  component: FicheFournisseur,
});

function FicheFournisseur() {
  const { id } = useParams({ from: "/fournisseurs/$id" });
  const promat = usePromat();
  const navigate = useNavigate();
  const supplier = promat.suppliers.find((s) => s.id === id);
  const [notes, setNotes] = useState(supplier?.notes ?? "");

  const rfqs = useMemo(() => promat.rfqs.filter((r) => r.supplierId === id), [promat.rfqs, id]);
  const quotes = useMemo(() => promat.quotes.filter((q) => q.supplierId === id), [promat.quotes, id]);

  if (!supplier) {
    return (
      <AppShell>
        <SectionCard title="Fournisseur introuvable">
          <Button onClick={() => navigate({ to: "/fournisseurs" })}>Retour au référentiel</Button>
        </SectionCard>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
        <PageHeader
          title={supplier.nom}
          subtitle={`${supplier.ville}, ${supplier.pays} — ${supplier.marques.join(", ")}`}
          actions={
            <>
              <StatusBadge>{supplier.statut}</StatusBadge>
              <ScoreBadge score={supplier.score} />
              <Button variant="outline" onClick={() => navigate({ to: "/consultations" })}>Voir les consultations</Button>
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <Metric label="Délai moyen" value={`${supplier.delaiMoyen} sem.`} />
          <Metric label="Taux de réponse" value={`${supplier.tauxReponse} %`} tone={supplier.tauxReponse >= 80 ? "success" : "warning"} />
          <Metric label="Délai de réponse" value={`${supplier.delaiReponse} j`} />
          <Metric label="Consultations" value={String(supplier.consultations)} />
          <Metric label="Commandes" value={String(supplier.commandes)} />
          <Metric label="Fiabilité" value={`${supplier.fiabilite} %`} tone={supplier.fiabilite >= 80 ? "success" : "warning"} />
        </div>

        <Tabs defaultValue="identite">
          <TabsList>
            <TabsTrigger value="identite">Identité</TabsTrigger>
            <TabsTrigger value="commercial">Conditions</TabsTrigger>
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
            <TabsTrigger value="offres">Offres</TabsTrigger>
            <TabsTrigger value="notes">Notes internes</TabsTrigger>
          </TabsList>

          <TabsContent value="identite" className="mt-4">
            <SectionCard title="Informations générales">
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                {[
                  ["Pays", supplier.pays],
                  ["Ville", supplier.ville],
                  ["Site web", supplier.site || "—"],
                  ["Email", supplier.email],
                  ["Téléphone", supplier.telephone],
                  ["Marques", supplier.marques.join(", ")],
                  ["Familles", supplier.familles.join(", ")],
                  ["Genuine / OEM", supplier.genuine],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                    <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{k}</dt>
                    <dd className="mt-0.5 font-medium break-words">{v}</dd>
                  </div>
                ))}
              </dl>
            </SectionCard>
          </TabsContent>

          <TabsContent value="commercial" className="mt-4">
            <SectionCard title="Conditions commerciales">
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                {[
                  ["Devises", supplier.devises.join(", ")],
                  ["Incoterms", supplier.incoterms.join(", ")],
                  ["Paiement", supplier.paiement],
                  ["Dernier devis", fmtDate(supplier.dernierDevis)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                    <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{k}</dt>
                    <dd className="num mt-0.5 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </SectionCard>
          </TabsContent>

          <TabsContent value="consultations" className="mt-4">
            <SectionCard noPadding>
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                  <tr>{["Référence", "Appel d'offres", "Date", "Relances", "Statut"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rfqs.map((r) => (
                    <tr key={r.id}>
                      <td className="num px-3 py-2">{r.ref}</td>
                      <td className="px-3 py-2">{promat.tenders.find((t) => t.id === r.tenderId)?.ref}</td>
                      <td className="num px-3 py-2">{fmtDate(r.date)}</td>
                      <td className="num px-3 py-2 text-right">{r.relances}</td>
                      <td className="px-3 py-2"><StatusBadge>{r.statut}</StatusBadge></td>
                    </tr>
                  ))}
                  {!rfqs.length ? <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Aucune consultation enregistrée.</td></tr> : null}
                </tbody>
              </table>
            </SectionCard>
          </TabsContent>

          <TabsContent value="offres" className="mt-4">
            <SectionCard noPadding>
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                  <tr>{["Devis", "Appel d'offres", "Date", "Validité", "Devise", "Incoterm", "Lignes", "Total devise"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {quotes.map((q) => (
                    <tr key={q.id}>
                      <td className="num px-3 py-2">{q.ref}</td>
                      <td className="px-3 py-2">{promat.tenders.find((t) => t.id === q.tenderId)?.ref}</td>
                      <td className="num px-3 py-2">{fmtDate(q.date)}</td>
                      <td className="num px-3 py-2">{fmtDate(q.validite)}</td>
                      <td className="num px-3 py-2">{q.devise}</td>
                      <td className="px-3 py-2">{q.incoterm}</td>
                      <td className="num px-3 py-2 text-right">{q.lignes.length}</td>
                      <td className="num px-3 py-2 text-right">{fmtInt(q.lignes.reduce((s, l) => s + l.pu * l.qte, 0))}</td>
                    </tr>
                  ))}
                  {!quotes.length ? <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Aucune offre reçue.</td></tr> : null}
                </tbody>
              </table>
            </SectionCard>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <SectionCard title="Notes internes">
              <div className="space-y-2">
                <Label className="text-xs">Notes PROMAT</Label>
                <Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
                <Button
                  onClick={() => {
                    promat.upsertSupplier({ ...supplier, notes });
                    promat.log("Notes fournisseur mises à jour", supplier.nom);
                    toast.success("Notes enregistrées");
                  }}
                >
                  Enregistrer
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                <Label className="text-xs">Score fiabilité</Label>
                <Input
                  type="number"
                  className="num w-28"
                  value={supplier.score}
                  onChange={(e) => promat.upsertSupplier({ ...supplier, score: Number(e.target.value) })}
                />
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
