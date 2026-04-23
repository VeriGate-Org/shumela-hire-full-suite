package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.SkillRequest;
import com.arthmatic.shumelahire.dto.SkillResponse;
import com.arthmatic.shumelahire.entity.Skill;
import com.arthmatic.shumelahire.service.SkillService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
public class SkillController {

    @Autowired
    private SkillService skillService;

    @GetMapping
    public ResponseEntity<List<SkillResponse>> list(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String category) {
        List<Skill> skills;
        if (category != null && !category.isBlank()) {
            skills = skillService.getByCategory(category);
        } else if (active != null && active) {
            skills = skillService.getActive();
        } else {
            skills = skillService.getAll();
        }
        List<SkillResponse> response = skills.stream()
                .map(SkillResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SkillResponse> getById(@PathVariable String id) {
        Skill skill = skillService.getById(id);
        return ResponseEntity.ok(SkillResponse.fromEntity(skill));
    }

    @GetMapping("/names")
    public ResponseEntity<List<String>> getActiveNames() {
        return ResponseEntity.ok(skillService.getActiveNames());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<SkillResponse> create(@Valid @RequestBody SkillRequest request) {
        Skill skill = skillService.create(request);
        return ResponseEntity.ok(SkillResponse.fromEntity(skill));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<SkillResponse> update(
            @PathVariable String id, @Valid @RequestBody SkillRequest request) {
        Skill skill = skillService.update(id, request);
        return ResponseEntity.ok(SkillResponse.fromEntity(skill));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<SkillResponse> deactivate(@PathVariable String id) {
        Skill skill = skillService.deactivate(id);
        return ResponseEntity.ok(SkillResponse.fromEntity(skill));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<SkillResponse> activate(@PathVariable String id) {
        Skill skill = skillService.activate(id);
        return ResponseEntity.ok(SkillResponse.fromEntity(skill));
    }
}
