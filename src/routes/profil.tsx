import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/promat/shell";
import { SectionCard } from "@/components/promat/ui";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil — PROMAT" },
      { name: "description", content: "Votre profil, votre rôle et vos permissions dans PROMAT Tender OS." },
      { property: "og:title", content: "Profil — PROMAT" },
      { property: "og:description", content: "Profil, rôle, permissions." },
    ],
  }),
  component: ProfilPage,
});

const permissions = [
  "Voir les AO", "Créer un AO", "Valider GO / NO GO", "Modifier les articles", "Lancer une consultation",
  "Voir les prix fournisseurs", "Sélectionner un fournisseur", "Modifier le chiffrage", "Modifier la marge",
  "Valider l'offre finale", "Exporter les offres", "Configurer les agents", "Gérer les utilisateurs",
];

const matrix: Record<string, string[]> = {
  "Administrateur": permissions,
  "Responsable Commercial": permissions.filter((p) => !["Configurer les agents", "Gérer les utilisateurs"].includes(p)),
  "Commercial": ["Voir les AO", "Créer un AO", "Modifier les articles", "Lancer une consultation", "Voir les prix fournisseurs"],
  "Acheteur / Sourcing": ["Voir les AO", "Modifier les articles", "Lancer une consultation", "Voir les prix fournisseurs", "Sélectionner un fournisseur"],
  "Chiffreur": ["Voir les AO", "Voir les prix fournisseurs", "Modifier le chiffrage", "Modifier la marge", "Exporter les offres"],
  "Direction": ["Voir les AO", "Valider GO / NO GO", "Voir les prix fournisseurs", "Modifier la marge", "Valider l'offre finale", "Exporter les offres"],
  "Lecture seule": ["Voir les AO"],
};

function ProfilPage() {
  const { user } = useAuth();
  const u = user ?? { name: "Houda Bennani", email: "houda@promat.ma", role: "Responsable Commercial", team: "Commercial", initials: "HB" };
  const granted = matrix[u.role] ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 lg:px-10">
        <PageHeader eyebrow="Compte" title="Profil" subtitle="Votre identité, votre rôle et vos permissions." />

        <div className="glass p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex size-20 items-center justify-center rounded-full bg-navy text-2xl font-semibold text-navy-foreground ring-2 ring-primary/70 ring-offset-4 ring-offset-background">
              {u.initials}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-semibold">{u.name}</h2>
              <p className="mono mt-1 text-sm text-muted-foreground">{u.email}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{u.role}</span>
                {u.team && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{u.team}</span>}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
                  <span className="size-1.5 animate-pulse rounded-full bg-success" /> Actif
                </span>
              </div>
            </div>
          </div>
        </div>

        <SectionCard title="Identité">
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              { k: "Nom", v: u.name },
              { k: "Email", v: <span className="mono">{u.email}</span> },
              { k: "Rôle", v: u.role },
              { k: "Équipe", v: u.team ?? "—" },
            ].map(({ k, v }) => (
              <div key={k} className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3">
                <span className="label-xs">{k}</span>
                <span className="text-sm font-medium">{v}</span>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="Permissions" subtitle="Droits accordés à votre rôle. Lecture seule.">
          <ul className="grid gap-2 sm:grid-cols-2">
            {permissions.map((p) => {
              const ok = granted.includes(p);
              return (
                <li
                  key={p}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                    ok ? "border-success/20 bg-success-soft/40 text-foreground" : "border-border bg-muted/40 text-muted-foreground/70",
                  )}
                >
                  <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", ok ? "bg-success text-white" : "bg-muted-foreground/20 text-muted-foreground")}>
                    {ok ? <Check className="size-3" strokeWidth={3.5} /> : <Minus className="size-3" strokeWidth={3} />}
                  </span>
                  {p}
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
