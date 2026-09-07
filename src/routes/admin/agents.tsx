import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AppShell, PageHeader } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/agents")({
  head: () => ({
    meta: [
      { title: "Configuration des agents — PROMAT" },
      {
        name: "description",
        content:
          "Paramétrez l'Agent AO & Analyse et l'Agent Chiffrage : sources, mots-clés, règles GO/NO GO, pondérations fournisseurs, marges et frais.",
      },
      { property: "og:title", content: "Configuration des agents — PROMAT" },
      {
        property: "og:description",
        content: "Règles métier, seuils et instructions des deux agents IA.",
      },
    ],
  }),
  component: AgentsPage,
});

function Text({ label, value }: { label: string; value?: string }) {
  return (
    <label className="block">
      <span className="label-xs">{label}</span>
      <input
        defaultValue={value}
        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring"
      />
    </label>
  );
}

function Toggle({ label, on = true }: { label: string; on?: boolean }) {
  const [v, setV] = useState(on);
  return (
    <button
      onClick={() => setV(!v)}
      className="flex w-full items-center justify-between border-b border-border/60 py-3 text-left text-sm last:border-0"
    >
      <span>{label}</span>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          v ? "bg-success" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white transition-all",
            v ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

function AgentsPage() {
  const [level, setLevel] = useState("Synthétique");
  const [alloc, setAlloc] = useState("Prorata valeur d'achat");

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
        <PageHeader
          title="Configuration des agents"
          subtitle="Définissez les règles métier appliquées par les deux agents."
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Agent AO & Analyse"
            subtitle="Recherche, analyse et recommandation GO / NO GO."
            action={<Pill tone="ok">Actif</Pill>}
          >
            <div className="space-y-4">
              <Text label="Nom de l'agent" value="Agent AO & Analyse" />
              <Text label="Description" value="Détecte, analyse et qualifie les appels d'offres." />
              <Text label="Sources AO autorisées" value="Marchés publics, ONEE, OCP, ONCF" />
              <Text label="Mots-clés par défaut" value="pièces de rechange, levage, hydraulique" />
              <Text label="Clients ciblés" value="ONEE, OCP, ONCF, Marsa Maroc" />
              <Text label="Familles de produits" value="Instrumentation, levage, hydraulique" />
              <Text label="Seuil de pertinence minimum" value="75 %" />

              <div>
                <p className="label-xs">Règles GO / NO GO</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <Text label="CA minimum" value="5 000 000 MAD" />
                  <Text label="Références similaires" value="2 minimum" />
                  <Text label="Compatibilité technique" value="Obligatoire" />
                  <Text label="Délai minimum avant dépôt" value="10 jours" />
                </div>
                <div className="mt-2">
                  <Toggle label="Documentation fabricant obligatoire" />
                </div>
              </div>

              <div>
                <p className="label-xs">Niveau d'analyse</p>
                <div className="mt-2 flex gap-2">
                  {["Synthétique", "Standard", "Détaillé"].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(l)}
                      className={cn(
                        "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                        level === l
                          ? "bg-navy text-navy-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <Text label="Seuil de confiance des recommandations" value="80 %" />

              <div>
                <p className="label-xs">Notifications</p>
                <div className="mt-1">
                  <Toggle label="Nouvel AO pertinent" />
                  <Toggle label="Décision GO / NO GO requise" />
                  <Toggle label="Document manquant" />
                  <Toggle label="Échéance proche" />
                </div>
              </div>

              <label className="block">
                <span className="label-xs">Instructions métier de l'Agent</span>
                <textarea
                  rows={3}
                  defaultValue="Prioriser les marchés liés aux pièces de rechange, levage, manutention et équipements industriels."
                  className="mt-1.5 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-ring"
                />
              </label>

              <button
                onClick={() => toast.success("Configuration de l'Agent AO enregistrée")}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Enregistrer la configuration
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Agent Chiffrage"
            subtitle="Comparaison fournisseurs, coût de revient et marge."
            action={<Pill tone="ai"><Sparkles className="size-3.5" /> Actif</Pill>}
          >
            <div className="space-y-4">
              <Text label="Devises par défaut" value="MAD, EUR, USD" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Text label="Taux EUR/MAD" value="11.00" />
                <Text label="Taux USD/MAD" value="10.10" />
              </div>

              <div>
                <p className="label-xs">Pondération du scoring fournisseur</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <Text label="Prix" value="35 %" />
                  <Text label="Conformité" value="30 %" />
                  <Text label="Délai" value="15 %" />
                  <Text label="Historique" value="10 %" />
                  <Text label="Genuine / OEM" value="10 %" />
                </div>
              </div>

              <div>
                <p className="label-xs">Marges</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  <Text label="Marge par défaut" value="20 %" />
                  <Text label="Seuil d'alerte" value="15 %" />
                  <Text label="Seuil critique" value="12 %" />
                </div>
              </div>

              <div>
                <p className="label-xs">Frais d'approche</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {["Fret", "Transit", "Frais bancaires", "Assurance", "Transport local", "Manutention", "Autres frais"].map(
                    (f) => (
                      <Text key={f} label={f} value="0 MAD" />
                    ),
                  )}
                </div>
              </div>

              <div>
                <p className="label-xs">Méthode de répartition</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Prorata valeur d'achat", "Quantité", "Poids", "Manuelle"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setAlloc(m)}
                      className={cn(
                        "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                        alloc === m
                          ? "bg-navy text-navy-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="label-xs">Instructions métier de l'Agent</span>
                <textarea
                  rows={3}
                  defaultValue="Ne pas recommander un fournisseur sur le seul critère du prix. Prendre en compte la conformité, le délai, l'historique et le coût de revient."
                  className="mt-1.5 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-ring"
                />
              </label>

              <button
                onClick={() => toast.success("Configuration de l'Agent Chiffrage enregistrée")}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Enregistrer la configuration
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
