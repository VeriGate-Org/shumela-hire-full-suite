package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.service.DataResidencyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/compliance/data-residency")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class DataResidencyController {

    @Autowired
    private DataResidencyService dataResidencyService;

    @GetMapping("/report")
    public ResponseEntity<?> getResidencyReport() {
        return ResponseEntity.ok(dataResidencyService.generateResidencyReport());
    }

    @GetMapping("/storage-locations")
    public ResponseEntity<?> getStorageLocations() {
        return ResponseEntity.ok(dataResidencyService.getStorageLocations());
    }
}
