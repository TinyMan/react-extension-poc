/**
 * EXTENSION PLUGIN
 * Reads the host's shared-manifest.json at build time.
 *
 * For each imported npm package that appears in the manifest it generates
 * a virtual facade module:
 *
 *   singleton  → re-exports everything from the host chunk. The host chunk
 *                is marked external so it is never bundled into the extension.
 *                If the extension needs an export the host didn't include,
 *                Rollup will emit a missing-export error at build time.
 *
 *   non-singleton (supplementable) → re-exports known exports from the host
 *                chunk AND re-exports everything else from the real local
 *                package (which Rollup will tree-shake down to only the delta).
 *                Both the host chunk URL (external) and the local package
 *                (bundled) end up in the extension output.
 *
 * Usage:
 *   // extension/vite.config.ts
 *   import { sharedFacadePlugin } from './vite-plugin-shared-facade';
 *
 *   export default defineConfig({
 *     plugins: [
 *       sharedFacadePlugin({
 *         manifestPath: '../host/dist/shared-manifest.json',
 *         // optional: public base URL where host chunks are served
 *         hostPublicBase: '/',
 *       }),
 *     ],
 *   });
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';
import type { SharedManifest } from './vite-plugin-shared-manifest';

// prefix for the virtual facade modules
const FACADE_PREFIX = '\0__shared_facade__';
// prefix for the virtual "local delta" modules
const LOCAL_PREFIX = '\0__shared_local__';

export function sharedFacadePlugin(options: {
  /** Path to the host's shared-manifest.json */
  manifestPath: string;
  /**
   * Public base URL under which the host chunks are served.
   * e.g. '/' or 'https://cdn.example.com/host/'
   * Default: '/'
   */
  hostPublicBase?: string;
}): Plugin {
  const { manifestPath, hostPublicBase = '/' } = options;

  let manifest: SharedManifest;

  function loadManifest() {
    const raw = readFileSync(resolve(manifestPath), 'utf-8');
    manifest = JSON.parse(raw);
  }

  function hostUrl(file: string): string {
    return hostPublicBase.endsWith('/')
      ? `${hostPublicBase}${file}`
      : `${hostPublicBase}/${file}`;
  }

  /**
   * Generate the facade source for a given package.
   *
   * Singleton:
   *   export { useState, useEffect } from '/vendor/react-Abc.js';
   *
   * Supplementable:
   *   export { debounce, throttle } from '/vendor/lodash-Def.js';   // host has these
   *   export * from 'lodash';                                        // delta: rollup tree-shakes to only what's missing
   *
   * Note: `export { default }` is handled separately because
   * `export * from` does not re-export the default.
   */
  function generateFacade(pkg: string): string {
    const entry = manifest[pkg];
    const url = hostUrl(entry.file);
    const namedExports = entry.exports.filter(e => e !== 'default');
    const hasDefault = entry.exports.includes('default');

    const lines: string[] = [];

    // named exports from host
    if (namedExports.length > 0) {
      lines.push(`export { ${namedExports.join(', ')} } from ${JSON.stringify(url)};`);
    }
    if (hasDefault) {
      lines.push(`export { default } from ${JSON.stringify(url)};`);
    }

    if (!entry.singleton) {
      // delta: import the rest from the real local package.
      // Rollup sees the real package import and tree-shakes it;
      // whatever was already re-exported above will be deduplicated
      // by Rollup's named-export conflict resolution — the explicit
      // re-exports above take priority and shadow any same-named
      // export from the local package.
      lines.push(`export * from ${JSON.stringify(`${LOCAL_PREFIX}${pkg}`)};`);
    }

    return lines.join('\n');
  }

  return {
    name: 'vite-plugin-shared-facade',
    enforce: 'pre',

    buildStart() {
      loadManifest();

      // mark all host chunk files as external so they are never bundled
      // (they will be loaded from the host at runtime)
      for (const entry of Object.values(manifest)) {
        // Vite/Rollup externals are resolved IDs — we match the public URL
        // in resolveId below and return { external: true } directly, so no
        // global externals config is needed here.
      }
    },

    resolveId(source) {
      // 1. intercept imports of packages that are in the manifest
      if (manifest[source]) {
        return `${FACADE_PREFIX}${source}`;
      }

      // 2. resolve the LOCAL_PREFIX virtual modules to the real package
      if (source.startsWith(LOCAL_PREFIX)) {
        const pkg = source.slice(LOCAL_PREFIX.length);
        return { id: pkg, external: false }; // let Rollup resolve normally
      }

      // 3. host chunk URLs are external — never bundle them
      const hostFiles = new Set(Object.values(manifest).map(e => hostUrl(e.file)));
      if (hostFiles.has(source)) {
        return { id: source, external: true };
      }

      return null;
    },

    load(id) {
      if (!id.startsWith(FACADE_PREFIX)) return null;
      const pkg = id.slice(FACADE_PREFIX.length);
      return generateFacade(pkg);
    },
  };
}
