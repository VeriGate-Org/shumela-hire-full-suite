using Amazon.CDK;
using Amazon.CDK.AWS.WAFv2;
using Amazon.CDK.AWS.Route53;
using Amazon.CDK.AWS.Route53.Targets;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.ElasticLoadBalancingV2;
using Constructs;
using System.Collections.Generic;

namespace ShumelaHire.Infra;

public class ShumelaHireApiStack : Stack
{
    public ShumelaHireApiStack(Construct scope, string id, EnvironmentConfig config,
        ShumelaHireComputeStack compute, IStackProps? props = null) : base(scope, id, props)
    {
        AddDependency(compute);
        var prefix = config.Prefix;

        // ── WAF WebACL ───────────────────────────────────────────────────────
        var webAcl = new CfnWebACL(this, "WebAcl", new CfnWebACLProps
        {
            Name = $"{prefix}-waf",
            Scope = "REGIONAL",
            DefaultAction = new CfnWebACL.DefaultActionProperty
            {
                Allow = new CfnWebACL.AllowActionProperty()
            },
            VisibilityConfig = new CfnWebACL.VisibilityConfigProperty
            {
                CloudWatchMetricsEnabled = true,
                MetricName = $"{prefix}-waf",
                SampledRequestsEnabled = true
            },
            Rules = new object[]
            {
                // AWS Common Rule Set
                new CfnWebACL.RuleProperty
                {
                    Name = "AWSManagedRulesCommonRuleSet",
                    Priority = 1,
                    OverrideAction = new CfnWebACL.OverrideActionProperty { None = new Dictionary<string, object>() },
                    Statement = new CfnWebACL.StatementProperty
                    {
                        ManagedRuleGroupStatement = new CfnWebACL.ManagedRuleGroupStatementProperty
                        {
                            VendorName = "AWS",
                            Name = "AWSManagedRulesCommonRuleSet"
                        }
                    },
                    VisibilityConfig = new CfnWebACL.VisibilityConfigProperty
                    {
                        CloudWatchMetricsEnabled = true,
                        MetricName = "AWSManagedRulesCommonRuleSet",
                        SampledRequestsEnabled = true
                    }
                },
                // AWS SQL Injection Rule Set
                new CfnWebACL.RuleProperty
                {
                    Name = "AWSManagedRulesSQLiRuleSet",
                    Priority = 2,
                    OverrideAction = new CfnWebACL.OverrideActionProperty { None = new Dictionary<string, object>() },
                    Statement = new CfnWebACL.StatementProperty
                    {
                        ManagedRuleGroupStatement = new CfnWebACL.ManagedRuleGroupStatementProperty
                        {
                            VendorName = "AWS",
                            Name = "AWSManagedRulesSQLiRuleSet"
                        }
                    },
                    VisibilityConfig = new CfnWebACL.VisibilityConfigProperty
                    {
                        CloudWatchMetricsEnabled = true,
                        MetricName = "AWSManagedRulesSQLiRuleSet",
                        SampledRequestsEnabled = true
                    }
                },
                // Rate limiting: 2000 requests per 5 minutes per IP
                new CfnWebACL.RuleProperty
                {
                    Name = "RateLimitRule",
                    Priority = 3,
                    Action = new CfnWebACL.RuleActionProperty
                    {
                        Block = new CfnWebACL.BlockActionProperty()
                    },
                    Statement = new CfnWebACL.StatementProperty
                    {
                        RateBasedStatement = new CfnWebACL.RateBasedStatementProperty
                        {
                            Limit = 2000,
                            AggregateKeyType = "IP"
                        }
                    },
                    VisibilityConfig = new CfnWebACL.VisibilityConfigProperty
                    {
                        CloudWatchMetricsEnabled = true,
                        MetricName = "RateLimitRule",
                        SampledRequestsEnabled = true
                    }
                }
            }
        });

        // Associate WAF with ALB
        new CfnWebACLAssociation(this, "WafAlbAssociation", new CfnWebACLAssociationProps
        {
            ResourceArn = Fn.ImportValue($"{prefix}-AlbArn"),
            WebAclArn = webAcl.AttrArn
        });

        // ── Route 53 (only if certificate is provided) ──────────────────────
        if (!string.IsNullOrEmpty(config.ApiCertificateArn))
        {
            var apiDomain = config.EnvironmentName == "prod"
                ? config.ApiDomainName
                : $"api.{config.EnvironmentName}.{config.DomainName}";

            var hostedZone = HostedZone.FromLookup(this, "HostedZone", new HostedZoneProviderProps
            {
                DomainName = config.HostedZoneName
            });

            var albDns = Fn.ImportValue($"{prefix}-AlbDnsName");

            new CnameRecord(this, "ApiDnsRecord", new CnameRecordProps
            {
                Zone = hostedZone,
                RecordName = apiDomain,
                DomainName = albDns,
                Ttl = Duration.Minutes(5)
            });
        }

        // ── CfnOutputs ──────────────────────────────────────────────────────
        new CfnOutput(this, "WafWebAclArn", new CfnOutputProps
        {
            Value = webAcl.AttrArn,
            ExportName = $"{prefix}-WafWebAclArn"
        });
    }
}
