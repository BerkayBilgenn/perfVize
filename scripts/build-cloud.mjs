import {readFile,readdir,mkdir,writeFile,rm,copyFile} from 'node:fs/promises';
import {join} from 'node:path';
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',webmanifest:'application/manifest+json',svg:'image/svg+xml',png:'image/png'};
const files={};for(const name of await readdir('public')){const ext=name.split('.').pop();if(types[ext])files['/'+name]={type:types[ext],base64:(await readFile(join('public',name))).toString('base64')};}
const core=(await readFile('public/sync-core.js','utf8')).replace(/export /g,'');const worker=(await readFile('cloud/worker.mjs','utf8')).replace(/^import .*;\n/gm,'');
await rm('dist',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});await writeFile('dist/server/index.js',`const FILES=${JSON.stringify(files)};\n${core}\n${worker}`);await copyFile('.openai/hosting.json','dist/.openai/hosting.json');console.log('Cloud artifact built:',Object.keys(files).length,'application files.');
