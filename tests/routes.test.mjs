import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Execute the actual handler with an isolated database double: no live requests.
async function handler(path, db, modules = {}) {
  const source = await readFile(new URL('../src/app/api/'+path+'/route.ts', import.meta.url),'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const exports = {};
  const require = (name) => {
    if (name in modules) return modules[name];
    if (name === '@supabase/supabase-js') return { createClient: () => db };
    if (name === 'crypto') return { randomUUID: () => 'child-uuid' };
    if (name === 'next/server') return { NextResponse: { json: (body,init) => Response.json(body,init) } };
    throw new Error('Unexpected import '+name);
  };
  new Function('require','exports',compiled)(require,exports);
  return exports;
}
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://localhost:55321';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'local-test-key';
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
test('both setup paths reject removed members before reading or creating children',async()=>{
  let childAccess = false;
  const db={
    auth:{async getUser(){return {data:{user:{id:'removed-user'}}};}},
    from(table){
      if (table==='children') childAccess = true;
      assert.equal(table,'household_members');
      return {select(){return this},eq(){return this},async maybeSingle(){
        return {data:{household_id:'home-1',role:'parent',status:'removed'}};
      }};
    },
  };
  const {POST: createHome}=await handler('create-home',db);
  const setup=await handler('setup',db,{'../create-home/route':{POST:createHome}});
  assert.equal((await createHome(request({childName:'Test',role:'parent'}))).status,403);
  assert.equal((await setup.POST(request({child_name:'Test',birth_date:'2025-04-01'}))).status,403);
  assert.equal(childAccess,false);
});
test('caregivers cannot create a home and active parents may retry safely',async()=>{
  let member={household_id:'home-1',role:'nanny',status:'active'};
  const db={
    auth:{async getUser(){return {data:{user:{id:'user-1'}}};}},
    from(table){
      if(table==='profiles')return {async upsert(){return {error:null}}};
      if(table==='household_members')return {select(){return this},eq(){return this},async maybeSingle(){return {data:member}}};
      assert.equal(table,'children');
      return {select(){return this},eq(){return this},async limit(){return {data:[{id:'child-1',name:'Existing',birth_date:null}]}}};
    },
  };
  const {POST}=await handler('create-home',db);
  assert.equal((await POST(request({childName:'Test',role:'nanny'}))).status,400);
  assert.equal((await POST(request({childName:'Test',role:'parent'}))).status,403);
  member={...member,role:'parent'};
  const result=await POST(request({childName:'Test',role:'parent'}));
  assert.equal(result.status,200);
  assert.equal((await result.json()).child.id,'child-1');
});
test('setup preserves the card birth date and blocks invalid dates',async()=>{
  let birthDate;
  const db={
    auth:{async getUser(){return {data:{user:{id:'new-parent'}}};}},
    from(table){
      if(table==='profiles')return {async upsert(){return {error:null}}};
      if(table==='household_members')return {
        select(){return this},eq(){return this},async maybeSingle(){return {data:null}},
        insert(row){assert.equal(row.role,'parent');return Promise.resolve({error:null})},
      };
      if(table==='households')return {
        insert(){return this},select(){return this},async single(){return {data:{id:'home-1'},error:null}},
      };
      if(table==='children')return {
        insert(row){birthDate=row.birth_date;return this},select(){return this},
        async single(){return {data:{id:'child-1',name:'Test',birth_date:birthDate},error:null}},
      };
      throw Error('Unexpected table '+table);
    },
  };
  const {POST: createHome}=await handler('create-home',db);
  const {POST: setup}=await handler('setup',db,{'../create-home/route':{POST:createHome}});
  assert.equal((await setup(request({child_name:'Test',birth_date:'2025-02-31'}))).status,400);
  const result=await setup(request({child_name:'Test',birth_date:'2025-04-17'}));
  assert.equal(result.status,200);
  assert.equal((await result.json()).child.birth_date,'2025-04-17');
});
const validSubscription = {
  endpoint:'https://fcm.googleapis.com/fcm/send/synthetic',
  keys:{p256dh:'A'.repeat(87),auth:'A'.repeat(22)},
};
test('push registration rejects malformed endpoints before database access',async()=>{
  const {POST}=await handler('push/subscribe',{auth:{getUser(){throw Error('Should not authenticate')}}});
  for (const subscription of [null,{...validSubscription,endpoint:'http://127.0.0.1/push'},
    {...validSubscription,keys:{auth:'short',p256dh:'A'.repeat(87)}}]) {
    assert.equal((await POST(request({subscription}))).status,400);
  }
});
test('push registration rejects removed members before writing subscriptions',async()=>{
  const db={
    auth:{async getUser(){return {data:{user:{id:'removed-user'}}};}},
    from(table){assert.equal(table,'household_members');return {
      select(){return this},eq(){return this},async maybeSingle(){return {data:null,error:null}},
    }},
  };
  const {POST}=await handler('push/subscribe',db);
  assert.equal((await POST(request({subscription:validSubscription}))).status,403);
});
test('push registration preserves an old subscription when a replacement insert fails',async()=>{
  let deleted=false;
  const db={
    auth:{async getUser(){return {data:{user:{id:'parent-user'}}};}},
    from(table){
      if(table==='household_members')return {
        select(){return this},eq(){return this},async maybeSingle(){return {data:{household_id:'home-1',role:'parent'},error:null}},
      };
      assert.equal(table,'push_subscriptions');return {
        insert(row){assert.equal(row.user_id,'parent-user');assert.equal(row.household_id,'home-1');return this},
        select(){return this},async single(){return {data:null,error:{message:'write failed'}}},
        delete(){deleted=true;throw Error('Must not delete old subscription')},
      };
    },
  };
  const {POST}=await handler('push/subscribe',db);
  assert.equal((await POST(request({subscription:validSubscription}))).status,503);
  assert.equal(deleted,false);
});
test('push registration replaces the old row only after a successful insert',async()=>{
  const actions=[];
  const db={
    auth:{async getUser(){return {data:{user:{id:'parent-user'}}};}},
    from(table){
      if(table==='household_members')return {
        select(){return this},eq(k,v){actions.push([k,v]);return this},
        async maybeSingle(){return {data:{household_id:'home-1',role:'parent'},error:null}},
      };
      assert.equal(table,'push_subscriptions');return {
        insert(row){actions.push(['insert',row.role]);return this},
        select(){return this},async single(){return {data:{id:'new-id'},error:null}},
        delete(){actions.push(['delete']);return this},
        eq(k,v){actions.push([k,v]);return this},
        async neq(k,v){actions.push([k,v]);return {error:null}},
      };
    },
  };
  const {POST}=await handler('push/subscribe',db);
  assert.equal((await POST(request({subscription:validSubscription}))).status,200);
  assert.ok(actions.some(([k,v])=>k==='status'&&v==='active'));
  assert.ok(actions.findIndex(([k])=>k==='insert')<actions.findIndex(([k])=>k==='delete'));
  assert.ok(actions.some(([k,v])=>k==='id'&&v==='new-id'));
});
