import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const manifest = JSON.parse(
  readFileSync(new URL('../dist/.vite/manifest.json', import.meta.url), 'utf8'),
);
const entry = Object.entries(manifest).find(([, item]) => item.isEntry);
if (!entry) throw new Error('Build manifest has no application entry. Run npm run build first.');
const initial = new Set();
function visit(key) {
  if (initial.has(key)) return;
  initial.add(key);
  for (const child of manifest[key].imports ?? []) visit(child);
}
visit(entry[0]);
const assets = new Map();
for (const [key, item] of Object.entries(manifest)) {
  if (!item.file.endsWith('.js')) continue;
  const url = new URL(`../dist/${item.file}`, import.meta.url);
  assets.set(item.file, {
    file: item.file,
    bytes: statSync(url).size,
    gzipBytes: gzipSync(readFileSync(url)).length,
    initial: initial.has(key),
  });
}
const values = [...assets.values()];
const total = (items) => ({
  bytes: items.reduce((sum, item) => sum + item.bytes, 0),
  gzipBytes: items.reduce((sum, item) => sum + item.gzipBytes, 0),
});
console.log(
  JSON.stringify(
    {
      initialJavaScript: total(values.filter((item) => item.initial)),
      allJavaScript: total(values),
      largestChunk: values.reduce((a, b) => (a.bytes > b.bytes ? a : b)),
      chunkCount: values.length,
    },
    null,
    2,
  ),
);
if (values.some((item) => item.bytes > 500000))
  throw new Error('A JavaScript chunk exceeds the 500 kB budget.');
