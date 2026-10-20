import {mkdir,readdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';

export function localAsset(url) {
  return typeof url === 'string' && /^\/assets\/[a-zA-Z0-9_./%\-]+$/.test(url) && !decodeURIComponent(url).split('/').some(p=>p==='..');
}
function validate(data) {
  if(typeof data.title!=='string'||!data.title.trim()||data.title.length>250) throw new Error('Ders başlığı 1–250 karakter olmalı.');
  if(!Array.isArray(data.sections)||data.sections.length>3000) throw new Error('Ders içeriği geçersiz.');
  for(const s of data.sections) {
    if(typeof s.text!=='string'&&s.text!==undefined) throw new Error('Not metni geçersiz.');
    if(s.text?.length>1000000) throw new Error('Not metni çok uzun.');
    for(const i of s.images||[]) if(!localAsset(i.url)) throw new Error('Görsel yolu geçersiz.');
  }
  for(const a of data.attachments||[]) if(!localAsset(a.url)) throw new Error('Dosya yolu geçersiz.');
  if(data.sourceUrl && !/^https:\/\/chatgpt\.com\/c\/[a-zA-Z0-9-]+$/.test(data.sourceUrl)) throw new Error('Kaynak bağlantısı geçersiz.');
}
export class Store {
  constructor(root) {this.dir=join(root,'data','lessons');this.queue=Promise.resolve();}
  path(id) {if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error('Ders kimliği geçersiz.'); return join(this.dir,id+'.json');}
  async list() {
    await mkdir(this.dir,{recursive:true});
    const files=(await readdir(this.dir)).filter(f=>f.endsWith('.json'));
    return (await Promise.all(files.map(f=>readFile(join(this.dir,f),'utf8').then(JSON.parse)))).sort((a,b)=>(a.order??999)-(b.order??999)||b.createdAt.localeCompare(a.createdAt));
  }
  async get(id) {return JSON.parse(await readFile(this.path(id),'utf8'));}
  async write(data) {
    await mkdir(this.dir,{recursive:true});
    const path=this.path(data.id), temp=path+'.'+randomUUID()+'.tmp';
    await writeFile(temp,JSON.stringify(data,null,2),'utf8');
    await rename(temp,path);return data;
  }
  enqueue(fn) {const task=this.queue.then(fn);this.queue=task.catch(()=>{});return task;}
  create(input) {return this.enqueue(async()=>{validate(input);const stamp=new Date().toISOString();return this.write({...input,id:randomUUID(),title:input.title.trim(),category:String(input.category||'Genel').slice(0,100),tags:(input.tags||[]).map(String).slice(0,30),attachments:input.attachments||[],personalNotes:'',favorite:false,completed:false,createdAt:stamp,updatedAt:stamp});});}
  update(id,patch) {return this.enqueue(async()=>{const data=await this.get(id);for(const k of ['favorite','completed']) if(k in patch){if(typeof patch[k]!=='boolean')throw new Error('Durum geçersiz.');data[k]=patch[k];}if('personalNotes'in patch){if(typeof patch.personalNotes!=='string'||patch.personalNotes.length>1000000)throw new Error('Kişisel not geçersiz.');data.personalNotes=patch.personalNotes;}data.updatedAt=new Date().toISOString();return this.write(data);});}
}
