import { useNavigate } from "@tanstack/react-router";
import {
  Boxes,
  Calculator,
  FileText,
  GitCompare,
  Handshake,
  LayoutDashboard,
  Package,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Users,
} from "lucide-react";
import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useTheme } from "@/lib/theme";

type PaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const workflow = [
  { to: "/", label: "Recherches AO", icon: Search, hint: "01" },
  { to: "/analyses", label: "Analyses", icon: Sparkles, hint: "02" },
  { to: "/articles", label: "Articles & besoins", icon: Boxes, hint: "03" },
  { to: "/consultations", label: "Consultations fournisseurs", icon: Handshake, hint: "04" },
  { to: "/comparatifs", label: "Comparatifs fournisseurs", icon: GitCompare, hint: "05" },
  { to: "/chiffrages", label: "Chiffrages", icon: Calculator, hint: "06" },
  { to: "/offres", label: "Offres finales", icon: Send, hint: "07" },
] as const;

const referentiels = [
  { to: "/referentiels/fournisseurs", label: "Fournisseurs", icon: Users },
  { to: "/referentiels/articles", label: "Articles", icon: Package },
  { to: "/referentiels/documents", label: "Documents", icon: FileText },
] as const;

const admin = [
  { to: "/admin/agents", label: "Configuration des agents", icon: ShieldCheck },
  { to: "/admin/utilisateurs", label: "Gestion utilisateurs", icon: Users },
] as const;

const account = [
  { to: "/profil", label: "Profil", icon: User },
  { to: "/preferences", label: "Préférences", icon: Settings },
] as const;

const dossier = [
  { to: "/analyses/onee", label: "Dossier ONEE — Analyse", icon: Sparkles },
  { to: "/consultations/onee", label: "Dossier ONEE — Consultations", icon: Handshake },
  { to: "/chiffrages/onee", label: "Dossier ONEE — Chiffrage", icon: Calculator },
  { to: "/offres/onee", label: "Dossier ONEE — Offre finale", icon: Send },
] as const;

export function CommandPalette({ open, onOpenChange }: PaletteProps) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Naviguer, ouvrir un dossier, changer de thème…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Flux de travail">
          {workflow.map((item) => (
            <CommandItem key={item.to} value={`workflow ${item.label}`} onSelect={() => go(item.to)}>
              <item.icon className="size-4" />
              <span>{item.label}</span>
              <CommandShortcut className="mono text-[10px]">{item.hint}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Dossier ONEE">
          {dossier.map((item) => (
            <CommandItem key={item.to} value={`dossier ${item.label}`} onSelect={() => go(item.to)}>
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Référentiels">
          {referentiels.map((item) => (
            <CommandItem key={item.to} value={`referentiel ${item.label}`} onSelect={() => go(item.to)}>
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Administration">
          {admin.map((item) => (
            <CommandItem key={item.to} value={`admin ${item.label}`} onSelect={() => go(item.to)}>
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Compte">
          {account.map((item) => (
            <CommandItem key={item.to} value={`compte ${item.label}`} onSelect={() => go(item.to)}>
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions rapides">
          <CommandItem
            value="theme mode sombre clair"
            onSelect={() => {
              toggle();
            }}
          >
            <Sun className="size-4" />
            <span>Basculer le thème ({theme === "dark" ? "clair" : "sombre"})</span>
            <CommandShortcut>⇧T</CommandShortcut>
          </CommandItem>
          <CommandItem value="tableau bord accueil" onSelect={() => go("/")}>
            <LayoutDashboard className="size-4" />
            <span>Retour à l'accueil</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPaletteHotkeys(setOpen: (open: boolean) => void) {
  const { toggle } = useTheme();
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.shiftKey && (e.key === "T" || e.key === "t") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [setOpen, toggle]);
}
