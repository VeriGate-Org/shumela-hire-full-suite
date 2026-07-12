#!/usr/bin/env bash
#
# deploy-prod-runbook.sh — Step-by-step runbook for standing up the prod environment
#
# This is NOT meant to be run as a single script. It's a structured runbook
# with commands for each phase. Run sections individually, verify outputs,
# and proceed to the next phase.
#
# Prerequisites:
#   - AWS CLI v2 with alusa-dev profile configured
#   - .NET 9 SDK
#   - Node.js 20+
#   - aws-cdk installed globally (npm install -g aws-cdk)
#   - jq, curl, dig installed
#
set -euo pipefail

PROFILE="alusa-dev"
REGION="af-south-1"
DOMAIN="shumelahire.co.za"
HOSTED_ZONE_ID="Z10090221GJE31NDRDQD2"

echo "====================================================================="
echo " PHASE 1: Prerequisites & Discovery"
echo "====================================================================="
echo ""
echo "Run each command below individually."
echo ""

cat <<'PHASE1'

# 1.1 — Check existing OIDC role for GitHub Actions
aws iam list-roles \
  --query "Roles[?contains(RoleName,'github') || contains(RoleName,'deploy') || contains(RoleName,'GitHubActions')].[RoleName,Arn]" \
  --output table --profile alusa-dev

# 1.2 — List ACM certificates
echo "--- us-east-1 (CloudFront) ---"
aws acm list-certificates --region us-east-1 --profile alusa-dev \
  --query "CertificateSummaryList[?contains(DomainName,'shumelahire')].[DomainName,CertificateArn,Status]" \
  --output table

echo "--- af-south-1 (API Gateway / Regional) ---"
aws acm list-certificates --region af-south-1 --profile alusa-dev \
  --query "CertificateSummaryList[?contains(DomainName,'shumelahire')].[DomainName,CertificateArn,Status]" \
  --output table

# 1.3 — Verify Route 53 hosted zone
aws route53 get-hosted-zone --id Z10090221GJE31NDRDQD2 --profile alusa-dev \
  --query '{Name:HostedZone.Name, Id:HostedZone.Id, RecordCount:HostedZone.ResourceRecordSetCount, NameServers:DelegationSet.NameServers}'

# 1.4 — Check existing GitHub OIDC provider
aws iam list-open-id-connect-providers --profile alusa-dev

PHASE1

echo ""
echo "====================================================================="
echo " PHASE 1.5: GitHub Environment Setup"
echo "====================================================================="
echo ""

cat <<'PHASE1_5'

# In GitHub repo Settings → Environments → Create "prod"
# Add these secrets:
#
# AWS_ROLE_ARN           — ARN of the IAM role for OIDC (from step 1.1)
# CERTIFICATE_ARN        — af-south-1 cert ARN (from step 1.2, if exists)
# WILDCARD_CERTIFICATE_ARN — us-east-1 wildcard cert ARN (from step 1.2)
# CLAUDE_API_KEY         — Anthropic API key for AI features
# API_CERTIFICATE_ARN    — af-south-1 API cert ARN (from step 1.2, if exists)
#
# Note: If the existing OIDC role only trusts environment:dev, you need to
# update the trust policy to also allow environment:prod:
#
#   aws iam get-role --role-name <ROLE_NAME> --profile alusa-dev --query 'Role.AssumeRolePolicyDocument'
#
# The trust policy condition should include:
#   "StringEquals": {
#     "token.actions.githubusercontent.com:sub": [
#       "repo:VeriGate-Org/shumela-hire-full-suite:environment:dev",
#       "repo:VeriGate-Org/shumela-hire-full-suite:environment:prod"
#     ]
#   }
#
# Or use StringLike with a wildcard:
#   "StringLike": {
#     "token.actions.githubusercontent.com:sub": "repo:VeriGate-Org/shumela-hire-full-suite:*"
#   }

PHASE1_5

echo ""
echo "====================================================================="
echo " PHASE 2: CDK Bootstrap & Deploy Prod Stacks"
echo "====================================================================="
echo ""

cat <<'PHASE2'

# 2.1 — CDK Bootstrap (if not already done)
cd infra/cdk
cdk bootstrap aws://379992419891/af-south-1 -c env=prod --profile alusa-dev

# 2.2 — Build CDK
cd infra/cdk
dotnet build

# 2.3 — Deploy all prod stacks
# Replace certificate ARNs with actual values from Phase 1.2
cdk deploy --all --require-approval never \
  -c env=prod \
  -c domain=shumelahire.co.za \
  -c certificateArn="<AF-SOUTH-1-CERT-ARN>" \
  -c wildcardCertificateArn="<US-EAST-1-WILDCARD-CERT-ARN>" \
  -c apiCertificateArn="<AF-SOUTH-1-API-CERT-ARN>" \
  --profile alusa-dev

# 2.4 — Verify stacks created
aws cloudformation list-stacks --profile alusa-dev --region af-south-1 \
  --query "StackSummaries[?starts_with(StackName,'shumelahire-') && !starts_with(StackName,'shumelahire-dev') && StackStatus!='DELETE_COMPLETE'].[StackName,StackStatus,CreationTime]" \
  --output table

# 2.5 — Get prod outputs
echo "--- Cognito ---"
aws cloudformation describe-stacks --stack-name shumelahire-foundation \
  --query 'Stacks[0].Outputs' --output table --profile alusa-dev --region af-south-1

echo "--- CloudFront ---"
aws cloudformation describe-stacks --stack-name shumelahire-frontend \
  --query 'Stacks[0].Outputs' --output table --profile alusa-dev --region af-south-1

PHASE2

echo ""
echo "====================================================================="
echo " PHASE 2.5: Build & Deploy Frontend"
echo "====================================================================="
echo ""

cat <<'PHASE2_5'

# 2.5.1 — Get Cognito values from CDK outputs
POOL_ID=$(aws cloudformation describe-stacks --stack-name shumelahire-foundation \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text \
  --profile alusa-dev --region af-south-1)
CLIENT_ID=$(aws cloudformation describe-stacks --stack-name shumelahire-foundation \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text \
  --profile alusa-dev --region af-south-1)
COGNITO_DOMAIN=$(aws cloudformation describe-stacks --stack-name shumelahire-foundation \
  --query 'Stacks[0].Outputs[?OutputKey==`CognitoDomain`].OutputValue' --output text \
  --profile alusa-dev --region af-south-1)

echo "Pool ID:       $POOL_ID"
echo "Client ID:     $CLIENT_ID"
echo "Cognito Domain: $COGNITO_DOMAIN"

# 2.5.2 — Build frontend with prod config
cd /path/to/shumela-hire-full-suite
STATIC_EXPORT=true \
NEXT_PUBLIC_API_URL="" \
NEXT_PUBLIC_APP_URL="https://shumelahire.co.za" \
NEXT_PUBLIC_COGNITO_USER_POOL_ID="$POOL_ID" \
NEXT_PUBLIC_COGNITO_CLIENT_ID="$CLIENT_ID" \
NEXT_PUBLIC_COGNITO_DOMAIN="$COGNITO_DOMAIN" \
NEXT_PUBLIC_REGION="af-south-1" \
npm run build

# 2.5.3 — Deploy to prod S3
aws s3 sync out/_next/ s3://shumelahire-frontend/_next/ \
  --cache-control "public, max-age=31536000, immutable" \
  --region af-south-1 --profile alusa-dev

aws s3 sync out/ s3://shumelahire-frontend/ --delete \
  --cache-control "no-cache, no-store, must-revalidate" \
  --exclude "_next/*" \
  --region af-south-1 --profile alusa-dev

aws s3 sync out/_next/ s3://shumelahire-frontend/_next/ --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --region af-south-1 --profile alusa-dev

# 2.5.4 — Invalidate CloudFront
DIST_ID=$(aws cloudformation describe-stacks --stack-name shumelahire-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' --output text \
  --profile alusa-dev --region af-south-1)

aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" --profile alusa-dev

PHASE2_5

echo ""
echo "====================================================================="
echo " PHASE 3: Route 53 DNS Migration"
echo "====================================================================="
echo ""

cat <<'PHASE3'

# 3.1 — Add email/marketing records to Route 53
# (CDK already creates the apex A and wildcard A pointing to CloudFront)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z10090221GJE31NDRDQD2 \
  --change-batch file://scripts/route53-email-records.json \
  --profile alusa-dev

# 3.2 — Verify records exist in Route 53
aws route53 list-resource-record-sets \
  --hosted-zone-id Z10090221GJE31NDRDQD2 \
  --profile alusa-dev \
  --query 'ResourceRecordSets[?Type!=`NS` && Type!=`SOA`].[Name,Type,ResourceRecords[0].Value]' \
  --output table

# 3.3 — Get Route 53 nameservers
aws route53 get-hosted-zone --id Z10090221GJE31NDRDQD2 --profile alusa-dev \
  --query 'DelegationSet.NameServers' --output text

# 3.4 — Query Route 53 NS directly to validate records BEFORE switching
# Replace ns-XXX with actual NS values from step 3.3
NS=$(aws route53 get-hosted-zone --id Z10090221GJE31NDRDQD2 --profile alusa-dev \
  --query 'DelegationSet.NameServers[0]' --output text)

echo "Querying $NS directly..."
dig @"$NS" shumelahire.co.za MX +short
dig @"$NS" mail.shumelahire.co.za A +short
dig @"$NS" shumelahire.co.za TXT +short
dig @"$NS" shumelahire.co.za A +short
dig @"$NS" uthukela.shumelahire.co.za A +short

# 3.5 — BEFORE switching NS: Lower TTLs on Xneelo
# Do this in konsoleH (Xneelo control panel) a few days before the switch.
# Set all record TTLs to 300 seconds.

# 3.6 — Switch nameservers at registrar (Xneelo/konsoleH)
# Update the domain's NS records to the 4 Route 53 NS values from step 3.3.
# This is done in the registrar's control panel, NOT via CLI.

# 3.7 — Monitor propagation
echo "Checking public DNS propagation..."
for host in shumelahire.co.za mail.shumelahire.co.za www.shumelahire.co.za uthukela.shumelahire.co.za; do
  echo "--- $host ---"
  dig +short "$host" A
done
dig +short shumelahire.co.za MX
dig +short shumelahire.co.za TXT

PHASE3

echo ""
echo "====================================================================="
echo " PHASE 4: Seed uThukela Tenant"
echo "====================================================================="
echo ""

cat <<'PHASE4'

# 4.1 — Run the prod seeding script
# This creates the platform admin, tenant, users, and employee data.
export AWS_REGION=af-south-1
export AWS_PROFILE=alusa-dev
export PLATFORM_ADMIN_PASSWORD="<SET_A_SECURE_PASSWORD>"
export TENANT_ADMIN_PASSWORD="Demo@2026!"

# If DNS is not yet migrated, use the CloudFront domain directly:
DIST_DOMAIN=$(aws cloudformation describe-stacks --stack-name shumelahire-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' --output text \
  --profile alusa-dev --region af-south-1)
export API_BASE_URL="https://${DIST_DOMAIN}"

./scripts/seed-prod-uthukela.sh

# 4.2 — Verify login
# Once DNS is migrated:
#   https://uthukela.shumelahire.co.za/login
# Before DNS migration (using CloudFront domain):
#   https://${DIST_DOMAIN}/login

PHASE4

echo ""
echo "====================================================================="
echo " PHASE 5: Verification Checklist"
echo "====================================================================="
echo ""

cat <<'PHASE5'

# Run these checks after everything is deployed and DNS is switched:

echo "=== Stack Status ==="
aws cloudformation list-stacks --profile alusa-dev --region af-south-1 \
  --query "StackSummaries[?starts_with(StackName,'shumelahire') && !starts_with(StackName,'shumelahire-dev') && StackStatus!='DELETE_COMPLETE'].[StackName,StackStatus]" \
  --output table

echo "=== DNS Resolution ==="
dig +short uthukela.shumelahire.co.za A
dig +short mail.shumelahire.co.za A
dig +short www.shumelahire.co.za A
dig +short dev.shumelahire.co.za A
dig +short shumelahire.co.za MX

echo "=== HTTP Checks ==="
curl -s -o /dev/null -w "uthukela.shumelahire.co.za: %{http_code}\n" https://uthukela.shumelahire.co.za
curl -s -o /dev/null -w "dev.shumelahire.co.za: %{http_code}\n" https://dev.shumelahire.co.za
curl -s -o /dev/null -w "www.shumelahire.co.za: %{http_code}\n" https://www.shumelahire.co.za

echo "=== API Health ==="
curl -s https://shumelahire.co.za/api/actuator/health | jq .

echo "=== CloudFront Distributions ==="
aws cloudfront list-distributions --profile alusa-dev \
  --query "DistributionList.Items[?contains(Aliases.Items[0],'shumelahire')].[Id,DomainName,Aliases.Items]" \
  --output table

PHASE5

echo ""
echo "====================================================================="
echo " Done — Refer to individual phases above."
echo "====================================================================="
