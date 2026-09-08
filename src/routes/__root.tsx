import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { PromatProvider } from "../lib/promat/store";
import { ReferentielProvider } from "../lib/promat/referentiel";

import { Toaster } from "../components/ui/sonner";
import { ThemeProvider } from "../lib/theme";
import { AuthProvider, useAuth } from "../lib/auth";
import { AuroraBackground } from "../components/promat/aurora";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AuroraBackground />
      <div className="relative z-10 max-w-lg text-center">
        <img src="/promat-logo.png" alt="PROMAT Maroc" width={910} height={533} className="mx-auto mb-8 w-[150px] object-contain" style={{ height: "auto", aspectRatio: "910 / 533" }} />
        <h1 className="page-title" style={{ fontSize: "clamp(6rem, 16vw, 10rem)", lineHeight: 1 }}>
          404
        </h1>
        <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl gradient-red px-5 py-2.5 text-sm font-semibold shadow-[0_10px_30px_-10px_rgba(229,13,45,0.6)] transition-transform hover:scale-[1.02]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AuroraBackground />
      <div className="glass-strong relative z-10 max-w-md p-8 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-xl gradient-red px-4 py-2 text-sm font-semibold"
          >
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#F8F9FB" },
      { title: "PROMAT Maroc — Tender Workspace" },
      {
        name: "description",
        content:
          "Espace de travail guidé PROMAT : deux agents IA pour analyser les appels d'offres et chiffrer les offres clients.",
      },
      { name: "author", content: "PROMAT Maroc" },
      { property: "og:title", content: "PROMAT Maroc — Tender Workspace" },
      {
        property: "og:description",
        content: "Deux agents IA : AO & Analyse, Chiffrage. Un seul flux de travail.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-192.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Archivo:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (pathname === "/login") return;
    // Give AuthProvider one tick to hydrate from localStorage.
    const t = setTimeout(() => {
      const raw = typeof window !== "undefined" ? localStorage.getItem("promat.session") : null;
      if (!raw && !user) navigate({ to: "/login" });
    }, 0);
    return () => clearTimeout(t);
  }, [pathname, user, navigate]);

  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PromatProvider>
            <ReferentielProvider>
              <AuroraBackground />
              <AuthGate>
                {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                <Outlet />
              </AuthGate>
              <Toaster />
            </ReferentielProvider>
          </PromatProvider>

        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
