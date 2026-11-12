import path from "node:path"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/react-router-dom/")
            ) {
              return "vendor-react"
            }
            if (id.includes("/@reduxjs/toolkit/") || id.includes("/react-redux/")) {
              return "vendor-redux"
            }
            if (id.includes("/framer-motion/")) {
              return "vendor-motion"
            }
            if (id.includes("/lucide-react/")) {
              return "vendor-icons"
            }
          }
        },
      },
    },
  },
})
