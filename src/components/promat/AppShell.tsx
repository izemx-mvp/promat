import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CheckCheck,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileStack,
  FileText,
  Gauge,
  History,
  LayoutGrid,
  ListChecks,
  LogOut,
  Moon,
  Package,
  Plus,
  Radar,
  Scale,
  Search,
  Send,
  Settings,
  Sun,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AmbientBackground } from "./ui";
import { LOGO_URL } from "@/lib/promat/data";
import { usePromat } from "@/lib/promat/store";
import { fmtDateTime } from "@/lib/promat/calc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV: { section: string; items: { to: string; label: string; icon: ReactNode }[] }[] = [
  {
    section: "Pilotage",
    items: [
      { to: "/accueil", label: "Accueil", icon: <Gauge className="size-4" /> },
      { to: "/appels-offres", label: "Appels d'offres", icon: <LayoutGrid className="size-4" /> },
    ],
  },
  {
    section: "Agent Recherche AO",
    items: [
      { to: "/recherches", label: "Recherches AO", icon: <Radar className="size-4" /> },
      { to: "/analyses", label: "Analyses", icon: <ListChecks className="size-4" /> },
      { to: "/articles-besoins", label: "Articles & besoins", icon: <Package className="size-4" /> },
      { to: "/consultations", label: "Consultations fournisseurs", icon: <Send className="size-4" /> },
    ],
  },
  {
    section: "Agent Chiffrage",
    items: [
      { to: "/chiffrages", label: "Chiffrages", icon: <Wallet className="size-4" /> },
      { to: "/comparatifs", label: "Comparatifs fournisseurs", icon: <Scale className="size-4" /> },
      { to: "/offres-finales", label: "Offres finales", icon: <FileStack className="size-4" /> },
    ],
  },
  {
    section: "Référentiels",
    items: [
      { to: "/fournisseurs", label: "Fournisseurs", icon: <Building2 className="size-4" /> },
      { to: "/articles", label: "Articles", icon: <ClipboardList className="size-4" /> },
      { to: "/documents", label: "Documents", icon: <FileText className="size-4" /> },
    ],
  },
  {
    section: "Administration",
    items: [
      { to: "/historique", label: "Historique", icon: <History className="size-4" /> },
      { to: "/parametres", label: "Paramètres", icon: <Settings className="size-4" /> },
    ],
  },
];

export function AppShell({ children, variant = "app" }: { children: ReactNode; variant?: "app" | "finance" }) {
  const promat = usePromat();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (promat.ready && !promat.session) navigate({ to: "/" });
  }, [promat.ready, promat.session, navigate]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const unread = promat.notifications.filter((n) => !n.lu).length;

  const results = useMemo(
    () => ({
      tenders: promat.tenders,
      suppliers: promat.suppliers,
      articles: promat.articles,
      documents: promat.documents,
    }),
    [promat.tenders, promat.suppliers, promat.articles, promat.documents],
  );

  if (!promat.ready || !promat.session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <img src={LOGO_URL} alt="PROMAT" className="h-12 animate-pulse" />
      </div>
    );
  }

  const go = (to: string) => {
    setSearchOpen(false);
    navigate({ to });
  };

  return (
    <div className="relative min-h-screen">
      <AmbientBackground variant={variant} />
      <div className="relative z-10 flex min-h-screen">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 lg:flex",
            collapsed ? "w-[76px]" : "w-[264px]",
          )}
        >
          <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-4">
            <Link to="/accueil" className="flex min-w-0 items-center">
              <img src={LOGO_URL} alt="PROMAT" className={cn("object-contain", collapsed ? "h-7" : "h-9")} />
            </Link>
            {!collapsed ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Réduire le menu"
                onClick={() => setCollapsed(true)}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <ChevronsLeft className="size-4" />
              </Button>
            ) : null}
          </div>
          {collapsed ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Déployer le menu"
              onClick={() => setCollapsed(false)}
              className="mx-auto mt-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronsRight className="size-4" />
            </Button>
          ) : null}
          <ScrollArea className="flex-1">
            <nav className="space-y-5 px-3 py-4">
              {NAV.map((group) => (
                <div key={group.section}>
                  {!collapsed ? (
                    <p className="px-2 pb-1.5 text-[10px] font-bold tracking-[0.12em] text-sidebar-foreground/50 uppercase">
                      {group.section}
                    </p>
                  ) : (
                    <div className="mx-2 mb-2 h-px bg-sidebar-border" />
                  )}
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = pathname === item.to || pathname.startsWith(item.to + "/");
                      const link = (
                        <Link
                          to={item.to}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-soft)]"
                              : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            collapsed && "justify-center px-0",
                          )}
                        >
                          {item.icon}
                          {!collapsed ? <span className="truncate">{item.label}</span> : null}
                        </Link>
                      );
                      return (
                        <li key={item.to}>
                          {collapsed ? (
                            <Tooltip>
                              <TooltipTrigger asChild>{link}</TooltipTrigger>
                              <TooltipContent side="right">{item.label}</TooltipContent>
                            </Tooltip>
                          ) : (
                            link
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </ScrollArea>
          <div className="border-t border-sidebar-border p-3">
            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
                YM
              </span>
              {!collapsed ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{promat.session.nom}</p>
                  <p className="truncate text-xs text-sidebar-foreground/60">{promat.session.role}</p>
                </div>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                promat.logout();
                toast.success("Déconnexion réussie");
                navigate({ to: "/" });
              }}
              className={cn("mt-2 w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent", collapsed && "justify-center px-0")}
            >
              <LogOut className="size-4" />
              {!collapsed ? "Déconnexion" : null}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md xl:px-6">
            <Link to="/accueil" className="lg:hidden">
              <img src={LOGO_URL} alt="PROMAT" className="h-7" />
            </Link>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-9 max-w-xl flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-ring"
            >
              <Search className="size-4" />
              <span className="truncate">Rechercher un AO, un client, une référence, un fournisseur...</span>
              <kbd className="num ml-auto hidden rounded border border-border px-1.5 text-[10px] md:block">Ctrl K</kbd>
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <Button size="sm" onClick={() => navigate({ to: "/appels-offres", search: { nouveau: "1" } as never })} className="hidden md:inline-flex">
                <Plus className="size-4" /> Ajouter un AO
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate({ to: "/consultations" })} className="hidden xl:inline-flex">
                <Send className="size-4" /> Nouvelle consultation
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Tâches" onClick={() => navigate({ to: "/accueil" })}>
                    <ListChecks className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tâches du jour</TooltipContent>
              </Tooltip>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                    <Bell className="size-4" />
                    {unread ? (
                      <span className="num absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                        {unread}
                      </span>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <p className="text-sm font-bold">Notifications</p>
                    <Button variant="ghost" size="sm" onClick={promat.markAllRead} className="h-7 text-xs">
                      <CheckCheck className="size-3.5" /> Tout marquer comme lu
                    </Button>
                  </div>
                  <ScrollArea className="max-h-[60vh]">
                    <ul className="divide-y divide-border">
                      {promat.notifications.map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => {
                              promat.markRead(n.id);
                              if (n.lien) navigate({ to: n.lien });
                            }}
                            className="w-full px-3 py-2.5 text-left hover:bg-accent"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "size-2 shrink-0 rounded-full",
                                  n.priorite === "Haute" ? "bg-primary" : n.priorite === "Moyenne" ? "bg-warning" : "bg-info",
                                  n.lu && "opacity-30",
                                )}
                              />
                              <p className={cn("text-sm", n.lu ? "font-medium text-muted-foreground" : "font-bold")}>{n.titre}</p>
                            </div>
                            <p className="mt-0.5 pl-4 text-xs text-muted-foreground">{n.message}</p>
                            <p className="num mt-0.5 pl-4 text-[10px] text-muted-foreground">{fmtDateTime(n.date)}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Changer de thème"
                    onClick={() => promat.setTheme(promat.theme === "dark" ? "light" : "dark")}
                  >
                    {promat.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mode {promat.theme === "dark" ? "clair" : "sombre"}</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Profil">
                    <Users className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {promat.session.nom}
                    <span className="block text-xs font-normal text-muted-foreground">{promat.session.role}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/parametres" })}>Paramètres</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/historique" })}>Historique</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      promat.logout();
                      navigate({ to: "/" });
                    }}
                  >
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 xl:px-6">{children}</main>
        </div>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Rechercher un AO, un client, une référence, un fournisseur..." />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          <CommandGroup heading="Appels d'offres">
            {results.tenders.slice(0, 8).map((t) => (
              <CommandItem key={t.id} value={`${t.ref} ${t.client} ${t.objet}`} onSelect={() => go(`/appels-offres/${t.id}`)}>
                <LayoutGrid className="size-4" /> {t.ref} — {t.client}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Fournisseurs">
            {results.suppliers.slice(0, 8).map((s) => (
              <CommandItem key={s.id} value={`${s.nom} ${s.pays} ${s.marques.join(" ")}`} onSelect={() => go(`/fournisseurs/${s.id}`)}>
                <Building2 className="size-4" /> {s.nom}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Articles">
            {results.articles.slice(0, 8).map((a) => (
              <CommandItem key={a.id} value={`${a.designation} ${a.refClient} ${a.refInterne}`} onSelect={() => go("/articles")}>
                <Package className="size-4" /> {a.designation}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Documents">
            {results.documents.slice(0, 8).map((d) => (
              <CommandItem key={d.id} value={`${d.nom} ${d.source}`} onSelect={() => go("/documents")}>
                <FileText className="size-4" /> {d.nom}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
