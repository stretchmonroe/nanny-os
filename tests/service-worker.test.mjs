import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const script = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');

async function clickNotification(value, openClients = []) {
  const actions = [];
  let click;
  runInNewContext(script, {
    URL,
    self: {
      location: { origin: 'https://ankur.example' },
      addEventListener(type, listener) { if (type === 'notificationclick') click = listener; },
    },
    clients: {
      async matchAll() { return openClients; },
      async openWindow(url) { actions.push(['open', url]); },
    },
  });
  let pending;
  click({
    notification: { data: { url: value }, close() {} },
    waitUntil(promise) { pending = promise; },
  });
  await pending;
  return actions;
}

test('notification clicks never navigate to an external or ambiguous URL', async () => {
  for (const value of ['//evil.example', '/\\evil.example', 'https://evil.example',
    '/memory\nnext', null]) {
    assert.deepEqual(await clickNotification(value), [['open', 'https://ankur.example/']]);
  }
  assert.deepEqual(await clickNotification('/memory?view=day'),
    [['open', 'https://ankur.example/memory?view=day']]);
});

test('notification clicks focus only a window with the exact app origin', async () => {
  const actions = [];
  const clients = [
    { url: 'https://ankur.example.evil.test/',
      navigate(url) { actions.push(['evil', url]); }, focus() { actions.push(['evil-focus']); } },
    { url: 'https://ankur.example/home',
      navigate(url) { actions.push(['navigate', url]); },
      focus() { actions.push(['focus']); } },
  ];
  await clickNotification('/memory', clients);
  assert.deepEqual(actions, [['navigate', 'https://ankur.example/memory'], ['focus']]);
});
