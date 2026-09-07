import { Link, useLocation } from "@tanstack/react-router";
import { Bell, LogOut, Search } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string };

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Agent AO & Analyse",
    items: [
      { to: "/", label: "Recherches AO" },
      { to: "/analyses", label: "Analyses" },
      { to: "/articles", label: "Articles & besoins" },
      { to: "/consultations", label: "Consultations fournisseurs" },
    ],
  },
  {
    title: "Agent Chiffrage",
    items: [
      { to: "/chiffrages", label: "Chiffrages" },
      { to: "/comparatifs", label: "Comparatifs fournisseurs" },
      { to: "/offres", label: "Offres finales" },
    ],
  },
  {
    title: "Référentiels",
    items: [
      { to: "/referentiels/fournisseurs", label: "Fournisseurs" },
      { to: "/referentiels/articles", label: "Articles" },
      { to: "/referentiels/documents", label: "Documents" },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: "/admin/agents", label: "Configuration des agents" },
      { to: "/admin/utilisateurs", label: "Gestion utilisateurs" },
      { to: "/admin/historique", label: "Historique" },
      { to: "/admin/parametres", label: "Paramètres généraux" },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[264px] flex-col overflow-y-auto bg-navy px-4 py-6 text-navy-foreground">
        <Link to="/" className="flex items-center gap-2.5 px-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
            P
          </span>
          <span>
            <span className="block font-display text-base font-bold tracking-tight">PROMAT</span>
            <span className="block text-[11px] text-navy-muted">Maroc · Tender OS</span>
          </span>
        </Link>

        <nav className="mt-8 space-y-6">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="px-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-muted">
                {g.title}
              </p>
              <div className="mt-2 space-y-0.5">
                {g.items.map((item) => {
                  const active =
                    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-[13.5px] transition-colors",
                        active
                          ? "bg-primary font-medium text-primary-foreground"
                          : "text-navy-foreground/80 hover:bg-white/5",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
              HB
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-medium">Houda Bennani</span>
              <span className="block text-[11px] text-navy-muted">Responsable Commercial</span>
            </span>
          </div>
          <button className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-navy-foreground/70 transition-colors hover:bg-white/5">
            <LogOut className="size-4" /> Déconnexion
          </button>
        </div>
      </aside>

      <div className="ml-[264px] flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card/95 px-8 backdrop-blur">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Rechercher un dossier, un article, un fournisseur…"
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
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
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
