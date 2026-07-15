import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    }
  },
  test: {
    globals: true,
    environment: "node",
    exclude: ["sdk/**", "node_modules/**"],
    coverage: {
      reporter: ["text", "html"],
      include: ["lib/brain/**/*.ts"],
      exclude: ["lib/brain/**/*.test.ts"]
    }
  }
})
