/**
 * HOST PLUGIN
 * Emits an entry chunk per imported npm package (only those that survive
 * tree-shaking), with preserveSignature so named exports are accessible.
 * Writes shared-manifest.json listing each chunk's file and exports.
 *
 * Known singletons are still emitted as shared chunks (host owns the copy),
 * but flagged so the extension plugin never supplements them locally.
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';
import type { Plugin, OutputChunk } from 'vite';

const require = createRequire(import.meta.url);

export interface SharedManifestEntry {
  file: string;
  exports: string[];
  /**
   * false  → pure/stateless, extension can locally bundle exports the host
   *          didn't include and import the rest from the host chunk.
   * true   → singleton, extension must use the host chunk for ALL exports.
   *          If the extension needs an export not in the host chunk it should
   *          fail at build time (missing external).
   */
  singleton: boolean;
}

export type SharedManifest = Record<string, SharedManifestEntry>;

// ─── known singletons ───────────────────────────────────────────────────────
// There is no standard machine-readable signal for this. Maintain this list
// for packages whose instance identity matters at runtime.
const KNOWN_SINGLETONS = new Set([
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'scheduler',
  'vue',
  '@vue/runtime-core',
  '@vue/reactivity',
  'svelte',
]);

// ─── packages that only export via deep paths, never a root entry ────────────
const NO_ROOT_ENTRY = new Set([
  '@babel/runtime',
  '@babel/runtime-corejs3',
  'tslib',
  'core-js',
  'core-js-pure',
]);

function packageNameFromId(id: string): string | null {
  // handles scoped (@scope/pkg) and unscoped packages
  const m = id.match(/node_modules\/((@[^/]+\/[^/]+)|([^/]+))/);
  return m?.[1] ?? null;
}

function isRootEntry(id: string, pkg: string): boolean {
  // the resolved file should be the package's own index / main, not a subpath
  const afterPkg = id.split(`node_modules/${pkg}/`)[1] ?? '';
  return /^(index\.[jt]sx?|dist\/[^/]+\.[jt]sx?|cjs\/[^/]+\.[jt]sx?|esm\/[^/]+\.[jt]sx?)$/.test(afterPkg);
}

function isSingleton(pkg: string): boolean {
  return KNOWN_SINGLETONS.has(pkg);
}

export function sharedManifestPlugin(options: {
  /** Additional packages to treat as singletons beyond the built-in list */
  singletons?: string[];
  /** Output filename, default: 'shared-manifest.json' */
  manifestFileName?: string;
} = {}): Plugin {
  const { singletons = [], manifestFileName = 'shared-manifest.json' } = options;
  const extraSingletons = new Set(singletons);

  const emitted = new Set<string>();
  // map chunk name → package name (chunk.name is the `name` we pass to emitFile)
  const chunkNameToPkg = new Map<string, string>();

  return {
    name: 'vite-plugin-shared-manifest',
    enforce: 'post',

    moduleParsed(info) {
      for (const id of info.importedIds) {
        const pkg = packageNameFromId(id);
        if (!pkg) continue;
        if (emitted.has(pkg)) continue;
        if (NO_ROOT_ENTRY.has(pkg)) continue;
        if (!isRootEntry(id, pkg)) continue;

        emitted.add(pkg);

        const chunkName = `__shared__${pkg}`;
        chunkNameToPkg.set(chunkName, pkg);

        this.emitFile({
          type: 'chunk',
          id: pkg,
          name: chunkName,
          preserveSignature: 'exports-only',
        });
      }
    },

    generateBundle(_, bundle) {
      const manifest: SharedManifest = {};

      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        const pkg = chunkNameToPkg.get(chunk.name);
        if (!pkg) continue;

        manifest[pkg] = {
          file: chunk.fileName,
          exports: chunk.exports,
          singleton: isSingleton(pkg) || extraSingletons.has(pkg),
        };
      }

      this.emitFile({
        type: 'asset',
        fileName: manifestFileName,
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
}
