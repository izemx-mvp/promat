import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, Lock, MoreHorizontal, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ImportDialog } from "@/components/promat/import-dialog";
import { AppShell, PageHeader } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import {
  ConfirmDialog,
  EmptyState,
  GhostButton,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SelectField,
  TableSearch,
  TextField,
} from "@/components/promat/form-kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCan, useReferentiel, type Fournisseur } from "@/lib/promat/referentiel";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/referentiels/fournisseurs")({
  head: () => ({
    meta: [
      { title: "Référentiel fournisseurs — PROMAT" },
      {
        name: "description",
        content:
          "Annuaire des fournisseurs PROMAT : pays, marques, familles de produits, délai moyen de réponse et score de performance.",
      },
      { property: "og:title", content: "Référentiel fournisseurs — PROMAT" },
      {
        property: "og:description",
        content: "Annuaire fournisseurs avec historique de consultations et prix.",
      },
    ],
  }),
  component: FournisseursPage,
});

const countries = ["Maroc", "France", "Allemagne", "Italie", "Turquie", "Espagne", "Chine"];
const empty = { name: "", country: "Maroc", brands: "", families: "", response: "", score: "80" };
type SortKey = "name" | "country" | "score";

function FournisseursPage() {
  const {
    fournisseurs,
    addFournisseur,
    updateFournisseur,
    removeFournisseur,
    restoreFournisseur,
  } = useReferentiel();
  const { user } = useAuth();
  const can = useCan();
  const allowed = can(user?.role, "Voir les prix fournisseurs") || can(user?.role, "Créer un AO");

  const [open, setOpen] = useState<Fournisseur | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const [form, setForm] = useState<typeof empty | null>(null);
  const [editing, setEditing] = useState<Fournisseur | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Fournisseur | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? fournisseurs.filter((f) =>
          [f.name, f.country, f.brands, f.families].join(" ").toLowerCase().includes(q),
        )
      : fournisseurs;
    return [...filtered].sort((a, b) => {
      const k = sort.key;
      if (k === "score") return (a.score - b.score) * sort.dir;
      return String(a[k]).localeCompare(String(b[k]), "fr") * sort.dir;
    });
  }, [fournisseurs, query, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  }

  function openCreate() {
    setEditing(null);
    setErrors({});
    setForm({ ...empty });
  }

  function openEdit(f: Fournisseur) {
    setEditing(f);
    setErrors({});
    setForm({
      name: f.name,
      country: f.country,
      brands: f.brands,
      families: f.families,
      response: f.response,
      score: String(f.score),
    });
  }

  const dirty = Boolean(
    form &&
      (editing
        ? form.name !== editing.name ||
          form.country !== editing.country ||
          form.brands !== editing.brands ||
          form.families !== editing.families ||
          form.response !== editing.response ||
          form.score !== String(editing.score)
        : form.name.trim().length > 0),
  );

  function save() {
    if (!form) return;
    const next: Record<string, string> = {};
    if (!form.name.trim()) next["name"] = "Ce champ est obligatoire.";
    if (!form.families.trim()) next["families"] = "Ce champ est obligatoire.";
    const score = Number(form.score);
    if (!form.score.trim() || Number.isNaN(score)) next["score"] = "Valeur numérique attendue.";
    if (
      form.name.trim() &&
      fournisseurs.some(
        (f) => f.id !== editing?.id && f.name.trim().toLowerCase() === form.name.trim().toLowerCase(),
      )
    ) {
      next["name"] = "Cette référence existe déjà.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setTimeout(() => {
      const payload = {
        name: form.name.trim(),
        country: form.country,
        brands: form.brands.trim() || "—",
        families: form.families.trim(),
        response: form.response.trim() || "—",
        score: Math.max(0, Math.min(100, Math.round(score))),
      };
      if (editing) {
        updateFournisseur(editing.id, payload);
        toast.success("Modifications enregistrées.");
      } else {
        addFournisseur(payload);
        toast.success("Fournisseur ajouté.");
      }
      setBusy(false);
      setForm(null);
    }, 420);
  }

  function confirmDelete(f: Fournisseur) {
    const removed = removeFournisseur(f.id);
    toast.success(`« ${f.name} » supprimé.`, {
      duration: 6000,
      action: {
        label: "Annuler",
        onClick: () => removed && restoreFournisseur(removed),
      },
    });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
        <PageHeader
          title="Fournisseurs"
          subtitle="Annuaire PROMAT. Cliquez un fournisseur pour son historique complet."
          action={
            <div className="flex items-center gap-2">
              <PrimaryButton
                onClick={allowed ? openCreate : undefined}
                disabled={!allowed}
                className={cn(!allowed && "cursor-not-allowed")}
              >
                {allowed ? <Plus className="size-4" /> : <Lock className="size-4" />} Ajouter un fournisseur
              </PrimaryButton>
              <SecondaryButton
                onClick={() => setImportOpen(true)}
                disabled={!allowed}
                title={allowed ? undefined : "Votre rôle ne permet pas cette action."}
              >
                <Upload className="size-4" /> Importer
              </SecondaryButton>
            </div>
          }
        />

        {!allowed && (
          <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            Votre rôle ne permet pas cette action.
          </p>
        )}

        <SectionCard
          action={<TableSearch value={query} onChange={setQuery} placeholder="Rechercher un fournisseur…" />}
        >
          {rows.length === 0 ? (
            <EmptyState action={<SecondaryButton onClick={() => setQuery("")}>Réinitialiser les filtres</SecondaryButton>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {(
                      [
                        ["Fournisseur", "name"],
                        ["Pays", "country"],
                        ["Marques", null],
                        ["Familles", null],
                        ["Réponse moy.", null],
                        ["Score", "score"],
                        ["", null],
                      ] as [string, SortKey | null][]
                    ).map(([h, key]) => (
                      <th
                        key={h}
                        className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {key ? (
                          <button
                            onClick={() => toggleSort(key)}
                            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                          >
                            {h}
                            <ArrowUpDown
                              className={cn(
                                "size-3 transition-transform",
                                sort.key === key ? "text-primary" : "opacity-40",
                                sort.key === key && sort.dir === -1 && "rotate-180",
                              )}
                            />
                          </button>
                        ) : (
                          h
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="group border-b border-border/60 transition-colors last:border-0 hover:bg-muted/60"
                    >
                      <td onClick={() => setOpen(r)} className="cursor-pointer py-3.5 pr-4 font-medium">
                        {r.name}
                      </td>
                      <td onClick={() => setOpen(r)} className="cursor-pointer py-3.5 pr-4 text-muted-foreground">
                        {r.country}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">{r.brands}</td>
                      <td className="py-3.5 pr-4 text-muted-foreground">{r.families}</td>
                      <td className="py-3.5 pr-4 tabular-nums">{r.response}</td>
                      <td className="py-3.5 pr-4">
                        <Pill tone={r.score >= 80 ? "ok" : "warn"}>{r.score} / 100</Pill>
                      </td>
                      <td className="py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              aria-label={`Actions pour ${r.name}`}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => setOpen(r)}>Voir l'historique</DropdownMenuItem>
                            <DropdownMenuItem disabled={!allowed} onClick={() => openEdit(r)}>
                              <Pencil className="mr-2 size-3.5" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={!allowed}
                              onClick={() => setToDelete(r)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 size-3.5" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importer des fournisseurs"
        subtitle="Fichier Excel ou CSV. Les colonnes reconnues sont associées automatiquement."
        accept=".xlsx,.xls,.csv"
        acceptLabel="Formats acceptés : Excel (.xlsx, .xls) ou CSV"
        columns={["Nom fournisseur", "Contact", "Email", "Téléphone", "Pays", "Marques", "Familles produits", "Devise", "Incoterm"]}
        stats={{ detected: 125, valid: 120, toCheck: 5 }}
        confirmLabel="Importer les fournisseurs"
        onConfirm={() => toast.success("120 fournisseurs importés · 5 lignes à vérifier")}
      />

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={editing ? "Modifier le fournisseur" : "Ajouter un fournisseur"}
        subtitle="Le fournisseur devient immédiatement disponible pour les consultations et les comparatifs."
        footer={
          <>
            <GhostButton onClick={() => setForm(null)} className="mr-auto">
              Annuler
            </GhostButton>
            <PrimaryButton onClick={save} loading={busy} disabled={!dirty}>
              {editing ? "Enregistrer" : "Ajouter le fournisseur"}
            </PrimaryButton>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 pb-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField label="Nom du fournisseur" required value={form.name} error={errors["name"]} onChange={(v) => setForm({ ...form, name: v })} />
            </div>
            <SelectField label="Pays" required value={form.country} options={countries} onChange={(v) => setForm({ ...form, country: v })} />
            <TextField label="Délai de réponse moyen" value={form.response} placeholder="3 jours" onChange={(v) => setForm({ ...form, response: v })} />
            <div className="sm:col-span-2">
              <TextField label="Marques" value={form.brands} placeholder="FlowTech, Endress" onChange={(v) => setForm({ ...form, brands: v })} />
            </div>
            <div className="sm:col-span-2">
              <TextField label="Familles de produits" required value={form.families} error={errors["families"]} placeholder="Instrumentation, débitmétrie" onChange={(v) => setForm({ ...form, families: v })} />
            </div>
            <TextField label="Score" required suffix="/ 100" mono value={form.score} error={errors["score"]} onChange={(v) => setForm({ ...form, score: v })} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && confirmDelete(toDelete)}
        title={`Supprimer « ${toDelete?.name ?? ""} » ?`}
        message="Cette action est irréversible."
        verb="Supprimer"
      />

      <Sheet open={Boolean(open)} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{open?.name}</SheetTitle>
          </SheetHeader>
          {open && (
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              {[
                ["Contact", "commercial@" + open.name.split(" ")[0]!.toLowerCase() + ".com"],
                ["Marques", open.brands],
                ["Familles", open.families],
                ["Devises", "EUR, USD"],
                ["Incoterms", "CIF Casablanca, FOB"],
                ["Genuine / OEM", "Genuine"],
                ["Consultations précédentes", "4 (2023 – 2025)"],
                ["Derniers prix", "4 050 EUR · 2 380 EUR · 780 EUR"],
                ["Délai moyen", "4 semaines"],
                ["Taux de réponse", "86 %"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label-xs">{k}</dt>
                  <dd className="mt-1">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
