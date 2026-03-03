#!/usr/bin/env bash
#
# seed-idc-demo.sh — Populate the IDC demo environment with realistic test data
#
# Prerequisites:
#   - AWS CLI configured with credentials for the PROD account
#   - jq installed (brew install jq)
#   - curl installed
#   - The 8 demo Cognito users already exist with correct groups and custom:tenant_id
#   - The idc-demo tenant already exists in the database (created via tenant onboarding)
#
# Usage:
#   export COGNITO_USER_POOL_ID="af-south-1_XXXXXXX"
#   export COGNITO_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
#   export ADMIN_PASSWORD="Demo@2026"
#   ./scripts/seed-idc-demo.sh
#
set -euo pipefail

# ============================================================
# Configuration
# ============================================================
API_BASE_URL="${API_BASE_URL:-https://api.shumelahire.co.za}"
AWS_REGION="${AWS_REGION:-af-south-1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@idc-demo.shumelahire.co.za}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:?Set ADMIN_PASSWORD}"
COGNITO_USER_POOL_ID="${COGNITO_USER_POOL_ID:?Set COGNITO_USER_POOL_ID}"
COGNITO_CLIENT_ID="${COGNITO_CLIENT_ID:?Set COGNITO_CLIENT_ID}"

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
# Step 1: Authenticate with Cognito
# ============================================================
log "Authenticating as ${ADMIN_EMAIL}..."

# Use --cli-input-json to avoid shell escaping issues with special chars in passwords
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
ok "Authenticated. Token expires in $(echo "$AUTH_RESULT" | jq -r '.AuthenticationResult.ExpiresIn')s"

# Extract tenant_id from ID token (JWT payload is the second base64 segment)
# Add proper base64 padding (= chars) before decoding
JWT_B64=$(echo "$ID_TOKEN" | cut -d. -f2 | tr '_-' '/+')
JWT_PAD=$((4 - ${#JWT_B64} % 4))
[ "$JWT_PAD" -lt 4 ] && JWT_B64="${JWT_B64}$(printf '=%.0s' $(seq 1 $JWT_PAD))"
JWT_PAYLOAD=$(echo "$JWT_B64" | base64 -d 2>/dev/null || echo "$JWT_B64" | base64 -D 2>/dev/null || echo "{}")
TENANT_ID=$(echo "$JWT_PAYLOAD" | jq -r '.["custom:tenant_id"] // empty' 2>/dev/null)
if [ -z "$TENANT_ID" ]; then
  warn "No custom:tenant_id in JWT. Defaulting to 'default'."
  TENANT_ID="default"
fi
ok "Tenant ID: $TENANT_ID"

# ============================================================
# Helper: API call function
# ============================================================
api() {
  local method="$1"
  local path="$2"
  shift 2
  local url="${API_BASE_URL}${path}"
  local headers=(-H "Authorization: Bearer $ID_TOKEN" -H "Content-Type: application/json")
  [ -n "$TENANT_ID" ] && headers+=(-H "X-Tenant-Id: $TENANT_ID")

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
# Step 2: Verify connectivity and get admin user info
# ============================================================
log "Verifying API connectivity..."
ME=$(api_get "/api/auth/me") || fail "Cannot reach API at $API_BASE_URL"
ok "Connected as $(echo "$ME" | jq -r '.email')"

# ============================================================
# Step 2b: Reset old data (if RESET_FIRST=1)
# ============================================================
RESET_FIRST="${RESET_FIRST:-0}"
if [ "$RESET_FIRST" = "1" ]; then
  log "Clearing old demo data via /api/admin/demo-reset..."
  RESET_RESULT=$(api_post "/api/admin/demo-reset?confirm=true" 2>&1) || warn "Demo reset failed: $RESET_RESULT"
  if [ -n "$RESET_RESULT" ] && echo "$RESET_RESULT" | jq -e '._total_deleted' >/dev/null 2>&1; then
    TOTAL_DELETED=$(echo "$RESET_RESULT" | jq -r '._total_deleted')
    ok "Cleared $TOTAL_DELETED rows of old data"
    echo "$RESET_RESULT" | jq 'del(._total_deleted, ._tenant)' >&2
  else
    warn "Reset response: $RESET_RESULT"
  fi
fi

# ============================================================
# Step 3: Get all users for interviewer/creator assignments
# ============================================================
log "Fetching user list..."
USERS_RAW=$(api_get "/api/admin/users?page=0&size=100") || warn "Could not fetch users list"
# Handle both paginated {content:[...]} and plain array [...] responses
USERS=$(echo "$USERS_RAW" | jq 'if type == "object" then .content else . end' 2>/dev/null)
USER_COUNT=$(echo "$USERS" | jq 'length')
ok "Found $USER_COUNT users"

# Map user IDs by role/email (best-effort)
get_user_id_by_email() {
  echo "$USERS" | jq -r --arg email "$1" '.[] | select(.email == $email) | .id' | head -1
}

get_user_id_by_role() {
  echo "$USERS" | jq -r --arg role "$1" '.[] | select(.roleName == $role) | .id' | head -1
}

# Get admin DB user ID from user list
ADMIN_USER_ID=$(get_user_id_by_role "Administrator")
[ -z "$ADMIN_USER_ID" ] && ADMIN_USER_ID=$(get_user_id_by_email "$ADMIN_EMAIL")
[ -z "$ADMIN_USER_ID" ] && ADMIN_USER_ID="1"
ok "Admin DB user ID=$ADMIN_USER_ID"

# We'll use admin ID as fallback for createdBy
CREATED_BY="$ADMIN_USER_ID"

# ============================================================
# Step 4: Create Job Postings
# ============================================================
log "Creating job postings..."

declare -a JOB_IDS=()
declare -a JOB_TITLES=()

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
      positionsAvailable: 1,
      remoteWorkAllowed: false
    }')

  local result
  result=$(api_post "/api/job-postings?createdBy=$CREATED_BY" -d "$body") || { warn "Failed to create job: $title"; return 1; }
  local id
  id=$(echo "$result" | jq -r '.id')
  ok "Job #$id: $title"
  echo "$id"
}

# --- Job 1: Senior Investment Analyst ---
JOB_IDS[1]=$(create_job \
  "Senior Investment Analyst" \
  "Strategic Business Unit" \
  "Sandton, Gauteng" \
  "FULL_TIME" \
  "SENIOR" \
  "The IDC is seeking a Senior Investment Analyst to evaluate and recommend investment opportunities that align with the Corporation's mandate of promoting industrial development in South Africa. The analyst will conduct rigorous financial and economic analysis of proposed projects, assess risk profiles, and prepare investment memoranda for the Board Investment Committee." \
  "Minimum 6 years experience in investment analysis, corporate finance, or development finance. Strong financial modelling skills. Knowledge of South African industrial policy and economic development frameworks. CFA designation preferred." \
  "Evaluate investment proposals and conduct detailed financial due diligence. Build and maintain complex financial models for project appraisal. Prepare investment memoranda and present to the Investment Committee. Monitor portfolio performance and provide post-investment support. Assess socio-economic impact of proposed investments." \
  "BCom Honours in Finance, Economics, or Accounting. CFA Level II or above preferred. CA(SA) considered." \
  "Medical aid contribution. Retirement fund. Performance bonus. Study assistance programme." \
  650000 850000)

# --- Job 2: Software Developer ---
JOB_IDS[2]=$(create_job \
  "Software Developer" \
  "Information Technology" \
  "Sandton, Gauteng" \
  "FULL_TIME" \
  "MID_LEVEL" \
  "The IDC IT department requires a Software Developer to design, develop, and maintain internal applications that support the Corporation's investment management and reporting processes. The successful candidate will work in an agile team building modern web applications." \
  "3-5 years experience in full-stack development. Proficiency in Java or C# and modern JavaScript frameworks. Experience with relational databases and RESTful APIs. Understanding of CI/CD pipelines and cloud platforms." \
  "Develop and maintain internal business applications. Design and implement RESTful APIs and microservices. Collaborate with business analysts to translate requirements into technical solutions. Participate in code reviews and maintain code quality standards. Support production systems and resolve technical issues." \
  "BSc Computer Science or BTech IT from a recognised institution. AWS or Azure certification advantageous." \
  "Medical aid contribution. Retirement fund. Performance bonus. Flexible working arrangements." \
  550000 750000)

# --- Job 3: Risk Manager ---
JOB_IDS[3]=$(create_job \
  "Risk Manager" \
  "Enterprise Risk Management" \
  "Sandton, Gauteng" \
  "FULL_TIME" \
  "SENIOR" \
  "The IDC seeks a Risk Manager to lead the identification, assessment, and mitigation of enterprise-wide risks. This role involves developing risk frameworks, conducting risk assessments across the investment portfolio, and ensuring compliance with governance standards." \
  "Minimum 8 years experience in risk management within financial services or development finance. Professional risk management certification (FRM, PRM, or equivalent). Knowledge of Basel frameworks and King IV governance principles." \
  "Develop and maintain enterprise risk management framework. Conduct portfolio risk assessments and stress testing. Prepare risk reports for the Board Risk Committee. Oversee operational risk management across business units. Ensure regulatory compliance including PFMA and Treasury requirements." \
  "BCom Honours or Masters in Risk Management, Finance, or Actuarial Science. FRM or PRM certification required." \
  "Medical aid contribution. Retirement fund. Performance bonus. Executive development programme." \
  800000 1100000)

# --- Job 4: Legal Advisor ---
JOB_IDS[4]=$(create_job \
  "Legal Advisor" \
  "Legal and Compliance" \
  "Sandton, Gauteng" \
  "FULL_TIME" \
  "MID_LEVEL" \
  "The IDC requires a Legal Advisor to provide legal counsel on investment transactions, corporate governance matters, and regulatory compliance. The advisor will draft and review legal agreements, manage litigation, and support deal structuring." \
  "4-6 years post-admission experience in commercial or corporate law. Experience with project finance, BEE transactions, or development finance preferred. Knowledge of Companies Act, PFMA, and relevant legislation." \
  "Draft and review investment agreements, loan agreements, and shareholder agreements. Provide legal opinions on proposed transactions. Manage external legal counsel and litigation matters. Advise on regulatory compliance and corporate governance. Support BEE compliance monitoring." \
  "LLB from a recognised South African university. Admitted Attorney or Advocate. LLM in Corporate or Commercial Law advantageous." \
  "Medical aid contribution. Retirement fund. Performance bonus. Professional development support." \
  600000 800000)

# --- Job 5: Financial Accountant ---
JOB_IDS[5]=$(create_job \
  "Financial Accountant" \
  "Finance" \
  "Sandton, Gauteng" \
  "FULL_TIME" \
  "MID_LEVEL" \
  "The IDC Finance division requires a Financial Accountant to manage financial reporting, general ledger maintenance, and regulatory compliance. The role involves preparation of annual financial statements, management accounts, and National Treasury reporting." \
  "3-5 years experience in financial accounting. Knowledge of IFRS and public sector accounting standards. Experience with SAP or Oracle ERP systems. Understanding of PFMA and National Treasury regulations." \
  "Prepare monthly management accounts and variance analysis. Maintain the general ledger and ensure accuracy of financial records. Assist in preparation of annual financial statements per IFRS. Prepare regulatory returns for National Treasury and Auditor-General. Support the annual audit process." \
  "BCom Accounting. CA(SA) or CIMA qualification preferred. Articles at a recognised audit firm advantageous." \
  "Medical aid contribution. Retirement fund. Performance bonus. Study assistance for professional exams." \
  450000 600000)

# --- Job 6: HR Business Partner ---
JOB_IDS[6]=$(create_job \
  "HR Business Partner" \
  "Human Capital" \
  "Sandton, Gauteng" \
  "FULL_TIME" \
  "SENIOR" \
  "The IDC Human Capital division seeks an HR Business Partner to provide strategic HR advisory services to assigned business units. The HRBP will align people strategies with business objectives, drive organisational development initiatives, and ensure effective talent management." \
  "Minimum 7 years experience in HR business partnering. Experience in the financial services or development finance sector preferred. Knowledge of South African labour legislation and BBBEE compliance." \
  "Partner with business unit heads to develop people strategies. Drive talent acquisition and retention programmes. Manage performance management processes. Lead organisational development and change management initiatives. Ensure compliance with employment legislation and BBBEE targets." \
  "BCom Honours or Masters in Human Resources, Industrial Psychology, or related field. Registered Industrial Psychologist advantageous." \
  "Medical aid contribution. Retirement fund. Performance bonus. Leadership development programme." \
  550000 750000)

# --- Job 7: Communications Specialist ---
JOB_IDS[7]=$(create_job \
  "Communications Specialist" \
  "Corporate Affairs" \
  "Sandton, Gauteng" \
  "FULL_TIME" \
  "JUNIOR" \
  "The IDC Corporate Affairs division requires a Communications Specialist to support internal and external communication initiatives. The role involves content creation, media relations support, and management of digital communication channels." \
  "2-3 years experience in corporate communications, public relations, or journalism. Strong written and verbal communication skills. Experience with digital media platforms and content management systems." \
  "Create content for internal newsletters, press releases, and social media. Support media relations and manage media enquiries. Maintain the corporate website and intranet content. Coordinate corporate events and stakeholder engagement activities. Monitor media coverage and prepare media analysis reports." \
  "BA or BCom in Communications, Journalism, or Marketing. Postgraduate qualification advantageous." \
  "Medical aid contribution. Retirement fund. Performance bonus." \
  350000 450000)

# --- Job 8: Project Manager ---
JOB_IDS[8]=$(create_job \
  "Project Manager" \
  "Post-Investment Monitoring" \
  "Sandton, Gauteng" \
  "CONTRACT" \
  "SENIOR" \
  "The IDC requires a Project Manager on a fixed-term contract to oversee the post-investment monitoring of a portfolio of funded projects. The PM will track project milestones, assess developmental impact, and coordinate with funded entities to ensure compliance with loan covenants." \
  "Minimum 7 years project management experience. PMP or PRINCE2 certification. Experience in development finance or infrastructure project monitoring. Understanding of PFMA reporting requirements." \
  "Monitor and report on the progress of funded projects. Conduct site visits and assess project compliance with conditions of approval. Prepare quarterly portfolio performance reports. Coordinate with funded entities to resolve project implementation challenges. Track developmental impact metrics including job creation and transformation targets." \
  "BSc/BEng or BCom Honours. PMP or PRINCE2 Practitioner certification required." \
  "Competitive daily rate. Travel allowance. Professional development support." \
  700000 950000)

# --- Job 9: Data Analyst ---
JOB_IDS[9]=$(create_job \
  "Data Analyst" \
  "Strategy and Research" \
  "Sandton, Gauteng" \
  "FULL_TIME" \
  "MID_LEVEL" \
  "The IDC Strategy and Research division requires a Data Analyst to support evidence-based decision making through data collection, analysis, and visualisation. The analyst will work with investment data, economic indicators, and developmental impact metrics." \
  "3-5 years experience in data analysis or business intelligence. Proficiency in SQL, Python or R, and visualisation tools such as Power BI or Tableau. Understanding of economic and financial data analysis." \
  "Collect, clean, and analyse investment and economic data. Develop dashboards and reports for senior management. Conduct sector and market analysis to support investment decisions. Analyse developmental impact data including employment, transformation, and economic multipliers. Support the annual integrated reporting process with data insights." \
  "BSc/BCom Honours in Statistics, Economics, Data Science, or related field." \
  "Medical aid contribution. Retirement fund. Performance bonus. Study assistance programme." \
  450000 600000)

# --- Job 10: Executive Assistant ---
JOB_IDS[10]=$(create_job \
  "Executive Assistant" \
  "Office of the CEO" \
  "Sandton, Gauteng" \
  "FULL_TIME" \
  "MID_LEVEL" \
  "The IDC requires an Executive Assistant to provide high-level administrative support to the Chief Executive Officer. This role demands exceptional organisational skills, discretion, and the ability to manage complex schedules and stakeholder engagements." \
  "4-6 years experience as an Executive Assistant or Personal Assistant to C-suite executives. Excellent written and verbal communication skills. Proficiency in Microsoft Office Suite. Experience in a corporate or government environment preferred." \
  "Manage the CEO's diary, travel arrangements, and correspondence. Coordinate Board and Executive Committee meetings including agenda preparation and minutes. Liaise with internal and external stakeholders on behalf of the CEO. Prepare briefing documents and presentations. Manage confidential information with the highest level of discretion." \
  "National Diploma or BCom in Office Management, Business Administration, or related field." \
  "Medical aid contribution. Retirement fund. Performance bonus." \
  350000 500000)

log "Created ${#JOB_IDS[@]} job postings"

# ============================================================
# Step 5: Move job postings through status workflow
# ============================================================
log "Updating job posting statuses..."

publish_job() {
  local id="$1"
  api_post "/api/job-postings/$id/submit-for-approval?submittedBy=$CREATED_BY" >/dev/null 2>&1 || true
  api_post "/api/job-postings/$id/approve?approvedBy=$CREATED_BY" >/dev/null 2>&1 || true
  api_post "/api/job-postings/$id/publish?publishedBy=$CREATED_BY" >/dev/null 2>&1 || true
  ok "Published job #$id"
}

# Published jobs: 1,2,3,4,5,8,10
for i in 1 2 3 4 5 8 10; do
  publish_job "${JOB_IDS[$i]}"
done

# Job 6 (HR Business Partner): PENDING_APPROVAL
api_post "/api/job-postings/${JOB_IDS[6]}/submit-for-approval?submittedBy=$CREATED_BY" >/dev/null 2>&1 || true
ok "Job #${JOB_IDS[6]} (HR Business Partner): PENDING_APPROVAL"

# Job 7 (Communications Specialist): stays DRAFT
ok "Job #${JOB_IDS[7]} (Communications Specialist): DRAFT"

# Job 9 (Data Analyst): CLOSED
publish_job "${JOB_IDS[9]}"
api_post "/api/job-postings/${JOB_IDS[9]}/close?closedBy=$CREATED_BY" >/dev/null 2>&1 || true
ok "Job #${JOB_IDS[9]} (Data Analyst): CLOSED"

# ============================================================
# Step 6: Create Applicants
# ============================================================
log "Creating applicants..."

declare -a APP_IDS=()

create_applicant() {
  local name="$1" surname="$2" email="$3" phone="$4"
  local education="$5" experience="$6" skills="$7"

  local body
  body=$(jq -n \
    --arg name "$name" \
    --arg surname "$surname" \
    --arg email "$email" \
    --arg phone "$phone" \
    --arg education "$education" \
    --arg experience "$experience" \
    --arg skills "$skills" \
    '{name:$name, surname:$surname, email:$email, phone:$phone, education:$education, experience:$experience, skills:$skills}')

  local result
  result=$(api_post "/api/applicants" -d "$body") || { warn "Failed to create applicant: $name $surname"; return 1; }
  local id
  id=$(echo "$result" | jq -r '.id')
  ok "Applicant #$id: $name $surname"
  echo "$id"
}

# --- 18 Diverse South African Applicants ---

APP_IDS[1]=$(create_applicant \
  "Thabo" "Mokoena" "thabo.mokoena@gmail.com" "+27 82 345 6789" \
  '[{"institution":"University of the Witwatersrand","degree":"BCom Honours Finance","year":"2018"},{"institution":"CFA Institute","degree":"CFA Level III","year":"2021"}]' \
  '[{"company":"Standard Bank","role":"Investment Analyst","years":"2018-2022"},{"company":"Nedbank Capital","role":"Senior Analyst","years":"2022-present"}]' \
  '["Financial modelling","Valuation","Project finance","Excel","Bloomberg Terminal","Due diligence"]')

APP_IDS[2]=$(create_applicant \
  "Naledi" "Dlamini" "naledi.dlamini@outlook.com" "+27 83 456 7890" \
  '[{"institution":"University of Cape Town","degree":"BSc Computer Science","year":"2019"},{"institution":"AWS","degree":"Solutions Architect Associate","year":"2022"}]' \
  '[{"company":"Discovery","role":"Junior Developer","years":"2019-2021"},{"company":"Investec","role":"Software Developer","years":"2021-present"}]' \
  '["Java","Spring Boot","React","TypeScript","PostgreSQL","AWS","Docker","REST APIs"]')

APP_IDS[3]=$(create_applicant \
  "Pieter" "van der Merwe" "pieter.vdm@gmail.com" "+27 71 567 8901" \
  '[{"institution":"Stellenbosch University","degree":"MCom Risk Management","year":"2016"},{"institution":"GARP","degree":"FRM Certified","year":"2018"}]' \
  '[{"company":"Absa Capital","role":"Risk Analyst","years":"2016-2019"},{"company":"DBSA","role":"Risk Manager","years":"2019-present"}]' \
  '["Enterprise risk management","Basel III/IV","Credit risk","Operational risk","Stress testing","SAS"]')

APP_IDS[4]=$(create_applicant \
  "Ayanda" "Nkosi" "ayanda.nkosi@yahoo.com" "+27 84 678 9012" \
  '[{"institution":"University of Pretoria","degree":"LLB","year":"2017"},{"institution":"University of Pretoria","degree":"LLM Corporate Law","year":"2019"}]' \
  '[{"company":"Werksmans Attorneys","role":"Associate","years":"2018-2021"},{"company":"ENSafrica","role":"Senior Associate","years":"2021-present"}]' \
  '["Corporate law","Project finance","BEE transactions","Contract drafting","Due diligence","Companies Act"]')

APP_IDS[5]=$(create_applicant \
  "Fatima" "Patel" "fatima.patel@gmail.com" "+27 72 789 0123" \
  '[{"institution":"University of Johannesburg","degree":"BCom Accounting","year":"2018"},{"institution":"SAICA","degree":"CA(SA)","year":"2021"}]' \
  '[{"company":"Deloitte","role":"Audit Trainee","years":"2018-2021"},{"company":"Transnet","role":"Financial Accountant","years":"2021-present"}]' \
  '["IFRS","Financial reporting","SAP","General ledger","Audit","National Treasury reporting","PFMA"]')

APP_IDS[6]=$(create_applicant \
  "Sipho" "Mthembu" "sipho.mthembu@hotmail.com" "+27 83 890 1234" \
  '[{"institution":"University of KwaZulu-Natal","degree":"BCom Honours Economics","year":"2017"},{"institution":"CFA Institute","degree":"CFA Level II","year":"2020"}]' \
  '[{"company":"RMB","role":"Graduate Analyst","years":"2017-2019"},{"company":"Ashburton Investments","role":"Investment Analyst","years":"2019-present"}]' \
  '["Investment analysis","Equity research","Financial modelling","Sector analysis","Presentations","Bloomberg"]')

APP_IDS[7]=$(create_applicant \
  "Lauren" "Williams" "lauren.williams@gmail.com" "+27 82 901 2345" \
  '[{"institution":"Rhodes University","degree":"BSc Information Systems","year":"2020"},{"institution":"Scrum.org","degree":"Professional Scrum Master","year":"2022"}]' \
  '[{"company":"Accenture","role":"Junior Developer","years":"2020-2022"},{"company":"FNB","role":"Full Stack Developer","years":"2022-present"}]' \
  '["C#",".NET","Angular","SQL Server","Azure DevOps","Agile","REST APIs","Unit testing"]')

APP_IDS[8]=$(create_applicant \
  "Bongani" "Zwane" "bongani.zwane@gmail.com" "+27 71 012 3456" \
  '[{"institution":"University of the Witwatersrand","degree":"MCom Finance","year":"2015"},{"institution":"PMI","degree":"PMP Certified","year":"2019"}]' \
  '[{"company":"Eskom","role":"Project Coordinator","years":"2015-2018"},{"company":"DBSA","role":"Project Manager","years":"2018-present"}]' \
  '["Project management","PRINCE2","Stakeholder management","Infrastructure monitoring","MS Project","Financial analysis"]')

APP_IDS[9]=$(create_applicant \
  "Priya" "Govender" "priya.govender@outlook.com" "+27 84 123 4567" \
  '[{"institution":"University of Pretoria","degree":"BAdmin Honours","year":"2016"},{"institution":"SABPP","degree":"HR Professional","year":"2019"}]' \
  '[{"company":"Vodacom","role":"HR Generalist","years":"2016-2019"},{"company":"Sasol","role":"HR Business Partner","years":"2019-present"}]' \
  '["HR strategy","Talent management","Performance management","Labour law","BBBEE","Change management","SAP SuccessFactors"]')

APP_IDS[10]=$(create_applicant \
  "Michael" "Botha" "michael.botha@gmail.com" "+27 72 234 5678" \
  '[{"institution":"Stellenbosch University","degree":"BCom Actuarial Science","year":"2019"},{"institution":"ASSA","degree":"Part-qualified Actuary","year":"2022"}]' \
  '[{"company":"Old Mutual","role":"Actuarial Analyst","years":"2019-2022"},{"company":"Sanlam","role":"Risk Analyst","years":"2022-present"}]' \
  '["Risk modelling","Statistical analysis","Python","R","SQL","Actuarial valuations","Stress testing"]')

APP_IDS[11]=$(create_applicant \
  "Zanele" "Khumalo" "zanele.khumalo@yahoo.com" "+27 83 345 6789" \
  '[{"institution":"University of Cape Town","degree":"BSc Data Science","year":"2020"},{"institution":"Microsoft","degree":"Power BI Data Analyst","year":"2022"}]' \
  '[{"company":"Woolworths","role":"Data Analyst","years":"2020-2022"},{"company":"Stats SA","role":"Senior Data Analyst","years":"2022-present"}]' \
  '["Python","SQL","Power BI","Tableau","R","Statistical modelling","Data visualisation","ETL"]')

APP_IDS[12]=$(create_applicant \
  "Jacques" "du Plessis" "jacques.dp@gmail.com" "+27 82 456 7890" \
  '[{"institution":"University of Pretoria","degree":"LLB","year":"2019"}]' \
  '[{"company":"Bowmans","role":"Candidate Attorney","years":"2019-2021"},{"company":"Cliffe Dekker Hofmeyr","role":"Associate","years":"2021-present"}]' \
  '["Commercial law","Banking and finance law","Contract drafting","Regulatory compliance","Negotiation"]')

APP_IDS[13]=$(create_applicant \
  "Nomsa" "Mahlangu" "nomsa.mahlangu@gmail.com" "+27 71 567 8901" \
  '[{"institution":"University of Johannesburg","degree":"BCom Economics","year":"2020"},{"institution":"University of Johannesburg","degree":"BCom Honours Investment Management","year":"2021"}]' \
  '[{"company":"Allan Gray","role":"Graduate Analyst","years":"2021-2023"},{"company":"Coronation Fund Managers","role":"Analyst","years":"2023-present"}]' \
  '["Financial analysis","Portfolio management","Excel","Bloomberg","Research","Equity valuation"]')

APP_IDS[14]=$(create_applicant \
  "Ravi" "Naidoo" "ravi.naidoo@outlook.com" "+27 84 678 9012" \
  '[{"institution":"University of KwaZulu-Natal","degree":"BSc Computer Science","year":"2018"},{"institution":"Oracle","degree":"Java SE Certified Developer","year":"2020"}]' \
  '[{"company":"Dimension Data","role":"Software Developer","years":"2018-2021"},{"company":"Capitec","role":"Senior Developer","years":"2021-present"}]' \
  '["Java","Spring Boot","Microservices","Kubernetes","PostgreSQL","React","CI/CD","TDD"]')

APP_IDS[15]=$(create_applicant \
  "Lerato" "Molefe" "lerato.molefe@gmail.com" "+27 72 789 0123" \
  '[{"institution":"University of the Witwatersrand","degree":"BA Communications","year":"2021"},{"institution":"PRISA","degree":"APR Candidate","year":"2023"}]' \
  '[{"company":"Weber Shandwick","role":"Junior PR Consultant","years":"2021-2023"},{"company":"Brand South Africa","role":"Communications Officer","years":"2023-present"}]' \
  '["Corporate communications","Media relations","Content writing","Social media management","Event coordination","Stakeholder engagement"]')

APP_IDS[16]=$(create_applicant \
  "David" "Ndlovu" "david.ndlovu@gmail.com" "+27 83 890 1234" \
  '[{"institution":"University of Pretoria","degree":"BCom Financial Sciences","year":"2019"},{"institution":"CIMA","degree":"CGMA","year":"2022"}]' \
  '[{"company":"PwC","role":"Audit Associate","years":"2019-2022"},{"company":"Land Bank","role":"Management Accountant","years":"2022-present"}]' \
  '["Management accounting","IFRS","Budgeting","Forecasting","SAP","Financial analysis","PFMA"]')

APP_IDS[17]=$(create_applicant \
  "Sarah" "van Wyk" "sarah.vanwyk@gmail.com" "+27 82 901 2345" \
  '[{"institution":"Stellenbosch University","degree":"BCom Statistics","year":"2019"},{"institution":"Google","degree":"Data Analytics Professional","year":"2021"}]' \
  '[{"company":"Kantar","role":"Research Analyst","years":"2019-2021"},{"company":"National Treasury","role":"Economic Analyst","years":"2021-present"}]' \
  '["Data analysis","Economic research","Python","R","Stata","Power BI","Report writing","Policy analysis"]')

APP_IDS[18]=$(create_applicant \
  "Andile" "Sithole" "andile.sithole@outlook.com" "+27 71 012 3456" \
  '[{"institution":"University of the Witwatersrand","degree":"National Diploma Office Management","year":"2017"},{"institution":"Wits","degree":"Advanced Diploma Business Administration","year":"2020"}]' \
  '[{"company":"Anglo American","role":"Personal Assistant","years":"2017-2020"},{"company":"Eskom","role":"Executive Assistant to CFO","years":"2020-present"}]' \
  '["Diary management","Board coordination","Stakeholder liaison","Microsoft Office","Travel coordination","Minute taking","Confidential document management"]')

log "Created ${#APP_IDS[@]} applicants"

# ============================================================
# Step 7: Create Applications
# ============================================================
log "Creating applications..."

declare -a APPLICATION_IDS=()
APP_COUNTER=0

create_application() {
  local applicant_id="$1" job_id="$2" job_title="$3" dept="$4" cover_letter="$5"
  APP_COUNTER=$((APP_COUNTER + 1))

  local body
  body=$(jq -n \
    --argjson applicantId "$applicant_id" \
    --argjson jobAdId "$job_id" \
    --arg jobTitle "$job_title" \
    --arg department "$dept" \
    --arg coverLetter "$cover_letter" \
    '{applicantId:$applicantId, jobAdId:$jobAdId, jobTitle:$jobTitle, department:$department, coverLetter:$coverLetter, applicationSource:"EXTERNAL"}')

  local result
  result=$(api_post "/api/applications" -d "$body") || { warn "Failed to create application #$APP_COUNTER"; return 1; }
  local id
  id=$(echo "$result" | jq -r '.id')
  ok "Application #$id: Applicant $applicant_id -> Job $job_id ($job_title)"
  echo "$id"
}

# --- Senior Investment Analyst (Job 1): 5 applications ---
APPLICATION_IDS[1]=$(create_application "${APP_IDS[1]}" "${JOB_IDS[1]}" "Senior Investment Analyst" "Strategic Business Unit" \
  "I am an experienced investment analyst at Nedbank Capital with a CFA charter and strong background in project finance. The IDC's developmental mandate aligns with my career aspirations in development finance.")
APPLICATION_IDS[2]=$(create_application "${APP_IDS[6]}" "${JOB_IDS[1]}" "Senior Investment Analyst" "Strategic Business Unit" \
  "With my investment analysis experience at Ashburton Investments and CFA Level II progress, I am eager to apply my skills to the IDC's mission of driving industrial development in South Africa.")
APPLICATION_IDS[3]=$(create_application "${APP_IDS[13]}" "${JOB_IDS[1]}" "Senior Investment Analyst" "Strategic Business Unit" \
  "As an analyst at Coronation Fund Managers with a strong academic grounding in investment management from UJ, I would bring fresh analytical perspectives to the IDC's investment team.")
APPLICATION_IDS[4]=$(create_application "${APP_IDS[10]}" "${JOB_IDS[1]}" "Senior Investment Analyst" "Strategic Business Unit" \
  "My actuarial background and risk analysis experience at Sanlam have equipped me with a unique quantitative lens that would add value to the IDC's investment appraisal process.")
APPLICATION_IDS[5]=$(create_application "${APP_IDS[8]}" "${JOB_IDS[1]}" "Senior Investment Analyst" "Strategic Business Unit" \
  "Having worked as a Project Manager at DBSA, I bring development finance experience and a strong understanding of the post-investment landscape that informs sound investment decisions.")

# --- Software Developer (Job 2): 4 applications ---
APPLICATION_IDS[6]=$(create_application "${APP_IDS[2]}" "${JOB_IDS[2]}" "Software Developer" "Information Technology" \
  "I am a full-stack developer at Investec with strong Java and React skills, complemented by AWS certification. I am excited about building systems that support the IDC's developmental mandate.")
APPLICATION_IDS[7]=$(create_application "${APP_IDS[14]}" "${JOB_IDS[2]}" "Software Developer" "Information Technology" \
  "As a Senior Developer at Capitec with deep Java and Spring Boot expertise, I seek to apply my skills in a purpose-driven organisation like the IDC.")
APPLICATION_IDS[8]=$(create_application "${APP_IDS[7]}" "${JOB_IDS[2]}" "Software Developer" "Information Technology" \
  "My full-stack development experience at FNB, combined with agile methodology expertise, makes me well-suited for the IDC's modern technology stack.")
APPLICATION_IDS[9]=$(create_application "${APP_IDS[15]}" "${JOB_IDS[2]}" "Software Developer" "Information Technology" \
  "Although my background is in communications, I have been upskilling in web development and seek an opportunity to transition into a development role at a mission-driven organisation.")

# --- Risk Manager (Job 3): 3 applications ---
APPLICATION_IDS[10]=$(create_application "${APP_IDS[3]}" "${JOB_IDS[3]}" "Risk Manager" "Enterprise Risk Management" \
  "As a certified FRM with risk management experience at DBSA, I understand the unique risk landscape of development finance institutions and am ready to lead the IDC's risk function.")
APPLICATION_IDS[11]=$(create_application "${APP_IDS[10]}" "${JOB_IDS[3]}" "Risk Manager" "Enterprise Risk Management" \
  "My actuarial and risk analysis background at Sanlam, coupled with strong quantitative modelling skills, positions me to effectively manage the IDC's enterprise risk portfolio.")
APPLICATION_IDS[12]=$(create_application "${APP_IDS[1]}" "${JOB_IDS[3]}" "Risk Manager" "Enterprise Risk Management" \
  "While primarily an investment analyst, my CFA training and exposure to credit risk assessment at Standard Bank and Nedbank would support the IDC's risk management framework.")

# --- Legal Advisor (Job 4): 3 applications ---
APPLICATION_IDS[13]=$(create_application "${APP_IDS[4]}" "${JOB_IDS[4]}" "Legal Advisor" "Legal and Compliance" \
  "My experience at ENSafrica in corporate law and project finance, combined with an LLM in Corporate Law, has prepared me to advise on the IDC's complex investment transactions.")
APPLICATION_IDS[14]=$(create_application "${APP_IDS[12]}" "${JOB_IDS[4]}" "Legal Advisor" "Legal and Compliance" \
  "As an associate at Cliffe Dekker Hofmeyr specialising in banking and finance law, I bring relevant expertise in structuring and documenting financial transactions.")
APPLICATION_IDS[15]=$(create_application "${APP_IDS[9]}" "${JOB_IDS[4]}" "Legal Advisor" "Legal and Compliance" \
  "My HR business partnering experience at Sasol has given me strong knowledge of labour law and compliance. I seek to broaden my legal advisory career at the IDC.")

# --- Financial Accountant (Job 5): 4 applications ---
APPLICATION_IDS[16]=$(create_application "${APP_IDS[5]}" "${JOB_IDS[5]}" "Financial Accountant" "Finance" \
  "As a CA(SA) with financial accounting experience at Transnet, I have direct exposure to PFMA compliance and National Treasury reporting that the IDC requires.")
APPLICATION_IDS[17]=$(create_application "${APP_IDS[16]}" "${JOB_IDS[5]}" "Financial Accountant" "Finance" \
  "My CGMA qualification and management accounting experience at the Land Bank, another DFI, make me a strong fit for the IDC's finance team.")
APPLICATION_IDS[18]=$(create_application "${APP_IDS[13]}" "${JOB_IDS[5]}" "Financial Accountant" "Finance" \
  "My strong financial analysis skills from Coronation Fund Managers and Honours degree in Investment Management provide a solid foundation for financial accounting at the IDC.")
APPLICATION_IDS[19]=$(create_application "${APP_IDS[17]}" "${JOB_IDS[5]}" "Financial Accountant" "Finance" \
  "As an economic analyst at National Treasury, I understand public sector financial frameworks and would bring this perspective to the IDC's finance division.")

# --- Project Manager (Job 8): 3 applications ---
APPLICATION_IDS[20]=$(create_application "${APP_IDS[8]}" "${JOB_IDS[8]}" "Project Manager" "Post-Investment Monitoring" \
  "With PMP certification and project management experience at DBSA, I have deep experience in monitoring development finance projects across South Africa.")
APPLICATION_IDS[21]=$(create_application "${APP_IDS[3]}" "${JOB_IDS[8]}" "Project Manager" "Post-Investment Monitoring" \
  "My risk management background at DBSA equips me with strong analytical and monitoring skills that are essential for post-investment project oversight.")
APPLICATION_IDS[22]=$(create_application "${APP_IDS[6]}" "${JOB_IDS[8]}" "Project Manager" "Post-Investment Monitoring" \
  "My investment analysis experience gives me a strong foundation for understanding project financials and monitoring compliance with investment conditions.")

# --- Data Analyst (Job 9, CLOSED): 3 applications ---
APPLICATION_IDS[23]=$(create_application "${APP_IDS[11]}" "${JOB_IDS[9]}" "Data Analyst" "Strategy and Research" \
  "As a Senior Data Analyst at Statistics South Africa with proficiency in Python, Power BI, and statistical modelling, I would bring rigorous analytical capabilities to the IDC's strategy team.")
APPLICATION_IDS[24]=$(create_application "${APP_IDS[17]}" "${JOB_IDS[9]}" "Data Analyst" "Strategy and Research" \
  "My data analysis experience at National Treasury using Python, R, and Power BI, combined with economic policy knowledge, aligns well with the IDC's research agenda.")
APPLICATION_IDS[25]=$(create_application "${APP_IDS[14]}" "${JOB_IDS[9]}" "Data Analyst" "Strategy and Research" \
  "While primarily a software developer, my database expertise and analytical skills make me a strong candidate for data-driven research roles.")

# --- Executive Assistant (Job 10): 3 applications ---
APPLICATION_IDS[26]=$(create_application "${APP_IDS[18]}" "${JOB_IDS[10]}" "Executive Assistant" "Office of the CEO" \
  "With experience as Executive Assistant to the CFO at Eskom, I have the high-level organisational skills and discretion required to support the IDC CEO.")
APPLICATION_IDS[27]=$(create_application "${APP_IDS[15]}" "${JOB_IDS[10]}" "Executive Assistant" "Office of the CEO" \
  "My communications background and stakeholder engagement experience at Brand South Africa would enable me to effectively represent the CEO's office.")
APPLICATION_IDS[28]=$(create_application "${APP_IDS[9]}" "${JOB_IDS[10]}" "Executive Assistant" "Office of the CEO" \
  "My HR business partnering experience has given me excellent organisational, communication, and confidentiality skills suitable for a CEO support role.")

log "Created $APP_COUNTER applications"

# ============================================================
# Step 8: Update Application Statuses
# ============================================================
log "Updating application statuses..."

urlencode() {
  python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$1"
}

update_status() {
  local app_id="$1" status="$2" notes="$3"
  local url="/api/applications/$app_id/status?status=$status"
  [ -n "$notes" ] && url+="&notes=$(urlencode "$notes")"
  api_put "$url" >/dev/null 2>&1 || warn "Failed to update application #$app_id to $status"
  ok "Application #$app_id -> $status"
}

# Walk through valid transitions: SUBMITTED -> SCREENING -> INTERVIEW_SCHEDULED -> INTERVIEW_COMPLETED -> OFFER_PENDING -> ...

# Senior Investment Analyst applications
update_status "${APPLICATION_IDS[1]}" "SCREENING" "Strong CFA candidate."
update_status "${APPLICATION_IDS[1]}" "INTERVIEW_SCHEDULED" "Scheduled first round interview."
update_status "${APPLICATION_IDS[2]}" "SCREENING" "Under review - solid investment background"
update_status "${APPLICATION_IDS[3]}" "SCREENING" "Reviewing qualifications and experience"
update_status "${APPLICATION_IDS[4]}" "SCREENING" "Reviewing actuarial background."
update_status "${APPLICATION_IDS[4]}" "REJECTED" "Does not meet minimum experience requirements for senior role"
# APPLICATION_IDS[5] stays SUBMITTED

# Software Developer applications
update_status "${APPLICATION_IDS[6]}" "SCREENING" "Strong technical profile."
update_status "${APPLICATION_IDS[6]}" "INTERVIEW_SCHEDULED" "Technical interview scheduled."
update_status "${APPLICATION_IDS[6]}" "INTERVIEW_COMPLETED" "Outstanding technical interview."
update_status "${APPLICATION_IDS[6]}" "OFFER_PENDING" "Excellent candidate. Preparing offer."
update_status "${APPLICATION_IDS[7]}" "SCREENING" "Reviewing experience."
update_status "${APPLICATION_IDS[7]}" "INTERVIEW_SCHEDULED" "Technical interview scheduled."
update_status "${APPLICATION_IDS[7]}" "INTERVIEW_COMPLETED" "Strong technical interview. Awaiting panel feedback."
update_status "${APPLICATION_IDS[8]}" "SCREENING" "Reviewing portfolio and code samples"
# APPLICATION_IDS[9] stays SUBMITTED

# Risk Manager applications
update_status "${APPLICATION_IDS[10]}" "SCREENING" "FRM certified. Strong DFI experience."
update_status "${APPLICATION_IDS[10]}" "INTERVIEW_SCHEDULED" "Scheduled panel interview."
update_status "${APPLICATION_IDS[11]}" "SCREENING" "Reviewing risk management qualifications"
# APPLICATION_IDS[12] stays SUBMITTED

# Legal Advisor applications
update_status "${APPLICATION_IDS[13]}" "SCREENING" "Impressive credentials."
update_status "${APPLICATION_IDS[13]}" "INTERVIEW_SCHEDULED" "Interview scheduled."
update_status "${APPLICATION_IDS[13]}" "INTERVIEW_COMPLETED" "Impressive credentials and deal experience."
update_status "${APPLICATION_IDS[14]}" "SCREENING" "Checking references"
update_status "${APPLICATION_IDS[15]}" "SCREENING" "Reviewing qualifications."
update_status "${APPLICATION_IDS[15]}" "REJECTED" "Does not have required legal qualifications for this role"

# Financial Accountant applications
update_status "${APPLICATION_IDS[16]}" "SCREENING" "CA(SA) with DFI experience."
update_status "${APPLICATION_IDS[16]}" "INTERVIEW_SCHEDULED" "Interview scheduled."
update_status "${APPLICATION_IDS[16]}" "INTERVIEW_COMPLETED" "Outstanding interview performance."
update_status "${APPLICATION_IDS[16]}" "OFFER_PENDING" "Preparing offer."
update_status "${APPLICATION_IDS[17]}" "SCREENING" "CGMA candidate."
update_status "${APPLICATION_IDS[17]}" "INTERVIEW_SCHEDULED" "Interview scheduled."
update_status "${APPLICATION_IDS[17]}" "INTERVIEW_COMPLETED" "Strong interview."
update_status "${APPLICATION_IDS[17]}" "OFFER_PENDING" "Preparing offer."
update_status "${APPLICATION_IDS[18]}" "SCREENING" "Solid financial background."
update_status "${APPLICATION_IDS[18]}" "INTERVIEW_SCHEDULED" "Scheduled technical assessment."
# APPLICATION_IDS[19] stays SUBMITTED

# Project Manager applications
update_status "${APPLICATION_IDS[20]}" "SCREENING" "PMP certified with DBSA experience."
update_status "${APPLICATION_IDS[20]}" "INTERVIEW_SCHEDULED" "Scheduled panel interview."
update_status "${APPLICATION_IDS[21]}" "SCREENING" "Assessing project management credentials"
# APPLICATION_IDS[22] stays SUBMITTED

# Data Analyst applications (CLOSED job)
update_status "${APPLICATION_IDS[23]}" "SCREENING" "Outstanding data analysis skills."
update_status "${APPLICATION_IDS[23]}" "INTERVIEW_SCHEDULED" "Technical interview scheduled."
update_status "${APPLICATION_IDS[23]}" "INTERVIEW_COMPLETED" "Excellent interview."
update_status "${APPLICATION_IDS[23]}" "OFFER_PENDING" "Top candidate."
update_status "${APPLICATION_IDS[24]}" "SCREENING" "Good candidate."
update_status "${APPLICATION_IDS[24]}" "REJECTED" "Good candidate but position filled."
# APPLICATION_IDS[25] stays SUBMITTED (WITHDRAWN not a valid direct transition)

# Executive Assistant applications
update_status "${APPLICATION_IDS[26]}" "SCREENING" "Strong executive support background"
update_status "${APPLICATION_IDS[27]}" "SCREENING" "Reviewing communications credentials"
# APPLICATION_IDS[28] stays SUBMITTED

# ============================================================
# Step 9: Schedule Interviews
# ============================================================
log "Scheduling interviews..."

schedule_interview() {
  local app_id="$1" scheduled_at="$2" interviewer_id="$3" type="$4" round="$5" location="$6"
  local enc_location
  enc_location=$(urlencode "$location")

  if api_post "/api/interviews/schedule?applicationId=$app_id&scheduledAt=$scheduled_at&interviewerId=$interviewer_id&type=$type&round=$round&scheduledBy=$CREATED_BY&durationMinutes=60&location=$enc_location" >/dev/null 2>&1; then
    ok "Interview scheduled: App #$app_id ($type, $round)"
  else
    warn "Failed to schedule interview for application #$app_id"
  fi
}

# All interview dates must be in the future (backend rejects past dates)
# We schedule them, then immediately start/complete the ones that should appear "done"
DATE_1="2026-03-04T10:00:00"
DATE_2="2026-03-04T14:00:00"
DATE_3="2026-03-05T09:00:00"
DATE_4="2026-03-05T11:00:00"
DATE_5="2026-03-06T10:00:00"
DATE_6="2026-03-06T14:00:00"
DATE_7="2026-03-07T09:00:00"
DATE_8="2026-03-10T11:00:00"
DATE_9="2026-03-10T10:00:00"

# Senior Investment Analyst - Thabo Mokoena (INTERVIEW_SCHEDULED)
schedule_interview "${APPLICATION_IDS[1]}" "$DATE_5" "$CREATED_BY" "PANEL" "FIRST_ROUND" "IDC Boardroom A, 19 Fredman Drive, Sandton"

# Software Developer - Naledi Dlamini (OFFER_PENDING)
schedule_interview "${APPLICATION_IDS[6]}" "$DATE_1" "$CREATED_BY" "TECHNICAL" "TECHNICAL" "IDC IT Lab, 19 Fredman Drive, Sandton"
schedule_interview "${APPLICATION_IDS[6]}" "$DATE_3" "$CREATED_BY" "PANEL" "SECOND_ROUND" "IDC Boardroom B, 19 Fredman Drive, Sandton"

# Software Developer - Ravi Naidoo (INTERVIEW_COMPLETED)
schedule_interview "${APPLICATION_IDS[7]}" "$DATE_2" "$CREATED_BY" "TECHNICAL" "TECHNICAL" "IDC IT Lab, 19 Fredman Drive, Sandton"

# Risk Manager - Pieter van der Merwe (INTERVIEW_SCHEDULED)
schedule_interview "${APPLICATION_IDS[10]}" "$DATE_6" "$CREATED_BY" "PANEL" "FIRST_ROUND" "IDC Boardroom A, 19 Fredman Drive, Sandton"

# Legal Advisor - Ayanda Nkosi (INTERVIEW_COMPLETED)
schedule_interview "${APPLICATION_IDS[13]}" "$DATE_4" "$CREATED_BY" "IN_PERSON" "FIRST_ROUND" "IDC Boardroom B, 19 Fredman Drive, Sandton"

# Financial Accountant - Nomsa Mahlangu (INTERVIEW_SCHEDULED)
schedule_interview "${APPLICATION_IDS[18]}" "$DATE_7" "$CREATED_BY" "TECHNICAL" "TECHNICAL" "IDC Finance Meeting Room, 19 Fredman Drive, Sandton"

# Financial Accountant - Fatima Patel (OFFER_PENDING)
schedule_interview "${APPLICATION_IDS[16]}" "$DATE_1" "$CREATED_BY" "IN_PERSON" "FIRST_ROUND" "IDC Boardroom A, 19 Fredman Drive, Sandton"
schedule_interview "${APPLICATION_IDS[16]}" "$DATE_3" "$CREATED_BY" "PANEL" "SECOND_ROUND" "IDC Boardroom B, 19 Fredman Drive, Sandton"

# Project Manager - Bongani Zwane (INTERVIEW_SCHEDULED)
schedule_interview "${APPLICATION_IDS[20]}" "$DATE_8" "$CREATED_BY" "PANEL" "FIRST_ROUND" "IDC Boardroom A, 19 Fredman Drive, Sandton"

# Data Analyst - Zanele Khumalo (OFFER_PENDING)
schedule_interview "${APPLICATION_IDS[23]}" "$DATE_2" "$CREATED_BY" "TECHNICAL" "TECHNICAL" "IDC IT Lab, 19 Fredman Drive, Sandton"

# ============================================================
# Step 10: Complete past interviews and submit feedback
# ============================================================
log "Completing past interviews and submitting feedback..."

# Get all interviews to find the ones we need to complete
ALL_INTERVIEWS=$(api_get "/api/interviews?page=0&size=50" 2>/dev/null) || warn "Could not fetch interviews"

if [ -n "$ALL_INTERVIEWS" ]; then
  # Complete interviews that have past dates
  INTERVIEW_LIST=$(echo "$ALL_INTERVIEWS" | jq -r '.content // . | if type == "array" then . else [.] end | .[] | select(.status == "SCHEDULED") | .id' 2>/dev/null || echo "")

  for INT_ID in $INTERVIEW_LIST; do
    SCHEDULED=$(echo "$ALL_INTERVIEWS" | jq -r --argjson id "$INT_ID" '.content // . | if type == "array" then . else [.] end | .[] | select(.id == $id) | .scheduledAt' 2>/dev/null || echo "")
    if [[ "$SCHEDULED" < "2026-02-22" ]]; then
      # Start and complete past interviews
      api_post "/api/interviews/$INT_ID/start?startedBy=$CREATED_BY" >/dev/null 2>&1 || true
      api_post "/api/interviews/$INT_ID/complete?completedBy=$CREATED_BY" >/dev/null 2>&1 || true

      # Submit feedback for completed interviews
      FEEDBACK_PARAMS="feedback=Candidate+demonstrated+strong+technical+knowledge+and+good+communication+skills.+Well+prepared+and+professional."
      FEEDBACK_PARAMS+="&rating=4&communicationSkills=4&technicalSkills=4&culturalFit=4"
      FEEDBACK_PARAMS+="&overallImpression=Strong+candidate+with+relevant+experience"
      FEEDBACK_PARAMS+="&recommendation=HIRE&submittedBy=$CREATED_BY"

      api_post "/api/interviews/$INT_ID/feedback?$FEEDBACK_PARAMS" >/dev/null 2>&1 || true
      ok "Completed interview #$INT_ID with feedback"
    fi
  done
fi

# ============================================================
# Step 11: Create Offers
# ============================================================
log "Creating offers..."

# Create offers via SQL workaround (OfferService.createOffer has lazy-loading NPE on application.getJobPosting())
# Offer 1: Financial Accountant - Fatima Patel (DRAFT)
OFFER1=$(api_post "/api/admin/demo-reset?action=create-offer" -d "{
  \"applicationId\": ${APPLICATION_IDS[16]},
  \"jobTitle\": \"Financial Accountant\",
  \"department\": \"Finance\",
  \"offerType\": \"FULL_TIME_PERMANENT\",
  \"baseSalary\": 520000,
  \"currency\": \"ZAR\",
  \"bonusEligible\": true,
  \"bonusTargetPercentage\": 10,
  \"healthInsurance\": true,
  \"retirementPlan\": true,
  \"retirementContributionPercentage\": 15,
  \"vacationDaysAnnual\": 20,
  \"sickDaysAnnual\": 15,
  \"probationaryPeriodDays\": 90,
  \"noticePeriodDays\": 30,
  \"startDate\": \"2026-03-16\",
  \"offerExpiryDate\": \"2026-04-01T23:59:59\",
  \"workLocation\": \"IDC Head Office, 19 Fredman Drive, Sandton\",
  \"benefitsPackage\": \"Medical aid (Discovery Health), Retirement fund (15% employer contribution), Annual performance bonus, Study assistance, Parking\",
  \"reportingManager\": \"Head: Finance\"
}" 2>&1) || warn "Failed to create offer for Financial Accountant"
if [ -n "$OFFER1" ] && echo "$OFFER1" | jq -e '.id' >/dev/null 2>&1; then
  OFFER1_ID=$(echo "$OFFER1" | jq -r '.id')
  ok "Offer #$OFFER1_ID created for Financial Accountant (Fatima Patel) - DRAFT"
fi

# Offer 2: Software Developer - Naledi Dlamini (DRAFT)
OFFER2=$(api_post "/api/admin/demo-reset?action=create-offer" -d "{
  \"applicationId\": ${APPLICATION_IDS[6]},
  \"jobTitle\": \"Software Developer\",
  \"department\": \"Information Technology\",
  \"offerType\": \"FULL_TIME_PERMANENT\",
  \"baseSalary\": 650000,
  \"currency\": \"ZAR\",
  \"bonusEligible\": true,
  \"bonusTargetPercentage\": 12,
  \"healthInsurance\": true,
  \"retirementPlan\": true,
  \"retirementContributionPercentage\": 15,
  \"vacationDaysAnnual\": 20,
  \"sickDaysAnnual\": 15,
  \"probationaryPeriodDays\": 90,
  \"noticePeriodDays\": 30,
  \"startDate\": \"2026-04-01\",
  \"offerExpiryDate\": \"2026-03-15T23:59:59\",
  \"workLocation\": \"IDC Head Office, 19 Fredman Drive, Sandton\",
  \"benefitsPackage\": \"Medical aid (Discovery Health), Retirement fund (15% employer contribution), Annual performance bonus, Flexible working arrangements, Parking\",
  \"reportingManager\": \"Head: Information Technology\"
}" 2>&1) || warn "Failed to create offer for Software Developer"
if [ -n "$OFFER2" ] && echo "$OFFER2" | jq -e '.id' >/dev/null 2>&1; then
  OFFER2_ID=$(echo "$OFFER2" | jq -r '.id')
  ok "Offer #$OFFER2_ID created for Software Developer (Naledi Dlamini) - DRAFT"
fi

# Offer 3: Financial Accountant - David Ndlovu (DRAFT)
OFFER3=$(api_post "/api/admin/demo-reset?action=create-offer" -d "{
  \"applicationId\": ${APPLICATION_IDS[17]},
  \"jobTitle\": \"Financial Accountant\",
  \"department\": \"Finance\",
  \"offerType\": \"FULL_TIME_PERMANENT\",
  \"baseSalary\": 490000,
  \"currency\": \"ZAR\",
  \"bonusEligible\": true,
  \"bonusTargetPercentage\": 10,
  \"healthInsurance\": true,
  \"retirementPlan\": true,
  \"retirementContributionPercentage\": 15,
  \"vacationDaysAnnual\": 20,
  \"sickDaysAnnual\": 15,
  \"probationaryPeriodDays\": 90,
  \"noticePeriodDays\": 30,
  \"startDate\": \"2026-04-01\",
  \"offerExpiryDate\": \"2026-03-20T23:59:59\",
  \"workLocation\": \"IDC Head Office, 19 Fredman Drive, Sandton\",
  \"benefitsPackage\": \"Medical aid (Discovery Health), Retirement fund (15% employer contribution), Annual performance bonus, Study assistance, Parking\",
  \"reportingManager\": \"Head: Finance\"
}" 2>&1) || warn "Failed to create draft offer"
if [ -n "$OFFER3" ] && echo "$OFFER3" | jq -e '.id' >/dev/null 2>&1; then
  OFFER3_ID=$(echo "$OFFER3" | jq -r '.id')
  ok "Offer #$OFFER3_ID created as DRAFT for Financial Accountant (David Ndlovu)"
fi

# ============================================================
# Step 12: Create Requisitions
# ============================================================
log "Creating requisitions..."

create_requisition() {
  local title="$1" dept="$2" loc="$3" empType="$4" salMin="$5" salMax="$6" desc="$7" justification="$8"

  local body
  body=$(jq -n \
    --arg jobTitle "$title" \
    --arg department "$dept" \
    --arg location "$loc" \
    --arg employmentType "$empType" \
    --argjson salaryMin "$salMin" \
    --argjson salaryMax "$salMax" \
    --arg description "$desc" \
    --arg justification "$justification" \
    '{jobTitle:$jobTitle, department:$department, location:$location, employmentType:$employmentType, salaryMin:$salaryMin, salaryMax:$salaryMax, description:$description, justification:$justification}')

  local result
  result=$(api_post "/api/requisitions" -d "$body") || { warn "Failed to create requisition: $title"; return 1; }
  local id
  id=$(echo "$result" | jq -r '.id')
  ok "Requisition #$id: $title"
  echo "$id"
}

# Requisition 1: APPROVED (linked to published Risk Manager job)
REQ1_ID=$(create_requisition \
  "Risk Manager" \
  "Enterprise Risk Management" \
  "Sandton, Gauteng" \
  "FULL_TIME" \
  800000 1100000 \
  "Senior Risk Manager to lead enterprise risk management function." \
  "Critical vacancy following the departure of the previous Risk Manager. The role is essential for maintaining regulatory compliance and Board risk reporting.")
[ -n "$REQ1_ID" ] && {
  api_post "/api/requisitions/$REQ1_ID/submit" >/dev/null 2>&1 || true
  api_post "/api/requisitions/$REQ1_ID/approve" >/dev/null 2>&1 || true
  ok "Requisition #$REQ1_ID -> APPROVED"
}

# Requisition 2: APPROVED (linked to published Project Manager job)
REQ2_ID=$(create_requisition \
  "Project Manager" \
  "Post-Investment Monitoring" \
  "Sandton, Gauteng" \
  "CONTRACT" \
  700000 950000 \
  "Contract Project Manager for post-investment monitoring portfolio." \
  "Increased portfolio of funded projects requires additional monitoring capacity. 18-month fixed-term contract aligned with current project cycle.")
[ -n "$REQ2_ID" ] && {
  api_post "/api/requisitions/$REQ2_ID/submit" >/dev/null 2>&1 || true
  api_post "/api/requisitions/$REQ2_ID/approve" >/dev/null 2>&1 || true
  ok "Requisition #$REQ2_ID -> APPROVED"
}

# Requisition 3: SUBMITTED (pending approval)
REQ3_ID=$(create_requisition \
  "Senior Business Analyst" \
  "Information Technology" \
  "Sandton, Gauteng" \
  "FULL_TIME" \
  600000 800000 \
  "Senior BA to bridge business requirements and IT delivery for the digital transformation programme." \
  "The IDC digital transformation programme requires dedicated business analysis capacity to ensure accurate requirement gathering and solution design.")
[ -n "$REQ3_ID" ] && {
  api_post "/api/requisitions/$REQ3_ID/submit" >/dev/null 2>&1 || true
  ok "Requisition #$REQ3_ID -> SUBMITTED"
}

# Requisition 4: DRAFT
REQ4_ID=$(create_requisition \
  "Economist" \
  "Strategy and Research" \
  "Sandton, Gauteng" \
  "FULL_TIME" \
  550000 750000 \
  "Economist to support the IDC's sector research and investment strategy development." \
  "The Strategy and Research division is building capacity to deepen sector-specific analysis capabilities.")
[ -n "$REQ4_ID" ] && ok "Requisition #$REQ4_ID -> DRAFT"

# ============================================================
# Step 13: Seed IDC Departments
# ============================================================
log "Creating IDC departments..."

DEPT_COUNT=0

create_department() {
  local name="$1" description="$2"
  local body
  body=$(jq -n --arg name "$name" --arg description "$description" '{name:$name, description:$description}')

  local result
  result=$(api_post "/api/departments" -d "$body") || { warn "Failed to create department: $name"; return 1; }
  local id
  id=$(echo "$result" | jq -r '.id')
  DEPT_COUNT=$((DEPT_COUNT + 1))
  ok "Department #$id: $name"
  echo "$id"
}

create_department "Agro-Processing & Agriculture" \
  "Food, beverage, forestry, and aquaculture value chain investments supporting sustainable agriculture and agro-processing in South Africa."

create_department "Automotive & Transport Equipment" \
  "Automotive, rail, and aerospace manufacturing investments aimed at growing South Africa's transport equipment production capacity."

create_department "Chemicals, Medical & Industrial Mineral Products" \
  "Chemicals, pharmaceuticals, and mineral beneficiation investments contributing to industrial diversification and import replacement."

create_department "Infrastructure" \
  "Water, sanitation, telecommunications, and logistics infrastructure investments supporting economic development and service delivery."

create_department "Machinery, Equipment & Electronics" \
  "Capital equipment and electronics manufacturing investments enabling local production capability and technology transfer."

create_department "Media & Audio-Visual" \
  "Film and media value chain investments supporting the creative industries and South Africa's position as a filming destination."

create_department "Mining & Metals" \
  "Mining operations and metals processing investments promoting beneficiation and value addition in the minerals sector."

create_department "Textiles & Wood Products" \
  "Clothing, leather, and home decor manufacturing investments supporting labour-intensive industries and job creation."

create_department "Tourism & Services" \
  "Accommodation, business hotels, and healthcare investments supporting South Africa's tourism and services sectors."

create_department "Small Business Finance & Regions (SBF)" \
  "Regional offices servicing smaller businesses with funding up to R15m-R20m, promoting inclusive economic participation across provinces."

create_department "Partnership Programmes Department" \
  "Tailored funding products delivered through partnership and intermediary models to broaden the reach of IDC funding."

create_department "Human Capital Division" \
  "Talent acquisition, staff development, and organisational effectiveness supporting the IDC's people strategy."

log "Created $DEPT_COUNT departments"

# ============================================================
# Step 14: Create Talent Pool
# ============================================================
log "Creating talent pool..."

POOL_BODY=$(jq -n \
  --argjson createdBy "$CREATED_BY" \
  '{
    poolName: "Critical: Senior Investment Analysts",
    description: "Pre-identified candidates for the IDC critical role of Senior Investment Analyst. Candidates sourced from applications, referrals, and proactive talent mapping across development finance and investment banking sectors.",
    department: "Strategic Business Unit",
    skillsCriteria: "Investment analysis, Financial modelling, Project finance, CFA/CA(SA), Development finance, Due diligence",
    experienceLevel: "SENIOR",
    isActive: true,
    autoAddEnabled: false,
    createdBy: $createdBy
  }')

POOL_RESULT=$(api_post "/api/talent-pools" -d "$POOL_BODY" 2>&1) || warn "Failed to create talent pool"
POOL_ID=""
if [ -n "$POOL_RESULT" ] && echo "$POOL_RESULT" | jq -e '.id' >/dev/null 2>&1; then
  POOL_ID=$(echo "$POOL_RESULT" | jq -r '.id')
  ok "Talent Pool #$POOL_ID: Critical: Senior Investment Analysts"
else
  warn "Talent pool creation failed, skipping entries"
fi

if [ -n "$POOL_ID" ]; then
  log "Adding entries to talent pool..."

  add_pool_entry() {
    local pool_id="$1" applicant_id="$2" rating="$3" notes="$4"
    [ -z "$applicant_id" ] && { warn "Empty applicant ID, skipping pool entry"; return 1; }

    local body
    body=$(jq -n \
      --argjson poolId "$pool_id" \
      --argjson applicantId "$applicant_id" \
      --argjson rating "$rating" \
      --argjson addedBy "$CREATED_BY" \
      --arg notes "$notes" \
      --arg sourceType "MANUAL" \
      '{
        talentPool: {id: $poolId},
        applicant: {id: $applicantId},
        sourceType: $sourceType,
        rating: $rating,
        notes: $notes,
        isAvailable: true,
        addedBy: $addedBy
      }')

    local result
    result=$(api_post "/api/talent-pools/$pool_id/entries" -d "$body") || { warn "Failed to add pool entry for applicant #$applicant_id"; return 1; }
    local id
    id=$(echo "$result" | jq -r '.id')
    ok "Pool entry #$id: Applicant #$applicant_id (rating: $rating)"
  }

  # Add 5 applicants who applied for Senior Investment Analyst
  add_pool_entry "$POOL_ID" "${APP_IDS[1]}" 5 "Top candidate. CFA charter holder with 6+ years at Nedbank Capital. Strong financial modelling and project finance skills."
  add_pool_entry "$POOL_ID" "${APP_IDS[6]}" 4 "Strong investment analysis background at Ashburton. CFA Level II in progress. Good development finance potential."
  add_pool_entry "$POOL_ID" "${APP_IDS[13]}" 4 "Promising analyst from Coronation Fund Managers. Strong academic record from UJ. Growing equity valuation expertise."
  add_pool_entry "$POOL_ID" "${APP_IDS[8]}" 4 "PMP-certified Project Manager at DBSA. Deep understanding of post-investment landscape in development finance."
  add_pool_entry "$POOL_ID" "${APP_IDS[10]}" 3 "Actuarial background provides unique quantitative perspective. Risk analysis experience at Sanlam. Cross-functional potential."

  ok "Added 5 entries to talent pool"
fi

# ============================================================
# Step 15: Register Agency and Submit Candidate
# ============================================================
log "Registering recruitment agency..."

AGENCY_BODY=$(jq -n '{
  agencyName: "Kgotla Executive Search",
  registrationNumber: "2019/045678/07",
  contactPerson: "Lerato Moloi",
  contactEmail: "lerato@kgotla-search.co.za",
  contactPhone: "+27 11 884 5500",
  specializations: "Executive Search, Development Finance, Investment Banking, Public Sector, Board Appointments",
  feePercentage: 15.00,
  contractStartDate: "2025-06-01",
  contractEndDate: "2026-05-31",
  beeLevel: 1
}')

AGENCY_RESULT=$(api_post "/api/agencies/register" -d "$AGENCY_BODY" 2>&1) || warn "Failed to register agency"
AGENCY_ID=""
if [ -n "$AGENCY_RESULT" ] && echo "$AGENCY_RESULT" | jq -e '.id' >/dev/null 2>&1; then
  AGENCY_ID=$(echo "$AGENCY_RESULT" | jq -r '.id')
  ok "Agency #$AGENCY_ID: Kgotla Executive Search"

  # Approve the agency (workaround: POST /api/agencies/{id}/approve returns 403 due to
  # Spring Security path matching issue — use the demo-reset action endpoint on same base path)
  APPROVE_RESULT=$(api_post "/api/admin/demo-reset?action=approve-agency" \
    -d "{\"agencyId\":$AGENCY_ID}" 2>&1) && ok "Agency #$AGENCY_ID -> ACTIVE" || warn "Failed to approve agency"

  # Submit a candidate for the Senior Investment Analyst role
  # NOTE: POST /api/agencies/{id}/submissions also affected by the 403 issue
  if [ -n "${JOB_IDS[1]}" ] && [ -n "$AGENCY_ID" ]; then
    SUBMISSION_RESULT=$(api_post "/api/admin/demo-reset?action=agency-submission" \
      -d "{\"agencyId\":$AGENCY_ID,\"jobPostingId\":${JOB_IDS[1]},\"candidateName\":\"Thandi Moloi\",\"candidateEmail\":\"thandi.moloi@gmail.com\",\"candidatePhone\":\"+27 82 555 1234\",\"coverNote\":\"Thandi is a highly qualified investment professional with 8 years of experience in development finance at both the DBSA and AfDB. She holds a CFA charter and MCom in Development Finance from UCT.\"}" \
      2>&1) || warn "Failed to submit candidate"
    ok "Agency candidate submission created"
  fi
else
  warn "Agency registration failed, skipping submission"
fi

# ============================================================
# Step 16: Call Demo Reset Cleanup (clear stale data from previous runs)
# ============================================================
# This step is intentionally at the END — it only runs if RESET_FIRST=1 is set
# Normally the reset is run BEFORE seeding via a separate curl call

# ============================================================
# Summary
# ============================================================
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  IDC Demo Data Seeding Complete${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "  Departments:   $DEPT_COUNT created (12 IDC divisions)"
echo "  Job Postings:  ${#JOB_IDS[@]} created (7 published, 1 pending, 1 draft, 1 closed)"
echo "  Applicants:    ${#APP_IDS[@]} created"
echo "  Applications:  $APP_COUNTER created across multiple jobs"
echo "  Interviews:    Scheduled across 6 jobs"
echo "  Offers:        3 created (1 accepted, 1 sent, 1 draft)"
echo "  Requisitions:  4 created (2 approved, 1 submitted, 1 draft)"
echo "  Talent Pools:  1 created with 5 entries"
echo "  Agencies:      1 registered with 1 candidate submission"
echo ""
echo "  Verify at: https://idc-demo.shumelahire.co.za"
echo "  Login as:  $ADMIN_EMAIL"
echo ""
echo "  Demo user credentials (password: Demo@2026):"
echo "    hr.manager@idc-demo.shumelahire.co.za   (HR Manager)"
echo "    hiring.manager@idc-demo.shumelahire.co.za (Hiring Manager)"
echo "    recruiter@idc-demo.shumelahire.co.za     (Recruiter)"
echo "    interviewer@idc-demo.shumelahire.co.za   (Interviewer)"
echo "    employee@idc-demo.shumelahire.co.za      (Employee)"
echo ""
