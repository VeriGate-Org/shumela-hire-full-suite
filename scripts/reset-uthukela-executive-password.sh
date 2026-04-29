#!/usr/bin/env bash
#
# reset-uthukela-executive-password.sh — Reset the uThukela executive
# Cognito user back to the documented demo password (Demo@2026!).
#
# Run as a one-shot remediation on the dev deploy workflow when the
# executive demo account drifts out of the documented state. Idempotent:
# admin-set-user-password is unconditional, so re-runs are no-ops.
#
# Resolves the user pool ID from the foundation CloudFormation stack,
# so no manual configuration is required when run from CI.
#
# Usage (CI):
#   AWS_REGION=af-south-1 STACK_PREFIX=shumelahire-dev \
#     ./scripts/reset-uthukela-executive-password.sh
#
# Usage (local, with COGNITO_USER_POOL_ID already set):
#   COGNITO_USER_POOL_ID=af-south-1_XXXXXXX \
#     ./scripts/reset-uthukela-executive-password.sh
#
set -euo pipefail

AWS_REGION="${AWS_REGION:-af-south-1}"
STACK_PREFIX="${STACK_PREFIX:-shumelahire-dev}"
DEMO_PASSWORD="${DEMO_PASSWORD:-Demo@2026!}"
USERNAME="${USERNAME:-executive@uthukela.shumelahire.co.za}"

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
echo " Reset uThukela executive demo password"
echo "=========================================="
echo " Pool:     ${COGNITO_USER_POOL_ID}"
echo " Region:   ${AWS_REGION}"
echo " Username: ${USERNAME}"
echo "=========================================="

if ! aws cognito-idp admin-get-user \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$USERNAME" \
    --region "$AWS_REGION" >/dev/null 2>&1; then
    echo "WARN: ${USERNAME} does not exist in pool ${COGNITO_USER_POOL_ID} — skipping (run seed-uthukela-water-cognito-users.sh first)" >&2
    exit 0
fi

aws cognito-idp admin-set-user-password \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$USERNAME" \
    --password "$DEMO_PASSWORD" \
    --permanent \
    --region "$AWS_REGION"

aws cognito-idp admin-update-user-attributes \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$USERNAME" \
    --user-attributes Name=email_verified,Value=true \
    --region "$AWS_REGION"

aws cognito-idp admin-add-user-to-group \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$USERNAME" \
    --group-name "EXECUTIVE" \
    --region "$AWS_REGION" 2>/dev/null || \
    echo "  Group EXECUTIVE membership already in place (or group missing)"

echo "OK: ${USERNAME} password reset to documented demo value."
