const commonParserOptions = {
  ecmaVersion: 2020,
  sourceType: 'module',
}

const commonExtends = [
  'eslint:recommended',
  'plugin:@typescript-eslint/eslint-recommended',
  'plugin:@typescript-eslint/recommended',
  'plugin:jest/recommended',
  'plugin:jest-formatting/recommended',
  'prettier',
]

const commonRules = {
  '@typescript-eslint/consistent-type-assertions': [
    'error',
    { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
  ],
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/interface-name-prefix': 'off',
  '@typescript-eslint/member-delimiter-style': 'off',
  '@typescript-eslint/no-empty-function': 'off',
  '@typescript-eslint/no-unnecessary-type-assertion': ['error'],
  '@typescript-eslint/no-unused-expressions': [
    'error',
    {
      allowShortCircuit: true,
      allowTernary: true,
      allowTaggedTemplates: true,
    },
  ],
  '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
  '@typescript-eslint/no-use-before-define': 'off',
  '@typescript-eslint/no-var-requires': 'off',
  'jest/expect-expect': 'off',
  'jest/no-conditional-expect': 'off',
  'jest/no-identical-title': 'off',
  'jest/no-standalone-expect': 'off',
  'jest/no-try-expect': 'off',
}

const reactRules = {
  'react/display-name': 'off',
  'react/prop-types': 'off',
  'react/react-in-jsx-scope': 'off',
}

const generateNodeOverride = (path) => ({
  extends: commonExtends,
  files: [`${path}/**/**.{js,ts}`],
  parserOptions: {
    ...commonParserOptions,
    project: `${path}/tsconfig.json`,
  },
  rules: commonRules,
})

module.exports = {
  env: {
    browser: true,
    es2021: true,
    es6: true,
    jest: true,
    node: true,
  },
  overrides: [
    //frontend
    {
      extends: [...commonExtends, 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
      files: ['frontend/**/**.{js,jsx,ts,tsx}'],
      parserOptions: {
        ...commonParserOptions,
        ecmaFeatures: {
          jsx: true,
        },
        project: 'frontend/tsconfig.json',
      },
      rules: {
        ...commonRules,
        ...reactRules,
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
    generateNodeOverride('infrastructure'),
    generateNodeOverride('integration'),
    generateNodeOverride('scripts'),
  ],
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['**/commonServices/**/*.js', '**/jest.config.ts'], //ignore compiled JS in layers
  parserOptions: commonParserOptions,
  plugins: ['@typescript-eslint', 'prettier', 'jest-formatting'],
  rules: {},
}
