import js from '@eslint/js'
import globals from 'globals'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tailwindcss from 'eslint-plugin-tailwindcss'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'extension', 'coverage', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // ── Chrome Extension: no console in production ────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // ── Immutability: prefer const for non-reassigned bindings ────
      'prefer-const': ['error', { destructuring: 'all' }],

      // ── TypeScript: no unused vars (allow _prefixed) ──────────────
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // ── React Refresh: downgrade to warn, allow utility exports ───
      'react-refresh/only-export-components': ['warn', {
        allowConstantExport: true,
      }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    ...jsxA11y.flatConfigs.strict,
    languageOptions: {
      ...jsxA11y.flatConfigs.strict.languageOptions,
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      'jsx-a11y/no-autofocus': 'off',
    },
  },
  ...tailwindcss.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
    settings: {
      ...(config.settings ?? {}),
      tailwindcss: {
        ...(config.settings?.tailwindcss ?? {}),
        callees: ['clsx', 'cn'],
        config: {},
      },
    },
    rules: {
      ...(config.rules ?? {}),
      'tailwindcss/classnames-order': 'off',
      'tailwindcss/enforces-negative-arbitrary-values': 'error',
      'tailwindcss/enforces-shorthand': 'error',
      'tailwindcss/no-contradicting-classname': 'error',
      'tailwindcss/no-unnecessary-arbitrary-value': 'error',
      'tailwindcss/no-custom-classname': 'off',
      'tailwindcss/no-arbitrary-value': 'off',
      'tailwindcss/migration-from-tailwind-2': 'off',

      // Rule 9: No hardcoded button sizes — use CSS design tokens
      // Tokens: --spacing-button-height (44px), --spacing-button-height-sm (32px),
      //         --spacing-button-icon (44px), --spacing-button-icon-sm (32px)
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='className'] JSXExpressionContainer > Literal[value=/\\bmin-h-(8|9|11)\\b/]",
          message: 'Use min-h-[--spacing-button-icon] or min-h-[--spacing-button-height-sm] instead of hardcoded min-h-8/9/11. See global.css button size tokens.',
        },
        {
          selector: "JSXAttribute[name.name='className'] JSXExpressionContainer > Literal[value=/\\bh-(8|9|11)(?!-)/]",
          message: 'Use h-[--spacing-button-height] or h-[--spacing-button-height-sm] instead of hardcoded h-8/9/11. See global.css button size tokens.',
        },
      ],
    },
  })),

  // ── Architecture Guardrails ──────────────────────────────────────
  //
  // These rules enforce the layer boundaries defined in the architecture
  // spec. Each rule has explicit file matchers and allowlists — no rule
  // depends on unwritten convention.
  //
  // See: docs/architecture.md for the full layer model.

  // Rule 1: No direct chrome.storage.local access outside storage adapter
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/utils/storage.ts', 'src/__tests__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.object.name='chrome'][object.property.name='storage'][property.name='local']",
          message: 'Direct chrome.storage.local access is restricted to src/utils/storage.ts. Use domain readers/writers instead.',
        },
      ],
    },
  },

  // Rule 2: writeStorage import restricted to storage adapter + tests
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/utils/storage.ts', 'src/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/utils/storage'],
              importNames: ['writeStorage'],
              message: 'writeStorage is reserved for migration/import/restore only. Use domain writers (writeSettings, writeGroupOrder, writeWorkspaces) instead.',
            },
          ],
        },
      ],
    },
  },

  // Rule 3: readStorage/updateStorage restricted — stores should use domain adapters
  {
    files: ['src/stores/**/*.ts'],
    ignores: ['src/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/utils/storage'],
              importNames: ['readStorage', 'updateStorage'],
              message: 'Stores must use domain readers/writers (readSettings, readGroupOrder, readWorkspaces, writeWorkspaces, etc.) instead of readStorage/updateStorage.',
            },
          ],
        },
      ],
    },
  },

  // Rule 4: playCloseSound/shootConfetti restricted to close-effects.ts
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/lib/close-effects.ts', 'src/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/lib/sound', '**/lib/confetti'],
              importNames: ['playCloseSound', 'shootConfetti'],
              message: 'Raw effect primitives (playCloseSound, shootConfetti) must be routed through src/lib/close-effects.ts. UI code should call playCloseEffects() instead.',
            },
          ],
        },
      ],
    },
  },

  // Rule 5: Components must not import stores directly
  {
    files: ['src/newtab/components/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/stores/*'],
              message: 'Components must not import stores directly. Pass data and handlers via props from the page orchestrator (App.tsx).',
            },
          ],
        },
      ],
    },
  },

  // Rule 6: Components must not import storage utilities
  {
    files: ['src/newtab/components/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/utils/storage'],
              message: 'Components must not import storage utilities. Data flows through stores and props, not direct storage access.',
            },
          ],
        },
      ],
    },
  },

  // Rule 7: avoid fake buttons on static elements
  {
    files: ['src/newtab/components/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name='div'] JSXAttribute[name.name='role'][value.value='button']",
          message: 'Use a native <button> for primary click targets instead of div[role=\"button\"].',
        },
      ],
    },
  },

  // Rule 8: UI Design Guardrails
  {
    files: ['src/newtab/components/**/*.tsx', 'src/newtab/App.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement JSXAttribute[name.name='className'] Literal[value=/\\bborder(?:-[btlr])?-2\\b/]",
          message: 'Thick borders (e.g. "border-2", "border-b-2", "border-t-2") are restricted workspace-wide. Use standard 1px border ("border", "border-b", "border-t") to maintain the understated Notion warm-paper aesthetic.',
        },
        {
          selector: "JSXOpeningElement[name.name='button'] JSXAttribute[name.name='className'] Literal[value=/\\buppercase\\b/]",
          message: 'Uppercase text is restricted on buttons. Use standard sentence/title casing to keep the design understated.',
        },
        {
          selector: "JSXOpeningElement[name.name='button'] JSXAttribute[name.name='className'] Literal[value=/\\bfont-bold\\b/]",
          message: 'Font weight is capped at font-semibold (600) for buttons. Avoid "font-bold" or "font-extrabold".',
        },
        {
          selector: "JSXOpeningElement[name.name='button'] JSXAttribute[name.name='className'] Literal[value=/\\brounded-(?!chip|sm|none|full)\\w+/]",
          message: 'Custom large border-radius is restricted on buttons. Use "rounded-chip" (4px) as specified in frontend-design.md.',
        },
      ],
    },
  },
])
