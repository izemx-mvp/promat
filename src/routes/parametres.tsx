import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/promat/AppShell";
import { PageHeader, SectionCard } from "@/components/promat/ui";
import { usePromat } from "@/lib/promat/store";
import type { Devise } from "@/lib/promat/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — PROMAT" },
      { name: "description", content: "Réglages PROMAT : devises, marge cible, thème et données de démonstration." },
      { property: "og:title", content: "Paramètres — PROMAT" },
      { property: "og:description", content: "Configuration du poste de travail PROMAT." },
    ],
  }),
  component: ParametresPage,
});

const DEVISES: Devise[] = ["EUR", "USD", "GBP", "CNY"];

function ParametresPage() {
  const promat = usePromat();

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1000px] flex-col gap-5">
        <PageHeader title="Paramètres" subtitle="Configurez les taux, l'apparence et les données de votre espace PROMAT." />

        <SectionCard title="Profil" description="Compte connecté à l'espace PROMAT Morocco.">
          <dl className="grid gap-3 sm:grid-cols-3 text-sm">
            {[
              ["Nom", promat.session?.nom ?? "—"],
              ["Email", promat.session?.email ?? "—"],
              ["Rôle", promat.session?.role ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{k}</dt>
                <dd className="mt-0.5 font-medium break-words">{v}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="Taux de change de référence" description="Utilisés par défaut dans tous les chiffrages.">
          <div className="grid gap-3 sm:grid-cols-4">
            {DEVISES.map((d) => (
              <div key={d} className="space-y-1.5">
                <Label className="text-xs">{d} → MAD</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="num"
                  value={promat.rates[d]}
                  onChange={(e) => promat.setRate(d, Number(e.target.value), true)}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Apparence">
          <div className="flex items-center gap-3 text-sm">
            <Switch checked={promat.theme === "dark"} onCheckedChange={(v) => promat.setTheme(v ? "dark" : "light")} />
            Mode sombre (salle de marché)
          </div>
        </SectionCard>

        <SectionCard title="Données de démonstration" description="Réinitialise tenders, fournisseurs, consultations et chiffrages.">
          <Button
            variant="destructive"
            onClick={() => {
              promat.reset();
              toast.success("Données de démonstration réinitialisées.");
            }}
          >
            Réinitialiser les données
          </Button>
        </SectionCard>
      </div>
    </AppShell>
  );
}
