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

/**
 *
 * @param {string} collection
 * @param {Object[]} queries
 * @return {db}
 */
function filterCollection(collection, queries) {
  return db[collection]
    .filter((i) => {
      let include = false;
      for (const v of queries) {
        const { key, value, operator } = v;
        if (operator === 'eq' || operator === undefined) {
          if (i[key] === value) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'gt') {
          if (i[key] > value) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'lt') {
          if (i[key] < value) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'gte') {
          if (i[key] >= value) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'lte') {
          if (i[key] <= value) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'ne' || operator === 'not') {
          if (i[key] !== value) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'in') {
          if (value.includes(i[key])) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'nin') {
          if (!value.includes(i[key])) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'exists') {
          if (i[key] !== undefined) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'regex') {
          const regex = new RegExp(value);
          if (regex.test(i[key])) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'iregex') {
          const regex = new RegExp(value, 'i');
          if (regex.test(i[key])) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'all') {
          if (value.every((v) => i[key].includes(v))) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'any') {
          if (value.some((v) => i[key].includes(v))) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'none') {
          if (!value.some((v) => i[key].includes(v))) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'size') {
          if (i[key].length === value) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'mod') {
          if (i[key] % value[0] === value[1]) {
            include = true;
          } else {
            include = false;
          }
        } else if (operator === 'elemMatch') {
          if (i[key].some((v) => v === value)) {
            include = true;
          } else {
            include = false;
          }
        }
      }
      return include;
    })
    .toArray();
}

// /**
//  *
//  * @param {string} collection
//  * @param {function} cb
//  * @return {Promise}
//  */
// async function advancedFilter(collection, cb) {
//   const items = await db[collection].toArray();
//   const mapped = await Promise.all(
//     items.map(async (i) => ({
//       item: i,
//       include: await cb(i),
//     })),
//   );

//   // const items = await Promise.all(await db[collection].toArray()).map(
//   //   async (i) => ({
//   //     item: i,
//   //     include: await cb(i),
//   //   }),
//   // );
//   // const items = await Promise.all(
//   //   db[collection].toArray().map(async (i) => ({
//   //     item: i,
//   //     include: await cb(i),
//   //   })),
//   // );

//   console.log(mapped);

//   return mapped;

//   // return db[collection].filter(async (i) => await cb(i)).toArray();
// }

expose({
  db,
  fetchAndUpdateData,
  filterCollection,
  // advancedFilter,
});
