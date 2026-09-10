import { defineConfig } from "vite";

export default defineConfig({
  base: "/forecast-mvp/",
  server: {
    host: "0.0.0.0",
    port: 5173
  },
  build: {
    target: "es2020"
  }
});
