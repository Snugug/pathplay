import { expose } from 'comlink';
import Dexie from 'dexie';

const db = new Dexie('pathplay');

db.version(1).stores({
  data: 'url, name, slug, type, id',
  meta: 'type',
  characters: '++id, name, ancestry, heritage, background, class, level',
  // Add characters
});

/**
 *
 * @param {Object[]} data
 */
async function fetchAndUpdateData(data) {
  const files = (
    await Promise.all(
      data.map((d) => fetch(`/${d.path}`).then((res) => res.json())),
    )
  ).flat();

  await db.data.bulkPut(files);
  await db.meta.bulkPut(data);
}

expose({
  db,
  fetchAndUpdateData,
});
