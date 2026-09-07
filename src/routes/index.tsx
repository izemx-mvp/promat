import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { AppShell, PageHeader } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePromat } from "@/lib/promat/store";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recherches AO — PROMAT Maroc" },
      {
        name: "description",
        content:
          "Configurez vos recherches d'appels d'offres et retrouvez les nouvelles opportunités détectées par l'Agent AO & Analyse de PROMAT.",
      },
      { property: "og:title", content: "Recherches AO — PROMAT Maroc" },
      {
        property: "og:description",
        content: "Recherches enregistrées, mots-clés et opportunités détectées automatiquement.",
      },
    ],
  }),
  component: RecherchesPage,
});

const searches = [
  {
    id: "r1",
    name: "Pièces de rechange",
    keywords: "Terex, Grove, Potain, pièces détachées",
    last: "Aujourd'hui",
    found: 8,
  },
  {
    id: "r2",
    name: "Levage & manutention",
    keywords: "grue, palan, treuil, manutention portuaire",
    last: "Hier",
    found: 3,
  },
  {
    id: "r3",
    name: "Équipements hydrauliques",
    keywords: "groupe hydraulique, vérin, pompe, flexible",
    last: "Aujourd'hui",
    found: 5,
  },
  {
    id: "r4",
    name: "Instrumentation",
    keywords: "débitmètre, capteur de pression, transmetteur",
    last: "Aujourd'hui",
    found: 4,
  },
  {
    id: "r5",
    name: "Équipements industriels",
    keywords: "compresseur, vanne, réducteur",
    last: "Il y a 3 jours",
    found: 2,
  },
];

const results = [
  {
    score: 92,
    client: "ONEE – Branche Eau",
    ref: "24/DRC/CI/2026",
    object: "Débitmètres électromagnétiques",
    budget: "1 200 000 MAD",
    deadline: "23 juil.",
    id: "onee",
  },
  {
    score: 84,
    client: "OCP Group",
    ref: "118/OCP/2026",
    object: "Vannes automatiques de régulation",
    budget: "2 450 000 MAD",
    deadline: "05 août",
    id: "ocp",
  },
  {
    score: 81,
    client: "ONCF",
    ref: "07/ONCF/MT/2026",
    object: "Capteurs de pression ferroviaires",
    budget: "680 000 MAD",
    deadline: "12 août",
    id: "oncf",
  },
  {
    score: 79,
    client: "Marsa Maroc",
    ref: "32/MM/TC/2026",
    object: "Groupes hydrauliques portuaires",
    budget: "1 850 000 MAD",
    deadline: "29 juil.",
    id: "marsa",
  },
];

function RecherchesPage() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("r4");
  usePromat();

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
        <PageHeader
          title="Recherches AO"
          subtitle="Définissez ce que PROMAT doit trouver. L'Agent AO surveille les sources et remonte les opportunités pertinentes."
          action={
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="size-4" /> Nouvelle recherche
            </button>
          }
        />

        <div className="grid gap-3 lg:grid-cols-2">
          {searches.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`card-soft p-5 text-left transition-shadow hover:shadow-lift ${
                active === s.id ? "border-primary/40" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[16px] font-semibold">{s.name}</p>
                <Pill tone={s.found > 3 ? "ai" : "neutral"}>{s.found} nouvelles</Pill>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.keywords}</p>
              <p className="mt-3 text-xs text-muted-foreground">Dernière recherche : {s.last}</p>
            </button>
          ))}
        </div>

        <SectionCard
          title="Résultats"
          subtitle="Opportunités détectées pour la recherche sélectionnée."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Pertinence", "Client", "Référence", "Objet", "Budget", "Échéance", ""].map(
                    (h) => (
                      <th key={h} className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3.5 pr-4 font-semibold tabular-nums text-ai">{r.score} %</td>
                    <td className="py-3.5 pr-4 font-medium">{r.client}</td>
                    <td className="py-3.5 pr-4 tabular-nums text-muted-foreground">{r.ref}</td>
                    <td className="py-3.5 pr-4">{r.object}</td>
                    <td className="py-3.5 pr-4 tabular-nums">{r.budget}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground">{r.deadline}</td>
                    <td className="py-3.5 text-right">
                      <Link
                        to="/analyses/$id"
                        params={{ id: r.id }}
                        className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted"
                      >
                        Analyser
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => toast.success("4 opportunités ajoutées aux AO suivis")}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ajouter aux AO
            </button>
          </div>
        </SectionCard>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Nouvelle recherche</SheetTitle>
          </SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setOpen(false);
              toast.success("Recherche enregistrée");
            }}
          >
            {[
              "Nom de la recherche",
              "Mots-clés",
              "Clients ciblés",
              "Familles de produits",
              "Budget minimum",
              "Budget maximum",
              "Région",
              "Exclusions",
            ].map((label) => (
              <label key={label} className="block">
                <span className="label-xs">{label}</span>
                <input className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring" />
              </label>
            ))}
            <label className="block">
              <span className="label-xs">Fréquence</span>
              <select className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring">
                <option>Quotidienne</option>
                <option>Hebdomadaire</option>
                <option>Manuelle</option>
              </select>
            </label>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              <Search className="size-4" /> Enregistrer la recherche
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
