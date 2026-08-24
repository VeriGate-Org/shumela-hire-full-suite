package com.arthmatic.shumelahire.config;

import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.repository.JobBoardPostingDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.jobboard.JobBoardConnector;
import com.arthmatic.shumelahire.service.jobboard.SimulatedJobBoardConnector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Registers a sandbox provider for any job board configured with
 * {@code job-boards.<board>.mode=simulated}.
 *
 * Two switches have to agree before anything simulates, and both are off by
 * default:
 *
 *   - {@code job-boards.<board>.mode=simulated} — which boards
 *   - {@code job-boards.simulated-tenants} — which tenants
 *
 * The second exists because a deployment is shared. Enabling simulation for a
 * demonstration tenant must not hand a different, paying tenant on the same
 * deployment a posting that claims to be live and is not; those tenants keep
 * the manual-posting behaviour. With no tenants listed, nothing simulates for
 * anyone however the board modes are set.
 *
 * A board configured for simulation should not also carry
 * {@code enabled=true}; if it does, {@code JobBoardConnectorRegistry} prefers
 * whichever connector reports itself enabled for the tenant in context.
 */
@Configuration
public class JobBoardSimulationConfig {

    private final Set<String> simulatedTenants;

    public JobBoardSimulationConfig(
            @Value("${job-boards.simulated-tenants:}") String simulatedTenants) {
        this.simulatedTenants = parseTenants(simulatedTenants);
    }

    static Set<String> parseTenants(String csv) {
        if (csv == null || csv.isBlank()) {
            return Collections.emptySet();
        }
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(tenant -> !tenant.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private JobBoardConnector simulate(JobBoardType type,
                                       JobBoardPostingDataRepository repository,
                                       AuditLogService auditLogService) {
        return new SimulatedJobBoardConnector(type, repository, auditLogService, simulatedTenants);
    }

    @Bean
    @ConditionalOnProperty(name = "job-boards.pnet.mode", havingValue = "simulated")
    public JobBoardConnector simulatedPNetConnector(JobBoardPostingDataRepository repository,
                                                    AuditLogService auditLogService) {
        return simulate(JobBoardType.PNET, repository, auditLogService);
    }

    @Bean
    @ConditionalOnProperty(name = "job-boards.career-junction.mode", havingValue = "simulated")
    public JobBoardConnector simulatedCareerJunctionConnector(JobBoardPostingDataRepository repository,
                                                              AuditLogService auditLogService) {
        return simulate(JobBoardType.CAREER_JUNCTION, repository, auditLogService);
    }

    @Bean
    @ConditionalOnProperty(name = "job-boards.indeed.mode", havingValue = "simulated")
    public JobBoardConnector simulatedIndeedConnector(JobBoardPostingDataRepository repository,
                                                      AuditLogService auditLogService) {
        return simulate(JobBoardType.INDEED, repository, auditLogService);
    }

    @Bean
    @ConditionalOnProperty(name = "job-boards.linkedin.mode", havingValue = "simulated")
    public JobBoardConnector simulatedLinkedInConnector(JobBoardPostingDataRepository repository,
                                                        AuditLogService auditLogService) {
        return simulate(JobBoardType.LINKEDIN, repository, auditLogService);
    }
}
