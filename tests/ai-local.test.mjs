import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function load(path, imports = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', compiled)((name) => {
    if (name in imports) return imports[name];
    throw new Error(`Unexpected import ${name}`);
  }, exports);
  return exports;
}

test('isolated browser rehearsal never calls the external AI service', async () => {
  const previousServer = process.env.LOCAL_AI_DISABLED;
  const previousClient = process.env.NEXT_PUBLIC_LOCAL_AI_DISABLED;
  const previousFetch = globalThis.fetch;
  let requests = 0;
  try {
    process.env.LOCAL_AI_DISABLED = '1';
    process.env.NEXT_PUBLIC_LOCAL_AI_DISABLED = '1';
    globalThis.fetch = async () => { requests++; throw Error('Unexpected external request'); };
    const { POST } = await load('../src/app/api/ai/route.ts', {
      '@/lib/ai/prompts/systemPrompt': { systemPrompt: 'test' },
      '@supabase/supabase-js': { createClient: () => { throw Error('Unexpected database access'); } },
    });
    const response = await POST(new Request('http://localhost:3000/api/ai', {
      method: 'POST', body: JSON.stringify({ type: 'insights', input: { childName: 'synthetic' } }),
    }));
    assert.deepEqual(await response.json(), { error: 'disabled_local' });
    const { callAI } = await load('../src/lib/ai/client.ts', {
      '@/lib/supabase/client': { supabase: { auth: { getSession: () => { throw Error('Unexpected session'); } } } },
    });
    assert.equal(await callAI('insights', { childName: 'synthetic' }), null);
    assert.equal(requests, 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousServer === undefined) delete process.env.LOCAL_AI_DISABLED;
    else process.env.LOCAL_AI_DISABLED = previousServer;
    if (previousClient === undefined) delete process.env.NEXT_PUBLIC_LOCAL_AI_DISABLED;
    else process.env.NEXT_PUBLIC_LOCAL_AI_DISABLED = previousClient;
  }
});

test('AI route rejects anonymous and removed users before contacting the provider', async () => {
  const previousServer = process.env.LOCAL_AI_DISABLED;
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousFetch = globalThis.fetch;
  let calls = 0;
  try {
    delete process.env.LOCAL_AI_DISABLED;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:55321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-key';
    globalThis.fetch = async () => { calls++; throw Error('Unexpected provider request'); };
    const db = {
      auth: { async getUser() { return { data: { user: { id: 'user-1' } }, error: null }; } },
      from(name) {
        assert.equal(name, 'household_members');
        return { select() { return this; }, eq() { return this; },
          async maybeSingle() { return { data: null, error: null }; } };
      },
    };
    const { POST } = await load('../src/app/api/ai/route.ts', {
      '@/lib/ai/prompts/systemPrompt': { systemPrompt: 'test' },
      '@supabase/supabase-js': { createClient: () => db },
    });
    const request = (token) => new Request('http://localhost:3000/api/ai', {
      method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ type: 'insights', input: { childName: 'synthetic' } }),
    });
    assert.equal((await POST(request(null))).status, 401);
    assert.equal((await POST(request('valid'))).status, 403);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousServer === undefined) delete process.env.LOCAL_AI_DISABLED;
    else process.env.LOCAL_AI_DISABLED = previousServer;
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});

test('client attaches the signed-in session to AI requests', async () => {
  const previousFlag = process.env.NEXT_PUBLIC_LOCAL_AI_DISABLED;
  const previousFetch = globalThis.fetch;
  try {
    delete process.env.NEXT_PUBLIC_LOCAL_AI_DISABLED;
    let called = false;
    globalThis.fetch = async (_url, init) => {
      called = true;
      assert.equal(init.headers.authorization, 'Bearer synthetic-token');
      return Response.json({ result: 'synthetic result' });
    };
    const { callAI } = await load('../src/lib/ai/client.ts', {
      '@/lib/supabase/client': { supabase: { auth: {
        async getSession() { return { data: { session: { access_token: 'synthetic-token' } } }; },
      } } },
    });
    assert.deepEqual(await callAI('insights', { childName: 'synthetic' }), { result: 'synthetic result' });
    assert.equal(called, true);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousFlag === undefined) delete process.env.NEXT_PUBLIC_LOCAL_AI_DISABLED;
    else process.env.NEXT_PUBLIC_LOCAL_AI_DISABLED = previousFlag;
  }
});

test('active household member can request a bounded AI response', async () => {
  const previous = Object.fromEntries(['LOCAL_AI_DISABLED', 'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY'].map(k => [k, process.env[k]]));
  const previousFetch = globalThis.fetch;
  try {
    delete process.env.LOCAL_AI_DISABLED;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:55321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-service';
    process.env.ANTHROPIC_API_KEY = 'synthetic-provider';
    let providerCalls = 0;
    globalThis.fetch = async (_url, init) => {
      providerCalls++;
      assert.equal(init.headers['x-api-key'], 'synthetic-provider');
      return Response.json({ content: [{ text: 'synthetic response' }] });
    };
    const db = {
      auth: { async getUser(token) {
        assert.equal(token, 'valid');
        return { data: { user: { id: 'user-1' } }, error: null };
      } },
      from(table) {
        assert.equal(table, 'household_members');
        const filters = [];
        return { select() { return this; }, eq(k, v) { filters.push([k, v]); return this; },
          async maybeSingle() {
            assert.deepEqual(filters, [['user_id', 'user-1'], ['status', 'active']]);
            return { data: { household_id: 'household-1' }, error: null };
          } };
      },
    };
    const { POST } = await load('../src/app/api/ai/route.ts', {
      '@/lib/ai/prompts/systemPrompt': { systemPrompt: 'test' },
      '@/lib/ai/prompts/insights': { insightsPrompt: () => 'synthetic prompt' },
      '@supabase/supabase-js': { createClient: () => db },
    });
    const request = new Request('http://localhost:3000/api/ai', {
      method: 'POST', headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ type: 'insights', input: { childName: 'synthetic' } }),
    });
    const response = await POST(request);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { result: 'synthetic response' });
    assert.equal(providerCalls, 1);
  } finally {
    globalThis.fetch = previousFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
