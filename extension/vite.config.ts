import manifest from "@host/light-runtime/dist/.vite/manifest.json" with { type: "json" };
import { resolve } from "path";
import { defineConfig } from "vite";

const lightRuntimePackageRoot = resolve(
  __dirname,
  "node_modules/@host/light-runtime",
);
const lightRuntimeStaticRoot = resolve(lightRuntimePackageRoot, "dist");

// console.log("Manifest content:", JSON.stringify(manifest, null, 2));

const aliases = Object.values(
  manifest as unknown as Record<string, { name: string; file: string }>,
).reduce(
  (acc, e, i, a) => {
    if (e.name === "@host/host-types") {
      return {
        ...acc,
        [e.name]: resolve(lightRuntimeStaticRoot, `./${e.file}`),
      };
    } else {
      return acc;
    }
  },
  {} as Record<string, string>,
);
console.log(
  "Generated aliases from manifest:",
  JSON.stringify(aliases, null, 2),
);
export default defineConfig({
  root: lightRuntimeStaticRoot,
  cacheDir: resolve(__dirname, "node_modules/.vite"),
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
      "virtual:extension": resolve(__dirname, "src/index.ts"),
      ...aliases,
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@mui/material/Button",
      "lodash-es",
      "highcharts",
      "elkjs",
    ],
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Extension",
      fileName: (format) => `extension.${format}.js`,
      formats: ["es"],
    },
    // rollupOptions: {
    //   external: ["@host/host-types"],
    //   output: {
    //     globals: {
    //       "@host/host-types": "HostTypes",
    //     },
    //   },
    // },
  },
});
