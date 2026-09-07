export type ConsultDocKind = "PDF" | "Excel" | "Word" | "Image";

export type ConsultDoc = {
  id: string;
  label: string;
  kind: ConsultDocKind;
  size: string;
  defaultOn: boolean;
};

export type InternalDoc = { id: string; label: string; kind: ConsultDocKind; note: string };

export const sendableDocs: ConsultDoc[] = [
  { id: "d1", label: "Bordereau articles", kind: "Excel", size: "48 Ko", defaultOn: true },
  { id: "d2", label: "Spécifications techniques", kind: "PDF", size: "1,2 Mo", defaultOn: true },
  { id: "d3", label: "Extrait du CCTP", kind: "PDF", size: "820 Ko", defaultOn: true },
  { id: "d4", label: "Fiches techniques requises", kind: "PDF", size: "2,4 Mo", defaultOn: true },
  { id: "d5", label: "Avis d'appel d'offres", kind: "PDF", size: "310 Ko", defaultOn: false },
  { id: "d6", label: "Règlement complet", kind: "Word", size: "640 Ko", defaultOn: false },
];

export const internalDocs: InternalDoc[] = [
  { id: "i1", label: "Chiffrage interne PROMAT", kind: "Excel", note: "Prix de revient" },
  { id: "i2", label: "Grille de marge", kind: "Excel", note: "Marge commerciale" },
  { id: "i3", label: "Comparatif fournisseurs", kind: "Excel", note: "Prix concurrents" },
  { id: "i4", label: "Notes internes client", kind: "Word", note: "Notes commerciales" },
];

export const requiredResponseFields = [
  "Prix unitaire",
  "Devise",
  "Marque",
  "Référence proposée",
  "Genuine / OEM",
  "Délai",
  "Incoterm",
  "Origine",
  "Garantie",
  "Validité de l'offre",
  "Conformité technique",
  "Documents techniques",
];

export const excludedFromDossier = [
  "Marge PROMAT",
  "Prix des autres fournisseurs",
  "Prix de revient interne",
  "Notes internes",
  "Prix final client",
];

export type ConsultStatus =
  | "Brouillon"
  | "Prête à envoyer"
  | "Envoyée"
  | "Livrée"
  | "En attente de réponse"
  | "Relance recommandée"
  | "Réponse reçue"
  | "Réponse partielle"
  | "Offre validée"
  | "Refus fournisseur";

export const statusTone = (s: ConsultStatus): "ok" | "warn" | "neutral" | "primary" => {
  if (s === "Offre validée" || s === "Réponse reçue" || s === "Livrée") return "ok";
  if (s === "Relance recommandée" || s === "Réponse partielle") return "warn";
  if (s === "Envoyée" || s === "Prête à envoyer") return "primary";
  return "neutral";
};

export type Contact = {
  person: string;
  email: string;
  language: string;
  phone: string;
};

export type ExtractedLine = {
  articleRef: string;
  designation: string;
  qty: number;
  supplierRef: string;
  price: number;
  compliance: "Conforme" | "Équivalent" | "À confirmer";
};

export type Extraction = {
  quotationRef: string;
  quotationDate: string;
  currency: string;
  incoterm: string;
  delay: string;
  validity: string;
  origin: string;
  brand: string;
  kind: string;
  payment: string;
  lines: ExtractedLine[];
  checks: { ok: boolean; text: string }[];
  missing: string[];
  completeness: number;
};

export type SupplierConsult = {
  contact: Contact;
  status: ConsultStatus;
  sentAt?: string;
  sentBy?: string;
  docsSent?: number;
  receivedAt?: string;
  files?: string[];
  extraction?: Extraction;
  timeline: { time: string; text: string }[];
};

export const responseDeadline = "15 juillet 2026";

const flowtechExtraction: Extraction = {
  quotationRef: "FT-2026-784",
  quotationDate: "10 juillet 2026",
  currency: "EUR",
  incoterm: "EXW Germany",
  delay: "4 semaines",
  validity: "30 jours",
  origin: "Allemagne",
  brand: "FlowTech",
  kind: "Genuine",
  payment: "30 % acompte, solde 60 jours",
  lines: [
    { articleRef: "001", designation: "Débitmètre DN600", qty: 2, supplierRef: "FT-DN600-PN25", price: 4200, compliance: "Conforme" },
    { articleRef: "002", designation: "Débitmètre DN400", qty: 4, supplierRef: "FT-DN400-PN16", price: 3250, compliance: "Conforme" },
    { articleRef: "003", designation: "Débitmètre DN200", qty: 3, supplierRef: "FT-DN200-PN16", price: 1780, compliance: "À confirmer" },
    { articleRef: "004", designation: "Convertisseur séparé", qty: 6, supplierRef: "FT-CV-200", price: 610, compliance: "Conforme" },
  ],
  checks: [
    { ok: true, text: "Prix renseignés pour les 12 articles" },
    { ok: true, text: "Délais renseignés" },
    { ok: true, text: "Origine et marque confirmées" },
    { ok: false, text: "Documentation technique manquante pour la ligne 003" },
  ],
  missing: ["Fiche technique de la référence FT-DN200"],
  completeness: 92,
};

const euroflowExtraction: Extraction = {
  quotationRef: "EF-Q-1188",
  quotationDate: "11 juillet 2026",
  currency: "EUR",
  incoterm: "Non précisé",
  delay: "6 semaines",
  validity: "Non précisée",
  origin: "Turquie",
  brand: "EuroFlow",
  kind: "OEM",
  payment: "50 % à la commande",
  lines: [
    { articleRef: "001", designation: "Débitmètre DN600", qty: 2, supplierRef: "EF-600-25", price: 3760, compliance: "Équivalent" },
    { articleRef: "002", designation: "Débitmètre DN400", qty: 4, supplierRef: "EF-400-16", price: 2890, compliance: "Conforme" },
    { articleRef: "003", designation: "Débitmètre DN200", qty: 3, supplierRef: "EF-200-16", price: 1520, compliance: "Équivalent" },
  ],
  checks: [
    { ok: true, text: "Prix renseignés" },
    { ok: true, text: "Délais renseignés" },
    { ok: false, text: "Incoterm manquant" },
    { ok: false, text: "Validité de l'offre non précisée" },
    { ok: false, text: "Documentation technique manquante pour la ligne 003" },
  ],
  missing: ["Incoterm proposé", "Validité de l'offre", "Fiche technique de la référence EF-200-16"],
  completeness: 68,
};

export const supplierConsults: Record<string, SupplierConsult> = {
  s1: {
    contact: { person: "Anna Schmidt", email: "anna@flowtech.de", language: "Anglais", phone: "+49 211 55 20 18" },
    status: "Réponse reçue",
    sentAt: "07 juil. 2026 – 10:42",
    sentBy: "Houda Bennani",
    docsSent: 4,
    receivedAt: "11 juillet 2026 – 14:21",
    files: ["Offre_FlowTech_RFQ0048.pdf", "Datasheet_DN600.pdf", "Certificate.pdf"],
    extraction: flowtechExtraction,
    timeline: [
      { time: "07 juil. 10:42", text: "Consultation envoyée" },
      { time: "07 juil. 10:44", text: "Livrée au destinataire" },
      { time: "09 juil. 09:15", text: "Relance envoyée" },
      { time: "11 juil. 14:21", text: "Réponse reçue" },
      { time: "11 juil. 14:23", text: "3 documents importés" },
    ],
  },
  s2: {
    contact: { person: "Julien Marchand", email: "j.marchand@hydrotech.fr", language: "Français", phone: "+33 4 72 11 08 90" },
    status: "Relance recommandée",
    sentAt: "07 juil. 2026 – 10:42",
    sentBy: "Houda Bennani",
    docsSent: 4,
    timeline: [
      { time: "07 juil. 10:42", text: "Consultation envoyée" },
      { time: "07 juil. 11:02", text: "Livrée au destinataire" },
    ],
  },
  s3: {
    contact: { person: "Mert Yilmaz", email: "mert@euroflow.com.tr", language: "Anglais", phone: "+90 216 44 90 31" },
    status: "Réponse partielle",
    sentAt: "07 juil. 2026 – 10:42",
    sentBy: "Houda Bennani",
    docsSent: 4,
    receivedAt: "11 juillet 2026 – 09:05",
    files: ["EuroFlow_Quotation_1188.pdf", "EF_Catalogue.pdf"],
    extraction: euroflowExtraction,
    timeline: [
      { time: "07 juil. 10:42", text: "Consultation envoyée" },
      { time: "11 juil. 09:05", text: "Réponse reçue" },
      { time: "11 juil. 09:07", text: "2 documents importés" },
    ],
  },
  s4: {
    contact: { person: "Karim Belhaj", email: "k.belhaj@mecaflux.ma", language: "Français", phone: "+212 522 34 71 05" },
    status: "Prête à envoyer",
    timeline: [],
  },
  s5: {
    contact: { person: "Chiara Rossi", email: "c.rossi@aquasense.it", language: "Anglais", phone: "+39 02 55 41 22" },
    status: "Prête à envoyer",
    timeline: [],
  },
};

export const defaultConsult: SupplierConsult = {
  contact: { person: "Contact fournisseur", email: "contact@fournisseur.com", language: "Anglais", phone: "—" },
  status: "Prête à envoyer",
  timeline: [],
};

export const mailSubject = (rfq: string) =>
  `Consultation ${rfq} – Débitmètres électromagnétiques`;

export const mailBody = (rfq: string) =>
  `Bonjour,

Veuillez trouver ci-joint notre demande de prix concernant les articles indiqués dans la consultation ${rfq}.

Merci de nous transmettre votre meilleure offre incluant les prix, délais, Incoterms, origine et documentation technique avant le ${responseDeadline}.

Cordialement,
PROMAT Morocco`;

export const reminderBody = (rfq: string) =>
  `Bonjour,

Nous revenons vers vous concernant notre consultation ${rfq} envoyée le 7 juillet.

Pourriez-vous nous confirmer votre capacité à répondre et nous transmettre votre offre avant le ${responseDeadline} ?

Cordialement,
PROMAT Morocco`;

export const missingInfoBody = (rfq: string, missing: string[]) =>
  `Bonjour,

Merci pour votre offre.

Afin de finaliser notre analyse, pouvez-vous confirmer les éléments suivants :

${missing.map((m) => `• ${m}`).join("\n")}

Merci d'avance.

Cordialement,
PROMAT Morocco`;
