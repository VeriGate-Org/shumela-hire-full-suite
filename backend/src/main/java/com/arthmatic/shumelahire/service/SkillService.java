package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.SkillRequest;
import com.arthmatic.shumelahire.entity.Skill;
import com.arthmatic.shumelahire.repository.SkillDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SkillService {

    @Autowired
    private SkillDataRepository skillRepository;

    @Autowired
    private SlugGeneratorService slugGeneratorService;

    @Autowired
    private AuditLogService auditLogService;

    public Skill create(SkillRequest request) {
        if (skillRepository.existsByName(request.getName())) {
            throw new RuntimeException("Skill with name '" + request.getName() + "' already exists");
        }

        Skill skill = new Skill();
        skill.setName(request.getName());
        skill.setCategory(request.getCategory());
        skill.setDescription(request.getDescription());
        skill.setCode(slugGeneratorService.generateUniqueSlug(
                request.getName(), skillRepository::existsByCode));

        Skill saved = skillRepository.save(skill);
        auditLogService.logSystemAction("CREATE", "SKILL",
                "Created skill: " + saved.getName() + " (id=" + saved.getId() + ")");
        return saved;
    }

    public Skill update(Long id, SkillRequest request) {
        Skill skill = skillRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new RuntimeException("Skill not found with id: " + id));

        boolean nameChanged = !skill.getName().equals(request.getName());

        if (nameChanged && skillRepository.existsByName(request.getName())) {
            throw new RuntimeException("Skill with name '" + request.getName() + "' already exists");
        }

        skill.setName(request.getName());
        skill.setCategory(request.getCategory());
        skill.setDescription(request.getDescription());

        if (nameChanged) {
            skill.setCode(slugGeneratorService.generateUniqueSlug(
                    request.getName(), skillRepository::existsByCode));
        }

        Skill saved = skillRepository.save(skill);
        auditLogService.logSystemAction("UPDATE", "SKILL",
                "Updated skill: " + saved.getName() + " (id=" + saved.getId() + ")");
        return saved;
    }

    @Transactional(readOnly = true)
    public Skill getById(Long id) {
        return skillRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new RuntimeException("Skill not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<Skill> getAll() {
        return skillRepository.findAllOrderByName();
    }

    @Transactional(readOnly = true)
    public List<Skill> getActive() {
        return skillRepository.findActiveOrderByName();
    }

    @Transactional(readOnly = true)
    public List<String> getActiveNames() {
        return skillRepository.findActiveNames();
    }

    @Transactional(readOnly = true)
    public List<Skill> getByCategory(String category) {
        return skillRepository.findByCategoryAndActiveOrderByName(category);
    }

    public Skill deactivate(Long id) {
        Skill skill = skillRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new RuntimeException("Skill not found with id: " + id));
        skill.setIsActive(false);
        Skill saved = skillRepository.save(skill);
        auditLogService.logSystemAction("DEACTIVATE", "SKILL",
                "Deactivated skill: " + saved.getName() + " (id=" + saved.getId() + ")");
        return saved;
    }

    public Skill activate(Long id) {
        Skill skill = skillRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new RuntimeException("Skill not found with id: " + id));
        skill.setIsActive(true);
        Skill saved = skillRepository.save(skill);
        auditLogService.logSystemAction("ACTIVATE", "SKILL",
                "Activated skill: " + saved.getName() + " (id=" + saved.getId() + ")");
        return saved;
    }
}
