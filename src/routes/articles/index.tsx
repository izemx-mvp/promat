import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/promat/shell";
import { ModuleTenderList } from "@/components/promat/workflow";

export const Route = createFileRoute("/articles/")({
  head: () => ({
    meta: [
      { title: "Articles & besoins — PROMAT" },
      {
        name: "description",
        content:
          "Transformez les documents d'appel d'offres en lignes d'articles exploitables : désignation, quantité, spécifications et statut de validation.",
      },
      { property: "og:title", content: "Articles & besoins — PROMAT" },
      {
        property: "og:description",
        content: "Articles détectés par l'Agent AO et prêts pour la consultation fournisseurs.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ModuleTenderList
        title="Articles & besoins"
        subtitle="Les articles détectés par l'Agent, dossier par dossier."
        to="/articles/$id"
        rows={(t) => <span className="text-muted-foreground">{t.articles.length} articles</span>}
      />
    </AppShell>
  ),
});
