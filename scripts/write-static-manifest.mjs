import fs from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const outFile = path.resolve('server/staticManifest.ts');
const textExtensions = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.map']);

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.webp')) return 'image/webp';
  if (filePath.endsWith('.ico')) return 'image/x-icon';
  return 'application/octet-stream';
}

async function walk(dir) {
  const entries = await fs.readdir(dir, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const rel = path.relative(distDir, fullPath).split(path.sep).join('/');
    if (rel === 'server' || rel.startsWith('server/') || rel === '.openai' || rel.startsWith('.openai/')) continue;
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

const files = await walk(distDir);
const assets = {};
for (const file of files) {
  const route = `/${path.relative(distDir, file).split(path.sep).join('/')}`;
  const ext = path.extname(file);
  const data = await fs.readFile(file);
  const isText = textExtensions.has(ext);
  assets[route] = {
    contentType: contentType(file),
    encoding: isText ? 'text' : 'base64',
    body: isText ? data.toString('utf8') : data.toString('base64'),
  };
}
if (assets['/index.html']) assets['/'] = assets['/index.html'];

await fs.writeFile(
  outFile,
  `export type StaticAsset = {contentType: string; encoding: 'text' | 'base64'; body: string};\n` +
    `export const staticAssets: Record<string, StaticAsset> = ${JSON.stringify(assets, null, 2)};\n`,
);
