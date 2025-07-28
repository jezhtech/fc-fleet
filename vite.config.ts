import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable source maps for debugging (optional)
    sourcemap: false,

    // Optimize chunk size
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB

    // Configure manual chunks for better code splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            // Keep React and React-DOM together
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            // Group other major libraries
            if (id.includes("firebase")) {
              return "vendor-firebase";
            }
            if (id.includes("@radix-ui")) {
              return "vendor-ui";
            }
            // Default vendor chunk
            return "vendor";
          }
        },

        // Optimize chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split("/").pop()
            : "chunk";
          return `assets/${facadeModuleId}-[hash].js`;
        },

        // Optimize asset naming
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || "asset";
          const info = name.split(".");
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },

    // Enable minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },

    // Optimize CSS
    cssCodeSplit: true,

    // Target modern browsers for smaller bundles
    target: "es2015",
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "framer-motion",
      "sonner",
      "lucide-react",
    ],
    exclude: [
      // Exclude large libraries from pre-bundling to reduce initial bundle
      "html2canvas",
      "jspdf",
      "xlsx",
      "@turf/turf",
    ],
  },
}));
