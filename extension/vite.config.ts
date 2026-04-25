import { defineConfig } from "vite";
import { resolve } from "path";

const lightRuntimePackageRoot = resolve(
  __dirname,
  "node_modules/@host/light-runtime",
);
const lightRuntimeStaticRoot = resolve(lightRuntimePackageRoot, "dist");

export default defineConfig({
  root: lightRuntimeStaticRoot,
  cacheDir: resolve(__dirname, "node_modules/.vite"),
  //   optimizeDeps: {
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
  //   },
  resolve: {
    //     alias: {
    //       "@host/light-runtime": lightRuntimePackageRoot,
    //     },
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
    rollupOptions: {
      external: ["@host/host-types"],
      output: {
        globals: {
          "@host/host-types": "HostTypes",
        },
      },
    },
  },
});
