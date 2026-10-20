import http from 'node:http';
import {readFile,mkdir,writeFile,stat,realpath,mkdtemp,rm,rename} from 'node:fs/promises';
import {createReadStream,realpathSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {Store} from './lib/store.mjs';
import {applyChange,validId,assetPath,validateUpload} from './lib/sync-core.mjs';

const ROOT=fileURLToPath(new URL('.',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.pdf':'application/pdf','.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
const allowed=new Set(['.png','.jpg','.jpeg','.webp','.gif','.pdf','.pptx','.txt','.md']);
const validateBytes=(ext,bytes)=>validateUpload('file'+ext,bytes,bytes.length);
const send=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function body(req) {let bytes=0,chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>85*1024*1024)throw Object.assign(new Error('Dosya çok büyük. En fazla 60 MB yükleyebilirsin.'),{status:413});chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new Error('Gönderilen veri okunamadı.');}}

export function createApp(root=ROOT) {
 root=realpathSync(root);
 const store=new Store(root);
 return http.createServer(async(req,res)=>{
  try {
   const host=req.headers.host||'';
   if(!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host))return send(res,403,{error:'Yalnızca yerel erişim destekleniyor.'});
   const url=new URL(req.url,'http://localhost');
   if(['POST','PATCH','PUT','DELETE'].includes(req.method)) {
    if(req.headers.origin && new URL(req.headers.origin).host!==host)return send(res,403,{error:'İstek kaynağı geçersiz.'});
    if(!(req.method==='PUT'&&url.pathname.startsWith('/api/assets/'))&&!req.headers['content-type']?.startsWith('application/json'))return send(res,415,{error:'JSON verisi gerekli.'});
   }
   res.setHeader('X-Content-Type-Options','nosniff');
   res.setHeader('Referrer-Policy','no-referrer');
   res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; object-src 'self'; frame-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'");
   if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{app:'perfuzyon',version:1});
   if(req.method==='GET'&&url.pathname==='/api/library') {let report={};try{report=JSON.parse(await readFile(join(root,'sources','report.json'),'utf8'));}catch{}return send(res,200,{lessons:await store.list(),report,mode:'local'});}
   if(req.method==='POST'&&url.pathname==='/api/sync'){
    const data=await body(req);if(!Array.isArray(data.operations)||data.operations.length>100)throw new Error('İşlem listesi geçersiz.');const results=[];
    for(const op of data.operations)results.push(await store.enqueue(async()=>{if(!validId(op.id)||!validId(op.lessonId))throw new Error('İşlem kimliği geçersiz.');let log={};const logPath=join(root,'data','sync-operations.json');try{log=JSON.parse(await readFile(logPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}if(log[op.id])return log[op.id];let current=null;try{current=await store.get(op.lessonId);}catch(e){if(e.code!=='ENOENT')throw e;}const change=current?._lastOp===op.id?{lesson:current,unchanged:true}:applyChange(current,op);if(!change.unchanged)await store.write(change.lesson);const result={id:op.id,lessonId:change.lesson.id,conflict:!!change.conflict};log[op.id]=result;await writeFile(logPath+'.tmp',JSON.stringify(log));await (await import('node:fs/promises')).rename(logPath+'.tmp',logPath);return result;}));
    let report={};try{report=JSON.parse(await readFile(join(root,'sources','report.json'),'utf8'));}catch{}return send(res,200,{results,lessons:await store.list(),report,mode:'local'});
   }
   if(req.method==='PUT'&&url.pathname.startsWith('/api/assets/')){
    const asset=url.pathname.slice(4);if(!assetPath(asset)||!/^\/assets\/uploads\/[a-zA-Z0-9_-]+\.[a-z]+$/.test(asset)||!allowed.has(extname(asset)))throw new Error('Dosya yolu geçersiz.');let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>60*1024*1024)throw new Error('Dosya 60 MB sınırını aşıyor.');chunks.push(c);}if(!size)throw new Error('Dosya boş.');const buffer=Buffer.concat(chunks);validateBytes(extname(asset),buffer);const p=join(root,asset.slice(1));await mkdir(join(root,'assets','uploads'),{recursive:true});await store.enqueue(async()=>{try{const existing=await readFile(p);if(!existing.equals(buffer))throw Object.assign(new Error('Bu dosya kimliği farklı bir içerik için kullanılmış. Cihazdaki dosya korunuyor.'),{status:409});return;}catch(e){if(e.code!=='ENOENT')throw e;}const temporary=p+'.'+randomUUID()+'.tmp';try{await writeFile(temporary,buffer,{flag:'wx'});await rename(temporary,p);}finally{await rm(temporary,{force:true});}});return send(res,201,{ok:true});
   }
   if(req.method==='POST'&&url.pathname==='/api/lessons')return send(res,201,await store.create(await body(req)));
   if(req.method==='PATCH'&&url.pathname.startsWith('/api/lessons/'))return send(res,200,await store.update(url.pathname.slice(13),await body(req)));
   if(req.method==='POST'&&url.pathname==='/api/uploads') {
    const data=await body(req), ext=extname(String(data.name||'')).toLowerCase();
    if(!allowed.has(ext))throw new Error('PDF, PPTX, PNG, JPG, WEBP, GIF, TXT veya MD dosyası seç.');
    if(typeof data.base64!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(data.base64)||data.base64.length%4!==0)throw new Error('Dosya verisi geçersiz.');
    const buffer=Buffer.from(data.base64,'base64');if(!buffer.length||buffer.length>60*1024*1024)throw new Error('Dosya boş veya 60 MB sınırını aşıyor.');
    validateBytes(ext,buffer);
    const dir=join(root,'assets','uploads');await mkdir(dir,{recursive:true});const file=randomUUID()+ext;await writeFile(join(dir,file),buffer,{flag:'wx'});
    return send(res,201,{name:String(data.name).slice(0,250),url:'/assets/uploads/'+file,type:types[ext],size:buffer.length});
   }
   if(req.method==='GET'&&url.pathname==='/api/backup') {
    const temp=await mkdtemp(join(tmpdir(),'perfuzyon-backup-'));const archive=join(temp,'perfuzyon-yedek.tar.gz');
    try {
     await new Promise((ok,no)=>{const proc=spawn('/usr/bin/tar',['-czf',archive,'data','assets','sources','README.md'],{cwd:root,stdio:['ignore','ignore','pipe']});proc.stderr.resume();proc.once('error',no);proc.once('close',code=>code===0?ok():no(new Error('Yedek tamamlanamadı. Özgün dosyaların okunabildiğini kontrol et.')));});
     const info=await stat(archive);res.writeHead(200,{'Content-Type':'application/gzip','Content-Length':info.size,'Content-Disposition':'attachment; filename="perfuzyon-yedek.tar.gz"'});
     const stream=createReadStream(archive);stream.on('error',()=>res.destroy());res.once('close',()=>{stream.destroy();rm(temp,{recursive:true,force:true}).catch(()=>{});});stream.pipe(res);return;
    }catch(e){await rm(temp,{recursive:true,force:true});throw Object.assign(e,{status:500});}
   }
   if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'Bu işlem desteklenmiyor.'});
   const isAsset=url.pathname.startsWith('/assets/');
   let rel=decodeURIComponent(url.pathname);
   const base=join(root,isAsset?'assets':'public');
   if(isAsset)rel=rel.slice(7);
   if(rel==='/')rel='/index.html';
   const path=resolve(base,'.'+rel);
   if(!path.startsWith(resolve(base)+sep))return send(res,403,{error:'Geçersiz dosya yolu.'});
   const actual=await realpath(path);if(!actual.startsWith(resolve(base)+sep))return send(res,403,{error:'Geçersiz dosya yolu.'});
   const s=await stat(actual);if(!s.isFile())return send(res,404,{error:'Dosya bulunamadı.'});
   const headers={'Content-Type':types[extname(actual).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
   let start=0,end=s.size-1,code=200;
   if(req.headers.range){const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(match){start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end;if(start>end||start>=s.size){res.writeHead(416,{'Content-Range':`bytes */${s.size}`});return res.end();}code=206;headers['Content-Range']=`bytes ${start}-${end}/${s.size}`;}}
   headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(code,headers);if(req.method==='HEAD')return res.end();const stream=createReadStream(actual,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
  } catch(e) {if(!res.headersSent)send(res,e.code==='ENOENT'?404:e.status||400,{error:e.code==='ENOENT'?'Dosya bulunamadı.':e.message});else res.destroy();}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const server=createApp();const port=Number(process.env.PORT||3000);
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`${port} portu zaten kullanılıyor.`:e.message);process.exit(1);});
 server.listen(port,'127.0.0.1',()=>console.log(`Perfüzyon çalışma merkezi hazır: http://localhost:${port}`));
}
