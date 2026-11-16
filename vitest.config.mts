import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // The same alias as in tsconfig.json.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Unit tests live next to the code they test. They run in Node and never touch the
    // database or the storage: the modules that would are mocked in each test.
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Each test starts with clean mocks: no calls recorded, and back to the
    // implementation given to vi.fn(), if any.
    mockReset: true,
  },
});
