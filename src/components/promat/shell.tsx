import { Link, useLocation } from "@tanstack/react-router";
import { Bell, Search, Settings, ClipboardList, Calculator } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", num: "01", label: "Agent AO & Analyse", icon: ClipboardList },
  { to: "/chiffrage", num: "02", label: "Agent Chiffrage", icon: Calculator },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-[248px] shrink-0 flex-col bg-navy px-4 py-6 text-navy-foreground">
        <div className="px-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">
              P
            </span>
            <div>
              <p className="font-display text-base font-bold tracking-tight">PROMAT</p>
              <p className="text-[11px] text-navy-muted">Maroc · Tender Workspace</p>
            </div>
          </div>
        </div>

        <nav className="mt-10 space-y-1">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-3 transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-navy-foreground/80 hover:bg-white/5",
                )}
              >
                <item.icon className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span
                    className={cn(
                      "block text-[11px] tabular-nums",
                      active ? "text-primary-foreground/70" : "text-navy-muted",
                    )}
                  >
                    {item.num}
                  </span>
                  <span className="block text-sm font-medium leading-tight">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-navy-foreground/80 transition-colors hover:bg-white/5">
            <Settings className="size-4" /> Paramètres
          </button>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
              HB
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-medium">Houda Bennani</span>
              <span className="block text-[11px] text-navy-muted">Sourcing &amp; Chiffrage</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Rechercher un appel d'offres, un article, un fournisseur…"
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted">
              <Bell className="size-4" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary" />
            </button>
            <div className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-1.5">
              <span className="flex size-7 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-navy-foreground">
                HB
              </span>
              <span className="text-sm font-medium">Houda Bennani</span>
            </div>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

export function TenderList({
  filters,
  activeFilter,
  onFilter,
  items,
  selectedId,
  onSelect,
  title,
}: {
  filters: string[];
  activeFilter: string;
  onFilter: (f: string) => void;
  items: { id: string; client: string; reference: string; title: string; deadline: string; status: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  title: string;
}) {
  return (
    <div className="flex h-full w-[330px] shrink-0 flex-col border-r border-border bg-card">
      <div className="space-y-3 border-b border-border p-5">
        <h2 className="section-title">{title}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Rechercher…"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => onFilter(f)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                activeFilter === f
                  ? "bg-navy text-navy-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {items.length === 0 && (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            Aucun dossier dans ce filtre.
          </p>
        )}
        {items.map((t) => {
          const active = t.id === selectedId;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={cn(
                "w-full rounded-xl border p-3.5 text-left transition-all",
                active
                  ? "border-primary/40 bg-primary/[0.04] shadow-soft"
                  : "border-border hover:border-ring/40 hover:bg-muted/60",
              )}
            >
              <p className="text-[15px] font-semibold leading-tight">{t.client}</p>
              <p className="mt-1 text-xs tabular-nums text-muted-foreground">{t.reference}</p>
              <p className="mt-2 truncate text-sm text-foreground/80">{t.title}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Échéance : {t.deadline}</span>
                <StatusDot status={t.status} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StatusDot({ status }: { status: string }) {
  const tone =
    status === "Décision requise"
      ? "bg-warning-soft text-warning"
      : status === "Prêt pour chiffrage" || status === "Offre validée"
        ? "bg-success-soft text-success"
        : status === "En consultation" || status === "Chiffrage en cours"
          ? "bg-ai-soft text-ai"
          : "bg-muted text-muted-foreground";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tone)}>{status}</span>
  );
}
