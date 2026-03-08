package com.arthmatic.shumelahire.repository.training;

import com.arthmatic.shumelahire.entity.training.DeliveryMethod;
import com.arthmatic.shumelahire.entity.training.TrainingCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingCourseRepository extends JpaRepository<TrainingCourse, Long> {

    List<TrainingCourse> findByIsActiveTrue();

    List<TrainingCourse> findByCategory(String category);

    List<TrainingCourse> findByDeliveryMethod(DeliveryMethod deliveryMethod);

    List<TrainingCourse> findByIsMandatoryTrue();

    Optional<TrainingCourse> findByCode(String code);

    @Query("SELECT DISTINCT c.category FROM TrainingCourse c WHERE c.category IS NOT NULL ORDER BY c.category")
    List<String> findDistinctCategories();

    @Query("SELECT c FROM TrainingCourse c WHERE c.isActive = true " +
           "AND (LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(c.category) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(c.provider) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<TrainingCourse> searchCourses(@Param("search") String search);
}
