export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value'],
  ignoreFiles: ['dist/**/*.css'],
  overrides: [
    {
      files: ['src/newtab/styles/fonts.css'],
      rules: {
        'font-family-name-quotes': null,
        'scale-unlimited/declaration-strict-value': null,
      },
    },
  ],
  rules: {
    'at-rule-no-unknown': [true, {
      ignoreAtRules: [
        'theme',
        'variant',
        'tailwind',
        'apply',
        'layer',
        'config',
        'plugin',
        'utility',
        'custom-variant',
      ],
    }],
    'alpha-value-notation': null,
    'color-function-alias-notation': null,
    'color-function-notation': null,
    'color-hex-length': null,
    'custom-property-pattern': '^(color|font-family|radius|shadow)-[a-z0-9-]+$',
    'import-notation': null,
    'keyframes-name-pattern': null,
    'media-feature-range-notation': null,
    'rule-empty-line-before': null,
    'scale-unlimited/declaration-strict-value': [[
      '/color$/',
      'fill',
      'stroke',
      'font-family',
    ], {
      ignoreVariables: true,
      ignoreValues: {
        '/color$/': ['inherit', 'transparent', 'currentColor'],
        'font-family': ['inherit', 'system-ui', 'sans-serif', 'serif', 'monospace'],
      },
    }],
  },
};
