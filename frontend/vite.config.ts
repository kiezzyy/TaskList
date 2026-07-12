import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const packageManifest = JSON.parse(readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8')) as { version?: string };
const appVersion = packageManifest.version ?? '0.0.0';

export default defineConfig({
  base: './',
  define: {
    'import.meta.env.VITE_TASKLIST_APP_VERSION': JSON.stringify(appVersion)
  }
});
