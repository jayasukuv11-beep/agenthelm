import { defineConfig } from "vitest/config"

export default defineConfig({
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
