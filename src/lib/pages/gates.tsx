import { useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { authEnabled, signOut, useCurrentUser, useCurrentUserState } from "./auth";

export const SIGN_IN_PATH = "/login";

export function SignedIn({ children }: { children: ReactNode }) {
  const { user } = useCurrentUserState();
  return user ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending || user) return null;
  return <>{children}</>;
}

export function RedirectToSignIn({ to = SIGN_IN_PATH }: { to?: string }) {
  return <Navigate to={to} />;
}

export function UserButton() {
  const user = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Account";
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/45 text-sm font-medium">
        {label.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 truncate text-[13px] font-medium">{label}</span>
      {authEnabled && (
        <button
          type="button"
          disabled={signingOut}
          onClick={() => {
            setSigningOut(true);
            void signOut().catch(() => setSigningOut(false));
          }}
          className="cursor-pointer text-[13px] font-medium text-accent hover:underline disabled:cursor-wait"
        >
          {signingOut ? "Keluar…" : "Keluar"}
        </button>
      )}
    </div>
  );
}
