package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.DocumentTemplateRequest;
import com.arthmatic.shumelahire.dto.DocumentTemplateResponse;
import com.arthmatic.shumelahire.service.DocumentTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/document-templates")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class DocumentTemplateController {

    @Autowired
    private DocumentTemplateService service;

    @PostMapping
    public ResponseEntity<DocumentTemplateResponse> create(@Valid @RequestBody DocumentTemplateRequest.Create request) {
        DocumentTemplateResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<DocumentTemplateResponse>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "false") boolean showArchived) {
        return ResponseEntity.ok(service.getAll(search, type, showArchived));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentTemplateResponse> get(@PathVariable String id) {
        DocumentTemplateResponse response = service.get(id);
        if (response == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocumentTemplateResponse> update(
            @PathVariable String id,
            @Valid @RequestBody DocumentTemplateRequest.Update request) {
        DocumentTemplateResponse response = service.update(id, request);
        if (response == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!service.delete(id)) return ResponseEntity.notFound().build();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<DocumentTemplateResponse> duplicate(@PathVariable String id) {
        DocumentTemplateResponse response = service.duplicate(id);
        if (response == null) return ResponseEntity.notFound().build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<DocumentTemplateResponse> setDefault(@PathVariable String id) {
        DocumentTemplateResponse response = service.setDefault(id);
        if (response == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/preview")
    public ResponseEntity<?> preview(
            @PathVariable String id,
            @RequestBody Map<String, String> sampleData) {
        String rendered = service.previewTemplate(id, sampleData);
        if (rendered == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("content", rendered));
    }
}
