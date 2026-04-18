#!/usr/bin/env bash
# Stop hook: run full project type check + lint before session ends
set -euo pipefail

tsc_output=$(npx tsc --noEmit 2>&1) || {
  echo "⚠️  TypeScript errors found:"
  echo "$tsc_output"
  exit 0
}

lint_output=$(npm run lint 2>&1) || {
  echo "⚠️  ESLint errors found:"
  echo "$lint_output"
  exit 0
}

echo "✅ All checks passed (tsc + eslint)"
