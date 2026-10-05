import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Frontend-only for now. Once the Go backend is up, proxy /api to it in dev
// so the browser can call fetch("/api/chat") etc. without CORS trouble:
//
//   server: { proxy: { "/api": "http://localhost:8080" } }
//
export default defineConfig({
  plugins: [react()],
});
