// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Vite only exposes VITE_-prefixed vars, and only to the client. The vision provider's
// credentials must stay server-side, so we read .env here (Node context) and put them on
// process.env for the SSR runtime to pick up. In production these come from the host —
// Cloudflare Worker secrets — and this loop simply finds nothing to do.
const SERVER_ENV = ["AI_BASE_URL", "AI_API_KEY", "AI_MODEL"] as const;
const fileEnv = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
for (const key of SERVER_ENV) {
  if (!process.env[key] && fileEnv[key]) process.env[key] = fileEnv[key];
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
