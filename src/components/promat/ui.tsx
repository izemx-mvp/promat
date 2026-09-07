import { Check, Circle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "ok" | "warn" | "ai" | "primary";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    ok: "bg-success-soft text-success",
    warn: "bg-warning-soft text-warning",
    ai: "bg-ai-soft text-ai",
    primary: "bg-primary/10 text-primary",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="label-xs">{label}</p>
      <p className="mt-1 text-[15px] font-medium text-foreground">{value}</p>
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card-soft p-6", className)}>
      {(title || action) && (
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="section-title">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export type Step = { id: number; label: string };

export function Stepper({
  steps,
  current,
  completed,
  unlocked,
  onSelect,
}: {
  steps: Step[];
  current: number;
  completed: number[];
  unlocked: number[];
  onSelect: (id: number) => void;
}) {
  return (
    <nav className="sticky top-0 z-20 -mx-8 border-b border-border bg-background/85 px-8 py-3 backdrop-blur">
      <ol className="flex flex-wrap items-center gap-1">
        {steps.map((s, i) => {
          const done = completed.includes(s.id);
          const active = current === s.id;
          const open = unlocked.includes(s.id);
          return (
            <li key={s.id} className="flex items-center">
              <button
                type="button"
                disabled={!open}
                onClick={() => onSelect(s.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : open
                      ? "text-foreground hover:bg-muted"
                      : "cursor-not-allowed text-muted-foreground/60",
                )}
              >
                {done ? (
                  <Check className="size-4 text-success" strokeWidth={3} />
                ) : (
                  <Circle
                    className={cn("size-4", active ? "fill-primary text-primary" : "text-border")}
                  />
                )}
                <span className="tabular-nums text-xs text-muted-foreground">
                  {String(s.id).padStart(2, "0")}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function EmptyWorkspace({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-10 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-ai-soft text-ai">
        <Circle className="size-6" />
      </div>
      <h2 className="section-title">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
