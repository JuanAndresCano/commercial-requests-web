import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

/**
 * Project rulebook. These rules are the executable version of AGENTS.md:
 * every human and every AI tool (Claude, Cursor, Antigravity, Copilot...)
 * is held to them by CI. Changing this file requires CODEOWNERS review.
 */
export default tseslint.config(
  { ignores: ["dist", "coverage", "node_modules"] },
  {
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, eslintComments.recommended],
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
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Never `any`; never silence the type checker without a reason.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-expect-error": "allow-with-description" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // Disabling a rule is allowed only with a written justification.
      "@eslint-community/eslint-comments/require-description": "error",
      "@eslint-community/eslint-comments/no-unlimited-disable": "error",

      // HTTP goes through the API layer only (src/lib/api), never ad hoc.
      "no-restricted-imports": ["error", { paths: [{ name: "axios", message: "Use the API client in src/lib/api." }] }],
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Use the API client in src/lib/api." },
        { name: "localStorage", message: "Business data lives in the backend. UI state: use usePersistentState." },
      ],

      // Brand colours must come from design tokens, not hardcoded hex values.
      // WARN while the prototype is migrated to tokens; promote to "error" afterwards.
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/\[#[0-9a-fA-F]{3,8}\]/]",
          message: "Hardcoded hex colour. Use a design token (tailwind.config.ts).",
        },
        {
          selector: "TemplateElement[value.raw=/\[#[0-9a-fA-F]{3,8}\]/]",
          message: "Hardcoded hex colour. Use a design token (tailwind.config.ts).",
        },
      ],
    },
  },
  {
    // The API layer is the only place allowed to perform HTTP calls.
    files: ["src/lib/api/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": "off", "no-restricted-globals": "off" },
  },
  {
    // Allowed storage users — per-device UI state only: persisted dashboard
    // filters, theme preference and the unsent request draft (validated UX).
    // AuthContext is prototype persistence of business data and MUST leave this
    // list when the API layer lands (see docs/07, item 6).
    files: [
      "src/hooks/use-persistent-state.ts",
      "src/context/ThemeContext.tsx",
      "src/pages/NewRequest.tsx",
      "src/context/AuthContext.tsx",
    ],
    rules: { "no-restricted-globals": ["error", { name: "fetch", message: "Use the API client in src/lib/api." }] },
  },
  {
    // Context providers export their hook next to the provider by design.
    files: ["src/context/**/*.{ts,tsx}"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
    // Generated shadcn/ui code: keep it as generated, do not hand-edit to please the linter.
    files: ["src/components/ui/**/*.{ts,tsx}", "src/hooks/use-toast.ts"],
    rules: {
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  prettier,
);
