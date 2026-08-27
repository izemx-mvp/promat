import type { Article, Costing, Devise, Fee, Quote, Supplier } from "./data";

export interface CostLine {
  articleId: string;
  article: Article;
  supplierId?: string;
  supplier?: Supplier;
  quote?: Quote;
  pu: number;
  devise: Devise;
  taux: number;
  qte: number;
  achatMAD: number;
  douaneTaux: number;
  douane: number;
  fret: number;
  transit: number;
  banque: number;
  assurance: number;
  transportLocal: number;
  divers: number;
  fraisTotal: number;
  prTotal: number;
  prUnitaire: number;
  marge: number; // %
  margeMAD: number;
  pvu: number;
  totalHT: number;
  conformite: number;
  delai: number;
  genuine: string;
}

export interface CostTotals {
  achats: number;
  frais: number;
  douane: number;
  prixRevient: number;
  venteHT: number;
  margeBrute: number;
  margeMoyenne: number;
}

const FEE_BUCKET: Record<string, keyof CostLine> = {
  Fret: "fret",
  Transit: "transit",
  Banque: "banque",
  Assurance: "assurance",
  Manutention: "divers",
  "Transport local": "transportLocal",
  Inspection: "divers",
  Divers: "divers",
};

export function quoteFor(quotes: Quote[], articleId: string, supplierId?: string) {
  if (!supplierId) return undefined;
  return quotes.find((q) => q.supplierId === supplierId && q.lignes.some((l) => l.articleId === articleId));
}

export function computeCosting(
  articles: Article[],
  costing: Costing,
  quotes: Quote[],
  suppliers: Supplier[],
  rates: Record<Devise, number>,
): { lines: CostLine[]; totals: CostTotals } {
  const base: CostLine[] = articles.map((article) => {
    const supplierId = costing.selections[article.id];
    const supplier = suppliers.find((s) => s.id === supplierId);
    const quote = quoteFor(quotes, article.id, supplierId);
    const ligne = quote?.lignes.find((l) => l.articleId === article.id);
    const devise = (quote?.devise ?? "MAD") as Devise;
    const taux = rates[devise] ?? 1;
    const pu = ligne?.pu ?? 0;
    const qte = article.qte;
    const achatMAD = pu * qte * taux;
    const douaneTaux = costing.customs[article.id] ?? 0;
    return {
      articleId: article.id,
      article,
      supplierId,
      supplier,
      quote,
      pu,
      devise,
      taux,
      qte,
      achatMAD,
      douaneTaux,
      douane: (achatMAD * douaneTaux) / 100,
      fret: 0,
      transit: 0,
      banque: 0,
      assurance: 0,
      transportLocal: 0,
      divers: 0,
      fraisTotal: 0,
      prTotal: 0,
      prUnitaire: 0,
      marge: 0,
      margeMAD: 0,
      pvu: 0,
      totalHT: 0,
      conformite: ligne?.conformite ?? 0,
      delai: ligne?.delaiSemaines ?? 0,
      genuine: ligne?.genuine ?? "—",
    } as CostLine;
  });

  const totalAchat = base.reduce((s, l) => s + l.achatMAD, 0) || 1;
  const totalQte = base.reduce((s, l) => s + l.qte, 0) || 1;
  const totalPoids = base.reduce((s, l) => s + l.qte * (l.article.poidsKg || 0), 0) || 1;

  const applyFee = (fee: Fee) => {
    const montantMAD = fee.montant * (rates[fee.devise] ?? 1);
    const bucket = (FEE_BUCKET[fee.type] ?? "divers") as
      | "fret"
      | "transit"
      | "banque"
      | "assurance"
      | "transportLocal"
      | "divers";
    if (fee.articleId) {
      const line = base.find((l) => l.articleId === fee.articleId);
      if (line) line[bucket] += montantMAD;
      return;
    }
    base.forEach((l) => {
      let part = 0;
      switch (fee.allocation) {
        case "Prorata quantité":
          part = l.qte / totalQte;
          break;
        case "Prorata poids":
          part = (l.qte * (l.article.poidsKg || 0)) / totalPoids;
          break;
        case "Montant fixe":
        case "Répartition manuelle":
          part = 1 / base.length;
          break;
        default:
          part = l.achatMAD / totalAchat;
      }
      l[bucket] += montantMAD * part;
    });
  };
  costing.fees.forEach(applyFee);

  base.forEach((l) => {
    l.fraisTotal = l.fret + l.transit + l.banque + l.assurance + l.transportLocal + l.divers;
    l.prTotal = l.achatMAD + l.douane + l.fraisTotal;
    l.prUnitaire = l.qte ? l.prTotal / l.qte : 0;
    const m = costing.margeMode === "Par article" ? (costing.margesArticle[l.articleId] ?? costing.margeGlobale) : costing.margeGlobale;
    l.marge = m;
    l.pvu = l.prUnitaire * (1 + m / 100);
    l.totalHT = l.pvu * l.qte;
    l.margeMAD = l.totalHT - l.prTotal;
  });

  const totals: CostTotals = {
    achats: base.reduce((s, l) => s + l.achatMAD, 0),
    frais: base.reduce((s, l) => s + l.fraisTotal, 0),
    douane: base.reduce((s, l) => s + l.douane, 0),
    prixRevient: base.reduce((s, l) => s + l.prTotal, 0),
    venteHT: base.reduce((s, l) => s + l.totalHT, 0),
    margeBrute: base.reduce((s, l) => s + l.margeMAD, 0),
    margeMoyenne: 0,
  };
  totals.margeMoyenne = totals.venteHT ? (totals.margeBrute / totals.venteHT) * 100 : 0;
  return { lines: base, totals };
}

export interface SupplierEval {
  supplier: Supplier;
  quote: Quote;
  score: number;
  raisons: string[];
  coutRenduMAD: number;
}

/** Recommandation multi-critères (jamais uniquement le prix). */
export function recommendSupplier(
  article: Article,
  quotes: Quote[],
  suppliers: Supplier[],
  rates: Record<Devise, number>,
  customsRate: number,
): SupplierEval | undefined {
  const candidats: SupplierEval[] = [];
  quotes.forEach((q) => {
    const ligne = q.lignes.find((l) => l.articleId === article.id);
    const sup = suppliers.find((s) => s.id === q.supplierId);
    if (!ligne || !sup) return;
    const coutRendu = ligne.pu * article.qte * (rates[q.devise] ?? 1) * (1 + customsRate / 100);
    candidats.push({ supplier: sup, quote: q, score: 0, raisons: [], coutRenduMAD: coutRendu });
  });
  if (!candidats.length) return undefined;
  const minCout = Math.min(...candidats.map((c) => c.coutRenduMAD));
  candidats.forEach((c) => {
    const ligne = c.quote.lignes.find((l) => l.articleId === article.id)!;
    const prixScore = (minCout / c.coutRenduMAD) * 32;
    const confScore = (ligne.conformite / 100) * 26;
    const delaiScore = Math.max(0, 14 - Math.max(0, ligne.delaiSemaines - 4) * 1.6);
    const genuineScore = ligne.genuine === "Genuine" ? 10 : 5;
    const fiabScore = (c.supplier.fiabilite / 100) * 12;
    const reponseScore = (c.supplier.tauxReponse / 100) * 6;
    c.score = Math.round(prixScore + confScore + delaiScore + genuineScore + fiabScore + reponseScore);
    c.raisons = [
      `Conformité technique ${ligne.conformite} %`,
      ligne.genuine === "Genuine" ? "Pièce d'origine (Genuine)" : "Équivalent OEM",
      `Délai ${ligne.delaiSemaines} semaines`,
      c.coutRenduMAD === minCout ? "Coût rendu le plus compétitif" : `Coût rendu +${Math.round(((c.coutRenduMAD - minCout) / minCout) * 100)} % vs meilleur`,
      `Fiabilité historique ${c.supplier.fiabilite} %`,
      `Incoterm ${c.quote.incoterm} — origine ${c.quote.origine}`,
    ];
  });
  return candidats.sort((a, b) => b.score - a.score)[0];
}

export const fmtMAD = (n: number, decimals = 2) =>
  new Intl.NumberFormat("fr-MA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(
    Number.isFinite(n) ? n : 0,
  );

export const fmtInt = (n: number) => new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (d?: string) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
