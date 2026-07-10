import fs from 'node:fs';
import path from 'node:path';

const hostingConfig = JSON.parse(fs.readFileSync('.openai/hosting.json', 'utf8'));
const outDir = path.join('dist', '.openai');

fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(
  path.join(outDir, 'hosting.json'),
  `${JSON.stringify({project_id: hostingConfig.project_id}, null, 2)}\n`,
);
