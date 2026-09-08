import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, KeyRound, MoreHorizontal, Pencil, Plus, Power, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import {
  ConfirmDialog,
  GhostButton,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SelectField,
  TextField,
} from "@/components/promat/form-kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  defaultMatrix,
  permissionList,
  roles,
  useReferentiel,
  type Utilisateur,
} from "@/lib/promat/referentiel";

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

const empty = { name: "", email: "", role: "Commercial", team: "", statut: "Actif" };

function UsersPage() {
  const { utilisateurs, addUtilisateur, updateUtilisateur, matrix, setMatrix } = useReferentiel();
  const [role, setRole] = useState("Commercial");
  const [form, setForm] = useState<typeof empty | null>(null);
  const [editing, setEditing] = useState<Utilisateur | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [toToggle, setToToggle] = useState<Utilisateur | null>(null);
  const [toReset, setToReset] = useState<Utilisateur | null>(null);
  const [draftMatrix, setDraftMatrix] = useState<Record<string, string[]> | null>(null);

  const activeMatrix = draftMatrix ?? matrix;

  function openCreate() {
    setEditing(null);
    setErrors({});
    setForm({ ...empty });
  }

  function openEdit(u: Utilisateur) {
    setEditing(u);
    setErrors({});
    setForm({ name: u.name, email: u.email, role: u.role, team: u.team, statut: u.active ? "Actif" : "Inactif" });
  }

  const dirty = Boolean(form && (form.name.trim() || editing));

  function save() {
    if (!form) return;
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Ce champ est obligatoire.";
    if (!form.email.trim()) next.email = "Ce champ est obligatoire.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = "Adresse e-mail invalide.";
    else if (utilisateurs.some((u) => u.id !== editing?.id && u.email.toLowerCase() === form.email.trim().toLowerCase()))
      next.email = "Cet e-mail est déjà utilisé.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setTimeout(() => {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        team: form.team.trim() || "—",
        active: form.statut === "Actif",
      };
      if (editing) {
        updateUtilisateur(editing.id, payload);
        toast.success("Modifications enregistrées.");
      } else {
        addUtilisateur({ ...payload, last: "Jamais" });
        toast.success("Utilisateur ajouté.");
      }
      setBusy(false);
      setForm(null);
    }, 420);
  }

  function togglePermission(perm: string) {
    const current = activeMatrix[role] ?? [];
    const next = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm];
    setDraftMatrix({ ...activeMatrix, [role]: next });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
        <PageHeader
          title="Gestion utilisateurs"
          subtitle="Comptes, équipes, rôles et droits d'accès."
          action={
            <PrimaryButton onClick={openCreate}>
              <Plus className="size-4" /> Ajouter un utilisateur
            </PrimaryButton>
          }
        />

        <SectionCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Utilisateur", "Email", "Rôle", "Équipe", "Statut", "Dernière connexion", ""].map((h) => (
                    <th key={h} className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((u) => (
                  <tr
                    key={u.id}
                    className={cn(
                      "border-b border-border/60 transition-colors last:border-0 hover:bg-muted/60",
                      !u.active && "opacity-60",
                    )}
                  >
                    <td className="py-3.5 pr-4 font-medium">{u.name}</td>
                    <td className="py-3.5 pr-4 mono text-[12.5px] text-muted-foreground">{u.email}</td>
                    <td className="py-3.5 pr-4">{u.role}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{u.team}</td>
                    <td className="py-3.5 pr-4">
                      <Pill tone={u.active ? "ok" : "neutral"}>{u.active ? "Actif" : "Inactif"}</Pill>
                    </td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{u.last}</td>
                    <td className="py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            aria-label={`Actions pour ${u.name}`}
                            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            <Pencil className="mr-2 size-3.5" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setToReset(u)}>
                            <KeyRound className="mr-2 size-3.5" /> Réinitialiser
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setToToggle(u)}
                            className={u.active ? "text-destructive focus:text-destructive" : undefined}
                          >
                            <Power className="mr-2 size-3.5" /> {u.active ? "Désactiver" : "Activer"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Permissions par rôle"
          subtitle="Cliquez un droit pour l'accorder ou le retirer."
          action={
            <div className="flex items-center gap-2">
              <SecondaryButton
                onClick={() => {
                  setDraftMatrix(Object.fromEntries(Object.entries(defaultMatrix).map(([k, v]) => [k, [...v]])));
                }}
              >
                Valeurs par défaut
              </SecondaryButton>
              <PrimaryButton
                disabled={!draftMatrix}
                onClick={() => {
                  if (draftMatrix) setMatrix(draftMatrix);
                  setDraftMatrix(null);
                  toast.success("Permissions mises à jour.");
                }}
              >
                Enregistrer les permissions
              </PrimaryButton>
            </div>
          }
        >
          <div className="flex flex-wrap gap-1.5">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
                  role === r ? "bg-navy text-navy-foreground" : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {permissionList.map((p) => {
              const ok = (activeMatrix[role] ?? []).includes(p);
              return (
                <li key={p}>
                  <button
                    onClick={() => togglePermission(p)}
                    aria-pressed={ok}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
                      ok ? "text-success" : "text-muted-foreground/70",
                    )}
                  >
                    {ok ? <Check className="size-4 shrink-0" strokeWidth={3} /> : <X className="size-4 shrink-0" />}
                    {p}
                  </button>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={editing ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
        subtitle="Le rôle détermine les droits appliqués dans toute l'application."
        footer={
          <>
            <GhostButton onClick={() => setForm(null)} className="mr-auto">
              Annuler
            </GhostButton>
            <PrimaryButton onClick={save} loading={busy} disabled={!dirty}>
              {editing ? "Enregistrer" : "Créer l'utilisateur"}
            </PrimaryButton>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 pb-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField label="Nom complet" required value={form.name} error={errors.name} onChange={(v) => setForm({ ...form, name: v })} />
            </div>
            <div className="sm:col-span-2">
              <TextField label="Email" required type="email" mono value={form.email} error={errors.email} onChange={(v) => setForm({ ...form, email: v })} />
            </div>
            <SelectField label="Rôle" required value={form.role} options={roles} onChange={(v) => setForm({ ...form, role: v })} />
            <TextField label="Équipe" value={form.team} onChange={(v) => setForm({ ...form, team: v })} />
            <SelectField label="Statut" value={form.statut} options={["Actif", "Inactif"]} onChange={(v) => setForm({ ...form, statut: v })} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toToggle)}
        onClose={() => setToToggle(null)}
        onConfirm={() => {
          if (!toToggle) return;
          updateUtilisateur(toToggle.id, { active: !toToggle.active });
          toast.success(toToggle.active ? "Utilisateur désactivé." : "Utilisateur activé.");
        }}
        title={`${toToggle?.active ? "Désactiver" : "Activer"} « ${toToggle?.name ?? ""} » ?`}
        message={
          toToggle?.active
            ? "Le compte ne pourra plus se connecter à Tender OS."
            : "Le compte pourra de nouveau se connecter à Tender OS."
        }
        verb={toToggle?.active ? "Désactiver" : "Activer"}
      />

      <ConfirmDialog
        open={Boolean(toReset)}
        onClose={() => setToReset(null)}
        onConfirm={() =>
          toast.success(`Mot de passe réinitialisé. Un e-mail a été envoyé à ${toReset?.email ?? ""}.`)
        }
        title="Réinitialiser le mot de passe ?"
        message={`Un e-mail de réinitialisation sera envoyé à ${toReset?.email ?? ""}.`}
        verb="Réinitialiser"
      />
    </AppShell>
  );
}
