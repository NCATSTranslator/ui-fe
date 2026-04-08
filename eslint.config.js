import storybook from "eslint-plugin-storybook";
import js from '@eslint/js';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import tanstackQuery from '@tanstack/eslint-plugin-query';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
        cy: 'readonly'
      },
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
      'no-extra-boolean-cast': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Code quality
      'no-fallthrough': 'error',
      'eqeqeq': ['warn', 'always'],
      'no-param-reassign': ['warn', { props: false }],
      'no-throw-literal': 'warn',
      'no-self-assign': 'error',
      'no-unreachable': 'error',
      'no-unused-expressions': 'warn',

      // Architecture boundaries
      'no-restricted-imports': ['warn', {
        paths: [
          {
            name: 'lodash',
            message: 'Import specific lodash functions: import debounce from "lodash/debounce"',
          },
        ],
      }],

      // Code pattern bans
      'no-restricted-syntax': ['warn',
        {
          selector: 'JSXAttribute[name.name="style"] ObjectExpression',
          message: 'Use CSS modules instead of inline styles.',
        },
        {
          selector: 'TSNonNullExpression',
          message: 'Avoid non-null assertions (!) — handle the null case explicitly.',
        },
      ],

      // Complexity guardrails
      'complexity': ['warn', 15],
      'max-depth': ['warn', 4],
      // max lines per function for non-TSX files
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
      'max-params': ['warn', 5],
      'max-statements': ['warn', 20],
    }
  },
  {
    // max lines per function for TSX files
    files: ['**/*.tsx'],
    rules: {
      'max-lines-per-function': ['warn', { max: 180, skipBlankLines: true, skipComments: true }],
    }
  },
  ...tanstackQuery.configs['flat/recommended'],
  ...storybook.configs["flat/recommended"]
];