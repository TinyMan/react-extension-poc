import { defineConfig } from "vite";
import path from "path";
import pkg from "../../../package.json" with { type: "json" };
import cfg from "../../../vite.config.ts";

const externalPackages = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
  ...((cfg.build?.rolldownOptions?.external as string[]) ?? []),
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
    rolldownOptions: {
      ...cfg.build?.rolldownOptions,
      external: externalPackageId,
    },
    manifest: true,
  },
});
