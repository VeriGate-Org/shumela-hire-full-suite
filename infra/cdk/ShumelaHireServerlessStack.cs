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

        // S3 permissions (documents + uploads buckets)
        foundation.DocumentsBucket.GrantReadWrite(lambdaRole);
        foundation.UploadsBucket.GrantReadWrite(lambdaRole);

        // SQS permissions
        foundation.NotificationQueue.GrantSendMessages(lambdaRole);

        // Cognito admin permissions
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

        // Container image deployment bypasses Lambda's 250 MiB zip size limit
        // (10 GB image limit). CDK builds & pushes the image to ECR automatically.
        ApiFunction = new DockerImageFunction(this, "ApiFunction", new DockerImageFunctionProps
        {
            Code = DockerImageCode.FromImageAsset("../../backend", new AssetImageCodeProps
            {
                File = "Dockerfile.lambda"
            }),
            MemorySize = 3072,
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
                ["JWT_SECRET_ARN"] = foundation.JwtSecret.SecretArn,
                ["ENCRYPTION_KEY_ARN"] = foundation.EncryptionKeySecret.SecretArn,
                ["AI_KEYS_SECRET_ARN"] = foundation.AiKeysSecret.SecretArn,
                ["AWS_REGION_OVERRIDE"] = config.Region
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

        // Lambda integration (using published version for SnapStart)
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
        var schedules = new Dictionary<string, (string schedule, string description)>
        {
            ["MetricsComputation"] = ("rate(2 hours)", "Recompute dashboard metrics"),
            ["JobAdExpiration"] = ("cron(0 2 * * ? *)", "Expire stale job advertisements"),
            ["SapTransmissionRetry"] = ("rate(15 minutes)", "Retry failed SAP payroll transmissions"),
            ["ComplianceReminders"] = ("cron(0 8 * * ? *)", "Send compliance reminder notifications"),
            ["LeaveCarryForward"] = ("cron(0 1 1 1 ? *)", "Annual leave carry-forward processing"),
            ["SecurityCleanup"] = ("rate(1 hour)", "Clean up expired sessions and tokens"),
            ["SageSync"] = ("rate(5 minutes)", "Sync employee data with Sage"),
            ["AttendanceReconciliation"] = ("cron(0 3 * * ? *)", "Reconcile attendance records"),
            ["PerformanceCycleCheck"] = ("cron(0 6 * * ? *)", "Check performance review cycle deadlines"),
            ["TrainingReminders"] = ("cron(0 7 * * ? *)", "Send training enrollment reminders"),
            ["ReportCleanup"] = ("cron(0 4 * * ? *)", "Clean up expired report export jobs")
        };

        foreach (var (name, (schedule, description)) in schedules)
        {
            var rule = new Rule(this, $"{name}Rule", new RuleProps
            {
                RuleName = $"{prefix}-{name.ToLower()}",
                Description = description,
                Schedule = Schedule.Expression(schedule),
                Enabled = true
            });

            rule.AddTarget(new LambdaFunction(ApiFunction, new LambdaFunctionProps
            {
                Event = RuleTargetInput.FromObject(new Dictionary<string, object>
                {
                    ["source"] = "scheduled",
                    ["detail-type"] = name,
                    ["httpMethod"] = "POST",
                    ["path"] = $"/api/internal/scheduled/{name.ToLower()}"
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
}
