// Export the static game to the website repo. No credentials or backend code.
import {cp,mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const website=process.argv[2];
if(!website)throw new Error('Usage: node scripts/export-website.mjs /path/to/website');
const target=resolve(website,'public/slops/dino');
await mkdir(target,{recursive:true});
for(const name of await readdir('dist')){
 if(name==='_headers')continue;
 await cp(join('dist',name),join(target,name),{recursive:true});
}
let html=await readFile(join(target,'index.html'),'utf8');
html=html.replace('<head>','<head><meta name="game-relay" content="https://dino-jev.vivekanand1101.workers.dev/api/plan"><link rel="canonical" href="https://anandvivek.in/slops/dino/"><link rel="icon" type="image/svg+xml" href="/favicon-editorial.svg"><link rel="stylesheet" href="./site-link.css">');
html=html.replace("connect-src 'self' https://api.typesafe.ai", "connect-src 'self' https://api.typesafe.ai https://dino-jev.vivekanand1101.workers.dev");
html=html.replace('<body>','<body><nav class="site-back" aria-label="Back"><a href="/slops/">← Slops</a></nav>');
await writeFile(join(target,'index.html'),html);
await writeFile(join(target,'site-link.css'),'.site-back{position:absolute;top:20px;left:20px;font:14px system-ui,sans-serif}.site-back a{color:inherit;text-underline-offset:3px}\n');
console.log('Exported credential-free game to '+target);
