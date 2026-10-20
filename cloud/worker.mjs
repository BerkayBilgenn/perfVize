import {applyChange,cleanLesson,validId,assetPath,validateUpload} from '../public/sync-core.js';
import {FILES} from './static.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const dbOf=env=>env.DB.withSession?env.DB.withSession('first-primary'):env.DB;
export async function commitOperation(db,op){
 if(!validId(op.id)||!validId(op.lessonId))throw new Error('İşlem kimliği geçersiz.');
 for(let attempt=0;attempt<5;attempt++){
  const done=await db.prepare('SELECT result FROM operations WHERE id = ?').bind(op.id).first();if(done)return JSON.parse(done.result);
  const row=await db.prepare('SELECT data, revision FROM lessons WHERE id = ?').bind(op.lessonId).first();
  const current=row?{...JSON.parse(row.data),_rev:row.revision}:null;
  const changed=applyChange(current,op),l=changed.lesson,result={id:op.id,lessonId:l.id,conflict:changed.conflict};
  if(changed.unchanged){await db.prepare('INSERT OR IGNORE INTO operations (id,result) VALUES (?,?)').bind(op.id,JSON.stringify(result)).run();return result;}
  const insert=!row||changed.conflict;
  const write=insert?db.prepare('INSERT OR IGNORE INTO lessons (id,data,revision,last_op) VALUES (?,?,?,?)').bind(l.id,JSON.stringify(l),l._rev,op.id):db.prepare('UPDATE lessons SET data = ?, revision = ?, last_op = ? WHERE id = ? AND revision = ? AND NOT EXISTS (SELECT 1 FROM operations WHERE id = ?)').bind(JSON.stringify(l),l._rev,op.id,l.id,row.revision,op.id);
  await db.batch([write,db.prepare('INSERT OR IGNORE INTO operations (id,result) SELECT ?,? WHERE EXISTS (SELECT 1 FROM lessons WHERE id = ? AND last_op = ?)').bind(op.id,JSON.stringify(result),l.id,op.id)]);
  const applied=await db.prepare('SELECT result FROM operations WHERE id = ?').bind(op.id).first();if(applied)return JSON.parse(applied.result);
 }
 throw new Error('Başka bir cihaz kaydediyor. İşlem kuyrukta korundu; tekrar dene.');
}
async function library(db){const rows=await db.prepare('SELECT data,revision FROM lessons').all();const report=await db.prepare("SELECT value FROM settings WHERE key = 'report'").first();return {lessons:rows.results.map(r=>({...JSON.parse(r.data),_rev:r.revision})),report:report?JSON.parse(report.value):{},mode:'cloud',serverTime:new Date().toISOString()};}
const tools=[
 {name:'list_lessons',description:'Perfüzyon kişisel çalışma merkezindeki dersleri ve kimliklerini listeler; isteğe bağlı arama.',inputSchema:{type:'object',properties:{query:{type:'string'}},additionalProperties:false}},
 {name:'read_lesson',description:'Dersin tüm bölümlerini, kişisel notlarını ve görsel bağlantılarını okur. Yeni içerik eklemeden önce önceki kaydı kontrol et; kayıttan sonra doğrula.',inputSchema:{type:'object',properties:{lesson_id:{type:'string'}},required:['lesson_id'],additionalProperties:false}},
 {name:'add_study_lesson',description:'Kullanıcı gün sonunda çalıştıklarımızı merkeze ekle dediğinde notları ve görselleri mevcut kişisel Perfüzyon kütüphanesine kalıcı kaydeder. Başlık, konu, tam ders notu ve soru-cevapları sections içinde koru. Aynı çalışma için tekrar denemelerde aynı operation_id kullan.',inputSchema:{type:'object',properties:{operation_id:{type:'string'},title:{type:'string'},category:{type:'string'},study_date:{type:'string'},source_conversation:{type:'string'},sections:{type:'array',items:{type:'object',properties:{title:{type:'string'},text:{type:'string'},images:{type:'array',items:{type:'object',properties:{url:{type:'string'},alt:{type:'string'}},required:['url']}}},required:['title','text']}},attachments:{type:'array',items:{type:'object'}}},required:['operation_id','title','sections'],additionalProperties:false}},
 {name:'append_to_lesson',description:'Mevcut dersi silmeden yeni çalışılan bölümleri ve soru-cevapları sonuna ekler. Tekrar denemelerde aynı operation_id kullan.',inputSchema:{type:'object',properties:{operation_id:{type:'string'},lesson_id:{type:'string'},sections:{type:'array',items:{type:'object'}}},required:['operation_id','lesson_id','sections'],additionalProperties:false}},
 {name:'upload_study_file',description:'Ders görselini veya özgün dosyayı base64 olarak kalıcı kaydeder. Dönen /assets/ URL’sini ders bölümünde kullan. En fazla 20 MB.',inputSchema:{type:'object',properties:{name:{type:'string'},base64:{type:'string'}},required:['name','base64'],additionalProperties:false}}
];
const mime={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',pdf:'application/pdf',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',txt:'text/plain',md:'text/plain'};
async function storeFile(env,name,bytes){const ext=validateUpload(name,bytes,bytes.byteLength);const url='/assets/uploads/'+crypto.randomUUID()+'.'+ext;await env.BUCKET.put(url.slice(1),bytes,{httpMetadata:{contentType:mime[ext]},customMetadata:{name:String(name).slice(0,250)}});return {name,url,type:mime[ext],size:bytes.byteLength};}
async function rpc(request,env,db){let input;try{input=await request.json();}catch{return json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}},400);}const id=input.id??null;let result;
 if(input.method==='server/discover')result={supportedVersions:['2026-07-28'],capabilities:{tools:{}}};
 else if(input.method==='initialize')result={protocolVersion:input.params?.protocolVersion||'2025-03-26',capabilities:{tools:{}},serverInfo:{name:'Perfüzyon kişisel çalışma merkezi',version:'2.0.0'}};
 else if(input.method==='tools/list')result={tools};
 else if(input.method==='notifications/initialized')return new Response(null,{status:202});
 else if(input.method==='tools/call')try{
  const a=input.params?.arguments||{},name=input.params?.name;let value;
  if(name==='list_lessons'){const data=await library(db);value=data.lessons.filter(l=>!a.query||JSON.stringify(l).toLocaleLowerCase('tr').includes(a.query.toLocaleLowerCase('tr'))).map(l=>({id:l.id,title:l.title,category:l.category,sections:l.sections.length,updatedAt:l.updatedAt}));}
  else if(name==='read_lesson'){if(!validId(a.lesson_id))throw new Error('Ders kimliği geçersiz.');const row=await db.prepare('SELECT data,revision FROM lessons WHERE id = ?').bind(a.lesson_id).first();if(!row)throw new Error('Ders bulunamadı.');value={...JSON.parse(row.data),_rev:row.revision};}
  else if(name==='add_study_lesson'){if(!validId(a.operation_id))throw new Error('operation_id benzersiz UUID olmalı.');value=await commitOperation(db,{id:a.operation_id,lessonId:'study-'+a.operation_id,type:'create',lesson:{id:'study-'+a.operation_id,title:a.title,category:a.category,sections:a.sections,attachments:a.attachments||[],studyDate:a.study_date,sourceConversation:a.source_conversation,kind:'note'}});}
  else if(name==='append_to_lesson')value=await commitOperation(db,{id:a.operation_id,lessonId:a.lesson_id,type:'append',sections:a.sections});
  else if(name==='upload_study_file'){if(a.base64.length>28*1024*1024)throw new Error('Dosya 20 MB sınırını aşıyor.');const raw=atob(a.base64);if(raw.length>20*1024*1024)throw new Error('Dosya 20 MB sınırını aşıyor.');value=await storeFile(env,a.name,Uint8Array.from(raw,c=>c.charCodeAt(0)));}
  else throw new Error('Araç bulunamadı.');
  result={content:[{type:'text',text:JSON.stringify(value)}]};
 }catch(e){result={isError:true,content:[{type:'text',text:e.message}]};}
 else return json({jsonrpc:'2.0',id,error:{code:-32601,message:'Method not found'}});
 return json({jsonrpc:'2.0',id,result});
}
export default {async fetch(request,env){
 try{
  const u=new URL(request.url),path=u.pathname,db=dbOf(env);
  if(['POST','PATCH','PUT','DELETE'].includes(request.method)){const origin=request.headers.get('Origin');if(origin&&origin!==u.origin)return json({error:'İstek kaynağı geçersiz.'},403);}
  // Sites dispatch enforces the owner-private access policy before this Worker.
  if(path==='/mcp'&&request.method==='POST')return rpc(request,env,db);
  if(path==='/api/health')return json({app:'perfuzyon',version:2,mode:'cloud'});
  if(path==='/api/library'&&request.method==='GET')return json(await library(db));
  if(path==='/api/sync'&&request.method==='POST'){const body=await request.json();if(!Array.isArray(body.operations)||body.operations.length>100)throw new Error('İşlem listesi geçersiz.');const results=[];for(const op of body.operations)results.push(await commitOperation(db,op));return json({results,...await library(db)});}
  if(path==='/api/import'&&request.method==='POST'){const body=await request.json();if(body.lessons?.length>20)throw new Error('En fazla 20 ders aktarılabilir.');for(const input of body.lessons||[]){const l=cleanLesson(input);await db.prepare('INSERT OR IGNORE INTO lessons (id,data,revision,last_op) VALUES (?,?,1,?)').bind(l.id,JSON.stringify({...l,_rev:1}),'seed').run();}if(body.report)await db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind('report',JSON.stringify(body.report)).run();return json({ok:true});}
  if(path.startsWith('/api/assets/')&&request.method==='PUT'){const key=path.slice(5);if(!assetPath('/'+key))throw new Error('Dosya yolu geçersiz.');const size=Number(request.headers.get('Content-Length')||0);if(size>70*1024*1024)throw new Error('Dosya çok büyük.');await env.BUCKET.put(key,request.body,{httpMetadata:{contentType:request.headers.get('Content-Type')||'application/octet-stream'},customMetadata:{sha256:request.headers.get('X-Content-SHA256')||''}});return json({ok:true});}
  if(path==='/api/uploads'&&request.method==='POST'){const bytes=await request.arrayBuffer();return json(await storeFile(env,decodeURIComponent(request.headers.get('X-File-Name')||'file'),bytes),201);}
  if(path.startsWith('/assets/')&&['GET','HEAD'].includes(request.method)){if(!assetPath(path))return json({error:'Geçersiz dosya.'},403);const obj=await env.BUCKET.get(path.slice(1));if(!obj)return json({error:'Dosya bulunamadı.'},404);const h=new Headers();obj.writeHttpMetadata(h);h.set('Content-Length',String(obj.size));if(obj.customMetadata?.sha256)h.set('X-Content-SHA256',obj.customMetadata.sha256);h.set('Cache-Control','private, max-age=31536000, immutable');h.set('X-Content-Type-Options','nosniff');return new Response(request.method==='HEAD'?null:obj.body,{headers:h});}
  if(path==='/api/backup')return json(await library(db));
  const file=FILES[path==='/'?'/index.html':path];if(file){const h={'Content-Type':file.type,'Cache-Control':path==='/sw.js'?'no-cache':'private, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; worker-src 'self'; object-src 'self'; base-uri 'none'; frame-ancestors 'none'"};return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0)),{headers:h});}
  return json({error:'Bulunamadı.'},404);
 }catch(e){return json({error:e.message},400);}
}};
