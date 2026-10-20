import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker,{commitOperation} from '../cloud/worker.mjs';

function database(){const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../drizzle/0000_library.sql',import.meta.url),'utf8').replaceAll('--> statement-breakpoint',''));const adapter={prepare(query){let values=[];return{bind(...v){values=v;return this;},async first(){return sql.prepare(query).get(...values)||null;},async all(){return {results:sql.prepare(query).all(...values)};},async run(){return sql.prepare(query).run(...values);}};},async batch(stmts){sql.exec('BEGIN');try{const results=[];for(const s of stmts)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}};return {db:adapter,close:()=>sql.close()};}
test('sync retries apply an offline create and append exactly once',async()=>{const {db,close}=database();try{const op={id:'op-a',lessonId:'lesson-a',type:'create',lesson:{title:'Kalp',sections:[{title:'İlk ders',text:'Not',images:[]}]}};await commitOperation(db,op);await commitOperation(db,op);const append={id:'append-a',lessonId:'lesson-a',type:'append',sections:[{title:'İkinci ders',text:'Yeni not',images:[]}]};await commitOperation(db,append);await commitOperation(db,append);const data=JSON.parse((await db.prepare('SELECT data FROM lessons WHERE id = ?').bind('lesson-a').first()).data);assert.equal(data.sections.length,2);assert.equal(data._rev,2);assert.equal((await db.prepare('SELECT * FROM operations').all()).results.length,2);}finally{close();}});
test('two devices with stale notes preserve the original and a separately synced copy',async()=>{const {db,close}=database();try{await commitOperation(db,{id:'create',lessonId:'lesson-a',type:'create',lesson:{title:'Kalp',sections:[],personalNotes:'İlk'}});await commitOperation(db,{id:'mac',lessonId:'lesson-a',type:'patch',before:{personalNotes:'İlk'},patch:{personalNotes:'Mac notu'}});const tablet={id:'tablet',lessonId:'lesson-a',type:'patch',before:{personalNotes:'İlk'},patch:{personalNotes:'Tablet notu'}};assert.equal((await commitOperation(db,tablet)).conflict,true);await commitOperation(db,tablet);const lessons=(await db.prepare('SELECT data FROM lessons').all()).results.map(x=>JSON.parse(x.data));assert.equal(lessons.length,2);assert.deepEqual(new Set(lessons.map(l=>l.personalNotes)),new Set(['Mac notu','Tablet notu']));}finally{close();}});
test('the chat connection saves, reads and extends a day of study without duplicate sections',async()=>{
 const {db,close}=database(),env={DB:db};
 const rpc=async(method,params)=>{const r=await worker.fetch(new Request('https://study.example/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}),env);return r.json();};
 const call=async(name,args)=>{const r=await rpc('tools/call',{name,arguments:args});assert.ok(!r.result.isError,r.result.content[0].text);return JSON.parse(r.result.content[0].text);};
 try{
  const list=await rpc('tools/list');assert.ok(list.result.tools.some(t=>t.name==='read_lesson'));
  const data={operation_id:'study-day-1',title:'KPB · Günlük çalışma',study_date:'2026-10-21',sections:[{title:'Soru ve cevap',text:'Soru: Akım?\nCevap: Ders notu.',images:[]}]};
  const saved=await call('add_study_lesson',data);await call('add_study_lesson',data);
  const append={operation_id:'study-more-1',lesson_id:saved.lessonId,sections:[{title:'Düzeltme',text:'Düzeltilen açıklama',images:[]}]};
  await call('append_to_lesson',append);await call('append_to_lesson',append);
  const lesson=await call('read_lesson',{lesson_id:saved.lessonId});assert.equal(lesson.studyDate,'2026-10-21');assert.equal(lesson.sections.length,2);assert.ok(lesson.sections[0].text.includes('Cevap:'));
  const forged=await worker.fetch(new Request('https://study.example/api/sync',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:'{}'}),env);assert.equal(forged.status,403);
 }finally{close();}
});
