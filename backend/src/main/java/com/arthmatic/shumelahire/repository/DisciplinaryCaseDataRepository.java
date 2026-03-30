package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.labour.DisciplinaryCase;
import com.arthmatic.shumelahire.entity.labour.DisciplinaryCaseStatus;

import java.util.List;
import java.util.Optional;

public interface DisciplinaryCaseDataRepository {
    Optional<DisciplinaryCase> findById(String id);
    DisciplinaryCase save(DisciplinaryCase entity);
    List<DisciplinaryCase> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<DisciplinaryCase> findByEmployeeId(String employeeId);
    List<DisciplinaryCase> findByStatus(DisciplinaryCaseStatus status);
    long countByStatus(DisciplinaryCaseStatus status);
}
