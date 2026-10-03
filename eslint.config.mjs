export default [
  {
    files: ['assets/js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script' },
    rules: {
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-dupe-args': 'error',
      'no-func-assign': 'error',
    },
  },
];
