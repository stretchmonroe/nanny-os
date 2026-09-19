import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Execute the actual handler with an isolated database double: no live requests.
async function handler(path, db) {
  const source = await readFile(new URL('../src/app/api/'+path+'/route.ts', import.meta.url),'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const exports = {};
  const require = (name) => {
    if (name === '@supabase/supabase-js') return { createClient: () => db };
    if (name === 'next/server') return { NextResponse: { json: (body,init) => Response.json(body,init) } };
    throw new Error('Unexpected import '+name);
  };
  new Function('require','exports',compiled)(require,exports);
  return exports;
}
const request = (body, token='valid') => new Request('https://example.test/api/invite/claim',{
  method:'POST', headers:token ? {authorization:'Bearer '+token,'content-type':'application/json'} : {},
  body:JSON.stringify(body)
});
test('claim route rejects missing authentication without database access',async()=>{
  const {POST}=await handler('invite/claim',{});
  assert.equal((await POST(request({code:'ABCDEF12'},null))).status,401);
});
test('claim uses authenticated identity, never the supplied user ID',async()=>{
  let args;
  const chain={select(){return this;},eq(){return this;},async limit(){return {data:[{id:'child-1'}]};}};
  const db={
    auth:{async getUser(){return {data:{user:{id:'verified-user',email_confirmed_at:'2026-09-18'}}};}},
    async rpc(name,params){assert.equal(name,'claim_household_invitation');args=params;return {data:'home-1'};},
    from(){return chain;}
  };
  const {POST}=await handler('invite/claim',db);
  assert.equal((await POST(request({code:'abcd-ef12',user_id:'victim'}))).status,200);
  assert.deepEqual(args,{p_user_id:'verified-user',p_code:'ABCDEF12'});
});
test('claim rejects unverified email and malformed input before RPC',async()=>{
  const db={auth:{async getUser(){return {data:{user:{id:'u'}}};}},rpc(){throw new Error('Must not call');}};
  const {POST}=await handler('invite/claim',db);
  assert.equal((await POST(request({code:'ABCDEF12'}))).status,403);
  assert.equal((await POST(request({code:42}))).status,400);
});
test('me excludes removed membership before reading children',async()=>{
  let queriedChildren=false;
  const db={
    auth:{async getUser(){return {data:{user:{id:'u'}}};}},
    from(table){
      if(table==='children') queriedChildren=true;
      const filters=[];
      return {
        select(){return this;},eq(k,v){filters.push([k,v]);return this;},
        async single(){return {data:{id:'u'}};},
        async maybeSingle(){
          assert.ok(filters.some(([k,v])=>k==='status'&&v==='active'));
          return {data:null};
        }
      };
    }
  };
  const {GET}=await handler('me',db);
  const res=await GET(new Request('https://example.test/api/me',{headers:{authorization:'Bearer valid'}}));
  assert.equal(res.status,200);
  assert.deepEqual((await res.json()).children,[]);
  assert.equal(queriedChildren,false);
});
