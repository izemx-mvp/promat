import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, Info, Sparkles, TriangleAlert, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { STAGES } from "@/lib/promat/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AmbientBackground({ variant = "app" }: { variant?: "app" | "login" | "finance" }) {
  const glows =
    variant === "login"
      ? [
          { c: "var(--primary)", s: "42rem", t: "-10%", l: "-8%" },
          { c: "var(--info)", s: "36rem", t: "40%", l: "60%" },
        ]
      : variant === "finance"
        ? [
            { c: "var(--info)", s: "34rem", t: "-14%", l: "58%" },
            { c: "var(--primary)", s: "26rem", t: "55%", l: "-10%" },
          ]
        : [
            { c: "var(--primary)", s: "30rem", t: "-16%", l: "-6%" },
            { c: "var(--info)", s: "32rem", t: "30%", l: "70%" },
          ];
  return (
    <div className="promat-bg" aria-hidden="true">
      <div className="promat-grid" />
      {glows.map((g, i) => (
        <div
          key={i}
          className="promat-glow"
          style={{
            background: `radial-gradient(circle, color-mix(in oklab, ${g.c} 55%, transparent), transparent 70%)`,
            width: g.s,
            height: g.s,
            top: g.t,
            left: g.l,
            animationDelay: `${i * 6}s`,
          }}
        />
      ))}
      <svg className="promat-route" viewBox="0 0 1200 800" preserveAspectRatio="none">
        <g fill="none" stroke="color-mix(in oklab, var(--info) 45%, transparent)" strokeWidth="1.2">
          <path d="M-50 620 C 260 520, 420 660, 700 470 S 1050 300, 1260 360" />
          <path d="M-50 300 C 200 240, 380 380, 640 260 S 980 120, 1260 190" />
          <path d="M120 820 C 300 600, 560 540, 820 620 S 1100 700, 1260 560" />
        </g>
      </svg>
    </div>
  );
}

const TONES: Record<string, string> = {
  neutre: "bg-muted text-muted-foreground border-border",
  info: "bg-info-soft text-info border-transparent",
  success: "bg-success-soft text-success border-transparent",
  warning: "bg-warning-soft text-warning-foreground border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  brand: "bg-primary/10 text-primary border-transparent",
  navy: "bg-navy/10 text-navy dark:bg-navy-soft/40 dark:text-navy-foreground border-transparent",
};

export type Tone = keyof typeof TONES;

export function toneForStatus(s: string): Tone {
  const v = s.toLowerCase();
  if (["go", "conforme", "validé", "gagné", "disponible", "actif", "offre reçue", "reçu", "prête à déposer"].some((x) => v === x || v.includes(x)))
    return "success";
  if (["no go", "perdu", "manquant", "non conforme", "critique", "refusée", "expirée", "annulé"].some((x) => v.includes(x)))
    return "danger";
  if (["à vérifier", "à préparer", "relance", "en attente", "à décider", "à valider", "en évaluation", "élevé"].some((x) => v.includes(x)))
    return "warning";
  if (["en cours", "en traitement", "envoyée", "déposé", "analyse", "moyen"].some((x) => v.includes(x))) return "info";
  return "neutre";
}

export function StatusBadge({ children, tone }: { children: ReactNode; tone?: Tone | undefined }) {
  const t = tone ?? toneForStatus(String(children));
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        TONES[t],
      )}
    >
      {children}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const tone: Tone = score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
  const label = score >= 80 ? "Très pertinent" : score >= 60 ? "Pertinent" : "Faible";
  return (
    <div className="flex items-center gap-2">
      <div className="relative grid size-10 shrink-0 place-items-center">
        <svg viewBox="0 0 36 36" className="size-10 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke={tone === "success" ? "var(--success)" : tone === "warning" ? "var(--warning)" : "var(--danger)"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 97.4} 97.4`}
            style={{ transition: "stroke-dasharray 600ms ease" }}
          />
        </svg>
        <span className="num absolute text-[10px] font-semibold">{score}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="rise flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="title-display text-2xl font-bold text-foreground xl:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function useCountUp(value: number, duration = 800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return n;
}

export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  onClick,
  delay = 0,
}: {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  tone?: Tone | undefined;
  onClick?: () => void;
  delay?: number;
}) {
  const n = useCountUp(value);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="rise lift card-surface group flex w-full items-start gap-4 p-4 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className={cn("grid size-10 place-items-center rounded-lg", TONES[tone])}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
        <span className="num mt-1 block text-3xl font-bold text-foreground">{Math.round(n)}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  noPadding,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <section className={cn("card-surface rise", className)}>
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">{title}</h2>
            {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={noPadding ? "" : "p-4"}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-info-soft text-info">
        {icon ?? <Info className="size-5" />}
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function WorkflowTimeline({
  stageIndex,
  onNavigate,
}: {
  stageIndex: number;
  onNavigate?: (i: number) => void;
}) {
  return (
    <div className="card-surface overflow-x-auto p-3">
      <ol className="flex min-w-max items-center gap-1">
        {STAGES.map((s, i) => {
          const done = i < stageIndex;
          const current = i === stageIndex;
          const clickable = (done || current) && !!onNavigate;
          return (
            <li key={s} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onNavigate?.(i)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  current && "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]",
                  done && "bg-success-soft text-success hover:bg-success/15",
                  !done && !current && "text-muted-foreground",
                  clickable && "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full border text-[10px]",
                    current ? "border-primary-foreground/50" : done ? "border-success/40" : "border-border",
                  )}
                >
                  {done ? <Check className="size-3" /> : i + 1}
                </span>
                {s}
              </button>
              {i < STAGES.length - 1 ? <span className="h-px w-4 bg-border" /> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export interface RailTask {
  label: string;
  done: boolean;
}

export function DecisionRailContent({
  tasks,
  echeance,
  risque,
  recommandation,
  ctaLabel,
  onCta,
  onToggleTask,
}: {
  tasks: RailTask[];
  echeance: string;
  risque: string;
  recommandation: string;
  ctaLabel: string;
  onCta: () => void;
  onToggleTask?: (i: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">À faire</p>
        <ul className="mt-2 space-y-1.5">
          {tasks.map((t, i) => (
            <li key={t.label}>
              <button
                type="button"
                onClick={() => onToggleTask?.(i)}
                className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-4 shrink-0 place-items-center rounded border",
                    t.done ? "border-success bg-success text-success-foreground" : "border-border",
                  )}
                >
                  {t.done ? <Check className="size-3" /> : null}
                </span>
                <span className={cn(t.done && "text-muted-foreground line-through")}>{t.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-border bg-surface-2 p-3">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Prochaine échéance</p>
        <p className="num mt-1 text-sm font-semibold">{echeance}</p>
      </div>
      <div className="rounded-lg border border-warning/30 bg-warning-soft p-3">
        <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase text-warning-foreground">
          <TriangleAlert className="size-3.5" /> Risque principal
        </p>
        <p className="mt-1 text-sm text-warning-foreground">{risque}</p>
      </div>
      <div className="rounded-lg border border-info/30 bg-info-soft p-3">
        <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-info uppercase">
          <Sparkles className="size-3.5" /> Recommandation Agent
        </p>
        <p className="mt-1 text-sm text-foreground">{recommandation}</p>
      </div>
      <Button onClick={onCta} className="w-full">
        {ctaLabel}
      </Button>
    </div>
  );
}

export function FilterChips({
  chips,
  onRemove,
  onReset,
}: {
  chips: { key: string; label: string }[];
  onRemove: (key: string) => void;
  onReset: () => void;
}) {
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onRemove(c.key)}
          className="inline-flex items-center gap-1.5 rounded-full border border-info/30 bg-info-soft px-2.5 py-1 text-xs font-medium text-info hover:bg-info/15"
        >
          {c.label}
          <X className="size-3" />
        </button>
      ))}
      <Button variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs">
        Réinitialiser
      </Button>
    </div>
  );
}

export function AgentBanner({
  titre,
  message,
  tone = "info",
  action,
}: {
  titre: string;
  message: string;
  tone?: Tone | undefined;
  action?: ReactNode;
}) {
  return (
    <div className={cn("rise flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4", TONES[tone])}>
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="text-sm font-bold">{titre}</p>
          <p className="text-xs opacity-90">{message}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function LinkButton({ to, children, params }: { to: string; children: ReactNode; params?: unknown }) {
  return (
    <Button asChild variant="outline" size="sm">
      {/* @ts-expect-error routes typés dynamiquement */}
      <Link to={to} params={params}>
        {children}
      </Link>
    </Button>
  );
}

export { TONES };
export function Metric({ label, value, tone }: { label: string; value: string; tone?: Tone | undefined }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={cn("num mt-0.5 text-sm font-bold", tone === "danger" && "text-danger", tone === "success" && "text-success")}>
        {value}
      </p>
    </div>
  );
}

export function Badge2({ children }: { children: ReactNode }) {
  return <Badge variant="secondary">{children}</Badge>;
}
