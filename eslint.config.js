import js from '@eslint/js'
import globals from 'globals'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tailwindcss from 'eslint-plugin-tailwindcss'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const forbiddenButtonSizePattern = /\b(?:h|min-h|size|w|min-w)-(?:8|9|10|11)\b|\b(?:h|min-h|size|w|min-w)-\[(?:32|36|40|44)px\]/

function staticClassText(value) {
  if (!value) return ''
  if (value.type === 'Literal') return typeof value.value === 'string' ? value.value : ''
  if (value.type !== 'JSXExpressionContainer') return ''

  const expression = value.expression
  if (expression.type === 'Literal') return typeof expression.value === 'string' ? expression.value : ''
  if (expression.type === 'TemplateLiteral') {
    return expression.quasis.map((quasi) => quasi.value.raw).join(' ')
  }
  return ''
}

const localRules = {
  'button-size-tokens': {
    meta: {
      type: 'problem',
      messages: {
        hardcodedSize: 'Use token utilities such as min-h-[var(--spacing-button-height)] or size-[var(--spacing-button-icon)] instead of hardcoded button dimensions.',
      },
    },
    create(context) {
      return {
        JSXAttribute(node) {
          if (node.name?.name !== 'className') return
          const openingElement = node.parent
          if (openingElement?.name?.name !== 'button') return

          if (forbiddenButtonSizePattern.test(staticClassText(node.value))) {
            context.report({ node, messageId: 'hardcodedSize' })
          }
        },
      }
    },
  },
}

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
    plugins: {
      local: {
        rules: localRules,
      },
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

      'local/button-size-tokens': 'error',

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

  // Rule 3: readStorage restricted — stores should use domain adapters
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
              importNames: ['readStorage'],
              message: 'Stores must use domain readers/writers (readSettings, readGroupOrder, readWorkspaces, writeWorkspaces, etc.) instead of readStorage.',
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

  // Rule 5: Components must not import stores, controllers, storage, or access chrome APIs
  {
    files: ['src/newtab/components/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/stores/*'],
              message: 'Components must not import stores. Pass data and callbacks from controllers/App.',
            },
            {
              group: ['**/newtab/controllers/*', '**/controllers/*'],
              message: 'Components must not import controllers. Controllers compose components, never the reverse.',
            },
            {
              group: ['**/utils/storage'],
              message: 'Components must not import storage utilities. Use props and controller actions.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='chrome']",
          message: 'Components must not access chrome.* APIs. Route Chrome interactions through controllers or stores.',
        },
        {
          selector: "MemberExpression[object.object.name='chrome']",
          message: 'Components must not access chrome.* APIs. Route Chrome interactions through controllers or stores.',
        },
      ],
    },
  },

  // Rule 6: Pure newtab hooks must not import stores, storage, or access chrome APIs
  {
    files: ['src/newtab/hooks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/stores/*'],
              message: 'Pure newtab hooks must not import stores. Move orchestration to src/newtab/controllers.',
            },
            {
              group: ['**/utils/storage'],
              message: 'Pure newtab hooks must not import storage utilities. Move persistence orchestration to controllers or stores.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='chrome']",
          message: 'Pure newtab hooks must not access chrome.* APIs. Move runtime coordination to controllers.',
        },
        {
          selector: "MemberExpression[object.object.name='chrome']",
          message: 'Pure newtab hooks must not access chrome.* APIs. Move runtime coordination to controllers.',
        },
      ],
    },
  },
  // Rule 7: src/lib must stay pure and independent
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../utils/*', '**/utils/*'],
              message: 'src/lib is pure domain logic and must not import src/utils adapters.',
            },
            {
              group: ['../stores/*', '**/stores/*'],
              message: 'src/lib must not import stores.',
            },
            {
              group: ['../newtab/*', '**/newtab/*'],
              message: 'src/lib must not import newtab modules.',
            },
            {
              group: ['react', 'react-dom', 'zustand'],
              message: 'src/lib must stay framework-independent.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='chrome']",
          message: 'src/lib must not access chrome.* APIs.',
        },
        {
          selector: "MemberExpression[object.object.name='chrome']",
          message: 'src/lib must not access chrome.* APIs.',
        },
      ],
    },
  },

  // Rule 8: src/utils is adapter layer without app imports
  {
    files: ['src/utils/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../stores/*', '**/stores/*'],
              message: 'src/utils is an adapter layer and must not import stores.',
            },
            {
              group: ['../newtab/*', '**/newtab/*'],
              message: 'src/utils is an adapter layer and must not import newtab modules.',
            },
            {
              group: ['react', 'react-dom', 'zustand'],
              message: 'src/utils must stay framework-independent.',
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
        {
          selector: "JSXText[value=/[\\u{1F300}-\\u{1F9FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}]/u]",
          message: 'No emoji in JSX text. Use SVG icons instead.',
        },
      ],
    },
  },
])
