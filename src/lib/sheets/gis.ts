const GIS_SRC = "https://accounts.google.com/gsi/client";
export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

type TokenClient = {
  requestAccessToken: (opts?: { prompt?: string }) => void;
};

type GoogleOauth2 = {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (resp: { access_token?: string; error?: string; error_description?: string }) => void;
  }) => TokenClient;
};

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOauth2 } };
  }
}

let gisLoading: Promise<void> | null = null;

export function loadGisClient(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Google Identity hanya tersedia di browser"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoading) return gisLoading;
  gisLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Gagal memuat Google Identity Services")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisLoading = null;
      reject(new Error("Gagal memuat Google Identity Services"));
    };
    document.head.appendChild(script);
  });
  return gisLoading;
}

export async function requestSheetsAccessToken(clientId: string): Promise<string> {
  const id = clientId.trim();
  if (!id) throw new Error("Isi OAuth Client ID dari Google Cloud Console.");
  await loadGisClient();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error("Google Identity Services belum siap.");
  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: id,
      scope: SHEETS_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error_description || resp.error || "Izin Google Sheets ditolak"));
          return;
        }
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  });
}
