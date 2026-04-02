using Amazon.CDK;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.Glue;
using Amazon.CDK.AWS.Athena;
using GlueCfnTable = Amazon.CDK.AWS.Glue.CfnTable;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.Lambda.EventSources;
using Amazon.CDK.AWS.DynamoDB;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Logs;
using Constructs;
using System.Collections.Generic;

namespace ShumelaHire.Infra;

public class ShumelaHireAnalyticsStack : Stack
{
    public Bucket AnalyticsBucket { get; }

    public ShumelaHireAnalyticsStack(Construct scope, string id, EnvironmentConfig config,
        ShumelaHireServerlessStack serverless, IStackProps? props = null) : base(scope, id, props)
    {
        AddDependency(serverless);
        var prefix = config.Prefix;

        // ── S3 Bucket for Parquet analytics data ───────────────────────────────
        AnalyticsBucket = new Bucket(this, "AnalyticsBucket", new BucketProps
        {
            BucketName = $"{prefix}-analytics",
            Encryption = BucketEncryption.S3_MANAGED,
            BlockPublicAccess = BlockPublicAccess.BLOCK_ALL,
            RemovalPolicy = config.IsProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
            AutoDeleteObjects = !config.IsProduction,
            LifecycleRules = new[]
            {
                new Amazon.CDK.AWS.S3.LifecycleRule
                {
                    Id = "TransitionToIA",
                    Prefix = "data/",
                    Transitions = new[]
                    {
                        new Transition
                        {
                            StorageClass = StorageClass.INFREQUENT_ACCESS,
                            TransitionAfter = Duration.Days(90)
                        }
                    }
                },
                new Amazon.CDK.AWS.S3.LifecycleRule
                {
                    Id = "ExpireOldData",
                    Prefix = "data/",
                    Expiration = Duration.Days(730) // 2 years
                }
            }
        });

        // ── Glue Catalog Database ──────────────────────────────────────────────
        new CfnDatabase(this, "GlueDatabase", new CfnDatabaseProps
        {
            CatalogId = this.Account,
            DatabaseInput = new CfnDatabase.DatabaseInputProperty
            {
                Name = $"shumelahire_{config.EnvironmentName}_analytics",
                Description = "ShumelaHire analytics data catalog"
            }
        });

        // ── Athena Workgroup ───────────────────────────────────────────────────
        new CfnWorkGroup(this, "AthenaWorkgroup", new CfnWorkGroupProps
        {
            Name = $"{prefix}-analytics",
            Description = "ShumelaHire analytics query workgroup",
            State = "ENABLED",
            WorkGroupConfiguration = new CfnWorkGroup.WorkGroupConfigurationProperty
            {
                ResultConfiguration = new CfnWorkGroup.ResultConfigurationProperty
                {
                    OutputLocation = $"s3://{AnalyticsBucket.BucketName}/athena-results/"
                },
                EnforceWorkGroupConfiguration = true,
                PublishCloudWatchMetricsEnabled = true,
                BytesScannedCutoffPerQuery = 1073741824 // 1 GB scan limit
            }
        });

        // ── Glue Table Definitions ────────────────────────────────────────────
        var glueDatabaseName = $"shumelahire_{config.EnvironmentName}_analytics";
        var bucketUri = $"s3://{AnalyticsBucket.BucketName}";
        var jsonSerDe = "org.apache.hive.hcatalog.data.JsonSerDe";
        var partitionKeys = new[]
        {
            new GlueCfnTable.ColumnProperty { Name = "year", Type = "string" },
            new GlueCfnTable.ColumnProperty { Name = "month", Type = "string" },
            new GlueCfnTable.ColumnProperty { Name = "day", Type = "string" }
        };

        // Applications table
        CreateGlueTable("ApplicationsTable", glueDatabaseName, "applications", $"{bucketUri}/applications/",
            jsonSerDe, partitionKeys, new[]
            {
                Col("id", "string"), Col("tenantId", "string"), Col("applicantId", "string"),
                Col("jobPostingId", "string"), Col("status", "string"), Col("department", "string"),
                Col("submittedAt", "string"), Col("updatedAt", "string"), Col("rating", "string"),
                Col("source", "string"), Col("_event", "string"), Col("_timestamp", "string")
            });

        // Employees table
        CreateGlueTable("EmployeesTable", glueDatabaseName, "employees", $"{bucketUri}/employees/",
            jsonSerDe, partitionKeys, new[]
            {
                Col("id", "string"), Col("tenantId", "string"), Col("departmentId", "string"),
                Col("status", "string"), Col("startDate", "string"), Col("terminationDate", "string"),
                Col("position", "string"), Col("_event", "string"), Col("_timestamp", "string")
            });

        // Interviews table
        CreateGlueTable("InterviewsTable", glueDatabaseName, "interviews", $"{bucketUri}/interviews/",
            jsonSerDe, partitionKeys, new[]
            {
                Col("id", "string"), Col("tenantId", "string"), Col("applicationId", "string"),
                Col("status", "string"), Col("scheduledAt", "string"), Col("completedAt", "string"),
                Col("rating", "string"), Col("_event", "string"), Col("_timestamp", "string")
            });

        // Offers table
        CreateGlueTable("OffersTable", glueDatabaseName, "offers", $"{bucketUri}/offers/",
            jsonSerDe, partitionKeys, new[]
            {
                Col("id", "string"), Col("tenantId", "string"), Col("applicationId", "string"),
                Col("status", "string"), Col("createdAt", "string"), Col("respondedAt", "string"),
                Col("salaryOffered", "string"), Col("_event", "string"), Col("_timestamp", "string")
            });

        // Recruitment Metrics table
        CreateGlueTable("RecruitmentMetricsTable", glueDatabaseName, "recruitment_metrics",
            $"{bucketUri}/recruitment_metrics/", jsonSerDe, partitionKeys, new[]
            {
                Col("id", "string"), Col("tenantId", "string"), Col("metricName", "string"),
                Col("metricValue", "string"), Col("department", "string"),
                Col("metricDate", "string"), Col("_event", "string"), Col("_timestamp", "string")
            });

        // Attendance Records table
        CreateGlueTable("AttendanceRecordsTable", glueDatabaseName, "attendance_records",
            $"{bucketUri}/attendance_records/", jsonSerDe, partitionKeys, new[]
            {
                Col("id", "string"), Col("tenantId", "string"), Col("employeeId", "string"),
                Col("clockIn", "string"), Col("clockOut", "string"), Col("hoursWorked", "string"),
                Col("_event", "string"), Col("_timestamp", "string")
            });

        // Pipeline Transitions table
        CreateGlueTable("PipelineTransitionsTable", glueDatabaseName, "pipeline_transitions",
            $"{bucketUri}/pipeline_transitions/", jsonSerDe, partitionKeys, new[]
            {
                Col("id", "string"), Col("tenantId", "string"), Col("applicationId", "string"),
                Col("fromStage", "string"), Col("toStage", "string"),
                Col("transitionDate", "string"), Col("_event", "string"), Col("_timestamp", "string")
            });

        // ── Stream Processor Lambda ────────────────────────────────────────────
        var streamProcessorLogGroup = new LogGroup(this, "StreamProcessorLogGroup", new LogGroupProps
        {
            LogGroupName = $"/aws/lambda/{prefix}-stream-processor",
            Retention = config.IsProduction ? RetentionDays.ONE_MONTH : RetentionDays.ONE_WEEK,
            RemovalPolicy = RemovalPolicy.DESTROY
        });

        var streamProcessorRole = new Role(this, "StreamProcessorRole", new RoleProps
        {
            RoleName = $"{prefix}-stream-processor-role",
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            ManagedPolicies = new[]
            {
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            }
        });

        // Grant S3 write access for Parquet output
        AnalyticsBucket.GrantWrite(streamProcessorRole);

        // Grant DynamoDB Stream read access
        serverless.DataTable.GrantStreamRead(streamProcessorRole);

        // Grant DynamoDB read/write for pre-computed metrics
        serverless.DataTable.GrantReadWriteData(streamProcessorRole);

        var streamProcessor = new DockerImageFunction(this, "StreamProcessor", new DockerImageFunctionProps
        {
            Code = DockerImageCode.FromImageAsset("../../backend", new AssetImageCodeProps
            {
                File = "Dockerfile.lambda",
                Cmd = new[] { "com.arthmatic.shumelahire.lambda.StreamProcessorHandler::handleRequest" }
            }),
            MemorySize = 1024,
            Timeout = Duration.Minutes(5),
            Role = streamProcessorRole,
            LogGroup = streamProcessorLogGroup,
            Environment = new Dictionary<string, string>
            {
                ["DYNAMODB_TABLE_NAME"] = serverless.DataTable.TableName,
                ["ANALYTICS_BUCKET"] = AnalyticsBucket.BucketName,
                ["GLUE_DATABASE"] = $"shumelahire_{config.EnvironmentName}_analytics",
                ["AWS_REGION_OVERRIDE"] = config.Region
            }
        });

        // Trigger from DynamoDB Streams
        streamProcessor.AddEventSource(new DynamoEventSource(serverless.DataTable,
            new DynamoEventSourceProps
            {
                StartingPosition = StartingPosition.TRIM_HORIZON,
                BatchSize = 100,
                MaxBatchingWindow = Duration.Seconds(30),
                RetryAttempts = 3,
                BisectBatchOnError = true,
                ParallelizationFactor = 2,
                ReportBatchItemFailures = true
            }));

        // ── CfnOutputs ──────────────────────────────────────────────────────
        new CfnOutput(this, "AnalyticsBucketName", new CfnOutputProps
        {
            Value = AnalyticsBucket.BucketName,
            ExportName = $"{prefix}-AnalyticsBucketName"
        });
        new CfnOutput(this, "AthenaWorkgroupName", new CfnOutputProps
        {
            Value = $"{prefix}-analytics",
            ExportName = $"{prefix}-AthenaWorkgroupName"
        });
    }

    private void CreateGlueTable(string constructId, string databaseName, string tableName,
        string s3Location, string serDeLib, GlueCfnTable.ColumnProperty[] partitionKeys,
        GlueCfnTable.ColumnProperty[] columns)
    {
        new GlueCfnTable(this, constructId, new Amazon.CDK.AWS.Glue.CfnTableProps
        {
            CatalogId = this.Account,
            DatabaseName = databaseName,
            TableInput = new GlueCfnTable.TableInputProperty
            {
                Name = tableName,
                TableType = "EXTERNAL_TABLE",
                Parameters = new Dictionary<string, object>
                {
                    ["classification"] = "json",
                    ["typeOfData"] = "file"
                },
                StorageDescriptor = new GlueCfnTable.StorageDescriptorProperty
                {
                    Columns = columns,
                    Location = s3Location,
                    InputFormat = "org.apache.hadoop.mapred.TextInputFormat",
                    OutputFormat = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
                    SerdeInfo = new GlueCfnTable.SerdeInfoProperty
                    {
                        SerializationLibrary = serDeLib,
                        Parameters = new Dictionary<string, object>
                        {
                            ["serialization.format"] = "1"
                        }
                    }
                },
                PartitionKeys = partitionKeys
            }
        });
    }

    private static GlueCfnTable.ColumnProperty Col(string name, string type) =>
        new GlueCfnTable.ColumnProperty { Name = name, Type = type };
}
