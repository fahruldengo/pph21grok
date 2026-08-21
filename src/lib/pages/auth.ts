import { useEffect, useState, type ReactNode } from "react";
import {
  hashPass,
  readSession,
  readUsers,
  writeSession,
  writeUsers,
  type SessionUser,
} from "./storage";

export const authEnabled = true;
export const GROK_PROVIDERS: Array<{ providerId: string; label: string }> = [];

export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  isDevFallback: boolean;
};

function toAppUser(s: SessionUser | null): AppUser | null {
  if (!s) return null;
  return {
    id: s.id,
    displayName: s.name,
    primaryEmail: s.email,
    profileImageUrl: null,
    isDevFallback: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return children;
}

function useSession() {
  const [session, setSession] = useState<SessionUser | null>(() => readSession());
  useEffect(() => {
    const sync = () => setSession(readSession());
    window.addEventListener("storage", sync);
    window.addEventListener("pajak21-auth", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("pajak21-auth", sync);
    };
  }, []);
  return {
    data: session ? { user: { id: session.id, name: session.name, email: session.email, image: null } } : null,
    isPending: false,
  };
}

export const authClient = {
  useSession,
  signUp: {
    email: async ({ email, password, name }: { email: string; password: string; name?: string }) => {
      const users = readUsers();
      const key = email.trim().toLowerCase();
      if (users[key]) return { error: { message: "Email sudah terdaftar" } };
      const user: SessionUser = { id: `u_${crypto.randomUUID()}`, email: key, name: name || key };
      users[key] = { ...user, password: hashPass(password) };
      writeUsers(users);
      writeSession(user);
      return { data: { user }, error: null };
    },
  },
  signIn: {
    email: async ({ email, password }: { email: string; password: string }) => {
      const users = readUsers();
      const key = email.trim().toLowerCase();
      const row = users[key];
      if (!row || row.password !== hashPass(password)) {
        return { error: { message: "Email atau kata sandi salah" } };
      }
      writeSession({ id: row.id, email: row.email, name: row.name });
      return { data: { user: row }, error: null };
    },
  },
};

export function signIn() {
  return Promise.resolve();
}

export async function signOut() {
  writeSession(null);
  const base = import.meta.env.BASE_URL || "/";
  window.location.assign(base);
}

export type CurrentUserState = { user: AppUser | null; isPending: boolean };

export function useCurrentUserState(): CurrentUserState {
  const { data, isPending } = authClient.useSession();
  const u = data?.user;
  return {
    isPending,
    user: u
      ? {
          id: u.id,
          displayName: u.name ?? null,
          primaryEmail: u.email ?? null,
          profileImageUrl: u.image ?? null,
          isDevFallback: false,
        }
      : null,
  };
}

export function useCurrentUser() {
  return useCurrentUserState().user;
}

export { toAppUser };
