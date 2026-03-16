using Amazon.CDK;
using Amazon.CDK.AWS.CloudWatch;
using Amazon.CDK.AWS.CloudWatch.Actions;
using Amazon.CDK.AWS.EC2;
using Amazon.CDK.AWS.ECS;
using Amazon.CDK.AWS.ElasticLoadBalancingV2;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Logs;
using Amazon.CDK.AWS.SNS;
using Amazon.CDK.AWS.SNS.Subscriptions;
using Constructs;
using System.Collections.Generic;

namespace ShumelaHire.Infra;

public class ShumelaHireComputeStack : Stack
{
    public string AlbDnsName { get; }
    public string AlbArn { get; }

    public ShumelaHireComputeStack(Construct scope, string id, EnvironmentConfig config,
        ShumelaHireFoundationStack foundation, IStackProps? props = null) : base(scope, id, props)
    {
        var prefix = config.Prefix;

        // ECR repos are in the foundation stack
        var ecrRepository = foundation.BackendEcrRepo;
        var frontendEcrRepository = foundation.FrontendEcrRepo;

        // ── ECS Cluster ──────────────────────────────────────────────────────
        var cluster = new Cluster(this, "Cluster", new ClusterProps
        {
            ClusterName = prefix,
            Vpc = foundation.Vpc,
            ContainerInsights = config.IsProduction
        });

        // ── Task Role (IAM) ─────────────────────────────────────────────────
        var taskRole = new Role(this, "TaskRole", new RoleProps
        {
            RoleName = $"{prefix}-task-role",
            AssumedBy = new ServicePrincipal("ecs-tasks.amazonaws.com"),
            Description = "ECS task role with S3, SQS, SES, Secrets Manager, CloudWatch permissions"
        });

        taskRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = new[] { "s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket", "s3:GetBucketLocation" },
            Resources = new[]
            {
                foundation.DocumentsBucket.BucketArn,
                $"{foundation.DocumentsBucket.BucketArn}/*",
                foundation.UploadsBucket.BucketArn,
                $"{foundation.UploadsBucket.BucketArn}/*"
            }
        }));

        taskRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = new[] { "sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes" },
            Resources = new[] { foundation.NotificationQueue.QueueArn }
        }));

        taskRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = new[] { "ses:SendEmail", "ses:SendRawEmail" },
            Resources = new[] { $"arn:aws:ses:{this.Region}:{this.Account}:identity/*" }
        }));

        taskRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = new[] { "secretsmanager:GetSecretValue" },
            Resources = new[]
            {
                $"arn:aws:secretsmanager:{this.Region}:{this.Account}:secret:shumelahire-fs/{config.EnvironmentName}/*",
                $"arn:aws:secretsmanager:{this.Region}:{this.Account}:secret:{prefix}/db-credentials*"
            }
        }));

        taskRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = new[] { "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents" },
            Resources = new[] { $"arn:aws:logs:{this.Region}:{this.Account}:log-group:/ecs/{prefix}*" }
        }));

        taskRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = new[]
            {
                "cognito-idp:GetUser", "cognito-idp:AdminGetUser", "cognito-idp:ListUsers",
                "cognito-idp:AdminCreateUser", "cognito-idp:AdminAddUserToGroup",
                "cognito-idp:GetGroup", "cognito-idp:CreateGroup"
            },
            Resources = new[] { foundation.UserPool.UserPoolArn }
        }));

        // ── Task Execution Role ──────────────────────────────────────────────
        var executionRole = new Role(this, "ExecutionRole", new RoleProps
        {
            RoleName = $"{prefix}-execution-role",
            AssumedBy = new ServicePrincipal("ecs-tasks.amazonaws.com"),
            ManagedPolicies = new[]
            {
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy")
            }
        });

        executionRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = new[] { "secretsmanager:GetSecretValue" },
            Resources = new[]
            {
                $"arn:aws:secretsmanager:{this.Region}:{this.Account}:secret:shumelahire-fs/{config.EnvironmentName}/*",
                $"arn:aws:secretsmanager:{this.Region}:{this.Account}:secret:{prefix}/db-credentials*"
            }
        }));

        // ── Secrets Manager References ─────────────────────────────────────────
        var dbSecret = foundation.Database.Secret!;
        var jwtSecret = foundation.JwtSecret;
        var encryptionSecret = foundation.EncryptionKeySecret;

        // ── Log Group (from foundation stack — survives compute rollbacks) ──
        var logGroup = foundation.EcsLogGroup;

        // ── Backend Task Definition ──────────────────────────────────────────
        var taskDef = new FargateTaskDefinition(this, "TaskDef", new FargateTaskDefinitionProps
        {
            Family = prefix,
            Cpu = config.IsProduction ? 1024 : 512,
            MemoryLimitMiB = config.IsProduction ? 2048 : 2048,
            TaskRole = taskRole,
            ExecutionRole = executionRole
        });

        taskDef.AddContainer("backend", new ContainerDefinitionOptions
        {
            ContainerName = "backend",
            Image = ContainerImage.FromEcrRepository(ecrRepository, "latest"),
            Logging = LogDrivers.AwsLogs(new AwsLogDriverProps
            {
                LogGroup = logGroup,
                StreamPrefix = "backend"
            }),
            PortMappings = new[]
            {
                new PortMapping { ContainerPort = 8080, Protocol = Amazon.CDK.AWS.ECS.Protocol.TCP }
            },
            HealthCheck = new Amazon.CDK.AWS.ECS.HealthCheck
            {
                Command = new[] { "CMD-SHELL", "wget -qO- http://localhost:8080/actuator/health || exit 1" },
                Interval = Duration.Seconds(30),
                Timeout = Duration.Seconds(10),
                Retries = 5,
                StartPeriod = Duration.Seconds(180)
            },
            Environment = new Dictionary<string, string>
            {
                ["SPRING_PROFILES_ACTIVE"] = config.SpringProfile,
                ["DATABASE_URL"] = $"jdbc:postgresql://{foundation.Database.ClusterEndpoint.Hostname}:5432/shumelahire",
                ["REDIS_HOST"] = foundation.RedisEndpointAddress,
                ["REDIS_PORT"] = "6379",
                ["S3_BUCKET"] = foundation.DocumentsBucket.BucketName,
                ["S3_REGION"] = config.Region,
                ["STORAGE_PROVIDER"] = "s3",
                ["SQS_NOTIFICATION_QUEUE_URL"] = foundation.NotificationQueue.QueueUrl,
                ["NOTIFICATION_SQS_ENABLED"] = "true",
                ["NOTIFICATION_EMAIL_ENABLED"] = "true",
                ["DATA_RESIDENCY_REGION"] = "ZA",
                ["COGNITO_USER_POOL_ID"] = foundation.UserPool.UserPoolId,
                ["COGNITO_CLIENT_ID"] = foundation.AppClient.UserPoolClientId,
                ["COGNITO_ISSUER_URI"] = $"https://cognito-idp.{config.Region}.amazonaws.com/{foundation.UserPool.UserPoolId}",
                // SES
                ["SES_ENABLED"] = "true",
                ["SES_REGION"] = config.Region,
                ["SES_FROM_EMAIL"] = $"noreply@{config.DomainName}",
                ["SES_FROM_NAME"] = "ShumelaHire",
                // Integration feature flags (enable per-environment after secrets populated)
                ["MICROSOFT_ENABLED"] = "false",
                ["LINKEDIN_ENABLED"] = "false",
                ["INDEED_ENABLED"] = "false",
                ["PNET_ENABLED"] = "false",
                ["CAREER_JUNCTION_ENABLED"] = "false",
                ["AI_ENABLED"] = "true",
                ["AI_PROVIDER"] = "claude",
                // LinkedIn Social Posting
                ["LINKEDIN_SOCIAL_ENABLED"] = "false",
                ["LINKEDIN_SOCIAL_REDIRECT_URI"] = $"https://api.{config.DomainName}/api/linkedin/social/auth/callback"
                // Uncomment when enabling LinkedIn Social:
                // ["LINKEDIN_SOCIAL_CLIENT_ID"] = Secret.FromSecretsManager(linkedInSocialSecret, "client_id"),
                // ["LINKEDIN_SOCIAL_CLIENT_SECRET"] = Secret.FromSecretsManager(linkedInSocialSecret, "client_secret"),
            },
            Secrets = new Dictionary<string, Amazon.CDK.AWS.ECS.Secret>
            {
                // Database
                ["DATABASE_USER"] = Amazon.CDK.AWS.ECS.Secret.FromSecretsManager(dbSecret, "username"),
                ["DATABASE_PASS"] = Amazon.CDK.AWS.ECS.Secret.FromSecretsManager(dbSecret, "password"),
                // Security
                ["JWT_SECRET"] = Amazon.CDK.AWS.ECS.Secret.FromSecretsManager(jwtSecret),
                ["ENCRYPTION_KEY"] = Amazon.CDK.AWS.ECS.Secret.FromSecretsManager(encryptionSecret),
                // AI
                ["CLAUDE_API_KEY"] = Amazon.CDK.AWS.ECS.Secret.FromSecretsManager(foundation.AiKeysSecret)
            }
        });

        // ── ALB ──────────────────────────────────────────────────────────────
        var alb = new ApplicationLoadBalancer(this, "Alb",
            new Amazon.CDK.AWS.ElasticLoadBalancingV2.ApplicationLoadBalancerProps
        {
            Vpc = foundation.Vpc,
            LoadBalancerName = prefix,
            InternetFacing = true,
            SecurityGroup = foundation.AlbSecurityGroup,
            VpcSubnets = new SubnetSelection { SubnetType = SubnetType.PUBLIC }
        });

        AlbDnsName = alb.LoadBalancerDnsName;
        AlbArn = alb.LoadBalancerArn;

        // ── Backend Fargate Service ──────────────────────────────────────────
        var service = new FargateService(this, "Service", new FargateServiceProps
        {
            ServiceName = prefix,
            Cluster = cluster,
            TaskDefinition = taskDef,
            DesiredCount = config.IsProduction ? 2 : 1,
            SecurityGroups = new[] { foundation.EcsSecurityGroup },
            VpcSubnets = new SubnetSelection { SubnetType = SubnetType.PRIVATE_WITH_EGRESS },
            AssignPublicIp = false,
            CircuitBreaker = new DeploymentCircuitBreaker { Rollback = config.IsProduction },
            MinHealthyPercent = config.IsProduction ? 100 : 0,
            MaxHealthyPercent = 200,
            HealthCheckGracePeriod = Duration.Seconds(180)
        });

        // ── Frontend Task Definition ─────────────────────────────────────────
        var frontendTaskDef = new FargateTaskDefinition(this, "FrontendTaskDef", new FargateTaskDefinitionProps
        {
            Family = $"{prefix}-frontend",
            Cpu = 256,
            MemoryLimitMiB = 512,
            TaskRole = taskRole,
            ExecutionRole = executionRole
        });

        frontendTaskDef.AddContainer("frontend", new ContainerDefinitionOptions
        {
            ContainerName = "frontend",
            Image = ContainerImage.FromEcrRepository(frontendEcrRepository, "latest"),
            Logging = LogDrivers.AwsLogs(new AwsLogDriverProps
            {
                LogGroup = logGroup,
                StreamPrefix = "frontend"
            }),
            PortMappings = new[]
            {
                new PortMapping { ContainerPort = 3000, Protocol = Amazon.CDK.AWS.ECS.Protocol.TCP }
            },
            // No container-level health check — ALB health check handles this.
            // Container health checks with node/wget are unreliable on low-CPU Fargate tasks.
        });

        // ── Frontend Fargate Service ─────────────────────────────────────────
        var frontendService = new FargateService(this, "FrontendService", new FargateServiceProps
        {
            ServiceName = $"{prefix}-frontend",
            Cluster = cluster,
            TaskDefinition = frontendTaskDef,
            DesiredCount = 1,
            SecurityGroups = new[] { foundation.EcsSecurityGroup },
            VpcSubnets = new SubnetSelection { SubnetType = SubnetType.PRIVATE_WITH_EGRESS },
            AssignPublicIp = false,
            CircuitBreaker = new DeploymentCircuitBreaker { Rollback = config.IsProduction },
            MinHealthyPercent = config.IsProduction ? 100 : 0,
            MaxHealthyPercent = 200,
            HealthCheckGracePeriod = Duration.Seconds(120)
        });

        // ── ALB Listeners & Path-Based Routing ──────────────────────────────
        IApplicationListener primaryListener;

        if (!string.IsNullOrEmpty(config.ApiCertificateArn))
        {
            // HTTPS listener is the primary target for target groups.
            primaryListener = alb.AddListener("Https", new BaseApplicationListenerProps
            {
                Port = 443,
                Protocol = ApplicationProtocol.HTTPS,
                Certificates = new[] { ListenerCertificate.FromArn(config.ApiCertificateArn) }
            });
        }
        else
        {
            // HTTP only (dev/local)
            primaryListener = alb.AddListener("Http", new BaseApplicationListenerProps
            {
                Port = 80
            });
        }

        // API traffic → backend (priority rule)
        var backendTg = primaryListener.AddTargets("BackendTarget", new AddApplicationTargetsProps
        {
            Port = 8080,
            Protocol = ApplicationProtocol.HTTP,
            Targets = new[] { service },
            Priority = 10,
            Conditions = new[]
            {
                ListenerCondition.PathPatterns(new[] { "/api/*", "/actuator/*", "/v3/api-docs*", "/swagger-ui*" })
            },
            HealthCheck = new Amazon.CDK.AWS.ElasticLoadBalancingV2.HealthCheck
            {
                Path = "/actuator/health",
                HealthyThresholdCount = 2,
                UnhealthyThresholdCount = 3,
                Interval = Duration.Seconds(30),
                Timeout = Duration.Seconds(10)
            },
            DeregistrationDelay = Duration.Seconds(30)
        });

        // Default → frontend
        var frontendTg = primaryListener.AddTargets("FrontendTarget", new AddApplicationTargetsProps
        {
            Port = 3000,
            Protocol = ApplicationProtocol.HTTP,
            Targets = new[] { frontendService },
            HealthCheck = new Amazon.CDK.AWS.ElasticLoadBalancingV2.HealthCheck
            {
                Path = "/api/health",
                HealthyThresholdCount = 2,
                UnhealthyThresholdCount = 3,
                Interval = Duration.Seconds(30),
                Timeout = Duration.Seconds(10)
            },
            DeregistrationDelay = Duration.Seconds(30)
        });

        // Port 80: forward to same target groups (CloudFront connects via HTTP_ONLY).
        // CloudFront handles viewer-level HTTPS redirect, so no HTTP→HTTPS redirect here.
        if (!string.IsNullOrEmpty(config.ApiCertificateArn))
        {
            var httpListener = alb.AddListener("Http", new BaseApplicationListenerProps
            {
                Port = 80,
                DefaultAction = ListenerAction.Forward(new[] { frontendTg })
            });
            httpListener.AddAction("BackendRouteHttp", new AddApplicationActionProps
            {
                Priority = 10,
                Conditions = new[]
                {
                    ListenerCondition.PathPatterns(new[] { "/api/*", "/actuator/*", "/v3/api-docs*", "/swagger-ui*" })
                },
                Action = ListenerAction.Forward(new[] { backendTg })
            });
        }

        // ── Auto Scaling ─────────────────────────────────────────────────────
        var scaling = service.AutoScaleTaskCount(new Amazon.CDK.AWS.ApplicationAutoScaling.EnableScalingProps
        {
            MinCapacity = config.IsProduction ? 2 : 1,
            MaxCapacity = config.IsProduction ? 10 : 4
        });

        scaling.ScaleOnCpuUtilization("CpuScaling", new CpuUtilizationScalingProps
        {
            TargetUtilizationPercent = 70,
            ScaleInCooldown = Duration.Seconds(300),
            ScaleOutCooldown = Duration.Seconds(60)
        });

        scaling.ScaleOnMemoryUtilization("MemoryScaling", new MemoryUtilizationScalingProps
        {
            TargetUtilizationPercent = 80,
            ScaleInCooldown = Duration.Seconds(300),
            ScaleOutCooldown = Duration.Seconds(60)
        });

        // ── SNS Alarm Topic ────────────────────────────────────────────────
        var alarmTopic = new Topic(this, "AlarmTopic", new TopicProps
        {
            TopicName = $"{prefix}-alarms",
            DisplayName = $"ShumelaHire {config.EnvironmentName} Alarms"
        });

        // ── CloudWatch Alarms ─────────────────────────────────────────────
        var cpuAlarm = new Alarm(this, "CpuAlarm", new AlarmProps
        {
            AlarmName = $"{prefix}-cpu-high",
            AlarmDescription = "ECS CPU utilization above 80%",
            Metric = service.MetricCpuUtilization(new Amazon.CDK.AWS.CloudWatch.MetricOptions
            {
                Period = Duration.Minutes(5),
                Statistic = "Average"
            }),
            Threshold = 80,
            EvaluationPeriods = 3,
            ComparisonOperator = ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            TreatMissingData = TreatMissingData.NOT_BREACHING
        });
        cpuAlarm.AddAlarmAction(new SnsAction(alarmTopic));

        var memoryAlarm = new Alarm(this, "MemoryAlarm", new AlarmProps
        {
            AlarmName = $"{prefix}-memory-high",
            AlarmDescription = "ECS memory utilization above 85%",
            Metric = service.MetricMemoryUtilization(new Amazon.CDK.AWS.CloudWatch.MetricOptions
            {
                Period = Duration.Minutes(5),
                Statistic = "Average"
            }),
            Threshold = 85,
            EvaluationPeriods = 3,
            ComparisonOperator = ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            TreatMissingData = TreatMissingData.NOT_BREACHING
        });
        memoryAlarm.AddAlarmAction(new SnsAction(alarmTopic));

        var alb5xxAlarm = new Alarm(this, "Alb5xxAlarm", new AlarmProps
        {
            AlarmName = $"{prefix}-alb-5xx",
            AlarmDescription = "ALB 5xx error rate above 1%",
            Metric = alb.Metrics.HttpCodeElb(HttpCodeElb.ELB_5XX_COUNT, new Amazon.CDK.AWS.CloudWatch.MetricOptions
            {
                Period = Duration.Minutes(5),
                Statistic = "Sum"
            }),
            Threshold = 10,
            EvaluationPeriods = 2,
            ComparisonOperator = ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            TreatMissingData = TreatMissingData.NOT_BREACHING
        });
        alb5xxAlarm.AddAlarmAction(new SnsAction(alarmTopic));

        var unhealthyTargetsAlarm = new Alarm(this, "UnhealthyTargetsAlarm", new AlarmProps
        {
            AlarmName = $"{prefix}-unhealthy-targets",
            AlarmDescription = "ALB has unhealthy targets",
            Metric = new Metric(new MetricProps
            {
                Namespace = "AWS/ApplicationELB",
                MetricName = "UnHealthyHostCount",
                DimensionsMap = new Dictionary<string, string>
                {
                    ["LoadBalancer"] = alb.LoadBalancerFullName
                },
                Period = Duration.Minutes(5),
                Statistic = "Maximum"
            }),
            Threshold = 1,
            EvaluationPeriods = 2,
            ComparisonOperator = ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            TreatMissingData = TreatMissingData.NOT_BREACHING
        });
        unhealthyTargetsAlarm.AddAlarmAction(new SnsAction(alarmTopic));

        // ── CloudWatch Dashboard ──────────────────────────────────────────
        var dashboard = new Dashboard(this, "Dashboard", new DashboardProps
        {
            DashboardName = $"{prefix}-dashboard"
        });

        dashboard.AddWidgets(
            new TextWidget(new TextWidgetProps
            {
                Markdown = $"# ShumelaHire {config.EnvironmentName} Dashboard",
                Width = 24,
                Height = 1
            })
        );

        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "ECS CPU Utilization",
                Left = new[] { service.MetricCpuUtilization() },
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "ECS Memory Utilization",
                Left = new[] { service.MetricMemoryUtilization() },
                Width = 12,
                Height = 6
            })
        );

        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "ALB Request Count",
                Left = new[] { alb.Metrics.RequestCount() },
                Width = 8,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "ALB Response Time",
                Left = new[] { alb.Metrics.TargetResponseTime() },
                Width = 8,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "ALB HTTP Errors",
                Left = new IMetric[]
                {
                    alb.Metrics.HttpCodeElb(HttpCodeElb.ELB_5XX_COUNT),
                    alb.Metrics.HttpCodeTarget(HttpCodeTarget.TARGET_4XX_COUNT)
                },
                Width = 8,
                Height = 6
            })
        );

        // ── CfnOutputs ──────────────────────────────────────────────────────
        new CfnOutput(this, "AlarmTopicArn", new CfnOutputProps
        {
            Value = alarmTopic.TopicArn,
            ExportName = $"{prefix}-AlarmTopicArn"
        });
        new CfnOutput(this, "AlbDnsName", new CfnOutputProps
        {
            Value = alb.LoadBalancerDnsName,
            ExportName = $"{prefix}-AlbDnsName"
        });
        new CfnOutput(this, "AlbArn", new CfnOutputProps
        {
            Value = alb.LoadBalancerArn,
            ExportName = $"{prefix}-AlbArn"
        });
        new CfnOutput(this, "ClusterName", new CfnOutputProps
        {
            Value = cluster.ClusterName,
            ExportName = $"{prefix}-ClusterName"
        });
        new CfnOutput(this, "ServiceName", new CfnOutputProps
        {
            Value = service.ServiceName,
            ExportName = $"{prefix}-ServiceName"
        });
        new CfnOutput(this, "FrontendServiceName", new CfnOutputProps
        {
            Value = frontendService.ServiceName,
            ExportName = $"{prefix}-FrontendServiceName"
        });
    }
}
