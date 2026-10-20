import test from 'node:test';
import assert from 'node:assert/strict';

test('two devices editing the same note retain both versions in a conflict copy',async()=>{
 const {applyChange}=await import('../lib/sync-core.mjs');
 const remote={id:'lesson-a',title:'Kalp',sections:[],personalNotes:'Mac notu',favorite:true,_rev:3};
 const op={id:'op-tablet',lessonId:'lesson-a',type:'patch',before:{personalNotes:'Eski not'},patch:{personalNotes:'Tablet notu'}};
 const r=applyChange(remote,op);
 assert.equal(r.conflict,true);assert.equal(r.lesson.id,'conflict-op-tablet');assert.equal(r.lesson.personalNotes,'Tablet notu');assert.equal(remote.personalNotes,'Mac notu');
});
test('unrelated changes from another device do not create a false conflict',async()=>{
 const {applyChange}=await import('../lib/sync-core.mjs');
 const remote={id:'lesson-a',title:'Kalp',sections:[],personalNotes:'Not',favorite:true,_rev:3};
 const r=applyChange(remote,{id:'op-2',type:'patch',lessonId:'lesson-a',before:{personalNotes:'Not'},patch:{personalNotes:'Yeni not'}});
 assert.equal(r.conflict,false);assert.equal(r.lesson.favorite,true);assert.equal(r.lesson.personalNotes,'Yeni not');assert.equal(r.lesson._rev,4);
});
test('new offline lessons keep their original UUID and reject remote script assets',async()=>{
 const {applyChange}=await import('../lib/sync-core.mjs');
 const op={id:'op-3',type:'create',lessonId:'tablet-id',lesson:{id:'tablet-id',title:'Yeni ders',sections:[{text:'Not',images:[]}],attachments:[]}};
 assert.equal(applyChange(null,op).lesson.id,'tablet-id');
 op.lesson.sections[0].images=[{url:'https://other.example/x.png'}];assert.throws(()=>applyChange(null,op));
});
test('file validation rejects renamed or empty files before they enter the device queue',async()=>{
 const {validateUpload}=await import('../public/sync-core.js');
 assert.throws(()=>validateUpload('fake.png',new TextEncoder().encode('not a PNG'),9));
 assert.throws(()=>validateUpload('empty.txt',new Uint8Array(),0));
 assert.doesNotThrow(()=>validateUpload('notes.md',new TextEncoder().encode('# Ders'),6));
 assert.doesNotThrow(()=>validateUpload('page.pdf',new TextEncoder().encode('%PDF-1.7'),8));
});
