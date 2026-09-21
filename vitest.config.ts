import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
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
