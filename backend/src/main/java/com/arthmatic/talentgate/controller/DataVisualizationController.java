package com.arthmatic.talentgate.controller;

import com.arthmatic.talentgate.service.DataVisualizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/visualization")
@CrossOrigin(origins = "http://localhost:3000")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EXECUTIVE')")
public class DataVisualizationController {

    @Autowired
    private DataVisualizationService dataVisualizationService;

    @GetMapping("/charts/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardCharts(
            @RequestParam(required = false) String fromDate) {
        
        LocalDateTime from = fromDate != null ? 
            LocalDateTime.parse(fromDate + "T00:00:00") : 
            LocalDateTime.now().minusMonths(6);

        Map<String, Object> charts = dataVisualizationService.getDashboardCharts(from);
        return ResponseEntity.ok(charts);
    }

    @GetMapping("/charts/{chartType}")
    public ResponseEntity<Map<String, Object>> getChart(
            @PathVariable String chartType,
            @RequestParam(required = false) String fromDate) {
        
        LocalDateTime from = fromDate != null ? 
            LocalDateTime.parse(fromDate + "T00:00:00") : 
            LocalDateTime.now().minusMonths(6);

        Map<String, Object> chartData = dataVisualizationService.getChartExportData(chartType, from);
        return ResponseEntity.ok(chartData);
    }

    @GetMapping("/kpis")
    public ResponseEntity<Map<String, Object>> getKPIWidgets() {
        Map<String, Object> kpis = dataVisualizationService.getKPIWidgets();
        return ResponseEntity.ok(kpis);
    }

    @GetMapping("/charts/application-status")
    public ResponseEntity<Map<String, Object>> getApplicationStatusChart() {
        Map<String, Object> chartData = dataVisualizationService.getApplicationStatusChart();
        return ResponseEntity.ok(chartData);
    }

    @GetMapping("/charts/applications-timeline")
    public ResponseEntity<Map<String, Object>> getApplicationsTimelineChart(
            @RequestParam(required = false) String fromDate) {
        
        LocalDateTime from = fromDate != null ? 
            LocalDateTime.parse(fromDate + "T00:00:00") : 
            LocalDateTime.now().minusMonths(3);

        Map<String, Object> chartData = dataVisualizationService.getApplicationsTimelineChart(from);
        return ResponseEntity.ok(chartData);
    }

    @GetMapping("/charts/top-positions")
    public ResponseEntity<Map<String, Object>> getTopPositionsChart() {
        Map<String, Object> chartData = dataVisualizationService.getTopPositionsChart();
        return ResponseEntity.ok(chartData);
    }

    @GetMapping("/charts/source-effectiveness")
    public ResponseEntity<Map<String, Object>> getSourceEffectivenessChart() {
        Map<String, Object> chartData = dataVisualizationService.getSourceEffectivenessChart();
        return ResponseEntity.ok(chartData);
    }

    @GetMapping("/charts/interview-ratings")
    public ResponseEntity<Map<String, Object>> getInterviewRatingsChart() {
        Map<String, Object> chartData = dataVisualizationService.getInterviewRatingsChart();
        return ResponseEntity.ok(chartData);
    }

    @GetMapping("/charts/hiring-trends")
    public ResponseEntity<Map<String, Object>> getHiringTrendsChart() {
        Map<String, Object> chartData = dataVisualizationService.getHiringTrendsChart();
        return ResponseEntity.ok(chartData);
    }
}
