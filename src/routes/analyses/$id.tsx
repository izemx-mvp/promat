import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Check, Sparkles } from "lucide-react";
import { AppShell } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import {
  GhostButton,
  NextButton,
  StickyBar,
  TenderKeyFacts,
  TenderWorkflow,
} from "@/components/promat/workflow";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { noGoReasons } from "@/lib/promat/data";
import { useTender } from "@/lib/promat/store";
import { toast } from "sonner";

export const Route = createFileRoute("/analyses/$id")({
  head: () => ({
    meta: [
      { title: "Analyse du dossier — PROMAT" },
      {
        name: "description",
        content:
          "Résumé IA, points de vigilance, matrice d'éligibilité et décision GO / NO GO pour un appel d'offres PROMAT.",
      },
      { property: "og:title", content: "Analyse du dossier — PROMAT" },
      {
        property: "og:description",
        content: "L'Agent AO résume le dossier et recommande une décision.",
      },
    ],
  }),
  component: AnalysePage,
});

const drawerSections = [
  {
    title: "Administratif",
    lines: [
      "Caution provisoire exigée avant dépôt",
      "Attestation fiscale et CNSS de moins de 3 mois",
      "Déclaration sur l'honneur signée",
    ],
  },
  {
    title: "Technique",
    lines: [
      "Documentation fabricant obligatoire en français",
      "Certificat d'étalonnage usine par appareil",
      "Validation technique fabricant requise",
    ],
  },
  {
    title: "Financier",
    lines: ["Budget estimatif 1 200 000 MAD TTC", "Paiement à 60 jours", "Révision de prix exclue"],
  },
  {
    title: "Documents",
    lines: ["CPS (48 pages)", "Bordereau des prix", "Modèle d'acte d'engagement"],
  },
  {
    title: "Risques",
    lines: ["Références similaires à confirmer", "Délai fournisseur DN600 potentiellement long"],
  },
  {
    title: "Clauses importantes",
    lines: ["Pénalités de retard 1 ‰ par jour", "Garantie 24 mois", "Réception sur site obligatoire"],
  },
];

function AnalysePage() {
  const { id } = useParams({ from: "/analyses/$id" });
  const { tender, state, update, addLog } = useTender(id);
  const navigate = useNavigate();
  const [detail, setDetail] = useState(false);
  const [noGo, setNoGo] = useState(false);

  if (!tender || !state) {
    return (
      <AppShell>
        <div className="p-8 text-sm text-muted-foreground">Dossier introuvable.</div>
      </AppShell>
    );
  }

  const validateGo = () => {
    update(id, { analysisValidated: true, decision: "go" });
    addLog({ who: "Houda Bennani", action: "GO validé", tender: tender.reference, module: "Analyses" });
    toast.success("GO validé — passez aux articles");
  };

  return (
    <AppShell>
      <TenderWorkflow tender={tender} state={state} current={state.decision === "go" ? "go" : "analyse"}>
        <SectionCard>
          <p className="text-sm text-muted-foreground">{tender.object}</p>
          <div className="mt-6">
            <TenderKeyFacts tender={tender} />
          </div>
        </SectionCard>

        <SectionCard
          title="Résumé IA"
          action={<Pill tone="ai"><Sparkles className="size-3.5" /> Agent AO</Pill>}
        >
          <ul className="space-y-2.5">
            {tender.demand.map((d) => (
              <li key={d} className="flex gap-3 text-[15px]">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ai" />
                {d}
              </li>
            ))}
            <li className="flex gap-3 text-[15px]">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ai" />
              Délai compatible avec une consultation fournisseur
            </li>
          </ul>
          <p className="mt-5 rounded-xl bg-ai-soft p-4 text-sm text-ai">{tender.aiComment}</p>
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Points à vérifier">
            <ul className="space-y-3">
              {tender.vigilance.map((v) => (
                <li
                  key={v.text}
                  className={`flex items-start gap-3 rounded-xl p-3.5 text-sm ${
                    v.tone === "warn" ? "bg-warning-soft text-warning" : "bg-success-soft text-success"
                  }`}
                >
                  {v.tone === "warn" ? (
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <Check className="mt-0.5 size-4 shrink-0" />
                  )}
                  {v.text}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Éligibilité">
            <dl className="divide-y divide-border">
              {tender.matrix.map((m) => (
                <div key={m.label} className="flex items-center justify-between py-3 text-sm">
                  <dt className="text-muted-foreground">{m.label}</dt>
                  <dd>
                    <Pill tone={m.tone === "ok" ? "ok" : "warn"}>{m.value}</Pill>
                  </dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </div>

        <SectionCard className="border-ai/30 bg-ai-soft/40">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Pill tone="ai">
                <Sparkles className="size-3.5" /> Recommandation de l'Agent
              </Pill>
              <p className="mt-3 font-display text-xl font-bold">{tender.recommendation}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Confiance : {tender.score} %
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <GhostButton onClick={() => setDetail(true)}>Voir l'analyse détaillée</GhostButton>
              <GhostButton onClick={() => setNoGo(true)}>Classer NO GO</GhostButton>
              <button
                onClick={validateGo}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Valider GO
              </button>
            </div>
          </div>
          {state.decision === "nogo" && (
            <p className="mt-4 rounded-xl bg-muted p-3.5 text-sm">
              Dossier classé NO GO — motif : {state.noGoReason}
            </p>
          )}
        </SectionCard>

        <StickyBar
          message={
            state.decision === "go"
              ? "GO validé. Le dossier est prêt pour la structuration des articles."
              : "Validez l'analyse pour débloquer les articles."
          }
        >
          {state.decision === "go" ? (
            <NextButton to="/articles/$id" id={id} label="Passer aux articles" />
          ) : (
            <NextButton label="Valider GO" onClick={validateGo} />
          )}
        </StickyBar>
      </TenderWorkflow>

      <Sheet open={detail} onOpenChange={setDetail}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Analyse détaillée</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {drawerSections.map((s) => (
              <div key={s.title}>
                <p className="label-xs">{s.title}</p>
                <ul className="mt-2 space-y-1.5">
                  {s.lines.map((l) => (
                    <li key={l} className="text-sm text-foreground/85">
                      • {l}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={noGo} onOpenChange={setNoGo}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Pourquoi classer ce dossier NO GO ?</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {noGoReasons.map((r) => (
              <button
                key={r}
                onClick={() => {
                  update(id, { decision: "nogo", noGoReason: r });
                  addLog({
                    who: "Houda Bennani",
                    action: `NO GO — ${r}`,
                    tender: tender.reference,
                    module: "Analyses",
                  });
                  setNoGo(false);
                  toast.info("Dossier classé NO GO");
                  navigate({ to: "/analyses" });
                }}
                className="w-full rounded-xl border border-border px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
              >
                {r}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
