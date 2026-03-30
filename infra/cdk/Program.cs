using Amazon.CDK;

namespace ShumelaHire.Infra;

public sealed class Program
{
    public static void Main(string[] args)
    {
        var app = new App();
        var config = EnvironmentConfig.FromContext(app);

        var env = new Amazon.CDK.Environment
        {
            Account = System.Environment.GetEnvironmentVariable("CDK_DEFAULT_ACCOUNT"),
            Region = config.Region
        };

        var foundation = new ShumelaHireFoundationStack(app, $"{config.Prefix}-foundation", config,
            new StackProps { Env = env });

        var serverless = new ShumelaHireServerlessStack(app, $"{config.Prefix}-serverless", config, foundation,
            new StackProps { Env = env });

        var api = new ShumelaHireApiStack(app, $"{config.Prefix}-api", config, serverless,
            new StackProps { Env = env });

        var frontend = new ShumelaHireFrontendStack(app, $"{config.Prefix}-frontend", config, serverless,
            new StackProps { Env = env });

        var analytics = new ShumelaHireAnalyticsStack(app, $"{config.Prefix}-analytics", config, serverless,
            new StackProps { Env = env });

        app.Synth();
    }
}
