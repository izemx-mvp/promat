import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { tenders, type Tender } from "./data";

export type CostParams = {
  rate: number;
  usdRate: number;
  fret: number;
  transit: number;
  banque: number;
  douanePct: number;
  autres: number;
};

export type OfferVersionStatus = "Brouillon" | "En révision" | "Validée";

export type OfferVersion = {
  id: string;
  label: string;
  date: string;
  by: string;
  discountLabel: string;
  total: number;
  status: OfferVersionStatus;
  globalDiscount: number;
  lineDiscounts: Record<string, number>;
  proposedQty: Record<string, number>;
};

export type OfferSend = {
  id: string;
  version: string;
  channel: "Email" | "WhatsApp";
  date: string;
  recipient: string;
  total: number;
};

export type ClientOutcome = "none" | "waiting" | "accepted" | "refused";

export type TenderState = {
  analysisValidated: boolean;
  decision: "pending" | "go" | "nogo";
  noGoReason?: string;
  articlesValidated: boolean;
  selectedSuppliers: string[];
  consultationCreated: boolean;
  offersReceived: boolean;
  retainedSupplier?: string;
  cost: CostParams;
  costValidated: boolean;
  margin: number;
  marginValidated: boolean;
  offerValidated: boolean;
  globalDiscount: number;
  lineDiscounts: Record<string, number>;
  proposedQty: Record<string, number>;
  showDiscountToClient: boolean;
  versions: OfferVersion[];
  activeVersion: string;
  sends: OfferSend[];
  clientOutcome: ClientOutcome;
};


const defaultCost: CostParams = {
  rate: 11,
  usdRate: 10.1,
  fret: 10000,
  transit: 4000,
  banque: 1500,
  douanePct: 2.5,
  autres: 1500,
};

const baseState = (t: Tender): TenderState => {
  const advanced = t.id === "marsa" || t.id === "oncf";
  return {
    analysisValidated: advanced,
    decision: advanced ? "go" : "pending",
    articlesValidated: advanced,
    selectedSuppliers: t.id === "marsa" ? ["s1", "s2", "s3"] : t.id === "oncf" ? ["s1", "s2"] : [],
    consultationCreated: advanced,
    offersReceived: t.id === "marsa",
    cost: { ...defaultCost },
    costValidated: false,
    margin: 20,
    marginValidated: false,
    offerValidated: false,
    globalDiscount: 0,
    lineDiscounts: {},
    proposedQty: {},
    showDiscountToClient: true,
    versions: [
      {
        id: "v1",
        label: "V1",
        date: "07/09/2026",
        by: "Houda Bennani",
        discountLabel: "Aucune remise",
        total: 0,
        status: "Brouillon",
        globalDiscount: 0,
        lineDiscounts: {},
        proposedQty: {},
      },
    ],

    activeVersion: "v1",
  };
};


export type AuditEntry = { time: string; who: string; action: string; tender: string; module: string };

const baseLog: AuditEntry[] = [
  { time: "10:20", who: "Yassine El Mansouri", action: "GO validé", tender: "AO ONCF", module: "Analyses" },
  { time: "11:04", who: "Salma Cherkaoui", action: "3 fournisseurs sélectionnés", tender: "AO Marsa Maroc", module: "Consultations" },
  { time: "14:16", who: "Agent Chiffrage", action: "Prix de revient recalculé", tender: "AO Marsa Maroc", module: "Chiffrages" },
  { time: "15:03", who: "Yassine El Mansouri", action: "Marge modifiée 18 % → 20 %", tender: "AO Marsa Maroc", module: "Chiffrages" },
];

type Ctx = {
  tenders: Tender[];
  states: Record<string, TenderState>;
  update: (id: string, patch: Partial<TenderState>) => void;
  log: AuditEntry[];
  addLog: (e: Omit<AuditEntry, "time">) => void;
};

const PromatContext = createContext<Ctx | null>(null);

export function PromatProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<Record<string, TenderState>>(() =>
    Object.fromEntries(tenders.map((t) => [t.id, baseState(t)])),
  );
  const [log, setLog] = useState<AuditEntry[]>(baseLog);

  const update = useCallback((id: string, patch: Partial<TenderState>) => {
    setStates((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return { ...prev, [id]: { ...current, ...patch } };
    });
  }, []);

  const addLog = useCallback((e: Omit<AuditEntry, "time">) => {
    const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setLog((prev) => [{ time, ...e }, ...prev]);
  }, []);

  const value = useMemo(
    () => ({ tenders, states, update, log, addLog }),
    [states, update, log, addLog],
  );

  return <PromatContext.Provider value={value}>{children}</PromatContext.Provider>;
}

export function usePromat() {
  const ctx = useContext(PromatContext);
  if (!ctx) throw new Error("usePromat must be used inside PromatProvider");
  return ctx;
}

export function useTender(id: string) {
  const { tenders: list, states, update, addLog } = usePromat();
  const tender = list.find((t) => t.id === id);
  const state = states[id];
  return { tender, state, update, addLog };
}

export function computeCosts(purchaseBase: number, c: CostParams) {
  const achat = purchaseBase;
  const douane = (achat * c.douanePct) / 100;
  const revient = achat + c.fret + c.transit + c.banque + douane + c.autres;
  return { achat, douane, revient };
}
