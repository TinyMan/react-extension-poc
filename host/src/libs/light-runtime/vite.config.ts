import { defineConfig } from "vite";
import path from "path";
import pkg from "../../../package.json" with { type: "json" };
import cfg from "../../../vite.config.ts";

const externalPackages = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
];

const externalPackageId = (id: string) =>
  externalPackages.some(
    (packageName) => id === packageName || id.startsWith(`${packageName}/`),
  );

export default defineConfig({
  ...cfg,
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      external: externalPackageId,
    },
    manifest: true,
  },
});
