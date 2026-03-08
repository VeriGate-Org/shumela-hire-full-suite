package com.arthmatic.shumelahire.repository.labour;

import com.arthmatic.shumelahire.entity.labour.DisciplinaryCase;
import com.arthmatic.shumelahire.entity.labour.DisciplinaryCaseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DisciplinaryCaseRepository extends JpaRepository<DisciplinaryCase, Long> {

    Page<DisciplinaryCase> findByEmployeeId(Long employeeId, Pageable pageable);

    Page<DisciplinaryCase> findByStatus(DisciplinaryCaseStatus status, Pageable pageable);

    long countByStatus(DisciplinaryCaseStatus status);
}
