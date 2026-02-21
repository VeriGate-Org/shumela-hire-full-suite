using Amazon.CDK;
using Amazon.CDK.AWS.CloudFront;
using Amazon.CDK.AWS.CloudFront.Origins;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.Route53;
using Amazon.CDK.AWS.Route53.Targets;
using Constructs;
using System.Collections.Generic;

namespace ShumelaHire.Infra;

public class ShumelaHireFrontendStack : Stack
{
    public ShumelaHireFrontendStack(Construct scope, string id, EnvironmentConfig config,
        ShumelaHireComputeStack compute, IStackProps? props = null) : base(scope, id, props)
    {
        var prefix = config.Prefix;

        var frontendDomain = config.EnvironmentName == "prod"
            ? config.DomainName
            : $"{config.EnvironmentName}.{config.DomainName}";

        // ── ALB HTTP Origin ────────────────────────────────────────────────────
        var albDns = compute.AlbDnsName;
        var albOrigin = new HttpOrigin(albDns, new HttpOriginProps
        {
            ProtocolPolicy = OriginProtocolPolicy.HTTP_ONLY
        });

        // ── CloudFront Distribution ──────────────────────────────────────────
        var distributionProps = new DistributionProps
        {
            // Default behavior → frontend (dynamic HTML pages, no caching)
            DefaultBehavior = new BehaviorOptions
            {
                Origin = albOrigin,
                ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                Compress = true,
                CachePolicy = CachePolicy.CACHING_DISABLED,
                OriginRequestPolicy = OriginRequestPolicy.ALL_VIEWER,
                AllowedMethods = AllowedMethods.ALLOW_GET_HEAD_OPTIONS
            },
            AdditionalBehaviors = new Dictionary<string, IBehaviorOptions>
            {
                // Static assets → long cache (immutable JS/CSS)
                ["/_next/static/*"] = new BehaviorOptions
                {
                    Origin = albOrigin,
                    ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    Compress = true,
                    CachePolicy = CachePolicy.CACHING_OPTIMIZED,
                    AllowedMethods = AllowedMethods.ALLOW_GET_HEAD_OPTIONS
                },
                // API pass-through → no caching, all methods
                ["/api/*"] = new BehaviorOptions
                {
                    Origin = albOrigin,
                    ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    CachePolicy = CachePolicy.CACHING_DISABLED,
                    OriginRequestPolicy = OriginRequestPolicy.ALL_VIEWER,
                    AllowedMethods = AllowedMethods.ALLOW_ALL
                }
            },
            MinimumProtocolVersion = SecurityPolicyProtocol.TLS_V1_2_2021,
            HttpVersion = HttpVersion.HTTP2_AND_3
        };

        // Add custom domain and certificate if available
        if (!string.IsNullOrEmpty(config.CertificateArn))
        {
            var domainNames = new List<string> { frontendDomain };

            // Add wildcard subdomain for multi-tenancy only in prod where cert covers *.domain
            // Non-prod wildcard (*.sbx.domain) requires a separate cert
            if (config.EnvironmentName == "prod")
            {
                domainNames.Add($"*.{config.DomainName}");
            }

            distributionProps.DomainNames = domainNames.ToArray();

            // Use wildcard certificate if available, otherwise fall back to base certificate
            var certArn = !string.IsNullOrEmpty(config.WildcardCertificateArn)
                ? config.WildcardCertificateArn
                : config.CertificateArn;
            distributionProps.Certificate = Certificate.FromCertificateArn(
                this, "Certificate", certArn);
        }

        var distribution = new Distribution(this, "Distribution", distributionProps);

        // ── Route 53 (only if certificate is provided) ──────────────────────
        if (!string.IsNullOrEmpty(config.CertificateArn))
        {
            var hostedZone = HostedZone.FromLookup(this, "HostedZone", new HostedZoneProviderProps
            {
                DomainName = config.DomainName
            });

            new ARecord(this, "FrontendDnsRecord", new ARecordProps
            {
                Zone = hostedZone,
                RecordName = frontendDomain,
                Target = RecordTarget.FromAlias(new CloudFrontTarget(distribution))
            });

            // Wildcard A record for tenant subdomains (*.shumelahire.co.za → CloudFront)
            // Only in prod where the cert covers *.domain
            if (config.EnvironmentName == "prod")
            {
                new ARecord(this, "WildcardDnsRecord", new ARecordProps
                {
                    Zone = hostedZone,
                    RecordName = $"*.{config.DomainName}",
                    Target = RecordTarget.FromAlias(new CloudFrontTarget(distribution))
                });
            }
        }

        // ── CfnOutputs ──────────────────────────────────────────────────────
        new CfnOutput(this, "DistributionId", new CfnOutputProps
        {
            Value = distribution.DistributionId,
            ExportName = $"{prefix}-DistributionId"
        });
        new CfnOutput(this, "DistributionDomainName", new CfnOutputProps
        {
            Value = distribution.DistributionDomainName,
            ExportName = $"{prefix}-DistributionDomainName"
        });
        new CfnOutput(this, "FrontendUrl", new CfnOutputProps
        {
            Value = !string.IsNullOrEmpty(config.CertificateArn)
                ? $"https://{frontendDomain}"
                : $"https://{distribution.DistributionDomainName}"
        });
    }
}
