using Amazon.CDK;
using Amazon.CDK.AWS.EC2;
using Amazon.CDK.AWS.ECR;
using Amazon.CDK.AWS.RDS;
using Amazon.CDK.AWS.ElastiCache;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.SQS;
using Amazon.CDK.AWS.SecretsManager;
using Amazon.CDK.AWS.Cognito;
using Constructs;
using System.Collections.Generic;

namespace ShumelaHire.Infra;

public class ShumelaHireFoundationStack : Stack
{
    public IVpc Vpc { get; }
    public ISecurityGroup EcsSecurityGroup { get; }
    public ISecurityGroup AlbSecurityGroup { get; }
    public DatabaseCluster Database { get; }
    public Bucket DocumentsBucket { get; }
    public Bucket UploadsBucket { get; }
    public Queue NotificationQueue { get; }
    public UserPool UserPool { get; }
    public UserPoolClient AppClient { get; }
    public string RedisEndpointAddress { get; }
    public Repository BackendEcrRepo { get; }
    public Repository FrontendEcrRepo { get; }

    public ShumelaHireFoundationStack(Construct scope, string id, EnvironmentConfig config,
        IStackProps? props = null) : base(scope, id, props)
    {
        // ── VPC ──────────────────────────────────────────────────────────────
        Vpc = new Vpc(this, "Vpc", new VpcProps
        {
            VpcName = $"{config.Prefix}-vpc",
            MaxAzs = 2,
            NatGateways = config.IsProduction ? 2 : 1,
            SubnetConfiguration = new[]
            {
                new SubnetConfiguration
                {
                    Name = "public",
                    SubnetType = SubnetType.PUBLIC,
                    CidrMask = 24
                },
                new SubnetConfiguration
                {
                    Name = "private",
                    SubnetType = SubnetType.PRIVATE_WITH_EGRESS,
                    CidrMask = 24
                },
                new SubnetConfiguration
                {
                    Name = "isolated",
                    SubnetType = SubnetType.PRIVATE_ISOLATED,
                    CidrMask = 24
                }
            }
        });

        // ── Security Groups ──────────────────────────────────────────────────
        var dbSecurityGroup = new SecurityGroup(this, "DbSecurityGroup", new SecurityGroupProps
        {
            Vpc = Vpc,
            SecurityGroupName = $"{config.Prefix}-db-sg",
            Description = "Security group for Aurora database",
            AllowAllOutbound = false
        });

        var redisSecurityGroup = new SecurityGroup(this, "RedisSecurityGroup", new SecurityGroupProps
        {
            Vpc = Vpc,
            SecurityGroupName = $"{config.Prefix}-redis-sg",
            Description = "Security group for ElastiCache Redis",
            AllowAllOutbound = false
        });

        EcsSecurityGroup = new SecurityGroup(this, "EcsSecurityGroup", new SecurityGroupProps
        {
            Vpc = Vpc,
            SecurityGroupName = $"{config.Prefix}-ecs-sg",
            Description = "Security group for ECS tasks"
        });

        AlbSecurityGroup = new SecurityGroup(this, "AlbSecurityGroup", new SecurityGroupProps
        {
            Vpc = Vpc,
            SecurityGroupName = $"{config.Prefix}-alb-sg",
            Description = "Security group for ALB",
            AllowAllOutbound = true
        });
        AlbSecurityGroup.AddIngressRule(Peer.AnyIpv4(), Port.Tcp(443), "HTTPS");
        AlbSecurityGroup.AddIngressRule(Peer.AnyIpv4(), Port.Tcp(80), "HTTP redirect");

        dbSecurityGroup.AddIngressRule(EcsSecurityGroup, Port.Tcp(5432), "Allow ECS to Aurora");
        redisSecurityGroup.AddIngressRule(EcsSecurityGroup, Port.Tcp(6379), "Allow ECS to Redis");

        // ── Aurora Serverless v2 (PostgreSQL 15) ─────────────────────────────
        Database = new DatabaseCluster(this, "Database", new DatabaseClusterProps
        {
            ClusterIdentifier = $"{config.Prefix}-db",
            Engine = DatabaseClusterEngine.AuroraPostgres(new AuroraPostgresClusterEngineProps
            {
                Version = AuroraPostgresEngineVersion.VER_15_8
            }),
            ServerlessV2MinCapacity = config.IsProduction ? 2 : 0.5,
            ServerlessV2MaxCapacity = config.IsProduction ? 16 : 2,
            Writer = ClusterInstance.ServerlessV2("writer", new ServerlessV2ClusterInstanceProps
            {
                PubliclyAccessible = false
            }),
            Readers = config.IsProduction
                ? new[] { ClusterInstance.ServerlessV2("reader", new ServerlessV2ClusterInstanceProps { ScaleWithWriter = true }) }
                : System.Array.Empty<IClusterInstance>(),
            Vpc = Vpc,
            VpcSubnets = new SubnetSelection { SubnetType = SubnetType.PRIVATE_ISOLATED },
            SecurityGroups = new[] { dbSecurityGroup },
            DefaultDatabaseName = "shumelahire",
            StorageEncrypted = true,
            DeletionProtection = config.IsProduction,
            RemovalPolicy = config.IsProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
            Credentials = Credentials.FromGeneratedSecret("shumelahire_admin", new CredentialsBaseOptions
            {
                SecretName = $"{config.Prefix}/db-credentials"
            })
        });

        // ── ElastiCache Redis ────────────────────────────────────────────────
        var redisSubnetGroup = new CfnSubnetGroup(this, "RedisSubnetGroup", new CfnSubnetGroupProps
        {
            CacheSubnetGroupName = $"{config.Prefix}-redis-subnet",
            Description = "Subnet group for Redis",
            SubnetIds = Vpc.SelectSubnets(new SubnetSelection
            {
                SubnetType = SubnetType.PRIVATE_ISOLATED
            }).SubnetIds
        });

        var redis = new CfnCacheCluster(this, "Redis", new CfnCacheClusterProps
        {
            ClusterName = $"{config.Prefix}-redis",
            Engine = "redis",
            EngineVersion = "7.1",
            CacheNodeType = config.IsProduction ? "cache.r7g.large" : "cache.t3.micro",
            NumCacheNodes = 1,
            CacheSubnetGroupName = redisSubnetGroup.CacheSubnetGroupName,
            VpcSecurityGroupIds = new[] { redisSecurityGroup.SecurityGroupId }
        });
        redis.AddDependency(redisSubnetGroup);
        RedisEndpointAddress = redis.AttrRedisEndpointAddress;

        // ── S3 Buckets ───────────────────────────────────────────────────────
        DocumentsBucket = new Bucket(this, "DocumentsBucket", new BucketProps
        {
            BucketName = $"{config.Prefix}-documents",
            Encryption = BucketEncryption.S3_MANAGED,
            Versioned = true,
            BlockPublicAccess = BlockPublicAccess.BLOCK_ALL,
            RemovalPolicy = config.IsProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
            AutoDeleteObjects = !config.IsProduction,
            Cors = new[]
            {
                new CorsRule
                {
                    AllowedOrigins = config.CorsOrigins,
                    AllowedMethods = new[] { HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST },
                    AllowedHeaders = new[] { "*" },
                    MaxAge = 3600
                }
            }
        });

        UploadsBucket = new Bucket(this, "UploadsBucket", new BucketProps
        {
            BucketName = $"{config.Prefix}-uploads",
            Encryption = BucketEncryption.S3_MANAGED,
            BlockPublicAccess = BlockPublicAccess.BLOCK_ALL,
            RemovalPolicy = config.IsProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
            AutoDeleteObjects = !config.IsProduction,
            LifecycleRules = new[]
            {
                new Amazon.CDK.AWS.S3.LifecycleRule
                {
                    Id = "CleanupTempUploads",
                    Prefix = "temp/",
                    Expiration = Duration.Days(7)
                }
            }
        });

        // ── SQS Queues ──────────────────────────────────────────────────────
        var notificationDlq = new Queue(this, "NotificationDlq", new QueueProps
        {
            QueueName = $"{config.Prefix}-notification-dlq.fifo",
            Fifo = true,
            RetentionPeriod = Duration.Days(14)
        });

        NotificationQueue = new Queue(this, "NotificationQueue", new QueueProps
        {
            QueueName = $"{config.Prefix}-notifications.fifo",
            Fifo = true,
            ContentBasedDeduplication = true,
            VisibilityTimeout = Duration.Seconds(120),
            RetentionPeriod = Duration.Days(4),
            DeadLetterQueue = new DeadLetterQueue
            {
                Queue = notificationDlq,
                MaxReceiveCount = 3
            }
        });

        // ── Secrets Manager ──────────────────────────────────────────────────
        new Secret(this, "AiKeysSecret", new SecretProps
        {
            SecretName = $"shumelahire/{config.EnvironmentName}/ai-keys",
            Description = "AI service API keys (Claude, OpenAI)"
        });

        new Secret(this, "DocusignSecret", new SecretProps
        {
            SecretName = $"shumelahire/{config.EnvironmentName}/docusign",
            Description = "DocuSign API credentials"
        });

        new Secret(this, "EncryptionKeySecret", new SecretProps
        {
            SecretName = $"shumelahire/{config.EnvironmentName}/encryption-key",
            Description = "Application encryption key"
        });

        new Secret(this, "JwtSecret", new SecretProps
        {
            SecretName = $"shumelahire/{config.EnvironmentName}/jwt-secret",
            Description = "JWT signing secret"
        });

        new Secret(this, "MicrosoftSecret", new SecretProps
        {
            SecretName = $"shumelahire/{config.EnvironmentName}/microsoft",
            Description = "Microsoft Graph credentials (Teams, Outlook)"
        });

        new Secret(this, "JobBoardsSecret", new SecretProps
        {
            SecretName = $"shumelahire/{config.EnvironmentName}/job-boards",
            Description = "Job board API credentials (LinkedIn, Indeed, PNet, CareerJunction)"
        });

        // ── Cognito User Pool ────────────────────────────────────────────────
        UserPool = new UserPool(this, "UserPool", new UserPoolProps
        {
            UserPoolName = $"{config.Prefix}-users",
            SelfSignUpEnabled = true,
            SignInAliases = new SignInAliases { Email = true },
            AutoVerify = new AutoVerifiedAttrs { Email = true },
            StandardAttributes = new StandardAttributes
            {
                Email = new StandardAttribute { Required = true, Mutable = true },
                GivenName = new StandardAttribute { Required = true, Mutable = true },
                FamilyName = new StandardAttribute { Required = true, Mutable = true }
            },
            CustomAttributes = new Dictionary<string, ICustomAttribute>
            {
                ["tenant_id"] = new StringAttribute(new StringAttributeProps { MinLen = 1, MaxLen = 50, Mutable = true })
            },
            PasswordPolicy = new PasswordPolicy
            {
                MinLength = 8,
                RequireLowercase = true,
                RequireUppercase = true,
                RequireDigits = true,
                RequireSymbols = true,
                TempPasswordValidity = Duration.Days(3)
            },
            Mfa = Mfa.OPTIONAL,
            MfaSecondFactor = new MfaSecondFactor { Sms = false, Otp = true },
            AccountRecovery = AccountRecovery.EMAIL_ONLY,
            RemovalPolicy = config.IsProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
        });

        var groups = new[] { "ADMIN", "EXECUTIVE", "HR_MANAGER", "HIRING_MANAGER", "RECRUITER", "INTERVIEWER", "EMPLOYEE", "APPLICANT" };
        foreach (var group in groups)
        {
            new CfnUserPoolGroup(this, $"Group{group}", new CfnUserPoolGroupProps
            {
                UserPoolId = UserPool.UserPoolId,
                GroupName = group,
                Description = $"{group} role group"
            });
        }

        AppClient = UserPool.AddClient("WebAppClient", new UserPoolClientOptions
        {
            UserPoolClientName = $"{config.Prefix}-web",
            AuthFlows = new AuthFlow
            {
                UserPassword = true,
                UserSrp = true
            },
            PreventUserExistenceErrors = true,
            AccessTokenValidity = Duration.Hours(1),
            IdTokenValidity = Duration.Hours(1),
            RefreshTokenValidity = Duration.Days(30),
            GenerateSecret = false
        });

        // ── ECR Repositories ───────────────────────────────────────────────
        BackendEcrRepo = new Repository(this, "BackendRepo", new RepositoryProps
        {
            RepositoryName = "shumelahire-backend",
            RemovalPolicy = RemovalPolicy.RETAIN,
            LifecycleRules = new[]
            {
                new Amazon.CDK.AWS.ECR.LifecycleRule
                {
                    MaxImageCount = 10,
                    Description = "Keep last 10 images"
                }
            }
        });

        FrontendEcrRepo = new Repository(this, "FrontendRepo", new RepositoryProps
        {
            RepositoryName = "shumelahire-frontend",
            RemovalPolicy = RemovalPolicy.RETAIN,
            LifecycleRules = new[]
            {
                new Amazon.CDK.AWS.ECR.LifecycleRule
                {
                    MaxImageCount = 10,
                    Description = "Keep last 10 images"
                }
            }
        });

        // ── CfnOutputs ──────────────────────────────────────────────────────
        new CfnOutput(this, "VpcId", new CfnOutputProps { Value = Vpc.VpcId });
        new CfnOutput(this, "DatabaseEndpoint", new CfnOutputProps { Value = Database.ClusterEndpoint.Hostname });
        new CfnOutput(this, "RedisEndpoint", new CfnOutputProps { Value = RedisEndpointAddress });
        new CfnOutput(this, "DocumentsBucketName", new CfnOutputProps { Value = DocumentsBucket.BucketName });
        new CfnOutput(this, "UploadsBucketName", new CfnOutputProps { Value = UploadsBucket.BucketName });
        new CfnOutput(this, "NotificationQueueUrl", new CfnOutputProps { Value = NotificationQueue.QueueUrl });
        new CfnOutput(this, "UserPoolId", new CfnOutputProps { Value = UserPool.UserPoolId });
        new CfnOutput(this, "UserPoolClientId", new CfnOutputProps { Value = AppClient.UserPoolClientId });
        new CfnOutput(this, "BackendEcrRepoUri", new CfnOutputProps { Value = BackendEcrRepo.RepositoryUri });
        new CfnOutput(this, "FrontendEcrRepoUri", new CfnOutputProps { Value = FrontendEcrRepo.RepositoryUri });
    }
}
