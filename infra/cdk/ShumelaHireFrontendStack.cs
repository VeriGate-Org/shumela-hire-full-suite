using Amazon.CDK;
using Amazon.CDK.AWS.CloudFront;
using Amazon.CDK.AWS.CloudFront.Origins;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.Route53;
using Amazon.CDK.AWS.Route53.Targets;
using Amazon.CDK.AWS.S3;
using Constructs;
using System.Collections.Generic;

namespace ShumelaHire.Infra;

public class ShumelaHireFrontendStack : Stack
{
    public Bucket FrontendBucket { get; }
    public Distribution Distribution { get; }

    public ShumelaHireFrontendStack(Construct scope, string id, EnvironmentConfig config,
        ShumelaHireServerlessStack serverless, IStackProps? props = null) : base(scope, id, props)
    {
        AddDependency(serverless);
        var prefix = config.Prefix;

        var frontendDomain = config.EnvironmentName == "prod"
            ? config.DomainName
            : $"{config.EnvironmentName}.{config.DomainName}";

        // ── S3 Bucket for static frontend assets ─────────────────────────────
        FrontendBucket = new Bucket(this, "FrontendBucket", new BucketProps
        {
            BucketName = $"{prefix}-frontend",
            Encryption = BucketEncryption.S3_MANAGED,
            BlockPublicAccess = BlockPublicAccess.BLOCK_ALL,
            RemovalPolicy = config.IsProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
            AutoDeleteObjects = !config.IsProduction
        });

        // ── Origin Access Control for CloudFront → S3 ────────────────────────
        var oac = new CfnOriginAccessControl(this, "FrontendOAC", new CfnOriginAccessControlProps
        {
            OriginAccessControlConfig = new CfnOriginAccessControl.OriginAccessControlConfigProperty
            {
                Name = $"{prefix}-frontend-oac",
                OriginAccessControlOriginType = "s3",
                SigningBehavior = "always",
                SigningProtocol = "sigv4"
            }
        });

        // ── CloudFront Function: rewrite extensionless URLs to .html ─────────
        // Next.js static export generates dashboard.html, admin/permissions.html,
        // etc. Without this rewrite, S3 returns 403 for /dashboard and the error
        // response fallback serves /index.html (the marketing page).
        var urlRewriteFn = new Function(this, "UrlRewriteFunction", new FunctionProps
        {
            FunctionName = $"{config.Prefix}-url-rewrite",
            Comment = "Appends .html to extensionless paths so S3 can find Next.js static export files",
            Code = FunctionCode.FromInline(@"
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Root path — DefaultRootObject handles /index.html
    if (uri === '/') return request;

    // Skip files that already have an extension (.js, .css, .png, etc.)
    if (uri.includes('.')) return request;

    // Strip trailing slash then append .html
    if (uri.endsWith('/')) uri = uri.slice(0, -1);
    request.uri = uri + '.html';

    return request;
}
")
        });

        // ── CloudFront Function: inject X-Tenant-Id from subdomain ─────────
        var tenantHeaderFn = new Function(this, "TenantHeaderFunction", new FunctionProps
        {
            FunctionName = $"{config.Prefix}-tenant-header",
            Comment = "Extracts tenant subdomain from Host and sets X-Tenant-Id header",
            Code = FunctionCode.FromInline(@"
function handler(event) {
    var request = event.request;
    var host = request.headers.host ? request.headers.host.value : '';
    var parts = host.split('.');
    var envPrefixes = { dev:1, ppe:1, staging:1, qa:1, sandbox:1, sbx:1 };
    if (parts.length >= 4 && !envPrefixes[parts[0]]) {
        request.headers['x-tenant-id'] = { value: parts[0] };
    }
    return request;
}
")
        });

        // ── API Gateway HTTP API Origin ──────────────────────────────────────
        var apiUrl = $"{serverless.HttpApi.Ref}.execute-api.{config.Region}.amazonaws.com";
        var apiOrigin = new HttpOrigin(apiUrl, new HttpOriginProps
        {
            ProtocolPolicy = OriginProtocolPolicy.HTTPS_ONLY
        });

        // ── S3 Origin (using L1 construct for OAC) ───────────────────────────
        var s3Origin = S3BucketOrigin.WithOriginAccessControl(FrontendBucket);

        // ── CloudFront Distribution ──────────────────────────────────────────
        var distributionProps = new DistributionProps
        {
            // Default behavior → S3 static frontend (SPA)
            DefaultBehavior = new BehaviorOptions
            {
                Origin = s3Origin,
                ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                Compress = true,
                CachePolicy = CachePolicy.CACHING_OPTIMIZED,
                AllowedMethods = AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                FunctionAssociations = new[]
                {
                    new FunctionAssociation
                    {
                        Function = urlRewriteFn,
                        EventType = FunctionEventType.VIEWER_REQUEST
                    }
                }
            },
            DefaultRootObject = "index.html",
            // SPA routing: serve index.html for 403/404 (S3 returns 403 for missing keys)
            ErrorResponses = new[]
            {
                new ErrorResponse
                {
                    HttpStatus = 403,
                    ResponseHttpStatus = 200,
                    ResponsePagePath = "/index.html",
                    Ttl = Duration.Seconds(0)
                },
                new ErrorResponse
                {
                    HttpStatus = 404,
                    ResponseHttpStatus = 200,
                    ResponsePagePath = "/index.html",
                    Ttl = Duration.Seconds(0)
                }
            },
            AdditionalBehaviors = new Dictionary<string, IBehaviorOptions>
            {
                // Static assets → long cache (immutable JS/CSS from Next.js build)
                ["/_next/static/*"] = new BehaviorOptions
                {
                    Origin = s3Origin,
                    ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    Compress = true,
                    CachePolicy = CachePolicy.CACHING_OPTIMIZED,
                    AllowedMethods = AllowedMethods.ALLOW_GET_HEAD_OPTIONS
                },
                // API pass-through → API Gateway HTTP API
                ["/api/*"] = new BehaviorOptions
                {
                    Origin = apiOrigin,
                    ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    CachePolicy = CachePolicy.CACHING_DISABLED,
                    OriginRequestPolicy = OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                    AllowedMethods = AllowedMethods.ALLOW_ALL,
                    FunctionAssociations = new[]
                    {
                        new FunctionAssociation
                        {
                            Function = tenantHeaderFn,
                            EventType = FunctionEventType.VIEWER_REQUEST
                        }
                    }
                }
            },
            MinimumProtocolVersion = SecurityPolicyProtocol.TLS_V1_2_2021,
            HttpVersion = HttpVersion.HTTP2_AND_3
        };

        // Add custom domain and certificate if available
        if (!string.IsNullOrEmpty(config.CertificateArn))
        {
            var domainNames = new List<string> { frontendDomain };

            if (config.EnvironmentName == "prod")
            {
                domainNames.Add($"*.{config.DomainName}");
            }
            else if (config.EnvironmentName == "dev")
            {
                // Demo tenant subdomains served from the same distribution
                domainNames.Add($"idc-demo.{config.DomainName}");
                domainNames.Add($"uthukela-demo.{config.DomainName}");
                domainNames.Add($"uthukela.{config.DomainName}");
                domainNames.Add($"demo.{config.DomainName}");
            }

            distributionProps.DomainNames = domainNames.ToArray();

            var certArn = !string.IsNullOrEmpty(config.WildcardCertificateArn)
                ? config.WildcardCertificateArn
                : config.CertificateArn;
            distributionProps.Certificate = Certificate.FromCertificateArn(
                this, "Certificate", certArn);
        }

        Distribution = new Distribution(this, "Distribution", distributionProps);

        // Grant CloudFront OAC access to S3 bucket
        FrontendBucket.AddToResourcePolicy(new Amazon.CDK.AWS.IAM.PolicyStatement(
            new Amazon.CDK.AWS.IAM.PolicyStatementProps
            {
                Effect = Amazon.CDK.AWS.IAM.Effect.ALLOW,
                Principals = new[] { new Amazon.CDK.AWS.IAM.ServicePrincipal("cloudfront.amazonaws.com") },
                Actions = new[] { "s3:GetObject" },
                Resources = new[] { $"{FrontendBucket.BucketArn}/*" },
                Conditions = new Dictionary<string, object>
                {
                    ["StringEquals"] = new Dictionary<string, string>
                    {
                        ["AWS:SourceArn"] = $"arn:aws:cloudfront::{this.Account}:distribution/{Distribution.DistributionId}"
                    }
                }
            }));

        // ── Route 53 (only if certificate is provided) ──────────────────────
        if (!string.IsNullOrEmpty(config.CertificateArn))
        {
            var hostedZone = HostedZone.FromLookup(this, "HostedZone", new HostedZoneProviderProps
            {
                DomainName = config.HostedZoneName
            });

            new ARecord(this, "FrontendDnsRecord", new ARecordProps
            {
                Zone = hostedZone,
                RecordName = frontendDomain,
                Target = RecordTarget.FromAlias(new CloudFrontTarget(Distribution))
            });

            if (config.EnvironmentName == "prod")
            {
                new ARecord(this, "WildcardDnsRecord", new ARecordProps
                {
                    Zone = hostedZone,
                    RecordName = $"*.{config.DomainName}",
                    Target = RecordTarget.FromAlias(new CloudFrontTarget(Distribution))
                });
            }
        }

        // ── CfnOutputs ──────────────────────────────────────────────────────
        new CfnOutput(this, "FrontendBucketName", new CfnOutputProps
        {
            Value = FrontendBucket.BucketName,
            ExportName = $"{prefix}-FrontendBucketName"
        });
        new CfnOutput(this, "DistributionId", new CfnOutputProps
        {
            Value = Distribution.DistributionId,
            ExportName = $"{prefix}-DistributionId"
        });
        new CfnOutput(this, "DistributionDomainName", new CfnOutputProps
        {
            Value = Distribution.DistributionDomainName,
            ExportName = $"{prefix}-DistributionDomainName"
        });
        new CfnOutput(this, "FrontendUrl", new CfnOutputProps
        {
            Value = !string.IsNullOrEmpty(config.CertificateArn)
                ? $"https://{frontendDomain}"
                : $"https://{Distribution.DistributionDomainName}"
        });
    }
}
