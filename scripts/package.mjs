import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { zipSync, strToU8 } from 'fflate';
import { join } from 'node:path';
const files = {};
for (const dir of ['background','content','data','shared','options','popup','icons','docs']) {
  function visit(root) { for (const entry of readdirSync(root,{withFileTypes:true})) { const path = join(root,entry.name); if (entry.isDirectory()) visit(path); else files[path.replaceAll('\\','/')] = new Uint8Array(readFileSync(path)); } } visit(dir);
}
for (const name of ['manifest.json','README.md','PRIVACY.md','TESTING.md','LICENSE']) files[name] = new Uint8Array(readFileSync(name));
files['INSTALL.txt'] = strToU8('Extraia esta pasta. No Chrome, abra chrome://extensions, ative o Modo do desenvolvedor, clique em Carregar sem compactacao e selecione a pasta com manifest.json.');
mkdirSync('dist',{recursive:true}); const out = 'dist/gta-vi-blocker-1.0.0.zip'; writeFileSync(out,zipSync(files,{level:9})); console.log(out);
