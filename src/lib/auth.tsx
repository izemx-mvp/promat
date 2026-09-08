import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type DemoUser = {
  name: string;
  email: string;
  role: string;
  team?: string;
  initials: string;
};

export const demoUsers: DemoUser[] = [
  { name: "Yassine El Mansouri", email: "yassine@promat.ma", role: "Responsable Commercial", team: "Commercial", initials: "YM" },
  { name: "Houda Bennani", email: "houda@promat.ma", role: "Commercial", team: "Commercial", initials: "HB" },
  { name: "Salma Cherkaoui", email: "salma@promat.ma", role: "Acheteur / Sourcing", team: "Sourcing", initials: "SC" },
  { name: "Omar Idrissi", email: "omar@promat.ma", role: "Chiffreur", team: "Chiffrage", initials: "OI" },
  { name: "Nadia Alaoui", email: "nadia@promat.ma", role: "Direction", team: "Direction", initials: "NA" },
  { name: "Karim Tazi", email: "karim@promat.ma", role: "Lecture seule", team: "Support", initials: "KT" },
];

const DEFAULT: DemoUser = demoUsers[1];
const KEY = "promat.session";

type Ctx = {
  user: DemoUser | null;
  signIn: (email?: string) => void;
  signOut: () => void;
};

const AuthCtx = createContext<Ctx>({ user: null, signIn: () => {}, signOut: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const signIn = useCallback((email?: string) => {
    const match = email ? demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) : undefined;
    const chosen = match ?? DEFAULT;
    setUser(chosen);
    try { localStorage.setItem(KEY, JSON.stringify(chosen)); } catch {}
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try { localStorage.removeItem(KEY); } catch {}
    if (typeof window !== "undefined") window.location.href = "/login";
  }, []);

  return <AuthCtx.Provider value={{ user, signIn, signOut }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
