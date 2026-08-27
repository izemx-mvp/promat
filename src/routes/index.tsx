import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AmbientBackground } from "@/components/promat/ui";
import { LOGO_URL } from "@/lib/promat/data";
import { usePromat } from "@/lib/promat/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Connexion — PROMAT Centre de pilotage achats" },
      {
        name: "description",
        content:
          "Accès sécurisé au centre de pilotage PROMAT : appels d'offres, sourcing fournisseurs, chiffrage et offres clients.",
      },
      { property: "og:title", content: "Connexion — PROMAT Centre de pilotage achats" },
      {
        property: "og:description",
        content: "Accès sécurisé au centre de pilotage PROMAT Maroc.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const promat = usePromat();
  const navigate = useNavigate();
  const [email, setEmail] = useState("yassine.elmansouri@promat.ma");
  const [password, setPassword] = useState("Promat2026!");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [entering, setEntering] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (promat.ready && promat.session) navigate({ to: "/accueil" });
  }, [promat.ready, promat.session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "L'adresse e-mail est obligatoire.";
    else if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) next.email = "Format d'adresse e-mail invalide.";
    if (!password.trim()) next.password = "Le mot de passe est obligatoire.";
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("Veuillez corriger les champs signalés.");
      return;
    }
    setLoading(true);
    try {
      await promat.login(email, password);
      setEntering(true);
      toast.success("Connexion réussie — bienvenue sur le centre de pilotage.");
      setTimeout(() => navigate({ to: "/accueil" }), 1300);
    } catch {
      toast.error("Identifiants invalides.");
      setLoading(false);
    }
  };

  if (entering) {
    return (
      <div className="relative grid min-h-screen place-items-center bg-navy">
        <AmbientBackground variant="login" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <img src={LOGO_URL} alt="PROMAT" className="rise h-16 object-contain drop-shadow-xl" />
          <div className="h-1 w-56 overflow-hidden rounded-full bg-navy-soft/60">
            <div className="h-full w-1/3 animate-[promat-flow_1.1s_linear_infinite] rounded-full bg-primary" style={{ animation: "promat-load 1.2s ease-in-out forwards" }} />
          </div>
          <p className="text-sm text-navy-foreground/80">Initialisation du centre de pilotage…</p>
        </div>
        <style>{`@keyframes promat-load { from { width: 8% } to { width: 100% } }`}</style>
      </div>
    );
  }

  return (
    <div className="relative grid min-h-screen place-items-center bg-navy px-4 py-10">
      <AmbientBackground variant="login" />
      <div className="relative z-10 grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="hidden lg:block">
          <img src={LOGO_URL} alt="PROMAT" className="h-14 object-contain" />
          <h1 className="title-display mt-8 text-4xl leading-tight font-bold text-navy-foreground">
            Centre de pilotage
            <span className="block text-primary">achats & appels d'offres</span>
          </h1>
          <p className="mt-4 max-w-md text-sm text-navy-foreground/70">
            De la détection de l'opportunité au dépôt de l'offre : analyse des dossiers, sourcing fournisseurs,
            comparatif des offres, prix de revient réel et marge PROMAT — dans un seul environnement.
          </p>
          <ul className="mt-8 grid gap-3 text-sm text-navy-foreground/80">
            {[
              "Agent Recherche AO — détection, analyse, éligibilité, sourcing",
              "Agent Chiffrage — comparatif, douane, prix de revient, marge",
              "Traçabilité complète des décisions PROMAT",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="card-surface rise w-full p-6 sm:p-8">
          <div className="lg:hidden">
            <img src={LOGO_URL} alt="PROMAT" className="mx-auto h-11 object-contain" />
          </div>
          <div className="mt-4 flex items-center justify-between lg:mt-0">
            <h2 className="text-lg font-bold">Connexion</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-info-soft px-2.5 py-1 text-[11px] font-semibold text-info">
              <span className="size-1.5 animate-pulse rounded-full bg-info" /> Mode démonstration
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Espace réservé aux collaborateurs PROMAT Maroc.</p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">
                Adresse e-mail <span className="text-primary">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  autoComplete="username"
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email ? <p className="text-xs font-medium text-danger">{errors.email}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">
                Mot de passe <span className="text-primary">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-9"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-accent"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password ? <p className="text-xs font-medium text-danger">{errors.password}</p> : null}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} /> Se souvenir de moi
              </label>
              <button type="button" className="text-sm font-medium text-info hover:underline" onClick={() => toast.info("Contactez l'administrateur PROMAT pour réinitialiser votre mot de passe.")}>
                Mot de passe oublié ?
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Connexion en cours…
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <p className="mt-5 rounded-md border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
            Identifiants de démonstration pré-remplis : <span className="num">yassine.elmansouri@promat.ma</span> /{" "}
            <span className="num">Promat2026!</span>
          </p>
        </div>
      </div>
    </div>
  );
}
