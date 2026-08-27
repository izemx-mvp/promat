import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/promat/AppShell";
import { Metric, PageHeader, SectionCard, StatusBadge } from "@/components/promat/ui";
import { usePromat } from "@/lib/promat/store";
import { fmtDate } from "@/lib/promat/calc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/consultations")({
  head: () => ({
    meta: [
      { title: "Consultations fournisseurs — PROMAT" },
      { name: "description", content: "Suivi des demandes de prix envoyées aux fournisseurs PROMAT et des relances." },
      { property: "og:title", content: "Consultations fournisseurs — PROMAT" },
      { property: "og:description", content: "Demandes de prix, relances et offres reçues." },
    ],
  }),
  component: ConsultationsPage,
});

const STATUTS = ["Brouillon", "À envoyer", "Envoyée", "En attente", "Relance nécessaire", "Offre reçue", "Refusée", "Expirée"];

function ConsultationsPage() {
  const promat = usePromat();
  const navigate = useNavigate();
  const [tab, setTab] = useState("tous");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      promat.rfqs
        .filter((r) => (tab === "tous" ? true : r.statut === tab))
        .filter((r) => {
          const t = promat.tenders.find((x) => x.id === r.tenderId);
          const s = promat.suppliers.find((x) => x.id === r.supplierId);
          return q ? `${r.ref} ${t?.ref} ${s?.nom}`.toLowerCase().includes(q.toLowerCase()) : true;
        }),
    [promat, tab, q],
  );

  const enAttente = promat.rfqs.filter((r) => r.statut === "En attente" || r.statut === "Envoyée").length;
  const relances = promat.rfqs.filter((r) => r.statut === "Relance nécessaire").length;
  const recues = promat.rfqs.filter((r) => r.statut === "Offre reçue").length;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <PageHeader title="Consultations fournisseurs" subtitle="Suivez chaque demande de prix, ses relances et les offres reçues." />

        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Consultations" value={String(promat.rfqs.length)} />
          <Metric label="En attente" value={String(enAttente)} />
          <Metric label="Relances nécessaires" value={String(relances)} tone={relances ? "danger" : "success"} />
          <Metric label="Offres reçues" value={String(recues)} tone="success" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="tous">Tous</TabsTrigger>
              {STATUTS.map((s) => (
                <TabsTrigger key={s} value={s} className="text-xs">{s}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="max-w-xs" />
        </div>

        <SectionCard noPadding>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                <tr>{["Référence", "Appel d'offres", "Fournisseur", "Articles", "Envoyée le", "Réponse attendue", "Relances", "Statut", "Actions"].map((h) => <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const t = promat.tenders.find((x) => x.id === r.tenderId);
                  const s = promat.suppliers.find((x) => x.id === r.supplierId);
                  return (
                    <tr key={r.id} className="hover:bg-accent/60">
                      <td className="num px-3 py-2 font-semibold whitespace-nowrap">{r.ref}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button className="underline-offset-2 hover:underline" onClick={() => t && navigate({ to: "/appels-offres/$id", params: { id: t.id } })}>{t?.ref}</button>
                      </td>
                      <td className="px-3 py-2">{s?.nom}</td>
                      <td className="num px-3 py-2 text-right">{r.articleIds.length}</td>
                      <td className="num px-3 py-2 whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td className="num px-3 py-2 whitespace-nowrap">{fmtDate(r.reponseAttendue)}</td>
                      <td className="num px-3 py-2 text-right">{r.relances}</td>
                      <td className="px-3 py-2"><StatusBadge>{r.statut}</StatusBadge></td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {r.statut === "À envoyer" || r.statut === "Brouillon" ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              promat.updateRfq(r.id, { statut: "Envoyée", date: new Date().toISOString() });
                              promat.log("Consultation envoyée", `${r.ref} — ${s?.nom}`);
                              toast.success(`Consultation ${r.ref} envoyée à ${s?.nom}.`);
                            }}
                          >
                            <Send className="size-3.5" /> Envoyer
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              promat.updateRfq(r.id, { relances: r.relances + 1, statut: "En attente" });
                              promat.log("Relance envoyée", `${r.ref} — ${s?.nom}`);
                              toast.success(`Relance envoyée à ${s?.nom}.`);
                            }}
                          >
                            <RefreshCw className="size-3.5" /> Relancer
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!rows.length ? <tr><td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">Aucune consultation pour ce filtre.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
