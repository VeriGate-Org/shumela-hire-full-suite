package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.CustomField;
import com.arthmatic.shumelahire.entity.CustomFieldEntityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomFieldRepository extends JpaRepository<CustomField, Long> {

    List<CustomField> findByEntityTypeAndIsActiveTrueOrderByDisplayOrder(CustomFieldEntityType entityType);

    List<CustomField> findByEntityTypeOrderByDisplayOrder(CustomFieldEntityType entityType);

    Optional<CustomField> findByFieldNameAndEntityType(String fieldName, CustomFieldEntityType entityType);

    boolean existsByFieldNameAndEntityType(String fieldName, CustomFieldEntityType entityType);
}
