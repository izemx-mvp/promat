import { useMemo, useState } from "react";
import { toast } from "sonner";
import { usePromat, newId } from "@/lib/promat/store";
import type { Devise, QuoteLine } from "@/lib/promat/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEVISES: Devise[] = ["MAD", "EUR", "USD", "GBP", "CNY"];

export function CreateRfqDialog({
  open,
  onOpenChange,
  tenderId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenderId?: string;
}) {
  const promat = usePromat();
  const [tender, setTender] = useState(tenderId ?? promat.tenders[0]?.id ?? "");
  const [supplierIds, setSupplierIds] = useState<string[]>([]);
  const [articleIds, setArticleIds] = useState<string[]>([]);
  const [reponse, setReponse] = useState("");
  const [saving, setSaving] = useState(false);

  const currentTender = tenderId ?? tender;
  const articles = promat.articles.filter((a) => a.tenderId === currentTender);

  const submit = async (envoyer: boolean) => {
    if (!supplierIds.length || !articleIds.length) {
      toast.error("Sélectionnez au moins un fournisseur et un article.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 450));
    supplierIds.forEach((sid, i) => {
      const ref = `RFQ-2026-${String(100 + promat.rfqs.length + i)}`;
      promat.addRfq({
        id: newId("rfq"),
        ref,
        tenderId: currentTender,
        supplierId: sid,
        articleIds,
        date: new Date().toISOString().slice(0, 10),
        reponseAttendue: reponse || new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
        statut: envoyer ? "Envoyée" : "Brouillon",
        relances: 0,
      });
      promat.log(envoyer ? "RFQ envoyée" : "RFQ enregistrée en brouillon", `${ref} — ${promat.suppliers.find((s) => s.id === sid)?.nom}`);
    });
    articleIds.forEach((aid) => promat.updateArticle(aid, { sourcing: "En consultation" }));
    setSaving(false);
    onOpenChange(false);
    setSupplierIds([]);
    setArticleIds([]);
    toast.success(envoyer ? "Consultation générée et marquée envoyée" : "Brouillon de consultation enregistré");
  };

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nouvelle consultation fournisseur (RFQ)</DialogTitle>
          <DialogDescription>
            Le fournisseur devra renseigner : marque, référence fabricant, Genuine/OEM, PU, devise, quantité, délai,
            Incoterm, origine, garantie, validité et documentation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {!tenderId ? (
            <div className="space-y-1.5">
              <Label>Appel d'offres</Label>
              <Select value={tender} onValueChange={setTender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {promat.tenders.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.ref} — {t.client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs">Fournisseurs consultés</Label>
              <div className="mt-1.5 max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {promat.suppliers.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent">
                    <Checkbox checked={supplierIds.includes(s.id)} onCheckedChange={() => toggle(supplierIds, s.id, setSupplierIds)} />
                    <span className="truncate">{s.nom}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{s.pays}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Articles consultés</Label>
              <div className="mt-1.5 max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {articles.length ? (
                  articles.map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent">
                      <Checkbox checked={articleIds.includes(a.id)} onCheckedChange={() => toggle(articleIds, a.id, setArticleIds)} />
                      <span className="truncate">{a.ligne} — {a.designation}</span>
                    </label>
                  ))
                ) : (
                  <p className="p-2 text-xs text-muted-foreground">Aucun article extrait pour cet AO.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 md:w-1/2">
            <Label>Réponse attendue pour le</Label>
            <Input type="date" value={reponse} onChange={(e) => setReponse(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => submit(false)} disabled={saving}>Enregistrer brouillon</Button>
          <Button onClick={() => submit(true)} disabled={saving}>{saving ? "Génération…" : "Générer consultation"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddQuoteDialog({
  open,
  onOpenChange,
  tenderId,
  rfqId,
  supplierId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenderId?: string;
  rfqId?: string;
  supplierId?: string;
}) {
  const promat = usePromat();
  const [tender, setTender] = useState(tenderId ?? promat.tenders[0]?.id ?? "");
  const [supplier, setSupplier] = useState(supplierId ?? promat.suppliers[0]?.id ?? "");
  const [entete, setEntete] = useState({
    ref: "",
    date: new Date().toISOString().slice(0, 10),
    validite: "",
    devise: "EUR" as Devise,
    incoterm: "FCA",
    origine: "Allemagne",
    paiement: "30 jours",
    piece: "devis.pdf",
  });
  const [lignes, setLignes] = useState<Record<string, Partial<QuoteLine>>>({});
  const [saving, setSaving] = useState(false);

  const currentTender = tenderId ?? tender;
  const articles = useMemo(() => promat.articles.filter((a) => a.tenderId === currentTender), [promat.articles, currentTender]);

  const setLigne = (id: string, patch: Partial<QuoteLine>) =>
    setLignes((l) => ({ ...l, [id]: { ...l[id], ...patch } }));

  const submit = async () => {
    const retenues = Object.entries(lignes).filter(([, v]) => Number(v.pu) > 0);
    if (!entete.ref.trim() || !retenues.length) {
      toast.error("Référence du devis et au moins une ligne chiffrée sont obligatoires.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    const sup = promat.suppliers.find((s) => s.id === (supplierId ?? supplier));
    promat.addQuote({
      id: newId("qt"),
      ref: entete.ref,
      tenderId: currentTender,
      supplierId: supplierId ?? supplier,
      ...(rfqId ? { rfqId } : {}),
      date: entete.date,
      validite: entete.validite || new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10),
      devise: entete.devise,
      incoterm: entete.incoterm,
      origine: entete.origine,
      paiement: entete.paiement,
      piece: entete.piece,
      lignes: retenues.map(([articleId, v]) => ({
        articleId,
        refProposee: v.refProposee ?? "—",
        marque: v.marque ?? sup?.marques[0] ?? "—",
        pu: Number(v.pu),
        qte: promat.articles.find((a) => a.id === articleId)?.qte ?? 1,
        genuine: (v.genuine ?? "Genuine") as "Genuine" | "OEM",
        delaiSemaines: Number(v.delaiSemaines ?? sup?.delaiMoyen ?? 6),
        conformite: Number(v.conformite ?? 100),
      })),
    });
    if (rfqId) promat.updateRfq(rfqId, { statut: "Offre reçue" });
    retenues.forEach(([articleId]) => promat.updateArticle(articleId, { sourcing: "Offres reçues" }));
    promat.log("Devis reçu", `${entete.ref} — ${sup?.nom ?? ""}`);
    promat.notify({
      type: "Fournisseur",
      titre: "Nouvelle offre fournisseur reçue",
      message: `${sup?.nom} — devis ${entete.ref} (${retenues.length} lignes)`,
      priorite: "Moyenne",
    });
    setSaving(false);
    onOpenChange(false);
    toast.success("Offre fournisseur enregistrée — disponible dans l'Agent Chiffrage.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Ajouter une offre fournisseur</DialogTitle>
          <DialogDescription>Saisissez l'en-tête du devis puis les lignes de prix.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="entete">
          <TabsList>
            <TabsTrigger value="entete">En-tête</TabsTrigger>
            <TabsTrigger value="lignes">Lignes de prix</TabsTrigger>
          </TabsList>
          <TabsContent value="entete" className="grid gap-4 pt-4 sm:grid-cols-3">
            {!tenderId ? (
              <div className="space-y-1.5 sm:col-span-3">
                <Label>Appel d'offres</Label>
                <Select value={tender} onValueChange={setTender}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {promat.tenders.map((t) => <SelectItem key={t.id} value={t.id}>{t.ref} — {t.client}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {!supplierId ? (
              <div className="space-y-1.5 sm:col-span-3">
                <Label>Fournisseur</Label>
                <Select value={supplier} onValueChange={setSupplier}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {promat.suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label>Référence devis <span className="text-primary">*</span></Label>
              <Input value={entete.ref} onChange={(e) => setEntete({ ...entete, ref: e.target.value })} placeholder="HF-Q-2026-0001" />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={entete.date} onChange={(e) => setEntete({ ...entete, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Validité</Label>
              <Input type="date" value={entete.validite} onChange={(e) => setEntete({ ...entete, validite: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Devise</Label>
              <Select value={entete.devise} onValueChange={(v) => setEntete({ ...entete, devise: v as Devise })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEVISES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Incoterm</Label>
              <Select value={entete.incoterm} onValueChange={(v) => setEntete({ ...entete, incoterm: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["EXW", "FCA", "FOB", "CFR", "CIF", "CIP", "DAP", "DDP"].map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Origine</Label>
              <Input value={entete.origine} onChange={(e) => setEntete({ ...entete, origine: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Conditions de paiement</Label>
              <Input value={entete.paiement} onChange={(e) => setEntete({ ...entete, paiement: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Pièce jointe</Label>
              <Input value={entete.piece} onChange={(e) => setEntete({ ...entete, piece: e.target.value })} />
            </div>
          </TabsContent>

          <TabsContent value="lignes" className="pt-4">
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-surface-2 text-left text-xs text-muted-foreground uppercase">
                  <tr>
                    {["Article", "Réf. proposée", "Marque", "PU", "Qté", "Genuine/OEM", "Délai (sem.)", "Conformité %"].map((h) => (
                      <th key={h} className="px-2 py-2 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {articles.map((a) => (
                    <tr key={a.id}>
                      <td className="max-w-[200px] truncate px-2 py-1.5">{a.ligne} — {a.designation}</td>
                      <td className="px-2 py-1.5"><Input className="h-8" onChange={(e) => setLigne(a.id, { refProposee: e.target.value })} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8" onChange={(e) => setLigne(a.id, { marque: e.target.value })} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 w-24" type="number" onChange={(e) => setLigne(a.id, { pu: Number(e.target.value) })} /></td>
                      <td className="num px-2 py-1.5">{a.qte}</td>
                      <td className="px-2 py-1.5">
                        <Select onValueChange={(v) => setLigne(a.id, { genuine: v as "Genuine" | "OEM" })}>
                          <SelectTrigger className="h-8 w-28"><SelectValue placeholder="Genuine" /></SelectTrigger>
                          <SelectContent><SelectItem value="Genuine">Genuine</SelectItem><SelectItem value="OEM">OEM</SelectItem></SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5"><Input className="h-8 w-20" type="number" onChange={(e) => setLigne(a.id, { delaiSemaines: Number(e.target.value) })} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 w-20" type="number" onChange={(e) => setLigne(a.id, { conformite: Number(e.target.value) })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer l'offre"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
