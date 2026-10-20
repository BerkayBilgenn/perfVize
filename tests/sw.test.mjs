import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

async function runFetch(response, {quota=false, cached}={}) {
 const handlers={},cache={match:async()=>cached,put:async()=>{if(quota||response.status===206)throw new Error('Cannot cache');}};
 const context={self:{location:{origin:'https://study.example'},addEventListener:(name,fn)=>handlers[name]=fn},URL,Response,Headers,
  caches:{open:async()=>cache},fetch:async()=>response,indexedDB:{open(){const r={};queueMicrotask(()=>r.onerror());return r;}}};
 vm.runInNewContext(await readFile(new URL('../public/sw.js',import.meta.url),'utf8'),context);
 let result;handlers.fetch({request:{url:'https://study.example/assets/book.pdf',method:'GET'},respondWith:r=>result=r});
 return result;
}
test('a PDF range response remains usable when it cannot be cached',async()=>{
 const r=await runFetch(new Response('PDF bytes',{status:206}));assert.equal(r.status,206);assert.equal(await r.text(),'PDF bytes');
});
test('a full cache does not turn a successful file download into a failure',async()=>{
 const r=await runFetch(new Response('PDF bytes'),{quota:true});assert.equal(r.status,200);assert.equal(await r.text(),'PDF bytes');
});
