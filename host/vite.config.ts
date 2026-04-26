import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

import { exactRegex } from "@rolldown/pluginutils";

export function ExtensionImportResolver(): PluginOption {
  const virtualModuleId = "virtual:extension";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "extension-import-resolver",
    apply: "serve",
    resolveId: {
      filter: { id: exactRegex(virtualModuleId) },
      handler() {
        return resolvedVirtualModuleId;
      },
    },
    load: {
      filter: { id: exactRegex(resolvedVirtualModuleId) },
      handler() {
        return `export function register() {console.log('No-op extension');}`;
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  root: path.resolve(__dirname, "src/apps/host"),
  plugins: [react(), ExtensionImportResolver()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rolldownOptions: {
      external: ["virtual:extension"],
    },
  },
});
