import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // EXCEPCIÓN DOCUMENTADA (ver AGENTS.md: "never weaken a check without
    // documenting why"): el default de vitest es 5 000 ms y aquí se sube a
    // 15 000 ms. Ojo con la justificación:
    //  - NO protege al wizard de NewRequest: ese test ya declara su propio
    //    timeout (20 000 ms), que manda por encima de este valor global.
    //  - Hoy el valor parece estar enmascarando otra cosa: al bajar el global
    //    a 5 000 ms aparece un fallo intermitente en RequestDetail.test.tsx
    //    bajo carga de la máquina (no relacionado con el wizard). Es decir,
    //    RequestDetail.test.tsx es frágil y 15 000 ms lo oculta por accidente.
    //  - Bajar o quitar este valor requiere ANTES arreglar esa fragilidad por
    //    separado (causa raíz aún sin diagnosticar). No cambiar el número hasta
    //    entonces.
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
