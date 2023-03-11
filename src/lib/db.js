import { openDB } from 'idb';

/**
 * Creates a database
 */
async function database() {
  const db = await openDB('pathplay', 1, {
    upgrade(db, oldV, newV, tx) {
      switch (oldV) {
        case 0: {
          // Characters Store
          const characters = db.createObjectStore('characters', {
            keyPath: 'id',
            autoIncrement: true,
          });
          characters.createIndex('name', 'name', { unique: false });
          characters.createIndex('level', 'level', { unique: false });
          characters.createIndex('created', 'created', { unique: false });
          characters.createIndex('updated', 'updated', { unique: false });

          // Feats
          const feats = db.createObjectStore('feats', {
            keyPath: 'id',
            autoIncrement: true,
          });
          feats.createIndex('name', 'name', { unique: true });
          feats.createIndex('level', 'level', { unique: false });

          // Spells
          const spells = db.createObjectStore('spells', {
            keyPath: 'id',
            autoIncrement: true,
          });
          spells.createIndex('name', 'name', { unique: true });
          spells.createIndex('level', 'level', { unique: false });

          // Classes
          const classes = db.createObjectStore('classes', {
            keyPath: 'id',
            autoIncrement: true,
          });
          classes.createIndex('name', 'name', { unique: true });

          // Tags
          const tags = db.createObjectStore('tags', {
            keyPath: 'id',
            autoIncrement: true,
          });
          tags.createIndex('name', 'name', { unique: true });

          // Equipment
          const equipment = db.createObjectStore('equipment', {
            keyPath: 'id',
            autoIncrement: true,
          });
          equipment.createIndex('name', 'name', { unique: true });
          equipment.createIndex('price', 'price', { unique: false });

          // Portraits
          db.createObjectStore('portraits', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      }
    },
  });

  return db;
}

export const db = await database();
