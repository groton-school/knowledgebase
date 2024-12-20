import config from '@battis/eslint-config';

export default [
  ...config,
  {
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  }
];
