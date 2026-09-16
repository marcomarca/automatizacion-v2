import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    open: false,
    watch: {
      ignored: [
        "**/*.zip",
        "**/automatizacionv1.zip",
        "**/ejemplo-guia/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/.git/**",
      ],
    },
  },
  build: {
    target: "es2022",
  },
});
