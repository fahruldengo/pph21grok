import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { createHashHistory } from "@tanstack/history";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/pages/auth";
import { AppErrorComponent } from "@/lib/error-component";
import { Route as AppRouteFile } from "./routes/_app";
import { Route as LoginFile } from "./routes/login";
import { Route as DashboardFile } from "./routes/_app/index";
import { Route as BuktiFile } from "./routes/_app/bukti-potong/index";
import { Route as ElemenFile } from "./routes/_app/elemen/index";
import { Route as KalkulatorFile } from "./routes/_app/kalkulator/index";
import { Route as KaryawanFile } from "./routes/_app/karyawan/index";
import { Route as NonPegawaiFile } from "./routes/_app/non-pegawai/index";
import { Route as PemotongFile } from "./routes/_app/pemotong/index";
import { Route as PenghasilanFile } from "./routes/_app/penghasilan/index";
import { Route as ReferensiFile } from "./routes/_app/referensi/index";
import { Route as SpreadsheetFile } from "./routes/_app/spreadsheet/index";
import { Route as GoogleSheetsFile } from "./routes/_app/google-sheets/index";
import { Route as SummaryFile } from "./routes/_app/summary/index";
import { Route as TahunanFile } from "./routes/_app/tahunan/index";

function comp(route: { options: { component?: unknown } }) {
  return route.options.component as NonNullable<Parameters<typeof createRoute>[0]["component"]>;
}

function PagesRoot() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <AuthProvider>
      <QueryClientProvider client={client}>
        <Outlet />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#fbf8f2",
              color: "#1b1915",
              border: "1px solid #ddd6c8",
            },
          }}
        />
      </QueryClientProvider>
    </AuthProvider>
  );
}

const rootRoute = createRootRoute({ component: PagesRoot });
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: comp(LoginFile),
});
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_app",
  component: comp(AppRouteFile),
});

function page(path: string, route: { options: { component?: unknown } }) {
  return createRoute({
    getParentRoute: () => appRoute,
    path,
    component: comp(route),
  });
}

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([
    page("/", DashboardFile),
    page("/pemotong", PemotongFile),
    page("/elemen", ElemenFile),
    page("/karyawan", KaryawanFile),
    page("/penghasilan", PenghasilanFile),
    page("/spreadsheet", SpreadsheetFile),
    page("/google-sheets", GoogleSheetsFile),
    page("/kalkulator", KalkulatorFile),
    page("/tahunan", TahunanFile),
    page("/summary", SummaryFile),
    page("/bukti-potong", BuktiFile),
    page("/non-pegawai", NonPegawaiFile),
    page("/referensi", ReferensiFile),
  ]),
]);

export function getPagesRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    history: createHashHistory(),
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getPagesRouter>;
  }
}
