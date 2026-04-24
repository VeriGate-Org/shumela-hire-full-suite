#!/usr/bin/env bash
#
# seed-uthukela-water-cognito-users.sh — Create uThukela Water demo users in Cognito
#
# Creates the 5 demo accounts from NDA Annexure L (HR2026-BID-007) in the
# Cognito User Pool with permanent passwords and correct group assignments.
# The Flyway migration V052 seeds the corresponding database records.
#
# Prerequisites:
#   - AWS CLI v2 configured with credentials
#   - jq installed
#   - The uthukela tenant already exists (created by V052 migration or onboarding API)
#   - COGNITO_USER_POOL_ID set
#
# Usage:
#   export COGNITO_USER_POOL_ID="af-south-1_XXXXXXX"
#   export TENANT_ID="uthukela"
#   ./scripts/seed-uthukela-water-cognito-users.sh
#
set -euo pipefail

# ============================================================
# Configuration
# ============================================================
AWS_REGION="${AWS_REGION:-af-south-1}"
COGNITO_USER_POOL_ID="${COGNITO_USER_POOL_ID:?Set COGNITO_USER_POOL_ID}"
TENANT_ID="${TENANT_ID:-97282820-uthukela}"
DEMO_PASSWORD="${DEMO_PASSWORD:-Demo@2026!}"

# Colours
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*" >&2; }
ok()   { echo -e "${GREEN}  OK${NC} $*" >&2; }
warn() { echo -e "${YELLOW}  WARN${NC} $*" >&2; }
fail() { echo -e "${RED}  FAIL${NC} $*" >&2; }

# ============================================================
# Helper: create a Cognito user with permanent password
# ============================================================
create_user() {
    local email="$1"
    local first_name="$2"
    local last_name="$3"
    local group="$4"

    log "Creating user: ${email} (${group})"

    if aws cognito-idp admin-get-user \
        --user-pool-id "$COGNITO_USER_POOL_ID" \
        --username "$email" \
        --region "$AWS_REGION" &>/dev/null; then
        warn "User ${email} already exists — resetting password and updating attributes"
    else
        aws cognito-idp admin-create-user \
            --user-pool-id "$COGNITO_USER_POOL_ID" \
            --username "$email" \
            --temporary-password "$DEMO_PASSWORD" \
            --message-action SUPPRESS \
            --user-attributes \
                Name=email,Value="$email" \
                Name=email_verified,Value=true \
                Name=given_name,Value="$first_name" \
                Name=family_name,Value="$last_name" \
                Name=name,Value="${first_name} ${last_name}" \
                Name=custom:tenant_id,Value="$TENANT_ID" \
            --region "$AWS_REGION" > /dev/null

        ok "Created ${email}"
    fi

    # Always set permanent password (handles both new and existing users)
    aws cognito-idp admin-set-user-password \
        --user-pool-id "$COGNITO_USER_POOL_ID" \
        --username "$email" \
        --password "$DEMO_PASSWORD" \
        --permanent \
        --region "$AWS_REGION"

    aws cognito-idp admin-update-user-attributes \
        --user-pool-id "$COGNITO_USER_POOL_ID" \
        --username "$email" \
        --user-attributes \
            Name=email_verified,Value=true \
            Name=given_name,Value="$first_name" \
            Name=family_name,Value="$last_name" \
            Name=name,Value="${first_name} ${last_name}" \
            Name=custom:tenant_id,Value="$TENANT_ID" \
        --region "$AWS_REGION"

    aws cognito-idp admin-add-user-to-group \
        --user-pool-id "$COGNITO_USER_POOL_ID" \
        --username "$email" \
        --group-name "$group" \
        --region "$AWS_REGION" 2>/dev/null || warn "Group '${group}' may not exist — create it first"

    ok "Configured ${email} -> group: ${group}, tenant: ${TENANT_ID}"
}

# ============================================================
# Create 5 uThukela Water demo users (per NDA Annexure L)
# ============================================================
echo ""
echo "=========================================="
echo " uThukela Water — Cognito User Setup"
echo " (HR2026-BID-007 / Annexure L)"
echo "=========================================="
echo " Pool:     ${COGNITO_USER_POOL_ID}"
echo " Tenant:   ${TENANT_ID}"
echo " Region:   ${AWS_REGION}"
echo " Password: ${DEMO_PASSWORD}"
echo " URL:      https://uthukela.shumelahire.co.za"
echo "=========================================="
echo ""

create_user "admin@uthukela.shumelahire.co.za"          "Sipho"     "Ndlovu"    "ADMIN"
create_user "hr.manager@uthukela.shumelahire.co.za"      "Nomvula"   "Dlamini"   "HR_MANAGER"
create_user "executive@uthukela.shumelahire.co.za"       "Mandla"    "Shabalala" "EXECUTIVE"
create_user "hiring.manager@uthukela.shumelahire.co.za"  "Thabo"     "Khumalo"   "HIRING_MANAGER"
create_user "employee@uthukela.shumelahire.co.za"        "Lindiwe"   "Ngcobo"    "EMPLOYEE"
create_user "recruiter@uthukela.shumelahire.co.za"       "Zanele"    "Mthembu"   "RECRUITER"
create_user "interviewer@uthukela.shumelahire.co.za"     "Bongani"   "Zulu"      "INTERVIEWER"
create_user "applicant@uthukela.shumelahire.co.za"       "Ayanda"    "Mkhize"    "APPLICANT"

echo ""
log "Done! All 8 uThukela Water demo users created."
echo ""
echo "  URL:      https://uthukela.shumelahire.co.za"
echo "  Password: ${DEMO_PASSWORD} (all accounts)"
echo ""
echo "  Accounts:"
echo "    Administrator:  admin@uthukela.shumelahire.co.za"
echo "    HR Manager:     hr.manager@uthukela.shumelahire.co.za"
echo "    Executive:      executive@uthukela.shumelahire.co.za"
echo "    Hiring Manager: hiring.manager@uthukela.shumelahire.co.za"
echo "    Employee:       employee@uthukela.shumelahire.co.za"
echo "    Recruiter:      recruiter@uthukela.shumelahire.co.za"
echo "    Interviewer:    interviewer@uthukela.shumelahire.co.za"
echo "    Applicant:      applicant@uthukela.shumelahire.co.za"
echo ""
