const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expo,
  { ignores: ['mobile/**', 'backend/**', 'dist/**'] },
  { rules: { curly: ['error', 'all'] } },
]);
