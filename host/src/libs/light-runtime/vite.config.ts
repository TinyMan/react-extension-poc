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

function ImportMapPlugin(): PluginOption {
  const resolvedImports: Record<string, string> = {};
  return {
    name: "import-map-plugin",
    enforce: "pre",
    apply: "build",
    transformIndexHtml(_) {
      const importMapJson = JSON.stringify({ imports: resolvedImports });
      console.log(
        "Injecting import map into HTML:",
        JSON.stringify(resolvedImports, null, 2),
      );
      return [
        {
          tag: "script",
          attrs: { type: "importmap" },
          injectTo: "head",
          children: importMapJson,
        },
      ];
    },
    generateBundle(_, bundle) {
      console.log("Generating bundle, processing chunks for import map...");
      for (const output of Object.values(bundle)) {
        if (
          output.type === "chunk" &&
          output.exports?.length > 0 &&
          !!output.facadeModuleId
        ) {
          resolvedImports[output.name] = `./${output.fileName}`;
        }
      }
    },
  };
}

export default defineConfig({
  ...cfg,
  plugins: [...(cfg.plugins ?? []), ImportMapPlugin()],
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    rolldownOptions: {
      ...cfg.build?.rolldownOptions,
      external: externalPackageId,
      input: {
        index: path.resolve(__dirname, "../../../src/apps/host/index.html"),
        "@host/host-types": path.resolve(
          __dirname,
          "../host-types/src/index.ts",
        ),
      },
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
