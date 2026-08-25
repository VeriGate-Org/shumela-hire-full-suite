package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.PipelineStage;
import com.arthmatic.shumelahire.entity.PipelineTransition;
import com.arthmatic.shumelahire.entity.TransitionType;
import com.arthmatic.shumelahire.repository.dynamo.items.PipelineTransitionItem;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The pipeline analytics queries.
 *
 * <p><b>Sixteen methods on this repository threw {@code UnsupportedOperationException("Analytics
 * queries will be migrated to Athena")}.</b> Eight of them have live callers reached from
 * {@code PipelineController}, so those endpoints were not unfinished features — they were 500s, and
 * had been since the JPA repository this class replaced was deleted.
 *
 * <p>The awkward part of these figures is not the arithmetic, it is deciding which stage a number
 * belongs to and which rows to leave out. Those are the cases pinned here: a duration recorded on
 * the way out of a stage belongs to the stage being left, "stuck" is a property of an application's
 * latest transition rather than any transition, and a row with nothing recorded must not be counted
 * as a zero.
 */
class PipelineAnalyticsQueryTest {

    private static final LocalDateTime START = LocalDateTime.of(2026, 8, 1, 0, 0);
    private static final LocalDateTime END = LocalDateTime.of(2026, 8, 31, 23, 59);

    private List<PipelineTransition> stored;
    private DynamoPipelineTransitionRepository repository;

    /** Feeds fixtures in place of the GSI6 read, so the aggregation is testable without DynamoDB. */
    private class FixtureRepository extends DynamoPipelineTransitionRepository {
        FixtureRepository(DynamoDbClient client, DynamoDbEnhancedClient enhanced) {
            super(client, enhanced, "test-table");
        }

        @Override
        public List<PipelineTransition> queryGsiAll(String indexName, String pkValue) {
            return new ArrayList<>(stored);
        }

        @Override
        protected String currentTenantId() {
            return "tenant-1";
        }
    }

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        stored = new ArrayList<>();
        DynamoDbEnhancedClient enhanced = Mockito.mock(DynamoDbEnhancedClient.class);
        Mockito.when(enhanced.table(Mockito.anyString(), Mockito.any()))
                .thenReturn(Mockito.mock(DynamoDbTable.class));
        repository = new FixtureRepository(Mockito.mock(DynamoDbClient.class), enhanced);
    }

    private PipelineTransition transition(PipelineStage from, PipelineStage to, TransitionType type,
                                          LocalDateTime createdAt) {
        PipelineTransition t = new PipelineTransition();
        t.setFromStage(from);
        t.setToStage(to);
        t.setTransitionType(type);
        t.setCreatedAt(createdAt);
        stored.add(t);
        return t;
    }

    private Application application(String id, String department, String jobPostingId) {
        Application application = new Application();
        application.setId(id);
        application.setDepartment(department);
        application.setJobPostingId(jobPostingId);
        return application;
    }

    /** The {@code [key, key, count]} rows, as a map, for readable assertions. */
    private Map<String, Long> asCounts(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(
                row -> String.valueOf(row[0]) + "/" + String.valueOf(row[1]),
                row -> (Long) row[2]));
    }

    @Test
    @DisplayName("Rejections group by the stage the candidate was at, not the stage they landed in")
    void rejectionsGroupByOriginStage() {
        // toStage is the terminal rejected stage on every rejection, so grouping by it produces one
        // bucket and answers nothing. The useful question is where people are being rejected from.
        PipelineTransition a = transition(PipelineStage.INITIAL_SCREENING, PipelineStage.REJECTED,
                TransitionType.REJECTION, START.plusDays(1));
        a.setReason("Insufficient experience");
        PipelineTransition b = transition(PipelineStage.INITIAL_SCREENING, PipelineStage.REJECTED,
                TransitionType.REJECTION, START.plusDays(2));
        b.setReason("Insufficient experience");
        PipelineTransition c = transition(PipelineStage.FIRST_INTERVIEW, PipelineStage.REJECTED,
                TransitionType.REJECTION, START.plusDays(3));
        c.setReason("Culture fit");

        Map<String, Long> counts = asCounts(repository.getRejectionAnalysis(START, END));

        assertEquals(2L, counts.get("INITIAL_SCREENING/Insufficient experience"));
        assertEquals(1L, counts.get("FIRST_INTERVIEW/Culture fit"));
    }

    @Test
    @DisplayName("A rejection with no reason recorded is counted, not dropped")
    void rejectionWithoutReasonIsKept() {
        // "Rejected, no reason recorded" is the finding most worth surfacing. Dropping those rows
        // would make the reason breakdown look complete when it is not.
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.REJECTED,
                TransitionType.REJECTION, START.plusDays(1));

        List<Object[]> rows = repository.getRejectionAnalysis(START, END);

        assertEquals(1, rows.size());
        assertEquals(null, rows.get(0)[1]);
        assertEquals(1L, rows.get(0)[2]);
    }

    @Test
    @DisplayName("Only rejections count as rejections")
    void otherTransitionTypesAreExcluded() {
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.REJECTED,
                TransitionType.REJECTION, START.plusDays(1));
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW,
                TransitionType.PROGRESSION, START.plusDays(1));
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.WITHDRAWN,
                TransitionType.WITHDRAWAL, START.plusDays(1));

        assertEquals(1, repository.getRejectionAnalysis(START, END).size());
        assertEquals(1, repository.getWithdrawalAnalysis(START, END).size());
    }

    @Test
    @DisplayName("Transitions outside the window are not counted")
    void windowIsRespected() {
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.REJECTED,
                TransitionType.REJECTION, START.minusDays(1));
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.REJECTED,
                TransitionType.REJECTION, END.plusDays(1));

        assertTrue(repository.getRejectionAnalysis(START, END).isEmpty());
    }

    @Test
    @DisplayName("A transition with no timestamp cannot be placed in the window, so it is excluded")
    void undatedTransitionIsExcluded() {
        // Counting it would inflate every figure here, and it would do so invisibly.
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.REJECTED, TransitionType.REJECTION, null);

        assertTrue(repository.getRejectionAnalysis(START, END).isEmpty());
    }

    @Test
    @DisplayName("A bottleneck's duration belongs to the stage being left")
    void bottleneckDurationBelongsToFromStage() {
        // durationInPreviousStageHours is recorded on the transition OUT of a stage. Attributing it
        // to toStage would blame each stage for the delay in the one before it.
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW,
                TransitionType.PROGRESSION, START.plusDays(1)).setDurationInPreviousStageHours(100L);
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW,
                TransitionType.PROGRESSION, START.plusDays(2)).setDurationInPreviousStageHours(200L);

        List<Object[]> rows = repository.identifyBottlenecks(50L, START, END);

        assertEquals(1, rows.size());
        assertEquals(PipelineStage.INITIAL_SCREENING, rows.get(0)[0]);
        assertEquals(150.0, (Double) rows.get(0)[1]);
        assertEquals(2L, rows.get(0)[2]);
    }

    @Test
    @DisplayName("A stage below the threshold is not a bottleneck")
    void fastStagesAreNotReported() {
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW,
                TransitionType.PROGRESSION, START.plusDays(1)).setDurationInPreviousStageHours(10L);

        assertTrue(repository.identifyBottlenecks(50L, START, END).isEmpty());
    }

    @Test
    @DisplayName("An unmeasured move does not drag a slow stage's average towards zero")
    void missingDurationsAreExcludedFromTheAverage() {
        // Treating a null duration as 0 would halve this average and hide the bottleneck.
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW,
                TransitionType.PROGRESSION, START.plusDays(1)).setDurationInPreviousStageHours(100L);
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW,
                TransitionType.PROGRESSION, START.plusDays(2));

        List<Object[]> rows = repository.identifyBottlenecks(50L, START, END);

        assertEquals(100.0, (Double) rows.get(0)[1]);
        assertEquals(1L, rows.get(0)[2], "the unmeasured move must not be counted either");
    }

    @Test
    @DisplayName("Stuck means where an application is now, not everywhere it has been")
    void stuckReadsTheLatestTransitionOnly() {
        // Matching every transition into the stage would report a candidate who passed through
        // Screening in March and has since been hired as stuck in Screening — a figure that grows
        // forever and never falls.
        Application movedOn = application("app1", "Finance", "job1");
        PipelineTransition entered = transition(PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING,
                TransitionType.PROGRESSION, START.plusDays(1));
        entered.setApplication(movedOn);
        PipelineTransition left = transition(PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW,
                TransitionType.PROGRESSION, START.plusDays(2));
        left.setApplication(movedOn);

        Application stillThere = application("app2", "Finance", "job1");
        PipelineTransition stuck = transition(PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING,
                TransitionType.PROGRESSION, START.plusDays(1));
        stuck.setApplication(stillThere);

        List<Application> result = repository.findApplicationsStuckInStage(
                PipelineStage.INITIAL_SCREENING, START.plusDays(10));

        assertEquals(List.of("app2"), result.stream().map(Application::getId).toList());
    }

    @Test
    @DisplayName("An application that arrived after the cutoff has not been waiting long enough")
    void recentArrivalsAreNotStuck() {
        Application recent = application("app3", "Finance", "job1");
        transition(PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING,
                TransitionType.PROGRESSION, START.plusDays(20)).setApplication(recent);

        assertTrue(repository.findApplicationsStuckInStage(
                PipelineStage.INITIAL_SCREENING, START.plusDays(10)).isEmpty());
    }

    @Test
    @DisplayName("Department stats exclude applications with no department")
    void unnamedDepartmentsAreExcluded() {
        // An unnamed bucket beside the real departments renders as a department called "null".
        transition(PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING,
                TransitionType.PROGRESSION, START.plusDays(1))
                .setApplication(application("app1", "Finance", "job1"));
        transition(PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING,
                TransitionType.PROGRESSION, START.plusDays(1))
                .setApplication(application("app2", null, "job1"));
        transition(PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING,
                TransitionType.PROGRESSION, START.plusDays(1))
                .setApplication(application("app3", "  ", "job1"));

        List<Object[]> rows = repository.getDepartmentPipelineStats(START, END);

        assertEquals(1, rows.size());
        assertEquals("Finance", rows.get(0)[0]);
        assertEquals(1L, rows.get(0)[2]);
    }

    @Test
    @DisplayName("A vacancy's stats count only that vacancy")
    void jobPostingStatsAreScopedToTheVacancy() {
        transition(PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING,
                TransitionType.PROGRESSION, START.plusDays(1))
                .setApplication(application("app1", "Finance", "job1"));
        transition(PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING,
                TransitionType.PROGRESSION, START.plusDays(1))
                .setApplication(application("app2", "Finance", "job2"));

        List<Object[]> rows = repository.getJobPostingPipelineStats("job1", START, END);

        assertEquals(1, rows.size());
        assertEquals("job1", rows.get(0)[0]);
        assertEquals(PipelineStage.INITIAL_SCREENING, rows.get(0)[1]);
        assertEquals(1L, rows.get(0)[2]);
    }

    @Test
    @DisplayName("Activity is attributed by the string id the entity actually stores")
    void userActivityCountsByCreatedBy() {
        // createdBy is a String. Its consumer was casting it to Long, so returning real data would
        // have swapped one runtime failure for another.
        transition(PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING,
                TransitionType.PROGRESSION, START.plusDays(1)).setCreatedBy("recruiter@example.com");
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW,
                TransitionType.PROGRESSION, START.plusDays(2)).setCreatedBy("recruiter@example.com");
        transition(PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING,
                TransitionType.PROGRESSION, START.plusDays(3)).setCreatedBy("hr@example.com");
        // Unattributed: a data gap, not a person. Bucketing it would put a phantom on the board.
        transition(PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING,
                TransitionType.PROGRESSION, START.plusDays(4));

        List<Object[]> rows = repository.getUserActivityStatistics(START, END);
        Map<String, Long> byUser = rows.stream()
                .collect(Collectors.toMap(r -> (String) r[0], r -> (Long) r[1]));

        assertEquals(2, byUser.size());
        assertEquals(2L, byUser.get("recruiter@example.com"));
        assertEquals(1L, byUser.get("hr@example.com"));
    }

    @Test
    @DisplayName("Transition types are counted by kind")
    void transitionTypesAreCounted() {
        transition(PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING,
                TransitionType.PROGRESSION, START.plusDays(1));
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.APPLICATION_RECEIVED,
                TransitionType.REGRESSION, START.plusDays(2));
        transition(PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW,
                TransitionType.PROGRESSION, START.plusDays(3));

        Map<TransitionType, Long> byType = repository.getTransitionTypeStatistics(START, END).stream()
                .collect(Collectors.toMap(r -> (TransitionType) r[0], r -> (Long) r[1]));

        assertEquals(2L, byType.get(TransitionType.PROGRESSION));
        assertEquals(1L, byType.get(TransitionType.REGRESSION));
    }

    @Test
    @DisplayName("An empty window returns no rows rather than throwing")
    void emptyWindowIsNotAnError() {
        // Every one of these was an UnsupportedOperationException. "No movement in this period" and
        // "this endpoint is broken" must not look the same to a caller.
        assertTrue(repository.getRejectionAnalysis(START, END).isEmpty());
        assertTrue(repository.getWithdrawalAnalysis(START, END).isEmpty());
        assertTrue(repository.getUserActivityStatistics(START, END).isEmpty());
        assertTrue(repository.getDepartmentPipelineStats(START, END).isEmpty());
        assertTrue(repository.getTransitionTypeStatistics(START, END).isEmpty());
        assertTrue(repository.identifyBottlenecks(1L, START, END).isEmpty());
        assertTrue(repository.getJobPostingPipelineStats("job1", START, END).isEmpty());
        assertTrue(repository.findApplicationsStuckInStage(PipelineStage.INITIAL_SCREENING, END).isEmpty());
    }

    @Test
    @DisplayName("The methods with no caller still refuse, and say why")
    void uncalledMethodsRefuseWithAReason() {
        // Deliberately not implemented: List<Object[]> carries no column names, so an implementation
        // with no consumer invents a column order nothing validates. The message has to say that,
        // or the next person reads it as work someone forgot.
        assertTrue(assertThrows(UnsupportedOperationException.class,
                () -> repository.getAverageStageDurations(START, END))
                .getMessage().contains("no caller"));
        assertTrue(assertThrows(UnsupportedOperationException.class,
                () -> repository.getPipelineFunnelData(START, END))
                .getMessage().contains("no caller"));
        assertTrue(assertThrows(UnsupportedOperationException.class,
                () -> repository.findRegressions(START, END))
                .getMessage().contains("no caller"));
    }
}
