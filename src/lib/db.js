import { wrap } from 'comlink';

export const database = wrap(
  new Worker(new URL('$lib/workers/db.js?url', import.meta.url), {
    type: 'module',
  }),
);

export const db = database.db;

export const fetchAndUpdateData = database.fetchAndUpdateData;

export const filterCollection = database.filterCollection;
