import path from "node:path";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const src = path.resolve(__dirname, "src");

export default defineConfig({
  base: "/pph21grok/",
  plugins: [tailwindcss(), viteReact()],
  define: {
    "import.meta.env.VITE_STATIC": JSON.stringify("true"),
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@/lib/server/pph": path.resolve(src, "lib/pages/pph-local.ts"),
      "@/lib/auth/client": path.resolve(src, "lib/pages/auth.ts"),
      "@/lib/auth/provider": path.resolve(src, "lib/pages/auth.ts"),
      "@/lib/auth/use-current-user": path.resolve(src, "lib/pages/auth.ts"),
      "@/lib/auth/gates": path.resolve(src, "lib/pages/gates.tsx"),
    },
  },
  build: {
    outDir: "pages-dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "gh-index.html"),
    },
  },
});
