#!/usr/bin/env bash
# PostToolUse hook: lint .ts/.tsx files after Edit or Write
# Receives JSON on stdin: { tool_name, tool_input: { file_path, ... }, tool_output }
set -euo pipefail

input=$(cat)
file=$(echo "$input" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null || echo "")

# Only lint TypeScript files
if [[ "$file" =~ \.(ts|tsx)$ ]]; then
  npx eslint --no-warn-ignored "$file" 2>&1 || true
fi
