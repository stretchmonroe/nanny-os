import { test } from 'node:test';
import assert from 'node:assert/strict';
import { photoPath } from '../src/lib/supabase/photo-path.ts';
const origin = 'https://example.supabase.co';
test('new paths and matching legacy public URLs resolve to the same object', () => {
  assert.equal(photoPath('child-1/photo.jpg',origin),'child-1/photo.jpg');
  assert.equal(photoPath(origin+'/storage/v1/object/public/photos/child-1/photo.jpg',origin),'child-1/photo.jpg');
});
for (const source of [
  'https://attacker.test/storage/v1/object/public/photos/child-1/photo.jpg',
  origin+'/storage/v1/object/public/photos/child-1/photo.jpg?token=abc',
  'shared/photo.jpg','default/photo.jpg','../photo.jpg','child/photo.svg',
  'child/a/b.jpg','child/%2e%2e.jpg','data:image/png;base64,abc',
  '//example.supabase.co/photo.jpg','child/photo.jpg#extra',
]) test('reject unsafe source '+source, () => assert.equal(photoPath(source,origin),null));
