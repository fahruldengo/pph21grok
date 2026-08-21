export const SESSION_KEY = "pajak21.session";
export const USERS_KEY = "pajak21.users";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export type StoredUser = SessionUser & { password: string };

export function readSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed?.id || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(user: SessionUser | null) {
  if (!user) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("pajak21-auth"));
}

export function readUsers(): Record<string, StoredUser> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}") as Record<string, StoredUser>;
  } catch {
    return {};
  }
}

export function writeUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function dbKey(userId: string) {
  return `pajak21.db.${userId}`;
}

export function sheetLinkKey(userId: string) {
  return `pajak21.sheets.${userId}`;
}

export function hashPass(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
