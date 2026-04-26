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
        fileName: "manifest.json",
        source: JSON.stringify(entries),
      });
    },
  };
}

function ServeExtensionPlugin(): PluginOption {
  return {
    name: "serve-extension",
    apply: "serve",
    config(config, env) {
      if (env.command === "serve") {
        config.server = config.server || {};
        config.server.fs = config.server.fs || {};
        config.server.fs.allow = [
          ...(config.server.fs.allow || []),
          resolve(__dirname, "src"),
          lightRuntimeStaticRoot,
        ];

        config.resolve = config.resolve || {};
        config.resolve.alias = {
          ...(config.resolve.alias || {}),
          "@host/host-types": resolve(
            lightRuntimeStaticRoot,
            `./${hostTypesAlias}`,
          ),
          "/extension/extension.js": resolve(__dirname, "src/extension.ts"),
        };
      }
    },
    configureServer(server) {
      server.environments.client.moduleGraph.ensureEntryFromUrl(
        "/extension/extension.js",
      );

      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/extension/manifest.json") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify([{ name: "index", file: "extension.js" }]));
        } else if (req.url?.startsWith("/extension/extension.js")) {
          console.log("Serving extension.js via custom middleware...");
          // Transform and serve the module
          const result = await server.environments.client.transformRequest(
            "/extension/extension.js",
          );
          if (result) {
            res.setHeader("Content-Type", "application/javascript");
            res.end(result.code);
            return;
          }
        } else {
          next();
        }
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
    ServeExtensionPlugin(),
  ],
  optimizeDeps: {
    exclude: ["@host/host-types"],
  },
  build: {
    outDir: outDir,
    emptyOutDir: true,
    lib: {
      entry: { index: resolve(__dirname, "src/extension.ts") },
      fileName: "extension-[hash]",
      formats: ["es"],
    },
    sourcemap: true,
    rolldownOptions: {
      external: [...hostDependencies, "@host/host-types"],
    },
  },
});
