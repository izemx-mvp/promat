import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, Check, ChevronDown, Command, LogOut, Moon, Search, Settings, Sun, User } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { workflowDone, workflowSteps, type WorkflowStepKey } from "@/lib/promat/progress";
import { usePromat } from "@/lib/promat/store";
import { useReferentiel } from "@/lib/promat/referentiel";

import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandPalette, useCommandPaletteHotkeys } from "@/components/promat/command-palette";

type Item = { to: string; label: string; step?: WorkflowStepKey };

const groups: { title: string; subtitle?: string; items: Item[] }[] = [
  {
    title: "Agent AO & Analyse",
    items: [
      { to: "/", label: "Recherches AO", step: "recherche" },
      { to: "/analyses", label: "Analyses", step: "analyse" },
      { to: "/articles", label: "Articles & besoins", step: "articles" },
      { to: "/consultations", label: "Consultations fournisseurs", step: "consultation" },
    ],
  },
  {
    title: "Agent Chiffrage",
    items: [
      { to: "/comparatifs", label: "Comparatifs fournisseurs", step: "comparatif" },
      { to: "/chiffrages", label: "Chiffrages", step: "chiffrage" },
      { to: "/offres", label: "Offres finales", step: "offre" },
    ],
  },
  {
    title: "Référentiels",
    subtitle: "Référentiels utilisés par les deux agents",
    items: [
      { to: "/referentiels/fournisseurs", label: "Fournisseurs" },
      { to: "/referentiels/articles", label: "Articles" },
      { to: "/referentiels/documents", label: "Documents" },
    ],
  },
  {
    title: "Administration",
    subtitle: "Configuration et gouvernance",
    items: [
      { to: "/admin/agents", label: "Configuration des agents" },
      { to: "/admin/utilisateurs", label: "Gestion utilisateurs" },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { states } = usePromat();
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useCommandPaletteHotkeys(setPaletteOpen);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const tenderId = pathname.match(/^\/(?:analyses|articles|consultations|comparatifs|chiffrages|offres)\/([^/]+)/)?.[1];
  const tenderState = tenderId ? states[tenderId] : undefined;
  const activeStep = useMemo(
    () => workflowSteps.find((step) => (step.root === "/" ? pathname === "/" : pathname.startsWith(step.root)))?.key,
    [pathname],
  );
  const activeStepNumber = workflowSteps.find((step) => step.key === activeStep)?.number;
  const displayUser = user ?? { name: "Houda Bennani", email: "houda@promat.ma", role: "Responsable Commercial", initials: "HB" };

  return (
    <div className="relative flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[288px] flex-col overflow-y-auto bg-navy px-4 py-5 text-navy-foreground lg:flex"
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Vertical accent gradient on right edge */}
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent" />

        <div className="px-3 pb-7 pt-6">
          <Link
            to="/"
            aria-label="PROMAT Maroc"
            className="inline-block origin-left transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 rounded-xl"
          >
            <span className="block rounded-xl bg-white px-3 py-2.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.12)]">
              <img
                src="/promat-logo.png"
                alt="PROMAT Maroc"
                width={910}
                height={533}
                className="block w-[112px] object-contain"
                style={{ height: "auto", aspectRatio: "910 / 533" }}
              />
            </span>
            <span className="mt-2.5 block text-[10px] uppercase tracking-[0.16em] text-navy-muted">
              Maroc · Tender OS
            </span>
          </Link>
        </div>
        <span aria-hidden className="mx-3 block h-px bg-white/10" />


        <nav className="mt-7 space-y-5">
          {groups.map((g, groupIndex) => (
            <div key={g.title}>
              {groupIndex === 1 && (
                <div className="mb-5 flex items-center gap-2 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-navy-muted">
                  <span className="h-px flex-1 bg-navy-foreground/15" />
                  Passage au chiffrage
                  <span className="h-px flex-1 bg-navy-foreground/15" />
                </div>
              )}
              <p className="px-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-navy-muted">
                {g.title}
              </p>
              {g.subtitle && (
                <p className="mt-1 px-3 text-[10.5px] leading-snug text-navy-muted/80">{g.subtitle}</p>
              )}
              <div className="relative mt-2">
                {/* Rail line for workflow groups */}
                {g.items[0]?.step && (
                  <span aria-hidden className="pointer-events-none absolute left-[24px] top-4 bottom-4 w-px bg-navy-foreground/12" />
                )}
                {g.items.map((item) => {
                  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  const processStep = workflowSteps.find((step) => step.key === item.step);
                  const stepNumber = processStep?.number;
                  const complete = Boolean(item.step && tenderState && workflowDone(tenderState, item.step));
                  const future = Boolean(stepNumber && activeStepNumber && !active && stepNumber > activeStepNumber);
                  const destination = tenderId && item.step && item.step !== "recherche" ? `${item.to}/${tenderId}` : item.to;
                  return (
                    <div key={item.to} className="relative">
                      <Link
                        to={destination}
                        className={cn(
                          "group relative flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all",
                          active
                            ? "bg-white/[0.08] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                            : future
                              ? "text-navy-foreground/50 hover:bg-white/[0.04]"
                              : "text-navy-foreground/82 hover:bg-white/[0.04] hover:text-white",
                        )}
                      >
                        {active && (
                          <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary shadow-[0_0_18px_rgba(229,13,45,0.6)]" />
                        )}
                        {item.step && stepNumber ? (
                          <span className="relative z-10 flex w-8 shrink-0 items-center justify-center">
                            {complete ? (
                              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_12px_rgba(229,13,45,0.55)]">
                                <Check className="size-3" strokeWidth={3.5} />
                              </span>
                            ) : active ? (
                              <span className="flex size-5 items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary/70 animate-pulse-halo">
                                <span className="size-1.5 rounded-full bg-primary" />
                              </span>
                            ) : (
                              <span className="size-3.5 rounded-full border border-white/25" />
                            )}
                          </span>
                        ) : (
                          <span className="w-8 shrink-0" />
                        )}
                        {item.step && stepNumber && (
                          <span className={cn("mono text-[10px] tabular-nums opacity-70", active && "opacity-100 text-primary")}>
                            {String(stepNumber).padStart(2, "0")}
                          </span>
                        )}
                        <span className="leading-tight">{item.label}</span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-3 text-left transition-all hover:bg-white/[0.08] hover:shadow-[0_10px_30px_-15px_rgba(229,13,45,0.6)]">
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-navy text-[12px] font-semibold text-white ring-2 ring-primary/70 ring-offset-2 ring-offset-navy">
                  {displayUser.initials}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[13.5px] font-semibold">{displayUser.name}</span>
                  <span className="mt-0.5 inline-block truncate rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-medium text-navy-muted">
                    {displayUser.role}
                  </span>
                </span>
                <ChevronDown className="ml-auto size-4 text-navy-muted transition-transform group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{displayUser.name}</span>
                <span className="mono text-[11px] font-normal text-muted-foreground">{displayUser.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/profil" })}>
                <User className="mr-2 size-4" /> Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/preferences" })}>
                <Settings className="mr-2 size-4" /> Préférences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 size-4" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-navy-foreground/60 transition-all hover:bg-white/[0.05] hover:text-primary [&:hover_svg]:translate-x-0.5"
          >
            <LogOut className="size-4 transition-transform" /> Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-[288px]">
        <header
          className={cn(
            "sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 px-6 lg:px-8 transition-all",
            scrolled ? "border-b border-border" : "border-b border-transparent",
          )}
          style={{ background: "var(--glass-strong)", backdropFilter: "blur(20px) saturate(160%)" }}
        >
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="group relative flex h-10 w-full max-w-md items-center gap-2 rounded-xl border border-border bg-background/60 pl-3 pr-2 text-left text-sm text-muted-foreground outline-none transition hover:border-primary/40 hover:text-foreground focus:border-primary focus:ring-4 focus:ring-primary/15"
          >
            <Search className="size-4 shrink-0" />
            <span className="flex-1 truncate">Rechercher un module, un dossier, une action…</span>
            <span className="flex items-center gap-1 rounded-md border border-border bg-muted/60 px-1.5 py-0.5 mono text-[10px]">
              <Command className="size-2.5" /> K
            </span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Basculer le thème"
              className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-background/60 text-muted-foreground transition-all hover:text-foreground hover:border-primary/40 hover:shadow-[0_0_24px_-6px_rgba(229,13,45,0.5)]"
            >
              <Sun className={cn("absolute size-4 transition-all", theme === "dark" ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100")} />
              <Moon className={cn("absolute size-4 transition-all", theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0")} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label={`Notifications${unread ? ` (${unread} non lues)` : ""}`}
                  className="group relative flex size-10 items-center justify-center rounded-xl border border-border bg-background/60 text-muted-foreground transition-all hover:text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                >
                  <Bell className="size-4 transition-transform group-hover:rotate-12" />
                  {unread > 0 && (
                    <span className="absolute right-2.5 top-2.5 flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                      <span className="relative inline-flex size-2 rounded-full bg-primary" />
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="label-xs">Notifications</span>
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    Tout marquer comme lu
                  </button>
                </div>
                <DropdownMenuSeparator className="my-0" />
                {notifications.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">Aucun résultat.</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto py-1">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          markRead(n.id);
                          navigate({ to: n.to });
                        }}
                        className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:bg-muted"
                      >
                        <span
                          className={cn(
                            "mt-1.5 size-1.5 shrink-0 rounded-full",
                            n.read ? "bg-border" : "bg-primary",
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className={cn("block truncate text-[13px]", n.read ? "font-medium text-muted-foreground" : "font-semibold")}>
                            {n.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{n.detail}</span>
                          <span className="mt-1 block mono text-[10px] text-muted-foreground/70">{n.time}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-xl border border-border bg-background/60 px-2.5 py-1.5 transition-all hover:border-primary/40">
                  <span className="flex size-7 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-navy-foreground ring-2 ring-primary/60 ring-offset-1 ring-offset-background">
                    {displayUser.initials}
                  </span>
                  <span className="hidden text-sm font-medium sm:block">{displayUser.name}</span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{displayUser.name}</span>
                  <span className="mono text-[11px] font-normal text-muted-foreground">{displayUser.email}</span>
                  <span className="mt-1 inline-block w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {displayUser.role}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/profil" })}>
                  <User className="mr-2 size-4" /> Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/preferences" })}>
                  <Settings className="mr-2 size-4" /> Préférences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 size-4" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="eyebrow mb-3 flex items-center gap-2">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            {eyebrow}
          </p>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Décision requise": "bg-primary/12 text-primary ring-primary/25",
    "Prêt pour chiffrage": "bg-[oklch(0.55_0.16_290/0.14)] text-[color:oklch(0.55_0.16_290)] ring-[oklch(0.55_0.16_290/0.25)]",
    "Offre validée": "bg-success-soft text-success ring-success/25",
    "En consultation": "bg-[rgba(56,189,248,0.14)] text-[color:#0284C7] ring-[rgba(56,189,248,0.25)]",
    "Chiffrage en cours": "bg-warning-soft text-warning ring-warning/25",
    "À analyser": "bg-warning-soft text-warning ring-warning/25",
  };
  const tone = map[status] ?? "bg-muted text-muted-foreground ring-border";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] ring-1", tone)}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
