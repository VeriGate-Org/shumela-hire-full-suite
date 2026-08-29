using Amazon.CDK;
using Amazon.CDK.AWS.DynamoDB;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.Events;
using Amazon.CDK.AWS.Events.Targets;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Cognito;
using Constructs;
using System.Collections.Generic;

// Aliases to resolve ambiguous types between Apigatewayv2, Logs, and Events.Targets
using LogGroup = Amazon.CDK.AWS.Logs.LogGroup;
using LogGroupProps = Amazon.CDK.AWS.Logs.LogGroupProps;
using RetentionDays = Amazon.CDK.AWS.Logs.RetentionDays;
using ApigwCfnIntegration = Amazon.CDK.AWS.Apigatewayv2.CfnIntegration;
using ApigwCfnIntegrationProps = Amazon.CDK.AWS.Apigatewayv2.CfnIntegrationProps;
using CfnApi = Amazon.CDK.AWS.Apigatewayv2.CfnApi;
using CfnApiProps = Amazon.CDK.AWS.Apigatewayv2.CfnApiProps;
using CfnRoute = Amazon.CDK.AWS.Apigatewayv2.CfnRoute;
using CfnRouteProps = Amazon.CDK.AWS.Apigatewayv2.CfnRouteProps;
using CfnStage = Amazon.CDK.AWS.Apigatewayv2.CfnStage;
using CfnStageProps = Amazon.CDK.AWS.Apigatewayv2.CfnStageProps;
using CfnAuthorizer = Amazon.CDK.AWS.Apigatewayv2.CfnAuthorizer;
using CfnAuthorizerProps = Amazon.CDK.AWS.Apigatewayv2.CfnAuthorizerProps;

namespace ShumelaHire.Infra;

public class ShumelaHireServerlessStack : Stack
{
    public Table DataTable { get; }
    public Function ApiFunction { get; }
    public CfnApi HttpApi { get; }

    public ShumelaHireServerlessStack(Construct scope, string id, EnvironmentConfig config,
        ShumelaHireFoundationStack foundation, IStackProps? props = null) : base(scope, id, props)
    {
        AddDependency(foundation);
        var prefix = config.Prefix;

        // ── DynamoDB Single Table ──────────────────────────────────────────────
        DataTable = new Table(this, "DataTable", new TableProps
        {
            TableName = $"{prefix}-data",
            PartitionKey = new Attribute { Name = "PK", Type = AttributeType.STRING },
            SortKey = new Attribute { Name = "SK", Type = AttributeType.STRING },
            BillingMode = BillingMode.PAY_PER_REQUEST,
            PointInTimeRecovery = true,
            Stream = StreamViewType.NEW_AND_OLD_IMAGES,
            TimeToLiveAttribute = "ttl",
            RemovalPolicy = config.IsProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
        });

        // ── 8 Overloaded GSIs ──────────────────────────────────────────────────
        for (int i = 1; i <= 8; i++)
        {
            DataTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
            {
                IndexName = $"GSI{i}",
                PartitionKey = new Attribute { Name = $"GSI{i}PK", Type = AttributeType.STRING },
                SortKey = new Attribute { Name = $"GSI{i}SK", Type = AttributeType.STRING },
                ProjectionType = ProjectionType.ALL
            });
        }

        // ── Lambda Function (Spring Boot container image) ──────────────────────
        var lambdaLogGroup = new LogGroup(this, "ApiLambdaLogGroup", new LogGroupProps
        {
            LogGroupName = $"/aws/lambda/{prefix}-api",
            Retention = config.IsProduction ? RetentionDays.THREE_MONTHS : RetentionDays.ONE_WEEK,
            RemovalPolicy = RemovalPolicy.DESTROY
        });

        var lambdaRole = new Role(this, "ApiLambdaRole", new RoleProps
        {
            RoleName = $"{prefix}-api-lambda-role",
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            ManagedPolicies = new[]
            {
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            }
        });

        // DynamoDB permissions
        DataTable.GrantReadWriteData(lambdaRole);

        // Grant explicit GSI query/scan permissions (GrantReadWriteData only covers the main table)
        lambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Actions = new[] { "dynamodb:Query", "dynamodb:Scan" },
            Resources = new[] { $"{DataTable.TableArn}/index/*" }
        }));

        // S3 permissions (documents + uploads buckets)
        foundation.DocumentsBucket.GrantReadWrite(lambdaRole);
        foundation.UploadsBucket.GrantReadWrite(lambdaRole);

        // SQS permissions
        foundation.NotificationQueue.GrantSendMessages(lambdaRole);

        // Cognito admin permissions
        // AdminSetUserPassword, AdminDisableUser, AdminEnableUser, GetGroup, and
        // CreateGroup were missing here despite CognitoAdminService actually
        // calling all five — found via a live AccessDenied on candidate
        // registration ("...is not authorized to perform:
        // cognito-idp:AdminSetUserPassword..."), which meant every applicant
        // registration failed at the Cognito user-creation step, unconditionally.
        lambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Actions = new[]
            {
                "cognito-idp:AdminCreateUser",
                "cognito-idp:AdminDeleteUser",
                "cognito-idp:AdminGetUser",
                "cognito-idp:AdminUpdateUserAttributes",
                "cognito-idp:AdminAddUserToGroup",
                "cognito-idp:AdminRemoveUserFromGroup",
                "cognito-idp:AdminListGroupsForUser",
                "cognito-idp:AdminSetUserPassword",
                "cognito-idp:AdminDisableUser",
                "cognito-idp:AdminEnableUser",
                "cognito-idp:GetGroup",
                "cognito-idp:CreateGroup",
                "cognito-idp:ListUsers",
                "cognito-idp:ListUsersInGroup"
            },
            Resources = new[] { foundation.UserPool.UserPoolArn }
        }));

        // Secrets Manager permissions
        lambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Actions = new[] { "secretsmanager:GetSecretValue" },
            Resources = new[]
            {
                foundation.JwtSecret.SecretArn,
                foundation.EncryptionKeySecret.SecretArn,
                foundation.AiKeysSecret.SecretArn,
                $"arn:aws:secretsmanager:{config.Region}:*:secret:shumelahire/{config.EnvironmentName}/*"
            }
        }));

        // SES permissions
        lambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Actions = new[] { "ses:SendEmail", "ses:SendRawEmail" },
            Resources = new[] { "*" }
        }));

        // Bedrock: invoke Anthropic models for CV screening and candidate ranking.
        //
        // Both ARN forms are required. In af-south-1 an on-demand call against a bare
        // foundation-model id is rejected, and the request resolves through a cross-region
        // inference profile instead — so granting only the foundation-model ARN produces an
        // AccessDenied that reads like a missing permission rather than a wrong model id.
        // TextGate hit exactly this; the pattern below is the one running in its production stack.
        lambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = new[] { "bedrock:InvokeModel" },
            Resources = new[]
            {
                "arn:aws:bedrock:*::foundation-model/anthropic.*",
                $"arn:aws:bedrock:*:{this.Account}:inference-profile/global.anthropic.*"
            }
        }));

        // Bedrock checks model subscription status through Marketplace on first invocation.
        lambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = new[] { "aws-marketplace:ViewSubscriptions", "aws-marketplace:Subscribe" },
            Resources = new[] { "*" }
        }));

        // Container image deployment bypasses Lambda's 250 MiB zip size limit
        // (10 GB image limit). CDK builds & pushes the image to ECR automatically.
        ApiFunction = new DockerImageFunction(this, "ApiFunction", new DockerImageFunctionProps
        {
            Code = DockerImageCode.FromImageAsset("../../backend", new AssetImageCodeProps
            {
                File = "Dockerfile.lambda"
            }),
            MemorySize = 3008,
            Timeout = Duration.Seconds(120),
            Role = lambdaRole,
            LogGroup = lambdaLogGroup,
            Environment = new Dictionary<string, string>
            {
                ["DYNAMODB_TABLE_NAME"] = DataTable.TableName,
                ["SPRING_PROFILES_ACTIVE"] = $"{config.SpringProfile},lambda",
                ["MAIN_CLASS"] = "com.arthmatic.shumelahire.ShumelaHireApplication",
                ["COGNITO_USER_POOL_ID"] = foundation.UserPool.UserPoolId,
                ["COGNITO_CLIENT_ID"] = foundation.AppClient.UserPoolClientId,
                ["COGNITO_DOMAIN"] = $"{config.CognitoDomainPrefix}.auth.{config.Region}.amazoncognito.com",
                ["COGNITO_ISSUER_URI"] = $"https://cognito-idp.{config.Region}.amazonaws.com/{foundation.UserPool.UserPoolId}",
                ["S3_DOCUMENTS_BUCKET"] = foundation.DocumentsBucket.BucketName,
                ["S3_UPLOADS_BUCKET"] = foundation.UploadsBucket.BucketName,
                ["SQS_NOTIFICATION_QUEUE_URL"] = foundation.NotificationQueue.QueueUrl,
                ["APP_URL"] = config.UiUrl,
                ["API_URL"] = config.ApiUrl,
                // Mail. Without these the bean is NoOpEmailService, which logs, sends nothing and
                // returns true — so every notification this platform has ever "sent" from a
                // deployed environment was discarded, and the caller was told it succeeded.
                ["SES_ENABLED"] = "true",
                ["SES_REGION"] = config.Region,
                ["SES_FROM_EMAIL"] = foundation.MailFromAddress,
                ["SES_FROM_NAME"] = "ShumelaHire",
                // Domains this environment may send to; empty means everywhere.
                //
                // Set, because the tenant data is seeded: IDC carries 58 demo applicants at
                // invented gmail, outlook and yahoo addresses, and any status change on that data
                // would email a mailbox that does not exist. Hard bounces at Gmail are the fastest
                // way to have SES pause sending on a domain verified an hour ago. A blocked
                // address is logged and reported as a failure, never quietly dropped.
                //
                // Empty this (`--context sesAllowedRecipientDomains=`) once the tenant's people
                // are real.
                ["SES_ALLOWED_RECIPIENT_DOMAINS"] =
                    ContextFlag(this, "sesAllowedRecipientDomains", "arthmatic.co.za"),
                ["JWT_SECRET_ARN"] = foundation.JwtSecret.SecretArn,
                ["ENCRYPTION_KEY_ARN"] = foundation.EncryptionKeySecret.SecretArn,
                ["AI_KEYS_SECRET_ARN"] = foundation.AiKeysSecret.SecretArn,
                ["DOCUSIGN_SECRET_ARN"] = foundation.DocusignSecret.SecretArn,
                ["MICROSOFT_SECRET_ARN"] = foundation.MicrosoftSecret.SecretArn,
                ["JOB_BOARDS_SECRET_ARN"] = foundation.JobBoardsSecret.SecretArn,
                ["SAP_PAYROLL_SECRET_ARN"] = foundation.SapPayrollSecret.SecretArn,
                ["AWS_REGION_OVERRIDE"] = config.Region,
                // Feature toggles: each integration stays off until its secret is populated
                // with real credentials AND the corresponding *Enabled context flag is passed
                // at deploy time, e.g. `cdk deploy --context aiEnabled=true --context aiProvider=openai`.
                ["AI_ENABLED"] = ContextFlag(this, "aiEnabled", "false"),
                ["AI_PROVIDER"] = ContextFlag(this, "aiProvider", "mock"),
                // Cross-region inference profile, not a bare model id — see the Bedrock policy above.
                ["BEDROCK_MODEL"] = ContextFlag(this, "bedrockModel",
                    "global.anthropic.claude-sonnet-4-5-20250929-v1:0"),
                // "local" runs simulated, non-binding signatures with no external call.
                // "docusign" additionally requires the DocuSign secret to be populated —
                // its credentials arrive via DOCUSIGN_SECRET_ARN, never as plaintext here.
                ["ESIGNATURE_PROVIDER"] = ContextFlag(this, "esignatureProvider", "local"),
                ["SAP_PAYROLL_ENABLED"] = ContextFlag(this, "sapPayrollEnabled", "false"),
                ["MICROSOFT_ENABLED"] = ContextFlag(this, "microsoftEnabled", "false"),
                ["LINKEDIN_ENABLED"] = ContextFlag(this, "linkedinJobBoardEnabled", "false"),
                ["INDEED_ENABLED"] = ContextFlag(this, "indeedEnabled", "false"),
                ["PNET_ENABLED"] = ContextFlag(this, "pnetEnabled", "false"),
                ["CAREER_JUNCTION_ENABLED"] = ContextFlag(this, "careerJunctionEnabled", "false"),
                // Per-board publishing mode, mirroring ESIGNATURE_PROVIDER above.
                // "live" posts through the board's API and needs its key.
                // "simulated" runs the full publish/sync/takedown path against an
                // in-process sandbox, for environments with no credentials.
                // Engagement figures in that mode are modelled, not measured.
                ["LINKEDIN_MODE"] = ContextFlag(this, "linkedinJobBoardMode", "live"),
                ["INDEED_MODE"] = ContextFlag(this, "indeedMode", "live"),
                ["PNET_MODE"] = ContextFlag(this, "pnetMode", "live"),
                ["CAREER_JUNCTION_MODE"] = ContextFlag(this, "careerJunctionMode", "live"),
                // Which tenants the simulated boards apply to. The modes above
                // do nothing without this: a shared deployment must not hand a
                // paying tenant a posting that claims to be live and is not, so
                // every tenant not listed keeps the manual-posting behaviour.
                ["JOB_BOARD_SIMULATED_TENANTS"] =
                    ContextFlag(this, "jobBoardSimulatedTenants", "")
            },
            CurrentVersionOptions = new VersionOptions
            {
                RemovalPolicy = RemovalPolicy.RETAIN,
                Description = "Deployed version"
            }
        });
        var lambdaVersion = ApiFunction.CurrentVersion;

        // ── API Gateway HTTP API ───────────────────────────────────────────────
        HttpApi = new CfnApi(this, "HttpApi", new CfnApiProps
        {
            Name = $"{prefix}-api",
            ProtocolType = "HTTP",
            CorsConfiguration = new CfnApi.CorsProperty
            {
                AllowOrigins = config.ApiCorsOrigins,
                AllowMethods = new[] { "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS" },
                AllowHeaders = new[] { "Content-Type", "Authorization", "X-Tenant-Id", "X-Correlation-Id" },
                MaxAge = 3600,
                AllowCredentials = true
            }
        });

        // Cognito JWT Authorizer
        var authorizer = new CfnAuthorizer(this, "JwtAuthorizer", new CfnAuthorizerProps
        {
            ApiId = HttpApi.Ref,
            AuthorizerType = "JWT",
            Name = "CognitoJwtAuthorizer",
            IdentitySource = new[] { "$request.header.Authorization" },
            JwtConfiguration = new CfnAuthorizer.JWTConfigurationProperty
            {
                Audience = new[] { foundation.AppClient.UserPoolClientId },
                Issuer = $"https://cognito-idp.{config.Region}.amazonaws.com/{foundation.UserPool.UserPoolId}"
            }
        });

        // Lambda integration (using published version)
        var integration = new ApigwCfnIntegration(this, "LambdaIntegration", new ApigwCfnIntegrationProps
        {
            ApiId = HttpApi.Ref,
            IntegrationType = "AWS_PROXY",
            IntegrationUri = lambdaVersion.FunctionArn,
            PayloadFormatVersion = "2.0",
            TimeoutInMillis = 30000
        });

        // Route: ANY /api/{proxy+} (authenticated)
        new CfnRoute(this, "ApiRoute", new CfnRouteProps
        {
            ApiId = HttpApi.Ref,
            RouteKey = "ANY /api/{proxy+}",
            Target = $"integrations/{integration.Ref}",
            AuthorizationType = "JWT",
            AuthorizerId = authorizer.Ref
        });

        // Route: ANY /api/public/{proxy+} (unauthenticated)
        new CfnRoute(this, "PublicApiRoute", new CfnRouteProps
        {
            ApiId = HttpApi.Ref,
            RouteKey = "ANY /api/public/{proxy+}",
            Target = $"integrations/{integration.Ref}",
            AuthorizationType = "NONE"
        });

        // Route: GET /api/actuator/health (unauthenticated, for health checks)
        new CfnRoute(this, "HealthRoute", new CfnRouteProps
        {
            ApiId = HttpApi.Ref,
            RouteKey = "GET /api/actuator/health",
            Target = $"integrations/{integration.Ref}",
            AuthorizationType = "NONE"
        });

        // Route: ANY /api/ads/{proxy+} (unauthenticated, public job ads)
        new CfnRoute(this, "AdsRoute", new CfnRouteProps
        {
            ApiId = HttpApi.Ref,
            RouteKey = "ANY /api/ads/{proxy+}",
            Target = $"integrations/{integration.Ref}",
            AuthorizationType = "NONE"
        });

        // Route: GET /api/ads (unauthenticated, public job ad listing/search)
        // {proxy+} above requires at least one path segment, so the bare
        // collection endpoint (used by the careers portal to list published
        // ads) doesn't match it and was falling through to the authenticated
        // catch-all route below, 401'ing every unauthenticated visitor.
        new CfnRoute(this, "AdsListRoute", new CfnRouteProps
        {
            ApiId = HttpApi.Ref,
            RouteKey = "GET /api/ads",
            Target = $"integrations/{integration.Ref}",
            AuthorizationType = "NONE"
        });

        // Stage
        new CfnStage(this, "ApiStage", new CfnStageProps
        {
            ApiId = HttpApi.Ref,
            StageName = "$default",
            AutoDeploy = true,
            AccessLogSettings = new CfnStage.AccessLogSettingsProperty
            {
                DestinationArn = lambdaLogGroup.LogGroupArn,
                Format = "{\"requestId\":\"$context.requestId\",\"ip\":\"$context.identity.sourceIp\",\"method\":\"$context.httpMethod\",\"path\":\"$context.path\",\"status\":\"$context.status\",\"latency\":\"$context.responseLatency\",\"integrationLatency\":\"$context.integrationLatency\"}"
            }
        });

        // Grant API Gateway permission to invoke Lambda version
        lambdaVersion.AddPermission("ApiGatewayInvoke", new Permission
        {
            Principal = new ServicePrincipal("apigateway.amazonaws.com"),
            SourceArn = $"arn:aws:execute-api:{config.Region}:{this.Account}:{HttpApi.Ref}/*"
        });

        // ── EventBridge Scheduled Rules ────────────────────────────────────────
        //
        // None of these rules had ever run a job. Each fired a body shaped like an API Gateway v1
        // request — {"source":"scheduled","httpMethod":"POST","path":"/api/internal/scheduled/…"} —
        // at a Lambda whose handler reads HttpApiV2ProxyRequest, and Jackson rejected it on the
        // first field. From the production log group, repeating on every firing since deployment:
        //
        //   UnrecognizedPropertyException: Unrecognized field "source"
        //       (class com.amazonaws.serverless.proxy.model.HttpApiV2ProxyRequest)
        //
        // Even had it parsed, the path it posted to is refused: the Spring Security chain ends
        // anyRequest().denyAll() and nothing permits /api/internal/scheduled/**. So the payload no
        // longer pretends to be an HTTP request. It names a job, and ApiLambdaHandler dispatches it
        // in process — see ScheduledInvocation.
        //
        // Enabled is per-job and deliberately not "true" for everything. These eleven jobs have
        // never once executed against production data; switching them all on in the same change
        // that repairs the dispatch would turn eleven untested code paths loose at once, on live
        // records, with no way to attribute the result. They stay off until each is enabled on
        // purpose. The rules are kept rather than deleted so that turning one on is a one-word
        // change with its cadence already decided.
        var schedules = new Dictionary<string, (string schedule, string description, bool enabled)>
        {
            // Each rule replaces exactly one @Scheduled annotation, at the same cadence, and its
            // name must match an entry in ScheduledJobRegistry — a test pins that set.
            //
            // The previous list was written from imagination: ten of its twelve names pointed at
            // methods that do not exist (computeMetrics for computePeriodically, syncAll for
            // checkAndExecuteDueSchedules, cleanupExpired on a service with no cleanup method),
            // and it missed five real scheduled tasks entirely. Reflection turned each miss into a
            // debug line. The registry is typed now, so these names are checked by the compiler on
            // the Java side and by a test on this side.
            ["ReportSchedules"] = ("rate(1 hour)", "Send report schedules that have fallen due", true),
            ["MetricsComputation"] = ("rate(2 hours)", "Recompute dashboard metrics", true),
            ["JobAdExpiration"] = ("cron(0 2 * * ? *)", "Expire job advertisements past their closing date", true),
            ["AgencyContractExpiration"] = ("cron(0 3 * * ? *)", "Suspend agencies whose contract has lapsed", true),
            ["ComplianceReminders"] = ("cron(0 8 * * ? *)", "Send compliance reminders that have fallen due", true),
            ["ComplianceOverdue"] = ("cron(0 9 * * ? *)", "Mark compliance reminders overdue", true),
            ["ComplianceExpiries"] = ("cron(0 7 ? * MON *)", "Weekly scan for upcoming compliance expiries", true),
            ["SageSync"] = ("rate(5 minutes)", "Run Sage sync schedules that have fallen due", true),
            ["LeaveEscalation"] = ("cron(0 8 ? * MON-FRI *)", "Escalate leave requests waiting on approval", true),
            ["LeaveCarryForward"] = ("cron(0 1 1 1 ? *)", "Annual leave carry-forward processing", true),
            ["CertificationRenewal"] = ("cron(0 6 * * ? *)", "Warn on certifications about to expire", true),

            // Off because the bean behind each is off. The registry answers a request for one of
            // these by naming the property that would turn it on, rather than reporting an unknown
            // job — but a rule firing at a switched-off job is just a daily error, so the rule and
            // the property are enabled together or not at all.
            //
            // SAP: sap.payroll.enabled. Retention jobs: both delete things, and both are
            // deliberately opt-in at the bean level for that reason.
            ["SapTransmissionRetry"] = ("rate(15 minutes)", "Retry failed SAP payroll transmissions (needs sap.payroll.enabled)", false),
            ["SapStaleTransmissions"] = ("rate(1 hour)", "Flag SAP transmissions stuck in flight (needs sap.payroll.enabled)", false),
            ["DocumentRetention"] = ("cron(0 3 * * ? *)", "Apply document retention policies (needs document.retention.scheduler.enabled)", false),
            ["TalentPoolRetention"] = ("cron(0 4 * * ? *)", "Delete expired talent-pool entries (needs talent-pool.retention.scheduler.enabled)", false)

            // No rule for SecurityMonitoringService.cleanupSecurityEvents. It trims in-memory maps
            // held by one JVM; handing a fresh Lambda container its own empty maps to clean is not
            // the job the name promises. It stays an @Scheduled task for long-lived processes.
        };

        foreach (var (name, (schedule, description, enabled)) in schedules)
        {
            var rule = new Rule(this, $"{name}Rule", new RuleProps
            {
                RuleName = $"{prefix}-{name.ToLower()}",
                Description = description + (enabled ? "" : " (never verified in a deployed environment — off until enabled deliberately)"),
                Schedule = Schedule.Expression(schedule),
                Enabled = enabled
            });

            rule.AddTarget(new LambdaFunction(ApiFunction, new LambdaFunctionProps
            {
                Event = RuleTargetInput.FromObject(new Dictionary<string, object>
                {
                    // "job" is what the dispatcher reads; it must match a name in
                    // ScheduledJobRegistry, which fails loudly on one it does not know.
                    ["source"] = "scheduled",
                    ["job"] = name.ToLower(),
                    ["detail-type"] = name
                })
            }));
        }

        // ── CfnOutputs ──────────────────────────────────────────────────────
        new CfnOutput(this, "DynamoDbTableName", new CfnOutputProps
        {
            Value = DataTable.TableName,
            ExportName = $"{prefix}-DynamoDbTableName"
        });
        new CfnOutput(this, "ApiLambdaFunctionName", new CfnOutputProps
        {
            Value = ApiFunction.FunctionName,
            ExportName = $"{prefix}-ApiLambdaFunctionName"
        });
        new CfnOutput(this, "HttpApiUrl", new CfnOutputProps
        {
            Value = $"https://{HttpApi.Ref}.execute-api.{config.Region}.amazonaws.com",
            ExportName = $"{prefix}-HttpApiUrl"
        });
        new CfnOutput(this, "HttpApiId", new CfnOutputProps
        {
            Value = HttpApi.Ref,
            ExportName = $"{prefix}-HttpApiId"
        });
    }

    /// <summary>
    /// Reads a deploy-time feature flag from CDK context (e.g. `--context aiEnabled=true`),
    /// falling back to a safe default when not supplied.
    /// </summary>
    private static string ContextFlag(Construct scope, string key, string fallback) =>
        (string?)scope.Node.TryGetContext(key) ?? fallback;
}
