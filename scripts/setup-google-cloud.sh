#!/usr/bin/env bash
# ─── Mise ERP — Google Cloud OAuth Setup ──────────────────────────────────────
# Run this once to create the Google Cloud project, enable APIs, and generate
# OAuth credentials for Gmail + Drive integration.
#
# Prerequisites: homebrew installed at /opt/homebrew or /usr/local
# Usage: bash scripts/setup-google-cloud.sh
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="mise-erp-$(LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 6)"
PROJECT_NAME="Mise ERP"
APP_NAME="Mise ERP"
MAIN_JS="$(dirname "$0")/../main.js"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║       Mise ERP — Google Cloud Setup                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─── 1. Install gcloud if missing ────────────────────────────────────────────
if ! command -v gcloud &>/dev/null; then
  echo "→ Installing Google Cloud CLI via Homebrew…"
  if command -v brew &>/dev/null; then
    brew install --cask google-cloud-sdk
  else
    echo "✗ Homebrew not found. Install it first: https://brew.sh"
    exit 1
  fi
fi
echo "✓ gcloud $(gcloud version --format='value(Google Cloud SDK)' 2>/dev/null || echo 'installed')"

# ─── 2. Auth ─────────────────────────────────────────────────────────────────
echo ""
echo "→ Signing in to Google (browser will open)…"
gcloud auth login --update-adc --quiet

# ─── 3. Create project ───────────────────────────────────────────────────────
echo ""
echo "→ Creating project: $PROJECT_ID"
gcloud projects create "$PROJECT_ID" --name="$PROJECT_NAME" --quiet || {
  echo "  (project may already exist, continuing…)"
}
gcloud config set project "$PROJECT_ID" --quiet

# ─── 4. Enable billing (skipped — APIs below are free-tier eligible) ─────────

# ─── 5. Enable APIs ──────────────────────────────────────────────────────────
echo ""
echo "→ Enabling Gmail API + Drive API…"
gcloud services enable \
  gmail.googleapis.com \
  drive.googleapis.com \
  --project="$PROJECT_ID" --quiet
echo "✓ APIs enabled"

# ─── 6. Configure OAuth consent screen ───────────────────────────────────────
echo ""
echo "→ Configuring OAuth consent screen (internal / testing)…"
# Note: gcloud doesn't fully manage consent screens via CLI; we do what we can
# and print the manual step for the rest.
echo ""
echo "  ┌─────────────────────────────────────────────────────────────────┐"
echo "  │ MANUAL STEP (takes < 2 min)                                     │"
echo "  │                                                                  │"
echo "  │ Open this URL in your browser:                                  │"
echo "  │ https://console.cloud.google.com/apis/credentials/consent       │"
echo "  │        ?project=$PROJECT_ID"
echo "  │                                                                  │"
echo "  │ 1. Select User Type: External → Create                          │"
echo "  │ 2. App name: Mise ERP                                           │"
echo "  │ 3. User support email: your email                               │"
echo "  │ 4. Developer contact: your email → Save and Continue            │"
echo "  │ 5. Scopes → Add or Remove Scopes → paste these 3 and Add:      │"
echo "  │      https://www.googleapis.com/auth/gmail.send                 │"
echo "  │      https://www.googleapis.com/auth/drive.file                 │"
echo "  │      https://www.googleapis.com/auth/userinfo.email             │"
echo "  │ 6. Test users → Add yourself → Save and Continue → Back to dash │"
echo "  └─────────────────────────────────────────────────────────────────┘"
echo ""
read -r -p "Press Enter once you've completed the consent screen setup…"

# ─── 7. Create OAuth 2.0 Desktop credentials ─────────────────────────────────
echo ""
echo "→ Creating OAuth 2.0 Desktop client…"
CREDS_FILE="/tmp/mise-erp-oauth-creds.json"

gcloud alpha iap oauth-clients create \
  "projects/$PROJECT_ID/brands/$PROJECT_ID" \
  --display_name="$APP_NAME Desktop" 2>/dev/null || true

# Fallback: use the credentials API directly
ACCESS_TOKEN=$(gcloud auth print-access-token)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

RESPONSE=$(curl -s -X POST \
  "https://oauth2.googleapis.com/oauth2/v1/projects/$PROJECT_NUMBER/oauthClients" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationtype": "DESKTOP",
    "displayName": "Mise ERP Desktop"
  }' 2>/dev/null || echo "")

# If API method fails, use gcloud credentials creation
if ! echo "$RESPONSE" | grep -q "clientId" 2>/dev/null; then
  echo "  → Using gcloud credentials create…"
  gcloud iam credentials create \
    --project="$PROJECT_ID" \
    --type=authorized_user \
    --client-id-file="$CREDS_FILE" 2>/dev/null || true

  # Fallback: REST API for OAuth client creation
  RESPONSE=$(curl -s \
    "https://clientauthconfig.googleapis.com/v1/projects/$PROJECT_NUMBER/brands/-/identityAwareProxyClients" \
    -H "Authorization: Bearer $ACCESS_TOKEN" 2>/dev/null || echo "")
fi

echo ""
echo "  ┌─────────────────────────────────────────────────────────────────┐"
echo "  │ MANUAL STEP — Create OAuth Client ID (< 1 min)                 │"
echo "  │                                                                  │"
echo "  │ Open:                                                            │"
echo "  │ https://console.cloud.google.com/apis/credentials               │"
echo "  │        ?project=$PROJECT_ID"
echo "  │                                                                  │"
echo "  │ 1. Create Credentials → OAuth client ID                         │"
echo "  │ 2. Application type: Desktop app                                │"
echo "  │ 3. Name: Mise ERP Desktop → Create                              │"
echo "  │ 4. Copy the Client ID and Client Secret shown                   │"
echo "  └─────────────────────────────────────────────────────────────────┘"
echo ""

read -r -p "Paste your Client ID here: " CLIENT_ID
read -r -p "Paste your Client Secret here: " CLIENT_SECRET

if [[ -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]]; then
  echo "✗ No credentials entered. Re-run this script when ready."
  exit 1
fi

# ─── 8. Patch main.js ────────────────────────────────────────────────────────
echo ""
echo "→ Writing credentials into main.js…"

if [[ ! -f "$MAIN_JS" ]]; then
  echo "✗ main.js not found at $MAIN_JS"
  exit 1
fi

# Replace placeholder values
sed -i.bak \
  -e "s|YOUR_CLIENT_ID\.apps\.googleusercontent\.com|$CLIENT_ID|g" \
  -e "s|YOUR_CLIENT_SECRET|$CLIENT_SECRET|g" \
  "$MAIN_JS"

echo "✓ main.js updated"
echo ""
echo "══════════════════════════════════════════════════════"
echo "  ✅  Setup complete!"
echo ""
echo "  Project: $PROJECT_ID"
echo "  Client:  $CLIENT_ID"
echo ""
echo "  Run 'npm run dev' in mise-erp and click"
echo "  Integrations → Connect Google to test."
echo "══════════════════════════════════════════════════════"
echo ""
