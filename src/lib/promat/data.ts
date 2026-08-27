// Domaine métier PROMAT — types + jeu de données réaliste (mock)

export type Devise = "MAD" | "EUR" | "USD" | "GBP" | "CNY";

export const STAGES = [
  "Détection",
  "Analyse",
  "GO / NO GO",
  "Articles & besoins",
  "Sourcing fournisseurs",
  "Consultations",
  "Offres fournisseurs",
  "Chiffrage",
  "Validation",
  "Dépôt",
  "Résultat",
] as const;
export type Stage = (typeof STAGES)[number];

export type TenderStatut =
  | "Nouveau"
  | "À analyser"
  | "À décider"
  | "GO"
  | "NO GO"
  | "En traitement"
  | "Déposé"
  | "Gagné"
  | "Perdu";

export interface AdminCondition {
  label: string;
  statut: "Disponible" | "À préparer" | "À vérifier" | "Manquant";
}
export interface RiskItem {
  risque: string;
  niveau: "Faible" | "Moyen" | "Élevé";
  explication: string;
  impact: string;
  action: string;
}
export interface EligibiliteItem {
  critere: string;
  exigence: string;
  promat: string;
  resultat: "Conforme" | "À vérifier" | "Non conforme" | "Document manquant";
  justificatif: string;
}

export interface Tender {
  id: string;
  ref: string;
  client: string;
  objet: string;
  budget: number;
  caution: number;
  publication: string;
  dateLimite: string;
  ouverturePlis: string;
  lieu: string;
  procedure: string;
  financement: string;
  lots: string;
  score: number;
  risque: "Faible" | "Moyen" | "Élevé";
  stageIndex: number;
  statut: TenderStatut;
  responsable: string;
  priorite: "Haute" | "Moyenne" | "Basse";
  famille: string;
  region: string;
  margeCible: number;
  avancement: number;
  decision?: { type: "GO" | "NO GO"; motif?: string; commentaire?: string; date: string; par: string } | undefined;
  estimationClient?: number | undefined;
  admin: AdminCondition[];
  exigences: { label: string; valeur: string }[];
  commercial: { label: string; valeur: string }[];
  risques: RiskItem[];
  eligibilite: EligibiliteItem[];
  resultat?: { type: "Gagné" | "Perdu" | "Annulé"; details?: Record<string, string> } | undefined;
}

export interface Article {
  id: string;
  tenderId: string;
  ligne: string;
  refClient: string;
  designation: string;
  specifications: string;
  qte: number;
  unite: string;
  marque: string;
  livraison: string;
  sourcing: "À sourcer" | "En consultation" | "Offres reçues" | "Fournisseur retenu";
  conformite: "Conforme" | "À vérifier" | "Non conforme";
  refInterne: string;
  famille: string;
  poidsKg: number;
  origine: string;
  codeDouane: string;
  historique?: { fournisseur: string; prix: number; devise: Devise; date: string; qte: number } | undefined;
  docs: string[];
}

export interface Supplier {
  id: string;
  nom: string;
  pays: string;
  ville: string;
  site: string;
  email: string;
  telephone: string;
  marques: string[];
  familles: string[];
  genuine: "Genuine" | "OEM" | "Genuine / OEM";
  delaiMoyen: number; // semaines
  dernierDevis: string;
  consultations: number;
  commandes: number;
  score: number;
  statut: "Actif" | "En évaluation" | "Inactif";
  devises: Devise[];
  incoterms: string[];
  paiement: string;
  tauxReponse: number;
  delaiReponse: number; // jours
  fiabilite: number;
  notes: string;
}

export interface Rfq {
  id: string;
  ref: string;
  tenderId: string;
  supplierId: string;
  articleIds: string[];
  date: string;
  reponseAttendue: string;
  statut:
    | "Brouillon"
    | "À envoyer"
    | "Envoyée"
    | "En attente"
    | "Relance nécessaire"
    | "Offre reçue"
    | "Refusée"
    | "Expirée";
  relances: number;
}

export interface QuoteLine {
  articleId: string;
  refProposee: string;
  marque: string;
  pu: number;
  qte: number;
  genuine: "Genuine" | "OEM";
  delaiSemaines: number;
  conformite: number; // %
}
export interface Quote {
  id: string;
  ref: string;
  tenderId: string;
  supplierId: string;
  rfqId?: string | undefined;
  date: string;
  validite: string;
  devise: Devise;
  incoterm: string;
  origine: string;
  paiement: string;
  piece: string;
  lignes: QuoteLine[];
}

export type Allocation =
  | "Prorata valeur achat"
  | "Prorata quantité"
  | "Prorata poids"
  | "Montant fixe"
  | "Répartition manuelle";

export interface Fee {
  id: string;
  type: string;
  description: string;
  montant: number;
  devise: Devise;
  allocation: Allocation;
  document?: string | undefined;
  articleId?: string | undefined;
}

export interface CostingVersion {
  id: string;
  label: string;
  date: string;
  auteur: string;
  snapshot: {
    selections: Record<string, string>;
    fees: Fee[];
    customs: Record<string, number>;
    rates: Record<Devise, number>;
    margeGlobale: number;
    margesArticle: Record<string, number>;
  };
}

export interface Costing {
  id: string;
  tenderId: string;
  statut: "À préparer" | "En cours" | "À valider" | "Validé" | "Archivé";
  responsable: string;
  updatedAt: string;
  selections: Record<string, string>; // articleId -> supplierId
  fees: Fee[];
  customs: Record<string, number>; // articleId -> taux %
  margeMode: "Globale" | "Par article";
  margeGlobale: number;
  margesArticle: Record<string, number>;
  justificationMarge?: string | undefined;
  versions: CostingVersion[];
  validation?: { par: string; date: string } | undefined;
}

export interface DocItem {
  id: string;
  nom: string;
  categorie: "Dossier AO" | "Administratif" | "Technique" | "Fournisseurs";
  type: string;
  version: string;
  source: string;
  statut: "Validé" | "À vérifier" | "Manquant" | "Reçu";
  date: string;
  responsable: string;
  tenderId?: string | undefined;
  extraction: { infos: string[]; exigences: string[]; dates: string[]; articles: string[]; alertes: string[] };
}

export interface SavedSearch {
  id: string;
  nom: string;
  motsCles: string[];
  exclus: string[];
  familles: string[];
  clients: string[];
  region: string;
  budgetMin: number;
  budgetMax: number;
  frequence: "Manuel" | "Quotidien" | "Hebdomadaire";
  derniereAnalyse: string;
  resultats: number;
  statut: "Active" | "En pause";
}

export interface Notification {
  id: string;
  type: "AO" | "Fournisseur" | "Marge" | "Chiffrage" | "Document" | "Échéance";
  titre: string;
  message: string;
  date: string;
  priorite: "Haute" | "Moyenne" | "Basse";
  lu: boolean;
  lien?: string | undefined;
}

export interface Activity {
  id: string;
  date: string;
  utilisateur: string;
  action: string;
  objet: string;
  avant?: string | undefined;
  apres?: string | undefined;
}

export const TAUX_INITIAUX: Record<Devise, number> = {
  MAD: 1,
  EUR: 10.85,
  USD: 9.94,
  GBP: 12.63,
  CNY: 1.38,
};

export const FAMILLES = [
  "Grues",
  "Levage",
  "Manutention",
  "Hydraulique",
  "Pièces de rechange",
  "Mines",
  "Portuaire",
  "BTP",
  "Coffrage",
  "Équipements industriels",
];

export const UTILISATEURS = [
  { nom: "Yassine El Mansouri", role: "Responsable Commercial" },
  { nom: "Salma Bennani", role: "Acheteur" },
  { nom: "Karim Ouazzani", role: "Chiffreur" },
  { nom: "Nadia Cherkaoui", role: "Administrateur" },
];

const A = (
  id: string,
  tenderId: string,
  ligne: string,
  refClient: string,
  designation: string,
  specifications: string,
  qte: number,
  unite: string,
  marque: string,
  famille: string,
  poidsKg: number,
  extra: Partial<Article> = {},
): Article => ({
  id,
  tenderId,
  ligne,
  refClient,
  designation,
  specifications,
  qte,
  unite,
  marque,
  livraison: "12 semaines",
  sourcing: "À sourcer",
  conformite: "À vérifier",
  refInterne: `PMT-${id.toUpperCase()}`,
  famille,
  poidsKg,
  origine: "Allemagne",
  codeDouane: "9026.10.90.00",
  docs: ["Fiche technique", "Catalogue fabricant"],
  ...extra,
});

export const SUPPLIERS: Supplier[] = [
  {
    id: "sup-craneteck",
    nom: "CraneTech Germany GmbH",
    pays: "Allemagne",
    ville: "Düsseldorf",
    site: "www.cranetech.de",
    email: "sales@cranetech.de",
    telephone: "+49 211 55 82 140",
    marques: ["Potain", "Demag", "Terex"],
    familles: ["Grues", "Levage", "Pièces de rechange"],
    genuine: "Genuine",
    delaiMoyen: 4,
    dernierDevis: "2026-08-12",
    consultations: 34,
    commandes: 19,
    score: 92,
    statut: "Actif",
    devises: ["EUR"],
    incoterms: ["EXW", "FCA", "CIF"],
    paiement: "30 % acompte / 70 % avant expédition",
    tauxReponse: 94,
    delaiReponse: 2,
    fiabilite: 93,
    notes: "Partenaire historique PROMAT depuis 2019. Pièces d'origine constructeur.",
  },
  {
    id: "sup-hydroflux",
    nom: "HydroFlux Instruments B.V.",
    pays: "Pays-Bas",
    ville: "Rotterdam",
    site: "www.hydroflux-instruments.nl",
    email: "quotes@hydroflux.nl",
    telephone: "+31 10 421 77 05",
    marques: ["Krohne", "Endress+Hauser"],
    familles: ["Équipements industriels", "Hydraulique"],
    genuine: "Genuine",
    delaiMoyen: 6,
    dernierDevis: "2026-08-18",
    consultations: 21,
    commandes: 11,
    score: 88,
    statut: "Actif",
    devises: ["EUR", "USD"],
    incoterms: ["FCA", "CIP", "DAP"],
    paiement: "LC à vue",
    tauxReponse: 88,
    delaiReponse: 3,
    fiabilite: 87,
    notes: "Spécialiste débitmétrie électromagnétique, stock européen.",
  },
  {
    id: "sup-iberflow",
    nom: "IberFlow Medición S.L.",
    pays: "Espagne",
    ville: "Bilbao",
    site: "www.iberflow.es",
    email: "comercial@iberflow.es",
    telephone: "+34 944 21 08 33",
    marques: ["Tecfluid", "Siemens"],
    familles: ["Équipements industriels", "Hydraulique"],
    genuine: "Genuine / OEM",
    delaiMoyen: 5,
    dernierDevis: "2026-08-16",
    consultations: 17,
    commandes: 6,
    score: 79,
    statut: "Actif",
    devises: ["EUR"],
    incoterms: ["EXW", "CFR"],
    paiement: "50 % / 50 %",
    tauxReponse: 76,
    delaiReponse: 5,
    fiabilite: 74,
    notes: "Bon rapport prix / délai, documentation parfois incomplète.",
  },
  {
    id: "sup-shanghai",
    nom: "Shanghai MeterTech Co. Ltd",
    pays: "Chine",
    ville: "Shanghai",
    site: "www.shmetertech.cn",
    email: "export@shmetertech.cn",
    telephone: "+86 21 5896 4477",
    marques: ["MeterTech", "Sanhua"],
    familles: ["Équipements industriels", "Pièces de rechange"],
    genuine: "OEM",
    delaiMoyen: 9,
    dernierDevis: "2026-08-14",
    consultations: 25,
    commandes: 8,
    score: 68,
    statut: "Actif",
    devises: ["USD", "CNY"],
    incoterms: ["FOB", "CIF"],
    paiement: "T/T 30 % / 70 %",
    tauxReponse: 71,
    delaiReponse: 6,
    fiabilite: 62,
    notes: "Prix compétitifs, exiger certificats et inspection avant expédition.",
  },
  {
    id: "sup-atlas",
    nom: "Atlas Hydraulique SARL",
    pays: "Maroc",
    ville: "Casablanca",
    site: "www.atlas-hydraulique.ma",
    email: "contact@atlas-hydraulique.ma",
    telephone: "+212 522 66 12 40",
    marques: ["Rexroth", "Parker"],
    familles: ["Hydraulique", "Pièces de rechange", "BTP"],
    genuine: "Genuine / OEM",
    delaiMoyen: 2,
    dernierDevis: "2026-08-20",
    consultations: 41,
    commandes: 27,
    score: 85,
    statut: "Actif",
    devises: ["MAD", "EUR"],
    incoterms: ["DDP"],
    paiement: "60 jours fin de mois",
    tauxReponse: 96,
    delaiReponse: 1,
    fiabilite: 89,
    notes: "Fournisseur local, aucun frais d'approche, idéal pour délais courts.",
  },
  {
    id: "sup-nordlift",
    nom: "NordLift Solutions AB",
    pays: "Suède",
    ville: "Göteborg",
    site: "www.nordlift.se",
    email: "info@nordlift.se",
    telephone: "+46 31 704 22 10",
    marques: ["Konecranes", "ABB"],
    familles: ["Levage", "Portuaire", "Manutention"],
    genuine: "Genuine",
    delaiMoyen: 7,
    dernierDevis: "2026-07-30",
    consultations: 14,
    commandes: 5,
    score: 81,
    statut: "Actif",
    devises: ["EUR"],
    incoterms: ["FCA", "CIP"],
    paiement: "LC irrévocable",
    tauxReponse: 82,
    delaiReponse: 4,
    fiabilite: 84,
    notes: "Excellente qualité, prix élevés sur pièces courantes.",
  },
  {
    id: "sup-italmec",
    nom: "ItalMec Ricambi S.p.A.",
    pays: "Italie",
    ville: "Bergame",
    site: "www.italmec-ricambi.it",
    email: "export@italmec.it",
    telephone: "+39 035 44 21 900",
    marques: ["Cifa", "Imer", "Fiori"],
    familles: ["BTP", "Coffrage", "Pièces de rechange"],
    genuine: "Genuine / OEM",
    delaiMoyen: 5,
    dernierDevis: "2026-08-05",
    consultations: 22,
    commandes: 12,
    score: 80,
    statut: "Actif",
    devises: ["EUR"],
    incoterms: ["EXW", "CPT"],
    paiement: "Virement 30 jours",
    tauxReponse: 85,
    delaiReponse: 3,
    fiabilite: 80,
    notes: "Très bon sur pièces bétonnières et pompes à béton.",
  },
  {
    id: "sup-britmine",
    nom: "BritMine Equipment Ltd",
    pays: "Royaume-Uni",
    ville: "Sheffield",
    site: "www.britmine.co.uk",
    email: "sales@britmine.co.uk",
    telephone: "+44 114 273 88 21",
    marques: ["JCB", "Weir Minerals"],
    familles: ["Mines", "BTP", "Manutention"],
    genuine: "Genuine",
    delaiMoyen: 6,
    dernierDevis: "2026-08-02",
    consultations: 16,
    commandes: 7,
    score: 77,
    statut: "Actif",
    devises: ["GBP", "EUR"],
    incoterms: ["FCA", "CIF"],
    paiement: "50 % commande / 50 % BL",
    tauxReponse: 74,
    delaiReponse: 5,
    fiabilite: 76,
    notes: "Attention à la volatilité GBP dans les chiffrages.",
  },
  {
    id: "sup-maghreb",
    nom: "Maghreb Industrial Supply",
    pays: "Maroc",
    ville: "Tanger",
    site: "www.maghreb-industrial.ma",
    email: "devis@maghreb-industrial.ma",
    telephone: "+212 539 32 55 18",
    marques: ["SKF", "Gates", "Bosch"],
    familles: ["Pièces de rechange", "Équipements industriels"],
    genuine: "Genuine / OEM",
    delaiMoyen: 2,
    dernierDevis: "2026-08-19",
    consultations: 29,
    commandes: 18,
    score: 82,
    statut: "Actif",
    devises: ["MAD"],
    incoterms: ["DDP"],
    paiement: "45 jours",
    tauxReponse: 91,
    delaiReponse: 2,
    fiabilite: 83,
    notes: "Stock local Tanger Med, dédouanement inclus.",
  },
  {
    id: "sup-turkport",
    nom: "TurkPort Makina A.Ş.",
    pays: "Turquie",
    ville: "Izmir",
    site: "www.turkportmakina.com.tr",
    email: "export@turkportmakina.com.tr",
    telephone: "+90 232 478 66 90",
    marques: ["TurkPort", "Hidrokon"],
    familles: ["Portuaire", "Levage", "Manutention"],
    genuine: "OEM",
    delaiMoyen: 6,
    dernierDevis: "2026-07-28",
    consultations: 13,
    commandes: 4,
    score: 70,
    statut: "En évaluation",
    devises: ["EUR", "USD"],
    incoterms: ["FOB", "CFR"],
    paiement: "T/T 40 % / 60 %",
    tauxReponse: 69,
    delaiReponse: 7,
    fiabilite: 65,
    notes: "Bon niveau de prix, retours qualité à surveiller.",
  },
  {
    id: "sup-francelev",
    nom: "France Levage Industrie",
    pays: "France",
    ville: "Lyon",
    site: "www.france-levage-industrie.fr",
    email: "commerce@fli.fr",
    telephone: "+33 4 72 88 31 05",
    marques: ["Potain", "Manitou", "Haulotte"],
    familles: ["Levage", "Grues", "Manutention"],
    genuine: "Genuine",
    delaiMoyen: 3,
    dernierDevis: "2026-08-11",
    consultations: 27,
    commandes: 15,
    score: 87,
    statut: "Actif",
    devises: ["EUR"],
    incoterms: ["EXW", "DAP"],
    paiement: "Virement 45 jours",
    tauxReponse: 90,
    delaiReponse: 2,
    fiabilite: 88,
    notes: "Livraisons rapides vers Casablanca via groupage hebdomadaire.",
  },
  {
    id: "sup-benelux",
    nom: "Benelux Valve & Fitting",
    pays: "Belgique",
    ville: "Anvers",
    site: "www.beneluxvalve.be",
    email: "sales@beneluxvalve.be",
    telephone: "+32 3 546 21 77",
    marques: ["KSB", "AVK"],
    familles: ["Hydraulique", "Équipements industriels"],
    genuine: "Genuine",
    delaiMoyen: 5,
    dernierDevis: "2026-08-09",
    consultations: 18,
    commandes: 9,
    score: 83,
    statut: "Actif",
    devises: ["EUR"],
    incoterms: ["FCA", "CIP"],
    paiement: "30 jours",
    tauxReponse: 86,
    delaiReponse: 3,
    fiabilite: 85,
    notes: "Robinetterie industrielle certifiée, documentation complète.",
  },
  {
    id: "sup-usaparts",
    nom: "American Parts Group Inc.",
    pays: "États-Unis",
    ville: "Houston",
    site: "www.americanpartsgroup.com",
    email: "intl@apgroup.com",
    telephone: "+1 713 448 22 60",
    marques: ["Caterpillar", "Grove"],
    familles: ["Mines", "Levage", "Pièces de rechange"],
    genuine: "Genuine",
    delaiMoyen: 8,
    dernierDevis: "2026-07-22",
    consultations: 11,
    commandes: 3,
    score: 72,
    statut: "Actif",
    devises: ["USD"],
    incoterms: ["FCA", "CIF"],
    paiement: "Prépaiement",
    tauxReponse: 65,
    delaiReponse: 8,
    fiabilite: 70,
    notes: "Délais longs, réserver aux pièces introuvables en Europe.",
  },
  {
    id: "sup-polcoff",
    nom: "PolCoffrage Sp. z o.o.",
    pays: "Pologne",
    ville: "Katowice",
    site: "www.polcoffrage.pl",
    email: "biuro@polcoffrage.pl",
    telephone: "+48 32 259 71 40",
    marques: ["Peri", "Doka"],
    familles: ["Coffrage", "BTP"],
    genuine: "OEM",
    delaiMoyen: 4,
    dernierDevis: "2026-08-07",
    consultations: 12,
    commandes: 5,
    score: 74,
    statut: "Actif",
    devises: ["EUR"],
    incoterms: ["EXW", "CPT"],
    paiement: "Virement 30 jours",
    tauxReponse: 78,
    delaiReponse: 4,
    fiabilite: 73,
    notes: "Coffrages et accessoires, très bon prix au m².",
  },
  {
    id: "sup-emirates",
    nom: "Emirates Heavy Equipment LLC",
    pays: "Émirats Arabes Unis",
    ville: "Dubaï",
    site: "www.emirates-heavy.ae",
    email: "sales@emirates-heavy.ae",
    telephone: "+971 4 883 55 12",
    marques: ["Terex", "Liebherr"],
    familles: ["Levage", "Portuaire", "Grues"],
    genuine: "Genuine / OEM",
    delaiMoyen: 5,
    dernierDevis: "2026-08-01",
    consultations: 15,
    commandes: 6,
    score: 76,
    statut: "Actif",
    devises: ["USD", "EUR"],
    incoterms: ["FOB", "CFR", "DAP"],
    paiement: "T/T 50 % / 50 %",
    tauxReponse: 80,
    delaiReponse: 4,
    fiabilite: 75,
    notes: "Hub régional, utile pour pièces en urgence.",
  },
];

const mainAdmin: AdminCondition[] = [
  { label: "Déclaration sur l'honneur", statut: "Disponible" },
  { label: "Acte d'engagement", statut: "À préparer" },
  { label: "Caution provisoire (12 000 MAD)", statut: "À préparer" },
  { label: "CPS signé et paraphé", statut: "Disponible" },
  { label: "Dossier administratif", statut: "Disponible" },
  { label: "Dossier technique", statut: "À vérifier" },
  { label: "Dossier additif n°1", statut: "Manquant" },
  { label: "Offre financière (bordereau)", statut: "À préparer" },
];

export const TENDERS: Tender[] = [
  {
    id: "ao-onee-debitmetres",
    ref: "AO 24/DRC/CI/2026",
    client: "ONEE – Branche Eau",
    objet: "Acquisition de débitmètres électromagnétiques",
    budget: 1200000,
    caution: 12000,
    publication: "2026-06-18",
    dateLimite: "2026-07-23",
    ouverturePlis: "2026-07-23",
    lieu: "Rabat / Casablanca-Settat",
    procedure: "Appel d'offres ouvert sur offres de prix",
    financement: "Budget d'investissement ONEE 2026",
    lots: "Lot unique",
    score: 86,
    risque: "Moyen",
    stageIndex: 1,
    statut: "À décider",
    responsable: "Yassine El Mansouri",
    priorite: "Haute",
    famille: "Équipements industriels",
    region: "Rabat-Salé-Kénitra",
    margeCible: 20,
    avancement: 35,
    estimationClient: 1000000,
    admin: mainAdmin,
    exigences: [
      { label: "Produit", valeur: "Débitmètre électromagnétique à bride, alimentation 230 V AC" },
      { label: "Norme", valeur: "ISO 4064 / MID 2014/32/UE, IP68" },
      { label: "Dimensions", valeur: "DN 80 à DN 450, PN 16" },
      { label: "Pression", valeur: "PN 16 minimum, précision ±0,3 %" },
      { label: "Marque éventuelle", valeur: "Krohne, Endress+Hauser ou équivalent agréé" },
      { label: "Nature", valeur: "Matériel neuf, d'origine constructeur (Genuine)" },
      { label: "Documentation", valeur: "Notices FR, certificats d'étalonnage usine" },
      { label: "Certifications", valeur: "ISO 9001 fabricant, certificat de conformité sanitaire eau potable" },
      { label: "Variantes", valeur: "Variantes techniques interdites" },
    ],
    commercial: [
      { label: "Devise", valeur: "MAD (offre client)" },
      { label: "Validité de l'offre", valeur: "90 jours" },
      { label: "Délai d'exécution", valeur: "16 semaines maximum" },
      { label: "Dépôt", valeur: "Dépôt électronique portail marchés publics" },
      { label: "Paiement", valeur: "Virement à 60 jours après réception" },
      { label: "Livraison", valeur: "Magasin ONEE Rabat, déchargement inclus" },
      { label: "Incoterm", valeur: "DDP Rabat" },
    ],
    risques: [
      {
        risque: "Référence technique",
        niveau: "Moyen",
        explication: "Le CPS cite Krohne sans mention « ou équivalent » sur le DN 300.",
        impact: "Risque de rejet technique de l'offre",
        action: "Demander un éclaircissement au maître d'ouvrage",
      },
      {
        risque: "Délai fournisseur",
        niveau: "Élevé",
        explication: "Délai constructeur 10 à 12 semaines + transit 3 semaines.",
        impact: "Pénalités de retard 1 ‰ par jour",
        action: "Sécuriser un stock européen avant dépôt",
      },
      {
        risque: "Caution provisoire",
        niveau: "Faible",
        explication: "Caution de 12 000 MAD à émettre par la banque.",
        impact: "Faible impact trésorerie",
        action: "Lancer la demande bancaire",
      },
      {
        risque: "Document manquant",
        niveau: "Moyen",
        explication: "L'additif n°1 n'est pas encore téléchargé.",
        impact: "Offre potentiellement incomplète",
        action: "Récupérer l'additif sur le portail",
      },
      {
        risque: "Volatilité devise",
        niveau: "Moyen",
        explication: "Achat en EUR, offre client en MAD sur 90 jours.",
        impact: "Érosion de la marge de 1 à 3 %",
        action: "Intégrer une provision de change",
      },
    ],
    eligibilite: [
      {
        critere: "Chiffre d'affaires",
        exigence: "≥ 1 000 000 MAD",
        promat: "18 000 000 MAD",
        resultat: "Conforme",
        justificatif: "Attestation fiscale 2025",
      },
      {
        critere: "Projet similaire",
        exigence: "≥ 1 référence",
        promat: "2 références identifiées",
        resultat: "Conforme",
        justificatif: "Attestations ONEE 2023 / RADEEMA 2024",
      },
      {
        critere: "Caution provisoire",
        exigence: "12 000 MAD",
        promat: "Préparable sous 48 h",
        resultat: "Conforme",
        justificatif: "Accord bancaire BMCE",
      },
      {
        critere: "Certificat fabricant",
        exigence: "Lettre d'agrément constructeur",
        promat: "À demander à HydroFlux",
        resultat: "À vérifier",
        justificatif: "—",
      },
      {
        critere: "Qualification / agrément",
        exigence: "Secteur hydraulique",
        promat: "Agrément en cours de renouvellement",
        resultat: "Document manquant",
        justificatif: "Dossier déposé le 04/07/2026",
      },
    ],
  },
  {
    id: "ao-ocp-convoyeurs",
    ref: "AO 118/OCP/MIN/2026",
    client: "OCP Group",
    objet: "Pièces de rechange convoyeurs à bande – site Khouribga",
    budget: 2350000,
    caution: 25000,
    publication: "2026-06-02",
    dateLimite: "2026-07-30",
    ouverturePlis: "2026-07-30",
    lieu: "Khouribga",
    procedure: "Consultation restreinte",
    financement: "Budget maintenance OCP",
    lots: "3 lots",
    score: 91,
    risque: "Moyen",
    stageIndex: 5,
    statut: "En traitement",
    responsable: "Salma Bennani",
    priorite: "Haute",
    famille: "Mines",
    region: "Béni Mellal-Khénifra",
    margeCible: 18,
    avancement: 58,
    estimationClient: 2200000,
    admin: mainAdmin,
    exigences: [{ label: "Produit", valeur: "Rouleaux, tambours et racleurs de convoyeur" }],
    commercial: [{ label: "Devise", valeur: "MAD" }],
    risques: [
      {
        risque: "Délai fournisseur",
        niveau: "Élevé",
        explication: "2 fournisseurs n'ont pas répondu depuis 4 jours.",
        impact: "Chiffrage bloqué",
        action: "Relancer les fournisseurs",
      },
    ],
    eligibilite: [
      {
        critere: "Chiffre d'affaires",
        exigence: "≥ 2 000 000 MAD",
        promat: "18 000 000 MAD",
        resultat: "Conforme",
        justificatif: "Bilan 2025",
      },
    ],
  },
  {
    id: "ao-marsa-portique",
    ref: "AO 42/MARSA/EXP/2026",
    client: "Marsa Maroc",
    objet: "Maintenance et pièces portiques de quai – Casablanca",
    budget: 3800000,
    caution: 38000,
    publication: "2026-05-28",
    dateLimite: "2026-08-05",
    ouverturePlis: "2026-08-05",
    lieu: "Port de Casablanca",
    procedure: "Appel d'offres ouvert",
    financement: "Autofinancement",
    lots: "Lot unique",
    score: 84,
    risque: "Moyen",
    stageIndex: 6,
    statut: "En traitement",
    responsable: "Salma Bennani",
    priorite: "Haute",
    famille: "Portuaire",
    region: "Casablanca-Settat",
    margeCible: 20,
    avancement: 64,
    admin: mainAdmin,
    exigences: [{ label: "Produit", valeur: "Moteurs de translation et câbles de levage portiques" }],
    commercial: [{ label: "Devise", valeur: "MAD" }],
    risques: [],
    eligibilite: [],
  },
  {
    id: "ao-oncf-hydraulique",
    ref: "AO 77/ONCF/MAT/2026",
    client: "ONCF",
    objet: "Vérins et centrales hydrauliques ateliers ferroviaires",
    budget: 1650000,
    caution: 16500,
    publication: "2026-06-10",
    dateLimite: "2026-08-12",
    ouverturePlis: "2026-08-12",
    lieu: "Casablanca / Fès",
    procedure: "Appel d'offres ouvert",
    financement: "Budget ONCF 2026",
    lots: "2 lots",
    score: 79,
    risque: "Moyen",
    stageIndex: 7,
    statut: "En traitement",
    responsable: "Karim Ouazzani",
    priorite: "Haute",
    famille: "Hydraulique",
    region: "Casablanca-Settat",
    margeCible: 20,
    avancement: 72,
    estimationClient: 1580000,
    admin: mainAdmin,
    exigences: [{ label: "Produit", valeur: "Vérins double effet et groupes hydrauliques 45 kW" }],
    commercial: [{ label: "Devise", valeur: "MAD" }],
    risques: [],
    eligibilite: [],
  },
  {
    id: "ao-adm-grues",
    ref: "AO 09/ADM/EQP/2026",
    client: "ADM – Autoroutes du Maroc",
    objet: "Fourniture de grues auxiliaires pour véhicules d'intervention",
    budget: 4200000,
    caution: 42000,
    publication: "2026-06-22",
    dateLimite: "2026-08-28",
    ouverturePlis: "2026-08-28",
    lieu: "Rabat",
    procedure: "Appel d'offres ouvert",
    financement: "Budget ADM",
    lots: "Lot unique",
    score: 74,
    risque: "Élevé",
    stageIndex: 2,
    statut: "À décider",
    responsable: "Yassine El Mansouri",
    priorite: "Moyenne",
    famille: "Grues",
    region: "Rabat-Salé-Kénitra",
    margeCible: 18,
    avancement: 22,
    admin: mainAdmin,
    exigences: [{ label: "Produit", valeur: "Grues auxiliaires 12 t.m homologuées" }],
    commercial: [{ label: "Devise", valeur: "MAD" }],
    risques: [],
    eligibilite: [],
  },
  {
    id: "ao-onee-pompes",
    ref: "AO 31/ONEE/EL/2026",
    client: "ONEE – Branche Électricité",
    objet: "Pompes centrifuges et accessoires station de pompage",
    budget: 890000,
    caution: 9000,
    publication: "2026-07-01",
    dateLimite: "2026-08-20",
    ouverturePlis: "2026-08-20",
    lieu: "Agadir",
    procedure: "Appel d'offres ouvert",
    financement: "Budget ONEE",
    lots: "Lot unique",
    score: 68,
    risque: "Faible",
    stageIndex: 1,
    statut: "À analyser",
    responsable: "Salma Bennani",
    priorite: "Moyenne",
    famille: "Hydraulique",
    region: "Souss-Massa",
    margeCible: 20,
    avancement: 12,
    admin: mainAdmin,
    exigences: [],
    commercial: [],
    risques: [],
    eligibilite: [],
  },
  {
    id: "ao-ocp-coffrage",
    ref: "AO 205/OCP/INF/2026",
    client: "OCP Group",
    objet: "Matériel de coffrage pour génie civil – Jorf Lasfar",
    budget: 1450000,
    caution: 14500,
    publication: "2026-07-05",
    dateLimite: "2026-09-02",
    ouverturePlis: "2026-09-02",
    lieu: "El Jadida",
    procedure: "Consultation",
    financement: "Budget projet",
    lots: "Lot unique",
    score: 61,
    risque: "Moyen",
    stageIndex: 0,
    statut: "Nouveau",
    responsable: "Karim Ouazzani",
    priorite: "Basse",
    famille: "Coffrage",
    region: "Casablanca-Settat",
    margeCible: 22,
    avancement: 5,
    admin: mainAdmin,
    exigences: [],
    commercial: [],
    risques: [],
    eligibilite: [],
  },
  {
    id: "ao-marsa-manut",
    ref: "AO 56/MARSA/AGA/2026",
    client: "Marsa Maroc",
    objet: "Chariots élévateurs et pièces de manutention – Agadir",
    budget: 2100000,
    caution: 21000,
    publication: "2026-06-30",
    dateLimite: "2026-08-25",
    ouverturePlis: "2026-08-25",
    lieu: "Port d'Agadir",
    procedure: "Appel d'offres ouvert",
    financement: "Autofinancement",
    lots: "2 lots",
    score: 72,
    risque: "Moyen",
    stageIndex: 3,
    statut: "GO",
    responsable: "Salma Bennani",
    priorite: "Moyenne",
    famille: "Manutention",
    region: "Souss-Massa",
    margeCible: 20,
    avancement: 41,
    admin: mainAdmin,
    exigences: [],
    commercial: [],
    risques: [],
    eligibilite: [],
  },
  {
    id: "ao-oncf-levage",
    ref: "AO 88/ONCF/INF/2026",
    client: "ONCF",
    objet: "Palans et treuils électriques pour ateliers",
    budget: 640000,
    caution: 6500,
    publication: "2026-05-15",
    dateLimite: "2026-07-10",
    ouverturePlis: "2026-07-10",
    lieu: "Fès",
    procedure: "Consultation",
    financement: "Budget maintenance",
    lots: "Lot unique",
    score: 42,
    risque: "Faible",
    stageIndex: 2,
    statut: "NO GO",
    responsable: "Yassine El Mansouri",
    priorite: "Basse",
    famille: "Levage",
    region: "Fès-Meknès",
    margeCible: 20,
    avancement: 18,
    decision: {
      type: "NO GO",
      motif: "Rentabilité insuffisante",
      commentaire: "Budget client trop bas face aux prix constructeurs actuels.",
      date: "2026-06-20",
      par: "Yassine El Mansouri",
    },
    admin: mainAdmin,
    exigences: [],
    commercial: [],
    risques: [],
    eligibilite: [],
  },
  {
    id: "ao-adm-pieces",
    ref: "AO 14/ADM/MNT/2026",
    client: "ADM – Autoroutes du Maroc",
    objet: "Pièces détachées engins de viabilité hivernale",
    budget: 720000,
    caution: 7200,
    publication: "2026-04-20",
    dateLimite: "2026-06-15",
    ouverturePlis: "2026-06-15",
    lieu: "Ifrane",
    procedure: "Consultation",
    financement: "Budget ADM",
    lots: "Lot unique",
    score: 66,
    risque: "Faible",
    stageIndex: 9,
    statut: "Déposé",
    responsable: "Karim Ouazzani",
    priorite: "Basse",
    famille: "Pièces de rechange",
    region: "Fès-Meknès",
    margeCible: 20,
    avancement: 92,
    admin: mainAdmin,
    exigences: [],
    commercial: [],
    risques: [],
    eligibilite: [],
  },
  {
    id: "ao-ocp-pompes",
    ref: "AO 190/OCP/HYD/2026",
    client: "OCP Group",
    objet: "Pompes à boue et pièces d'usure – laverie Benguerir",
    budget: 1980000,
    caution: 20000,
    publication: "2026-03-12",
    dateLimite: "2026-05-06",
    ouverturePlis: "2026-05-06",
    lieu: "Benguerir",
    procedure: "Appel d'offres ouvert",
    financement: "Budget OCP",
    lots: "Lot unique",
    score: 88,
    risque: "Faible",
    stageIndex: 10,
    statut: "Gagné",
    responsable: "Yassine El Mansouri",
    priorite: "Moyenne",
    famille: "Mines",
    region: "Marrakech-Safi",
    margeCible: 19,
    avancement: 100,
    resultat: {
      type: "Gagné",
      details: {
        "Référence marché": "MRC-OCP-2026-190",
        "Bon de commande": "BC-77821",
        "Date d'attribution": "2026-05-28",
        "Montant final": "1 902 400 MAD",
      },
    },
    admin: mainAdmin,
    exigences: [],
    commercial: [],
    risques: [],
    eligibilite: [],
  },
  {
    id: "ao-marsa-cables",
    ref: "AO 21/MARSA/JOR/2026",
    client: "Marsa Maroc",
    objet: "Câbles de levage et accessoires d'élingage",
    budget: 540000,
    caution: 5500,
    publication: "2026-02-18",
    dateLimite: "2026-04-02",
    ouverturePlis: "2026-04-02",
    lieu: "Jorf Lasfar",
    procedure: "Consultation",
    financement: "Autofinancement",
    lots: "Lot unique",
    score: 58,
    risque: "Moyen",
    stageIndex: 10,
    statut: "Perdu",
    responsable: "Salma Bennani",
    priorite: "Basse",
    famille: "Levage",
    region: "Casablanca-Settat",
    margeCible: 20,
    avancement: 100,
    resultat: {
      type: "Perdu",
      details: {
        Concurrent: "Sotramaf Industrie",
        "Prix gagnant": "498 000 MAD",
        Motif: "Prix supérieur de 7 %",
      },
    },
    admin: mainAdmin,
    exigences: [],
    commercial: [],
    risques: [],
    eligibilite: [],
  },
];

const MAIN = "ao-onee-debitmetres";

export const ARTICLES: Article[] = [
  A("art-01", MAIN, "01", "ONEE-DM-080", "Débitmètre électromagnétique DN 80", "PN 16, IP68, précision ±0,3 %, sortie 4-20 mA", 12, "U", "Krohne", "Équipements industriels", 14, {
    historique: { fournisseur: "HydroFlux Instruments B.V.", prix: 1180, devise: "EUR", date: "2024-11-14", qte: 8 },
  }),
  A("art-02", MAIN, "02", "ONEE-DM-100", "Débitmètre électromagnétique DN 100", "PN 16, IP68, revêtement PTFE, afficheur local", 18, "U", "Krohne", "Équipements industriels", 18, {
    historique: { fournisseur: "HydroFlux Instruments B.V.", prix: 1340, devise: "EUR", date: "2024-11-14", qte: 12 },
  }),
  A("art-03", MAIN, "03", "ONEE-DM-150", "Débitmètre électromagnétique DN 150", "PN 16, électrodes Hastelloy, protocole Modbus", 14, "U", "Krohne", "Équipements industriels", 26, {
    historique: { fournisseur: "IberFlow Medición S.L.", prix: 1720, devise: "EUR", date: "2025-03-08", qte: 6 },
  }),
  A("art-04", MAIN, "04", "ONEE-DM-200", "Débitmètre électromagnétique DN 200", "PN 16, IP68, certificat d'étalonnage usine", 9, "U", "Krohne", "Équipements industriels", 38, {
    historique: { fournisseur: "HydroFlux Instruments B.V.", prix: 2260, devise: "EUR", date: "2025-01-22", qte: 4 },
  }),
  A("art-05", MAIN, "05", "ONEE-DM-300", "Débitmètre électromagnétique DN 300", "PN 16, bride EN 1092-1, convertisseur séparé", 6, "U", "Krohne", "Équipements industriels", 62, {
    historique: { fournisseur: "HydroFlux Instruments B.V.", prix: 4050, devise: "EUR", date: "2025-02-11", qte: 3 },
  }),
  A("art-06", MAIN, "06", "ONEE-DM-450", "Débitmètre électromagnétique DM-450", "DN 450, PN 16, IP68, convertisseur mural", 4, "U", "Krohne", "Équipements industriels", 96, {
    historique: { fournisseur: "IberFlow Medición S.L.", prix: 6100, devise: "EUR", date: "2025-05-30", qte: 2 },
  }),
  A("art-07", MAIN, "07", "ONEE-CV-STD", "Convertisseur de mesure déporté", "Montage mural, alimentation 230 V AC, IP67", 10, "U", "Krohne", "Équipements industriels", 5),
  A("art-08", MAIN, "08", "ONEE-KIT-INS", "Kit d'installation et joints EPDM", "Boulonnerie inox A4, joints EPDM alimentaire", 30, "Kit", "Générique", "Pièces de rechange", 3),
  A("art-09", "ao-ocp-convoyeurs", "01", "OCP-RLX-133", "Rouleau porteur Ø133 x 950 mm", "Tube acier, roulements 6305, étanchéité labyrinthe", 240, "U", "Weir", "Mines", 12),
  A("art-10", "ao-ocp-convoyeurs", "02", "OCP-TMB-800", "Tambour de commande 800 mm", "Revêtement céramique, arbre Ø 150 mm", 6, "U", "Weir", "Mines", 780),
  A("art-11", "ao-ocp-convoyeurs", "03", "OCP-RCL-1200", "Racleur primaire 1200 mm", "Lames polyuréthane, tension à ressort", 18, "U", "Weir", "Mines", 45),
  A("art-12", "ao-ocp-convoyeurs", "04", "OCP-BND-1200", "Bande transporteuse EP630/4", "1200 mm, 4 plis, revêtement 6+2 mm", 600, "m", "Continental", "Mines", 22),
  A("art-13", "ao-marsa-portique", "01", "MM-MOT-TRN", "Moteur de translation 22 kW", "IE3, frein à manque de courant, IP55", 8, "U", "ABB", "Portuaire", 190),
  A("art-14", "ao-marsa-portique", "02", "MM-CBL-28", "Câble de levage Ø 28 mm antigiratoire", "Résistance 1960 N/mm², galvanisé", 900, "m", "Konecranes", "Portuaire", 3),
  A("art-15", "ao-marsa-portique", "03", "MM-GAL-500", "Galet de roulement Ø 500 mm", "Acier forgé traité, avec chapeaux", 16, "U", "Konecranes", "Portuaire", 210),
  A("art-16", "ao-oncf-hydraulique", "01", "ONCF-VRN-125", "Vérin double effet Ø125 course 800", "PN 250 bar, tige chromée, fixation à tourillons", 12, "U", "Rexroth", "Hydraulique", 85),
  A("art-17", "ao-oncf-hydraulique", "02", "ONCF-CTR-45", "Centrale hydraulique 45 kW", "Réservoir 400 L, refroidisseur, filtration 10 µm", 3, "U", "Rexroth", "Hydraulique", 620),
  A("art-18", "ao-oncf-hydraulique", "03", "ONCF-DIS-4V", "Distributeur proportionnel 4 voies", "Commande électrique 24 V DC, 350 bar", 14, "U", "Parker", "Hydraulique", 9),
  A("art-19", "ao-oncf-hydraulique", "04", "ONCF-FLX-HP", "Flexibles haute pression assemblés", "4SP, DN 20, longueurs 1,5 à 4 m", 60, "U", "Gates", "Hydraulique", 4),
  A("art-20", "ao-adm-grues", "01", "ADM-GRA-12", "Grue auxiliaire 12 t.m", "Portée 10 m, commande radio, stabilisateurs", 6, "U", "Palfinger", "Grues", 1850),
  A("art-21", "ao-adm-grues", "02", "ADM-TRE-5", "Treuil hydraulique 5 t", "Câble 30 m, frein automatique", 6, "U", "Palfinger", "Grues", 240),
  A("art-22", "ao-onee-pompes", "01", "ONEE-PMP-C1", "Pompe centrifuge 75 m³/h", "HMT 45 m, moteur 22 kW, corps fonte", 8, "U", "KSB", "Hydraulique", 310),
  A("art-23", "ao-onee-pompes", "02", "ONEE-CLP-DN2", "Clapet anti-retour DN 200", "PN 16, fonte ductile revêtement époxy", 12, "U", "AVK", "Hydraulique", 48),
  A("art-24", "ao-ocp-coffrage", "01", "OCP-CFR-M2", "Panneau de coffrage mural 2,70 x 0,90 m", "Cadre acier, contreplaqué 18 mm", 120, "U", "Peri", "Coffrage", 92),
  A("art-25", "ao-ocp-coffrage", "02", "OCP-ETA-4M", "Étai télescopique 4 m", "Charge 30 kN, galvanisé à chaud", 300, "U", "Doka", "Coffrage", 21),
  A("art-26", "ao-marsa-manut", "01", "MM-CHR-30", "Chariot élévateur 3 t diesel", "Mât triplex 4,5 m, tablier à déplacement latéral", 4, "U", "Manitou", "Manutention", 4200),
  A("art-27", "ao-marsa-manut", "02", "MM-FRK-120", "Paire de fourches 1200 mm", "Classe III, capacité 3 t", 8, "Paire", "Manitou", "Manutention", 96),
  A("art-28", "ao-oncf-levage", "01", "ONCF-PAL-2T", "Palan électrique à chaîne 2 t", "Hauteur 6 m, chariot électrique", 10, "U", "Konecranes", "Levage", 78),
  A("art-29", "ao-adm-pieces", "01", "ADM-LAM-350", "Lame de déneigement 3,5 m", "Acier Hardox, ressorts de sécurité", 5, "U", "Schmidt", "Pièces de rechange", 420),
  A("art-30", "ao-adm-pieces", "02", "ADM-SAL-EPD", "Épandeur de sel 4 m³", "Inox, commande en cabine", 3, "U", "Schmidt", "Pièces de rechange", 890),
];

export const RFQS: Rfq[] = [
  {
    id: "rfq-01",
    ref: "RFQ-2026-041",
    tenderId: MAIN,
    supplierId: "sup-hydroflux",
    articleIds: ["art-01", "art-02", "art-03", "art-04", "art-05", "art-06", "art-07"],
    date: "2026-07-02",
    reponseAttendue: "2026-07-09",
    statut: "Offre reçue",
    relances: 0,
  },
  {
    id: "rfq-02",
    ref: "RFQ-2026-042",
    tenderId: MAIN,
    supplierId: "sup-iberflow",
    articleIds: ["art-01", "art-02", "art-03", "art-04", "art-05", "art-06"],
    date: "2026-07-02",
    reponseAttendue: "2026-07-09",
    statut: "Offre reçue",
    relances: 1,
  },
  {
    id: "rfq-03",
    ref: "RFQ-2026-043",
    tenderId: MAIN,
    supplierId: "sup-shanghai",
    articleIds: ["art-01", "art-02", "art-03", "art-04", "art-05", "art-06"],
    date: "2026-07-03",
    reponseAttendue: "2026-07-12",
    statut: "Offre reçue",
    relances: 1,
  },
  {
    id: "rfq-04",
    ref: "RFQ-2026-044",
    tenderId: MAIN,
    supplierId: "sup-benelux",
    articleIds: ["art-08"],
    date: "2026-07-04",
    reponseAttendue: "2026-07-11",
    statut: "Offre reçue",
    relances: 0,
  },
  {
    id: "rfq-05",
    ref: "RFQ-2026-045",
    tenderId: "ao-ocp-convoyeurs",
    supplierId: "sup-britmine",
    articleIds: ["art-09", "art-10", "art-11"],
    date: "2026-07-06",
    reponseAttendue: "2026-07-14",
    statut: "Relance nécessaire",
    relances: 2,
  },
  {
    id: "rfq-06",
    ref: "RFQ-2026-046",
    tenderId: "ao-ocp-convoyeurs",
    supplierId: "sup-maghreb",
    articleIds: ["art-09", "art-12"],
    date: "2026-07-06",
    reponseAttendue: "2026-07-13",
    statut: "Offre reçue",
    relances: 0,
  },
  {
    id: "rfq-07",
    ref: "RFQ-2026-047",
    tenderId: "ao-marsa-portique",
    supplierId: "sup-nordlift",
    articleIds: ["art-13", "art-14", "art-15"],
    date: "2026-07-08",
    reponseAttendue: "2026-07-18",
    statut: "Offre reçue",
    relances: 0,
  },
  {
    id: "rfq-08",
    ref: "RFQ-2026-048",
    tenderId: "ao-oncf-hydraulique",
    supplierId: "sup-atlas",
    articleIds: ["art-16", "art-18", "art-19"],
    date: "2026-07-09",
    reponseAttendue: "2026-07-16",
    statut: "Offre reçue",
    relances: 0,
  },
  {
    id: "rfq-09",
    ref: "RFQ-2026-049",
    tenderId: "ao-oncf-hydraulique",
    supplierId: "sup-italmec",
    articleIds: ["art-16", "art-17"],
    date: "2026-07-09",
    reponseAttendue: "2026-07-17",
    statut: "En attente",
    relances: 1,
  },
  {
    id: "rfq-10",
    ref: "RFQ-2026-050",
    tenderId: "ao-adm-grues",
    supplierId: "sup-francelev",
    articleIds: ["art-20", "art-21"],
    date: "2026-07-12",
    reponseAttendue: "2026-07-22",
    statut: "Envoyée",
    relances: 0,
  },
];

const ql = (
  articleId: string,
  refProposee: string,
  marque: string,
  pu: number,
  qte: number,
  genuine: "Genuine" | "OEM",
  delaiSemaines: number,
  conformite: number,
): QuoteLine => ({ articleId, refProposee, marque, pu, qte, genuine, delaiSemaines, conformite });

export const QUOTES: Quote[] = [
  {
    id: "qt-01",
    ref: "HF-Q-2026-3311",
    tenderId: MAIN,
    supplierId: "sup-hydroflux",
    rfqId: "rfq-01",
    date: "2026-07-08",
    validite: "2026-09-08",
    devise: "EUR",
    incoterm: "FCA Rotterdam",
    origine: "Allemagne",
    paiement: "LC à vue",
    piece: "HF-Q-2026-3311.pdf",
    lignes: [
      ql("art-01", "OPTIFLUX 2300 DN80", "Krohne", 1290, 12, "Genuine", 6, 100),
      ql("art-02", "OPTIFLUX 2300 DN100", "Krohne", 1465, 18, "Genuine", 6, 100),
      ql("art-03", "OPTIFLUX 2300 DN150", "Krohne", 1880, 14, "Genuine", 6, 100),
      ql("art-04", "OPTIFLUX 2300 DN200", "Krohne", 2430, 9, "Genuine", 7, 100),
      ql("art-05", "OPTIFLUX 2300 DN300", "Krohne", 4500, 6, "Genuine", 8, 100),
      ql("art-06", "OPTIFLUX 2300 DN450", "Krohne", 6480, 4, "Genuine", 8, 100),
      ql("art-07", "IFC 300 W", "Krohne", 610, 10, "Genuine", 6, 100),
    ],
  },
  {
    id: "qt-02",
    ref: "IBF-2026-0774",
    tenderId: MAIN,
    supplierId: "sup-iberflow",
    rfqId: "rfq-02",
    date: "2026-07-10",
    validite: "2026-08-25",
    devise: "EUR",
    incoterm: "EXW Bilbao",
    origine: "Espagne",
    paiement: "50 % / 50 %",
    piece: "IBF-2026-0774.pdf",
    lignes: [
      ql("art-01", "FLOMID-8 DN80", "Tecfluid", 1120, 12, "OEM", 7, 92),
      ql("art-02", "FLOMID-8 DN100", "Tecfluid", 1275, 18, "OEM", 7, 92),
      ql("art-03", "FLOMID-8 DN150", "Tecfluid", 1650, 14, "OEM", 7, 90),
      ql("art-04", "FLOMID-8 DN200", "Tecfluid", 2140, 9, "OEM", 8, 90),
      ql("art-05", "FLOMID-8 DN300", "Tecfluid", 3980, 6, "OEM", 9, 88),
      ql("art-06", "FLOMID-8 DN450", "Tecfluid", 5720, 4, "OEM", 9, 86),
    ],
  },
  {
    id: "qt-03",
    ref: "SMT-EX-26-1188",
    tenderId: MAIN,
    supplierId: "sup-shanghai",
    rfqId: "rfq-03",
    date: "2026-07-12",
    validite: "2026-08-12",
    devise: "USD",
    incoterm: "FOB Shanghai",
    origine: "Chine",
    paiement: "T/T 30 % / 70 %",
    piece: "SMT-EX-26-1188.pdf",
    lignes: [
      ql("art-01", "MT-EMF-80", "MeterTech", 890, 12, "OEM", 11, 78),
      ql("art-02", "MT-EMF-100", "MeterTech", 1010, 18, "OEM", 11, 78),
      ql("art-03", "MT-EMF-150", "MeterTech", 1290, 14, "OEM", 11, 75),
      ql("art-04", "MT-EMF-200", "MeterTech", 1680, 9, "OEM", 12, 75),
      ql("art-05", "MT-EMF-300", "MeterTech", 3010, 6, "OEM", 13, 70),
      ql("art-06", "MT-EMF-450", "MeterTech", 4380, 4, "OEM", 13, 68),
    ],
  },
  {
    id: "qt-04",
    ref: "BVF-2026-551",
    tenderId: MAIN,
    supplierId: "sup-benelux",
    rfqId: "rfq-04",
    date: "2026-07-09",
    validite: "2026-09-01",
    devise: "EUR",
    incoterm: "FCA Anvers",
    origine: "Belgique",
    paiement: "30 jours",
    piece: "BVF-2026-551.pdf",
    lignes: [ql("art-08", "KIT-EPDM-A4", "AVK", 86, 30, "Genuine", 4, 100)],
  },
  {
    id: "qt-05",
    ref: "ATL-DV-26-902",
    tenderId: MAIN,
    supplierId: "sup-atlas",
    date: "2026-07-11",
    validite: "2026-08-30",
    devise: "MAD",
    incoterm: "DDP Rabat",
    origine: "Maroc",
    paiement: "60 jours",
    piece: "ATL-DV-26-902.pdf",
    lignes: [
      ql("art-07", "IFC 300 (stock local)", "Krohne", 7450, 10, "Genuine", 2, 100),
      ql("art-08", "Kit joints EPDM inox", "Générique", 980, 30, "OEM", 1, 95),
    ],
  },
  {
    id: "qt-06",
    ref: "MIS-2026-2211",
    tenderId: "ao-ocp-convoyeurs",
    supplierId: "sup-maghreb",
    rfqId: "rfq-06",
    date: "2026-07-11",
    validite: "2026-08-20",
    devise: "MAD",
    incoterm: "DDP Khouribga",
    origine: "Maroc",
    paiement: "45 jours",
    piece: "MIS-2026-2211.pdf",
    lignes: [
      ql("art-09", "RLX-133-950", "SKF", 640, 240, "OEM", 3, 95),
      ql("art-12", "EP630/4 1200", "Continental", 1180, 600, "Genuine", 5, 100),
    ],
  },
  {
    id: "qt-07",
    ref: "BME-Q-26-448",
    tenderId: "ao-ocp-convoyeurs",
    supplierId: "sup-britmine",
    rfqId: "rfq-05",
    date: "2026-07-14",
    validite: "2026-08-28",
    devise: "GBP",
    incoterm: "FCA Sheffield",
    origine: "Royaume-Uni",
    paiement: "50 % / 50 %",
    piece: "BME-Q-26-448.pdf",
    lignes: [
      ql("art-09", "WM-ROL-133", "Weir", 48, 240, "Genuine", 7, 100),
      ql("art-10", "WM-DRM-800", "Weir", 4200, 6, "Genuine", 9, 100),
      ql("art-11", "WM-SCR-1200", "Weir", 690, 18, "Genuine", 7, 100),
    ],
  },
  {
    id: "qt-08",
    ref: "NL-2026-0912",
    tenderId: "ao-marsa-portique",
    supplierId: "sup-nordlift",
    rfqId: "rfq-07",
    date: "2026-07-16",
    validite: "2026-09-15",
    devise: "EUR",
    incoterm: "CIP Casablanca",
    origine: "Suède",
    paiement: "LC irrévocable",
    piece: "NL-2026-0912.pdf",
    lignes: [
      ql("art-13", "ABB-M3BP-22", "ABB", 3180, 8, "Genuine", 8, 100),
      ql("art-14", "KC-ROPE-28", "Konecranes", 62, 900, "Genuine", 6, 100),
      ql("art-15", "KC-WHL-500", "Konecranes", 1490, 16, "Genuine", 7, 100),
    ],
  },
  {
    id: "qt-09",
    ref: "TPM-26-337",
    tenderId: "ao-marsa-portique",
    supplierId: "sup-turkport",
    date: "2026-07-18",
    validite: "2026-08-31",
    devise: "USD",
    incoterm: "CFR Casablanca",
    origine: "Turquie",
    paiement: "T/T 40 % / 60 %",
    piece: "TPM-26-337.pdf",
    lignes: [
      ql("art-13", "TP-MOT-22", "TurkPort", 2650, 8, "OEM", 9, 84),
      ql("art-15", "TP-WHL-500", "Hidrokon", 1120, 16, "OEM", 8, 82),
    ],
  },
  {
    id: "qt-10",
    ref: "ATL-DV-26-915",
    tenderId: "ao-oncf-hydraulique",
    supplierId: "sup-atlas",
    rfqId: "rfq-08",
    date: "2026-07-15",
    validite: "2026-09-10",
    devise: "MAD",
    incoterm: "DDP Casablanca",
    origine: "Maroc",
    paiement: "60 jours",
    piece: "ATL-DV-26-915.pdf",
    lignes: [
      ql("art-16", "RX-CD250-125", "Rexroth", 21500, 12, "Genuine", 4, 100),
      ql("art-18", "PK-D41-4V", "Parker", 8600, 14, "Genuine", 3, 98),
      ql("art-19", "GT-4SP-20", "Gates", 720, 60, "OEM", 2, 96),
    ],
  },
  {
    id: "qt-11",
    ref: "ITM-2026-1042",
    tenderId: "ao-oncf-hydraulique",
    supplierId: "sup-italmec",
    date: "2026-07-19",
    validite: "2026-09-05",
    devise: "EUR",
    incoterm: "EXW Bergame",
    origine: "Italie",
    paiement: "30 jours",
    piece: "ITM-2026-1042.pdf",
    lignes: [
      ql("art-16", "IM-CYL-125-800", "Cifa", 1740, 12, "OEM", 6, 92),
      ql("art-17", "IM-HPU-45", "Cifa", 21800, 3, "OEM", 8, 94),
    ],
  },
  {
    id: "qt-12",
    ref: "FLI-2026-778",
    tenderId: "ao-adm-grues",
    supplierId: "sup-francelev",
    rfqId: "rfq-10",
    date: "2026-07-21",
    validite: "2026-09-20",
    devise: "EUR",
    incoterm: "DAP Casablanca",
    origine: "France",
    paiement: "45 jours",
    piece: "FLI-2026-778.pdf",
    lignes: [
      ql("art-20", "PK-12002-EH", "Palfinger", 42800, 6, "Genuine", 10, 100),
      ql("art-21", "PK-WIN-5T", "Palfinger", 7400, 6, "Genuine", 10, 100),
    ],
  },
  {
    id: "qt-13",
    ref: "EHE-26-2201",
    tenderId: "ao-adm-grues",
    supplierId: "sup-emirates",
    date: "2026-07-24",
    validite: "2026-09-10",
    devise: "USD",
    incoterm: "CFR Casablanca",
    origine: "Émirats Arabes Unis",
    paiement: "T/T 50 % / 50 %",
    piece: "EHE-26-2201.pdf",
    lignes: [ql("art-20", "TX-CRN-12TM", "Terex", 41200, 6, "OEM", 12, 88)],
  },
  {
    id: "qt-14",
    ref: "PCF-2026-119",
    tenderId: "ao-ocp-coffrage",
    supplierId: "sup-polcoff",
    date: "2026-07-26",
    validite: "2026-09-12",
    devise: "EUR",
    incoterm: "CPT Casablanca",
    origine: "Pologne",
    paiement: "30 jours",
    piece: "PCF-2026-119.pdf",
    lignes: [
      ql("art-24", "PL-WALL-270", "Peri", 268, 120, "OEM", 5, 90),
      ql("art-25", "PL-PROP-4M", "Doka", 41, 300, "OEM", 5, 92),
    ],
  },
  {
    id: "qt-15",
    ref: "APG-26-6603",
    tenderId: "ao-marsa-manut",
    supplierId: "sup-usaparts",
    date: "2026-07-28",
    validite: "2026-09-01",
    devise: "USD",
    incoterm: "CIF Agadir",
    origine: "États-Unis",
    paiement: "Prépaiement",
    piece: "APG-26-6603.pdf",
    lignes: [
      ql("art-26", "CAT-DP30N", "Caterpillar", 38900, 4, "Genuine", 14, 96),
      ql("art-27", "CAT-FRK-1200", "Caterpillar", 640, 8, "Genuine", 10, 100),
    ],
  },
];

export const COSTINGS: Costing[] = [
  {
    id: "ch-01",
    tenderId: MAIN,
    statut: "En cours",
    responsable: "Karim Ouazzani",
    updatedAt: "2026-08-24",
    selections: {
      "art-01": "sup-hydroflux",
      "art-02": "sup-hydroflux",
      "art-03": "sup-hydroflux",
      "art-04": "sup-hydroflux",
      "art-05": "sup-hydroflux",
      "art-06": "sup-hydroflux",
      "art-07": "sup-hydroflux",
      "art-08": "sup-benelux",
    },
    fees: [
      { id: "fee-1", type: "Fret", description: "Fret maritime Rotterdam → Casablanca", montant: 3200, devise: "EUR", allocation: "Prorata valeur achat" },
      { id: "fee-2", type: "Transit", description: "Transit et dédouanement Casablanca", montant: 14500, devise: "MAD", allocation: "Prorata valeur achat" },
      { id: "fee-3", type: "Banque", description: "Frais de crédit documentaire", montant: 9800, devise: "MAD", allocation: "Prorata valeur achat" },
      { id: "fee-4", type: "Assurance", description: "Assurance transport 0,35 %", montant: 4200, devise: "MAD", allocation: "Prorata valeur achat" },
      { id: "fee-5", type: "Transport local", description: "Livraison Casablanca → Rabat", montant: 6500, devise: "MAD", allocation: "Prorata poids" },
    ],
    customs: { "art-01": 2.5, "art-02": 2.5, "art-03": 2.5, "art-04": 2.5, "art-05": 2.5, "art-06": 2.5, "art-07": 2.5, "art-08": 10 },
    margeMode: "Globale",
    margeGlobale: 20,
    margesArticle: {},
    versions: [],
  },
  {
    id: "ch-02",
    tenderId: "ao-ocp-convoyeurs",
    statut: "À valider",
    responsable: "Karim Ouazzani",
    updatedAt: "2026-08-22",
    selections: { "art-09": "sup-maghreb", "art-10": "sup-britmine", "art-11": "sup-britmine", "art-12": "sup-maghreb" },
    fees: [
      { id: "fee-6", type: "Fret", description: "Fret Sheffield → Casablanca", montant: 2100, devise: "GBP", allocation: "Prorata poids" },
      { id: "fee-7", type: "Transit", description: "Transit portuaire", montant: 11200, devise: "MAD", allocation: "Prorata valeur achat" },
    ],
    customs: { "art-09": 10, "art-10": 5, "art-11": 5, "art-12": 10 },
    margeMode: "Globale",
    margeGlobale: 18,
    margesArticle: {},
    versions: [],
  },
  {
    id: "ch-03",
    tenderId: "ao-marsa-portique",
    statut: "En cours",
    responsable: "Karim Ouazzani",
    updatedAt: "2026-08-25",
    selections: { "art-13": "sup-nordlift", "art-14": "sup-nordlift", "art-15": "sup-turkport" },
    fees: [{ id: "fee-8", type: "Fret", description: "Fret Göteborg → Casablanca", montant: 4100, devise: "EUR", allocation: "Prorata valeur achat" }],
    customs: { "art-13": 2.5, "art-14": 10, "art-15": 5 },
    margeMode: "Globale",
    margeGlobale: 20,
    margesArticle: {},
    versions: [],
  },
  {
    id: "ch-04",
    tenderId: "ao-oncf-hydraulique",
    statut: "À valider",
    responsable: "Karim Ouazzani",
    updatedAt: "2026-08-26",
    selections: { "art-16": "sup-atlas", "art-17": "sup-italmec", "art-18": "sup-atlas", "art-19": "sup-atlas" },
    fees: [
      { id: "fee-9", type: "Fret", description: "Groupage Bergame → Casablanca", montant: 1850, devise: "EUR", allocation: "Prorata poids" },
      { id: "fee-10", type: "Banque", description: "Frais virement international", montant: 2400, devise: "MAD", allocation: "Prorata valeur achat" },
    ],
    customs: { "art-16": 0, "art-17": 2.5, "art-18": 0, "art-19": 0 },
    margeMode: "Globale",
    margeGlobale: 13,
    margesArticle: {},
    versions: [],
  },
  {
    id: "ch-05",
    tenderId: "ao-adm-grues",
    statut: "À préparer",
    responsable: "Karim Ouazzani",
    updatedAt: "2026-08-20",
    selections: { "art-20": "sup-francelev", "art-21": "sup-francelev" },
    fees: [],
    customs: { "art-20": 17.5, "art-21": 17.5 },
    margeMode: "Globale",
    margeGlobale: 18,
    margesArticle: {},
    versions: [],
  },
];

const ext = (
  infos: string[],
  exigences: string[],
  dates: string[],
  articles: string[],
  alertes: string[],
) => ({ infos, exigences, dates, articles, alertes });

export const DOCUMENTS: DocItem[] = [
  {
    id: "doc-01",
    nom: "Avis d'appel d'offres 24/DRC/CI/2026",
    categorie: "Dossier AO",
    type: "PDF",
    version: "V1",
    source: "Portail marchés publics",
    statut: "Validé",
    date: "2026-06-18",
    responsable: "Yassine El Mansouri",
    tenderId: MAIN,
    extraction: ext(
      ["Maître d'ouvrage : ONEE – Branche Eau", "Budget estimatif : 1 200 000 MAD TTC", "Caution provisoire : 12 000 MAD"],
      ["Dépôt électronique obligatoire", "Original de la caution exigé"],
      ["Publication : 18/06/2026", "Date limite : 23/07/2026", "Ouverture des plis : 23/07/2026"],
      ["Débitmètres électromagnétiques DN 80 à DN 450"],
      ["Signature électronique requise"],
    ),
  },
  {
    id: "doc-02",
    nom: "CPS – Cahier des prescriptions spéciales",
    categorie: "Dossier AO",
    type: "PDF",
    version: "V2",
    source: "Portail marchés publics",
    statut: "Validé",
    date: "2026-06-18",
    responsable: "Yassine El Mansouri",
    tenderId: MAIN,
    extraction: ext(
      ["Délai d'exécution : 16 semaines", "Lieu de livraison : magasin ONEE Rabat"],
      ["Matériel neuf d'origine", "Certificat d'étalonnage usine", "Variantes interdites"],
      ["Délai de garantie : 24 mois"],
      ["8 lignes de bordereau détectées"],
      ["Variante interdite", "Documentation fabricant obligatoire"],
    ),
  },
  {
    id: "doc-03",
    nom: "RCDP – Règlement de consultation",
    categorie: "Dossier AO",
    type: "PDF",
    version: "V1",
    source: "Portail marchés publics",
    statut: "Validé",
    date: "2026-06-18",
    responsable: "Nadia Cherkaoui",
    tenderId: MAIN,
    extraction: ext(["Procédure ouverte"], ["CA minimum 1 000 000 MAD", "1 référence similaire"], ["Validité des offres : 90 jours"], [], ["Original demandé"]),
  },
  {
    id: "doc-04",
    nom: "RCDG – Règlement de consultation général",
    categorie: "Dossier AO",
    type: "PDF",
    version: "V1",
    source: "Portail marchés publics",
    statut: "À vérifier",
    date: "2026-06-18",
    responsable: "Nadia Cherkaoui",
    tenderId: MAIN,
    extraction: ext(["Règles générales de passation"], ["Attestations fiscales et CNSS"], [], [], []),
  },
  {
    id: "doc-05",
    nom: "CCTP – Spécifications techniques",
    categorie: "Dossier AO",
    type: "PDF",
    version: "V1",
    source: "Portail marchés publics",
    statut: "Validé",
    date: "2026-06-18",
    responsable: "Karim Ouazzani",
    tenderId: MAIN,
    extraction: ext(["Précision ±0,3 %", "IP68"], ["Norme ISO 4064", "Protocole Modbus RTU"], [], ["DN 80, 100, 150, 200, 300, 450"], ["Documentation fabricant obligatoire"]),
  },
  {
    id: "doc-06",
    nom: "Bordereau des prix unitaires (vierge)",
    categorie: "Dossier AO",
    type: "XLSX",
    version: "V1",
    source: "Portail marchés publics",
    statut: "Validé",
    date: "2026-06-18",
    responsable: "Karim Ouazzani",
    tenderId: MAIN,
    extraction: ext(["8 lignes de prix"], ["Prix unitaires en MAD HT"], [], ["Lignes 01 à 08"], []),
  },
  {
    id: "doc-07",
    nom: "Additif n°1",
    categorie: "Dossier AO",
    type: "PDF",
    version: "V1",
    source: "Portail marchés publics",
    statut: "Manquant",
    date: "2026-07-05",
    responsable: "Yassine El Mansouri",
    tenderId: MAIN,
    extraction: ext([], [], [], [], ["Document non téléchargé"]),
  },
  {
    id: "doc-08",
    nom: "Déclaration sur l'honneur",
    categorie: "Administratif",
    type: "PDF",
    version: "V3",
    source: "PROMAT",
    statut: "Validé",
    date: "2026-07-02",
    responsable: "Nadia Cherkaoui",
    tenderId: MAIN,
    extraction: ext(["Modèle PROMAT 2026"], ["Signature du gérant"], [], [], ["Signature requise"]),
  },
  {
    id: "doc-09",
    nom: "Acte d'engagement",
    categorie: "Administratif",
    type: "DOCX",
    version: "V1",
    source: "PROMAT",
    statut: "À vérifier",
    date: "2026-07-03",
    responsable: "Nadia Cherkaoui",
    tenderId: MAIN,
    extraction: ext(["Montant à compléter"], [], [], [], ["Montant offre à reporter"]),
  },
  {
    id: "doc-10",
    nom: "Caution provisoire BMCE",
    categorie: "Administratif",
    type: "PDF",
    version: "V1",
    source: "BMCE Bank",
    statut: "Reçu",
    date: "2026-07-10",
    responsable: "Nadia Cherkaoui",
    tenderId: MAIN,
    extraction: ext(["Montant : 12 000 MAD"], [], ["Validité : 120 jours"], [], ["Original demandé"]),
  },
  {
    id: "doc-11",
    nom: "Attestation fiscale 2025",
    categorie: "Administratif",
    type: "PDF",
    version: "V1",
    source: "DGI",
    statut: "Validé",
    date: "2026-05-04",
    responsable: "Nadia Cherkaoui",
    extraction: ext(["Situation régulière"], [], ["Valable jusqu'au 31/12/2026"], [], []),
  },
  {
    id: "doc-12",
    nom: "Attestation CNSS",
    categorie: "Administratif",
    type: "PDF",
    version: "V1",
    source: "CNSS",
    statut: "Validé",
    date: "2026-06-01",
    responsable: "Nadia Cherkaoui",
    extraction: ext(["Aucune dette"], [], [], [], []),
  },
  {
    id: "doc-13",
    nom: "Fiche technique DM-450",
    categorie: "Technique",
    type: "PDF",
    version: "V2",
    source: "Krohne",
    statut: "Validé",
    date: "2026-07-08",
    responsable: "Karim Ouazzani",
    tenderId: MAIN,
    extraction: ext(["DN 450 PN 16", "IP68"], ["Alimentation 230 V AC"], [], ["art-06"], []),
  },
  {
    id: "doc-14",
    nom: "Catalogue OPTIFLUX 2300",
    categorie: "Technique",
    type: "PDF",
    version: "V1",
    source: "Krohne",
    statut: "Validé",
    date: "2026-07-08",
    responsable: "Karim Ouazzani",
    tenderId: MAIN,
    extraction: ext(["Gamme DN 25 à DN 3000"], [], [], [], []),
  },
  {
    id: "doc-15",
    nom: "Certificat de conformité eau potable",
    categorie: "Technique",
    type: "PDF",
    version: "V1",
    source: "Krohne",
    statut: "À vérifier",
    date: "2026-07-12",
    responsable: "Karim Ouazzani",
    tenderId: MAIN,
    extraction: ext(["ACS / WRAS"], ["Exigé par le CPS"], [], [], ["À confirmer pour DN 450"]),
  },
  {
    id: "doc-16",
    nom: "Certificat ISO 9001 fabricant",
    categorie: "Technique",
    type: "PDF",
    version: "V1",
    source: "Krohne",
    statut: "Validé",
    date: "2026-01-15",
    responsable: "Karim Ouazzani",
    extraction: ext(["Valide jusqu'en 2027"], [], [], [], []),
  },
  {
    id: "doc-17",
    nom: "RFQ-2026-041 – HydroFlux",
    categorie: "Fournisseurs",
    type: "PDF",
    version: "V1",
    source: "PROMAT",
    statut: "Validé",
    date: "2026-07-02",
    responsable: "Salma Bennani",
    tenderId: MAIN,
    extraction: ext(["7 articles consultés"], ["Genuine exigé"], ["Réponse attendue : 09/07/2026"], [], []),
  },
  {
    id: "doc-18",
    nom: "Devis HF-Q-2026-3311",
    categorie: "Fournisseurs",
    type: "PDF",
    version: "V1",
    source: "HydroFlux Instruments B.V.",
    statut: "Reçu",
    date: "2026-07-08",
    responsable: "Salma Bennani",
    tenderId: MAIN,
    extraction: ext(["Devise EUR", "FCA Rotterdam"], ["Validité 60 jours"], ["Validité : 08/09/2026"], ["7 lignes"], []),
  },
  {
    id: "doc-19",
    nom: "Devis IBF-2026-0774",
    categorie: "Fournisseurs",
    type: "PDF",
    version: "V1",
    source: "IberFlow Medición S.L.",
    statut: "Reçu",
    date: "2026-07-10",
    responsable: "Salma Bennani",
    tenderId: MAIN,
    extraction: ext(["Devise EUR", "EXW Bilbao"], [], ["Validité : 25/08/2026"], ["6 lignes"], ["Documentation incomplète"]),
  },
  {
    id: "doc-20",
    nom: "Devis SMT-EX-26-1188",
    categorie: "Fournisseurs",
    type: "PDF",
    version: "V1",
    source: "Shanghai MeterTech Co. Ltd",
    statut: "Reçu",
    date: "2026-07-12",
    responsable: "Salma Bennani",
    tenderId: MAIN,
    extraction: ext(["Devise USD", "FOB Shanghai"], [], ["Validité : 12/08/2026"], ["6 lignes"], ["Certificats à réclamer", "Origine hors UE"]),
  },
];

export const SAVED_SEARCHES: SavedSearch[] = [
  {
    id: "rs-01",
    nom: "Pièces de rechange – Levage",
    motsCles: ["grue", "levage", "manutention", "pièces de rechange", "Potain", "Grove", "Demag"],
    exclus: ["location", "formation"],
    familles: ["Levage", "Grues", "Pièces de rechange"],
    clients: ["ONCF", "Marsa Maroc", "ADM – Autoroutes du Maroc"],
    region: "National",
    budgetMin: 300000,
    budgetMax: 5000000,
    frequence: "Quotidien",
    derniereAnalyse: "2026-08-27",
    resultats: 14,
    statut: "Active",
  },
  {
    id: "rs-02",
    nom: "Instrumentation & débitmétrie",
    motsCles: ["débitmètre", "compteur", "instrumentation", "Krohne", "mesure"],
    exclus: ["gaz"],
    familles: ["Équipements industriels", "Hydraulique"],
    clients: ["ONEE – Branche Eau", "ONEE – Branche Électricité"],
    region: "National",
    budgetMin: 200000,
    budgetMax: 3000000,
    frequence: "Quotidien",
    derniereAnalyse: "2026-08-27",
    resultats: 9,
    statut: "Active",
  },
  {
    id: "rs-03",
    nom: "Mines & convoyeurs OCP",
    motsCles: ["convoyeur", "rouleau", "bande transporteuse", "laverie"],
    exclus: [],
    familles: ["Mines", "Manutention"],
    clients: ["OCP Group"],
    region: "National",
    budgetMin: 500000,
    budgetMax: 8000000,
    frequence: "Hebdomadaire",
    derniereAnalyse: "2026-08-24",
    resultats: 6,
    statut: "Active",
  },
  {
    id: "rs-04",
    nom: "Hydraulique industrielle",
    motsCles: ["vérin", "hydraulique", "centrale", "pompe", "distributeur"],
    exclus: ["irrigation"],
    familles: ["Hydraulique", "Pièces de rechange"],
    clients: [],
    region: "Casablanca-Settat",
    budgetMin: 150000,
    budgetMax: 2500000,
    frequence: "Hebdomadaire",
    derniereAnalyse: "2026-08-21",
    resultats: 11,
    statut: "En pause",
  },
];

export const NOTIFICATIONS: Notification[] = [
  {
    id: "nt-01",
    type: "AO",
    titre: "Nouvelle opportunité AO détectée",
    message: "AO 118/OCP/MIN/2026 correspond à la recherche « Mines & convoyeurs OCP » (score 91 %).",
    date: "2026-08-27T08:12:00",
    priorite: "Haute",
    lu: false,
    lien: "/appels-offres/ao-ocp-convoyeurs",
  },
  {
    id: "nt-02",
    type: "Échéance",
    titre: "Clôture dans 3 jours",
    message: "AO 42/MARSA/EXP/2026 — dépôt le 05/08/2026.",
    date: "2026-08-27T07:40:00",
    priorite: "Haute",
    lu: false,
    lien: "/appels-offres/ao-marsa-portique",
  },
  {
    id: "nt-03",
    type: "Fournisseur",
    titre: "Réponse fournisseur en retard",
    message: "BritMine Equipment Ltd — aucune réponse depuis 4 jours (RFQ-2026-045).",
    date: "2026-08-26T16:05:00",
    priorite: "Moyenne",
    lu: false,
    lien: "/consultations",
  },
  {
    id: "nt-04",
    type: "Marge",
    titre: "Marge critique",
    message: "Chiffrage AO 77/ONCF/MAT/2026 — marge à 13 %, sous le seuil recommandé.",
    date: "2026-08-26T11:22:00",
    priorite: "Haute",
    lu: false,
    lien: "/chiffrages/ch-04",
  },
  {
    id: "nt-05",
    type: "Chiffrage",
    titre: "Nouveau devis fournisseur moins cher",
    message: "IberFlow Medición propose −12 % sur le DN 300 (AO 24/DRC/CI/2026).",
    date: "2026-08-25T14:48:00",
    priorite: "Moyenne",
    lu: true,
    lien: "/chiffrages/ch-01",
  },
  {
    id: "nt-06",
    type: "Document",
    titre: "Fiche technique manquante",
    message: "Certificat de conformité eau potable à confirmer pour le DN 450.",
    date: "2026-08-25T09:15:00",
    priorite: "Moyenne",
    lu: true,
    lien: "/documents",
  },
];

export const ACTIVITIES: Activity[] = [
  { id: "ac-01", date: "2026-08-26T17:10:00", utilisateur: "Karim Ouazzani", action: "Marge modifiée", objet: "Chiffrage AO 77/ONCF/MAT/2026", avant: "15 %", apres: "13 %" },
  { id: "ac-02", date: "2026-08-26T10:02:00", utilisateur: "Salma Bennani", action: "Devis reçu", objet: "NL-2026-0912 — NordLift Solutions AB" },
  { id: "ac-03", date: "2026-08-25T15:33:00", utilisateur: "Karim Ouazzani", action: "Taux de change modifié", objet: "EUR", avant: "10,72", apres: "10,85" },
  { id: "ac-04", date: "2026-08-24T09:20:00", utilisateur: "Yassine El Mansouri", action: "GO validé", objet: "AO 56/MARSA/AGA/2026" },
  { id: "ac-05", date: "2026-08-22T13:47:00", utilisateur: "Salma Bennani", action: "RFQ envoyée", objet: "RFQ-2026-050 — France Levage Industrie" },
  { id: "ac-06", date: "2026-08-20T11:05:00", utilisateur: "Yassine El Mansouri", action: "Offre déposée", objet: "AO 14/ADM/MNT/2026" },
];

export const LOGO_URL = "https://promat.co/wp-content/uploads/2018/01/logo.png";
