import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3002",
    url: "http://127.0.0.1:3002",
    reuseExistingServer: true
  },
  use: {
    baseURL: "http://127.0.0.1:3002",
    trace: "on-first-retry"
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 5"] } }
  ]
});
