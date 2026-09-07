export type TenderStatus =
  | "À analyser"
  | "Décision requise"
  | "En consultation"
  | "Prêt pour chiffrage"
  | "Chiffrage en cours"
  | "Offre validée";

export type Article = {
  id: string;
  ref: string;
  designation: string;
  qty: number;
  unit: string;
  specs: string;
  status: "Validé" | "À vérifier";
  fullSpec: string[];
  source: string;
  history: string;
  prevSupplier: string;
  prevPrice: string;
};

export type Supplier = {
  id: string;
  name: string;
  country: string;
  match: number;
  kind: string;
  delay: string;
  lastConsult?: string;
  why: { compat: string; history: string; response: string; price: string };
};

export type SupplierOffer = {
  articleId: string;
  supplierId: string;
  price: number; // EUR unit price
  kind: string;
  delay: string;
  incoterm: string;
  origin: string;
  compliance: string;
};

export type Tender = {
  id: string;
  client: string;
  reference: string;
  title: string;
  object: string;
  deadline: string;
  deadlineLong: string;
  budget: string;
  caution: string;
  status: TenderStatus;
  score: number;
  recommendation: "GO recommandé" | "À arbitrer";
  demand: string[];
  vigilance: { tone: "warn" | "ok"; text: string }[];
  matrix: { label: string; value: string; tone: "ok" | "warn" }[];
  aiComment: string;
  articles: Article[];
  suppliers: Supplier[];
  offers: SupplierOffer[];
  purchaseBase: number; // MAD achat fournisseur (démo)
};

const oneeArticles: Article[] = [
  {
    id: "a1",
    ref: "001",
    designation: "Débitmètre électromagnétique DN600",
    qty: 2,
    unit: "U",
    specs: "PN25 · IP67+ · Bidirectionnel",
    status: "Validé",
    fullSpec: [
      "Diamètre nominal DN600, bride PN25",
      "Protection IP67 minimum, immersion temporaire",
      "Mesure bidirectionnelle, précision ±0,4 %",
      "Convertisseur séparé, sortie 4-20 mA + Modbus",
    ],
    source: "CPS – Article 4.2, page 18",
    history: "AO ONEE 2024 – Secteur Casablanca (2 unités)",
    prevSupplier: "FlowTech",
    prevPrice: "4 050 EUR",
  },
  {
    id: "a2",
    ref: "002",
    designation: "Débitmètre électromagnétique DN400",
    qty: 4,
    unit: "U",
    specs: "PN16 · IP68 · Convertisseur séparé",
    status: "Validé",
    fullSpec: [
      "Diamètre nominal DN400, bride PN16",
      "Protection IP68 (enterré)",
      "Sortie impulsions + 4-20 mA",
    ],
    source: "CPS – Article 4.3, page 19",
    history: "AO ONEE 2023 – Secteur Settat (6 unités)",
    prevSupplier: "HydroTech",
    prevPrice: "2 380 EUR",
  },
  {
    id: "a3",
    ref: "003",
    designation: "Débitmètre électromagnétique DN200",
    qty: 3,
    unit: "U",
    specs: "PN16 · IP68 · Alimentation 230 V",
    status: "Validé",
    fullSpec: ["DN200 PN16", "Revêtement ébonite", "Électrodes Hastelloy C"],
    source: "CPS – Article 4.4, page 20",
    history: "Aucune référence identique",
    prevSupplier: "EuroFlow",
    prevPrice: "1 640 EUR",
  },
  {
    id: "a4",
    ref: "004",
    designation: "Convertisseur de mesure déporté",
    qty: 9,
    unit: "U",
    specs: "Modbus RTU · Afficheur local",
    status: "Validé",
    fullSpec: ["Montage mural", "Modbus RTU", "Journalisation interne 30 jours"],
    source: "CPS – Article 5.1, page 22",
    history: "AO ONEE 2024",
    prevSupplier: "FlowTech",
    prevPrice: "780 EUR",
  },
  {
    id: "a5",
    ref: "005",
    designation: "Kit de câblage blindé 25 m",
    qty: 9,
    unit: "Kit",
    specs: "Blindé · Presse-étoupe IP68",
    status: "Validé",
    fullSpec: ["Câble blindé 25 m", "Presse-étoupes IP68 fournis"],
    source: "CPS – Article 5.2",
    history: "Standard PROMAT",
    prevSupplier: "FlowTech",
    prevPrice: "210 EUR",
  },
  {
    id: "a6",
    ref: "006",
    designation: "Manchettes de raccordement DN600",
    qty: 2,
    unit: "U",
    specs: "Acier revêtu · PN25",
    status: "Validé",
    fullSpec: ["Acier revêtu époxy", "PN25"],
    source: "CPS – Article 5.3",
    history: "AO ONCF 2024",
    prevSupplier: "MecaFlux",
    prevPrice: "620 EUR",
  },
  {
    id: "a7",
    ref: "007",
    designation: "Boîtier de protection anti-vandalisme",
    qty: 9,
    unit: "U",
    specs: "Inox 304 · Serrure triangle",
    status: "Validé",
    fullSpec: ["Inox 304", "Serrure triangle ONEE"],
    source: "CPS – Article 5.4",
    history: "Standard ONEE",
    prevSupplier: "MecaFlux",
    prevPrice: "340 EUR",
  },
  {
    id: "a8",
    ref: "008",
    designation: "Mise en service et étalonnage sur site",
    qty: 9,
    unit: "Pce",
    specs: "Certificat d'étalonnage usine requis",
    status: "À vérifier",
    fullSpec: ["Étalonnage usine 3 points", "PV de mise en service ONEE"],
    source: "CPS – Article 7.1",
    history: "Prestation sous-traitée en 2024",
    prevSupplier: "HydroTech",
    prevPrice: "450 EUR",
  },
  {
    id: "a9",
    ref: "009",
    designation: "Formation exploitants (2 jours)",
    qty: 1,
    unit: "Lot",
    specs: "Support en français · 8 personnes",
    status: "Validé",
    fullSpec: ["2 jours sur site", "Support FR"],
    source: "CPS – Article 7.2",
    history: "AO ONEE 2023",
    prevSupplier: "PROMAT",
    prevPrice: "2 000 EUR",
  },
  {
    id: "a10",
    ref: "010",
    designation: "Pièces de rechange (lot 2 ans)",
    qty: 1,
    unit: "Lot",
    specs: "Électrodes · joints · fusibles",
    status: "Validé",
    fullSpec: ["Liste PDR 2 ans", "Stock recommandé fabricant"],
    source: "CPS – Article 8.1",
    history: "Standard fabricant",
    prevSupplier: "FlowTech",
    prevPrice: "3 100 EUR",
  },
  {
    id: "a11",
    ref: "011",
    designation: "Documentation technique fabricant",
    qty: 1,
    unit: "Lot",
    specs: "FR · 3 exemplaires + numérique",
    status: "Validé",
    fullSpec: ["Notices FR", "3 exemplaires papier + USB"],
    source: "CPS – Article 9",
    history: "Standard",
    prevSupplier: "FlowTech",
    prevPrice: "0 EUR",
  },
  {
    id: "a12",
    ref: "012",
    designation: "Transport et livraison sites Settat",
    qty: 1,
    unit: "Lot",
    specs: "3 sites · déchargement inclus",
    status: "À vérifier",
    fullSpec: ["Livraison Settat / Berrechid / Benslimane", "Déchargement inclus"],
    source: "CPS – Article 6",
    history: "Transporteur habituel",
    prevSupplier: "TransMaroc",
    prevPrice: "9 500 EUR",
  },
];

const oneeSuppliers: Supplier[] = [
  {
    id: "s1",
    name: "FlowTech Germany",
    country: "Allemagne",
    match: 94,
    kind: "Genuine",
    delay: "4 sem.",
    lastConsult: "2025",
    why: {
      compat: "Gamme DN200–DN600 PN25 entièrement couverte.",
      history: "4 consultations PROMAT, 3 commandes livrées conformes.",
      response: "Réponse moyenne : 3 jours.",
      price: "Prix moyen 6 % au-dessus du marché, remise volume habituelle.",
    },
  },
  {
    id: "s2",
    name: "HydroTech France",
    country: "France",
    match: 89,
    kind: "OEM / Genuine",
    delay: "5 sem.",
    lastConsult: "2024",
    why: {
      compat: "Couvre DN400 et DN200, DN600 sur commande spéciale.",
      history: "2 consultations, 1 commande avec retard de 2 semaines.",
      response: "Réponse moyenne : 5 jours.",
      price: "Le plus compétitif sur les DN moyens.",
    },
  },
  {
    id: "s3",
    name: "EuroFlow Turkey",
    country: "Turquie",
    match: 82,
    kind: "Genuine",
    delay: "3 sem.",
    lastConsult: "2025",
    why: {
      compat: "Gamme complète, certificats à confirmer pour ONEE.",
      history: "1 consultation, pas encore de commande.",
      response: "Réponse moyenne : 2 jours.",
      price: "Prix élevés mais délais courts.",
    },
  },
  {
    id: "s4",
    name: "MecaFlux Maroc",
    country: "Maroc",
    match: 76,
    kind: "Accessoires",
    delay: "2 sem.",
    lastConsult: "2025",
    why: {
      compat: "Manchettes, boîtiers et accessoires mécaniques.",
      history: "Fournisseur local régulier.",
      response: "Réponse moyenne : 1 jour.",
      price: "Très compétitif sur les accessoires.",
    },
  },
  {
    id: "s5",
    name: "AquaSense Italy",
    country: "Italie",
    match: 71,
    kind: "OEM",
    delay: "6 sem.",
    why: {
      compat: "Compatible DN200–DN400 uniquement.",
      history: "Aucun historique PROMAT.",
      response: "Réponse moyenne : 7 jours.",
      price: "Positionnement bas de gamme.",
    },
  },
];

const oneeOffers: SupplierOffer[] = [
  ["a1", "s1", 4200, "Genuine", "4 sem."],
  ["a1", "s2", 3950, "OEM", "7 sem."],
  ["a1", "s3", 4500, "Genuine", "3 sem."],
  ["a2", "s1", 2450, "Genuine", "4 sem."],
  ["a2", "s2", 2280, "OEM", "6 sem."],
  ["a2", "s3", 2600, "Genuine", "3 sem."],
  ["a3", "s1", 1720, "Genuine", "4 sem."],
  ["a3", "s2", 1610, "OEM", "6 sem."],
  ["a3", "s3", 1780, "Genuine", "3 sem."],
  ["a4", "s1", 810, "Genuine", "4 sem."],
  ["a4", "s2", 760, "OEM", "6 sem."],
  ["a4", "s3", 890, "Genuine", "3 sem."],
].map(([articleId, supplierId, price, kind, delay]) => ({
  articleId: articleId as string,
  supplierId: supplierId as string,
  price: price as number,
  kind: kind as string,
  delay: delay as string,
  incoterm: supplierId === "s3" ? "FOB Istanbul" : "CIF Casablanca",
  origin:
    supplierId === "s1" ? "Allemagne" : supplierId === "s2" ? "France" : "Turquie",
  compliance: supplierId === "s3" ? "À confirmer" : "Conforme",
}));

export const tenders: Tender[] = [
  {
    id: "onee",
    client: "ONEE – Branche Eau",
    reference: "AO 24/DRC/CI/2026",
    title: "Débitmètres électromagnétiques",
    object:
      "Acquisition de débitmètres électromagnétiques pour le secteur de production Settat – Berrechid – Benslimane",
    deadline: "23 juil.",
    deadlineLong: "23 juillet 2026",
    budget: "1 200 000 MAD TTC",
    caution: "12 000 MAD",
    status: "Décision requise",
    score: 88,
    recommendation: "GO recommandé",
    demand: [
      "Fourniture de débitmètres électromagnétiques",
      "Documentation technique fabricant requise",
      "Références similaires demandées",
      "Respect des spécifications techniques du dossier",
    ],
    vigilance: [
      { tone: "warn", text: "Références similaires à confirmer" },
      { tone: "warn", text: "Validation technique fabricant nécessaire" },
      { tone: "ok", text: "Caution compatible" },
    ],
    matrix: [
      { label: "Chiffre d'affaires", value: "Conforme", tone: "ok" },
      { label: "Références similaires", value: "À confirmer", tone: "warn" },
      { label: "Capacité technique", value: "Conforme", tone: "ok" },
      { label: "Caution", value: "Conforme", tone: "ok" },
      { label: "Délai", value: "Compatible", tone: "ok" },
    ],
    aiComment:
      "Le dossier semble compatible avec les capacités PROMAT. Deux points restent à valider avant engagement.",
    articles: oneeArticles,
    suppliers: oneeSuppliers,
    offers: oneeOffers,
    purchaseBase: 92400,
  },
  {
    id: "ocp",
    client: "OCP Group",
    reference: "AO 118/OCP/2026",
    title: "Vannes automatiques de régulation",
    object: "Fourniture de vannes automatiques de régulation pour laveries phosphatières",
    deadline: "05 août",
    deadlineLong: "5 août 2026",
    budget: "2 450 000 MAD TTC",
    caution: "25 000 MAD",
    status: "À analyser",
    score: 74,
    recommendation: "À arbitrer",
    demand: [
      "Fourniture de vannes de régulation DN80 à DN300",
      "Certificats matière obligatoires",
      "Mise en service sur site Khouribga",
      "Garantie 24 mois",
    ],
    vigilance: [
      { tone: "warn", text: "Délai de livraison très court" },
      { tone: "warn", text: "Certificats matière à obtenir du fabricant" },
      { tone: "ok", text: "Chiffre d'affaires conforme" },
    ],
    matrix: [
      { label: "Chiffre d'affaires", value: "Conforme", tone: "ok" },
      { label: "Références similaires", value: "Conforme", tone: "ok" },
      { label: "Capacité technique", value: "À confirmer", tone: "warn" },
      { label: "Caution", value: "Conforme", tone: "ok" },
      { label: "Délai", value: "Tendu", tone: "warn" },
    ],
    aiComment:
      "Opportunité intéressante mais le délai de livraison exigé реste le principal risque.",
    articles: oneeArticles.slice(0, 6),
    suppliers: oneeSuppliers.slice(0, 4),
    offers: oneeOffers.slice(0, 6),
    purchaseBase: 186000,
  },
  {
    id: "oncf",
    client: "ONCF",
    reference: "AO 07/ONCF/MT/2026",
    title: "Capteurs de pression ferroviaires",
    object: "Acquisition de capteurs de pression pour ateliers de maintenance",
    deadline: "12 août",
    deadlineLong: "12 août 2026",
    budget: "680 000 MAD TTC",
    caution: "7 000 MAD",
    status: "En consultation",
    score: 81,
    recommendation: "GO recommandé",
    demand: [
      "Capteurs de pression 0-40 bar",
      "Étalonnage certifié",
      "Livraison Casablanca et Fès",
      "Formation courte des techniciens",
    ],
    vigilance: [
      { tone: "ok", text: "Références similaires disponibles" },
      { tone: "warn", text: "Étalonnage certifié à confirmer" },
      { tone: "ok", text: "Caution compatible" },
    ],
    matrix: [
      { label: "Chiffre d'affaires", value: "Conforme", tone: "ok" },
      { label: "Références similaires", value: "Conforme", tone: "ok" },
      { label: "Capacité technique", value: "Conforme", tone: "ok" },
      { label: "Caution", value: "Conforme", tone: "ok" },
      { label: "Délai", value: "Compatible", tone: "ok" },
    ],
    aiComment: "Dossier standard, marge attendue conforme aux objectifs PROMAT.",
    articles: oneeArticles.slice(0, 5),
    suppliers: oneeSuppliers.slice(0, 3),
    offers: oneeOffers.slice(0, 6),
    purchaseBase: 51200,
  },
  {
    id: "marsa",
    client: "Marsa Maroc",
    reference: "AO 32/MM/TC/2026",
    title: "Groupes hydrauliques portuaires",
    object: "Fourniture de groupes hydrauliques pour équipements de manutention portuaire",
    deadline: "29 juil.",
    deadlineLong: "29 juillet 2026",
    budget: "1 850 000 MAD TTC",
    caution: "18 500 MAD",
    status: "Prêt pour chiffrage",
    score: 79,
    recommendation: "GO recommandé",
    demand: [
      "Groupes hydrauliques 30 kW",
      "Protection milieu salin",
      "Intervention sur site Casablanca",
      "Pièces de rechange 2 ans",
    ],
    vigilance: [
      { tone: "warn", text: "Environnement salin : traitement spécifique" },
      { tone: "ok", text: "Historique fournisseur solide" },
      { tone: "ok", text: "Caution compatible" },
    ],
    matrix: [
      { label: "Chiffre d'affaires", value: "Conforme", tone: "ok" },
      { label: "Références similaires", value: "Conforme", tone: "ok" },
      { label: "Capacité technique", value: "Conforme", tone: "ok" },
      { label: "Caution", value: "Conforme", tone: "ok" },
      { label: "Délai", value: "Compatible", tone: "ok" },
    ],
    aiComment: "Dossier prêt pour le chiffrage, trois offres fournisseurs comparables.",
    articles: oneeArticles.slice(0, 7),
    suppliers: oneeSuppliers.slice(0, 4),
    offers: oneeOffers,
    purchaseBase: 142500,
  },
];

export const noGoReasons = [
  "Non éligible",
  "Délai insuffisant",
  "Sourcing impossible",
  "Risque technique",
  "Rentabilité estimée insuffisante",
  "Autre",
];

export const fmtMAD = (n: number) =>
  `${Math.round(n).toLocaleString("fr-FR").replace(/\u202f/g, " ")} MAD`;

export const fmtNum = (n: number, d = 0) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
