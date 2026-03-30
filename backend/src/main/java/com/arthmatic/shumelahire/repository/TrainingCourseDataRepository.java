package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.training.TrainingCourse;
import com.arthmatic.shumelahire.entity.training.DeliveryMethod;

import java.util.List;
import java.util.Optional;

public interface TrainingCourseDataRepository {
    Optional<TrainingCourse> findById(String id);
    TrainingCourse save(TrainingCourse entity);
    List<TrainingCourse> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<TrainingCourse> findByIsActiveTrue();
    List<TrainingCourse> findByCategory(String category);
    List<TrainingCourse> findByDeliveryMethod(DeliveryMethod deliveryMethod);
    List<TrainingCourse> findByIsMandatoryTrue();
    Optional<TrainingCourse> findByCode(String code);
    List<String> findDistinctCategories();
    List<TrainingCourse> searchCourses(String searchTerm);
}
