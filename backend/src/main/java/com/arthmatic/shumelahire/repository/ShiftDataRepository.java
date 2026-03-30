package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.attendance.Shift;

import java.util.List;
import java.util.Optional;

public interface ShiftDataRepository {
    Optional<Shift> findById(String id);
    Shift save(Shift entity);
    List<Shift> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<Shift> findByIsActiveTrue();
    Optional<Shift> findByCode(String code);
    boolean existsByCode(String code);
}
