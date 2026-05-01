#!/usr/bin/env bash
#
# reset-uthukela-demo-passwords.sh — Reset all uThukela demo Cognito users
# back to the documented demo password (Demo@2026!) and re-assert their
# group memberships.
#
# Run as a one-shot remediation on the dev deploy workflow when demo
# accounts drift out of the documented state. Idempotent:
# admin-set-user-password is unconditional, so re-runs are no-ops.
#
# Resolves the user pool ID from the foundation CloudFormation stack,
# so no manual configuration is required when run from CI.
#
# Usage (CI):
#   AWS_REGION=af-south-1 STACK_PREFIX=shumelahire-dev \
#     ./scripts/reset-uthukela-demo-passwords.sh
#
# Usage (local, with COGNITO_USER_POOL_ID already set):
#   COGNITO_USER_POOL_ID=af-south-1_XXXXXXX \
#     ./scripts/reset-uthukela-demo-passwords.sh
#
set -euo pipefail

AWS_REGION="${AWS_REGION:-af-south-1}"
STACK_PREFIX="${STACK_PREFIX:-shumelahire-dev}"
DEMO_PASSWORD="${DEMO_PASSWORD:-Demo@2026!}"

# email:GROUP pairs covering every uThukela demo account seeded by
# scripts/seed-uthukela-water-cognito-users.sh. Keep in sync with that script.
DEMO_USERS=(
    "admin@uthukela.shumelahire.co.za:ADMIN"
    "hr.manager@uthukela.shumelahire.co.za:HR_MANAGER"
    "executive@uthukela.shumelahire.co.za:EXECUTIVE"
    "hiring.manager@uthukela.shumelahire.co.za:HIRING_MANAGER"
    "line.manager@uthukela.shumelahire.co.za:LINE_MANAGER"
    "employee@uthukela.shumelahire.co.za:EMPLOYEE"
    "recruiter@uthukela.shumelahire.co.za:RECRUITER"
    "interviewer@uthukela.shumelahire.co.za:INTERVIEWER"
    "applicant@uthukela.shumelahire.co.za:APPLICANT"
)

if [ -z "${COGNITO_USER_POOL_ID:-}" ]; then
    COGNITO_USER_POOL_ID=$(aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}-foundation" \
        --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text 2>/dev/null || echo "")
fi

if [ -z "$COGNITO_USER_POOL_ID" ] || [ "$COGNITO_USER_POOL_ID" = "None" ]; then
    echo "ERROR: Could not resolve UserPoolId from ${STACK_PREFIX}-foundation outputs" >&2
    exit 1
fi

echo "=========================================="
echo " Reset uThukela demo passwords"
echo "=========================================="
echo " Pool:    ${COGNITO_USER_POOL_ID}"
echo " Region:  ${AWS_REGION}"
echo " Users:   ${#DEMO_USERS[@]}"
echo "=========================================="

reset_user() {
    local username="$1"
    local group="$2"

    if ! aws cognito-idp admin-get-user \
        --user-pool-id "$COGNITO_USER_POOL_ID" \
        --username "$username" \
        --region "$AWS_REGION" >/dev/null 2>&1; then
        echo "  SKIP ${username} — user does not exist (run seed-uthukela-water-cognito-users.sh first)"
        return 0
    fi

    aws cognito-idp admin-set-user-password \
        --user-pool-id "$COGNITO_USER_POOL_ID" \
        --username "$username" \
        --password "$DEMO_PASSWORD" \
        --permanent \
        --region "$AWS_REGION"

    aws cognito-idp admin-update-user-attributes \
        --user-pool-id "$COGNITO_USER_POOL_ID" \
        --username "$username" \
        --user-attributes Name=email_verified,Value=true \
        --region "$AWS_REGION"

    aws cognito-idp admin-add-user-to-group \
        --user-pool-id "$COGNITO_USER_POOL_ID" \
        --username "$username" \
        --group-name "$group" \
        --region "$AWS_REGION" 2>/dev/null || \
        echo "    (group ${group} membership already in place or group missing)"

    echo "  OK   ${username} -> ${group}"
}

failures=0
for entry in "${DEMO_USERS[@]}"; do
    username="${entry%%:*}"
    group="${entry##*:}"
    if ! reset_user "$username" "$group"; then
        failures=$((failures + 1))
    fi
done

if [ "$failures" -gt 0 ]; then
    echo "WARN: ${failures} user(s) failed to reset" >&2
    exit 1
fi

echo "Done. All ${#DEMO_USERS[@]} demo users reset to the documented password."
