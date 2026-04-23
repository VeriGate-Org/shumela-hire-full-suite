package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.DepartmentRequest;
import com.arthmatic.shumelahire.dto.DepartmentResponse;
import com.arthmatic.shumelahire.entity.Department;
import com.arthmatic.shumelahire.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> list(
            @RequestParam(required = false) Boolean active) {
        List<Department> departments = (active != null && active)
                ? departmentService.getActive()
                : departmentService.getAll();
        List<DepartmentResponse> response = departments.stream()
                .map(DepartmentResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentResponse> getById(@PathVariable String id) {
        Department department = departmentService.getById(id);
        return ResponseEntity.ok(DepartmentResponse.fromEntity(department));
    }

    @GetMapping("/names")
    public ResponseEntity<List<String>> getActiveNames() {
        return ResponseEntity.ok(departmentService.getActiveNames());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<DepartmentResponse> create(@Valid @RequestBody DepartmentRequest request) {
        Department department = departmentService.create(request);
        return ResponseEntity.ok(DepartmentResponse.fromEntity(department));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<DepartmentResponse> update(
            @PathVariable String id, @Valid @RequestBody DepartmentRequest request) {
        Department department = departmentService.update(id, request);
        return ResponseEntity.ok(DepartmentResponse.fromEntity(department));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<DepartmentResponse> deactivate(@PathVariable String id) {
        Department department = departmentService.deactivate(id);
        return ResponseEntity.ok(DepartmentResponse.fromEntity(department));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<DepartmentResponse> activate(@PathVariable String id) {
        Department department = departmentService.activate(id);
        return ResponseEntity.ok(DepartmentResponse.fromEntity(department));
    }
}
