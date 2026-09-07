import { useState } from "react";
import { Check, Download, Mail, MessageCircle, Plus, RefreshCw, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pill } from "@/components/promat/ui";
import { GhostButton } from "@/components/promat/workflow";
import { fmtMAD, type Tender } from "@/lib/promat/data";
import type { ClientOutcome, OfferSend, TenderState } from "@/lib/promat/store";
import { toast } from "sonner";

type Contact = { role: string; name: string; email: string; phone: string };

function contactsOf(tender: Tender): Contact[] {
  const domain = tender.client.toLowerCase().includes("onee")
    ? "onee.ma"
    : tender.client.toLowerCase().includes("ocp")
      ? "ocpgroup.ma"
      : tender.client.toLowerCase().includes("oncf")
        ? "oncf.ma"
        : "marsamaroc.co.ma";
  return [
    { role: "Contact principal", name: "Rachid Alaoui", email: `contact@${domain}`, phone: "+212 6 61 23 45 67" },
    { role: "Responsable achats", name: "Nadia Berrada", email: `achats@${domain}`, phone: "+212 6 62 87 90 11" },
    { role: "Responsable technique", name: "Karim Idrissi", email: `technique@${domain}`, phone: "+212 6 63 44 21 08" },
    { role: "Autre contact", name: "Autre contact", email: `bureau.ordre@${domain}`, phone: "+212 5 37 00 00 00" },
  ];
}

function defaultMessage(tender: Tender) {
  return `Bonjour,

Veuillez trouver ci-joint notre offre commerciale relative à l'appel d'offres ${tender.reference}.

Nous restons à votre disposition pour toute information complémentaire.

Cordialement,
PROMAT Morocco`;
}

const outcomeLabel: Record<ClientOutcome, string> = {
  none: "",
  waiting: "En attente de retour client",
  accepted: "Offre acceptée",
  refused: "Offre refusée",
};

export function OfferSendPanel({
  tender,
  state,
  versionLabel,
  total,
  onSend,
  onOutcome,
  onNewVersion,
}: {
  tender: Tender;
  state: TenderState;
  versionLabel: string;
  total: number;
  onSend: (send: OfferSend) => void;
  onOutcome: (outcome: ClientOutcome) => void;
  onNewVersion: () => void;
}) {
  const contacts = contactsOf(tender);
  const [channel, setChannel] = useState<"Email" | "WhatsApp" | null>(null);
  const [contactRole, setContactRole] = useState(contacts[0]!.role);
  const contact = contacts.find((c) => c.role === contactRole) ?? contacts[0]!;
  const fileName = `Offre_PROMAT_${versionLabel}.pdf`;

  const [email, setEmail] = useState(contact.email);
  const [phone, setPhone] = useState(contact.phone);
  const [subject, setSubject] = useState(`Offre commerciale – AO ${tender.reference}`);
  const [message, setMessage] = useState(defaultMessage(tender));
  const [attached, setAttached] = useState(true);

  const sends = state.sends ?? [];
  const last = sends[sends.length - 1];

  const openChannel = (c: "Email" | "WhatsApp") => {
    setEmail(contact.email);
    setPhone(contact.phone);
    setChannel(c);
  };

  const pickContact = (role: string) => {
    setContactRole(role);
    const next = contacts.find((c) => c.role === role);
    if (next) {
      setEmail(next.email);
      setPhone(next.phone);
    }
  };

  const send = () => {
    const now = new Date();
    onSend({
      id: `send-${now.getTime()}`,
      version: versionLabel,
      channel: channel!,
      date: `${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      recipient: channel === "Email" ? email : phone,
      total,
    });
    onOutcome("waiting");
    toast.success(channel === "Email" ? "Offre envoyée par email" : "Offre envoyée sur WhatsApp");
    setChannel(null);
  };

  return (
    <div className="card-soft p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
          <div>
            <p className="label-xs">Statut</p>
            <div className="mt-1.5">
              {last ? <Pill tone="ok">Envoyée</Pill> : <Pill tone="info">Prête à envoyer</Pill>}
            </div>
          </div>
          <div>
            <p className="label-xs">Version</p>
            <p className="mt-1 text-lg font-semibold">{versionLabel}</p>
          </div>
          <div>
            <p className="label-xs">Montant final</p>
            <p className="mt-1 font-display text-[24px] font-bold tabular-nums">{fmtMAD(total)} HT</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openChannel("Email")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Mail className="size-4" /> Envoyer par email
          </button>
          <button
            type="button"
            onClick={() => openChannel("WhatsApp")}
            className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-success-foreground transition-colors hover:opacity-90"
          >
            <MessageCircle className="size-4" /> Envoyer par WhatsApp
          </button>
          <GhostButton onClick={() => toast.success(`${fileName} téléchargé (démo)`)}>
            <Download className="size-4" /> Télécharger l'offre
          </GhostButton>
        </div>
      </div>

      {last && (
        <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-4">
          <div>
            <p className="label-xs">Canal</p>
            <p className="mt-1 text-sm font-medium">{last.channel}</p>
          </div>
          <div>
            <p className="label-xs">Envoyée le</p>
            <p className="mt-1 text-sm font-medium">{last.date}</p>
          </div>
          <div>
            <p className="label-xs">À</p>
            <p className="mt-1 text-sm font-medium">{last.recipient}</p>
          </div>
          <div>
            <p className="label-xs">Version</p>
            <p className="mt-1 text-sm font-medium">{last.version}</p>
          </div>
        </div>
      )}

      {sends.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="label-xs">Historique des envois</p>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {sends.map((s) => (
                <tr key={s.id} className="border-t border-border/60 first:border-t-0">
                  <td className="py-2.5 pr-4 font-semibold">{s.version}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">Envoyée par {s.channel}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{s.date}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{s.recipient}</td>
                  <td className="py-2.5 text-right tabular-nums">{fmtMAD(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {state.clientOutcome && state.clientOutcome !== "none" && (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <p className="label-xs">Statut dossier</p>
          <Pill tone={state.clientOutcome === "accepted" ? "ok" : state.clientOutcome === "refused" ? "warn" : "info"}>
            {outcomeLabel[state.clientOutcome]}
          </Pill>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <GhostButton onClick={() => openChannel(last?.channel ?? "Email")}>
              <RefreshCw className="size-4" /> Renvoyer l'offre
            </GhostButton>
            <GhostButton onClick={onNewVersion}>
              <Plus className="size-4" /> Envoyer une nouvelle version
            </GhostButton>
            <GhostButton
              onClick={() => {
                onOutcome("accepted");
                toast.success("Offre marquée comme acceptée");
              }}
            >
              <Check className="size-4" /> Marquer comme acceptée
            </GhostButton>
            <GhostButton
              onClick={() => {
                onOutcome("refused");
                toast("Offre marquée comme refusée");
              }}
            >
              <X className="size-4" /> Marquer comme refusée
            </GhostButton>
          </div>
        </div>
      )}

      <Dialog open={channel !== null} onOpenChange={(v) => !v && setChannel(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {channel === "WhatsApp" ? "Envoyer sur WhatsApp" : "Envoyer l'offre par email"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="label-xs">Client</p>
                <p className="mt-1 text-sm font-medium">{tender.client}</p>
              </div>
              <label className="block">
                <span className="label-xs">Contact</span>
                <select
                  value={contactRole}
                  onChange={(e) => pickContact(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  {contacts.map((c) => (
                    <option key={c.role} value={c.role}>
                      {c.role} — {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {channel === "Email" ? (
              <>
                <label className="block">
                  <span className="label-xs">Email</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="label-xs">Objet</span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  />
                </label>
              </>
            ) : (
              <label className="block">
                <span className="label-xs">Numéro de téléphone</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
              </label>
            )}

            <label className="block">
              <span className="label-xs">Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm leading-relaxed"
              />
            </label>

            <div>
              <p className="label-xs">Pièce jointe</p>
              <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
                {attached ? (
                  <>
                    <span className="font-medium">{fileName}</span>
                    <button
                      type="button"
                      onClick={() => setAttached(false)}
                      className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                    >
                      Retirer
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">Aucune pièce jointe</span>
                    <button
                      type="button"
                      onClick={() => setAttached(true)}
                      className="ml-auto text-xs font-medium text-primary"
                    >
                      Ajouter {fileName}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <GhostButton onClick={() => setChannel(null)}>Annuler</GhostButton>
            <button
              type="button"
              onClick={send}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {channel === "WhatsApp" ? (
                <>
                  <MessageCircle className="size-4" /> Envoyer sur WhatsApp
                </>
              ) : (
                <>
                  <Mail className="size-4" /> Envoyer l'email
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
