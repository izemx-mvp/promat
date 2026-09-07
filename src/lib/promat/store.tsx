import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { tenders, type Tender } from "./data";

export type CostParams = {
  rate: number;
  fret: number;
  transit: number;
  banque: number;
  assurance: number;
  douanePct: number;
  autres: number;
};

export type TenderState = {
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
  sentToCosting: boolean;
};

const defaultCost: CostParams = {
  rate: 11,
  fret: 10000,
  transit: 1800,
  banque: 900,
  assurance: 1200,
  douanePct: 2.5,
  autres: 3000,
};

const baseState = (t: Tender): TenderState => ({
  decision: t.id === "marsa" || t.id === "oncf" ? "go" : "pending",
  articlesValidated: t.id === "marsa" || t.id === "oncf",
  selectedSuppliers: t.id === "marsa" ? ["s1", "s2", "s3"] : t.id === "oncf" ? ["s1", "s2"] : [],
  consultationCreated: t.id === "marsa" || t.id === "oncf",
  offersReceived: t.id === "marsa",
  cost: { ...defaultCost },
  costValidated: false,
  margin: 20,
  marginValidated: false,
  offerValidated: false,
  sentToCosting: t.id === "marsa",
});

type Ctx = {
  tenders: Tender[];
  states: Record<string, TenderState>;
  update: (id: string, patch: Partial<TenderState>) => void;
  handoffId: string | null;
  setHandoffId: (id: string | null) => void;
};

const PromatContext = createContext<Ctx | null>(null);

export function PromatProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<Record<string, TenderState>>(() =>
    Object.fromEntries(tenders.map((t) => [t.id, baseState(t)])),
  );
  const [handoffId, setHandoffId] = useState<string | null>(null);

  const update = useCallback((id: string, patch: Partial<TenderState>) => {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const value = useMemo(
    () => ({ tenders, states, update, handoffId, setHandoffId }),
    [states, update, handoffId],
  );

  return <PromatContext.Provider value={value}>{children}</PromatContext.Provider>;
}

export function usePromat() {
  const ctx = useContext(PromatContext);
  if (!ctx) throw new Error("usePromat must be used inside PromatProvider");
  return ctx;
}

export function computeCosts(purchaseBase: number, c: CostParams) {
  const achat = purchaseBase;
  const douane = (achat * c.douanePct) / 100;
  const revient = achat + c.fret + c.transit + c.banque + c.assurance + douane + c.autres;
  return { achat, douane, revient };
}
