#!/usr/bin/env bash
# Despliegue del portal ARGOS a Azure App Service (zip deploy del build standalone).
# Requiere: az CLI autenticado, npm, zip. Uso:
#   ./scripts/deploy-azure.sh [app-name] [resource-group]
set -euo pipefail

APP_NAME="${1:-argos-dotacion-pilot}"
RESOURCE_GROUP="${2:-rg-argos-dotacion}"
APP_URL="https://${APP_NAME}.azurewebsites.net"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE_DIR="$(mktemp -d)/argos-deploy"
ZIP_PATH="$(dirname "$STAGE_DIR")/argos-deploy.zip"

trap 'rm -rf "$(dirname "$STAGE_DIR")"' EXIT

echo "==> Verificando sesión de Azure CLI"
az account show --query name -o tsv >/dev/null

echo "==> Build de producción (NEXT_PUBLIC_* se inyectan en tiempo de build)"
cd "$REPO_ROOT"
rm -rf .next
NEXT_PUBLIC_ENTRA_REDIRECT_URI="${APP_URL}/login" \
NEXT_PUBLIC_TURNSTILE_SITE_KEY="${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-}" \
npm run build

echo "==> Empaquetando output standalone"
mkdir -p "$STAGE_DIR"
cp -R .next/standalone/. "$STAGE_DIR/"
mkdir -p "$STAGE_DIR/.next/static"
cp -R .next/static/. "$STAGE_DIR/.next/static/"
cp -R public "$STAGE_DIR/public"
(cd "$STAGE_DIR" && zip -qr "$ZIP_PATH" .)

echo "==> Desplegando a ${APP_NAME} (${RESOURCE_GROUP})"
az webapp deploy \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --src-path "$ZIP_PATH" \
  --type zip \
  --async false

echo "==> Verificando health endpoint"
sleep 5
curl -fsS --max-time 60 "${APP_URL}/api/health"
echo ""
echo "OK: ${APP_URL}"
