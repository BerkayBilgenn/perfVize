// Run only after explicit approval of the destination and this inventory.
// A single JSON line on stdin supplies {origin,token}. Never put a token in argv.
import {createInterface} from 'node:readline';
import {readFile} from 'node:fs/promises';
import {extname} from 'node:path';
import {gatherPayload,destination} from './publish-inventory.mjs';
if(!process.argv.includes('--approved-private-publish'))throw new Error('Önce özel yayın ve içerik aktarım onayını al.');
let config;for await(const line of createInterface({input:process.stdin})){config=JSON.parse(line);break;}
if(config?.origin!==destination||typeof config.token!=='string'||!config.token)throw new Error('Onaylanan özel adres veya erişim anahtarı eksik.');
const payload=await gatherPayload();
const types={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.pdf':'application/pdf','.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation','.txt':'text/plain','.md':'text/plain'};
async function request(path,options={}){const r=await fetch(destination+path,{...options,redirect:'error',headers:{'OAI-Sites-Authorization':'Bearer '+config.token,...options.headers},signal:AbortSignal.timeout(180000)});if(!r.ok)throw new Error('Özel aktarım tamamlanamadı: '+r.status);return r;}
await request('/api/health');
let cursor=0,uploaded=0;
await Promise.all(Array.from({length:3},async()=>{while(cursor<payload.files.length){const file=payload.files[cursor++];await request('/api'+file.url,{method:'PUT',headers:{'Content-Type':types[extname(file.path)]||'application/octet-stream','X-Content-SHA256':file.sha256},body:await readFile(file.path)});const verified=await request(file.url,{method:'HEAD'});if(Number(verified.headers.get('Content-Length'))!==file.size||verified.headers.get('X-Content-SHA256')!==file.sha256)throw new Error('Aktarılan dosya doğrulanamadı.');uploaded++;if(uploaded%50===0)console.log(uploaded+'/'+payload.files.length+' dosya doğrulandı.');}}));
for(let i=0;i<payload.lessons.length;i+=10)await request('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessons:payload.lessons.slice(i,i+10),...(i===0?{report:payload.report}:{})})});
const library=await(await request('/api/library')).json();for(const lesson of payload.lessons)if(!library.lessons.some(l=>l.id===lesson.id))throw new Error('Ders aktarımı eksik.');
console.log(uploaded+' dosya ve '+payload.lessons.length+' ders/konu özel merkezde doğrulandı.');
