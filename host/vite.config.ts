import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

import { exactRegex } from "@rolldown/pluginutils";
import packageJson from "./package.json" with { type: "json" };

const outDir = path.resolve(__dirname, "../server/wwwroot");

const sharedDependencies = Object.keys(packageJson.dependencies || {})
  .filter((dep) => dep !== "elkjs") // elkjs is a special case
  .map((d) => d.replace("^", "").replace("~", ""));
console.log("Shared dependencies:", sharedDependencies);

export function ExtensionImportResolver(): PluginOption {
  const virtualModuleId = "./extension.js";
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
function ImportMapPlugin(): PluginOption {
  const resolvedImports: Record<string, string> = {};
  return {
    name: "import-map-plugin",
    // enforce: "pre",
    apply: "build",
    transformIndexHtml() {
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

function HostDependencyManifestPlugin(): PluginOption {
  return {
    name: "host-dependency-manifest",
    apply: "build",
    generateBundle(_, bundle) {
      // this.emitFile({
      //   type: "asset",
      //   fileName: "host-dependencies.json",
      //   source: JSON.stringify(
      //     bundle,
      //     (k, v) => (k === "code" || k === "data" ? k : v),
      //     2,
      //   ),
      // });
      // const index = Object.values(bundle).find(
      //   (m) => m.name === "index" && m.type === "chunk",
      // );
      // console.log(index.modules, index.imports, index.exports);
      // for (const m of Object.values(index.modules)) {
      //   console.log(m.rende);
      // }
      const manifest = Object.values(bundle)
        .filter((c) => c.type === "chunk" && c.isEntry)
        .map(({ name, fileName }) => ({ name, file: fileName }));
      console.log("Host dependency manifest:", manifest);
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifest),
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  root: path.resolve(__dirname, "src/apps/host"),
  plugins: [
    react(),
    ExtensionImportResolver(),
    HostDependencyManifestPlugin(),
    ImportMapPlugin(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    outDir: outDir,
    emptyOutDir: true,
    // manifest: true,
    sourcemap: true,
    rolldownOptions: {
      preserveEntrySignatures: "strict",
      input: {
        index: path.resolve(__dirname, "src/apps/host/index.html"),
        ...sharedDependencies.reduce(
          (acc, dep) => ({ ...acc, [dep]: dep }),
          {},
        ),
        "elkjs/lib/elk.bundled.js": "elkjs/lib/elk.bundled.js",
        "@host/host-types": path.resolve(
          __dirname,
          "src/libs/host-types/src/index.ts",
        ),
      },
      output: {
        // codeSplitting: {
        //   groups: [
        //     {
        //       name: (moduleId, _) => {
        //         console.log(moduleId);
        //         // console.log(ctx.getModuleInfo(moduleId));
        //         return moduleId;
        //       },
        //       test: /node_modules/,
        //     },
        //   ],
        // },
      },
      external: ["./extension.js"],
    },
  },
});
