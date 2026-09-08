import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuroraBackground } from "@/components/promat/aurora";
import { demoUsers, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — PROMAT Maroc" },
      { name: "description", content: "Accédez à votre espace de travail PROMAT Tender OS." },
      { property: "og:title", content: "Connexion — PROMAT Maroc" },
      { property: "og:description", content: "Accédez à votre espace de travail PROMAT Tender OS." },
    ],
  }),
  component: LoginPage,
});

// DEMO CREDENTIALS — remove when real auth is wired in.
const DEMO_PASSWORD = "promat2026";

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("houda@promat.ma");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState("houda@promat.ma");
  const [busy, setBusy] = useState<"idle" | "loading" | "done">("idle");

  function submit(e: FormEvent) {
    e.preventDefault();
    setBusy("loading");
    setTimeout(() => {
      signIn(email);
      setBusy("done");
      setTimeout(() => navigate({ to: "/" }), 350);
    }, 700);
  }

  function chooseChip(u: typeof demoUsers[number]) {
    setEmail(u.email);
    setPassword(DEMO_PASSWORD);
    setSelected(u.email);
  }

  return (
    <div className="relative flex min-h-screen">
      <AuroraBackground />

      {/* Left visual */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-3/5 lg:flex-col lg:justify-between lg:p-12">
        <div className="relative z-10">
          <img
            src="/promat-logo.png"
            alt="PROMAT Maroc"
            width={910}
            height={533}
            className="block w-[160px] object-contain"
            style={{ height: "auto", aspectRatio: "910 / 533" }}
          />
          <p className="mt-2.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Maroc · Tender OS</p>
        </div>


        <div className="relative z-10 max-w-xl">
          <p className="eyebrow mb-4">Deux agents · Un flux de travail</p>
          <h1 className="page-title" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
            Du signal AO à l'offre validée, sans ruptures.
          </h1>
          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            L'Agent AO détecte, qualifie, analyse. L'Agent Chiffrage compare, calcule, propose.
            Vous décidez, à chaque étape, sur des faits.
          </p>

          <div className="mt-10 flex items-center gap-6">
            {["01", "02", "03", "04", "05", "06", "07"].map((n, i) => (
              <div key={n} className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full mono text-[11px] font-semibold ring-1",
                      i < 3
                        ? "bg-primary text-primary-foreground ring-primary/40 shadow-[0_0_18px_rgba(229,13,45,0.5)]"
                        : "bg-background/60 text-muted-foreground ring-border",
                    )}
                  >
                    {i < 3 ? <Check className="size-4" strokeWidth={3} /> : n}
                  </span>
                </div>
                {i < 6 && (
                  <span
                    aria-hidden
                    className={cn("h-px w-6 rounded-full", i < 2 ? "bg-primary" : "bg-border")}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 mono text-[11px] text-muted-foreground">
          © PROMAT Maroc · Tender OS · v2026
        </p>
      </div>

      {/* Right card */}
      <div className="relative z-10 flex w-full items-center justify-center p-6 lg:w-2/5 lg:p-12">
        <div className="glass-strong w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-500 p-8 sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <img
              src="/promat-logo.png"
              alt="PROMAT Maroc"
              width={910}
              height={533}
              className="block w-[155px] object-contain"
              style={{ height: "auto", aspectRatio: "910 / 533" }}
            />
          </div>


          <p className="eyebrow mb-3">Bienvenue</p>
          <h2 className="font-display text-3xl font-bold tracking-tight">Connectez-vous</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Accédez à votre espace Tender OS.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="label-xs">Email professionnel</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-background/60 px-3.5 mono text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </label>
            <label className="block">
              <span className="label-xs">Mot de passe</span>
              <div className="relative mt-2">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background/60 px-3.5 pr-10 mono text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Masquer" : "Afficher"}
                  className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <span
                  onClick={() => setRemember((r) => !r)}
                  className={cn(
                    "flex size-4 items-center justify-center rounded-md border transition-colors",
                    remember ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
                  )}
                >
                  {remember && <Check className="size-3" strokeWidth={3} />}
                </span>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="sr-only" />
                Se souvenir de moi
              </label>
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              disabled={busy !== "idle"}
              className="shine relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl gradient-red text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_rgba(229,13,45,0.7)] transition-all hover:shadow-[0_16px_40px_-10px_rgba(229,13,45,0.85)] active:scale-[0.97]"
            >
              <span className="shine-sweep" />
              {busy === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : busy === "done" ? (
                <Check className="size-4" strokeWidth={3} />
              ) : (
                <>Se connecter <ArrowRight className="size-4" /></>
              )}
            </button>

            <Link to="/" className="block text-center text-sm text-muted-foreground transition-colors hover:text-foreground">
              Continuer sans se connecter
            </Link>
          </form>

          <div className="mt-8">
            <p className="label-xs mb-3">Comptes de démonstration</p>
            <div className="flex flex-wrap gap-1.5">
              {demoUsers.map((u) => {
                const on = selected === u.email;
                return (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => chooseChip(u)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[12px] transition-all",
                      on
                        ? "border-primary bg-primary/8 text-foreground shadow-[0_6px_20px_-8px_rgba(229,13,45,0.55)]"
                        : "border-border bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:-translate-y-0.5",
                    )}
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-navy text-[9px] font-semibold text-navy-foreground">
                      {u.initials}
                    </span>
                    <span className="font-medium">{u.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
