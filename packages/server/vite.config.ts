import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      JWT_SECRET: "test-secret-at-least-16-chars-long",
    },
  },
});
