package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.TalentPoolEntryDataRepository;
import com.arthmatic.shumelahire.repository.TalentPoolDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TalentPoolService {

    private static final Logger logger = LoggerFactory.getLogger(TalentPoolService.class);

    @Autowired
    private TalentPoolDataRepository talentPoolRepository;

    @Autowired
    private TalentPoolEntryDataRepository talentPoolEntryRepository;

    @Autowired
    private ApplicantDataRepository applicantRepository;

    public TalentPool createPool(TalentPool pool) {
        pool.setCreatedAt(LocalDateTime.now());
        TalentPool saved = talentPoolRepository.save(pool);
        logger.info("Talent pool created: {}", saved.getPoolName());
        return saved;
    }

    public List<TalentPool> getAllPools() {
        return talentPoolRepository.findAll();
    }

    public TalentPool getPool(String id) {
        return talentPoolRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Talent pool not found: " + id));
    }

    public TalentPool updatePool(String id, TalentPool update) {
        TalentPool pool = getPool(id);
        if (update.getPoolName() != null) pool.setPoolName(update.getPoolName());
        if (update.getDescription() != null) pool.setDescription(update.getDescription());
        if (update.getDepartment() != null) pool.setDepartment(update.getDepartment());
        if (update.getSkillsCriteria() != null) pool.setSkillsCriteria(update.getSkillsCriteria());
        if (update.getExperienceLevel() != null) pool.setExperienceLevel(update.getExperienceLevel());
        if (update.getIsActive() != null) pool.setIsActive(update.getIsActive());
        if (update.getAutoAddEnabled() != null) pool.setAutoAddEnabled(update.getAutoAddEnabled());
        return talentPoolRepository.save(pool);
    }

    @Transactional
    public TalentPoolEntry addEntry(String poolId, String applicantId, String sourceType, String notes) {
        if (applicantId == null) {
            throw new IllegalArgumentException("applicantId is required");
        }

        TalentPool pool = getPool(poolId);
        Applicant applicant = applicantRepository.findById(applicantId)
            .orElseThrow(() -> new RuntimeException("Applicant not found: " + applicantId));

        TalentPoolEntry entry = new TalentPoolEntry();

        entry.setTalentPool(pool);
        entry.setApplicant(applicant);
        entry.setAddedAt(LocalDateTime.now());
        entry.setSourceType(sourceType != null ? sourceType : "MANUAL");
        entry.setNotes(notes);

        TalentPoolEntry saved = talentPoolEntryRepository.save(entry);
        logger.info("Added applicant {} to talent pool {}", applicant.getId(), pool.getPoolName());
        return saved;
    }

    public List<TalentPoolEntry> getEntries(String poolId) {
        return talentPoolEntryRepository.findByTalentPoolId(poolId);
    }

    @Transactional
    public void removeEntry(String entryId, String reason) {
        TalentPoolEntry entry = talentPoolEntryRepository.findById(entryId)
            .orElseThrow(() -> new RuntimeException("Entry not found: " + entryId));
        entry.setRemovedAt(LocalDateTime.now());
        entry.setRemovalReason(reason);
        talentPoolEntryRepository.save(entry);
        logger.info("Removed entry {} from talent pool", entryId);
    }

    @Transactional
    public TalentPoolEntry updateRating(String entryId, Integer rating) {
        TalentPoolEntry entry = talentPoolEntryRepository.findById(entryId)
            .orElseThrow(() -> new RuntimeException("Entry not found: " + entryId));
        entry.setRating(rating);
        return talentPoolEntryRepository.save(entry);
    }

    @Transactional
    public void autoAddToPool(Application application) {
        List<TalentPool> autoAddPools = talentPoolRepository.findAutoAddPools();
        for (TalentPool pool : autoAddPools) {
            if (matchesCriteria(pool, application)) {
                TalentPoolEntry entry = new TalentPoolEntry();
                entry.setTalentPool(pool);
                entry.setApplicant(application.getApplicant());
                entry.setSourceApplication(application);
                entry.setSourceType("AUTO_REJECTED");
                entry.setAddedAt(LocalDateTime.now());
                talentPoolEntryRepository.save(entry);
                logger.info("Auto-added applicant {} to pool {}", application.getApplicant().getId(), pool.getPoolName());
            }
        }
    }

    public Map<String, Object> getPoolAnalytics(String poolId) {
        TalentPool pool = getPool(poolId);
        List<TalentPoolEntry> entries = talentPoolEntryRepository.findByTalentPoolId(poolId);

        long activeCount = entries.stream().filter(e -> e.getRemovedAt() == null).count();
        double avgRating = entries.stream()
            .filter(e -> e.getRating() != null && e.getRemovedAt() == null)
            .mapToInt(TalentPoolEntry::getRating)
            .average().orElse(0);

        Map<String, Long> bySource = entries.stream()
            .filter(e -> e.getRemovedAt() == null)
            .collect(Collectors.groupingBy(
                e -> e.getSourceType() != null ? e.getSourceType() : "UNKNOWN",
                Collectors.counting()));

        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("poolName", pool.getPoolName());
        analytics.put("totalEntries", entries.size());
        analytics.put("activeEntries", activeCount);
        analytics.put("averageRating", Math.round(avgRating * 100.0) / 100.0);
        analytics.put("bySource", bySource);
        return analytics;
    }

    private boolean matchesCriteria(TalentPool pool, Application application) {
        if (pool.getDepartment() != null && !pool.getDepartment().isEmpty()) {
            return pool.getDepartment().equalsIgnoreCase(application.getDepartment());
        }
        return true;
    }
}
