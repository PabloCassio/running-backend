// ESLint configuration  
module.exports = {  
  parser: '@typescript-eslint/parser',  
  parserOptions: {  
    ecmaVersion: 2020,  
    sourceType: 'module',  
  },  
  extends: [  
    'eslint:recommended',  
    'plugin:@typescript-eslint/recommended',  
  ],  
  plugins: ['@typescript-eslint'],  
  env: {  
    node: true,  
    es6: true,  
    jest: true,  
  },  
  rules: {  
    '@typescript-eslint/explicit-function-return-type': 'off',  
    '@typescript-eslint/no-explicit-any': 'warn',  
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '_' }],  
    'no-console': 'warn',  
    'eqeqeq': ['error', 'always'],  
    'curly': ['error', 'all'],  
    'quotes': ['error', 'single', { avoidEscape: true }],  
    'semi': ['error', 'always'],  
    'comma-dangle': ['error', 'always-multiline'],  
    'arrow-parens': ['error', 'always'],  
    'no-trailing-spaces': 'error',  
    'indent': ['error', 2, { SwitchCase: 1 }],  
  },  
  ignorePatterns: ['node_modules', 'dist', 'coverage'],  
}; 
