#!/usr/bin/env bash
#
# seed-dev-environment.sh — Bootstrap dev environment with generic demo data
#
# This script:
#   1. Deletes old uThukela data from dev DynamoDB (949 items)
#   2. Creates a fresh dev tenant record
#   3. Updates admin@shumelahire.co.za Cognito attributes
#   4. Creates demo Cognito users
#   5. Runs platform features seeder (generic, reused as-is)
#   6. Runs comprehensive dev data seeder (all modules)
#
# Prerequisites:
#   - AWS CLI v2 configured (--profile or env vars)
#   - jq installed
#   - Python 3 with cryptography package (pip install cryptography)
#
# Usage:
#   ./scripts/seed-dev-environment.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================================
# Configuration
# ============================================================
AWS_REGION="${AWS_REGION:-af-south-1}"
AWS_PROFILE="${AWS_PROFILE:-}"
STACK_PREFIX="${STACK_PREFIX:-shumelahire-dev}"
COGNITO_USER_POOL_ID="${COGNITO_USER_POOL_ID:-af-south-1_fbnfVdGsI}"
DEMO_PASSWORD="${DEMO_PASSWORD:-Demo@2026!}"

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
# Resolve DynamoDB Table Name
# ============================================================
resolve_table_name() {
  if [ -n "${DYNAMODB_TABLE_NAME:-}" ]; then
    echo "$DYNAMODB_TABLE_NAME"
    return
  fi
  local table
  table=$(aws_cmd cloudformation describe-stacks \
    --stack-name "${STACK_PREFIX}-serverless" \
    --query 'Stacks[0].Outputs[?OutputKey==`DataTableName`].OutputValue' \
    --output text 2>/dev/null || echo "")
  if [ -z "$table" ] || [ "$table" = "None" ]; then
    table="${STACK_PREFIX}-data"
  fi
  echo "$table"
}

# ============================================================
# Banner
# ============================================================
echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD} Shumela Hire — Dev Environment Seed${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""

TABLE_NAME=$(resolve_table_name)
export DYNAMODB_TABLE_NAME="$TABLE_NAME"
export AWS_REGION
export STACK_PREFIX

log "Configuration:"
log "  Region:     ${AWS_REGION}"
log "  Table:      ${TABLE_NAME}"
log "  Pool ID:    ${COGNITO_USER_POOL_ID}"
log "  Stack:      ${STACK_PREFIX}"
echo ""

# ============================================================
# Step 1: Delete old uThukela data
# ============================================================
log "Step 1: Deleting old uThukela data from DynamoDB..."

DELETE_COUNT=0
SCAN_TOKEN=""
SCAN_COMPLETE=false

while [ "$SCAN_COMPLETE" = "false" ]; do
  # Build scan command
  SCAN_ARGS=(dynamodb scan
    --table-name "$TABLE_NAME"
    --filter-expression "contains(PK, :uth)"
    --expression-attribute-values '{":uth":{"S":"uthukela"}}'
    --projection-expression "PK, SK"
    --max-items 25)

  if [ -n "$SCAN_TOKEN" ]; then
    SCAN_ARGS+=(--starting-token "$SCAN_TOKEN")
  fi

  SCAN_RESULT=$(aws_cmd "${SCAN_ARGS[@]}" 2>/dev/null) || break

  # Extract items
  ITEMS=$(echo "$SCAN_RESULT" | jq -c '.Items[]?' 2>/dev/null)
  NEXT_TOKEN=$(echo "$SCAN_RESULT" | jq -r '.NextToken // empty' 2>/dev/null)

  if [ -z "$ITEMS" ]; then
    if [ -z "$NEXT_TOKEN" ]; then
      SCAN_COMPLETE=true
    else
      SCAN_TOKEN="$NEXT_TOKEN"
    fi
    continue
  fi

  # Batch delete items (max 25 per batch)
  DELETE_REQUESTS=""
  BATCH_COUNT=0

  while IFS= read -r item; do
    PK=$(echo "$item" | jq -r '.PK.S')
    SK=$(echo "$item" | jq -r '.SK.S')
    DELETE_REQUESTS="${DELETE_REQUESTS}{\"DeleteRequest\":{\"Key\":{\"PK\":{\"S\":\"${PK}\"},\"SK\":{\"S\":\"${SK}\"}}}}"
    BATCH_COUNT=$((BATCH_COUNT + 1))

    if [ "$BATCH_COUNT" -eq 25 ]; then
      # Format as JSON array and execute
      BATCH_JSON=$(echo "$DELETE_REQUESTS" | sed 's/}{/},{/g')
      aws_cmd dynamodb batch-write-item \
        --request-items "{\"${TABLE_NAME}\":[${BATCH_JSON}]}" >/dev/null 2>&1 || true
      DELETE_COUNT=$((DELETE_COUNT + BATCH_COUNT))
      DELETE_REQUESTS=""
      BATCH_COUNT=0
    fi
  done <<< "$ITEMS"

  # Process remaining items in batch
  if [ "$BATCH_COUNT" -gt 0 ]; then
    BATCH_JSON=$(echo "$DELETE_REQUESTS" | sed 's/}{/},{/g')
    aws_cmd dynamodb batch-write-item \
      --request-items "{\"${TABLE_NAME}\":[${BATCH_JSON}]}" >/dev/null 2>&1 || true
    DELETE_COUNT=$((DELETE_COUNT + BATCH_COUNT))
  fi

  if [ -z "$NEXT_TOKEN" ]; then
    SCAN_COMPLETE=true
  else
    SCAN_TOKEN="$NEXT_TOKEN"
  fi
done

if [ "$DELETE_COUNT" -gt 0 ]; then
  ok "Deleted ${DELETE_COUNT} uThukela items"
else
  ok "No uThukela items found (already clean)"
fi
echo ""

# ============================================================
# Step 2: Generate Tenant ID
# ============================================================
log "Step 2: Setting dev tenant ID..."

# The TenantResolutionFilter falls back to "default" for dev.shumelahire.co.za
# (environment prefixes like dev/staging/qa are stripped, then the fallback returns "default")
TENANT_ID="default"
export TENANT_ID

ok "Tenant ID: ${TENANT_ID}"
echo ""

# ============================================================
# Step 3: Update admin Cognito attributes
# ============================================================
log "Step 3: Updating admin@shumelahire.co.za Cognito attributes..."

aws_cmd cognito-idp admin-update-user-attributes \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username "admin@shumelahire.co.za" \
  --user-attributes \
    Name=custom:tenant_id,Value="$TENANT_ID" \
    Name=given_name,Value="Arthur" \
    Name=family_name,Value="Manena" \
  2>/dev/null && ok "Updated admin attributes" || warn "Could not update admin attributes"

# Ensure admin is in ADMIN group
aws_cmd cognito-idp admin-add-user-to-group \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username "admin@shumelahire.co.za" \
  --group-name ADMIN 2>/dev/null || true

# Set permanent password
aws_cmd cognito-idp admin-set-user-password \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username "admin@shumelahire.co.za" \
  --password "$DEMO_PASSWORD" \
  --permanent 2>/dev/null && ok "Set admin password" || warn "Could not set admin password"

echo ""

# ============================================================
# Step 4: Create demo Cognito users
# ============================================================
log "Step 4: Creating demo Cognito users..."

create_cognito_user() {
  local email="$1" role="$2" first="$3" last="$4"

  # Create user (suppress if exists)
  aws_cmd cognito-idp admin-create-user \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$email" \
    --user-attributes \
      Name=email,Value="$email" \
      Name=email_verified,Value=true \
      Name=given_name,Value="$first" \
      Name=family_name,Value="$last" \
      Name=custom:tenant_id,Value="$TENANT_ID" \
    --temporary-password "$DEMO_PASSWORD" \
    --message-action SUPPRESS 2>/dev/null || true

  # Set permanent password
  aws_cmd cognito-idp admin-set-user-password \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$email" \
    --password "$DEMO_PASSWORD" \
    --permanent 2>/dev/null || true

  # Update tenant_id in case user already existed
  aws_cmd cognito-idp admin-update-user-attributes \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$email" \
    --user-attributes \
      Name=custom:tenant_id,Value="$TENANT_ID" \
    2>/dev/null || true

  # Add to group
  aws_cmd cognito-idp admin-add-user-to-group \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$email" \
    --group-name "$role" 2>/dev/null && ok "$email → $role" || warn "Could not add $email to $role"
}

create_cognito_user "hr.manager@shumelahire.co.za"      "HR_MANAGER"      "Sarah"   "Johnson"
create_cognito_user "hiring.manager@shumelahire.co.za"  "HIRING_MANAGER"  "David"   "Chen"
create_cognito_user "recruiter@shumelahire.co.za"       "RECRUITER"       "Priya"   "Naidoo"
create_cognito_user "interviewer@shumelahire.co.za"     "INTERVIEWER"     "James"   "Wilson"
create_cognito_user "employee@shumelahire.co.za"        "EMPLOYEE"        "Lisa"    "Mokoena"
create_cognito_user "executive@shumelahire.co.za"       "EXECUTIVE"       "Michael" "Botha"
create_cognito_user "applicant@shumelahire.co.za"       "APPLICANT"       "Thandi"  "Molefe"

echo ""

# ============================================================
# Step 5: Seed platform features (generic, reuse as-is)
# ============================================================
log "Step 5: Seeding platform features..."

python3 "${SCRIPT_DIR}/seed-platform-features-dynamodb.py" && ok "Platform features seeded" || warn "Platform features seeder had errors"

echo ""

# ============================================================
# Step 6: Seed comprehensive dev data
# ============================================================
log "Step 6: Seeding comprehensive dev data (all modules)..."
echo ""

python3 "${SCRIPT_DIR}/seed-dev-data-dynamodb.py" || warn "Dev data seeder had errors"

echo ""

# ============================================================
# Summary
# ============================================================
echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD} Dev Environment Seeding Complete${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""
log "Tenant:        Shumela Hire Dev"
log "Tenant ID:     ${TENANT_ID}"
log "Table:         ${TABLE_NAME}"
echo ""
log "Demo Users (password: ${DEMO_PASSWORD}):"
log "  admin@shumelahire.co.za           (ADMIN - Arthur Manena)"
log "  hr.manager@shumelahire.co.za      (HR_MANAGER - Sarah Johnson)"
log "  hiring.manager@shumelahire.co.za  (HIRING_MANAGER - David Chen)"
log "  recruiter@shumelahire.co.za       (RECRUITER - Priya Naidoo)"
log "  interviewer@shumelahire.co.za     (INTERVIEWER - James Wilson)"
log "  employee@shumelahire.co.za        (EMPLOYEE - Lisa Mokoena)"
log "  executive@shumelahire.co.za       (EXECUTIVE - Michael Botha)"
log "  applicant@shumelahire.co.za       (APPLICANT - Thandi Molefe)"
echo ""
log "Departments: Engineering, Product, Sales & Marketing, Finance,"
log "             Human Resources, Operations"
echo ""
log "Modules seeded:"
log "  - Employees (10 with full profiles)"
log "  - Users (8 Cognito-bridged records)"
log "  - Leave (7 types, balances, requests)"
log "  - Recruitment (6 postings, 8 applicants, 8 applications, 6 interviews)"
log "  - Performance (1 cycle, 5 contracts, 3 feedback requests)"
log "  - Training (5 courses, 4 sessions, 7 enrollments)"
log "  - Engagement (1 survey, 5 questions, 25 responses, 5 recognitions)"
log "  - Documents (11 employee documents)"
log "  - Onboarding (1 template, 1 active checklist)"
log "  - Shifts (4 definitions, 25 schedules)"
log "  - Sage Integration (1 config, 3 sync schedules)"
echo ""
log "Verification:"
log "  1. Login at https://dev.shumelahire.co.za as admin@shumelahire.co.za / ${DEMO_PASSWORD}"
log "  2. Verify My HR Portal shows Arthur Manena's profile"
log "  3. Check Dashboard, Recruitment, Leave, Performance, Training, Engagement"
log "  4. Login as other demo users to verify role-based access"
echo ""
log "================================================"
