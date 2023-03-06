import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

import * as path from 'path';
import * as url from 'url';

import tsconfig from './tsconfig.json';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// Get the aliases from tsconfig
const aliases = Object.entries(tsconfig.compilerOptions.paths).map(
  ([key, value]) => ({
    find: key.replace(/\/\*$/, ''),
    replacement: path.join(__dirname, value[0]).replace(/\/\*$/, ''),
  }),
);

// Add custom aliases
aliases.push({
  find: '$toolkit',
  replacement: path.join(
    __dirname,
    './node_modules/sass-toolkit/stylesheets/toolkit',
  ),
});

aliases.push({
  find: '$breakpoint',
  replacement: path.join(
    __dirname,
    './node_modules/breakpoint-sass/stylesheets/breakpoint',
  ),
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: aliases,
  },
})
