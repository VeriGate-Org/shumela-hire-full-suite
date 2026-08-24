package com.arthmatic.shumelahire.config;

import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.repository.JobBoardPostingDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.jobboard.JobBoardConnector;
import com.arthmatic.shumelahire.service.jobboard.SimulatedJobBoardConnector;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers a sandbox provider for any job board configured with
 * {@code job-boards.<board>.mode=simulated}.
 *
 * Each board is independent: a deployment can run PNet simulated while Indeed
 * is live, or run none simulated at all, which is the default. Nothing here
 * activates unless the property is set explicitly for that board — there is no
 * "simulate everything" switch, because a board silently pretending to publish
 * is the one failure mode that must never happen by accident.
 *
 * A board configured for simulation should not also carry
 * {@code enabled=true}; if it does, {@code JobBoardConnectorRegistry} prefers
 * whichever connector reports itself enabled.
 */
@Configuration
public class JobBoardSimulationConfig {

    @Bean
    @ConditionalOnProperty(name = "job-boards.pnet.mode", havingValue = "simulated")
    public JobBoardConnector simulatedPNetConnector(JobBoardPostingDataRepository repository,
                                                    AuditLogService auditLogService) {
        return new SimulatedJobBoardConnector(JobBoardType.PNET, repository, auditLogService);
    }

    @Bean
    @ConditionalOnProperty(name = "job-boards.career-junction.mode", havingValue = "simulated")
    public JobBoardConnector simulatedCareerJunctionConnector(JobBoardPostingDataRepository repository,
                                                              AuditLogService auditLogService) {
        return new SimulatedJobBoardConnector(JobBoardType.CAREER_JUNCTION, repository, auditLogService);
    }

    @Bean
    @ConditionalOnProperty(name = "job-boards.indeed.mode", havingValue = "simulated")
    public JobBoardConnector simulatedIndeedConnector(JobBoardPostingDataRepository repository,
                                                      AuditLogService auditLogService) {
        return new SimulatedJobBoardConnector(JobBoardType.INDEED, repository, auditLogService);
    }

    @Bean
    @ConditionalOnProperty(name = "job-boards.linkedin.mode", havingValue = "simulated")
    public JobBoardConnector simulatedLinkedInConnector(JobBoardPostingDataRepository repository,
                                                        AuditLogService auditLogService) {
        return new SimulatedJobBoardConnector(JobBoardType.LINKEDIN, repository, auditLogService);
    }
}
