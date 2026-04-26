import { defineConfig, PluginOption } from "vite";
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
  // plugins: [...(cfg.plugins ?? [])],
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    rolldownOptions: {
      ...cfg.build?.rolldownOptions,
      input: {
        index: path.resolve(__dirname, "../../apps/host/index.html"),
        "@host/host-types": path.resolve(
          __dirname,
          "../host-types/src/index.ts",
        ),
      },
      external: externalPackageId,
      // output: {
      //   entryFileNames(chunkInfo): string {
      //     console.log(chunkInfo);
      //     return `assets/${chunkInfo.name}.js`;
      //   },
      // },
      preserveEntrySignatures: "strict",
    },
    manifest: true,
  },
});
