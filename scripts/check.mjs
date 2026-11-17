import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const m = JSON.parse(readFileSync('manifest.json','utf8'));
if (m.manifest_version !== 3) throw new Error('Manifest V3 necessário.');
const files = [...m.content_scripts.flatMap(s => [...s.js,...s.css]),m.background.service_worker,m.action.default_popup,m.options_page,...Object.values(m.icons)];
for (const path of files) if (!existsSync(path)) throw new Error('Arquivo ausente: ' + path);
let count = 0;
for (const dir of ['background','content','data','shared','options','popup','scripts','tests']) {
  function visit(root) { for (const entry of readdirSync(root,{withFileTypes:true})) { const path = join(root,entry.name); if (entry.isDirectory()) visit(path); else if (/\.(m?js)$/.test(path)) { execFileSync(process.execPath,['--check',path]); count++; } } }
  visit(dir);
}
for (const path of ['popup/popup.html','options/options.html']) {
  const html = readFileSync(path,'utf8');
  for (const [,resource] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) if (!resource.startsWith('http') && !existsSync(join(path.split('/')[0],resource))) throw new Error('Recurso ausente: ' + resource);
  if (/<script(?![^>]*src=)[^>]*>[^<]+/i.test(html)) throw new Error('Script inline não permitido.');
}
console.log(`Manifest V3, recursos e sintaxe de ${count} arquivos JavaScript: OK.`);
