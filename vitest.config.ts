import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // EXCEPCIÓN DOCUMENTADA (ver AGENTS.md: "never weaken a check without
    // documenting why"): el timeout de vitest por defecto es 5 000 ms. El test
    // del wizard de NewRequest (NewRequest.test.tsx) ejecuta 5 pasos de
    // formulario con múltiples eventos de usuario, esperas de debounce y
    // actualizaciones asíncronas del autocomplete de empresas — en los runners
    // de CI (GitHub Actions, 2-core) ese flujo supera los 5 000 ms de forma
    // sistemática. La causa raíz es el debounce de CompanyAutocomplete
    // (300 ms × n renders) bajo un entorno de jsdom sin aceleración de DOM.
    // Para revertir esto: aislar el test del wizard en un bloque
    // `vi.useFakeTimers()` y avanzar el reloj con `vi.advanceTimersByTime()`
    // en lugar de esperar en tiempo real, eliminando la dependencia del clock
    // de la máquina. Mientras esa refactorización no esté lista, 15 000 ms es
    // el presupuesto mínimo observado (≈ 11 000 ms en CI + 35 % de margen).
    testTimeout: 15000,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "lcov", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/test/**",
        "src/components/ui/**", // generated shadcn primitives
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
      // Business logic must be covered. Ratchet: every sprint, add the modules
      // that gain tests here and never lower an existing number.
      thresholds: {
        "src/lib/costing.ts": { lines: 90, functions: 90, branches: 90, statements: 90 },
        "src/lib/negotiation.ts": { lines: 90, functions: 90, branches: 90, statements: 90 },
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
