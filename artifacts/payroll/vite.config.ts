import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const isBuild = process.env.NODE_ENV === "production" || process.argv.includes("build");

const rawPort = process.env.PORT;
const port = rawPort && !Number.isNaN(Number(rawPort)) ? Number(rawPort) : 3000;

const basePath = process.env.BASE_PATH || "/";

const routeToHtml: Record<string, string> = {
  "/login": "/login.html",
  "/create-account": "/create-account.html",
  "/forgot-username": "/forgot-username.html",
  "/forgot-password": "/forgot-password.html",
  "/verify": "/verify.html",
  "/verify-card": "/verify-card.html",
  "/activate-card": "/activate-card.html",
};

function spaRouteHtmlPlugin() {
  return {
    name: "spa-route-html",
    configureServer(server: any) {
      return () => {
        server.middlewares.use((req: any, _res: any, next: any) => {
          const url = req.url?.split("?")[0]?.split("#")[0];
          if (url && routeToHtml[url]) {
            req.url = routeToHtml[url];
          }
          next();
        });
      };
    },
    configurePreviewServer(server: any) {
      return () => {
        server.middlewares.use((req: any, _res: any, next: any) => {
          const url = req.url?.split("?")[0]?.split("#")[0];
          if (url && routeToHtml[url]) {
            req.url = routeToHtml[url];
          }
          next();
        });
      };
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    spaRouteHtmlPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, "index.html"),
        login: path.resolve(import.meta.dirname, "login.html"),
        "create-account": path.resolve(import.meta.dirname, "create-account.html"),
        "forgot-username": path.resolve(import.meta.dirname, "forgot-username.html"),
        "forgot-password": path.resolve(import.meta.dirname, "forgot-password.html"),
        verify: path.resolve(import.meta.dirname, "verify.html"),
        "verify-card": path.resolve(import.meta.dirname, "verify-card.html"),
        "activate-card": path.resolve(import.meta.dirname, "activate-card.html"),
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
