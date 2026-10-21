import {cp,mkdir,rm,writeFile,readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const dist=join(root,'dist');

async function copyDir(name,target){
 await mkdir(target,{recursive:true});
 for(const entry of await readdir(join(root,name)))await cp(join(root,name,entry),join(target,entry),{recursive:true,force:true});
}

await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});

// Uygulama kabuğu (index.html, app.js, styles.css, sw.js, manifest…) doğrudan kökte.
await copyDir('public',dist);
// Ders görselleri ve özgün dosyalar /assets altında.
await copyDir('assets',join(dist,'assets'));

// Vercel'de kalıcı disk yok: statik katalog uç noktası için kitaplık özeti.
const lessonDir=join(root,'data','lessons');
const lessons=(await readdir(lessonDir)).filter(f=>f.endsWith('.json'));
if(!lessons.length)throw new Error('data/lessons içinde ders bulunamadı.');
let report={};
try{report=JSON.parse(await readFile(join(root,'sources','report.json'),'utf8'));}catch{}
await writeFile(
 join(dist,'library.json'),
 JSON.stringify({lessons:lessons.length,report,generatedAt:new Date().toISOString()})
);

console.log(`Vercel çıktısı hazır: dist/ · ${lessons.length} ders · assets kopyalandı.`);
