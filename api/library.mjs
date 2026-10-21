import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';

// Vercel'de dosya sistemi salt okunurdur. Kitaplık, depoya işlenmiş ders
// JSON'larından okunur; cihazlar arası yazma bu sürümde kapalıdır.
const root=process.cwd();
const lessonDir=join(root,'data','lessons');

let cached=null;

function sortLessons(list){
 return list.sort((a,b)=>(a.order??999)-(b.order??999)||String(b.createdAt).localeCompare(String(a.createdAt)));
}

async function loadLibrary(){
 if(cached)return cached;
 const files=(await readdir(lessonDir)).filter(name=>name.endsWith('.json'));
 const lessons=sortLessons(await Promise.all(files.map(async name=>{
  const value=JSON.parse(await readFile(join(lessonDir,name),'utf8'));
  return value;
 })));
 let report={};
 try{report=JSON.parse(await readFile(join(root,'data','report.json'),'utf8'));}
 catch{try{report=JSON.parse(await readFile(join(root,'sources','report.json'),'utf8'));}catch{}}
 cached={lessons,report,mode:'static',readOnly:true};
 return cached;
}

const send=(res,status,data,cache='no-store')=>{
 res.statusCode=status;
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control',cache);
 res.setHeader('X-Content-Type-Options','nosniff');
 res.end(JSON.stringify(data));
};

export default async function handler(req,res){
 if(req.method!=='GET'&&req.method!=='HEAD'){
  res.setHeader('Allow','GET, HEAD');
  return send(res,405,{error:'Yayındaki site salt okunur. Yeni notlar bu cihazda saklanır.'});
 }
 try{
  const library=await loadLibrary();
  if(req.method==='HEAD')return res.end();
  return send(res,200,{...library,serverTime:new Date().toISOString()},'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
 }catch(error){
  return send(res,500,{error:'Kütüphane okunamadı. Lütfen daha sonra tekrar dene.',detail:error.message});
 }
}
