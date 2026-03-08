package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.EmployeeDocumentTypeConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeDocumentTypeConfigRepository extends JpaRepository<EmployeeDocumentTypeConfig, Long> {

    List<EmployeeDocumentTypeConfig> findByIsActiveTrue();

    List<EmployeeDocumentTypeConfig> findByIsRequiredTrue();

    Optional<EmployeeDocumentTypeConfig> findByCode(String code);
}
