import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { AppShell } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { GhostButton, NextButton, StickyBar, TenderWorkflow } from "@/components/promat/workflow";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Supplier } from "@/lib/promat/data";
import { useTender } from "@/lib/promat/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/consultations/$id")({
  head: () => ({
    meta: [
      { title: "Consultation du dossier — PROMAT" },
      {
        name: "description",
        content:
          "Fournisseurs recommandés, création de la demande de prix et statut des réponses pour un appel d'offres PROMAT.",
      },
      { property: "og:title", content: "Consultation du dossier — PROMAT" },
      {
        property: "og:description",
        content: "Sélectionnez les fournisseurs et lancez la demande de prix.",
      },
    ],
  }),
  component: ConsultationPage,
});

const requestedFields = [
  "Prix unitaire",
  "Devise",
  "Marque",
  "Référence",
  "Genuine / OEM",
  "Délai",
  "Incoterm",
  "Origine",
  "Validité",
  "Documentation",
];

function ConsultationPage() {
  const { id } = useParams({ from: "/consultations/$id" });
  const { tender, state, update, addLog } = useTender(id);
  const [why, setWhy] = useState<Supplier | null>(null);

  if (!tender || !state) {
    return (
      <AppShell>
        <div className="p-8 text-sm text-muted-foreground">Dossier introuvable.</div>
      </AppShell>
    );
  }

  const selected = state.selectedSuppliers;
  const toggle = (sid: string) =>
    update(id, {
      selectedSuppliers: selected.includes(sid)
        ? selected.filter((x) => x !== sid)
        : [...selected, sid],
    });

  const createRfq = () => {
    update(id, { consultationCreated: true, offersReceived: true });
    addLog({
      who: "Houda Bennani",
      action: `Consultation créée — ${selected.length} fournisseurs`,
      tender: tender.reference,
      module: "Consultations",
    });
    toast.success("RFQ-2026-0048 envoyée");
  };

  const statuses = ["Offre reçue", "En attente", "Relance nécessaire"];

  return (
    <AppShell>
      <TenderWorkflow tender={tender} state={state} current="consultation">
        <SectionCard
          title="Fournisseurs recommandés"
          subtitle="Sélection multiple possible. L'Agent classe par compatibilité et historique."
          action={<Pill tone="ai"><Sparkles className="size-3.5" /> Agent AO</Pill>}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {tender.suppliers.map((s) => {
              const on = selected.includes(s.id);
              return (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-xl border p-4 transition-colors",
                    on ? "border-primary/40 bg-primary/[0.03]" : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.country}</p>
                    </div>
                    <Pill tone="ai">{s.match} %</Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Pill>{s.kind}</Pill>
                    <Pill>Délai {s.delay}</Pill>
                    {s.lastConsult && <Pill>Consulté {s.lastConsult}</Pill>}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => toggle(s.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors",
                        on
                          ? "bg-success-soft text-success"
                          : "bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                    >
                      {on && <Check className="size-3.5" />}
                      {on ? "Sélectionné" : "Sélectionner"}
                    </button>
                    <button
                      onClick={() => setWhy(s)}
                      className="text-[13px] text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Pourquoi ce fournisseur ?
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {state.consultationCreated ? (
          <SectionCard
            title="RFQ-2026-0048"
            subtitle={`${tender.articles.length} articles · ${selected.length} fournisseurs`}
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                {selected.map((sid, i) => {
                  const s = tender.suppliers.find((x) => x.id === sid);
                  const st = statuses[i % statuses.length]!;
                  return (
                    <div
                      key={sid}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                    >
                      <p className="text-sm font-medium">{s?.name}</p>
                      <div className="flex items-center gap-3">
                        <Pill tone={st === "Offre reçue" ? "ok" : st === "En attente" ? "neutral" : "warn"}>
                          {st}
                        </Pill>
                        <button
                          onClick={() => toast.info(st === "Offre reçue" ? "Ouverture de l'offre" : "Relance envoyée")}
                          className="text-[13px] text-muted-foreground underline-offset-4 hover:underline"
                        >
                          {st === "Offre reçue" ? "Voir l'offre" : "Relancer"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <GhostButton onClick={() => toast.info("Saisie manuelle d'une réponse (démo)")}>
                  Ajouter une réponse
                </GhostButton>
              </div>
              <div>
                <p className="label-xs">Informations demandées</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {requestedFields.map((f) => (
                    <Pill key={f}>{f}</Pill>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        ) : (
          <SectionCard title="Demande de prix">
            <p className="text-sm text-muted-foreground">
              La consultation reprendra automatiquement les {tender.articles.length} articles validés
              et demandera : {requestedFields.join(", ").toLowerCase()}.
            </p>
          </SectionCard>
        )}

        <StickyBar
          message={
            state.consultationCreated
              ? "3 offres reçues. Le dossier est prêt pour le chiffrage."
              : `${selected.length} fournisseur(s) sélectionné(s).`
          }
        >
          {state.consultationCreated ? (
            <NextButton to="/comparatifs/$id" id={id} label="Passer au comparatif fournisseur" />
          ) : (
            <NextButton
              label="Créer la consultation"
              disabled={selected.length === 0}
              onClick={createRfq}
            />
          )}
        </StickyBar>
      </TenderWorkflow>

      <Sheet open={Boolean(why)} onOpenChange={(v) => !v && setWhy(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{why?.name}</SheetTitle>
          </SheetHeader>
          {why && (
            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="label-xs">Compatibilité technique</p>
                <p className="mt-1">{why.why.compat}</p>
              </div>
              <div>
                <p className="label-xs">Historique PROMAT</p>
                <p className="mt-1">{why.why.history}</p>
              </div>
              <div>
                <p className="label-xs">Réactivité</p>
                <p className="mt-1">{why.why.response}</p>
              </div>
              <div>
                <p className="label-xs">Positionnement prix</p>
                <p className="mt-1">{why.why.price}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
