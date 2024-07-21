module.exports = {
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    es6: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  rules: {
    'no-console': 'off'
  }
};
