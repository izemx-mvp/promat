import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Tender } from "@/lib/promat/data";
import type { TenderState } from "@/lib/promat/store";
import { usePromat } from "@/lib/promat/store";
import { StatusDot } from "./shell";
import { Field } from "./ui";

export type StepKey =
  | "analyse"
  | "go"
  | "articles"
  | "consultation"
  | "comparatif"
  | "chiffrage"
  | "offre";

export const workflowSteps: { key: StepKey; label: string; to: string }[] = [
  { key: "analyse", label: "Analyse", to: "/analyses/$id" },
  { key: "go", label: "GO", to: "/analyses/$id" },
  { key: "articles", label: "Articles", to: "/articles/$id" },
  { key: "consultation", label: "Consultation", to: "/consultations/$id" },
  { key: "comparatif", label: "Comparatif", to: "/comparatifs/$id" },
  { key: "chiffrage", label: "Chiffrage", to: "/chiffrages/$id" },
  { key: "offre", label: "Offre finale", to: "/offres/$id" },
];

export function stepDone(state: TenderState, key: StepKey) {
  switch (key) {
    case "analyse":
      return state.analysisValidated;
    case "go":
      return state.decision === "go";
    case "articles":
      return state.articlesValidated;
    case "consultation":
      return state.consultationCreated && state.offersReceived;
    case "comparatif":
      return Boolean(state.retainedSupplier);
    case "chiffrage":
      return state.costValidated && state.marginValidated;
    case "offre":
      return state.offerValidated;
  }
}

export function TenderWorkflow({
  tender,
  state,
  current,
  children,
}: {
  tender: Tender;
  state: TenderState;
  current: StepKey;
  children: ReactNode;
}) {
  return (
    <div className="pb-28">
      <div className="sticky top-16 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-8 pb-3 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-[26px] font-bold tracking-tight">
                  {tender.client}
                </h1>
                <StatusDot status={tender.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {tender.reference} · {tender.title}
              </p>
            </div>
            <div className="text-right">
              <p className="label-xs">Échéance</p>
              <p className="text-[15px] font-medium">{tender.deadlineLong}</p>
            </div>
          </div>

          <ol className="mt-4 flex flex-wrap items-center gap-1">
            {workflowSteps.map((s, i) => {
              const done = stepDone(state, s.key);
              const active = s.key === current;
              return (
                <li key={s.key} className="flex items-center">
                  <Link
                    to={s.to}
                    params={{ id: tender.id }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors",
                      active
                        ? "bg-primary/10 font-semibold text-primary"
                        : done
                          ? "text-foreground hover:bg-muted"
                          : "text-muted-foreground/70 hover:bg-muted",
                    )}
                  >
                    {done ? (
                      <Check className="size-3.5 text-success" strokeWidth={3} />
                    ) : (
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          active ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                    {s.label}
                  </Link>
                  {i < workflowSteps.length - 1 && <span className="mx-0.5 h-px w-4 bg-border" />}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">{children}</div>
    </div>
  );
}

export function TenderKeyFacts({ tender }: { tender: Tender }) {
  return (
    <div className="grid gap-6 sm:grid-cols-4">
      <Field label="Budget" value={tender.budget} />
      <Field label="Caution" value={tender.caution} />
      <Field label="Échéance" value={tender.deadlineLong} />
      <Field label="Pertinence" value={`${tender.score} %`} />
    </div>
  );
}

export function StickyBar({
  message,
  children,
}: {
  message: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="fixed bottom-0 left-[264px] right-0 z-20 border-t border-border bg-card/95 px-8 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">{message}</div>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </div>
  );
}

export function NextButton({
  to,
  id,
  label,
  disabled,
  onClick,
}: {
  to?: string;
  id?: string;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const cls =
    "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40";
  if (to && id && !disabled) {
    return (
      <Link to={to} params={{ id }} onClick={onClick} className={cls}>
        {label} <ArrowRight className="size-4" />
      </Link>
    );
  }
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={cls}>
      {label} <ArrowRight className="size-4" />
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
    >
      {children}
    </button>
  );
}

export function ModuleTenderList({
  title,
  subtitle,
  to,
  rows,
}: {
  title: string;
  subtitle: string;
  to: string;
  rows?: (t: Tender, s: TenderState) => ReactNode;
}) {
  const { tenders, states } = usePromat();
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid gap-3">
        {tenders.map((t) => {
          const s = states[t.id]!;
          return (
            <Link
              key={t.id}
              to={to}
              params={{ id: t.id }}
              className="card-soft flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-shadow hover:shadow-lift"
            >
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">{t.client}</p>
                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                  {t.reference} · {t.title}
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                {rows ? rows(t, s) : <span className="text-muted-foreground">{t.budget}</span>}
                <StatusDot status={t.status} />
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
