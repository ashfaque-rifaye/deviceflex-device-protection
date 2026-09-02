import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Build output, all of it. `.vercel/output` is the one that bites: the Vercel preset
  // writes thousands of generated .mjs bundles there, and because eslint-plugin-prettier
  // applies to every file rather than just ts/tsx, linting them turns `npm run lint` into
  // a seven-minute run reporting ~45k formatting "errors" in minified code.
  {
    ignores: [
      "dist",
      ".output",
      ".vercel",
      ".vinxi",
      ".nitro",
      ".wrangler",
      ".tanstack",
      "src/routeTree.gen.ts",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      // The design-system guardrail — opt-in via `npm run lint:tokens`.
      //
      // Every raw brand hex in a screen is a place the token layer cannot reach: change
      // the navy in styles.css and those spots keep the old value. There are ~1,200 of
      // them today, so running this in the default lint would bury the handful of real
      // warnings under a wall of noise and make `npm run lint` useless as a signal.
      //
      // It is a backlog, not a gate: `npm run lint:tokens` prints the count, and the
      // number should only ever go down. When it is small enough, fold it back in here.
      ...(process.env.LINT_TOKENS
        ? {
            "no-restricted-syntax": [
              "warn",
              {
                selector:
                  "Literal[value=/#(00388F|0057B8|0072B2|009FDB|DCDFE3|1D2329|454B52|686E74|878C94|F3F4F6|F2FAFD|E7F5FB|1F7A3D|C70032|9E5D00)/i]",
                message:
                  "Use an AT&T token (var(--color-att-*)) or an att/ component, not a raw brand hex.",
              },
            ],
          }
        : {}),
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // These hold att.com's own SVG path fills, transcribed verbatim. Tokenising them
    // would misrepresent what was copied off the real site.
    files: [
      "src/components/site/NavIcons.tsx",
      "src/components/deviceflex/AttIcons.tsx",
      "src/components/AttLogo.tsx",
    ],
    rules: { "no-restricted-syntax": "off" },
  },
  eslintPluginPrettier,
);
