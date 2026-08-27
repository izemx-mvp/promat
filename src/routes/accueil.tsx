import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCheck,
  ClipboardCheck,
  FileSearch,
  Scale,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/promat/AppShell";
import { KpiCard, PageHeader, ScoreBadge, SectionCard, StatusBadge } from "@/components/promat/ui";
import { usePromat } from "@/lib/promat/store";
import { fmtDate, fmtDateTime, fmtInt } from "@/lib/promat/calc";
import { STAGES } from "@/lib/promat/data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/accueil")({
  head: () => ({
    meta: [
      { title: "Pilotage des appels d'offres — PROMAT" },
      {
        name: "description",
        content: "Suivez les opportunités, consultations fournisseurs et chiffrages en cours chez PROMAT Maroc.",
      },
      { property: "og:title", content: "Pilotage des appels d'offres — PROMAT" },
      { property: "og:description", content: "Centre de pilotage des appels d'offres, du sourcing et des chiffrages." },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  const promat = usePromat();
  const navigate = useNavigate();

  const aAnalyser = promat.tenders.filter((t) => ["Nouveau", "À analyser"].includes(t.statut));
  const aDecider = promat.tenders.filter((t) => t.statut === "À décider");
  const attentes = promat.rfqs.filter((r) => ["Envoyée", "En attente", "Relance nécessaire"].includes(r.statut));
  const retards = promat.rfqs.filter((r) => r.statut === "Relance nécessaire");
  const chiffragesAValider = promat.costings.filter((c) => ["À valider", "En cours"].includes(c.statut));

  const prioritaires = promat.tenders
    .filter((t) => !["Gagné", "Perdu", "NO GO"].includes(t.statut))
    .sort((a, b) => new Date(a.dateLimite).getTime() - new Date(b.dateLimite).getTime())
    .slice(0, 6);

  const taches = [
    {
      client: "ONEE – Branche Eau",
      libelle: "Décision GO / NO GO requise",
      cta: "Décider",
      to: "/appels-offres/ao-onee-debitmetres",
      tone: "brand" as const,
    },
    {
      client: "OCP Group",
      libelle: "2 fournisseurs sans réponse",
      cta: "Relancer",
      to: "/consultations",
      tone: "warning" as const,
    },
    {
      client: "Marsa Maroc",
      libelle: "Nouvelle offre fournisseur reçue",
      cta: "Comparer",
      to: "/chiffrages/ch-03",
      tone: "info" as const,
    },
    {
      client: "ONCF",
      libelle: "Marge sous le seuil recommandé",
      cta: "Revoir le chiffrage",
      to: "/chiffrages/ch-04",
      tone: "danger" as const,
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <PageHeader
          title="Pilotage des appels d'offres"
          subtitle="Suivez les opportunités, consultations fournisseurs et chiffrages en cours."
          actions={
            <>
              <Button variant="outline" onClick={() => navigate({ to: "/recherches" })}>
                <FileSearch className="size-4" /> Lancer une recherche AO
              </Button>
              <Button onClick={() => navigate({ to: "/appels-offres" })}>
                <ClipboardCheck className="size-4" /> Ajouter un appel d'offres
              </Button>
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="AO à analyser"
            value={aAnalyser.length}
            hint={`${aAnalyser.filter((t) => t.priorite === "Haute").length} prioritaires`}
            icon={<FileSearch className="size-5" />}
            tone="info"
            delay={0}
            onClick={() => navigate({ to: "/appels-offres" })}
          />
          <KpiCard
            label="Décisions GO / NO GO"
            value={aDecider.length}
            hint="à valider"
            icon={<ClipboardCheck className="size-5" />}
            tone="brand"
            delay={60}
            onClick={() => navigate({ to: "/appels-offres" })}
          />
          <KpiCard
            label="Réponses fournisseurs attendues"
            value={attentes.length}
            hint={`${retards.length} en retard`}
            icon={<Send className="size-5" />}
            tone="warning"
            delay={120}
            onClick={() => navigate({ to: "/consultations" })}
          />
          <KpiCard
            label="Chiffrages à valider"
            value={chiffragesAValider.length}
            hint={`${promat.costings.filter((c) => c.margeGlobale < 15).length} marges critiques`}
            icon={<Scale className="size-5" />}
            tone="success"
            delay={180}
            onClick={() => navigate({ to: "/chiffrages" })}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-6">
            <SectionCard title="Priorités du jour" description="Actions attendues de votre part aujourd'hui.">
              <ul className="grid gap-2">
                {taches.map((t) => (
                  <li
                    key={t.client + t.libelle}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          t.tone === "brand" && "bg-primary",
                          t.tone === "warning" && "bg-warning",
                          t.tone === "info" && "bg-info",
                          t.tone === "danger" && "bg-danger",
                        )}
                      />
                      <div>
                        <p className="text-sm font-bold">{t.client}</p>
                        <p className="text-xs text-muted-foreground">{t.libelle}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate({ to: t.to })}>
                      {t.cta} <ArrowRight className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              title="Dossiers prioritaires"
              description="Les appels d'offres les plus proches de leur échéance."
              noPadding
              actions={
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/appels-offres" })}>
                  Tout voir
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                    <tr>
                      {["Référence", "Client", "Objet", "Étape", "Échéance", "Responsable", "Avancement", "Priorité", ""].map(
                        (h) => (
                          <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {prioritaires.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => navigate({ to: "/appels-offres/$id", params: { id: t.id } })}
                        className="cursor-pointer transition-colors hover:bg-accent/60"
                      >
                        <td className="num px-3 py-2.5 font-semibold whitespace-nowrap">{t.ref}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{t.client}</td>
                        <td className="max-w-[260px] truncate px-3 py-2.5">{t.objet}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <StatusBadge tone="navy">{STAGES[t.stageIndex]}</StatusBadge>
                        </td>
                        <td className="num px-3 py-2.5 whitespace-nowrap">{fmtDate(t.dateLimite)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{t.responsable}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex w-32 items-center gap-2">
                            <Progress value={t.avancement} className="h-1.5" />
                            <span className="num text-xs">{t.avancement}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge tone={t.priorite === "Haute" ? "danger" : t.priorite === "Moyenne" ? "warning" : "neutre"}>
                            {t.priorite}
                          </StatusBadge>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <ArrowRight className="size-4 text-muted-foreground" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          <div className="flex flex-col gap-6">
            <SectionCard
              title="Centre d'alertes"
              description={`${promat.notifications.filter((n) => !n.lu).length} alertes non lues`}
              actions={
                <Button variant="ghost" size="sm" onClick={() => { promat.markAllRead(); toast.success("Toutes les alertes ont été marquées comme lues."); }}>
                  <CheckCheck className="size-3.5" /> Tout lire
                </Button>
              }
              noPadding
            >
              <ul className="divide-y divide-border">
                {promat.notifications.slice(0, 7).map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        promat.markRead(n.id);
                        if (n.lien) navigate({ to: n.lien });
                      }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60"
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-md",
                          n.priorite === "Haute" ? "bg-danger-soft text-danger" : n.priorite === "Moyenne" ? "bg-warning-soft text-warning-foreground" : "bg-info-soft text-info",
                        )}
                      >
                        {n.priorite === "Haute" ? <AlertTriangle className="size-3.5" /> : <BellRing className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn("truncate text-sm", n.lu ? "font-medium text-muted-foreground" : "font-bold")}>{n.titre}</span>
                          <StatusBadge tone="neutre">{n.type}</StatusBadge>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{n.message}</span>
                        <span className="num mt-0.5 block text-[10px] text-muted-foreground">{fmtDateTime(n.date)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Opportunités détectées" description="Meilleurs scores de pertinence Agent Recherche AO.">
              <ul className="space-y-3">
                {[...promat.tenders]
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 4)
                  .map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="num truncate text-sm font-semibold">{t.ref}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.client} — {fmtInt(t.budget)} MAD
                        </p>
                      </div>
                      <ScoreBadge score={t.score} />
                    </li>
                  ))}
              </ul>
            </SectionCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
