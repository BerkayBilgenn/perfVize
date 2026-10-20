import {readFile,readdir,realpath,stat,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join,resolve,sep} from 'node:path';
import {cleanLesson,assetPath} from '../public/sync-core.js';
export const destination='https://perfuzyon-kisisel-calisma-merkezi.earlymouse1.chatgpt.site';
export const projectRoot=fileURLToPath(new URL('../',import.meta.url));
export async function gatherPayload(){
 const lessons=[];
 for(const file of await readdir(join(projectRoot,'data','lessons')))if(file.endsWith('.json'))lessons.push(cleanLesson(JSON.parse(await readFile(join(projectRoot,'data','lessons',file),'utf8'))));
 const report=JSON.parse(await readFile(join(projectRoot,'sources','report.json'),'utf8'));
 const images=new Set(),originals=new Set();
 for(const l of lessons){if(l.cover)images.add(l.cover);for(const s of l.sections)for(const i of s.images||[])images.add(i.url);for(const a of l.attachments)originals.add(a.url);}
 const assetRoot=await realpath(join(projectRoot,'assets')),files=[];
 for(const url of [...new Set([...images,...originals])].sort()){
  if(!assetPath(url))throw new Error('Geçersiz dosya yolu: '+url);
  const path=await realpath(join(projectRoot,url.slice(1)));if(!path.startsWith(assetRoot+sep))throw new Error('Arşiv dışı dosya.');
  const info=await stat(path);if(!info.isFile())throw new Error('Dosya eksik.');
  files.push({url,path,size:info.size,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
 }
 return {lessons,report,files,inventory:{destination,access:'owner-private',status:'awaiting-publication-approval',lessons:lessons.length,images:images.size,originalFiles:originals.size,totalFiles:files.length,totalBytes:files.reduce((n,f)=>n+f.size,0),files:files.map(({path,...f})=>f),generatedAt:new Date().toISOString()}};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const {inventory}=await gatherPayload();await mkdir(join(projectRoot,'artifacts'),{recursive:true});await writeFile(join(projectRoot,'artifacts','publish-inventory.json'),JSON.stringify(inventory,null,2));console.log(JSON.stringify({...inventory,files:undefined},null,2));}
