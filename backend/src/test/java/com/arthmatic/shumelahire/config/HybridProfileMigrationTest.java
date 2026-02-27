package com.arthmatic.shumelahire.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Validates that SQL Server migration files do not contain PostgreSQL-specific syntax.
 */
class HybridProfileMigrationTest {

    @Test
    void sqlServerMigrations_ExistAndAreNotEmpty() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath:db/migration/sqlserver/V*.sql");

        assertThat(resources).isNotEmpty();
        assertThat(resources.length).isGreaterThanOrEqualTo(12);
    }

    @Test
    void sqlServerMigrations_DoNotContainPostgresSpecificSyntax() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath:db/migration/sqlserver/V*.sql");

        for (Resource resource : resources) {
            String content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            String filename = resource.getFilename();

            // Check for PostgreSQL-specific keywords
            assertThat(content).as("File %s should not contain BIGSERIAL", filename)
                    .doesNotContainIgnoringCase("BIGSERIAL");
            assertThat(content).as("File %s should not contain BOOLEAN (use BIT)", filename)
                    .doesNotContain(" BOOLEAN ");
            assertThat(content).as("File %s should not contain plpgsql", filename)
                    .doesNotContainIgnoringCase("plpgsql");
            assertThat(content).as("File %s should not contain CREATE TYPE", filename)
                    .doesNotContainIgnoringCase("CREATE TYPE");
            assertThat(content).as("File %s should not contain EXECUTE FUNCTION", filename)
                    .doesNotContainIgnoringCase("EXECUTE FUNCTION");
            assertThat(content).as("File %s should not contain JSONB", filename)
                    .doesNotContainIgnoringCase("JSONB");
            assertThat(content).as("File %s should not contain ENABLE ROW LEVEL SECURITY", filename)
                    .doesNotContainIgnoringCase("ENABLE ROW LEVEL SECURITY");
        }
    }

    @Test
    void sqlServerMigrations_UseSqlServerSyntax() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath:db/migration/sqlserver/V001*.sql");

        assertThat(resources).hasSize(1);
        String content = new String(resources[0].getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        // Should use SQL Server identity columns
        assertThat(content).contains("IDENTITY(1,1)");
        // Should use DATETIME2 instead of TIMESTAMP
        assertThat(content).contains("DATETIME2");
        // Should use GETDATE() instead of CURRENT_TIMESTAMP
        assertThat(content).contains("GETDATE()");
        // Should use BIT instead of BOOLEAN
        assertThat(content).contains("BIT ");
        // Should use NVARCHAR(MAX) instead of TEXT for large text
        assertThat(content).contains("NVARCHAR(MAX)");
    }
}
