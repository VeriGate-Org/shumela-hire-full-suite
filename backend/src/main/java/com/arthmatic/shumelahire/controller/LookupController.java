package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.service.LookupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/lookups")
public class LookupController {

    private final LookupService lookupService;

    public LookupController(LookupService lookupService) {
        this.lookupService = lookupService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllLookups() {
        return ResponseEntity.ok(lookupService.getAllLookups());
    }

    @GetMapping("/{category}")
    public ResponseEntity<Object> getLookupByCategory(@PathVariable String category) {
        Object result = lookupService.getLookupByCategory(category);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }
}
