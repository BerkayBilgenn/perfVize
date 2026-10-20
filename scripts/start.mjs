import {spawn} from 'node:child_process';
import {mkdir,open,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const url='http://localhost:3000';
async function healthy(){try{const res=await fetch('http://127.0.0.1:3000/api/health',{signal:AbortSignal.timeout(1000)});return (await res.json()).app==='perfuzyon';}catch{return false;}}
if(!await healthy()){
 await mkdir(join(root,'.runtime'),{recursive:true});
 const log=await open(join(root,'.runtime/server.log'),'a');
 const child=spawn(process.execPath,[join(root,'server.mjs')],{cwd:root,detached:true,stdio:['ignore',log.fd,log.fd]});
 child.unref();await writeFile(join(root,'.runtime/server.pid'),String(child.pid));await log.close();
 let ready=false;for(let i=0;i<30;i++){if(await healthy()){ready=true;break;}await new Promise(r=>setTimeout(r,200));}
 if(!ready){console.error('Uygulama başlatılamadı. 3000 portu başka bir uygulama tarafından kullanılıyor olabilir. Ayrıntılar: .runtime/server.log');process.exit(1);}
}
console.log('Perfüzyon çalışma merkezi hazır: '+url);
if(!process.argv.includes('--no-open'))spawn('/usr/bin/open',['-a','/Applications/Google Chrome.app',url],{stdio:'ignore'}).unref();
