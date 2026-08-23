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

        // ── CloudFront Function: SPA fallback for S3 origin only ────────────
        // When S3 returns 403/404 (missing .html file), redirect to root.
        // This replaces the distribution-level ErrorResponses which also
        // intercepted API 403/404 responses, breaking JSON error handling.
        var spaFallbackFn = new Function(this, "SpaFallbackFunction", new FunctionProps
        {
            FunctionName = $"{config.Prefix}-spa-fallback",
            Comment = "Redirects S3 403/404 to root for SPA routing (does not affect /api/* behavior)",
            Code = FunctionCode.FromInline(@"
function handler(event) {
    var response = event.response;
    var request = event.request;
    var status = response.statusCode;
    if (status === 403 || status === 404) {
        var uri = request.uri;
        var isPage = !uri.includes('.') || uri.endsWith('.html');
        if (isPage) {
            response.statusCode = 302;
            response.statusDescription = 'Found';
            response.headers['location'] = { value: '/' };
        }
    }
    return response;
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

        // ── CloudFront Function: rewrite /jobs/<slug> to the static shell ───
        // Next.js static export only pre-renders one placeholder job detail
        // page (slug "_"); real slugs don't exist as S3 objects, so without
        // this every /jobs/<slug> URL 404s/403s straight from S3. The
        // response-side SpaFallbackFunction can't fix this up: CloudFront
        // skips viewer-response functions entirely whenever the origin
        // returns a 400+ status. So instead this runs on viewer-request,
        // before S3 is ever hit, and unconditionally serves the shell — the
        // page then reads the real slug from the browser URL and fetches the
        // job client-side (see IDCJobDetailClient).
        var jobsDetailRewriteFn = new Function(this, "JobsDetailRewriteFunction", new FunctionProps
        {
            FunctionName = $"{config.Prefix}-jobs-detail-rewrite",
            Comment = "Rewrites /jobs/<slug> to the static job-detail shell so S3 always has the object",
            Code = FunctionCode.FromInline(@"
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    // Only rewrite page requests (no extension, or already .html). Leaves
    // any other asset-like request under /jobs/* (e.g. RSC prefetch
    // payloads) untouched instead of corrupting it with HTML content.
    var isPage = uri.indexOf('.') === -1 || uri.slice(-5) === '.html';
    if (isPage) {
        request.uri = '/jobs/_.html';
    }
    return request;
}
")
        });

        // ── CloudFront Function: rewrite /requisitions/<id> to the static shell
        // Same issue and same fix as JobsDetailRewriteFunction above, on a
        // different route: /requisitions/[id] only pre-renders one placeholder
        // ("_"), so any real requisition id 403s straight from S3 on a direct
        // load or refresh (in-app client-side navigation never hits this,
        // since it never issues a real HTTP request for the new path).
        // Unlike /jobs/*, this behavior's path pattern also covers
        // /requisitions/new — a real static page, not a dynamic id — so that
        // one case is special-cased to the normal extensionless->.html
        // rewrite instead (this behavior doesn't run the default behavior's
        // UrlRewriteFunction, so it has to handle that itself).
        var requisitionsDetailRewriteFn = new Function(this, "RequisitionsDetailRewriteFunction", new FunctionProps
        {
            FunctionName = $"{config.Prefix}-requisitions-detail-rewrite",
            Comment = "Rewrites /requisitions/<id> to the static shell so S3 always has the object",
            Code = FunctionCode.FromInline(@"
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // /requisitions/new is a real static page, not a dynamic [id].
    if (uri === '/requisitions/new' || uri.indexOf('/requisitions/new/') === 0) {
        if (uri.indexOf('.') === -1) {
            if (uri.endsWith('/')) uri = uri.slice(0, -1);
            request.uri = uri + '.html';
        }
        return request;
    }

    // Everything else under /requisitions/* is the [id] detail page — only
    // one placeholder (""_"") was ever pre-rendered, so always serve it.
    var isPage = uri.indexOf('.') === -1 || uri.slice(-5) === '.html';
    if (isPage) {
        request.uri = '/requisitions/_.html';
    }
    return request;
}
")
        });

        // ── CloudFront Function: rewrite /apply/<id> to the static shell ────
        // Same issue and same fix as JobsDetailRewriteFunction above:
        // /apply/[requisitionId] only pre-renders one placeholder ("_"), so
        // any real id 403s straight from S3 on a direct load or refresh.
        // No sibling static pages under /apply/*, so no special-casing needed.
        var applyRewriteFn = new Function(this, "ApplyRewriteFunction", new FunctionProps
        {
            FunctionName = $"{config.Prefix}-apply-rewrite",
            Comment = "Rewrites /apply/<id> to the static shell so S3 always has the object",
            Code = FunctionCode.FromInline(@"
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var isPage = uri.indexOf('.') === -1 || uri.slice(-5) === '.html';
    if (isPage) {
        request.uri = '/apply/_.html';
    }
    return request;
}
")
        });

        // ── CloudFront Function: rewrite /internal/apply/<id> to the shell ──
        // Same fix, for the authenticated internal application flow that
        // /apply/<id> redirects to after login.
        var internalApplyRewriteFn = new Function(this, "InternalApplyRewriteFunction", new FunctionProps
        {
            FunctionName = $"{config.Prefix}-internal-apply-rewrite",
            Comment = "Rewrites /internal/apply/<id> to the static shell so S3 always has the object",
            Code = FunctionCode.FromInline(@"
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var isPage = uri.indexOf('.') === -1 || uri.slice(-5) === '.html';
    if (isPage) {
        request.uri = '/internal/apply/_.html';
    }
    return request;
}
")
        });

        // ── CloudFront Function: rewrite /internal/jobs/<id> to the shell ───
        // Same issue and same fix as RequisitionsDetailRewriteFunction above:
        // /internal/jobs/[id] only pre-renders one placeholder ("_"), so any
        // real job id 403s straight from S3 on a direct load or refresh.
        // Unlike /requisitions/*, there's no sibling static page under
        // /internal/jobs/* to special-case — bare /internal/jobs (the list
        // page) stays on the default behavior since this pattern only
        // matches paths with something after /internal/jobs/.
        var internalJobsDetailRewriteFn = new Function(this, "InternalJobsDetailRewriteFunction", new FunctionProps
        {
            FunctionName = $"{config.Prefix}-internal-jobs-detail-rewrite",
            Comment = "Rewrites /internal/jobs/<id> to the static shell so S3 always has the object",
            Code = FunctionCode.FromInline(@"
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var isPage = uri.indexOf('.') === -1 || uri.slice(-5) === '.html';
    if (isPage) {
        request.uri = '/internal/jobs/_.html';
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
                    },
                    new FunctionAssociation
                    {
                        Function = spaFallbackFn,
                        EventType = FunctionEventType.VIEWER_RESPONSE
                    }
                }
            },
            DefaultRootObject = "index.html",
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
                },
                // Job detail pages → always serve the static shell; the real
                // slug is resolved and fetched client-side (see comment above
                // on JobsDetailRewriteFunction). Does not affect bare /jobs
                // (the list page), which stays on the default behavior.
                ["/jobs/*"] = new BehaviorOptions
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
                            Function = jobsDetailRewriteFn,
                            EventType = FunctionEventType.VIEWER_REQUEST
                        }
                    }
                },
                // Requisition detail pages → same technique, see comment above
                // on RequisitionsDetailRewriteFunction. Does not affect bare
                // /requisitions or /requisitions/new, which stay on the
                // default behavior.
                ["/requisitions/*"] = new BehaviorOptions
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
                            Function = requisitionsDetailRewriteFn,
                            EventType = FunctionEventType.VIEWER_REQUEST
                        }
                    }
                },
                // Public apply-redirect page → same technique.
                ["/apply/*"] = new BehaviorOptions
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
                            Function = applyRewriteFn,
                            EventType = FunctionEventType.VIEWER_REQUEST
                        }
                    }
                },
                // Internal (authenticated) application flow → same technique.
                ["/internal/apply/*"] = new BehaviorOptions
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
                            Function = internalApplyRewriteFn,
                            EventType = FunctionEventType.VIEWER_REQUEST
                        }
                    }
                },
                // Internal job detail pages → same technique, see comment
                // above on InternalJobsDetailRewriteFunction. Does not affect
                // bare /internal/jobs (the list page), which stays on the
                // default behavior.
                ["/internal/jobs/*"] = new BehaviorOptions
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
                            Function = internalJobsDetailRewriteFn,
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
            // Tenant subdomains (idc, uthukela, etc.) are served from the prod
            // distribution via the *.shumelahire.co.za wildcard. Dev only serves
            // its own apex (dev.shumelahire.co.za).

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
