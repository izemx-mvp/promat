import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Lock,
  Mail,
  Paperclip,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/promat/shell";
import { Pill, SectionCard } from "@/components/promat/ui";
import { GhostButton, NextButton, StickyBar, TenderWorkflow } from "@/components/promat/workflow";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { Supplier } from "@/lib/promat/data";
import { useTender } from "@/lib/promat/store";
import {
  defaultConsult,
  excludedFromDossier,
  internalDocs,
  mailBody,
  mailSubject,
  missingInfoBody,
  reminderBody,
  requiredResponseFields,
  responseDeadline,
  sendableDocs,
  statusTone,
  supplierConsults,
  type ConsultDocKind,
  type ConsultStatus,
  type ExtractedLine,
  type SupplierConsult,
} from "@/lib/promat/consultation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/consultations/$id")({
  head: () => ({
    meta: [
      { title: "Consultation fournisseurs — envoi & réponses — PROMAT" },
      {
        name: "description",
        content:
          "Préparez les documents, envoyez la demande de prix, suivez les relances, importez et analysez les réponses fournisseurs puis validez l'offre pour le comparatif.",
      },
      { property: "og:title", content: "Consultation fournisseurs — PROMAT" },
      {
        property: "og:description",
        content: "Un seul espace : préparation, envoi, suivi, réception et validation des offres.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsultationPage,
});

const RFQ = "RFQ-2026-0048";

const kindIcon = (k: ConsultDocKind) =>
  k === "Excel" ? FileSpreadsheet : k === "Image" ? ImageIcon : FileText;

type ExtraFile = { id: string; label: string; kind: ConsultDocKind };

function ConsultationPage() {
  const { id } = useParams({ from: "/consultations/$id" });
  const { tender, state, update, addLog } = useTender(id);
  const navigate = useNavigate();

  const [why, setWhy] = useState<Supplier | null>(null);
  const [docs, setDocs] = useState<string[]>(sendableDocs.filter((d) => d.defaultOn).map((d) => d.id));
  const [extra, setExtra] = useState<ExtraFile[]>([]);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [openSup, setOpenSup] = useState<string | null>(null);
  const [consults, setConsults] = useState<Record<string, SupplierConsult>>(() =>
    Object.fromEntries(
      Object.entries(supplierConsults).map(([k, v]) => [k, { ...v, timeline: [...v.timeline] }]),
    ),
  );
  const [analyzed, setAnalyzed] = useState<string[]>([]);
  const [validated, setValidated] = useState<string[]>([]);
  const [lineEdits, setLineEdits] = useState<Record<string, ExtractedLine[]>>({});
  const [subject, setSubject] = useState(mailSubject(RFQ));
  const [body, setBody] = useState(mailBody(RFQ));
  const [editMail, setEditMail] = useState(false);
  const [confirmSend, setConfirmSend] = useState<string | null>(null);
  const [reminder, setReminder] = useState<string | null>(null);
  const [missingMail, setMissingMail] = useState<string | null>(null);

  if (!tender || !state) {
    return (
      <AppShell>
        <div className="p-8 text-sm text-muted-foreground">Dossier introuvable.</div>
      </AppShell>
    );
  }

  const selected = state.selectedSuppliers;
  const selectedDocsCount = docs.length + extra.length;

  const consultOf = (sid: string): SupplierConsult => consults[sid] ?? defaultConsult;

  const patch = (sid: string, p: Partial<SupplierConsult>, event?: string) =>
    setConsults((prev) => {
      const base = prev[sid] ?? defaultConsult;
      const time = new Date().toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      return {
        ...prev,
        [sid]: {
          ...base,
          ...p,
          timeline: event ? [...base.timeline, { time, text: event }] : base.timeline,
        },
      };
    });

  const toggleSupplier = (sid: string) =>
    update(id, {
      selectedSuppliers: selected.includes(sid)
        ? selected.filter((x) => x !== sid)
        : [...selected, sid],
    });

  const createRfq = () => {
    update(id, { consultationCreated: true, offersReceived: true });
    addLog({
      who: "Houda Bennani",
      action: `Consultation ${RFQ} créée — ${selected.length} fournisseurs`,
      tender: tender.reference,
      module: "Consultations",
    });
    toast.success(`${RFQ} créée`);
  };

  const doSend = (sid: string) => {
    const now = new Date().toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    patch(
      sid,
      {
        status: "Envoyée",
        sentAt: now,
        sentBy: "Houda Bennani",
        docsSent: selectedDocsCount,
      },
      `Consultation envoyée — ${selectedDocsCount} documents`,
    );
    setConfirmSend(null);
    const name = tender.suppliers.find((s) => s.id === sid)?.name ?? "";
    addLog({
      who: "Houda Bennani",
      action: `Consultation ${RFQ} envoyée à ${name}`,
      tender: tender.reference,
      module: "Consultations",
    });
    toast.success(`Consultation envoyée à ${name}`);
  };

  const addResponseFile = (sid: string) => {
    const c = consultOf(sid);
    const files = [...(c.files ?? []), `Document_${(c.files?.length ?? 0) + 1}.pdf`];
    patch(
      sid,
      {
        files,
        status: c.status === "Offre validée" ? c.status : "Réponse reçue",
        receivedAt:
          c.receivedAt ??
          new Date().toLocaleString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }),
      },
      "1 document importé",
    );
  };

  const analyze = (sid: string) => {
    const c = consultOf(sid);
    setAnalyzed((p) => (p.includes(sid) ? p : [...p, sid]));
    if (c.extraction) {
      patch(
        sid,
        { status: c.extraction.completeness >= 90 ? "Réponse reçue" : "Réponse partielle" },
        `Réponse analysée par l'Agent AO & Analyse — complétude ${c.extraction.completeness} %`,
      );
      if (c.extraction.missing.length) {
        patch(sid, {}, `${c.extraction.missing.length} information(s) manquante(s) détectée(s)`);
      }
    }
    toast.success("Réponse analysée");
  };

  const linesOf = (sid: string): ExtractedLine[] =>
    lineEdits[sid] ?? consultOf(sid).extraction?.lines ?? [];

  const editLine = (sid: string, i: number, p: Partial<ExtractedLine>) =>
    setLineEdits((prev) => {
      const base = [...(prev[sid] ?? consultOf(sid).extraction?.lines ?? [])];
      const cur = base[i];
      if (!cur) return prev;
      base[i] = { ...cur, ...p };
      return { ...prev, [sid]: base };
    });

  const validateOffer = (sid: string) => {
    setValidated((p) => (p.includes(sid) ? p : [...p, sid]));
    patch(sid, { status: "Offre validée" }, "Offre validée par Houda Bennani");
    const name = tender.suppliers.find((s) => s.id === sid)?.name ?? "";
    addLog({
      who: "Houda Bennani",
      action: `Offre fournisseur validée — ${name}`,
      tender: tender.reference,
      module: "Consultations",
    });
    toast.success("Offre fournisseur validée");
  };

  const openSupplier = openSup ? tender.suppliers.find((s) => s.id === openSup) : null;
  const openConsult = openSup ? consultOf(openSup) : null;

  const stats = useMemo(
    () => ({
      sent: selected.filter((sid) => consultOf(sid).sentAt).length,
      answered: selected.filter((sid) => consultOf(sid).files?.length).length,
      validated: selected.filter((sid) => validated.includes(sid)).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, consults, validated],
  );

  return (
    <AppShell>
      <TenderWorkflow tender={tender} state={state} current="consultation">
        <nav aria-label="Progression de la consultation" className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-5 py-3">
          {["Sélection fournisseurs", "Documents", "Envoi", "Réponses"].map((label, index) => {
            const complete = index === 0 || (index === 1 && state.consultationCreated) || (index === 2 && stats.sent > 0) || (index === 3 && stats.validated > 0);
            const active = state.consultationCreated ? (stats.sent > 0 ? (stats.validated > 0 ? 3 : 2) : 1) : 0;
            return (
              <div key={label} className="flex items-center gap-2">
                <span className={cn("flex size-5 items-center justify-center rounded-full text-[10px] font-bold", complete ? "bg-success-soft text-success" : index === active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {complete ? <Check className="size-3" strokeWidth={3} /> : index + 1}
                </span>
                <span className={cn("text-[13px] font-medium", index === active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                {index < 3 && <span className="mx-1 h-px w-6 bg-border" />}
              </div>
            );
          })}
        </nav>
        {!state.consultationCreated ? (
          <>
            <SectionCard
              title="Fournisseurs recommandés"
              subtitle="Sélection multiple. L'Agent classe par compatibilité technique et historique PROMAT."
              action={
                <Pill tone="ai">
                  <Sparkles className="size-3.5" /> Agent AO
                </Pill>
              }
            >
              <div className="grid gap-3 md:grid-cols-2">
                {tender.suppliers.map((s) => {
                  const on = selected.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "rounded-xl border p-4 transition-colors",
                        on ? "border-primary/40 bg-primary/[0.03]" : "border-border",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-semibold">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.country}</p>
                        </div>
                        <Pill tone="ai">{s.match} %</Pill>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Pill>{s.kind}</Pill>
                        <Pill>Délai {s.delay}</Pill>
                        {s.lastConsult && <Pill>Consulté {s.lastConsult}</Pill>}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          onClick={() => toggleSupplier(s.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors",
                            on
                              ? "bg-success-soft text-success"
                              : "bg-primary text-primary-foreground hover:bg-primary/90",
                          )}
                        >
                          {on && <Check className="size-3.5" />}
                          {on ? "Sélectionné" : "Sélectionner"}
                        </button>
                        <button
                          onClick={() => setWhy(s)}
                          className="text-[13px] text-muted-foreground underline-offset-4 hover:underline"
                        >
                          Pourquoi ce fournisseur ?
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Informations demandées au fournisseur">
              <div className="flex flex-wrap gap-1.5">
                {requiredResponseFields.map((f) => (
                  <Pill key={f}>{f}</Pill>
                ))}
              </div>
            </SectionCard>

            <StickyBar message={`${selected.length} fournisseur(s) sélectionné(s).`}>
              <NextButton
                label="Créer la consultation"
                disabled={selected.length === 0}
                onClick={createRfq}
              />
            </StickyBar>
          </>
        ) : (
          <>
            {/* En-tête consultation */}
            <SectionCard>
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-[22px] font-bold tracking-tight">{RFQ}</h2>
                    <Pill tone="primary">Consultation active</Pill>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    AO {tender.client} – {tender.reference} · {tender.object}
                  </p>
                </div>
                <div className="flex gap-8 text-sm">
                  <div>
                    <p className="label-xs">Articles</p>
                    <p className="mt-1 font-semibold tabular-nums">{tender.articles.length}</p>
                  </div>
                  <div>
                    <p className="label-xs">Fournisseurs</p>
                    <p className="mt-1 font-semibold tabular-nums">{selected.length}</p>
                  </div>
                  <div>
                    <p className="label-xs">Réponse attendue</p>
                    <p className="mt-1 font-semibold">{responseDeadline}</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Documents */}
            <SectionCard
              title="Documents à transmettre"
              subtitle="Cochez les fichiers joints à la demande de prix. Les documents internes restent bloqués."
              action={
                <GhostButton
                  onClick={() => {
                    setExtra((p) => [
                      ...p,
                      { id: `x${p.length + 1}`, label: `Fichier ajouté ${p.length + 1}.pdf`, kind: "PDF" },
                    ]);
                    toast.success("Fichier ajouté à la consultation");
                  }}
                >
                  <Plus className="size-4" /> Ajouter un fichier
                </GhostButton>
              }
            >
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="label-xs">Documents à envoyer au fournisseur</p>
                  <div className="mt-2 space-y-2">
                    {sendableDocs.map((d) => {
                      const Icon = kindIcon(d.kind);
                      const on = docs.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          onClick={() =>
                            setDocs((p) => (on ? p.filter((x) => x !== d.id) : [...p, d.id]))
                          }
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                            on ? "border-primary/40 bg-primary/[0.03]" : "border-border hover:bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-5 items-center justify-center rounded-[6px] border",
                              on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                            )}
                          >
                            {on && <Check className="size-3.5" strokeWidth={3} />}
                          </span>
                          <Icon className="size-4 text-muted-foreground" />
                          <span className="flex-1 text-sm font-medium">{d.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {d.kind} · {d.size}
                          </span>
                        </button>
                      );
                    })}
                    {extra.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/[0.03] px-4 py-3"
                      >
                        <span className="flex size-5 items-center justify-center rounded-[6px] border border-primary bg-primary text-primary-foreground">
                          <Check className="size-3.5" strokeWidth={3} />
                        </span>
                        <Paperclip className="size-4 text-muted-foreground" />
                        <span className="flex-1 text-sm font-medium">{d.label}</span>
                        <span className="text-xs text-muted-foreground">{d.kind}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Formats acceptés : PDF, Excel, Word, images, fiches techniques.
                  </p>
                </div>

                <div>
                  <p className="label-xs">Documents internes PROMAT</p>
                  <div className="mt-2 space-y-2">
                    {internalDocs.map((d) => {
                      const Icon = kindIcon(d.kind);
                      return (
                        <div
                          key={d.id}
                          className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3"
                        >
                          <Lock className="size-4 text-muted-foreground" />
                          <Icon className="size-4 text-muted-foreground" />
                          <span className="flex-1 text-sm font-medium text-muted-foreground">
                            {d.label}
                          </span>
                          <Pill tone="warn">Interne uniquement</Pill>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Ces fichiers ne peuvent pas être sélectionnés pour un envoi fournisseur.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                <GhostButton onClick={() => setDossierOpen(true)}>
                  <FileText className="size-4" /> Générer le dossier fournisseur
                </GhostButton>
                <span className="text-sm text-muted-foreground">
                  {selectedDocsCount} fichier(s) sélectionné(s) pour l'envoi.
                </span>
              </div>
            </SectionCard>

            {/* Cartes fournisseurs */}
            <SectionCard
              title="Fournisseurs consultés"
              subtitle={`${stats.sent} envoyée(s) · ${stats.answered} réponse(s) reçue(s) · ${stats.validated} offre(s) validée(s)`}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {selected.map((sid) => {
                  const s = tender.suppliers.find((x) => x.id === sid);
                  const c = consultOf(sid);
                  const comp = c.extraction && analyzed.includes(sid) ? c.extraction.completeness : null;
                  const last = c.timeline[c.timeline.length - 1];
                  const label =
                    c.status === "Réponse partielle"
                      ? "Compléter"
                      : c.status === "Relance recommandée"
                        ? "Relancer"
                        : "Ouvrir";
                  return (
                    <div key={sid} className="rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-semibold">{s?.name}</p>
                          <p className="text-xs text-muted-foreground">{c.contact.person}</p>
                        </div>
                        <Pill tone={statusTone(c.status)}>{c.status}</Pill>
                      </div>
                      <dl className="mt-3 space-y-1.5 text-[13px]">
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Dernière action</dt>
                          <dd className="text-right">{last ? `${last.text} · ${last.time}` : "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Échéance réponse</dt>
                          <dd>{responseDeadline}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Complétude</dt>
                          <dd className={cn("tabular-nums", comp && comp < 80 && "text-warning")}>
                            {comp ? `${comp} %` : "—"}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          onClick={() => setOpenSup(sid)}
                          className="rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          {label}
                        </button>
                        {c.status === "Relance recommandée" && (
                          <button
                            onClick={() => setReminder(sid)}
                            className="text-[13px] text-muted-foreground underline-offset-4 hover:underline"
                          >
                            Relancer le fournisseur
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <StickyBar
              message={
                stats.validated > 0
                  ? `${stats.validated} offre(s) fournisseur validée(s) et prête(s) pour comparaison.`
                  : "Validez au moins une réponse fournisseur pour passer au comparatif."
              }
            >
              <NextButton
                to="/comparatifs/$id"
                id={id}
                label="Passer au comparatif fournisseurs"
                disabled={stats.validated === 0}
              />
            </StickyBar>
          </>
        )}
      </TenderWorkflow>

      {/* Drawer : pourquoi ce fournisseur */}
      <Sheet open={Boolean(why)} onOpenChange={(v) => !v && setWhy(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{why?.name}</SheetTitle>
          </SheetHeader>
          {why && (
            <div className="mt-6 space-y-4 px-4 text-sm">
              <div>
                <p className="label-xs">Compatibilité technique</p>
                <p className="mt-1">{why.why.compat}</p>
              </div>
              <div>
                <p className="label-xs">Historique PROMAT</p>
                <p className="mt-1">{why.why.history}</p>
              </div>
              <div>
                <p className="label-xs">Réactivité</p>
                <p className="mt-1">{why.why.response}</p>
              </div>
              <div>
                <p className="label-xs">Positionnement prix</p>
                <p className="mt-1">{why.why.price}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Drawer : dossier fournisseur généré */}
      <Sheet open={dossierOpen} onOpenChange={setDossierOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Dossier fournisseur — {RFQ}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6 px-4 pb-10 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="label-xs">Consultation</p>
                <p className="mt-1 font-medium">{RFQ}</p>
              </div>
              <div>
                <p className="label-xs">Appel d'offres</p>
                <p className="mt-1 font-medium">{tender.reference}</p>
              </div>
              <div>
                <p className="label-xs">Objet</p>
                <p className="mt-1 font-medium">{tender.object}</p>
              </div>
              <div>
                <p className="label-xs">Date limite de réponse</p>
                <p className="mt-1 font-medium">{responseDeadline}</p>
              </div>
            </div>

            <div>
              <p className="label-xs">Articles et quantités</p>
              <table className="mt-2 w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 font-medium">Réf.</th>
                    <th className="py-2 font-medium">Désignation</th>
                    <th className="py-2 text-right font-medium">Qté</th>
                    <th className="py-2 font-medium">Spécifications</th>
                  </tr>
                </thead>
                <tbody>
                  {tender.articles.map((a) => (
                    <tr key={a.id} className="border-b border-border/60 align-top">
                      <td className="py-2 tabular-nums">{a.ref}</td>
                      <td className="py-2">{a.designation}</td>
                      <td className="py-2 text-right tabular-nums">
                        {a.qty} {a.unit}
                      </td>
                      <td className="py-2 text-muted-foreground">{a.specs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <p className="label-xs">Informations à renseigner par le fournisseur</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {requiredResponseFields.map((f) => (
                  <Pill key={f}>{f}</Pill>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="label-xs">Jamais inclus dans le dossier fournisseur</p>
              <ul className="mt-2 space-y-1 text-[13px] text-muted-foreground">
                {excludedFromDossier.map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <Lock className="size-3.5" /> {x}
                  </li>
                ))}
              </ul>
            </div>

            <GhostButton onClick={() => toast.success("Dossier fournisseur généré (PDF)")}>
              <FileText className="size-4" /> Générer le PDF
            </GhostButton>
          </div>
        </SheetContent>
      </Sheet>

      {/* Drawer fournisseur : envoi, suivi, réponse, analyse, validation */}
      <Sheet open={Boolean(openSup)} onOpenChange={(v) => !v && setOpenSup(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>
              {openSupplier?.name} — {RFQ}
            </SheetTitle>
          </SheetHeader>
          {openSup && openSupplier && openConsult && (
            <div className="mt-6 space-y-6 px-4 pb-16 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={statusTone(openConsult.status)}>{openConsult.status}</Pill>
                <Pill>{openSupplier.country}</Pill>
                <Pill>Réponse attendue le {responseDeadline}</Pill>
              </div>

              {/* Envoi */}
              <section className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="section-title">Envoyer au fournisseur</h3>
                  {openConsult.sentAt && <Pill tone="ok">Envoyée</Pill>}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-4">
                  <div>
                    <p className="label-xs">Contact</p>
                    <p className="mt-1 font-medium">{openConsult.contact.person}</p>
                  </div>
                  <div>
                    <p className="label-xs">Email</p>
                    <p className="mt-1 font-medium">{openConsult.contact.email}</p>
                  </div>
                  <div>
                    <p className="label-xs">Langue</p>
                    <p className="mt-1 font-medium">{openConsult.contact.language}</p>
                  </div>
                  <div>
                    <p className="label-xs">Échéance</p>
                    <p className="mt-1 font-medium">{responseDeadline}</p>
                  </div>
                </div>

                {openConsult.sentAt ? (
                  <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
                    <div>
                      <p className="label-xs">Date d'envoi</p>
                      <p className="mt-1 font-medium">{openConsult.sentAt}</p>
                    </div>
                    <div>
                      <p className="label-xs">Envoyée par</p>
                      <p className="mt-1 font-medium">{openConsult.sentBy}</p>
                    </div>
                    <div>
                      <p className="label-xs">Documents transmis</p>
                      <p className="mt-1 font-medium tabular-nums">{openConsult.docsSent}</p>
                    </div>
                    <div className="sm:col-span-3 flex flex-wrap items-center gap-2">
                      <GhostButton onClick={() => setConfirmSend(openSup)}>
                        <Mail className="size-4" /> Voir l'envoi
                      </GhostButton>
                      <button
                        onClick={() => setConfirmSend(openSup)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Send className="size-4" /> Renvoyer la consultation
                      </button>
                    </div>
                  </div>

                ) : (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <div>
                      <p className="label-xs">Objet</p>
                      {editMail ? (
                        <Input
                          className="mt-1"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                        />
                      ) : (
                        <p className="mt-1 font-medium">{subject}</p>
                      )}
                    </div>
                    <div>
                      <p className="label-xs">Message</p>
                      {editMail ? (
                        <Textarea
                          className="mt-1 min-h-40"
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                        />
                      ) : (
                        <p className="mt-1 whitespace-pre-line text-[13px] text-muted-foreground">
                          {body}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <GhostButton onClick={() => setEditMail(false)}>
                        <Mail className="size-4" /> Aperçu
                      </GhostButton>
                      <GhostButton onClick={() => setEditMail(true)}>Modifier le message</GhostButton>
                      <button
                        onClick={() => setConfirmSend(openSup)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Send className="size-4" /> Envoyer la consultation
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedDocsCount} document(s) seront joints. Aucun document interne PROMAT
                      n'est inclus.
                    </p>
                  </div>
                )}
              </section>

              {/* Relance */}
              {openConsult.sentAt && !openConsult.files?.length && (
                <section className="rounded-xl border border-warning/30 bg-warning-soft/50 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-warning" />
                    <h3 className="section-title">Relance recommandée</h3>
                  </div>
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    Aucune réponse reçue depuis l'envoi du {openConsult.sentAt}.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setReminder(openSup)}
                      className="rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Relancer le fournisseur
                    </button>
                    <GhostButton onClick={() => toast.success("Échéance de réponse modifiée")}>
                      Modifier l'échéance
                    </GhostButton>
                    <GhostButton
                      onClick={() => patch(openSup, { status: "Refus fournisseur" }, "Marqué sans réponse")}
                    >
                      Marquer comme sans réponse
                    </GhostButton>
                  </div>
                </section>
              )}

              {/* Réponse fournisseur */}
              <section className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="section-title">Réponse fournisseur</h3>
                  <GhostButton onClick={() => addResponseFile(openSup)}>
                    <Plus className="size-4" /> Ajouter une réponse
                  </GhostButton>
                </div>
                {openConsult.files?.length ? (
                  <>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="label-xs">Reçue le</p>
                        <p className="mt-1 font-medium">{openConsult.receivedAt}</p>
                      </div>
                      <div>
                        <p className="label-xs">Documents</p>
                        <p className="mt-1 font-medium tabular-nums">{openConsult.files.length}</p>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {openConsult.files.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-[13px]"
                        >
                          <FileText className="size-4 text-muted-foreground" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {!analyzed.includes(openSup) && (
                      <button
                        onClick={() => analyze(openSup)}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-ai px-4 py-2.5 text-sm font-semibold text-ai-foreground transition-opacity hover:opacity-90"
                      >
                        <Sparkles className="size-4" /> Analyser la réponse
                      </button>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-[13px] text-muted-foreground">
                    Importez le devis fournisseur (PDF, Excel), les fiches techniques ou certificats
                    reçus par email.
                  </p>
                )}
              </section>

              {/* Analyse IA */}
              {analyzed.includes(openSup) && openConsult.extraction && (
                <>
                  <section className="rounded-xl border border-ai/25 bg-ai-soft/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-ai" />
                        <h3 className="section-title">Réponse analysée</h3>
                      </div>
                      <Pill tone={openConsult.extraction.completeness >= 80 ? "ok" : "warn"}>
                        Réponse complète à {openConsult.extraction.completeness} %
                      </Pill>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-4">
                      {[
                        ["Offre", openConsult.extraction.quotationRef],
                        ["Date", openConsult.extraction.quotationDate],
                        ["Devise", openConsult.extraction.currency],
                        ["Incoterm", openConsult.extraction.incoterm],
                        ["Délai", openConsult.extraction.delay],
                        ["Validité", openConsult.extraction.validity],
                        ["Origine", openConsult.extraction.origin],
                        ["Genuine / OEM", openConsult.extraction.kind],
                        ["Marque", openConsult.extraction.brand],
                        ["Paiement", openConsult.extraction.payment],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <p className="label-xs">{k}</p>
                          <p className="mt-1 font-medium">{v}</p>
                        </div>
                      ))}
                    </div>

                    <ul className="mt-5 space-y-1.5 border-t border-ai/20 pt-4 text-[13px]">
                      {openConsult.extraction.checks.map((c) => (
                        <li key={c.text} className="flex items-center gap-2">
                          {c.ok ? (
                            <Check className="size-4 text-success" strokeWidth={3} />
                          ) : (
                            <AlertTriangle className="size-4 text-warning" />
                          )}
                          <span className={cn(!c.ok && "text-warning")}>{c.text}</span>
                        </li>
                      ))}
                    </ul>

                    {openConsult.extraction.missing.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => setMissingMail(openSup)}
                          className="rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          Demander les informations manquantes
                        </button>
                        <GhostButton onClick={() => toast.info("Analyse validée malgré les manques")}>
                          Valider malgré tout
                        </GhostButton>
                      </div>
                    )}
                  </section>

                  {/* Validation */}
                  <section className="rounded-xl border border-border p-4">
                    <h3 className="section-title">Valider la réponse fournisseur</h3>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Corrigez si nécessaire les informations extraites avant de les utiliser dans le
                      chiffrage.
                    </p>
                    <table className="mt-4 w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="py-2 font-medium">Article</th>
                          <th className="px-3 py-2 text-right font-medium">Qté</th>
                          <th className="px-3 py-2 font-medium">Réf. fournisseur</th>
                          <th className="px-3 py-2 text-right font-medium">PU</th>
                          <th className="py-2 font-medium">Conformité</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linesOf(openSup).map((l, i) => (
                          <tr key={l.articleRef} className="border-b border-border/60">
                            <td className="py-2">{l.designation}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{l.qty}</td>
                            <td className="px-3 py-2">
                              <Input
                                className="h-8 w-40 text-[13px]"
                                value={l.supplierRef}
                                onChange={(e) => editLine(openSup, i, { supplierRef: e.target.value })}
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Input
                                className="h-8 w-28 text-right text-[13px] tabular-nums"
                                value={String(l.price)}
                                onChange={(e) =>
                                  editLine(openSup, i, { price: Number(e.target.value) || 0 })
                                }
                              />
                            </td>
                            <td className="py-2">
                              <Pill tone={l.compliance === "Conforme" ? "ok" : "warn"}>
                                {l.compliance}
                              </Pill>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <GhostButton onClick={() => toast.success("Corrections enregistrées")}>
                        Enregistrer
                      </GhostButton>
                      {validated.includes(openSup) ? (
                        <>
                          <Pill tone="ok">
                            <Check className="size-3.5" /> Offre prête pour comparaison
                          </Pill>
                          <button
                            onClick={() => {
                              setOpenSup(null);
                              navigate({ to: "/comparatifs/$id", params: { id } });
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                          >
                            Ajouter au comparatif <ArrowRight className="size-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => validateOffer(openSup)}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          <Check className="size-4" /> Valider l'offre fournisseur
                        </button>
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* Historique */}
              <section className="rounded-xl border border-border p-4">
                <h3 className="section-title">Historique de l'échange</h3>
                <ol className="relative mt-4 space-y-4 border-l border-border pl-5">
                  {openConsult.timeline.map((t, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[23px] top-1.5 size-2.5 rounded-full border-2 border-card bg-primary" />
                      <p className="text-[13px] font-medium">{t.text}</p>
                      <p className="text-xs text-muted-foreground">{t.time}</p>
                    </li>
                  ))}
                  {openConsult.timeline.length === 0 && (
                    <li className="text-[13px] text-muted-foreground">
                      Aucune action pour ce fournisseur.
                    </li>
                  )}
                </ol>
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmation d'envoi */}
      <Dialog open={Boolean(confirmSend)} onOpenChange={(v) => !v && setConfirmSend(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'envoi</DialogTitle>
          </DialogHeader>
          {confirmSend && (
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="label-xs">Fournisseur</p>
                <p className="mt-1 font-medium">
                  {tender.suppliers.find((s) => s.id === confirmSend)?.name}
                </p>
              </div>
              <div>
                <p className="label-xs">Email</p>
                <p className="mt-1 font-medium">{consultOf(confirmSend).contact.email}</p>
              </div>
              <div>
                <p className="label-xs">Documents</p>
                <p className="mt-1 font-medium tabular-nums">{selectedDocsCount} fichiers</p>
              </div>
              <div>
                <p className="label-xs">Articles</p>
                <p className="mt-1 font-medium tabular-nums">{tender.articles.length}</p>
              </div>
              <div>
                <p className="label-xs">Échéance de réponse</p>
                <p className="mt-1 font-medium">{responseDeadline}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <GhostButton onClick={() => setConfirmSend(null)}>Annuler</GhostButton>
            <button
              onClick={() => confirmSend && doSend(confirmSend)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Send className="size-4" /> Envoyer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Relance */}
      <Dialog open={Boolean(reminder)} onOpenChange={(v) => !v && setReminder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relancer le fournisseur</DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-line rounded-xl border border-border bg-muted/40 p-4 text-[13px]">
            {reminderBody(RFQ)}
          </p>
          <DialogFooter>
            <GhostButton onClick={() => toast.success("Échéance de réponse modifiée")}>
              Modifier l'échéance
            </GhostButton>
            <button
              onClick={() => {
                if (reminder) patch(reminder, {}, "Relance envoyée");
                setReminder(null);
                toast.success("Relance envoyée");
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Send className="size-4" /> Envoyer la relance
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Informations manquantes */}
      <Dialog open={Boolean(missingMail)} onOpenChange={(v) => !v && setMissingMail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Informations complémentaires – {RFQ}</DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-line rounded-xl border border-border bg-muted/40 p-4 text-[13px]">
            {missingInfoBody(RFQ, missingMail ? consultOf(missingMail).extraction?.missing ?? [] : [])}
          </p>
          <DialogFooter>
            <GhostButton onClick={() => setMissingMail(null)}>Annuler</GhostButton>
            <button
              onClick={() => {
                if (missingMail) patch(missingMail, {}, "Demande d'informations complémentaires envoyée");
                setMissingMail(null);
                toast.success("Demande envoyée au fournisseur");
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Send className="size-4" /> Envoyer la demande
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

export type { ConsultStatus };
