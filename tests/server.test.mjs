import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('a lesson and its notes survive a fresh store instance', async () => {
  const { Store } = await import('../lib/store.mjs');
  const root = await mkdtemp(join(tmpdir(), 'perfuzyon-test-'));
  try {
    const first = new Store(root);
    const lesson = await first.create({title:'Kalp ve damar',category:'Anatomi',sections:[{title:'Not',text:'Aort',images:[]}],attachments:[]});
    await first.update(lesson.id,{personalNotes:'Tekrar çalış',favorite:true});
    const next = new Store(root);
    const saved = await next.get(lesson.id);
    assert.equal(saved.personalNotes,'Tekrar çalış');
    assert.equal(saved.favorite,true);
    assert.equal(saved.sections[0].text,'Aort');
    assert.equal((await next.list()).length,1);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test('invalid titles and path-like identifiers cannot write outside the lesson store', async () => {
  const { Store } = await import('../lib/store.mjs');
  const root = await mkdtemp(join(tmpdir(), 'perfuzyon-test-'));
  try {
    const store = new Store(root);
    await assert.rejects(()=>store.create({title:'  ',sections:[]}));
    await assert.rejects(()=>store.get('../../etc/passwd'));
    await assert.rejects(()=>store.create({title:'Ders',sections:[{images:[{url:'javascript:alert(1)'}]}]}));
    assert.equal((await store.list()).length,0);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test('two simultaneous note updates preserve both lessons', async () => {
  const { Store } = await import('../lib/store.mjs');
  const root = await mkdtemp(join(tmpdir(), 'perfuzyon-test-'));
  try {
    const store = new Store(root);
    const a = await store.create({title:'A',sections:[],attachments:[]});
    const b = await store.create({title:'B',sections:[],attachments:[]});
    await Promise.all([store.update(a.id,{completed:true}),store.update(b.id,{personalNotes:'B notu'})]);
    assert.equal((await store.get(a.id)).completed,true);
    assert.equal((await store.get(b.id)).personalNotes,'B notu');
  } finally { await rm(root,{recursive:true,force:true}); }
});
