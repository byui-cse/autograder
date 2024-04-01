export default {
    env: {
        browser: true
    },
    parserOptions: {
        ecmaVersion: 'latest'
    },
    rules: {
        'comma-dangle': ['error', 'never'],
        eqeqeq: 'error',
        'import/no-commonjs': 'off',
        'import/no-unresolved': 'off',
        indent: ['error', 4, { SwitchCase: 1 }],
        'max-len': ['warn', { code: 180 }],
        'no-console': 'warn',
        'no-const-assign': 'error',
        'no-template-curly-in-string': 'error',
        'no-unused-vars': 'error'
    }
};
