import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/utilisateurs")({
  head: () => ({
    meta: [
      { title: "Gestion des utilisateurs — PROMAT" },
      {
        name: "description",
        content:
          "Gérez les utilisateurs PROMAT, leurs équipes, leurs rôles et les permissions par rôle : analyse, GO/NO GO, marge, offres, administration.",
      },
      { property: "og:title", content: "Gestion des utilisateurs — PROMAT" },
      {
        property: "og:description",
        content: "Utilisateurs, rôles et permissions de la plateforme PROMAT.",
      },
    ],
  }),
  component: UsersPage,
});

const roles = [
  "Administrateur",
  "Responsable Commercial",
  "Commercial",
  "Acheteur / Sourcing",
  "Chiffreur",
  "Direction",
  "Lecture seule",
];

const users = [
  { name: "Yassine El Mansouri", email: "yassine@promat.ma", role: "Responsable Commercial", team: "Commercial", active: true, last: "Aujourd'hui 09:12" },
  { name: "Houda Bennani", email: "houda@promat.ma", role: "Commercial", team: "Commercial", active: true, last: "Aujourd'hui 10:04" },
  { name: "Salma Cherkaoui", email: "salma@promat.ma", role: "Acheteur / Sourcing", team: "Sourcing", active: true, last: "Hier 17:40" },
  { name: "Omar Idrissi", email: "omar@promat.ma", role: "Chiffreur", team: "Chiffrage", active: true, last: "Hier 16:02" },
  { name: "Nadia Alaoui", email: "nadia@promat.ma", role: "Direction", team: "Direction", active: true, last: "05/09/2026" },
  { name: "Karim Tazi", email: "karim@promat.ma", role: "Lecture seule", team: "Support", active: false, last: "12/08/2026" },
];

const permissions = [
  "Voir les AO",
  "Créer un AO",
  "Valider GO / NO GO",
  "Modifier les articles",
  "Lancer une consultation",
  "Voir les prix fournisseurs",
  "Sélectionner un fournisseur",
  "Modifier le chiffrage",
  "Modifier la marge",
  "Valider l'offre finale",
  "Exporter les offres",
  "Configurer les agents",
  "Gérer les utilisateurs",
];

const matrix: Record<string, string[]> = {
  Administrateur: permissions,
  "Responsable Commercial": permissions.filter((p) => !["Configurer les agents", "Gérer les utilisateurs"].includes(p)),
  Commercial: ["Voir les AO", "Créer un AO", "Modifier les articles", "Lancer une consultation", "Voir les prix fournisseurs"],
  "Acheteur / Sourcing": ["Voir les AO", "Modifier les articles", "Lancer une consultation", "Voir les prix fournisseurs", "Sélectionner un fournisseur"],
  Chiffreur: ["Voir les AO", "Voir les prix fournisseurs", "Modifier le chiffrage", "Modifier la marge", "Exporter les offres"],
  Direction: ["Voir les AO", "Valider GO / NO GO", "Voir les prix fournisseurs", "Modifier la marge", "Valider l'offre finale", "Exporter les offres"],
  "Lecture seule": ["Voir les AO"],
};

function UsersPage() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("Commercial");

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
        <PageHeader
          title="Gestion utilisateurs"
          subtitle="Comptes, équipes, rôles et droits d'accès."
          action={
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="size-4" /> Ajouter un utilisateur
            </button>
          }
        />

        <SectionCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Utilisateur", "Email", "Rôle", "Équipe", "Statut", "Dernière connexion", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email} className="border-b border-border/60 last:border-0">
                    <td className="py-3.5 pr-4 font-medium">{u.name}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{u.email}</td>
                    <td className="py-3.5 pr-4">{u.role}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{u.team}</td>
                    <td className="py-3.5 pr-4">
                      <Pill tone={u.active ? "ok" : "neutral"}>{u.active ? "Actif" : "Inactif"}</Pill>
                    </td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{u.last}</td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-3 text-[13px] text-muted-foreground">
                        <button onClick={() => toast.info("Modification (démo)")} className="hover:underline">
                          Modifier
                        </button>
                        <button onClick={() => toast.info("Compte désactivé")} className="hover:underline">
                          Désactiver
                        </button>
                        <button onClick={() => toast.success("Email de réinitialisation envoyé")} className="hover:underline">
                          Réinitialiser
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Permissions par rôle">
          <div className="flex flex-wrap gap-1.5">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                  role === r
                    ? "bg-navy text-navy-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {permissions.map((p) => {
              const ok = matrix[role]?.includes(p);
              return (
                <li
                  key={p}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    ok ? "text-success" : "text-muted-foreground/70",
                  )}
                >
                  {ok ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" />}
                  {p}
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Ajouter un utilisateur</SheetTitle>
          </SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setOpen(false);
              toast.success("Utilisateur créé");
            }}
          >
            {["Nom", "Prénom", "Email", "Téléphone", "Équipe"].map((l) => (
              <label key={l} className="block">
                <span className="label-xs">{l}</span>
                <input className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring" />
              </label>
            ))}
            <label className="block">
              <span className="label-xs">Rôle</span>
              <select className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring">
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label-xs">Statut</span>
              <select className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring">
                <option>Actif</option>
                <option>Inactif</option>
              </select>
            </label>
            <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              Créer l'utilisateur
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
