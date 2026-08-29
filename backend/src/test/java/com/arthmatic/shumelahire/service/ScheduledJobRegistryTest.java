package com.arthmatic.shumelahire.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ScheduledJobRegistryTest {

    private ReportScheduleRunner reportScheduleRunner;
    private ScheduledJobRegistry registry;

    @BeforeEach
    void setUp() {
        ApplicationContext context = mock(ApplicationContext.class);
        // The optional jobs look their beans up by name; none of them exists here, which is the
        // normal state outside a full application context.
        when(context.getBean(anyString())).thenThrow(new IllegalStateException("no such bean"));
        reportScheduleRunner = mock(ReportScheduleRunner.class);
        registry = new ScheduledJobRegistry(context, reportScheduleRunner);
    }

    @Test
    @DisplayName("the report sweep is registered even when every optional bean is missing")
    void ownedJobsDoNotDependOnBeanLookup() {
        assertThat(registry.jobNames()).contains(ScheduledJobRegistry.REPORT_SCHEDULES);

        registry.run("reportschedules");

        verify(reportScheduleRunner).sweep();
    }

    @Test
    @DisplayName("the name is matched case-insensitively, since it is typed into a CDK rule")
    void matchesTheNameLoosely() {
        registry.run("  ReportSchedules ");

        verify(reportScheduleRunner).sweep();
    }

    @Test
    @DisplayName("an unknown job is an error naming what is registered, not a silent no-op")
    void unknownJobFailsLoudly() {
        assertThatThrownBy(() -> registry.run("reportschedule"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("reportschedule")
                .hasMessageContaining("reportschedules");
    }

    @Test
    @DisplayName("a job that throws propagates, so Lambda records the failure")
    void failuresPropagate() {
        org.mockito.Mockito.doThrow(new IllegalStateException("DynamoDB unavailable"))
                .when(reportScheduleRunner).sweep();

        assertThatThrownBy(() -> registry.run("reportschedules"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DynamoDB unavailable");
    }
}
