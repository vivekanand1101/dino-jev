import {rm,cp,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
execFileSync(process.execPath,['node_modules/typescript/bin/tsc'],{stdio:'inherit'});
await cp('public','dist',{recursive:true});
console.log('Game assets built in dist/. Deploy with the Worker for browser-compatible Jev play.');
