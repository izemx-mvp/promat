import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { GhostButton, NextButton, StickyBar, TenderWorkflow } from "@/components/promat/workflow";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Article } from "@/lib/promat/data";
import { useTender } from "@/lib/promat/store";
import { toast } from "sonner";

export const Route = createFileRoute("/articles/$id")({
  head: () => ({
    meta: [
      { title: "Articles du dossier — PROMAT" },
      {
        name: "description",
        content:
          "Lignes d'articles extraites du dossier : quantités, spécifications regroupées, historique PROMAT et validation avant consultation.",
      },
      { property: "og:title", content: "Articles du dossier — PROMAT" },
      {
        property: "og:description",
        content: "Validez les articles détectés avant de consulter les fournisseurs.",
      },
    ],
  }),
  component: ArticlesPage,
});

function ArticlesPage() {
  const { id } = useParams({ from: "/articles/$id" });
  const { tender, state, update, addLog } = useTender(id);
  const navigate = useNavigate();
  const [open, setOpen] = useState<Article | null>(null);


  if (!tender || !state) {
    return (
      <AppShell>
        <div className="p-8 text-sm text-muted-foreground">Dossier introuvable.</div>
      </AppShell>
    );
  }

  const total = tender.articles.length;
  const toCheck = tender.articles.filter((a) => a.status === "À vérifier").length;

  const validate = () => {
    update(id, { articlesValidated: true });
    addLog({
      who: "Houda Bennani",
      action: `${total} articles validés`,
      tender: tender.reference,
      module: "Articles",
    });
    toast.success("Articles validés — ouverture des consultations fournisseurs");
    navigate({ to: "/consultations/$id", params: { id } });
  };


  return (
    <AppShell>
      <TenderWorkflow tender={tender} state={state} current="articles">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <p className="label-xs">Articles détectés</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{total}</p>
          </div>
          <div>
            <p className="label-xs">Validés</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums text-success">
              {total - toCheck}
            </p>
          </div>
          <div>
            <p className="label-xs">À vérifier</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums text-warning">
              {toCheck}
            </p>
          </div>
        </div>

        <SectionCard title="Lignes du dossier" subtitle="Cliquez une ligne pour voir le détail.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Réf.", "Désignation", "Qté", "Unité", "Spécifications", "Statut"].map((h) => (
                    <th key={h} className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tender.articles.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setOpen(a)}
                    className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/60"
                  >
                    <td className="py-3.5 pr-4 tabular-nums text-muted-foreground">{a.ref}</td>
                    <td className="py-3.5 pr-4 font-medium">{a.designation}</td>
                    <td className="py-3.5 pr-4 tabular-nums">{a.qty}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{a.unit}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{a.specs}</td>
                    <td className="py-3.5">
                      <Pill tone={a.status === "Validé" ? "ok" : "warn"}>{a.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <StickyBar
          message={
            state.articlesValidated
              ? "Articles validés. Vous pouvez sélectionner les fournisseurs."
              : `${total} articles détectés, ${toCheck} à vérifier.`
          }
        >
          {state.articlesValidated ? (
            <NextButton
              to="/consultations/$id"
              id={id}
              label="Passer aux consultations fournisseurs"
            />
          ) : (
            <NextButton label="Valider les articles et continuer" onClick={validate} />
          )}
        </StickyBar>
      </TenderWorkflow>

      <Sheet open={Boolean(open)} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{open?.designation}</SheetTitle>
          </SheetHeader>
          {open && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label-xs">Référence client</p>
                  <p className="mt-1 text-sm font-medium">{open.ref}</p>
                </div>
                <div>
                  <p className="label-xs">Référence fabricant</p>
                  <p className="mt-1 text-sm font-medium">FT-{open.ref}-XX</p>
                </div>
              </div>
              <div>
                <p className="label-xs">Spécifications détaillées</p>
                <ul className="mt-2 space-y-1.5">
                  {open.fullSpec.map((s) => (
                    <li key={s} className="text-sm text-foreground/85">
                      • {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="label-xs">Document source</p>
                <p className="mt-1 text-sm">{open.source}</p>
              </div>
              <div className="rounded-xl bg-ai-soft p-4 text-sm text-ai">
                <p className="font-medium">Historique PROMAT</p>
                <p className="mt-1">{open.history}</p>
                <p className="mt-2">
                  Dernier fournisseur : {open.prevSupplier} · Dernier prix : {open.prevPrice}
                </p>
              </div>
              <div className="flex gap-2">
                <GhostButton onClick={() => toast.info("Édition de l'article (démo)")}>
                  Modifier
                </GhostButton>
                <button
                  onClick={() => {
                    setOpen(null);
                    toast.success("Article validé");
                  }}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Valider
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
