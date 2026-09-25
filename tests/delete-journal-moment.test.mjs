import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deleteJournalMoment } from '../src/lib/supabase/delete-journal-moment.ts';

function database(actions, storageError = null, rowError = null) {
  return {
    storage: { from(bucket) {
      assert.equal(bucket, 'photos');
      return { async remove(paths) { actions.push(['remove', paths]); return { error: storageError }; } };
    } },
    from(table) {
      assert.equal(table, 'memory_events');
      return {
        delete() { actions.push(['delete']); return this; },
        eq(column, value) { actions.push(['eq', column, value]); return this; },
        async select(column) {
          assert.equal(column, 'id');
          return { data: rowError ? null : [{ id: 'moment-1' }], error: rowError };
        },
      };
    },
  };
}

test('deleting a photo removes the private file before removing its journal row', async () => {
  const actions = [];
  await deleteJournalMoment(database(actions), 'moment-1', 'child-1/image.jpg');
  assert.deepEqual(actions, [
    ['remove', ['child-1/image.jpg']], ['delete'], ['eq', 'id', 'moment-1'],
  ]);
});

test('a denied Storage deletion keeps the journal row for a later retry', async () => {
  const actions = [];
  await assert.rejects(deleteJournalMoment(database(actions, { message: 'denied' }),
    'moment-1', 'child-1/image.jpg'), /Could not delete photo/);
  assert.deepEqual(actions, [['remove', ['child-1/image.jpg']]]);
});

test('a failed row deletion reports failure and non-photo moments never touch Storage', async () => {
  const actions = [];
  await assert.rejects(deleteJournalMoment(database(actions, null, { message: 'denied' }),
    'moment-1'), /Could not delete moment/);
  assert.deepEqual(actions, [['delete'], ['eq', 'id', 'moment-1']]);
});
