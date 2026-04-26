import manifest from "@host/light-runtime/dist/.vite/manifest.json" with { type: "json" };
import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import hostPackageJson from "@host/light-runtime/package.json" with { type: "json" };

const outDir = resolve(__dirname, "../server/wwwroot/extension");

const hostDependencies = Array.from(
  Object.keys(hostPackageJson.dependencies || {}) || [],
).map((dep) => new RegExp(`^${dep.replace("^", "").replace("~", "")}`));

const lightRuntimePackageRoot = resolve(
  __dirname,
  "node_modules/@host/light-runtime",
);
const lightRuntimeStaticRoot = resolve(lightRuntimePackageRoot, "dist");

// console.log("Manifest content:", JSON.stringify(manifest, null, 2));
const hostRuntimeManifest = manifest as unknown as Record<
  string,
  { name: string; file: string }
>;
const hostTypesAlias = Object.values(hostRuntimeManifest).find(
  (e) => e.name === "@host/host-types",
)!.file;
// const aliases = Object.values(
//   manifest as unknown as Record<string, { name: string; file: string }>,
// ).reduce(
//   (acc, e, i, a) => {
//     if (e.name === "@host/host-types") {
//       return {
//         ...acc,
//         [e.name]: resolve(lightRuntimeStaticRoot, `./${e.file}`),
//       };
//     } else {
//       return acc;
//     }
//   },
//   {} as Record<string, string>,
// );
// console.log(
//   "Generated aliases from manifest:",
//   JSON.stringify(aliases, null, 2),
// );

function entryManifestPlugin(): PluginOption {
  return {
    name: "entry-manifest",
    apply: "build",
    config(config, env) {
      if (env.command === "build") {
        config.root = resolve(__dirname);
        if (config.resolve && config.resolve.alias)
          // config.resolve.alias = undefined;
          console.log("Build config:", JSON.stringify(config, null, 2));
      }
    },
    generateBundle(_, bundle) {
      const entries = Object.values(bundle)
        .filter((c) => c.type === "chunk" && c.isEntry)
        .map(({ name, fileName }) => ({ name, file: fileName }));
      console.log("Entry chunks for manifest:", entries);
      this.emitFile({
        type: "asset",
        fileName: "manifest.json", // or 'manifest.json'
        source: JSON.stringify(entries),
      });
    },
  };
}
export default defineConfig({
  root: lightRuntimeStaticRoot,
  cacheDir: resolve(__dirname, "node_modules/.vite"),
  plugins: [
    entryManifestPlugin(),
    visualizer({
      open: true,
    }),
  ],
  optimizeDeps: {
    //     include: [
    //       "react",
    //       "react-dom",
    //       "react/jsx-runtime",
    //       "@mui/material/Button",
    //       "lodash-es",
    //       "highcharts",
    //       "elkjs",
    //       "@host/light-runtime",
    //     ],
    exclude: ["@host/host-types"],
  },
  resolve: {
    alias: {
      "/extension.js": resolve(__dirname, "src/index.ts"),
      // ...aliases,
      "@host/host-types": resolve(
        lightRuntimeStaticRoot,
        `./${hostTypesAlias}`,
      ),
    },
    // dedupe: [
    //   "react",
    //   "react-dom",
    //   "react/jsx-runtime",
    //   "@mui/material/Button",
    //   "lodash-es",
    //   "highcharts",
    //   "elkjs",
    // ],
  },
  build: {
    outDir: outDir,
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/extension.ts"),
      fileName: "extension-[hash]",
      formats: ["es"],
    },
    sourcemap: true,
    rolldownOptions: {
      external: [...hostDependencies, "@host/host-types"],
      // external(id, parent, isResolved) {
      //   if (id.includes("host-types")) {
      //     console.log("Evaluating external for:", id, parent, isResolved);
      //   }

      //   return hostDependencies.includes(id)
      // },
    },
  },
});
