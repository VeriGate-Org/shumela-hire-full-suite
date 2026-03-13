package com.arthmatic.shumelahire.config.tenant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.datasource.DelegatingDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

@Configuration
@Profile({"cloud", "ppe", "prod"})
public class TenantAwareDataSourceConfig {

    private static final Logger logger = LoggerFactory.getLogger(TenantAwareDataSourceConfig.class);

    @Bean
    @Primary
    public DataSource tenantAwareDataSource(DataSourceProperties properties) {
        DataSource baseDataSource = properties.initializeDataSourceBuilder().build();
        return new TenantSettingDataSource(baseDataSource);
    }

    private static class TenantSettingDataSource extends DelegatingDataSource {

        TenantSettingDataSource(DataSource targetDataSource) {
            super(targetDataSource);
        }

        @Override
        public Connection getConnection() throws SQLException {
            Connection connection = super.getConnection();
            setTenantOnConnection(connection);
            return connection;
        }

        @Override
        public Connection getConnection(String username, String password) throws SQLException {
            Connection connection = super.getConnection(username, password);
            setTenantOnConnection(connection);
            return connection;
        }

        private void setTenantOnConnection(Connection connection) throws SQLException {
            String tenantId = TenantContext.getCurrentTenant();
            if (tenantId != null) {
                try (Statement stmt = connection.createStatement()) {
                    stmt.execute("SET app.current_tenant = '" + tenantId.replace("'", "''") + "'");
                }
            }
        }
    }
}
