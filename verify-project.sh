#!/bin/bash

# プロジェクト識別確認スクリプト
# Keiba review platform プロジェクト専用

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 期待されるプロジェクト情報
EXPECTED_PROJECT_NAME="Keiba review platform"
EXPECTED_DIR_NAME="keiba-review-platform"

echo ""
echo "🔍 プロジェクト識別システム - 確認開始"
echo "============================================"
echo ""

# 現在のディレクトリを取得
CURRENT_DIR=$(pwd)
DIR_BASENAME=$(basename "$CURRENT_DIR")

echo "📂 現在のディレクトリ:"
echo "   $CURRENT_DIR"
echo ""

# ディレクトリ名の確認
if [ "$DIR_BASENAME" = "$EXPECTED_DIR_NAME" ]; then
    echo -e "${GREEN}✅ ディレクトリ名: 正常${NC}"
    echo "   期待値: $EXPECTED_DIR_NAME"
    echo "   実際値: $DIR_BASENAME"
else
    echo -e "${RED}❌ エラー: ディレクトリ名が一致しません${NC}"
    echo "   期待値: $EXPECTED_DIR_NAME"
    echo "   実際値: $DIR_BASENAME"
    echo ""
    echo -e "${YELLOW}⚠️  正しいディレクトリに移動してください:${NC}"
    echo "   cd '/Users/apolon/Library/Mobile Documents/com~apple~CloudDocs/WorkSpace/Keiba review platform/keiba-review-platform'"
    exit 1
fi

echo ""

# CLAUDE.mdの存在確認
if [ -f "CLAUDE.md" ]; then
    echo -e "${GREEN}✅ CLAUDE.md: 存在確認${NC}"

    # プロジェクト名の確認
    if grep -q "Keiba review platform" CLAUDE.md; then
        echo -e "${GREEN}✅ プロジェクト名: 正常${NC}"
        echo "   $EXPECTED_PROJECT_NAME"
    else
        echo -e "${RED}❌ エラー: CLAUDE.md内にプロジェクト名が見つかりません${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ エラー: CLAUDE.mdが見つかりません${NC}"
    echo "   このスクリプトはプロジェクトルートで実行してください"
    exit 1
fi

echo ""

# package.jsonの存在確認（Astroプロジェクトの確認）
if [ -f "package.json" ]; then
    if grep -q "astro" package.json; then
        echo -e "${GREEN}✅ Astroプロジェクト: 確認${NC}"
    else
        echo -e "${YELLOW}⚠️  警告: package.jsonにastroが見つかりません${NC}"
    fi
else
    echo -e "${RED}❌ エラー: package.jsonが見つかりません${NC}"
    exit 1
fi

echo ""

# 他プロジェクトファイルの確認（誤参照防止）
NANKAN_ANALYTICS_CHECK="../nankan-analytics"
if [ -d "$NANKAN_ANALYTICS_CHECK" ]; then
    echo -e "${YELLOW}⚠️  注意: 他プロジェクト（nankan-analytics）が検出されました${NC}"
    echo "   このセッションでは Keiba review platform のみを扱ってください"
    echo ""
fi

# 最終確認
echo "============================================"
echo -e "${GREEN}✅ 確認完了: 正しいプロジェクト（$EXPECTED_PROJECT_NAME）で作業中です${NC}"
echo ""
echo "📝 重要事項:"
echo "   - このセッションでは Keiba review platform のみを扱う"
echo "   - nankan-analytics やその他のプロジェクトのファイルを読み込まない"
echo "   - ../ を使った他プロジェクトへのアクセスを行わない"
echo ""

exit 0
