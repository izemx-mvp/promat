import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/promat/shell";
import { SectionCard } from "@/components/promat/ui";
import { ConfirmDialog, SecondaryButton } from "@/components/promat/form-kit";
import { useReferentiel } from "@/lib/promat/referentiel";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/preferences")({
  head: () => ({
    meta: [
      { title: "Préférences — PROMAT" },
      { name: "description", content: "Personnalisez l'apparence et les notifications PROMAT Tender OS." },
      { property: "og:title", content: "Préférences — PROMAT" },
      { property: "og:description", content: "Apparence, notifications, affichage." },
    ],
  }),
  component: PrefsPage,
});

function PrefsPage() {
  const { theme, setTheme } = useTheme();
  const { resetDemo } = useReferentiel();
  const [confirmReset, setConfirmReset] = useState(false);
  const [notifs, setNotifs] = useState<Record<string, boolean>>({});



  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-8 lg:px-10">
        <PageHeader eyebrow="Compte" title="Préférences" subtitle="Ajustez l'apparence et les notifications. Enregistrement local, sans compte." />

        <SectionCard title="Apparence" subtitle="Choisissez le thème et la densité.">
          <div>
            <p className="label-xs">Thème</p>
            <div className="mt-2 inline-flex rounded-xl border border-border bg-muted/40 p-1">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    theme === t ? "gradient-red text-primary-foreground shadow-[0_4px_16px_-4px_rgba(229,13,45,0.5)]" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t === "light" ? "Clair" : "Sombre"}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Notifications" subtitle="Événements émis par les agents.">
          <ul className="space-y-2">
            {["Nouvel AO pertinent", "Décision GO / NO GO requise", "Document manquant", "Échéance proche"].map((n) => (
              <li key={n} className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3">
                <span className="text-sm font-medium">{n}</span>
                <button
                  role="switch"
                  aria-checked={notifs[n] ?? true}
                  aria-label={n}
                  onClick={() => setNotifs((s) => ({ ...s, [n]: !(s[n] ?? true) }))}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
                    (notifs[n] ?? true) ? "bg-primary" : "bg-border",
                  )}
                >
                  <span
                    className={cn(
                      "size-5 rounded-full bg-white shadow transition-transform",
                      (notifs[n] ?? true) ? "translate-x-[22px]" : "translate-x-0.5",
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Données de démonstration" subtitle="Restaure les fournisseurs, articles, utilisateurs et notifications d'origine.">
          <SecondaryButton onClick={() => setConfirmReset(true)}>
            Réinitialiser les données de démonstration
          </SecondaryButton>
        </SectionCard>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemo();
          toast.success("Données de démonstration réinitialisées.");
        }}
        title="Réinitialiser les données de démonstration ?"
        message="Toutes vos modifications locales seront perdues. Cette action est irréversible."
        verb="Réinitialiser"
      />
    </AppShell>
  );

}
