export const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id);
export const assetPath=path=>typeof path==='string'&&/^\/assets\/[a-zA-Z0-9_./-]+$/.test(path)&&!path.split('/').includes('..');
export function validateUpload(name,bytes,size){
 const ext=String(name).split('.').pop().toLowerCase();if(!['png','jpg','jpeg','webp','gif','pdf','pptx','txt','md'].includes(ext))throw new Error('Bu dosya türü desteklenmiyor.');if(!size||size>60*1024*1024)throw new Error('Dosya boş veya 60 MB sınırını aşıyor.');
 const ascii=(start,end)=>String.fromCharCode(...bytes.slice(start,end)),starts=values=>values.every((v,i)=>bytes[i]===v);
 const valid={png:()=>starts([137,80,78,71,13,10,26,10]),jpg:()=>starts([255,216]),jpeg:()=>starts([255,216]),webp:()=>ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP',gif:()=>ascii(0,3)==='GIF',pdf:()=>ascii(0,5)==='%PDF-',pptx:()=>starts([80,75])};
 if(valid[ext]&&!valid[ext]())throw new Error('Dosya içeriği uzantısıyla eşleşmiyor. Doğru dosyayı seç.');return ext;
}
export function cleanLesson(input){
 const l=structuredClone(input);delete l._search;
 if(!validId(l.id)||typeof l.title!=='string'||!l.title.trim()||l.title.length>250||!Array.isArray(l.sections)||l.sections.length>3000)throw new Error('Ders verisi geçersiz.');
 for(const s of l.sections){if(s.text!==undefined&&(typeof s.text!=='string'||s.text.length>1000000))throw new Error('Not metni geçersiz.');for(const i of s.images||[])if(!assetPath(i.url))throw new Error('Görsel yolu geçersiz.');}
 for(const a of l.attachments||[])if(!assetPath(a.url))throw new Error('Dosya yolu geçersiz.');
 if(l.cover&&!assetPath(l.cover))throw new Error('Kapak yolu geçersiz.');
 const now=new Date().toISOString();return {...l,category:String(l.category||'Genel').slice(0,100),tags:l.tags||[],attachments:l.attachments||[],personalNotes:l.personalNotes||'',favorite:!!l.favorite,completed:!!l.completed,createdAt:l.createdAt||now,updatedAt:l.updatedAt||now};
}
export function applyChange(current,op){
 if(!validId(op.id)||!validId(op.lessonId))throw new Error('İşlem kimliği geçersiz.');
 if(op.type==='create'){
  if(current)return {lesson:current,unchanged:true,conflict:false};
  return {lesson:{...cleanLesson({...op.lesson,id:op.lessonId}),_rev:1,_lastOp:op.id},conflict:false};
 }
 if(!current)throw new Error('Ders bulunamadı.');
 let patch=op.patch||{};
 if(op.type==='append'){const sections=op.sections;if(!Array.isArray(sections))throw new Error('Yeni bölümler eksik.');const next=cleanLesson({...current,sections:[...current.sections,...sections]});return {lesson:{...next,_rev:(current._rev||1)+1,_lastOp:op.id,updatedAt:new Date().toISOString()},conflict:false};}
 if(op.type!=='patch')throw new Error('İşlem desteklenmiyor.');
 if(Object.keys(patch).some(k=>!['favorite','completed','personalNotes'].includes(k)))throw new Error('Desteklenmeyen ders alanı.');
 for(const k of ['favorite','completed'])if(k in patch&&typeof patch[k]!=='boolean')throw new Error('Durum geçersiz.');
 if('personalNotes'in patch&&(typeof patch.personalNotes!=='string'||patch.personalNotes.length>1000000))throw new Error('Not metni geçersiz.');
 const conflict='personalNotes'in patch&&typeof op.before?.personalNotes==='string'&&current.personalNotes!==op.before.personalNotes&&current.personalNotes!==patch.personalNotes;
 if(conflict)return {conflict:true,lesson:{...current,...patch,id:'conflict-'+op.id,title:(current.title.slice(0,205)+' · Diğer cihazdaki not'),conflictOf:current.id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),_rev:1,_lastOp:op.id}};
 return {conflict:false,lesson:{...current,...patch,_rev:(current._rev||1)+1,_lastOp:op.id,updatedAt:new Date().toISOString()}};
}
