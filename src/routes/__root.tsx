import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";
import { useState } from "react";

const APP_NAME = "Pajak21";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Sistem perhitungan PPh Pasal 21 berbasis TER (PP 58/2023) dengan spreadsheet penghasilan, bukti potong, dan ringkasan tahunan.",
      },
      { name: "theme-color", content: "#7eb6ea" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <html lang="id" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <QueryClientProvider client={client}>
            <Outlet />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "rgba(255,255,255,0.72)",
                  color: "#1c1c1e",
                  border: "1px solid rgba(255,255,255,0.65)",
                  backdropFilter: "blur(24px)",
                  borderRadius: 18,
                },
              }}
            />
          </QueryClientProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
