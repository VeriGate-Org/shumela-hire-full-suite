package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.CustomFieldEntityType;
import com.arthmatic.shumelahire.entity.CustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomFieldValueRepository extends JpaRepository<CustomFieldValue, Long> {

    List<CustomFieldValue> findByEntityIdAndEntityType(Long entityId, CustomFieldEntityType entityType);

    Optional<CustomFieldValue> findByCustomFieldIdAndEntityIdAndEntityType(Long customFieldId, Long entityId, CustomFieldEntityType entityType);

    void deleteByEntityIdAndEntityType(Long entityId, CustomFieldEntityType entityType);
}
