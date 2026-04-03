#!/usr/bin/env bash
#
# seed-uthukela-demo.sh — Create and populate the uThukela Water demo tenant
#
# This script:
#   1. Creates the "uthukela" tenant via the platform admin API
#   2. Sets branding (logo, colours)
#   3. Creates departments
#   4. Creates demo Cognito users with correct groups and tenant_id
#   5. Seeds job postings with realistic uThukela Water context
#
# Prerequisites:
#   - AWS CLI configured with credentials
#   - jq installed
#   - curl installed
#   - A platform admin user that can create tenants
#
# Usage:
#   export COGNITO_USER_POOL_ID="af-south-1_XXXXXXX"
#   export COGNITO_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
#   export ADMIN_PASSWORD="Demo@2026"
#   export API_BASE_URL="https://dev.shumelahire.co.za"   # or production URL
#   ./scripts/seed-uthukela-demo.sh
#
set -euo pipefail

# ============================================================
# Configuration
# ============================================================
API_BASE_URL="${API_BASE_URL:-https://dev.shumelahire.co.za}"
AWS_REGION="${AWS_REGION:-af-south-1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@idc-demo.shumelahire.co.za}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:?Set ADMIN_PASSWORD}"
COGNITO_USER_POOL_ID="${COGNITO_USER_POOL_ID:?Set COGNITO_USER_POOL_ID}"
COGNITO_CLIENT_ID="${COGNITO_CLIENT_ID:?Set COGNITO_CLIENT_ID}"

TENANT_SUBDOMAIN="uthukela"
TENANT_NAME="uThukela Water"
TENANT_CONTACT_EMAIL="info@uthukelawater.co.za"
TENANT_CONTACT_NAME="uThukela Water HR"
TENANT_ADMIN_EMAIL="admin@uthukela.shumelahire.co.za"
TENANT_ADMIN_PASSWORD="${TENANT_ADMIN_PASSWORD:-Demo@2026}"

# uThukela Water branding
# Primary: Deep blue from municipal water branding
# Secondary: Teal/cyan water theme
# Accent: Vibrant blue for CTAs
PRIMARY_COLOR="#1a3a5c"
SECONDARY_COLOR="#2c7d8e"
ACCENT_COLOR="#0693e3"

# Colours for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*" >&2; }
ok()   { echo -e "${GREEN}  OK${NC} $*" >&2; }
warn() { echo -e "${YELLOW}  WARN${NC} $*" >&2; }
fail() { echo -e "${RED}  FAIL${NC} $*" >&2; exit 1; }

# ============================================================
# Step 1: Authenticate with Cognito (as platform admin)
# ============================================================
log "Authenticating as ${ADMIN_EMAIL}..."

AUTH_INPUT=$(jq -n \
  --arg clientId "$COGNITO_CLIENT_ID" \
  --arg username "$ADMIN_EMAIL" \
  --arg password "$ADMIN_PASSWORD" \
  '{ClientId:$clientId, AuthFlow:"USER_PASSWORD_AUTH", AuthParameters:{USERNAME:$username, PASSWORD:$password}}')

AUTH_RESULT=$(aws cognito-idp initiate-auth \
  --cli-input-json "$AUTH_INPUT" \
  --region "$AWS_REGION" \
  --output json 2>&1) || fail "Cognito auth failed: $AUTH_RESULT"

TOKEN=$(echo "$AUTH_RESULT" | jq -r '.AuthenticationResult.AccessToken')
ID_TOKEN=$(echo "$AUTH_RESULT" | jq -r '.AuthenticationResult.IdToken')

[ "$TOKEN" = "null" ] && fail "No access token returned"
ok "Authenticated"

# Extract tenant_id from ID token
JWT_B64=$(echo "$ID_TOKEN" | cut -d. -f2 | tr '_-' '/+')
JWT_PAD=$((4 - ${#JWT_B64} % 4))
[ "$JWT_PAD" -lt 4 ] && JWT_B64="${JWT_B64}$(printf '=%.0s' $(seq 1 $JWT_PAD))"
JWT_PAYLOAD=$(echo "$JWT_B64" | base64 -d 2>/dev/null || echo "$JWT_B64" | base64 -D 2>/dev/null || echo "{}")
PLATFORM_TENANT_ID=$(echo "$JWT_PAYLOAD" | jq -r '.["custom:tenant_id"] // empty' 2>/dev/null)
ok "Platform tenant: ${PLATFORM_TENANT_ID:-default}"

# ============================================================
# Helper: API call function
# ============================================================
api() {
  local method="$1"
  local path="$2"
  local tenant_override="${CURRENT_TENANT_ID:-$PLATFORM_TENANT_ID}"
  shift 2
  local url="${API_BASE_URL}${path}"
  local headers=(-H "Authorization: Bearer $ID_TOKEN" -H "Content-Type: application/json")
  [ -n "$tenant_override" ] && headers+=(-H "X-Tenant-Id: $tenant_override")

  local response
  response=$(curl -s -w "\n%{http_code}" "${headers[@]}" -X "$method" "$url" "$@")
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
# Step 2: Create the uThukela Water tenant
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

# Use "platform" context for tenant creation — the uthukela tenant
# doesn't exist in DynamoDB yet, so X-Tenant-Id: uthukela would be rejected.
CURRENT_TENANT_ID="platform"
TENANT_RESULT=$(api_post "/api/admin/tenants" -d "$CREATE_TENANT_BODY" 2>&1) || {
  warn "Tenant creation returned an error — will try to resolve existing tenant..."
}
unset CURRENT_TENANT_ID

UTHUKELA_TENANT_ID=$(echo "$TENANT_RESULT" | jq -r '.id // empty' 2>/dev/null)
if [ -n "$UTHUKELA_TENANT_ID" ]; then
  ok "Tenant created with ID: $UTHUKELA_TENANT_ID"
else
  # Try to resolve existing tenant via public endpoint
  log "Attempting to resolve existing tenant '${TENANT_SUBDOMAIN}'..."
  RESOLVE_RESULT=$(api_get "/api/public/tenants/resolve/${TENANT_SUBDOMAIN}" 2>&1) || true
  UTHUKELA_TENANT_ID=$(echo "$RESOLVE_RESULT" | jq -r '.id // empty' 2>/dev/null)

  if [ -z "$UTHUKELA_TENANT_ID" ]; then
    # Try authenticated tenant list as fallback
    TENANTS_RESULT=$(api_get "/api/admin/tenants" 2>&1) || true
    UTHUKELA_TENANT_ID=$(echo "$TENANTS_RESULT" | jq -r --arg sub "$TENANT_SUBDOMAIN" \
      '.[] | select(.subdomain == $sub) | .id // empty' 2>/dev/null | head -1)
  fi

  [ -n "$UTHUKELA_TENANT_ID" ] && ok "Resolved existing tenant: $UTHUKELA_TENANT_ID"
fi

[ -z "$UTHUKELA_TENANT_ID" ] && fail "Could not determine tenant ID — check if /api/admin/tenants endpoint is working"

# Switch API calls to the new tenant context
CURRENT_TENANT_ID="$UTHUKELA_TENANT_ID"

# ============================================================
# Step 3: Create Cognito users for the tenant
# ============================================================
log "Creating Cognito demo users..."

create_cognito_user() {
  local email="$1" role="$2" first="$3" last="$4"

  # Create user
  aws cognito-idp admin-create-user \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$email" \
    --user-attributes \
      Name=email,Value="$email" \
      Name=email_verified,Value=true \
      Name=given_name,Value="$first" \
      Name=family_name,Value="$last" \
      Name=custom:tenant_id,Value="$UTHUKELA_TENANT_ID" \
    --temporary-password "$TENANT_ADMIN_PASSWORD" \
    --message-action SUPPRESS \
    --region "$AWS_REGION" 2>/dev/null && ok "Created user $email" || warn "User $email may already exist"

  # Set permanent password
  aws cognito-idp admin-set-user-password \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$email" \
    --password "$TENANT_ADMIN_PASSWORD" \
    --permanent \
    --region "$AWS_REGION" 2>/dev/null || true

  # Add to role group
  aws cognito-idp admin-add-user-to-group \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$email" \
    --group-name "$role" \
    --region "$AWS_REGION" 2>/dev/null || warn "Could not add $email to group $role"
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
# Step 4: Re-authenticate as the new tenant admin
# ============================================================
log "Re-authenticating as uThukela admin..."

AUTH_INPUT=$(jq -n \
  --arg clientId "$COGNITO_CLIENT_ID" \
  --arg username "$TENANT_ADMIN_EMAIL" \
  --arg password "$TENANT_ADMIN_PASSWORD" \
  '{ClientId:$clientId, AuthFlow:"USER_PASSWORD_AUTH", AuthParameters:{USERNAME:$username, PASSWORD:$password}}')

AUTH_RESULT=$(aws cognito-idp initiate-auth \
  --cli-input-json "$AUTH_INPUT" \
  --region "$AWS_REGION" \
  --output json 2>&1) || fail "Cognito auth as tenant admin failed: $AUTH_RESULT"

TOKEN=$(echo "$AUTH_RESULT" | jq -r '.AuthenticationResult.AccessToken')
ID_TOKEN=$(echo "$AUTH_RESULT" | jq -r '.AuthenticationResult.IdToken')
[ "$TOKEN" = "null" ] && fail "No access token returned for tenant admin"
ok "Authenticated as tenant admin"

# ============================================================
# Step 5: Create departments
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
# Step 6: Create job postings
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
      experienceLevel: $expLevel,
      description: $description,
      requirements: $requirements,
      responsibilities: $responsibilities,
      qualifications: $qualifications,
      benefits: $benefits,
      salaryMin: $salaryMin,
      salaryMax: $salaryMax,
      salaryCurrency: "ZAR",
      closingDate: "2026-06-30",
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
  "MID" \
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
  "ENTRY" \
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
  "MID" \
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

# ============================================================
# Done
# ============================================================
echo ""
log "============================================================"
log "  uThukela Water tenant setup complete!"
log "============================================================"
echo ""
log "Tenant:     ${TENANT_NAME}"
log "Subdomain:  ${TENANT_SUBDOMAIN}"
log "Tenant ID:  ${UTHUKELA_TENANT_ID}"
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
log "Access: https://uthukela.shumelahire.co.za"
log "============================================================"
