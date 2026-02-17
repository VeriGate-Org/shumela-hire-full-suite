package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Applicant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository("shumelahireApplicantRepository")
public interface ApplicantRepository extends JpaRepository<Applicant, Long> {

    Optional<Applicant> findByEmail(String email);

    List<Applicant> findByFullNameContainingIgnoreCase(String name);

    List<Applicant> findByLocationContainingIgnoreCase(String location);

    List<Applicant> findByExperienceContainingIgnoreCase(String experience);

    List<Applicant> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(a) FROM TgApplicant a WHERE a.createdAt > :date")
    long countByCreatedAtAfter(LocalDateTime date);

    @Query("SELECT a FROM TgApplicant a WHERE a.skills LIKE %:skill%")
    List<Applicant> findBySkillsContaining(String skill);

    boolean existsByEmail(String email);
}
