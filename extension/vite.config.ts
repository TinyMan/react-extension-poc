import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Extension",
      fileName: (format) => `extension.${format}.js`,
      formats: ["es"],
    },
    rollupOptions: {
      external: ["@host/host-types"],
      output: {
        globals: {
          "@host/host-types": "HostTypes",
        },
      },
    },
  },
});
