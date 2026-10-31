import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve('src');
function files(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );
}
const sources = files(root).filter((file) => /\.tsx?$/.test(file));
const graph = new Map();
const errors = [];
for (const file of sources) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const edges = [];
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const target = node.moduleSpecifier.text;
      if (target.startsWith('#') || target.startsWith('.'))
        errors.push(`${relative}: internal imports must use @/ (${target})`);
      if (target.startsWith('@/')) {
        const destination = target.slice(2);
        if (relative.startsWith('shared/') && /^(features|app|pages)\//.test(destination))
          errors.push(`${relative}: shared code depends on ${destination}`);
        if (relative.startsWith('features/') && /^(app|pages)\//.test(destination))
          errors.push(`${relative}: feature depends on ${destination}`);
        const resolved = [destination, `${destination}.ts`, `${destination}.tsx`]
          .map((name) => path.join(root, name))
          .find((name) => fs.existsSync(name) && fs.statSync(name).isFile());
        if (!resolved) errors.push(`${relative}: unresolved import ${target}`);
        else if (/\.tsx?$/.test(resolved)) edges.push(resolved);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  graph.set(file, edges);
}
const done = new Set(),
  active = new Set();
function visit(file, trail = []) {
  if (active.has(file)) {
    errors.push(
      `Import cycle: ${[...trail, file].map((name) => path.relative(root, name)).join(' -> ')}`,
    );
    return;
  }
  if (done.has(file)) return;
  active.add(file);
  for (const dependency of graph.get(file) ?? []) visit(dependency, [...trail, file]);
  active.delete(file);
  done.add(file);
}
for (const file of sources) visit(file);
if (errors.length) throw new Error(errors.join('\n'));
console.log(
  `PASS: ${sources.length} source modules use valid aliases, respect layer boundaries and have no static import cycles.`,
);
