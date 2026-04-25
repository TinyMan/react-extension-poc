import { defineConfig } from "vite";
import path from "path";
import pkg from "./package.json" with { type: "json" };

const externalPackages = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
];

const externalPackageId = (id: string) =>
  externalPackages.some(
    (packageName) => id === packageName || id.startsWith(`${packageName}/`),
  );

export default defineConfig({
  resolve: {
    alias: {
      "@host/platform": path.resolve(__dirname, "src/libs/platform/src"),
      "@host/host-types": path.resolve(__dirname, "src/libs/host-types/src"),
    },
  },
  build: {
    outDir: "dist/light",
    rollupOptions: {
      external: externalPackageId,
    },
    manifest: true,
  },
});
