// Export the static game to the website repo. No credentials or backend code.
import {cp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const website=process.argv[2];
if(!website)throw new Error('Usage: node scripts/export-website.mjs /path/to/website');
const target=resolve(website,'public/slops/dino');
await mkdir(target,{recursive:true});
for(const name of await readdir('dist')){
 if(name==='_headers')continue;
 await cp(join('dist',name),join(target,name),{recursive:true});
}
// Reuse the site's actual navigation markup and shared styles.
const navigationSource=await readFile(resolve(website,'src/components/Navigation.tsx'),'utf8');
const navigationMarkup=navigationSource.match(/<div className="wrap">[\s\S]*<\/div>/)?.[0];
if(!navigationMarkup)throw new Error('Could not find the website navigation markup.');
const navigation=navigationMarkup.replace('className="wrap"','className="wrap site-navigation"').replaceAll('className=','class=').replace(' aria-current="page"','').replace('<a href="/slops/">','<a href="/slops/" aria-current="page">');
await cp(resolve(website,'shared/site.css'),join(target,'site-shell.css'));
let html=await readFile(join(target,'index.html'),'utf8');
html=html.replace('<head>','<head><meta name="game-relay" content="https://dino-jev.vivekanand1101.workers.dev/api/plan"><link rel="canonical" href="https://anandvivek.in/slops/dino/"><link rel="icon" type="image/svg+xml" href="/favicon-editorial.svg"><link rel="stylesheet" href="./site-shell.css">');
html=html.replace("connect-src 'self' https://api.typesafe.ai", "connect-src 'self' https://api.typesafe.ai https://dino-jev.vivekanand1101.workers.dev");
html=html.replace('<body>','<body>'+navigation);
html=html.replace('</head>','<link rel="stylesheet" href="./site-layout.css"></head>');
await writeFile(join(target,'index.html'),html);
await writeFile(join(target,'site-layout.css'),`.site-navigation{--text:#1c1c1c;--muted:#62625e;font:18px/1.65 var(--serif)}
.site-navigation .site-header{margin-bottom:0}
main{max-width:760px;margin:0 auto 80px}
@media(max-width:500px){main>header{gap:16px;flex-wrap:wrap}.metrics{flex-wrap:wrap}}
`);
await rm(join(target,'site-link.css'),{force:true});
console.log('Exported credential-free game to '+target);
