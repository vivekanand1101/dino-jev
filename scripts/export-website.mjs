// Export the static game to the website repo. No credentials or backend code.
import {cp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
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
html=html.replace('<head>','<head><meta name="game-relay" content="/slops/dino/api/plan"><link rel="canonical" href="https://anandvivek.in/slops/dino/"><link rel="icon" type="image/svg+xml" href="/favicon-editorial.svg"><link rel="stylesheet" href="./site-shell.css">');
html=html.replace("connect-src 'self' https://api.typesafe.ai", "connect-src 'self'");
html=html.replace('<body>','<body>'+navigation);
html=html.replace('./key-settings.css','/shared/jev-key-settings.css');
const clientVersion=createHash('sha256').update(await readFile(join(target,'modules/runner-client.js'))).digest('hex').slice(0,12);
const controller=(await readFile(join(target,'controller.js'),'utf8')).replace("'./key-settings.js'", "'/shared/jev-key-settings.js'").replace('./modules/runner-client.js','./modules/runner-client.js?v='+clientVersion);
await writeFile(join(target,'controller.js'),controller);
const version=createHash('sha256').update(controller).digest('hex').slice(0,12);
html=html.replace('./controller.js', './controller.js?v='+version);
const layout=`.site-navigation{--text:#1c1c1c;--muted:#62625e;font:18px/1.65 var(--serif)}
.site-navigation .site-header{margin-bottom:0}
.game-controls{display:flex;align-items:flex-start;justify-content:flex-end;gap:12px;flex-wrap:wrap}\n.play-controls{display:flex;gap:4px}\nmain>header button{min-height:40px}\n.key-summary{margin-left:auto}\nmain{max-width:760px;margin:0 auto 80px}
@media(max-width:500px){main>header{gap:16px;flex-wrap:wrap}.metrics{flex-wrap:wrap}}
`;
await writeFile(join(target,'site-layout.css'),layout);
const layoutVersion=createHash('sha256').update(layout).digest('hex').slice(0,12);
html=html.replace('</head>',`<link rel="stylesheet" href="./site-layout.css?v=${layoutVersion}"></head>`);
await writeFile(join(target,'index.html'),html);
await rm(join(target,'site-link.css'),{force:true});
for(const name of ['key-settings.js','key-settings.css','modules/credentials.js'])await rm(join(target,name),{force:true});
console.log('Exported credential-free game to '+target);
