package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.DepartmentRequest;
import com.arthmatic.shumelahire.entity.Department;
import com.arthmatic.shumelahire.repository.DepartmentDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DepartmentService {

    @Autowired
    private DepartmentDataRepository departmentRepository;

    @Autowired
    private SlugGeneratorService slugGeneratorService;

    @Autowired
    private AuditLogService auditLogService;

    public Department create(DepartmentRequest request) {
        if (departmentRepository.existsByName(request.getName())) {
            throw new RuntimeException("Department with name '" + request.getName() + "' already exists");
        }

        Department department = new Department();
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        department.setCode(slugGeneratorService.generateUniqueSlug(
                request.getName(), departmentRepository::existsByCode));

        Department saved = departmentRepository.save(department);
        auditLogService.logSystemAction("CREATE", "DEPARTMENT",
                "Created department: " + saved.getName() + " (id=" + saved.getId() + ")");
        return saved;
    }

    public Department update(String id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));

        boolean nameChanged = !department.getName().equals(request.getName());

        if (nameChanged && departmentRepository.existsByName(request.getName())) {
            throw new RuntimeException("Department with name '" + request.getName() + "' already exists");
        }

        department.setName(request.getName());
        department.setDescription(request.getDescription());

        if (nameChanged) {
            department.setCode(slugGeneratorService.generateUniqueSlug(
                    request.getName(), departmentRepository::existsByCode));
        }

        Department saved = departmentRepository.save(department);
        auditLogService.logSystemAction("UPDATE", "DEPARTMENT",
                "Updated department: " + saved.getName() + " (id=" + saved.getId() + ")");
        return saved;
    }

    @Transactional(readOnly = true)
    public Department getById(String id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<Department> getAll() {
        return departmentRepository.findAllOrderByName();
    }

    @Transactional(readOnly = true)
    public List<Department> getActive() {
        return departmentRepository.findActiveOrderByName();
    }

    @Transactional(readOnly = true)
    public List<String> getActiveNames() {
        return departmentRepository.findActiveNames();
    }

    public Department deactivate(String id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
        department.setIsActive(false);
        Department saved = departmentRepository.save(department);
        auditLogService.logSystemAction("DEACTIVATE", "DEPARTMENT",
                "Deactivated department: " + saved.getName() + " (id=" + saved.getId() + ")");
        return saved;
    }

    public Department activate(String id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
        department.setIsActive(true);
        Department saved = departmentRepository.save(department);
        auditLogService.logSystemAction("ACTIVATE", "DEPARTMENT",
                "Activated department: " + saved.getName() + " (id=" + saved.getId() + ")");
        return saved;
    }
}
