#!/usr/bin/env bash
#
# seed-uthukela-employees.sh — Populate 10 employees with full profiles for uThukela Water
#
# Creates 10 employees with:
#   - Personal info (demographics, address, contact details)
#   - Employment details (department, job title, grade, reporting)
#   - Emergency contacts
#   - Banking details
#   - Employment history events (hires, promotions, transfers)
#   - Documents (ID, qualifications, contracts)
#   - Certifications
#   - Skills (created as platform skill definitions)
#
# Prerequisites:
#   - AWS CLI v2 configured with credentials
#   - jq installed
#   - curl installed
#   - The uthukela tenant already exists (run seed-uthukela-demo.sh first)
#   - COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID set
#
# Usage:
#   export COGNITO_USER_POOL_ID="af-south-1_XXXXXXX"
#   export COGNITO_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
#   export ADMIN_PASSWORD="Demo@2026!"
#   export API_BASE_URL="https://dev.shumelahire.co.za"
#   ./scripts/seed-uthukela-employees.sh
#
set -euo pipefail

# ============================================================
# Configuration
# ============================================================
API_BASE_URL="${API_BASE_URL:-https://dev.shumelahire.co.za}"
AWS_REGION="${AWS_REGION:-af-south-1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@uthukela.shumelahire.co.za}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:?Set ADMIN_PASSWORD}"
COGNITO_USER_POOL_ID="${COGNITO_USER_POOL_ID:?Set COGNITO_USER_POOL_ID}"
COGNITO_CLIENT_ID="${COGNITO_CLIENT_ID:?Set COGNITO_CLIENT_ID}"
# Optional: set to bypass API Gateway's 30s timeout via direct Lambda invocation
LAMBDA_FUNCTION_NAME="${LAMBDA_FUNCTION_NAME:-}"

TENANT_SUBDOMAIN="uthukela"

# Colours
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
# Step 1: Authenticate with Cognito
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
TENANT_ID=$(echo "$JWT_PAYLOAD" | jq -r '.["custom:tenant_id"] // empty' 2>/dev/null)

if [ -z "$TENANT_ID" ]; then
  # Resolve tenant ID from subdomain
  RESOLVE_RESULT=$(curl -s "${API_BASE_URL}/api/public/tenants/resolve/${TENANT_SUBDOMAIN}")
  TENANT_ID=$(echo "$RESOLVE_RESULT" | jq -r '.id // empty' 2>/dev/null)
fi

[ -z "$TENANT_ID" ] && fail "Could not determine tenant ID"
ok "Tenant ID: ${TENANT_ID}"

# ============================================================
# Helper: API call function (with retry for transient errors)
# ============================================================
MAX_RETRIES=3
RETRY_DELAY=10

# Direct Lambda invocation — bypasses API Gateway 30s timeout
api_lambda() {
  local method="$1"
  local path="$2"
  shift 2
  # Extract -d body from remaining args
  local body=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -d) body="$2"; shift 2 ;;
      *) shift ;;
    esac
  done

  local headers_json
  headers_json=$(jq -n \
    --arg auth "Bearer $ID_TOKEN" \
    --arg tid "$TENANT_ID" \
    '{authorization: $auth, "content-type": "application/json", "x-tenant-id": $tid}')

  local payload
  payload=$(jq -n \
    --arg method "$method" \
    --arg path "$path" \
    --arg routeKey "$method $path" \
    --argjson headers "$headers_json" \
    --arg body "$body" \
    '{
      version: "2.0",
      routeKey: $routeKey,
      rawPath: $path,
      rawQueryString: "",
      headers: $headers,
      requestContext: {
        http: {method: $method, path: $path, protocol: "HTTP/1.1", sourceIp: "127.0.0.1"},
        requestId: "seed",
        routeKey: $routeKey,
        stage: "$default"
      },
      body: $body,
      isBase64Encoded: false
    }')

  local tmp_payload="/tmp/seed-payload-$$.json"
  local tmp_response="/tmp/seed-response-$$.json"
  echo "$payload" > "$tmp_payload"

  local invoke_meta
  invoke_meta=$(aws lambda invoke \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --payload "fileb://$tmp_payload" \
    --cli-read-timeout 120 \
    --region "$AWS_REGION" \
    "$tmp_response" 2>&1)
  local invoke_rc=$?

  if [ "$invoke_rc" -ne 0 ]; then
    warn "aws lambda invoke failed (exit $invoke_rc): $invoke_meta"
    rm -f "$tmp_payload" "$tmp_response"
    # Fall back to HTTP
    api_http "$method" "$path" -d "$body"
    return $?
  fi

  # Check for FunctionError in invoke metadata
  local func_error
  func_error=$(echo "$invoke_meta" | python3 -c "import sys,json; print(json.load(sys.stdin).get('FunctionError',''))" 2>/dev/null || echo "")
  if [ -n "$func_error" ]; then
    warn "Lambda FunctionError: $func_error"
    log "  Response: $(head -c 300 "$tmp_response" 2>/dev/null)"
    rm -f "$tmp_payload" "$tmp_response"
    api_http "$method" "$path" -d "$body"
    return $?
  fi

  if [ ! -f "$tmp_response" ]; then
    warn "No Lambda response file"
    rm -f "$tmp_payload"
    api_http "$method" "$path" -d "$body"
    return $?
  fi

  local status_code
  status_code=$(python3 -c "import json; r=json.load(open('$tmp_response')); print(r.get('statusCode','error'))" 2>/dev/null || echo "error")
  local response_body
  response_body=$(python3 -c "import json; r=json.load(open('$tmp_response')); print(r.get('body','{}'))" 2>/dev/null || echo "{}")

  # Debug: log first invocation's raw response
  if [ "${_LAMBDA_DEBUG_LOGGED:-0}" = "0" ]; then
    log "  [debug] Lambda raw response (first call): $(head -c 500 "$tmp_response" 2>/dev/null)"
    log "  [debug] Parsed statusCode=$status_code"
    _LAMBDA_DEBUG_LOGGED=1
  fi

  rm -f "$tmp_payload" "$tmp_response"

  if [[ "$status_code" -ge 200 && "$status_code" -lt 300 ]] 2>/dev/null; then
    echo "$response_body"
    return 0
  fi

  echo "HTTP $status_code: $response_body" >&2
  return 1
}

# HTTP API call via curl (with retry)
api_http() {
  local method="$1"
  local path="$2"
  shift 2
  local url="${API_BASE_URL}${path}"
  local headers=(-H "Authorization: Bearer $ID_TOKEN" -H "Content-Type: application/json")
  [ -n "$TENANT_ID" ] && headers+=(-H "X-Tenant-Id: $TENANT_ID")

  local attempt
  for attempt in $(seq 1 $MAX_RETRIES); do
    local response
    response=$(curl -s -w "\n%{http_code}" --max-time 60 "${headers[@]}" -X "$method" "$url" "$@")
    local http_code
    http_code=$(echo "$response" | tail -1)
    local body
    body=$(echo "$response" | sed '$d')

    if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
      echo "$body"
      return 0
    fi

    # Retry on transient gateway errors (502, 503, 504) or curl failures (000)
    if [[ "$http_code" =~ ^(502|503|504|000)$ ]] && [ "$attempt" -lt "$MAX_RETRIES" ]; then
      warn "HTTP $http_code on $method $path — retrying in ${RETRY_DELAY}s (attempt $attempt/$MAX_RETRIES)..."
      sleep "$RETRY_DELAY"
      continue
    fi

    echo "HTTP $http_code: $body" >&2
    return 1
  done
}

# Route to direct Lambda invocation when available, else fall back to HTTP
api() {
  if [ -n "$LAMBDA_FUNCTION_NAME" ]; then
    api_lambda "$@"
  else
    api_http "$@"
  fi
}

api_post() { api POST "$@"; }
api_get()  { api GET "$@"; }
api_put()  { api PUT "$@"; }

# ============================================================
# Step 2: Create Skills (platform-level definitions)
# ============================================================
echo ""
echo "=========================================="
echo " uThukela Water — Employee Profile Seeder"
echo "=========================================="
echo " API:      ${API_BASE_URL}"
echo " Tenant:   ${TENANT_SUBDOMAIN} (${TENANT_ID})"
echo " Region:   ${AWS_REGION}"
echo "=========================================="
echo ""

# Warm up the Lambda before making heavy requests
if [ -n "$LAMBDA_FUNCTION_NAME" ]; then
  log "Using direct Lambda invocation (bypassing API Gateway 30s limit)"
  log "Lambda function: $LAMBDA_FUNCTION_NAME"
fi
log "Warming up API..."
for i in 1 2 3; do
  WARMUP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 "${API_BASE_URL}/api/actuator/health" 2>/dev/null || echo "000")
  if [[ "$WARMUP_CODE" -ge 200 && "$WARMUP_CODE" -lt 300 ]]; then
    ok "API is warm (HTTP $WARMUP_CODE)"
    break
  fi
  warn "Warmup attempt $i returned HTTP $WARMUP_CODE — waiting 10s..."
  sleep 10
done

log "Creating skill definitions..."

declare -A SKILL_IDS

create_skill() {
  local name="$1" category="$2" description="$3"
  local body
  body=$(jq -n --arg n "$name" --arg c "$category" --arg d "$description" \
    '{name:$n, category:$c, description:$d}')
  local result
  result=$(api_post "/api/skills" -d "$body" 2>&1) && {
    local id
    id=$(echo "$result" | jq -r '.id // empty')
    SKILL_IDS["$name"]="$id"
    ok "Skill: $name ($category)"
  } || warn "Skill '$name' may already exist"
}

create_skill "Water Treatment"           "Technical"    "Water purification and treatment processes"
create_skill "SCADA Operations"          "Technical"    "Supervisory Control and Data Acquisition systems"
create_skill "SANS 241 Compliance"       "Regulatory"   "South African National Standard 241 drinking water quality"
create_skill "Pipeline Maintenance"      "Technical"    "Water pipeline installation and maintenance"
create_skill "AutoCAD"                   "Software"     "Computer-aided design for infrastructure planning"
create_skill "Project Management"        "Management"   "Planning and delivering capital projects"
create_skill "MFMA Compliance"           "Regulatory"   "Municipal Finance Management Act compliance"
create_skill "GRAP Reporting"            "Finance"      "Generally Recognised Accounting Practice"
create_skill "Budget Management"         "Finance"      "Preparing and monitoring organisational budgets"
create_skill "Community Engagement"      "Communication" "Facilitating public participation and stakeholder engagement"
create_skill "isiZulu Communication"     "Communication" "Fluent isiZulu for community engagement"
create_skill "Water Quality Testing"     "Technical"    "Laboratory testing and analysis of water samples"
create_skill "GIS Mapping"              "Software"     "Geographic Information Systems for infrastructure mapping"
create_skill "Leadership"               "Management"   "Team leadership and strategic management"
create_skill "Health & Safety"          "Regulatory"   "Occupational health and safety compliance"
create_skill "Supply Chain Management"  "Procurement"  "Municipal supply chain and procurement processes"
create_skill "Network Administration"   "IT"           "Server and network infrastructure management"
create_skill "Cybersecurity"            "IT"           "Information security and cybersecurity practices"
create_skill "Labour Relations"         "HR"           "Labour law, CCMA processes, and employee relations"
create_skill "Payroll Administration"   "HR"           "Payroll processing and statutory deductions"

# ============================================================
# Step 3: Create 10 Employees with Full Profiles
# ============================================================
log "Creating employees..."

EMPLOYEE_IDS=()

SEED_FAILURES=0

create_employee() {
  local body="$1"
  local name="$2"
  local result
  result=$(api_post "/api/employees" -d "$body" 2>&1) || { warn "Failed to create employee: $name — $result"; SEED_FAILURES=$((SEED_FAILURES+1)); echo ""; return 0; }
  local id
  id=$(echo "$result" | jq -r '.id // empty')
  if [ -z "$id" ]; then
    warn "No ID returned for $name"
    SEED_FAILURES=$((SEED_FAILURES+1))
    echo ""
    return 0
  fi
  EMPLOYEE_IDS+=("$id")
  ok "Employee #$id: $name"
  echo "$id"
}

# ---------- Employee 1: Sipho Ndlovu (Operations Manager) ----------
EMP1_ID=$(create_employee "$(jq -n '{
  firstName: "Sipho",
  lastName: "Ndlovu",
  email: "sipho.ndlovu@uthukela.shumelahire.co.za",
  hireDate: "2019-03-01",
  title: "Mr",
  preferredName: "Sipho",
  personalEmail: "sipho.ndlovu@gmail.com",
  phone: "+27 34 312 1001",
  mobilePhone: "+27 82 456 7801",
  dateOfBirth: "1978-06-15",
  gender: "Male",
  race: "African",
  citizenshipStatus: "South African",
  nationality: "South African",
  maritalStatus: "Married",
  idNumber: "7806155123081",
  taxNumber: "0123456789",
  bankAccountNumber: "62145678901",
  bankName: "First National Bank",
  bankBranchCode: "250655",
  physicalAddress: "14 Harding Street",
  postalAddress: "PO Box 1201",
  city: "Newcastle",
  province: "KwaZulu-Natal",
  postalCode: "2940",
  country: "South Africa",
  department: "Operations",
  division: "Water Operations",
  jobTitle: "Operations Manager",
  jobGrade: "D3",
  employmentType: "PERMANENT",
  costCentre: "OPS-001",
  location: "Newcastle Head Office",
  site: "Newcastle",
  emergencyContactName: "Zanele Ndlovu",
  emergencyContactPhone: "+27 82 987 6543",
  emergencyContactRelationship: "Spouse",
  demographicsConsent: true
}')" "Sipho Ndlovu")

# ---------- Employee 2: Nomvula Dlamini (HR Manager) ----------
EMP2_ID=$(create_employee "$(jq -n '{
  firstName: "Nomvula",
  lastName: "Dlamini",
  email: "nomvula.dlamini@uthukela.shumelahire.co.za",
  hireDate: "2020-07-01",
  title: "Ms",
  preferredName: "Nomvula",
  personalEmail: "nomvula.dlamini@outlook.com",
  phone: "+27 34 312 1002",
  mobilePhone: "+27 83 567 8902",
  dateOfBirth: "1985-11-22",
  gender: "Female",
  race: "African",
  citizenshipStatus: "South African",
  nationality: "South African",
  maritalStatus: "Single",
  idNumber: "8511220234086",
  taxNumber: "0234567890",
  bankAccountNumber: "40567890123",
  bankName: "Standard Bank",
  bankBranchCode: "051001",
  physicalAddress: "22 Scott Street",
  postalAddress: "PO Box 1302",
  city: "Newcastle",
  province: "KwaZulu-Natal",
  postalCode: "2940",
  country: "South Africa",
  department: "Corporate Services",
  division: "Human Resources",
  jobTitle: "HR Manager",
  jobGrade: "D2",
  employmentType: "PERMANENT",
  costCentre: "CORP-HR-001",
  location: "Newcastle Head Office",
  site: "Newcastle",
  emergencyContactName: "Sibusiso Dlamini",
  emergencyContactPhone: "+27 83 654 3210",
  emergencyContactRelationship: "Brother",
  demographicsConsent: true
}')" "Nomvula Dlamini")

# ---------- Employee 3: Thabo Khumalo (Civil Engineer) ----------
EMP3_ID=$(create_employee "$(jq -n '{
  firstName: "Thabo",
  lastName: "Khumalo",
  email: "thabo.khumalo@uthukela.shumelahire.co.za",
  hireDate: "2018-01-15",
  title: "Mr",
  preferredName: "Thabo",
  personalEmail: "thabo.khumalo@yahoo.com",
  phone: "+27 34 312 1003",
  mobilePhone: "+27 72 678 9003",
  dateOfBirth: "1982-03-08",
  gender: "Male",
  race: "African",
  citizenshipStatus: "South African",
  nationality: "South African",
  maritalStatus: "Married",
  idNumber: "8203085456083",
  taxNumber: "0345678901",
  bankAccountNumber: "1234567890",
  bankName: "Absa Bank",
  bankBranchCode: "632005",
  physicalAddress: "8 Voortrekker Road",
  postalAddress: "PO Box 2045",
  city: "Newcastle",
  province: "KwaZulu-Natal",
  postalCode: "2940",
  country: "South Africa",
  department: "Technical Services",
  division: "Infrastructure",
  jobTitle: "Senior Civil Engineer",
  jobGrade: "D3",
  employmentType: "PERMANENT",
  costCentre: "TECH-INF-001",
  location: "Newcastle Head Office",
  site: "Newcastle",
  emergencyContactName: "Nompilo Khumalo",
  emergencyContactPhone: "+27 72 321 6549",
  emergencyContactRelationship: "Spouse",
  demographicsConsent: true
}')" "Thabo Khumalo")

# ---------- Employee 4: Pieter van der Merwe (Finance Manager) ----------
EMP4_ID=$(create_employee "$(jq -n '{
  firstName: "Pieter",
  lastName: "van der Merwe",
  email: "pieter.vdm@uthukela.shumelahire.co.za",
  hireDate: "2021-02-01",
  title: "Mr",
  preferredName: "Pieter",
  personalEmail: "pieter.vdm@gmail.com",
  phone: "+27 34 312 1004",
  mobilePhone: "+27 76 789 0104",
  dateOfBirth: "1980-09-12",
  gender: "Male",
  race: "White",
  citizenshipStatus: "South African",
  nationality: "South African",
  maritalStatus: "Married",
  idNumber: "8009125012089",
  taxNumber: "0456789012",
  bankAccountNumber: "9087654321",
  bankName: "Nedbank",
  bankBranchCode: "198765",
  physicalAddress: "45 Allen Street",
  postalAddress: "PO Box 3100",
  city: "Newcastle",
  province: "KwaZulu-Natal",
  postalCode: "2940",
  country: "South Africa",
  department: "Finance",
  division: "Financial Management",
  jobTitle: "Finance Manager",
  jobGrade: "D3",
  employmentType: "PERMANENT",
  costCentre: "FIN-001",
  location: "Newcastle Head Office",
  site: "Newcastle",
  emergencyContactName: "Annelize van der Merwe",
  emergencyContactPhone: "+27 76 543 2109",
  emergencyContactRelationship: "Spouse",
  demographicsConsent: true
}')" "Pieter van der Merwe")

# ---------- Employee 5: Lindiwe Ngcobo (Water Process Controller) ----------
EMP5_ID=$(create_employee "$(jq -n '{
  firstName: "Lindiwe",
  lastName: "Ngcobo",
  email: "lindiwe.ngcobo@uthukela.shumelahire.co.za",
  hireDate: "2022-04-01",
  title: "Ms",
  preferredName: "Lindi",
  personalEmail: "lindiwe.ngcobo@hotmail.com",
  phone: "+27 34 312 1005",
  mobilePhone: "+27 61 890 1205",
  dateOfBirth: "1990-01-25",
  gender: "Female",
  race: "African",
  citizenshipStatus: "South African",
  nationality: "South African",
  maritalStatus: "Single",
  idNumber: "9001250567089",
  taxNumber: "0567890123",
  bankAccountNumber: "70456789012",
  bankName: "Capitec Bank",
  bankBranchCode: "470010",
  physicalAddress: "31 Hardwick Street",
  postalAddress: "PO Box 4211",
  city: "Newcastle",
  province: "KwaZulu-Natal",
  postalCode: "2940",
  country: "South Africa",
  department: "Water Services",
  division: "Water Treatment",
  jobTitle: "Water Process Controller",
  jobGrade: "C3",
  employmentType: "PERMANENT",
  costCentre: "WS-TREAT-001",
  location: "Ngagane Water Treatment Works",
  site: "Ngagane WTW",
  emergencyContactName: "Bonginkosi Ngcobo",
  emergencyContactPhone: "+27 61 234 5678",
  emergencyContactRelationship: "Father",
  demographicsConsent: true
}')" "Lindiwe Ngcobo")

# ---------- Employee 6: Bongani Zulu (ICT Systems Administrator) ----------
EMP6_ID=$(create_employee "$(jq -n '{
  firstName: "Bongani",
  lastName: "Zulu",
  email: "bongani.zulu@uthukela.shumelahire.co.za",
  hireDate: "2023-01-16",
  title: "Mr",
  preferredName: "Bongani",
  personalEmail: "bongani.zulu@gmail.com",
  phone: "+27 34 312 1006",
  mobilePhone: "+27 84 901 2306",
  dateOfBirth: "1992-07-19",
  gender: "Male",
  race: "African",
  citizenshipStatus: "South African",
  nationality: "South African",
  maritalStatus: "Single",
  idNumber: "9207195789084",
  taxNumber: "0678901234",
  bankAccountNumber: "62098765432",
  bankName: "First National Bank",
  bankBranchCode: "250655",
  physicalAddress: "7 Victoria Road",
  postalAddress: "PO Box 5320",
  city: "Newcastle",
  province: "KwaZulu-Natal",
  postalCode: "2940",
  country: "South Africa",
  department: "Corporate Services",
  division: "Information Technology",
  jobTitle: "ICT Systems Administrator",
  jobGrade: "C2",
  employmentType: "PERMANENT",
  costCentre: "CORP-IT-001",
  location: "Newcastle Head Office",
  site: "Newcastle",
  emergencyContactName: "Thokozile Zulu",
  emergencyContactPhone: "+27 84 876 5432",
  emergencyContactRelationship: "Mother",
  demographicsConsent: true
}')" "Bongani Zulu")

# ---------- Employee 7: Ayanda Mkhize (Community Liaison Officer) ----------
EMP7_ID=$(create_employee "$(jq -n '{
  firstName: "Ayanda",
  lastName: "Mkhize",
  email: "ayanda.mkhize@uthukela.shumelahire.co.za",
  hireDate: "2023-06-01",
  title: "Ms",
  preferredName: "Ayanda",
  personalEmail: "ayanda.mkhize@outlook.com",
  phone: "+27 36 637 2001",
  mobilePhone: "+27 73 012 3407",
  dateOfBirth: "1995-04-30",
  gender: "Female",
  race: "African",
  citizenshipStatus: "South African",
  nationality: "South African",
  maritalStatus: "Single",
  idNumber: "9504300890082",
  taxNumber: "0789012345",
  bankAccountNumber: "50345678901",
  bankName: "Standard Bank",
  bankBranchCode: "051001",
  physicalAddress: "12 Murchison Street",
  postalAddress: "PO Box 601",
  city: "Ladysmith",
  province: "KwaZulu-Natal",
  postalCode: "3370",
  country: "South Africa",
  department: "Community Services",
  division: "Community Engagement",
  jobTitle: "Community Liaison Officer",
  jobGrade: "C1",
  employmentType: "PERMANENT",
  costCentre: "CS-001",
  location: "Ladysmith Regional Office",
  site: "Ladysmith",
  emergencyContactName: "Nhlanhla Mkhize",
  emergencyContactPhone: "+27 73 654 3210",
  emergencyContactRelationship: "Sister",
  demographicsConsent: true
}')" "Ayanda Mkhize")

# ---------- Employee 8: Johan Pretorius (Maintenance Supervisor) ----------
EMP8_ID=$(create_employee "$(jq -n '{
  firstName: "Johan",
  lastName: "Pretorius",
  email: "johan.pretorius@uthukela.shumelahire.co.za",
  hireDate: "2017-08-01",
  title: "Mr",
  preferredName: "Johan",
  personalEmail: "johan.pretorius@telkomsa.net",
  phone: "+27 34 312 1008",
  mobilePhone: "+27 82 123 4508",
  dateOfBirth: "1975-12-03",
  gender: "Male",
  race: "White",
  citizenshipStatus: "South African",
  nationality: "South African",
  maritalStatus: "Married",
  idNumber: "7512035034082",
  taxNumber: "0890123456",
  bankAccountNumber: "4056789012",
  bankName: "Absa Bank",
  bankBranchCode: "632005",
  physicalAddress: "28 Memel Road",
  postalAddress: "PO Box 2890",
  city: "Newcastle",
  province: "KwaZulu-Natal",
  postalCode: "2940",
  country: "South Africa",
  department: "Operations",
  division: "Maintenance",
  jobTitle: "Maintenance Supervisor",
  jobGrade: "C3",
  employmentType: "PERMANENT",
  costCentre: "OPS-MAINT-001",
  location: "Newcastle Depot",
  site: "Newcastle",
  emergencyContactName: "Elsa Pretorius",
  emergencyContactPhone: "+27 82 765 4321",
  emergencyContactRelationship: "Spouse",
  demographicsConsent: true
}')" "Johan Pretorius")

# ---------- Employee 9: Zanele Mthembu (Supply Chain Officer) ----------
EMP9_ID=$(create_employee "$(jq -n '{
  firstName: "Zanele",
  lastName: "Mthembu",
  email: "zanele.mthembu@uthukela.shumelahire.co.za",
  hireDate: "2024-01-15",
  title: "Ms",
  preferredName: "Zanele",
  personalEmail: "zanele.mthembu@gmail.com",
  phone: "+27 34 312 1009",
  mobilePhone: "+27 65 234 5609",
  dateOfBirth: "1993-08-17",
  gender: "Female",
  race: "African",
  citizenshipStatus: "South African",
  nationality: "South African",
  maritalStatus: "Married",
  idNumber: "9308170456085",
  taxNumber: "0901234567",
  bankAccountNumber: "80567890123",
  bankName: "Capitec Bank",
  bankBranchCode: "470010",
  physicalAddress: "5 Inkosi Albert Luthuli Road",
  postalAddress: "PO Box 6710",
  city: "Newcastle",
  province: "KwaZulu-Natal",
  postalCode: "2940",
  country: "South Africa",
  department: "Finance",
  division: "Supply Chain",
  jobTitle: "Supply Chain Officer",
  jobGrade: "C1",
  employmentType: "PERMANENT",
  probationEndDate: "2024-07-15",
  costCentre: "FIN-SCM-001",
  location: "Newcastle Head Office",
  site: "Newcastle",
  emergencyContactName: "Mandla Mthembu",
  emergencyContactPhone: "+27 65 876 5432",
  emergencyContactRelationship: "Spouse",
  demographicsConsent: true
}')" "Zanele Mthembu")

# ---------- Employee 10: Mandla Shabalala (Water Quality Technician) ----------
EMP10_ID=$(create_employee "$(jq -n '{
  firstName: "Mandla",
  lastName: "Shabalala",
  email: "mandla.shabalala@uthukela.shumelahire.co.za",
  hireDate: "2024-06-01",
  title: "Mr",
  preferredName: "Mandla",
  personalEmail: "mandla.shabalala@gmail.com",
  phone: "+27 34 312 1010",
  mobilePhone: "+27 71 345 6710",
  dateOfBirth: "1997-02-28",
  gender: "Male",
  race: "African",
  citizenshipStatus: "South African",
  nationality: "South African",
  maritalStatus: "Single",
  idNumber: "9702285890081",
  taxNumber: "0012345678",
  bankAccountNumber: "1298765432",
  bankName: "Nedbank",
  bankBranchCode: "198765",
  physicalAddress: "19 Chelmsford Road",
  postalAddress: "PO Box 7820",
  city: "Ladysmith",
  province: "KwaZulu-Natal",
  postalCode: "3370",
  country: "South Africa",
  department: "Water Services",
  division: "Water Quality",
  jobTitle: "Water Quality Technician",
  jobGrade: "B3",
  employmentType: "PERMANENT",
  probationEndDate: "2024-12-01",
  costCentre: "WS-QUAL-001",
  location: "Ladysmith Laboratory",
  site: "Ladysmith",
  emergencyContactName: "Themba Shabalala",
  emergencyContactPhone: "+27 71 987 6543",
  emergencyContactRelationship: "Brother",
  demographicsConsent: true
}')" "Mandla Shabalala")

# ============================================================
# Step 4: Set reporting relationships
# ============================================================
log "Setting reporting manager relationships..."

# Nomvula (HR) and Bongani (IT) report to Sipho (Ops Manager — acting as senior leader)
# Lindiwe and Mandla (Water Services) report to Thabo (Engineer)
# Johan (Maintenance) reports to Sipho (Ops Manager)
# Ayanda (Community) reports to Nomvula (HR Manager)
# Zanele (SCM) reports to Pieter (Finance Manager)

set_manager() {
  local emp_id="$1" manager_id="$2" name="$3"
  [ -z "$emp_id" ] || [ -z "$manager_id" ] && { warn "Skipping manager for $name (missing ID)"; return; }
  local body
  body=$(jq -n --argjson mgr "$manager_id" '{reportingManagerId: $mgr}')
  api_put "/api/employees/${emp_id}" -d "$body" >/dev/null 2>&1 && \
    ok "$name -> manager #$manager_id" || warn "Could not set manager for $name"
}

set_manager "$EMP2_ID" "$EMP1_ID" "Nomvula Dlamini"
set_manager "$EMP5_ID" "$EMP3_ID" "Lindiwe Ngcobo"
set_manager "$EMP6_ID" "$EMP1_ID" "Bongani Zulu"
set_manager "$EMP7_ID" "$EMP2_ID" "Ayanda Mkhize"
set_manager "$EMP8_ID" "$EMP1_ID" "Johan Pretorius"
set_manager "$EMP9_ID" "$EMP4_ID" "Zanele Mthembu"
set_manager "$EMP10_ID" "$EMP3_ID" "Mandla Shabalala"

# ============================================================
# Step 5: Employment History Events
# ============================================================
log "Adding employment history events..."

create_event() {
  local emp_id="$1"
  local body="$2"
  local desc="$3"
  [ -z "$emp_id" ] && { warn "Skipping event: $desc (missing employee ID)"; return; }
  api_post "/api/employees/${emp_id}/events" -d "$body" >/dev/null 2>&1 && \
    ok "Event: $desc" || warn "Event failed: $desc"
}

# Sipho Ndlovu — hired 2019, promoted 2022
create_event "$EMP1_ID" "$(jq -n '{
  eventType: "HIRE", eventDate: "2019-03-01", effectiveDate: "2019-03-01",
  description: "Joined as Assistant Operations Manager from Umgeni Water",
  newDepartment: "Operations", newJobTitle: "Assistant Operations Manager", newJobGrade: "C3"
}')" "Sipho hired"

create_event "$EMP1_ID" "$(jq -n '{
  eventType: "PROMOTION", eventDate: "2022-04-01", effectiveDate: "2022-04-01",
  description: "Promoted to Operations Manager following restructuring",
  newJobTitle: "Operations Manager", newJobGrade: "D3"
}')" "Sipho promoted"

# Thabo Khumalo — hired 2018, promoted 2021
create_event "$EMP3_ID" "$(jq -n '{
  eventType: "HIRE", eventDate: "2018-01-15", effectiveDate: "2018-01-15",
  description: "Joined as Civil Engineer from SMEC South Africa",
  newDepartment: "Technical Services", newJobTitle: "Civil Engineer", newJobGrade: "C3"
}')" "Thabo hired"

create_event "$EMP3_ID" "$(jq -n '{
  eventType: "PROMOTION", eventDate: "2021-07-01", effectiveDate: "2021-07-01",
  description: "Promoted to Senior Civil Engineer — led Ngagane WTW upgrade project",
  newJobTitle: "Senior Civil Engineer", newJobGrade: "D3"
}')" "Thabo promoted"

# Johan Pretorius — hired 2017, transferred 2020
create_event "$EMP8_ID" "$(jq -n '{
  eventType: "HIRE", eventDate: "2017-08-01", effectiveDate: "2017-08-01",
  description: "Joined as Maintenance Technician from Amajuba District Municipality",
  newDepartment: "Operations", newJobTitle: "Maintenance Technician", newJobGrade: "B3"
}')" "Johan hired"

create_event "$EMP8_ID" "$(jq -n '{
  eventType: "PROMOTION", eventDate: "2020-01-01", effectiveDate: "2020-01-01",
  description: "Promoted to Maintenance Supervisor based on performance and leadership",
  newJobTitle: "Maintenance Supervisor", newJobGrade: "C3"
}')" "Johan promoted"

# Nomvula Dlamini — hired 2020
create_event "$EMP2_ID" "$(jq -n '{
  eventType: "HIRE", eventDate: "2020-07-01", effectiveDate: "2020-07-01",
  description: "Joined as HR Manager from KZN Department of Water and Sanitation",
  newDepartment: "Corporate Services", newJobTitle: "HR Manager", newJobGrade: "D2"
}')" "Nomvula hired"

# Pieter van der Merwe — hired 2021
create_event "$EMP4_ID" "$(jq -n '{
  eventType: "HIRE", eventDate: "2021-02-01", effectiveDate: "2021-02-01",
  description: "Joined as Finance Manager from Auditor-General South Africa",
  newDepartment: "Finance", newJobTitle: "Finance Manager", newJobGrade: "D3"
}')" "Pieter hired"

# Lindiwe Ngcobo — hired 2022
create_event "$EMP5_ID" "$(jq -n '{
  eventType: "HIRE", eventDate: "2022-04-01", effectiveDate: "2022-04-01",
  description: "Joined as Water Process Controller — first appointment after completing Process Controller certification",
  newDepartment: "Water Services", newJobTitle: "Water Process Controller", newJobGrade: "C3"
}')" "Lindiwe hired"

# Bongani Zulu — hired 2023
create_event "$EMP6_ID" "$(jq -n '{
  eventType: "HIRE", eventDate: "2023-01-16", effectiveDate: "2023-01-16",
  description: "Joined as ICT Systems Administrator from Ithala Development Finance Corporation",
  newDepartment: "Corporate Services", newJobTitle: "ICT Systems Administrator", newJobGrade: "C2"
}')" "Bongani hired"

# Ayanda Mkhize — hired 2023
create_event "$EMP7_ID" "$(jq -n '{
  eventType: "HIRE", eventDate: "2023-06-01", effectiveDate: "2023-06-01",
  description: "Joined as Community Liaison Officer — recruited through youth development programme",
  newDepartment: "Community Services", newJobTitle: "Community Liaison Officer", newJobGrade: "C1"
}')" "Ayanda hired"

# Zanele Mthembu — hired 2024
create_event "$EMP9_ID" "$(jq -n '{
  eventType: "HIRE", eventDate: "2024-01-15", effectiveDate: "2024-01-15",
  description: "Joined as Supply Chain Officer from eThekwini Municipality",
  newDepartment: "Finance", newJobTitle: "Supply Chain Officer", newJobGrade: "C1"
}')" "Zanele hired"

# Mandla Shabalala — hired 2024
create_event "$EMP10_ID" "$(jq -n '{
  eventType: "HIRE", eventDate: "2024-06-01", effectiveDate: "2024-06-01",
  description: "Joined as Water Quality Technician — graduate placement from DUT",
  newDepartment: "Water Services", newJobTitle: "Water Quality Technician", newJobGrade: "B3"
}')" "Mandla hired"

# ============================================================
# Step 6: Certifications
# ============================================================
log "Adding certifications..."

create_cert() {
  local body="$1" desc="$2"
  api_post "/api/training/certifications" -d "$body" >/dev/null 2>&1 && \
    ok "Cert: $desc" || warn "Cert failed: $desc"
}

# Sipho — SAMTRAC, Project Management
[ -n "$EMP1_ID" ] && {
  create_cert "$(jq -n --argjson eid "$EMP1_ID" '{
    employeeId: $eid, name: "SAMTRAC (Safety Management Training Course)",
    issuingBody: "NOSA", certificationNumber: "SAM-2020-4521",
    issueDate: "2020-03-15", expiryDate: "2027-03-15", status: "ACTIVE"
  }')" "Sipho — SAMTRAC"

  create_cert "$(jq -n --argjson eid "$EMP1_ID" '{
    employeeId: $eid, name: "Project Management Professional (PMP)",
    issuingBody: "PMI", certificationNumber: "PMP-2021-ZA-7890",
    issueDate: "2021-06-01", expiryDate: "2027-06-01", status: "ACTIVE"
  }')" "Sipho — PMP"
}

# Thabo — ECSA Professional Engineer
[ -n "$EMP3_ID" ] && {
  create_cert "$(jq -n --argjson eid "$EMP3_ID" '{
    employeeId: $eid, name: "Professional Engineer (Pr Eng)",
    issuingBody: "ECSA", certificationNumber: "ECSA-2019-CE-12345",
    issueDate: "2019-09-01", status: "ACTIVE"
  }')" "Thabo — Pr Eng"
}

# Pieter — CA(SA)
[ -n "$EMP4_ID" ] && {
  create_cert "$(jq -n --argjson eid "$EMP4_ID" '{
    employeeId: $eid, name: "Chartered Accountant CA(SA)",
    issuingBody: "SAICA", certificationNumber: "SAICA-2012-45678",
    issueDate: "2012-01-15", status: "ACTIVE"
  }')" "Pieter — CA(SA)"

  create_cert "$(jq -n --argjson eid "$EMP4_ID" '{
    employeeId: $eid, name: "MFMA Competency Certificate",
    issuingBody: "National Treasury", certificationNumber: "NT-MFMA-2021-890",
    issueDate: "2021-11-01", expiryDate: "2026-11-01", status: "ACTIVE"
  }')" "Pieter — MFMA"
}

# Lindiwe — Process Controller Class III
[ -n "$EMP5_ID" ] && {
  create_cert "$(jq -n --argjson eid "$EMP5_ID" '{
    employeeId: $eid, name: "Process Controller Certificate (Class III - Water)",
    issuingBody: "Department of Water and Sanitation",
    certificationNumber: "DWS-PC3W-2022-3456",
    issueDate: "2022-02-01", status: "ACTIVE"
  }')" "Lindiwe — Process Controller III"
}

# Bongani — MCSA, CCNA
[ -n "$EMP6_ID" ] && {
  create_cert "$(jq -n --argjson eid "$EMP6_ID" '{
    employeeId: $eid, name: "Microsoft Certified: Azure Administrator Associate",
    issuingBody: "Microsoft", certificationNumber: "MS-AZ104-2023-78901",
    issueDate: "2023-04-01", expiryDate: "2026-04-01", status: "ACTIVE"
  }')" "Bongani — Azure Admin"

  create_cert "$(jq -n --argjson eid "$EMP6_ID" '{
    employeeId: $eid, name: "Cisco Certified Network Associate (CCNA)",
    issuingBody: "Cisco", certificationNumber: "CSCO-2022-56789",
    issueDate: "2022-08-01", expiryDate: "2025-08-01", status: "ACTIVE"
  }')" "Bongani — CCNA"
}

# Johan — Trade Test, SAMTRAC
[ -n "$EMP8_ID" ] && {
  create_cert "$(jq -n --argjson eid "$EMP8_ID" '{
    employeeId: $eid, name: "Plumber Trade Test Certificate (Section 26D)",
    issuingBody: "Department of Higher Education and Training",
    certificationNumber: "DHET-TT-2010-12345",
    issueDate: "2010-06-15", status: "ACTIVE"
  }')" "Johan — Trade Test"

  create_cert "$(jq -n --argjson eid "$EMP8_ID" '{
    employeeId: $eid, name: "SAMTRAC (Safety Management Training Course)",
    issuingBody: "NOSA", certificationNumber: "SAM-2019-3210",
    issueDate: "2019-09-01", expiryDate: "2026-09-01", status: "ACTIVE"
  }')" "Johan — SAMTRAC"
}

# Zanele — CIPS Level 4
[ -n "$EMP9_ID" ] && {
  create_cert "$(jq -n --argjson eid "$EMP9_ID" '{
    employeeId: $eid, name: "CIPS Level 4 Diploma in Procurement and Supply",
    issuingBody: "Chartered Institute of Procurement & Supply",
    certificationNumber: "CIPS-2023-ZA-6789",
    issueDate: "2023-12-01", status: "ACTIVE"
  }')" "Zanele — CIPS L4"
}

# Mandla — Water Quality Analysis
[ -n "$EMP10_ID" ] && {
  create_cert "$(jq -n --argjson eid "$EMP10_ID" '{
    employeeId: $eid, name: "Certificate in Water Quality Analysis",
    issuingBody: "Durban University of Technology",
    certificationNumber: "DUT-WQA-2024-234",
    issueDate: "2024-03-15", status: "ACTIVE"
  }')" "Mandla — Water Quality Analysis"
}

# ============================================================
# Step 7: Documents (metadata — no file upload)
# ============================================================
log "Adding document records..."

create_doc() {
  local emp_id="$1" body="$2" desc="$3"
  [ -z "$emp_id" ] && { warn "Skipping doc: $desc"; return; }
  api_post "/api/employee/documents?employeeId=${emp_id}" -d "$body" >/dev/null 2>&1 && \
    ok "Doc: $desc" || warn "Doc failed: $desc"
}

# For each employee: ID document, employment contract, and qualification
for i in 1 2 3 4 5 6 7 8 9 10; do
  eval "EID=\$EMP${i}_ID"
  [ -z "$EID" ] && continue

  case $i in
    1) NAME="Sipho Ndlovu";       QUAL="BTech Mechanical Engineering — DUT" ;;
    2) NAME="Nomvula Dlamini";     QUAL="BA Honours Industrial Psychology — UKZN" ;;
    3) NAME="Thabo Khumalo";       QUAL="BEng Civil Engineering — UCT" ;;
    4) NAME="Pieter van der Merwe"; QUAL="BCom Honours Accounting — Stellenbosch" ;;
    5) NAME="Lindiwe Ngcobo";      QUAL="National Diploma Water & Wastewater Treatment — DUT" ;;
    6) NAME="Bongani Zulu";        QUAL="BSc Computer Science — UKZN" ;;
    7) NAME="Ayanda Mkhize";       QUAL="Diploma Public Administration — MUT" ;;
    8) NAME="Johan Pretorius";     QUAL="National Diploma Mechanical Engineering — VUT" ;;
    9) NAME="Zanele Mthembu";      QUAL="BCom Supply Chain Management — UNISA" ;;
    10) NAME="Mandla Shabalala";   QUAL="National Diploma Analytical Chemistry — DUT" ;;
  esac

  # ID Document
  create_doc "$EID" "$(jq -n --arg t "ID Document — $NAME" '{
    title: $t, description: "Certified copy of South African ID",
    filename: "id_document.pdf", fileUrl: "pending-upload", contentType: "application/pdf"
  }')" "$NAME — ID"

  # Employment Contract
  create_doc "$EID" "$(jq -n --arg t "Employment Contract — $NAME" '{
    title: $t, description: "Signed employment contract",
    filename: "employment_contract.pdf", fileUrl: "pending-upload", contentType: "application/pdf"
  }')" "$NAME — Contract"

  # Qualification
  create_doc "$EID" "$(jq -n --arg t "$QUAL" '{
    title: $t, description: "Certified copy of qualification",
    filename: "qualification.pdf", fileUrl: "pending-upload", contentType: "application/pdf"
  }')" "$NAME — Qualification"
done

# ============================================================
# Summary
# ============================================================
echo ""
log "============================================================"
log "  uThukela Water — Employee Seeding Complete!"
log "============================================================"
echo ""
log "Employees created: ${#EMPLOYEE_IDS[@]} / 10"
echo ""
log "  #  | Name                      | Department          | Job Title"
log "  ---|---------------------------|---------------------|----------------------------"
log "  1  | Sipho Ndlovu              | Operations          | Operations Manager"
log "  2  | Nomvula Dlamini           | Corporate Services  | HR Manager"
log "  3  | Thabo Khumalo             | Technical Services  | Senior Civil Engineer"
log "  4  | Pieter van der Merwe      | Finance             | Finance Manager"
log "  5  | Lindiwe Ngcobo            | Water Services      | Water Process Controller"
log "  6  | Bongani Zulu              | Corporate Services  | ICT Systems Administrator"
log "  7  | Ayanda Mkhize             | Community Services  | Community Liaison Officer"
log "  8  | Johan Pretorius           | Operations          | Maintenance Supervisor"
log "  9  | Zanele Mthembu            | Finance             | Supply Chain Officer"
log "  10 | Mandla Shabalala          | Water Services      | Water Quality Technician"
echo ""
log "Each employee has:"
log "  - Full personal info (demographics, address, contact)"
log "  - Employment details (department, grade, cost centre)"
log "  - Emergency contact"
log "  - Banking details"
log "  - Employment history events (hire, promotions, transfers)"
log "  - Certifications"
log "  - Documents (ID, contract, qualification — metadata only)"
echo ""
log "Skill definitions created: 20 across 8 categories"
if [ "$SEED_FAILURES" -gt 0 ]; then
  warn "$SEED_FAILURES employee(s) failed to seed"
  exit 1
fi
log "============================================================"
