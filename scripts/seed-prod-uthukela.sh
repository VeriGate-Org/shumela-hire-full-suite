#!/usr/bin/env bash
#
# seed-prod-uthukela.sh — Bootstrap prod environment and seed uThukela Water tenant
#
# This script:
#   1. Creates a platform admin user in the prod Cognito pool
#   2. Authenticates as the platform admin
#   3. Creates the "uthukela" tenant via the admin API
#   4. Creates Cognito users with correct groups and tenant_id
#   5. Creates departments and job postings
#   6. Runs seed-uthukela-employees.sh for full employee profiles
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

TENANT_SUBDOMAIN="uthukela"
TENANT_NAME="uThukela Water"
TENANT_CONTACT_EMAIL="info@uthukelawater.co.za"
TENANT_CONTACT_NAME="uThukela Water HR"
TENANT_ADMIN_EMAIL="admin@uthukela.shumelahire.co.za"

# uThukela Water branding
PRIMARY_COLOR="#1a3a5c"
SECONDARY_COLOR="#2c7d8e"
ACCENT_COLOR="#0693e3"

# Colours for output
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

if [ -z "${PLATFORM_ADMIN_PASSWORD:-}" ]; then
  echo -n "Enter password for ${PLATFORM_ADMIN_EMAIL}: "
  read -rs PLATFORM_ADMIN_PASSWORD
  echo ""
  [ -z "$PLATFORM_ADMIN_PASSWORD" ] && fail "Password cannot be empty"
fi

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

aws_cmd cognito-idp admin-set-user-password \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username "$PLATFORM_ADMIN_EMAIL" \
  --password "$PLATFORM_ADMIN_PASSWORD" \
  --permanent 2>/dev/null && ok "Set permanent password" || warn "Could not set password"

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
  HEALTH_RESPONSE=$(curl -s --max-time 60 "${API_BASE_URL}/api/actuator/health" 2>/dev/null || echo "")
  HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 "${API_BASE_URL}/api/actuator/health" 2>/dev/null || echo "000")
  # 200 = healthy; 400 with "Unable to resolve tenant" also means the API is
  # running — it just can't resolve a tenant from the apex/CloudFront domain.
  if [[ "$HEALTH_CODE" -ge 200 && "$HEALTH_CODE" -lt 300 ]]; then
    ok "API is healthy (HTTP $HEALTH_CODE)"
    break
  elif [[ "$HEALTH_CODE" == "400" ]] && echo "$HEALTH_RESPONSE" | grep -q "Unable to resolve tenant"; then
    ok "API is running (HTTP 400 — tenant resolution expected to fail on apex domain)"
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
# Step 4: Authenticate as platform admin
# ============================================================
log "Authenticating as ${PLATFORM_ADMIN_EMAIL}..."

AUTH_INPUT=$(jq -n \
  --arg clientId "$COGNITO_CLIENT_ID" \
  --arg username "$PLATFORM_ADMIN_EMAIL" \
  --arg password "$PLATFORM_ADMIN_PASSWORD" \
  '{ClientId:$clientId, AuthFlow:"USER_PASSWORD_AUTH", AuthParameters:{USERNAME:$username, PASSWORD:$password}}')

AUTH_RESULT=$(aws_cmd cognito-idp initiate-auth \
  --cli-input-json "$AUTH_INPUT" \
  --output json) || fail "Cognito auth failed"

TOKEN=$(echo "$AUTH_RESULT" | jq -r '.AuthenticationResult.AccessToken')
ID_TOKEN=$(echo "$AUTH_RESULT" | jq -r '.AuthenticationResult.IdToken')

[ -z "$TOKEN" ] || [ "$TOKEN" = "null" ] && fail "No access token returned"
ok "Authenticated"

# ============================================================
# Helper: API call function
# ============================================================
CURRENT_TENANT_ID=""

api() {
  local method="$1"
  local path="$2"
  local tenant_override="${CURRENT_TENANT_ID:-}"
  shift 2
  local url="${API_BASE_URL}${path}"
  local headers=(-H "Authorization: Bearer $ID_TOKEN" -H "Content-Type: application/json")
  [ -n "$tenant_override" ] && headers+=(-H "X-Tenant-Id: $tenant_override")

  local response
  response=$(curl -s -w "\n%{http_code}" --max-time 60 "${headers[@]}" -X "$method" "$url" "$@")
  local http_code
  http_code=$(echo "$response" | tail -1)
  local body
  body=$(echo "$response" | sed '$d')

  if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
    echo "$body"
  else
    echo "HTTP $http_code: $body" >&2
    return 1
  fi
}

api_post() { api POST "$@"; }
api_get()  { api GET "$@"; }
api_put()  { api PUT "$@"; }

# ============================================================
# Step 5: Create the uThukela Water tenant
# ============================================================
log "Creating tenant '${TENANT_SUBDOMAIN}'..."

TENANT_SETTINGS=$(jq -n \
  --arg primary "$PRIMARY_COLOR" \
  --arg secondary "$SECONDARY_COLOR" \
  --arg accent "$ACCENT_COLOR" \
  '{
    branding: {
      primaryColor: $primary,
      secondaryColor: $secondary,
      accentColor: $accent
    },
    companyInfo: {
      description: "uThukela Water is a water services authority and provider in the uThukela District, KwaZulu-Natal, responsible for potable water supply, wastewater management, and infrastructure development.",
      industry: "Water & Sanitation / Municipal Services",
      address: "79 Harding Street, Newcastle, KZN 2940",
      website: "https://www.uthukelawater.co.za"
    }
  }')

CREATE_TENANT_BODY=$(jq -n \
  --arg name "$TENANT_NAME" \
  --arg subdomain "$TENANT_SUBDOMAIN" \
  --arg contactEmail "$TENANT_CONTACT_EMAIL" \
  --arg contactName "$TENANT_CONTACT_NAME" \
  --arg adminUsername "$TENANT_ADMIN_EMAIL" \
  --arg adminPassword "$TENANT_ADMIN_PASSWORD" \
  --argjson settings "$TENANT_SETTINGS" \
  '{
    name: $name,
    subdomain: $subdomain,
    contactEmail: $contactEmail,
    contactName: $contactName,
    plan: "ENTERPRISE",
    maxUsers: 100,
    adminUsername: $adminUsername,
    adminPassword: $adminPassword,
    settings: ($settings | tostring)
  }')

CURRENT_TENANT_ID="platform"
TENANT_RESULT=$(api_post "/api/admin/tenants" -d "$CREATE_TENANT_BODY" 2>/dev/null) || {
  warn "Tenant creation returned an error — will try to resolve existing tenant..."
}
CURRENT_TENANT_ID=""

UTHUKELA_TENANT_ID=$(echo "$TENANT_RESULT" | jq -r '.id // empty' 2>/dev/null)
if [ -n "$UTHUKELA_TENANT_ID" ]; then
  ok "Tenant created with ID: $UTHUKELA_TENANT_ID"
else
  log "Attempting to resolve existing tenant '${TENANT_SUBDOMAIN}'..."
  RESOLVE_RESULT=$(api_get "/api/public/tenants/resolve/${TENANT_SUBDOMAIN}" 2>/dev/null) || true
  UTHUKELA_TENANT_ID=$(echo "$RESOLVE_RESULT" | jq -r '.id // empty' 2>/dev/null)

  if [ -z "$UTHUKELA_TENANT_ID" ]; then
    CURRENT_TENANT_ID="platform"
    TENANTS_RESULT=$(api_get "/api/admin/tenants" 2>/dev/null) || true
    CURRENT_TENANT_ID=""
    UTHUKELA_TENANT_ID=$(echo "$TENANTS_RESULT" | jq -r --arg sub "$TENANT_SUBDOMAIN" \
      '.[] | select(.subdomain == $sub) | .id // empty' 2>/dev/null | head -1)
  fi

  [ -n "$UTHUKELA_TENANT_ID" ] && ok "Resolved existing tenant: $UTHUKELA_TENANT_ID"
fi

[ -z "$UTHUKELA_TENANT_ID" ] && fail "Could not determine tenant ID — check if /api/admin/tenants endpoint is working"

CURRENT_TENANT_ID="$UTHUKELA_TENANT_ID"

# ============================================================
# Step 6: Create Cognito users for the tenant
# ============================================================
log "Creating Cognito demo users..."

create_cognito_user() {
  local email="$1" role="$2" first="$3" last="$4"

  aws_cmd cognito-idp admin-create-user \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$email" \
    --user-attributes \
      Name=email,Value="$email" \
      Name=email_verified,Value=true \
      Name=given_name,Value="$first" \
      Name=family_name,Value="$last" \
      Name=custom:tenant_id,Value="$UTHUKELA_TENANT_ID" \
    --temporary-password "$TENANT_ADMIN_PASSWORD" \
    --message-action SUPPRESS 2>/dev/null && ok "Created user $email" || warn "User $email may already exist"

  aws_cmd cognito-idp admin-set-user-password \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$email" \
    --password "$TENANT_ADMIN_PASSWORD" \
    --permanent 2>/dev/null || true

  aws_cmd cognito-idp admin-add-user-to-group \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$email" \
    --group-name "$role" 2>/dev/null || warn "Could not add $email to group $role"
}

create_cognito_user "admin@uthukela.shumelahire.co.za"           "ADMIN"           "Sipho"    "Ndlovu"
create_cognito_user "hr.manager@uthukela.shumelahire.co.za"      "HR_MANAGER"      "Nomvula"  "Dlamini"
create_cognito_user "hiring.manager@uthukela.shumelahire.co.za"  "HIRING_MANAGER"  "Thabo"    "Khumalo"
create_cognito_user "recruiter@uthukela.shumelahire.co.za"       "RECRUITER"       "Zanele"   "Mthembu"
create_cognito_user "interviewer@uthukela.shumelahire.co.za"     "INTERVIEWER"     "Bongani"  "Zulu"
create_cognito_user "employee@uthukela.shumelahire.co.za"        "EMPLOYEE"        "Lindiwe"  "Ngcobo"
create_cognito_user "executive@uthukela.shumelahire.co.za"       "EXECUTIVE"       "Mandla"   "Shabalala"
create_cognito_user "applicant@uthukela.shumelahire.co.za"       "APPLICANT"       "Ayanda"   "Mkhize"

# ============================================================
# Step 7: Re-authenticate as tenant admin
# ============================================================
log "Re-authenticating as uThukela admin..."

AUTH_INPUT=$(jq -n \
  --arg clientId "$COGNITO_CLIENT_ID" \
  --arg username "$TENANT_ADMIN_EMAIL" \
  --arg password "$TENANT_ADMIN_PASSWORD" \
  '{ClientId:$clientId, AuthFlow:"USER_PASSWORD_AUTH", AuthParameters:{USERNAME:$username, PASSWORD:$password}}')

AUTH_RESULT=$(aws_cmd cognito-idp initiate-auth \
  --cli-input-json "$AUTH_INPUT" \
  --output json) || fail "Cognito auth as tenant admin failed"

TOKEN=$(echo "$AUTH_RESULT" | jq -r '.AuthenticationResult.AccessToken')
ID_TOKEN=$(echo "$AUTH_RESULT" | jq -r '.AuthenticationResult.IdToken')
[ "$TOKEN" = "null" ] && fail "No access token returned for tenant admin"
ok "Authenticated as tenant admin"

# ============================================================
# Step 8: Create departments
# ============================================================
log "Creating departments..."

create_dept() {
  local name="$1" code="$2" desc="$3"
  local body
  body=$(jq -n --arg n "$name" --arg c "$code" --arg d "$desc" \
    '{name:$n, code:$c, description:$d, isActive:true}')
  api_post "/api/departments" -d "$body" >/dev/null 2>&1 && ok "Department: $name" || warn "Department $name may already exist"
}

create_dept "Operations"          "OPS"   "Operational management including water treatment and distribution"
create_dept "Finance"             "FIN"   "Financial management, budgeting, and revenue services"
create_dept "Technical Services"  "TECH"  "Engineering, infrastructure planning, and maintenance"
create_dept "Corporate Services"  "CORP"  "Human resources, legal, IT, and administration"
create_dept "Water Services"      "WS"    "Water purification, quality control, and supply management"
create_dept "Community Services"  "CS"    "Community engagement, customer relations, and public education"

# ============================================================
# Step 9: Create job postings
# ============================================================
log "Creating job postings..."

create_job() {
  local title="$1" dept="$2" loc="$3" empType="$4" expLevel="$5"
  local desc="$6" reqs="$7" resps="$8" quals="$9" benefits="${10}"
  local salMin="${11}" salMax="${12}"

  local body
  body=$(jq -n \
    --arg title "$title" \
    --arg department "$dept" \
    --arg location "$loc" \
    --arg employmentType "$empType" \
    --arg experienceLevel "$expLevel" \
    --arg description "$desc" \
    --arg requirements "$reqs" \
    --arg responsibilities "$resps" \
    --arg qualifications "$quals" \
    --arg benefits "$benefits" \
    --argjson salaryMin "$salMin" \
    --argjson salaryMax "$salMax" \
    '{
      title: $title,
      department: $department,
      location: $location,
      employmentType: $employmentType,
      experienceLevel: $experienceLevel,
      description: $description,
      requirements: $requirements,
      responsibilities: $responsibilities,
      qualifications: $qualifications,
      benefits: $benefits,
      salaryMin: $salaryMin,
      salaryMax: $salaryMax,
      salaryCurrency: "ZAR",
      closingDate: "2026-12-31",
      status: "PUBLISHED"
    }')

  local result
  result=$(api_post "/api/job-postings" -d "$body" 2>&1) && \
    ok "Job: $title" || warn "Job '$title': $result"
}

create_job \
  "Water Process Controller" \
  "Water Services" \
  "Newcastle, KZN" \
  "FULL_TIME" \
  "MID_LEVEL" \
  "uThukela Water seeks a qualified Water Process Controller to manage daily operations at our water treatment facilities, ensuring compliance with SANS 241 drinking water standards." \
  "National Diploma in Water & Wastewater Treatment or equivalent;Valid Process Controller certificate (Class III minimum);3+ years experience in water treatment operations;Knowledge of SANS 241 standards;Experience with SCADA systems" \
  "Monitor and control water treatment processes;Conduct routine water quality testing and sampling;Operate and maintain treatment plant equipment;Ensure compliance with Blue Drop and Green Drop standards;Maintain accurate operational records and reports" \
  "National Diploma in Water Care/Water & Wastewater Treatment;Process Controller Certificate Class III or higher;Valid driver's licence" \
  "Medical aid contribution;Pension fund;Housing allowance;13th cheque" \
  380000 520000

create_job \
  "Civil Engineer - Infrastructure" \
  "Technical Services" \
  "Newcastle, KZN" \
  "FULL_TIME" \
  "SENIOR" \
  "Lead the design, planning, and project management of water and sanitation infrastructure projects across the uThukela District. This role involves overseeing bulk water supply schemes, pipeline construction, and reservoir upgrades." \
  "BSc/BEng Civil Engineering;Professional registration with ECSA (Pr Eng);5+ years experience in water infrastructure;Experience with municipal capital projects and MIG funding;Proficiency in AutoCAD and project management tools" \
  "Design and oversee water reticulation and bulk supply projects;Manage capital project budgets and contractor performance;Prepare technical reports for council and regulatory bodies;Ensure compliance with engineering standards and municipal bylaws;Coordinate with DWS on water use licences and dam safety" \
  "BSc or BEng in Civil Engineering;Professional registration with ECSA;Valid driver's licence" \
  "Medical aid;Pension fund;Cell phone allowance;Vehicle allowance;Performance bonus" \
  750000 1050000

create_job \
  "Finance Manager" \
  "Finance" \
  "Newcastle, KZN" \
  "FULL_TIME" \
  "SENIOR" \
  "Oversee the financial operations of uThukela Water including budgeting, financial reporting, revenue management, and audit compliance in accordance with MFMA requirements." \
  "CA(SA) or CIMA qualification;5+ years in public sector finance;Knowledge of MFMA, GRAP, and municipal financial regulations;Experience with supply chain management processes;Advanced Excel and financial systems experience" \
  "Prepare annual financial statements in accordance with GRAP;Manage budget preparation and monitoring processes;Oversee revenue collection and debt management;Coordinate internal and external audit processes;Ensure compliance with MFMA and National Treasury regulations" \
  "CA(SA), CIMA, or equivalent professional qualification;Understanding of MFMA and municipal finance" \
  "Medical aid;Pension fund;13th cheque;Performance bonus;Cell phone allowance" \
  850000 1200000

create_job \
  "Community Liaison Officer" \
  "Community Services" \
  "Ladysmith, KZN" \
  "FULL_TIME" \
  "ENTRY_LEVEL" \
  "Engage with communities across the uThukela District to promote water conservation, manage service delivery queries, and facilitate public participation in water services planning." \
  "Diploma in Public Administration, Communication, or Social Sciences;1-2 years community engagement experience;Fluency in isiZulu and English;Valid driver's licence;Knowledge of Batho Pele principles" \
  "Conduct community meetings and awareness campaigns;Handle service delivery complaints and queries;Coordinate with ward councillors on water service issues;Promote water conservation and responsible usage;Compile community feedback reports for management" \
  "Diploma in relevant field;Fluency in isiZulu and English;Valid Code B driver's licence" \
  "Medical aid;Pension fund;Travel allowance" \
  280000 380000

create_job \
  "ICT Systems Administrator" \
  "Corporate Services" \
  "Newcastle, KZN" \
  "FULL_TIME" \
  "MID_LEVEL" \
  "Maintain and support uThukela Water's ICT infrastructure including network management, server administration, and end-user support across all offices and treatment facilities." \
  "National Diploma in IT or Computer Science;3+ years systems administration experience;Microsoft/Linux server administration;Network infrastructure management (Cisco/Fortinet);ITIL Foundation certification preferred" \
  "Manage and maintain server infrastructure and network systems;Provide technical support to all departments;Implement cybersecurity measures and backup procedures;Manage ICT procurement and asset register;Support SCADA and telemetry system connectivity" \
  "National Diploma in IT/Computer Science;Relevant vendor certifications (MCSA, CCNA)" \
  "Medical aid;Pension fund;13th cheque;Cell phone allowance" \
  420000 580000

create_job \
  "Operations Manager" \
  "Operations" \
  "Newcastle, KZN" \
  "FULL_TIME" \
  "EXECUTIVE" \
  "Direct and oversee all operational activities of uThukela Water including water treatment, distribution, maintenance, and emergency response across the district." \
  "BTech/BEng in Civil or Chemical Engineering;8+ years in water utility operations;Management experience in a municipal or water board setting;Knowledge of Water Services Act and NWA;Strong leadership and crisis management skills" \
  "Direct daily operations across all water treatment works;Manage operational budgets and resource allocation;Ensure compliance with Blue Drop, Green Drop, and No Drop standards;Lead emergency response for water service disruptions;Report to executive management on operational performance metrics" \
  "BTech or BEng in relevant engineering discipline;Professional registration advantageous;Valid driver's licence" \
  "Medical aid;Pension fund;Vehicle allowance;Performance bonus;Cell phone allowance;13th cheque" \
  950000 1350000

echo ""

# ============================================================
# Step 10: Seed employee profiles
# ============================================================
log "Running uThukela employee seeder (seed-uthukela-employees.sh)..."
echo ""

export COGNITO_USER_POOL_ID
export COGNITO_CLIENT_ID
export API_BASE_URL
export AWS_REGION
export ADMIN_EMAIL="$TENANT_ADMIN_EMAIL"
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
log "Tenant:          ${TENANT_NAME}"
log "Subdomain:       ${TENANT_SUBDOMAIN}"
log "Tenant ID:       ${UTHUKELA_TENANT_ID}"
echo ""
log "Platform admin:  ${PLATFORM_ADMIN_EMAIL}"
log "Tenant admin:    ${TENANT_ADMIN_EMAIL} (password: ${TENANT_ADMIN_PASSWORD})"
echo ""
log "Demo Users (password: ${TENANT_ADMIN_PASSWORD}):"
log "  admin@uthukela.shumelahire.co.za           (Administrator)"
log "  hr.manager@uthukela.shumelahire.co.za      (HR Manager)"
log "  hiring.manager@uthukela.shumelahire.co.za  (Hiring Manager)"
log "  recruiter@uthukela.shumelahire.co.za       (Recruiter)"
log "  interviewer@uthukela.shumelahire.co.za     (Interviewer)"
log "  employee@uthukela.shumelahire.co.za        (Employee)"
log "  executive@uthukela.shumelahire.co.za       (Executive)"
log "  applicant@uthukela.shumelahire.co.za       (Applicant)"
echo ""
log "Departments: Operations, Finance, Technical Services,"
log "             Corporate Services, Water Services, Community Services"
echo ""
log "Next steps:"
log "  1. Verify login at ${API_BASE_URL}/login"
log "  2. Once DNS is migrated, access via https://uthukela.shumelahire.co.za/login"
log "  3. Run additional module seeders as needed (scripts/seed-*-dynamodb.py)"
echo ""
log "========================================"
