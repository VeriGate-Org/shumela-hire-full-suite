using Amazon.CDK;

namespace ShumelaHire.Infra;

public sealed class EnvironmentConfig
{
    public required string EnvironmentName { get; init; }
    public required string DomainName { get; init; }
    public required string ApiDomainName { get; init; }
    public required string HostedZoneName { get; init; }
    public string? CertificateArn { get; init; }
    public string? WildcardCertificateArn { get; init; }
    public string? ApiCertificateArn { get; init; }
    public required string Region { get; init; }

    public bool IsProduction => EnvironmentName == "prod";

    public string[] CorsOrigins => EnvironmentName switch
    {
        "prod" => new[] { $"https://{DomainName}", $"https://www.{DomainName}", $"https://*.{DomainName}" },
        "ppe" => new[] { $"https://ppe.{DomainName}", $"https://*.ppe.{DomainName}" },
        "sbx" => new[] { $"https://sbx.{DomainName}", $"https://*.sbx.{DomainName}" },
        "dev" => new[] { $"https://dev.{DomainName}", $"https://*.dev.{DomainName}", "http://localhost:3000", "http://*.localhost:3000" },
        _ => new[] { "http://localhost:3000", "http://localhost:3001", "http://*.localhost:3000" }
    };

    public string UiUrl => EnvironmentName switch
    {
        "prod" => $"https://{DomainName}",
        _ => $"https://{EnvironmentName}.{DomainName}"
    };

    public string ApiUrl => EnvironmentName switch
    {
        "prod" => $"https://{ApiDomainName}",
        _ => $"https://api.{EnvironmentName}.{DomainName}"
    };

    public string Prefix => $"shumelahire-{EnvironmentName}";

    public string CognitoDomainPrefix => EnvironmentName == "prod" ? "shumelahire" : $"shumelahire-{EnvironmentName}-auth";

    public string[] OAuthCallbackUrls => EnvironmentName switch
    {
        "prod" => new[] { $"https://{DomainName}/login", $"https://idc-demo.{DomainName}/login" },
        "dev" => new[] { $"https://dev.{DomainName}/login", "http://localhost:3000/login" },
        "sbx" => new[] { $"https://sbx.{DomainName}/login", $"https://idc-demo.{DomainName}/login" },
        _ => new[] { $"https://{EnvironmentName}.{DomainName}/login" }
    };

    public string[] OAuthSignOutUrls => EnvironmentName switch
    {
        "prod" => new[] { $"https://{DomainName}/login", $"https://idc-demo.{DomainName}/login" },
        "dev" => new[] { $"https://dev.{DomainName}/login", "http://localhost:3000/login" },
        "sbx" => new[] { $"https://sbx.{DomainName}/login", $"https://idc-demo.{DomainName}/login" },
        _ => new[] { $"https://{EnvironmentName}.{DomainName}/login" }
    };

    /// <summary>
    /// Spring Boot profile. The dev AWS environment uses the sbx profile
    /// because deployed environments authenticate via Cognito, not local JWTs.
    /// </summary>
    public string SpringProfile => EnvironmentName == "dev" ? "sbx" : EnvironmentName;

    public static EnvironmentConfig FromContext(App app)
    {
        var env = (string?)app.Node.TryGetContext("env")
                  ?? System.Environment.GetEnvironmentVariable("SHUMELAHIRE_ENV")
                  ?? "dev";

        var domain = (string?)app.Node.TryGetContext("domain")
                     ?? System.Environment.GetEnvironmentVariable("SHUMELAHIRE_DOMAIN")
                     ?? "shumelahire.co.za";

        var region = (string?)app.Node.TryGetContext("region")
                     ?? System.Environment.GetEnvironmentVariable("CDK_DEFAULT_REGION")
                     ?? "af-south-1";

        var certArn = (string?)app.Node.TryGetContext("certificateArn")
                      ?? System.Environment.GetEnvironmentVariable("CERTIFICATE_ARN");

        var apiCertArn = (string?)app.Node.TryGetContext("apiCertificateArn")
                         ?? System.Environment.GetEnvironmentVariable("API_CERTIFICATE_ARN");

        var wildcardCertArn = (string?)app.Node.TryGetContext("wildcardCertificateArn")
                              ?? System.Environment.GetEnvironmentVariable("WILDCARD_CERTIFICATE_ARN");

        var hostedZoneName = (string?)app.Node.TryGetContext("hostedZoneName")
                             ?? System.Environment.GetEnvironmentVariable("HOSTED_ZONE_NAME")
                             ?? domain;

        return new EnvironmentConfig
        {
            EnvironmentName = env,
            DomainName = domain,
            ApiDomainName = $"api.{domain}",
            HostedZoneName = hostedZoneName,
            CertificateArn = certArn,
            WildcardCertificateArn = wildcardCertArn,
            ApiCertificateArn = apiCertArn,
            Region = region
        };
    }
}
