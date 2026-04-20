package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.labour.DisciplinaryCase;
import com.arthmatic.shumelahire.entity.labour.DisciplinaryCaseStatus;
import com.arthmatic.shumelahire.entity.labour.DisciplinaryOutcome;
import com.arthmatic.shumelahire.entity.labour.OffenceCategory;
import com.arthmatic.shumelahire.repository.DisciplinaryCaseDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.DisciplinaryCaseItem;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoDisciplinaryCaseRepository extends DynamoRepository<DisciplinaryCaseItem, DisciplinaryCase>
        implements DisciplinaryCaseDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter ISO_DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public DynamoDisciplinaryCaseRepository(DynamoDbClient dynamoDbClient,
                                            DynamoDbEnhancedClient enhancedClient,
                                            String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, DisciplinaryCaseItem.class);
    }

    @Override protected String entityType() { return "DISCIPLINARY"; }

    @Override
    public List<DisciplinaryCase> findByEmployeeId(String employeeId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "DISC_EMP#" + tenantId + "#" + employeeId);
    }

    @Override
    public List<DisciplinaryCase> findByStatus(DisciplinaryCaseStatus status) {
        return findAll().stream()
                .filter(e -> status.equals(e.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public long countByStatus(DisciplinaryCaseStatus status) {
        return findAll().stream()
                .filter(e -> status.equals(e.getStatus()))
                .count();
    }

    @Override
    protected DisciplinaryCase toEntity(DisciplinaryCaseItem item) {
        var e = new DisciplinaryCase();
        if (item.getId() != null) e.setId(safeParseLong(item.getId()));
        e.setTenantId(item.getTenantId());

        if (item.getEmployeeId() != null) {
            var emp = new Employee();
            emp.setId(safeParseLong(item.getEmployeeId()));
            e.setEmployee(emp);
        }

        if (item.getOffenceCategory() != null) e.setOffenceCategory(OffenceCategory.valueOf(item.getOffenceCategory()));
        e.setOffenceDescription(item.getOffenceDescription());
        if (item.getIncidentDate() != null) e.setIncidentDate(LocalDate.parse(item.getIncidentDate(), ISO_DATE_FMT));
        if (item.getHearingDate() != null) e.setHearingDate(LocalDate.parse(item.getHearingDate(), ISO_DATE_FMT));
        if (item.getStatus() != null) e.setStatus(DisciplinaryCaseStatus.valueOf(item.getStatus()));
        if (item.getOutcome() != null) e.setOutcome(DisciplinaryOutcome.valueOf(item.getOutcome()));
        if (item.getOutcomeDate() != null) e.setOutcomeDate(LocalDate.parse(item.getOutcomeDate(), ISO_DATE_FMT));
        e.setNotes(item.getNotes());
        if (item.getCreatedBy() != null) e.setCreatedBy(safeParseLong(item.getCreatedBy()));
        if (item.getCreatedAt() != null) e.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        if (item.getUpdatedAt() != null) e.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        return e;
    }

    @Override
    protected DisciplinaryCaseItem toItem(DisciplinaryCase entity) {
        var item = new DisciplinaryCaseItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String employeeId = entity.getEmployee() != null && entity.getEmployee().getId() != null
                ? entity.getEmployee().getId().toString() : "";

        item.setPk("TENANT#" + tenantId);
        item.setSk("DISCIPLINARY#" + id);
        item.setGsi1pk("DISC_EMP#" + tenantId + "#" + employeeId);
        item.setGsi1sk("DISCIPLINARY#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setEmployeeId(employeeId);
        if (entity.getOffenceCategory() != null) item.setOffenceCategory(entity.getOffenceCategory().name());
        item.setOffenceDescription(entity.getOffenceDescription());
        if (entity.getIncidentDate() != null) item.setIncidentDate(entity.getIncidentDate().format(ISO_DATE_FMT));
        if (entity.getHearingDate() != null) item.setHearingDate(entity.getHearingDate().format(ISO_DATE_FMT));
        if (entity.getStatus() != null) item.setStatus(entity.getStatus().name());
        if (entity.getOutcome() != null) item.setOutcome(entity.getOutcome().name());
        if (entity.getOutcomeDate() != null) item.setOutcomeDate(entity.getOutcomeDate().format(ISO_DATE_FMT));
        item.setNotes(entity.getNotes());
        if (entity.getCreatedBy() != null) item.setCreatedBy(entity.getCreatedBy().toString());
        if (entity.getCreatedAt() != null) item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        if (entity.getUpdatedAt() != null) item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        return item;
    }
}
