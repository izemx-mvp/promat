import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, MoreHorizontal, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
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
import { useReferentiel, type ArticleRef } from "@/lib/promat/referentiel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/referentiels/articles")({
  head: () => ({
    meta: [
      { title: "Référentiel articles — PROMAT" },
      {
        name: "description",
        content:
          "Base articles PROMAT : références fabricant, familles, fournisseurs connus, dernier prix d'achat et alertes de variation de prix.",
      },
      { property: "og:title", content: "Référentiel articles — PROMAT" },
      {
        property: "og:description",
        content: "Historique des prix d'achat et alertes de variation détectées par l'IA.",
      },
    ],
  }),
  component: ArticlesRefPage,
});

const empty = {
  ref: "",
  mfr: "",
  designation: "",
  brand: "",
  family: "",
  suppliers: "",
  price: "",
  currency: "EUR",
};
type SortKey = "ref" | "designation" | "variation";

function ArticlesRefPage() {
  const { articles, addArticle, updateArticle, removeArticle, restoreArticle } = useReferentiel();
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "ref", dir: 1 });
  const [form, setForm] = useState<typeof empty | null>(null);
  const [editing, setEditing] = useState<ArticleRef | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<ArticleRef | null>(null);
  const [detail, setDetail] = useState<ArticleRef | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const alertArticle = articles.find((a) => a.variation > 5);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? articles.filter((a) =>
          [a.ref, a.mfr, a.designation, a.brand, a.family, a.suppliers].join(" ").toLowerCase().includes(q),
        )
      : articles;
    return [...filtered].sort((a, b) => {
      if (sort.key === "variation") return (a.variation - b.variation) * sort.dir;
      return String(a[sort.key]).localeCompare(String(b[sort.key]), "fr") * sort.dir;
    });
  }, [articles, query, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  }

  function openCreate() {
    setEditing(null);
    setErrors({});
    setForm({ ...empty });
  }

  function openEdit(a: ArticleRef) {
    setEditing(a);
    setErrors({});
    const [price = "", currency = "EUR"] = a.last.split(" ").reduce<[string, string]>(
      (acc, part) => (/^[A-Z]{3}$/.test(part) ? [acc[0], part] : [`${acc[0]}${part}`, acc[1]]),
      ["", "EUR"],
    );
    setForm({
      ref: a.ref,
      mfr: a.mfr,
      designation: a.designation,
      brand: a.brand,
      family: a.family,
      suppliers: a.suppliers,
      price,
      currency,
    });
  }

  const dirty = Boolean(form && (form.ref.trim() || editing));

  function formatPrice(price: number, currency: string) {
    return `${price.toLocaleString("fr-FR", { maximumFractionDigits: 0 }).replace(/\u202f|\u00a0/g, " ")} ${currency}`;
  }

  function save() {
    if (!form) return;
    const next: Record<string, string> = {};
    if (!form.ref.trim()) next.ref = "Ce champ est obligatoire.";
    if (!form.designation.trim()) next.designation = "Ce champ est obligatoire.";
    const price = Number(form.price.replace(/[^\d.,-]/g, "").replace(",", "."));
    if (!form.price.trim() || Number.isNaN(price)) next.price = "Valeur numérique attendue.";
    if (
      form.ref.trim() &&
      articles.some((a) => a.id !== editing?.id && a.ref.trim().toLowerCase() === form.ref.trim().toLowerCase())
    ) {
      next.ref = "Cette référence existe déjà.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setTimeout(() => {
      const oldPrice = editing ? Number(editing.last.replace(/[^\d]/g, "")) : 0;
      const variation = editing && oldPrice > 0 ? Number((((price - oldPrice) / oldPrice) * 100).toFixed(1)) : 0;
      const payload = {
        ref: form.ref.trim(),
        mfr: form.mfr.trim() || "—",
        designation: form.designation.trim(),
        brand: form.brand.trim() || "—",
        family: form.family.trim() || "—",
        suppliers: form.suppliers.trim() || "—",
        last: formatPrice(price, form.currency || "EUR"),
        date: new Date().toLocaleDateString("fr-FR", { month: "2-digit", year: "numeric" }),
        tenders: editing?.tenders ?? "—",
        variation: editing ? variation : 0,
      };
      if (editing) {
        updateArticle(editing.id, payload);
        toast.success("Modifications enregistrées.");
        if (variation > 5) setAlertDismissed(false);
      } else {
        addArticle(payload);
        toast.success("Article ajouté.");
      }
      setBusy(false);
      setForm(null);
    }, 420);
  }

  function confirmDelete(a: ArticleRef) {
    const removed = removeArticle(a.id);
    toast.success(`« ${a.ref} » supprimé.`, {
      duration: 6000,
      action: { label: "Annuler", onClick: () => removed && restoreArticle(removed) },
    });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
        <PageHeader
          title="Articles"
          subtitle="Historique des références PROMAT et alertes de variation de prix."
          action={
            <div className="flex items-center gap-2">
              <PrimaryButton onClick={openCreate}>
                <Plus className="size-4" /> Ajouter un article
              </PrimaryButton>
              <SecondaryButton onClick={() => setImportOpen(true)}>
                <Upload className="size-4" /> Importer
              </SecondaryButton>
            </div>
          }
        />

        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importer des articles"
          subtitle="Réutilisez vos fichiers Excel historiques. Les colonnes reconnues sont associées automatiquement."
          accept=".xlsx,.xls,.csv"
          acceptLabel="Formats acceptés : Excel (.xlsx, .xls) ou CSV"
          columns={["Référence", "Référence fabricant", "Désignation", "Marque", "Famille", "Dernier fournisseur", "Dernier prix", "Devise"]}
          stats={{ detected: 250, valid: 243, toCheck: 7 }}
          confirmLabel="Importer les articles"
          onConfirm={() => toast.success("243 articles importés · 7 à vérifier")}
        />

        {alertArticle && !alertDismissed && (
          <SectionCard className="relative border-warning/30 bg-warning-soft/50">
            <button
              onClick={() => setAlertDismissed(true)}
              aria-label="Masquer l'alerte"
              className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-lg text-warning transition-colors hover:bg-warning/10"
            >
              <X className="size-3.5" />
            </button>
            <p className="text-sm font-medium text-warning">Alerte prix — {alertArticle.designation}</p>
            <p className="mt-1 text-sm text-warning">
              Dernier prix {alertArticle.last} · variation +{" "}
              {alertArticle.variation.toLocaleString("fr-FR", { minimumFractionDigits: 1 })} %
            </p>
            <GhostButton onClick={() => setDetail(alertArticle)} className="mt-2 -ml-4 text-warning hover:text-warning">
              Voir l'article
            </GhostButton>
          </SectionCard>
        )}

        <SectionCard action={<TableSearch value={query} onChange={setQuery} placeholder="Rechercher un article…" />}>
          {rows.length === 0 ? (
            <EmptyState action={<SecondaryButton onClick={() => setQuery("")}>Réinitialiser les filtres</SecondaryButton>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {(
                      [
                        ["Réf. PROMAT", "ref"],
                        ["Réf. fabricant", null],
                        ["Désignation", "designation"],
                        ["Marque", null],
                        ["Famille", null],
                        ["Fournisseurs", null],
                        ["Dernier prix", null],
                        ["Variation", "variation"],
                        ["", null],
                      ] as [string, SortKey | null][]
                    ).map(([h, key]) => (
                      <th key={h} className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {key ? (
                          <button onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
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
                    <tr key={r.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/60">
                      <td onClick={() => setDetail(r)} className="cursor-pointer py-3.5 pr-4 tabular-nums text-muted-foreground">
                        {r.ref}
                      </td>
                      <td className="py-3.5 pr-4 tabular-nums text-muted-foreground">{r.mfr}</td>
                      <td onClick={() => setDetail(r)} className="cursor-pointer py-3.5 pr-4 font-medium">
                        {r.designation}
                      </td>
                      <td className="py-3.5 pr-4">{r.brand}</td>
                      <td className="py-3.5 pr-4 text-muted-foreground">{r.family}</td>
                      <td className="py-3.5 pr-4 text-muted-foreground">{r.suppliers}</td>
                      <td className="py-3.5 pr-4 tabular-nums">
                        {r.last}
                        <span className="block text-xs text-muted-foreground">{r.date}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <Pill tone={r.variation > 5 ? "warn" : r.variation < 0 ? "ok" : "neutral"}>
                          {r.variation > 0 ? "+" : ""}
                          {r.variation.toLocaleString("fr-FR", { minimumFractionDigits: 1 })} %
                        </Pill>
                      </td>
                      <td className="py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              aria-label={`Actions pour ${r.ref}`}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => setDetail(r)}>Historique des prix</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(r)}>
                              <Pencil className="mr-2 size-3.5" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setToDelete(r)} className="text-destructive focus:text-destructive">
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

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={editing ? "Modifier l'article" : "Ajouter un article"}
        subtitle="La référence PROMAT doit être unique dans le référentiel."
        footer={
          <>
            <GhostButton onClick={() => setForm(null)} className="mr-auto">
              Annuler
            </GhostButton>
            <PrimaryButton onClick={save} loading={busy} disabled={!dirty}>
              {editing ? "Enregistrer" : "Ajouter l'article"}
            </PrimaryButton>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 pb-4 sm:grid-cols-2">
            <TextField label="Réf. PROMAT" required mono value={form.ref} error={errors.ref} onChange={(v) => setForm({ ...form, ref: v })} />
            <TextField label="Réf. fabricant" mono value={form.mfr} onChange={(v) => setForm({ ...form, mfr: v })} />
            <div className="sm:col-span-2">
              <TextField label="Désignation" required value={form.designation} error={errors.designation} onChange={(v) => setForm({ ...form, designation: v })} />
            </div>
            <TextField label="Marque" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
            <TextField label="Famille" value={form.family} onChange={(v) => setForm({ ...form, family: v })} />
            <div className="sm:col-span-2">
              <TextField label="Fournisseurs" value={form.suppliers} onChange={(v) => setForm({ ...form, suppliers: v })} />
            </div>
            <TextField label="Dernier prix" required mono suffix={form.currency} value={form.price} error={errors.price} onChange={(v) => setForm({ ...form, price: v })} />
            <TextField label="Devise" mono value={form.currency} onChange={(v) => setForm({ ...form, currency: v.toUpperCase().slice(0, 3) })} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && confirmDelete(toDelete)}
        title={`Supprimer « ${toDelete?.ref ?? ""} » ?`}
        message="Cette action est irréversible."
        verb="Supprimer"
      />

      <Sheet open={Boolean(detail)} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{detail?.designation}</SheetTitle>
          </SheetHeader>
          {detail && (
            <>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Réf. PROMAT", detail.ref],
                  ["Réf. fabricant", detail.mfr],
                  ["Marque", detail.brand],
                  ["Famille", detail.family],
                  ["Fournisseurs connus", detail.suppliers],
                  ["Dernier prix", `${detail.last} · ${detail.date}`],
                  ["Variation", `${detail.variation > 0 ? "+" : ""}${detail.variation.toLocaleString("fr-FR", { minimumFractionDigits: 1 })} %`],
                  ["Appels d'offres", detail.tenders],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="label-xs">{k}</dt>
                    <dd className="mt-1">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6">
                <PrimaryButton
                  onClick={() => {
                    openEdit(detail);
                    setDetail(null);
                  }}
                >
                  <Pencil className="size-4" /> Modifier
                </PrimaryButton>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
