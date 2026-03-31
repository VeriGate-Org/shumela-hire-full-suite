using Amazon.CDK;
using Amazon.CDK.AWS.WAFv2;
using Constructs;
using System.Collections.Generic;

namespace ShumelaHire.Infra;

public class ShumelaHireApiStack : Stack
{
    public CfnWebACL WebAcl { get; }

    public ShumelaHireApiStack(Construct scope, string id, EnvironmentConfig config,
        ShumelaHireServerlessStack serverless, IStackProps? props = null) : base(scope, id, props)
    {
        AddDependency(serverless);
        var prefix = config.Prefix;

        // ── WAF WebACL (CLOUDFRONT scope for CloudFront distribution) ───────
        // Note: CloudFront WAF must be in us-east-1. For regional resources,
        // use REGIONAL scope. Since our frontend stack handles CloudFront
        // association, we create a REGIONAL WAF for API Gateway if needed.
        WebAcl = new CfnWebACL(this, "WebAcl", new CfnWebACLProps
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

        // ── Associate WAF with API Gateway HTTP API stage ────────────────────
        // Note: WAFv2 WebACL association with API Gateway HTTP API (v2) is not
        // supported in all regions. The association is skipped for now; the WAF
        // WebACL is still created for use by CloudFront via the frontend stack.
        // TODO: Re-enable when WAFv2 adds HTTP API support in af-south-1, or
        //       migrate to REST API (v1) if WAF protection is critical.

        // ── CfnOutputs ──────────────────────────────────────────────────────
        new CfnOutput(this, "WafWebAclArn", new CfnOutputProps
        {
            Value = WebAcl.AttrArn,
            ExportName = $"{prefix}-WafWebAclArn"
        });
    }
}
