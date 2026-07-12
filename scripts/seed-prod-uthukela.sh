#!/usr/bin/env bash
#
# seed-prod-uthukela.sh — Bootstrap prod environment and seed uThukela Water tenant
#
# This script handles the prod bootstrap problem:
#   1. Creates a platform admin user in the prod Cognito pool
#   2. Runs the existing seed-uthukela-demo.sh to create the tenant + Cognito users
#   3. Runs seed-uthukela-employees.sh to create employee profiles
#
# Prerequisites:
#   - AWS CLI v2 configured with credentials (--profile alusa-dev or env vars)
#   - jq installed
#   - curl installed
#   - Prod CDK stacks deployed (shumelahire-foundation, shumelahire-serverless, etc.)
#
# Usage:
#   # Option 1: Auto-discover from CloudFormation outputs
#   ./scripts/seed-prod-uthukela.sh
#
#   # Option 2: Provide values explicitly
#   export COGNITO_USER_POOL_ID="af-south-1_XXXXXXX"
#   export COGNITO_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
#   export PLATFORM_ADMIN_PASSWORD="<SECURE_PASSWORD>"
#   export API_BASE_URL="https://shumelahire.co.za"
#   ./scripts/seed-prod-uthukela.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================================
# Configuration
# ============================================================
AWS_REGION="${AWS_REGION:-af-south-1}"
AWS_PROFILE="${AWS_PROFILE:-}"
STACK_PREFIX="shumelahire"
PLATFORM_ADMIN_EMAIL="${PLATFORM_ADMIN_EMAIL:-admin@shumelahire.co.za}"
TENANT_ADMIN_PASSWORD="${TENANT_ADMIN_PASSWORD:-Demo@2026!}"

# Colours
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*" >&2; }
ok()   { echo -e "${GREEN}  OK${NC} $*" >&2; }
warn() { echo -e "${YELLOW}  WARN${NC} $*" >&2; }
fail() { echo -e "${RED}  FAIL${NC} $*" >&2; exit 1; }

aws_cmd() {
  if [ -n "$AWS_PROFILE" ]; then
    aws --profile "$AWS_PROFILE" --region "$AWS_REGION" "$@"
  else
    aws --region "$AWS_REGION" "$@"
  fi
}

# ============================================================
# Step 1: Discover prod stack outputs
# ============================================================
echo ""
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD} Shumela Hire — Prod Environment Setup${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

log "Discovering prod stack outputs..."

if [ -z "${COGNITO_USER_POOL_ID:-}" ]; then
  COGNITO_USER_POOL_ID=$(aws_cmd cloudformation describe-stacks \
    --stack-name "${STACK_PREFIX}-foundation" \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text 2>/dev/null) || fail "Could not find ${STACK_PREFIX}-foundation stack — has prod been deployed?"
  ok "User Pool ID: ${COGNITO_USER_POOL_ID}"
fi

if [ -z "${COGNITO_CLIENT_ID:-}" ]; then
  COGNITO_CLIENT_ID=$(aws_cmd cloudformation describe-stacks \
    --stack-name "${STACK_PREFIX}-foundation" \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
    --output text 2>/dev/null) || fail "Could not find UserPoolClientId output"
  ok "Client ID: ${COGNITO_CLIENT_ID}"
fi

if [ -z "${API_BASE_URL:-}" ]; then
  # Try CloudFront distribution domain first, fall back to default
  CF_DOMAIN=$(aws_cmd cloudformation describe-stacks \
    --stack-name "${STACK_PREFIX}-frontend" \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' \
    --output text 2>/dev/null || echo "")

  if [ -n "$CF_DOMAIN" ] && [ "$CF_DOMAIN" != "None" ]; then
    API_BASE_URL="https://${CF_DOMAIN}"
    ok "API URL (CloudFront): ${API_BASE_URL}"
  else
    API_BASE_URL="https://shumelahire.co.za"
    ok "API URL (default): ${API_BASE_URL}"
  fi
fi

echo ""
log "Configuration:"
log "  Region:        ${AWS_REGION}"
log "  Pool ID:       ${COGNITO_USER_POOL_ID}"
log "  Client ID:     ${COGNITO_CLIENT_ID}"
log "  API URL:       ${API_BASE_URL}"
log "  Admin Email:   ${PLATFORM_ADMIN_EMAIL}"
echo ""

# ============================================================
# Step 2: Bootstrap platform admin user
# ============================================================
log "Bootstrapping platform admin user..."

# Prompt for password if not set
if [ -z "${PLATFORM_ADMIN_PASSWORD:-}" ]; then
  echo -n "Enter password for ${PLATFORM_ADMIN_EMAIL}: "
  read -rs PLATFORM_ADMIN_PASSWORD
  echo ""
  [ -z "$PLATFORM_ADMIN_PASSWORD" ] && fail "Password cannot be empty"
fi

# Create the platform admin user (idempotent — will warn if exists)
aws_cmd cognito-idp admin-create-user \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username "$PLATFORM_ADMIN_EMAIL" \
  --user-attributes \
    Name=email,Value="$PLATFORM_ADMIN_EMAIL" \
    Name=email_verified,Value=true \
    Name=given_name,Value="Platform" \
    Name=family_name,Value="Admin" \
  --temporary-password "$PLATFORM_ADMIN_PASSWORD" \
  --message-action SUPPRESS 2>/dev/null && ok "Created platform admin user" || warn "Platform admin user may already exist"

# Set permanent password (bypasses forced password change)
aws_cmd cognito-idp admin-set-user-password \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username "$PLATFORM_ADMIN_EMAIL" \
  --password "$PLATFORM_ADMIN_PASSWORD" \
  --permanent 2>/dev/null && ok "Set permanent password" || warn "Could not set password"

# Add to ADMIN group
aws_cmd cognito-idp admin-add-user-to-group \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username "$PLATFORM_ADMIN_EMAIL" \
  --group-name ADMIN 2>/dev/null && ok "Added to ADMIN group" || warn "Could not add to ADMIN group"

echo ""

# ============================================================
# Step 3: Wait for API to be ready
# ============================================================
log "Checking API readiness..."

MAX_ATTEMPTS=12
for i in $(seq 1 $MAX_ATTEMPTS); do
  HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 "${API_BASE_URL}/api/actuator/health" 2>/dev/null || echo "000")
  if [[ "$HEALTH_CODE" -ge 200 && "$HEALTH_CODE" -lt 300 ]]; then
    ok "API is healthy (HTTP $HEALTH_CODE)"
    break
  fi
  if [ "$i" -eq "$MAX_ATTEMPTS" ]; then
    fail "API not responding after $MAX_ATTEMPTS attempts (last: HTTP $HEALTH_CODE). Is the Lambda warm?"
  fi
  warn "API returned HTTP $HEALTH_CODE — waiting 10s... ($i/$MAX_ATTEMPTS)"
  sleep 10
done

echo ""

# ============================================================
# Step 4: Run existing seed scripts
# ============================================================
log "Running uThukela tenant seeder (seed-uthukela-demo.sh)..."
echo ""

export COGNITO_USER_POOL_ID
export COGNITO_CLIENT_ID
export API_BASE_URL
export AWS_REGION
export ADMIN_EMAIL="$PLATFORM_ADMIN_EMAIL"
export ADMIN_PASSWORD="$PLATFORM_ADMIN_PASSWORD"
export TENANT_ADMIN_PASSWORD="$TENANT_ADMIN_PASSWORD"

bash "${SCRIPT_DIR}/seed-uthukela-demo.sh" || {
  warn "seed-uthukela-demo.sh encountered errors — continuing with employee seeding..."
}

echo ""
log "Running uThukela employee seeder (seed-uthukela-employees.sh)..."
echo ""

# Switch admin credentials to the tenant admin for employee seeding
export ADMIN_EMAIL="admin@uthukela.shumelahire.co.za"
export ADMIN_PASSWORD="$TENANT_ADMIN_PASSWORD"

bash "${SCRIPT_DIR}/seed-uthukela-employees.sh" || {
  warn "seed-uthukela-employees.sh encountered errors"
}

# ============================================================
# Summary
# ============================================================
echo ""
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD} Prod Seeding Complete${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""
log "Platform admin:  ${PLATFORM_ADMIN_EMAIL}"
log "Tenant admin:    admin@uthukela.shumelahire.co.za (password: ${TENANT_ADMIN_PASSWORD})"
echo ""
log "Next steps:"
log "  1. Verify login at ${API_BASE_URL}/login"
log "  2. Once DNS is migrated, access via https://uthukela.shumelahire.co.za/login"
log "  3. Run additional module seeders as needed (scripts/seed-*-dynamodb.py)"
echo ""
log "========================================"
