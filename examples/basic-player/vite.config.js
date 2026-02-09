import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const packagesRoot = path.resolve(repoRoot, 'packages');

export default defineConfig({
  server: {
    fs: {
      allow: [repoRoot, packagesRoot],
    },
  },
});
