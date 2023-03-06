module.exports = {
  singleQuote: true,
  trailingComma: 'all',
  plugins: [require.resolve('prettier-plugin-svelte')],
  overrides: [
    {
      files: '*.svelte',
      options: {
        parser: 'svelte',
      },
    },
  ],
};
