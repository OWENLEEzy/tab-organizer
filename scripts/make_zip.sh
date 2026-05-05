#!/bin/bash
# 打包分发 zip，供无仓库权限的用户使用
# 用法：bash make_zip.sh
# 增加参数：--upload 自动上传 Google Drive

set -e

UPLOADER=0
DRIVE_TOOL="${TABOUT_ZIP_DRIVE_TOOL:-auto}"   # rclone | gdrive | googleworkspace-cli | auto
DRIVE_REMOTE="${TABOUT_ZIP_DRIVE_REMOTE:-}"   # rclone remote 名称（例如 gdrive）
DRIVE_FOLDER="${TABOUT_ZIP_DRIVE_FOLDER:-}"   # rclone 文件夹路径（可选）
DRIVE_PARENT_ID="${TABORGANIZER_ZIP_DRIVE_PARENT_ID:-1FcRn_oe4LT09fM-HARwGU5aNkEYtgz7v}" # 可以修改为 tab-organizer 专属的 Folder ID

usage() {
  cat <<'EOF'
📦 tab-organizer 打包脚本

用法:
  bash make_zip.sh [options]

Options:
  --upload                 打包后自动上传 Google Drive
  --drive-tool <auto|rclone|gdrive|googleworkspace-cli>   选择上传工具（默认 auto）
  --drive-remote <name>    rclone remote 名称
  --drive-folder <path>    rclone 目标文件夹
  --drive-parent-id <id>   gdrive 目标父目录 ID
  -h, --help              查看帮助
EOF
}

upload_via_rclone() {
  local file_path="$1"
  local remote="$DRIVE_REMOTE"
  local folder="$DRIVE_FOLDER"

  if ! command -v rclone >/dev/null 2>&1; then
    echo "❌ 未检测到 rclone，请先安装并配置："
    echo "   brew install rclone"
    echo "   rclone config"
    exit 1
  fi

  if [[ -z "$remote" ]]; then
    echo "❌ 未设置 rclone remote。请设置 TABORGANIZER_ZIP_DRIVE_REMOTE 或传 --drive-remote。"
    exit 1
  fi

  local target="${remote}:"
  folder="${folder#/}"
  if [[ -n "$folder" ]]; then
    target="${target}${folder}"
  fi

  echo "☁️  正在上传到 Google Drive（rclone）：${target}"
  rclone copy "$file_path" "$target"
}

upload_via_gdrive() {
  local file_path="$1"

  if ! command -v gdrive >/dev/null 2>&1; then
    echo "❌ 未检测到 gdrive，请先安装并配置："
    echo "   brew install gdrive"
    exit 1
  fi

  if [[ -n "$DRIVE_PARENT_ID" ]]; then
    echo "☁️  正在上传到 Google Drive（gdrive）：${file_path}（目录: ${DRIVE_PARENT_ID}）"
    gdrive upload --parent "$DRIVE_PARENT_ID" "$file_path"
  else
    echo "☁️  正在上传到 Google Drive（gdrive）：${file_path}"
    gdrive upload "$file_path"
  fi
}

upload_via_googleworkspace() {
  local file_path="$1"
  local file_name="$2"
  local metadata

  if ! command -v gws >/dev/null 2>&1; then
    echo "❌ 未检测到 gws（googleworkspace-cli）。请先安装并完成授权："
    echo "   brew install googleworkspace-cli"
    echo "   gws auth login"
    exit 1
  fi

  # 删除 Drive 上同名旧文件，避免重复
  if [[ -n "$DRIVE_PARENT_ID" ]]; then
    echo "🔍 检查 Drive 上是否已有同名文件..."
    local query="name='${file_name}' and '${DRIVE_PARENT_ID}' in parents and trashed=false"
    local old_id
    old_id=$(gws drive files list --params "{\"q\": \"${query}\", \"fields\": \"files(id)\"}" 2>/dev/null | grep '"id"' | head -1 | sed 's/.*"id": *"\([^"]*\)".*/\1/')
    if [[ -n "$old_id" ]]; then
      echo "🗑️  删除旧版本（${old_id}）..."
      gws drive files delete --params "{\"fileId\": \"${old_id}\"}" >/dev/null 2>&1 || true
    fi

    metadata="{\"name\": \"${file_name}\", \"parents\": [\"${DRIVE_PARENT_ID}\"]}"
    echo "☁️  正在上传到 Google Drive：${file_name}"
  else
    metadata="{\"name\": \"${file_name}\"}"
    echo "☁️  正在上传到 Google Drive：${file_name}"
  fi

  local file_id
  file_id=$(gws drive files create --json "$metadata" --upload "$file_path" | grep '"id"' | head -1 | sed 's/.*"id": *"\([^"]*\)".*/\1/')

  if [[ -n "$file_id" ]]; then
    echo "🔓 设置公开权限..."
    gws drive permissions create --params "{\"fileId\": \"${file_id}\"}" --json '{"role": "reader", "type": "anyone"}' >/dev/null
    echo "📋 下载链接: https://drive.google.com/uc?export=download&id=${file_id}"
  fi
}

resolve_drive_tool() {
  local tool
  tool="$(printf "%s" "$DRIVE_TOOL" | tr "[:upper:]" "[:lower:]")"
  DRIVE_TOOL="$tool"
  case "$DRIVE_TOOL" in
    rclone|gdrive|googleworkspace-cli|googleworkspace|gws)
      ;;
    auto)
      if command -v rclone >/dev/null 2>&1; then
        DRIVE_TOOL="rclone"
      elif command -v gws >/dev/null 2>&1; then
        DRIVE_TOOL="googleworkspace-cli"
      elif command -v gdrive >/dev/null 2>&1; then
        DRIVE_TOOL="gdrive"
      else
        echo "❌ 未检测到 rclone、gdrive、googleworkspace-cli。请至少安装一个。"
        exit 1
      fi
      ;;
    *)
      echo "❌ --drive-tool 仅支持 auto、rclone、gdrive、googleworkspace-cli。当前: $DRIVE_TOOL"
      exit 1
      ;;
  esac
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --upload)
      UPLOADER=1
      shift
      ;;
    --drive-tool)
      if [[ $# -lt 2 ]]; then
        echo "❌ --drive-tool 需要一个值"
        usage
        exit 1
      fi
      DRIVE_TOOL="$2"
      shift 2
      ;;
    --drive-remote)
      if [[ $# -lt 2 ]]; then
        echo "❌ --drive-remote 需要一个值"
        usage
        exit 1
      fi
      DRIVE_REMOTE="$2"
      shift 2
      ;;
    --drive-folder)
      if [[ $# -lt 2 ]]; then
        echo "❌ --drive-folder 需要一个值"
        usage
        exit 1
      fi
      DRIVE_FOLDER="$2"
      shift 2
      ;;
    --drive-parent-id)
      if [[ $# -lt 2 ]]; then
        echo "❌ --drive-parent-id 需要一个值"
        usage
        exit 1
      fi
      DRIVE_PARENT_ID="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "❌ 未知参数: $1"
      usage
      exit 1
      ;;
  esac
done

DATE=$(date +%Y%m%d)
PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)
PROJECT_NAME=$(basename "$PROJECT_DIR")
RELEASES_DIR="${PROJECT_DIR}/releases"
mkdir -p "$RELEASES_DIR"
OUTPUT_NAME="${PROJECT_NAME}-${DATE}.zip"
OUTPUT_PATH="${RELEASES_DIR}/${OUTPUT_NAME}"

# 如果已存在，先删掉
[ -f "$OUTPUT_PATH" ] && rm "$OUTPUT_PATH"

echo "📦 打包中..."

cd "$PROJECT_DIR/.."

# 针对 Node/Chrome 扩展项目调整了排除规则
zip -r "$OUTPUT_PATH" "$PROJECT_NAME" \
  --exclude "*/.git/*" \
  --exclude "*/node_modules/*" \
  --exclude "*/dist/*" \
  --exclude "*/releases/*" \
  --exclude "*/.claude/*" \
  --exclude "*/.DS_Store" \
  --exclude "*.zip" \
  > /dev/null

SIZE=$(du -sh "$OUTPUT_PATH" | cut -f1)
echo "✅ 完成：${OUTPUT_NAME}（${SIZE}）"
echo "   路径：${OUTPUT_PATH}"

if [[ "$UPLOADER" == "1" ]]; then
  resolve_drive_tool
  if [[ "$DRIVE_TOOL" == "rclone" ]]; then
    upload_via_rclone "$OUTPUT_PATH"
  elif [[ "$DRIVE_TOOL" == "googleworkspace-cli" ]] || [[ "$DRIVE_TOOL" == "googleworkspace" ]] || [[ "$DRIVE_TOOL" == "gws" ]]; then
    upload_via_googleworkspace "$OUTPUT_PATH" "$OUTPUT_NAME"
  else
    upload_via_gdrive "$OUTPUT_PATH"
  fi
  echo "✅ 上传完成"
fi
