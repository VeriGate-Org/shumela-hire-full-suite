using Amazon.CDK;
using Amazon.CDK.AWS.EC2;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.SQS;
using Amazon.CDK.AWS.SecretsManager;
using Amazon.CDK.AWS.Cognito;
using Constructs;
using System.Collections.Generic;
using System.Linq;

namespace ShumelaHire.Infra;

public class ShumelaHireFoundationStack : Stack
{
    public IVpc Vpc { get; }
    public Bucket DocumentsBucket { get; }
    public Bucket UploadsBucket { get; }
    public Queue NotificationQueue { get; }
    public UserPool UserPool { get; }
    public UserPoolClient AppClient { get; }
    public Secret JwtSecret { get; }
    public Secret EncryptionKeySecret { get; }
    public Secret AiKeysSecret { get; }

    public ShumelaHireFoundationStack(Construct scope, string id, EnvironmentConfig config,
        IStackProps? props = null) : base(scope, id, props)
    {
        // ── VPC (no NAT — Lambda uses VPC endpoints or runs outside VPC) ────
        Vpc = new Vpc(this, "Vpc", new VpcProps
        {
            VpcName = $"{config.Prefix}-vpc",
            MaxAzs = 2,
            NatGateways = 0,
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
                    Name = "isolated",
                    SubnetType = SubnetType.PRIVATE_ISOLATED,
                    CidrMask = 24
                }
            }
        });

        // ── S3 Buckets ───────────────────────────────────────────────────────
        DocumentsBucket = new Bucket(this, "DocumentsBucket", new BucketProps
        {
            BucketName = $"{config.Prefix}-docs",
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
        AiKeysSecret = new Secret(this, "AiKeysSecret", new SecretProps
        {
            SecretName = $"shumelahire/{config.EnvironmentName}/ai-keys",
            Description = "AI service API keys (Claude, OpenAI)"
        });

        new Secret(this, "DocusignSecret", new SecretProps
        {
            SecretName = $"shumelahire/{config.EnvironmentName}/docusign",
            Description = "DocuSign API credentials"
        });

        EncryptionKeySecret = new Secret(this, "EncryptionKeySecret", new SecretProps
        {
            SecretName = $"shumelahire/{config.EnvironmentName}/encryption-key",
            Description = "Application encryption key"
        });

        JwtSecret = new Secret(this, "JwtSecret", new SecretProps
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

        // ── Cognito Hosted UI Domain ───────────────────────────────────────
        UserPool.AddDomain("Domain", new UserPoolDomainOptions
        {
            CognitoDomain = new CognitoDomainOptions
            {
                DomainPrefix = config.CognitoDomainPrefix
            }
        });

        // ── LinkedIn OIDC Identity Provider (optional) ─────────────────────
        // Pass LinkedIn credentials via CDK context from GitHub environment secrets.
        // When not provided, the IdP is skipped and only email/password login is available.
        var linkedInClientId = (string?)this.Node.TryGetContext("linkedInClientId");
        var linkedInClientSecret = (string?)this.Node.TryGetContext("linkedInClientSecret");
        var hasLinkedIn = !string.IsNullOrEmpty(linkedInClientId) && !string.IsNullOrEmpty(linkedInClientSecret);

        CfnUserPoolIdentityProvider? linkedInIdp = null;
        if (hasLinkedIn)
        {
            linkedInIdp = new CfnUserPoolIdentityProvider(this, "LinkedInIdp", new CfnUserPoolIdentityProviderProps
            {
                UserPoolId = UserPool.UserPoolId,
                ProviderName = "LinkedIn",
                ProviderType = "OIDC",
                ProviderDetails = new Dictionary<string, string>
                {
                    ["client_id"] = linkedInClientId!,
                    ["client_secret"] = linkedInClientSecret!,
                    ["attributes_request_method"] = "GET",
                    ["oidc_issuer"] = "https://www.linkedin.com/oauth",
                    ["authorize_scopes"] = "openid profile email",
                    ["authorize_url"] = "https://www.linkedin.com/oauth/v2/authorization",
                    ["token_url"] = "https://www.linkedin.com/oauth/v2/accessToken",
                    ["attributes_url"] = "https://api.linkedin.com/v2/userinfo",
                    ["jwks_uri"] = "https://www.linkedin.com/oauth/openid/jwks",
                },
                AttributeMapping = new Dictionary<string, string>
                {
                    ["email"] = "email",
                    ["given_name"] = "given_name",
                    ["family_name"] = "family_name",
                    ["name"] = "name",
                    ["username"] = "sub"
                }
            });
        }

        new Secret(this, "LinkedInOAuthSecret", new SecretProps
        {
            SecretName = $"shumelahire/{config.EnvironmentName}/linkedin-oauth",
            Description = "LinkedIn OAuth credentials (client_id, client_secret) for OIDC sign-in"
        });

        // ── App Client (with OAuth) ────────────────────────────────────────
        var supportedProviders = new List<UserPoolClientIdentityProvider>
        {
            UserPoolClientIdentityProvider.COGNITO
        };
        if (hasLinkedIn)
        {
            supportedProviders.Add(UserPoolClientIdentityProvider.Custom("LinkedIn"));
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
            GenerateSecret = false,
            OAuth = new OAuthSettings
            {
                Flows = new OAuthFlows
                {
                    AuthorizationCodeGrant = true
                },
                CallbackUrls = config.OAuthCallbackUrls,
                LogoutUrls = config.OAuthSignOutUrls,
                Scopes = new[]
                {
                    OAuthScope.OPENID,
                    OAuthScope.EMAIL,
                    OAuthScope.PROFILE
                }
            },
            SupportedIdentityProviders = supportedProviders.ToArray()
        });

        // Ensure LinkedIn IdP is created before the app client references it
        if (linkedInIdp != null)
        {
            (AppClient.Node.DefaultChild as CfnUserPoolClient)?.AddDependency(linkedInIdp);
        }

        // ── CfnOutputs ──────────────────────────────────────────────────────
        new CfnOutput(this, "VpcId", new CfnOutputProps { Value = Vpc.VpcId });
        new CfnOutput(this, "DocumentsBucketName", new CfnOutputProps { Value = DocumentsBucket.BucketName });
        new CfnOutput(this, "UploadsBucketName", new CfnOutputProps { Value = UploadsBucket.BucketName });
        new CfnOutput(this, "NotificationQueueUrl", new CfnOutputProps { Value = NotificationQueue.QueueUrl });
        new CfnOutput(this, "UserPoolId", new CfnOutputProps { Value = UserPool.UserPoolId });
        new CfnOutput(this, "UserPoolClientId", new CfnOutputProps { Value = AppClient.UserPoolClientId });
        new CfnOutput(this, "CognitoDomain", new CfnOutputProps
        {
            Value = $"{config.CognitoDomainPrefix}.auth.{config.Region}.amazoncognito.com"
        });
    }
}
