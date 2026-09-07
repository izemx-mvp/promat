import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/promat/shell";
import { SectionCard } from "@/components/promat/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres société — PROMAT" },
      {
        name: "description",
        content:
          "Paramètres société PROMAT : identité, TVA, devises, conditions commerciales, modèles d'offre et politique de validation.",
      },
      { property: "og:title", content: "Paramètres société — PROMAT" },
      {
        property: "og:description",
        content: "Identité, fiscalité, devises et conditions commerciales par défaut.",
      },
    ],
  }),
  component: ParametresPage,
});

function Field({ label, value }: { label: string; value: string }) {
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

function ParametresPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 px-8 py-8">
        <PageHeader title="Paramètres" subtitle="Informations société et règles par défaut des offres." />

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Société">
            <div className="space-y-4">
              <Field label="Raison sociale" value="PROMAT Maroc SARL" />
              <Field label="Adresse" value="Zone industrielle Sidi Maârouf, Casablanca" />
              <Field label="Téléphone" value="+212 522 00 00 00" />
              <Field label="Email" value="contact@promat.ma" />
              <Field label="ICE" value="002345678000091" />
              <Field label="RC" value="145789" />
              <Field label="IF" value="40218765" />
            </div>
          </SectionCard>

          <SectionCard title="Fiscalité & devises">
            <div className="space-y-4">
              <Field label="TVA par défaut" value="20 %" />
              <Field label="Devise de référence" value="MAD" />
              <Field label="Taux EUR/MAD" value="11.00" />
              <Field label="Taux USD/MAD" value="10.10" />
              <Field label="Validité des offres" value="30 jours" />
              <Field label="Conditions de paiement" value="30 jours fin de mois" />
              <Field label="Incoterm par défaut" value="CIF Casablanca" />
            </div>
          </SectionCard>

          <SectionCard title="Modèles d'offre">
            <div className="space-y-4">
              <Field label="Modèle par défaut" value="Offre PROMAT – standard" />
              <Field label="Mentions légales" value="Offre valable 30 jours, prix HT en MAD." />
              <Field label="Numérotation des offres" value="PROMAT-OFF-2026-###" />
            </div>
          </SectionCard>

          <SectionCard title="Politique de validation">
            <div className="space-y-4">
              <Field label="Validation GO / NO GO" value="Responsable Commercial" />
              <Field label="Validation de la marge" value="Direction si marge < 15 %" />
              <Field label="Validation de l'offre finale" value="Direction" />
              <Field label="Montant nécessitant double validation" value="1 000 000 MAD" />
            </div>
          </SectionCard>
        </div>

        <button
          onClick={() => toast.success("Paramètres enregistrés")}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Enregistrer les paramètres
        </button>
      </div>
    </AppShell>
  );
}
