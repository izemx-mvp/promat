import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ACTIVITIES,
  ARTICLES,
  COSTINGS,
  DOCUMENTS,
  NOTIFICATIONS,
  QUOTES,
  RFQS,
  SAVED_SEARCHES,
  SUPPLIERS,
  TAUX_INITIAUX,
  TENDERS,
  type Activity,
  type Article,
  type Costing,
  type Devise,
  type DocItem,
  type Notification,
  type Quote,
  type Rfq,
  type SavedSearch,
  type Supplier,
  type Tender,
} from "./data";

const KEY = "promat-command-center-v1";

export interface Session {
  email: string;
  nom: string;
  role: "Administrateur" | "Responsable Commercial" | "Acheteur" | "Chiffreur";
}

export interface SavedView {
  id: string;
  nom: string;
  page: string;
  filtres: Record<string, string>;
}

export interface PromatState {
  tenders: Tender[];
  articles: Article[];
  suppliers: Supplier[];
  rfqs: Rfq[];
  quotes: Quote[];
  costings: Costing[];
  documents: DocItem[];
  searches: SavedSearch[];
  notifications: Notification[];
  activities: Activity[];
  rates: Record<Devise, number>;
  ratesManuels: Record<string, boolean>;
  views: SavedView[];
  session: Session | null;
  theme: "light" | "dark";
}

const initialState: PromatState = {
  tenders: TENDERS,
  articles: ARTICLES,
  suppliers: SUPPLIERS,
  rfqs: RFQS,
  quotes: QUOTES,
  costings: COSTINGS,
  documents: DOCUMENTS,
  searches: SAVED_SEARCHES,
  notifications: NOTIFICATIONS,
  activities: ACTIVITIES,
  rates: TAUX_INITIAUX,
  ratesManuels: {},
  views: [
    { id: "v1", nom: "Mes AO prioritaires", page: "appels-offres", filtres: { priorite: "Haute" } },
    { id: "v2", nom: "Score > 80 %", page: "appels-offres", filtres: { scoreMin: "80" } },
    { id: "v3", nom: "À décider", page: "appels-offres", filtres: { statut: "À décider" } },
  ],
  session: null,
  theme: "light",
};

interface Ctx extends PromatState {
  ready: boolean;
  login: (email: string, motDePasse: string) => Promise<void>;
  logout: () => void;
  setTheme: (t: "light" | "dark") => void;
  log: (action: string, objet: string, avant?: string, apres?: string) => void;
  notify: (n: Omit<Notification, "id" | "date" | "lu">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  updateTender: (id: string, patch: Partial<Tender>, action?: string) => void;
  addTender: (t: Tender) => void;
  updateArticle: (id: string, patch: Partial<Article>) => void;
  addArticle: (a: Article) => void;
  upsertSupplier: (s: Supplier) => void;
  deleteSupplier: (id: string) => void;
  addRfq: (r: Rfq) => void;
  updateRfq: (id: string, patch: Partial<Rfq>) => void;
  addQuote: (q: Quote) => void;
  updateCosting: (id: string, patch: Partial<Costing>, action?: string) => void;
  addCosting: (c: Costing) => void;
  setRate: (d: Devise, taux: number, manuel: boolean) => void;
  addDocument: (d: DocItem) => void;
  updateDocument: (id: string, patch: Partial<DocItem>) => void;
  addSearch: (s: SavedSearch) => void;
  updateSearch: (id: string, patch: Partial<SavedSearch>) => void;
  deleteSearch: (id: string) => void;
  addView: (v: SavedView) => void;
  reset: () => void;
}

const PromatContext = createContext<Ctx | null>(null);

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

export function PromatProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PromatState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as PromatState) });
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme]);

  const patch = useCallback((fn: (s: PromatState) => PromatState) => setState((s) => fn(s)), []);

  const log = useCallback(
    (action: string, objet: string, avant?: string, apres?: string) => {
      patch((s) => ({
        ...s,
        activities: [
          {
            id: uid("ac"),
            date: new Date().toISOString(),
            utilisateur: s.session?.nom ?? "Yassine El Mansouri",
            action,
            objet,
            avant,
            apres,
          },
          ...s.activities,
        ],
      }));
    },
    [patch],
  );

  const value: Ctx = useMemo(
    () => ({
      ...state,
      ready,
      login: async (email, motDePasse) => {
        await new Promise((r) => setTimeout(r, 700));
        if (!email.trim() || !motDePasse.trim()) throw new Error("Identifiants requis");
        patch((s) => ({
          ...s,
          session: { email, nom: "Yassine El Mansouri", role: "Responsable Commercial" },
        }));
      },
      logout: () => patch((s) => ({ ...s, session: null })),
      setTheme: (theme) => patch((s) => ({ ...s, theme })),
      log,
      notify: (n) =>
        patch((s) => ({
          ...s,
          notifications: [{ ...n, id: uid("nt"), date: new Date().toISOString(), lu: false }, ...s.notifications],
        })),
      markRead: (id) =>
        patch((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, lu: true } : n)) })),
      markAllRead: () => patch((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, lu: true })) })),
      updateTender: (id, p) =>
        patch((s) => ({ ...s, tenders: s.tenders.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
      addTender: (t) => patch((s) => ({ ...s, tenders: [t, ...s.tenders] })),
      updateArticle: (id, p) =>
        patch((s) => ({ ...s, articles: s.articles.map((a) => (a.id === id ? { ...a, ...p } : a)) })),
      addArticle: (a) => patch((s) => ({ ...s, articles: [...s.articles, a] })),
      upsertSupplier: (sup) =>
        patch((s) => ({
          ...s,
          suppliers: s.suppliers.some((x) => x.id === sup.id)
            ? s.suppliers.map((x) => (x.id === sup.id ? sup : x))
            : [sup, ...s.suppliers],
        })),
      deleteSupplier: (id) => patch((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x.id !== id) })),
      addRfq: (r) => patch((s) => ({ ...s, rfqs: [r, ...s.rfqs] })),
      updateRfq: (id, p) => patch((s) => ({ ...s, rfqs: s.rfqs.map((r) => (r.id === id ? { ...r, ...p } : r)) })),
      addQuote: (q) => patch((s) => ({ ...s, quotes: [q, ...s.quotes] })),
      updateCosting: (id, p) =>
        patch((s) => ({
          ...s,
          costings: s.costings.map((c) =>
            c.id === id ? { ...c, ...p, updatedAt: new Date().toISOString().slice(0, 10) } : c,
          ),
        })),
      addCosting: (c) => patch((s) => ({ ...s, costings: [c, ...s.costings] })),
      setRate: (d, taux, manuel) =>
        patch((s) => ({ ...s, rates: { ...s.rates, [d]: taux }, ratesManuels: { ...s.ratesManuels, [d]: manuel } })),
      addDocument: (d) => patch((s) => ({ ...s, documents: [d, ...s.documents] })),
      updateDocument: (id, p) =>
        patch((s) => ({ ...s, documents: s.documents.map((d) => (d.id === id ? { ...d, ...p } : d)) })),
      addSearch: (sr) => patch((s) => ({ ...s, searches: [sr, ...s.searches] })),
      updateSearch: (id, p) =>
        patch((s) => ({ ...s, searches: s.searches.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      deleteSearch: (id) => patch((s) => ({ ...s, searches: s.searches.filter((x) => x.id !== id) })),
      addView: (v) => patch((s) => ({ ...s, views: [...s.views, v] })),
      reset: () => setState({ ...initialState, session: state.session, theme: state.theme }),
    }),
    [state, ready, patch, log],
  );

  return <PromatContext.Provider value={value}>{children}</PromatContext.Provider>;
}

export function usePromat() {
  const ctx = useContext(PromatContext);
  if (!ctx) throw new Error("usePromat doit être utilisé dans PromatProvider");
  return ctx;
}

export const newId = uid;
