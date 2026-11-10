// Publish only the website and delivery assets; keep development files private to the source tree.
import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');
mkdirSync(output, { recursive: true });
for (const entry of ['index.html', 'css', 'js', 'assets']) {
  cpSync(resolve(root, entry), resolve(output, entry), { recursive: true });
}
console.log('Static website prepared in dist/');
