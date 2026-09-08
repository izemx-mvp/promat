import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* --------------------------------------------------------------- entities */

export type Fournisseur = {
  id: string;
  name: string;
  country: string;
  brands: string;
  families: string;
  response: string;
  score: number;
  updatedAt: string;
};

export type ArticleRef = {
  id: string;
  ref: string;
  mfr: string;
  designation: string;
  brand: string;
  family: string;
  suppliers: string;
  last: string;
  date: string;
  tenders: string;
  variation: number;
  updatedAt: string;
};

export type Utilisateur = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  active: boolean;
  last: string;
  updatedAt: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  kind: "opportunite" | "decision" | "document" | "echeance";
  to: string;
  read: boolean;
  time: string;
};

export const roles = [
  "Administrateur",
  "Responsable Commercial",
  "Commercial",
  "Acheteur / Sourcing",
  "Chiffreur",
  "Direction",
  "Lecture seule",
];

export const permissionList = [
  "Voir les AO",
  "Créer un AO",
  "Valider GO / NO GO",
  "Modifier les articles",
  "Lancer une consultation",
  "Voir les prix fournisseurs",
  "Sélectionner un fournisseur",
  "Modifier le chiffrage",
  "Modifier la marge",
  "Valider l'offre finale",
  "Exporter les offres",
  "Configurer les agents",
  "Gérer les utilisateurs",
];

export const defaultMatrix: Record<string, string[]> = {
  Administrateur: [...permissionList],
  "Responsable Commercial": permissionList.filter(
    (p) => !["Configurer les agents", "Gérer les utilisateurs"].includes(p),
  ),
  Commercial: [
    "Voir les AO",
    "Créer un AO",
    "Modifier les articles",
    "Lancer une consultation",
    "Voir les prix fournisseurs",
  ],
  "Acheteur / Sourcing": [
    "Voir les AO",
    "Modifier les articles",
    "Lancer une consultation",
    "Voir les prix fournisseurs",
    "Sélectionner un fournisseur",
  ],
  Chiffreur: [
    "Voir les AO",
    "Voir les prix fournisseurs",
    "Modifier le chiffrage",
    "Modifier la marge",
    "Exporter les offres",
  ],
  Direction: [
    "Voir les AO",
    "Valider GO / NO GO",
    "Voir les prix fournisseurs",
    "Modifier la marge",
    "Valider l'offre finale",
    "Exporter les offres",
  ],
  "Lecture seule": ["Voir les AO"],
};

/* ------------------------------------------------------------------- seed */

const now = "08/09/2026";

const seedFournisseurs: Fournisseur[] = [
  { id: "f1", name: "FlowTech Germany", country: "Allemagne", brands: "FlowTech, Endress", families: "Instrumentation, débitmétrie", response: "3 jours", score: 92, updatedAt: now },
  { id: "f2", name: "HydroTech France", country: "France", brands: "HydroTech, Sofrel", families: "Débitmétrie, télégestion", response: "5 jours", score: 84, updatedAt: now },
  { id: "f3", name: "EuroFlow Turkey", country: "Turquie", brands: "EuroFlow", families: "Débitmétrie, vannes", response: "2 jours", score: 78, updatedAt: now },
  { id: "f4", name: "MecaFlux Maroc", country: "Maroc", brands: "MecaFlux, Grove", families: "Accessoires mécaniques, levage", response: "1 jour", score: 81, updatedAt: now },
  { id: "f5", name: "AquaSense Italy", country: "Italie", brands: "AquaSense", families: "Capteurs, instrumentation", response: "7 jours", score: 66, updatedAt: now },
];

const seedArticles: ArticleRef[] = [
  { id: "a1", ref: "PRM-DEB-600", mfr: "FT-EM600-PN25", designation: "Débitmètre électromagnétique DN600", brand: "FlowTech", family: "Débitmétrie", suppliers: "FlowTech, HydroTech", last: "4 050 EUR", date: "11/2025", tenders: "ONEE 2024, ONEE 2026", variation: 11.1, updatedAt: now },
  { id: "a2", ref: "PRM-DEB-400", mfr: "HT-EM400", designation: "Débitmètre électromagnétique DN400", brand: "HydroTech", family: "Débitmétrie", suppliers: "HydroTech, EuroFlow", last: "2 380 EUR", date: "06/2025", tenders: "ONEE 2023", variation: -4.2, updatedAt: now },
  { id: "a3", ref: "PRM-CVT-001", mfr: "FT-CVT-RTU", designation: "Convertisseur de mesure déporté", brand: "FlowTech", family: "Instrumentation", suppliers: "FlowTech", last: "780 EUR", date: "11/2025", tenders: "ONEE 2024", variation: 3.8, updatedAt: now },
  { id: "a4", ref: "PRM-MAN-600", mfr: "MF-MAN600", designation: "Manchettes de raccordement DN600", brand: "MecaFlux", family: "Accessoires", suppliers: "MecaFlux", last: "620 EUR", date: "03/2025", tenders: "ONCF 2024", variation: 0, updatedAt: now },
];

const seedUtilisateurs: Utilisateur[] = [
  { id: "u1", name: "Yassine El Mansouri", email: "yassine@promat.ma", role: "Responsable Commercial", team: "Commercial", active: true, last: "Aujourd'hui 09:12", updatedAt: now },
  { id: "u2", name: "Houda Bennani", email: "houda@promat.ma", role: "Commercial", team: "Commercial", active: true, last: "Aujourd'hui 10:04", updatedAt: now },
  { id: "u3", name: "Salma Cherkaoui", email: "salma@promat.ma", role: "Acheteur / Sourcing", team: "Sourcing", active: true, last: "Hier 17:40", updatedAt: now },
  { id: "u4", name: "Omar Idrissi", email: "omar@promat.ma", role: "Chiffreur", team: "Chiffrage", active: true, last: "Hier 16:02", updatedAt: now },
  { id: "u5", name: "Nadia Alaoui", email: "nadia@promat.ma", role: "Direction", team: "Direction", active: true, last: "05/09/2026", updatedAt: now },
  { id: "u6", name: "Karim Tazi", email: "karim@promat.ma", role: "Lecture seule", team: "Support", active: false, last: "12/08/2026", updatedAt: now },
];

const seedNotifications: NotificationItem[] = [
  { id: "n1", title: "8 nouvelles opportunités détectées", detail: "Débitmètre électromagnétique · Portail des marchés publics", kind: "opportunite", to: "/", read: false, time: "Aujourd'hui 08:00" },
  { id: "n2", title: "Décision GO / NO GO requise", detail: "ONEE – AO 24/DRC/CI/2026", kind: "decision", to: "/analyses", read: false, time: "Aujourd'hui 09:15" },
  { id: "n3", title: "Document manquant", detail: "Bordereau des prix non récupéré · AO OCP", kind: "document", to: "/referentiels/documents", read: false, time: "Hier 16:40" },
  { id: "n4", title: "Échéance proche", detail: "AO ONCF · remise dans 9 jours", kind: "echeance", to: "/analyses", read: true, time: "Hier 11:02" },
];

type Snapshot = {
  fournisseurs: Fournisseur[];
  articles: ArticleRef[];
  utilisateurs: Utilisateur[];
  notifications: NotificationItem[];
  matrix: Record<string, string[]>;
};

const seed = (): Snapshot => ({
  fournisseurs: seedFournisseurs.map((f) => ({ ...f })),
  articles: seedArticles.map((a) => ({ ...a })),
  utilisateurs: seedUtilisateurs.map((u) => ({ ...u })),
  notifications: seedNotifications.map((n) => ({ ...n })),
  matrix: Object.fromEntries(Object.entries(defaultMatrix).map(([k, v]) => [k, [...v]])),
});

/* ----------------------------------------------------------------- context */

type Ctx = Snapshot & {
  addFournisseur: (f: Omit<Fournisseur, "id" | "updatedAt">) => void;
  updateFournisseur: (id: string, patch: Partial<Fournisseur>) => void;
  removeFournisseur: (id: string) => Fournisseur | undefined;
  restoreFournisseur: (f: Fournisseur) => void;
  addArticle: (a: Omit<ArticleRef, "id" | "updatedAt">) => void;
  updateArticle: (id: string, patch: Partial<ArticleRef>) => void;
  removeArticle: (id: string) => ArticleRef | undefined;
  restoreArticle: (a: ArticleRef) => void;
  addUtilisateur: (u: Omit<Utilisateur, "id" | "updatedAt">) => void;
  updateUtilisateur: (id: string, patch: Partial<Utilisateur>) => void;
  removeUtilisateur: (id: string) => Utilisateur | undefined;
  restoreUtilisateur: (u: Utilisateur) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setMatrix: (m: Record<string, string[]>) => void;
  resetDemo: () => void;
};

const KEY = "promat.referentiel.v1";
const RefCtx = createContext<Ctx | null>(null);

const stamp = () =>
  new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function ReferentielProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Snapshot>(seed);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData({ ...seed(), ...(JSON.parse(raw) as Snapshot) });
    } catch {
      /* keep seed */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  const id = () => Math.random().toString(36).slice(2, 9);

  const value = useMemo<Ctx>(
    () => ({
      ...data,
      addFournisseur: (f) =>
        setData((d) => ({ ...d, fournisseurs: [{ ...f, id: id(), updatedAt: stamp() }, ...d.fournisseurs] })),
      updateFournisseur: (fid, patch) =>
        setData((d) => ({
          ...d,
          fournisseurs: d.fournisseurs.map((f) => (f.id === fid ? { ...f, ...patch, updatedAt: stamp() } : f)),
        })),
      removeFournisseur: (fid) => {
        const found = data.fournisseurs.find((f) => f.id === fid);
        setData((d) => ({ ...d, fournisseurs: d.fournisseurs.filter((f) => f.id !== fid) }));
        return found;
      },
      restoreFournisseur: (f) => setData((d) => ({ ...d, fournisseurs: [f, ...d.fournisseurs] })),
      addArticle: (a) =>
        setData((d) => ({ ...d, articles: [{ ...a, id: id(), updatedAt: stamp() }, ...d.articles] })),
      updateArticle: (aid, patch) =>
        setData((d) => ({
          ...d,
          articles: d.articles.map((a) => (a.id === aid ? { ...a, ...patch, updatedAt: stamp() } : a)),
        })),
      removeArticle: (aid) => {
        const found = data.articles.find((a) => a.id === aid);
        setData((d) => ({ ...d, articles: d.articles.filter((a) => a.id !== aid) }));
        return found;
      },
      restoreArticle: (a) => setData((d) => ({ ...d, articles: [a, ...d.articles] })),
      addUtilisateur: (u) =>
        setData((d) => ({ ...d, utilisateurs: [{ ...u, id: id(), updatedAt: stamp() }, ...d.utilisateurs] })),
      updateUtilisateur: (uid, patch) =>
        setData((d) => ({
          ...d,
          utilisateurs: d.utilisateurs.map((u) => (u.id === uid ? { ...u, ...patch, updatedAt: stamp() } : u)),
        })),
      removeUtilisateur: (uid) => {
        const found = data.utilisateurs.find((u) => u.id === uid);
        setData((d) => ({ ...d, utilisateurs: d.utilisateurs.filter((u) => u.id !== uid) }));
        return found;
      },
      restoreUtilisateur: (u) => setData((d) => ({ ...d, utilisateurs: [u, ...d.utilisateurs] })),
      markRead: (nid) =>
        setData((d) => ({
          ...d,
          notifications: d.notifications.map((n) => (n.id === nid ? { ...n, read: true } : n)),
        })),
      markAllRead: () =>
        setData((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) })),
      setMatrix: (m) => setData((d) => ({ ...d, matrix: m })),
      resetDemo: () => setData(seed()),
    }),
    [data],
  );

  return <RefCtx.Provider value={value}>{children}</RefCtx.Provider>;
}

export function useReferentiel() {
  const ctx = useContext(RefCtx);
  if (!ctx) throw new Error("useReferentiel must be used inside ReferentielProvider");
  return ctx;
}

/** Permission check for the signed-in role. */
export function useCan() {
  const { matrix } = useReferentiel();
  return useCallback(
    (role: string | undefined, permission: string) =>
      Boolean(role && (matrix[role] ?? []).includes(permission)),
    [matrix],
  );
}
