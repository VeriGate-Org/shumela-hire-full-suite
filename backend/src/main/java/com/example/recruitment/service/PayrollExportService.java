package com.example.recruitment.service;

import com.arthmatic.shumelahire.service.DataEncryptionService;
import com.example.recruitment.dto.PayrollPackage;
import com.example.recruitment.entity.Offer;
import com.example.recruitment.entity.OfferStatus;
import com.example.recruitment.repository.OfferRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.opencsv.CSVWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PayrollExportService {

    private static final Logger logger = LoggerFactory.getLogger(PayrollExportService.class);

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private DataEncryptionService dataEncryptionService;

    private final ObjectMapper objectMapper;

    public PayrollExportService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    public PayrollPackage generatePayrollPackage(Long offerId) {
        Offer offer = offerRepository.findByIdWithDetails(offerId)
            .orElseThrow(() -> new RuntimeException("Offer not found: " + offerId));

        if (offer.getStatus() != OfferStatus.ACCEPTED && offer.getStatus() != OfferStatus.SIGNED) {
            throw new IllegalStateException("Offer must be ACCEPTED or SIGNED for payroll export");
        }

        PayrollPackage pkg = new PayrollPackage();
        pkg.setOfferId(offer.getId());
        pkg.setOfferNumber(offer.getOfferNumber());
        pkg.setEmployeeFullName(
            offer.getApplication().getApplicant().getName() + " " +
            offer.getApplication().getApplicant().getSurname()
        );
        pkg.setEmail(offer.getApplication().getApplicant().getEmail());
        pkg.setIdNumber(dataEncryptionService.maskSensitiveData(
            offer.getApplication().getApplicant().getIdPassportNumber()
        ));
        pkg.setJobTitle(offer.getJobTitle());
        pkg.setDepartment(offer.getDepartment());
        pkg.setBaseSalary(offer.getBaseSalary());
        pkg.setCurrency(offer.getCurrency());
        pkg.setFrequency(offer.getSalaryFrequency());
        pkg.setBonusTarget(offer.getBonusTargetPercentage());
        pkg.setEmploymentType(offer.getEmploymentType());
        pkg.setStartDate(offer.getStartDate());
        pkg.setProbationDays(offer.getProbationaryPeriodDays());
        pkg.setNoticeDays(offer.getNoticePeriodDays());
        pkg.setVacationDays(offer.getVacationDaysAnnual());
        pkg.setHealthInsurance(offer.getHealthInsurance());
        pkg.setRetirement(offer.getRetirementPlan());
        pkg.setExportedAt(LocalDateTime.now());

        return pkg;
    }

    public List<PayrollPackage> generateBulkPayrollPackages(List<Long> offerIds) {
        return offerIds.stream()
            .map(this::generatePayrollPackage)
            .collect(Collectors.toList());
    }

    public byte[] exportToCsv(List<PayrollPackage> packages) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             CSVWriter writer = new CSVWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {

            String[] header = {
                "Offer ID", "Offer Number", "Employee Name", "Email", "ID Number",
                "Job Title", "Department", "Base Salary", "Currency", "Frequency",
                "Bonus Target %", "Employment Type", "Start Date", "Probation Days",
                "Notice Days", "Vacation Days", "Health Insurance", "Retirement",
                "Exported At"
            };
            writer.writeNext(header);

            for (PayrollPackage pkg : packages) {
                String[] row = {
                    String.valueOf(pkg.getOfferId()),
                    pkg.getOfferNumber(),
                    pkg.getEmployeeFullName(),
                    pkg.getEmail(),
                    pkg.getIdNumber(),
                    pkg.getJobTitle(),
                    pkg.getDepartment(),
                    pkg.getBaseSalary() != null ? pkg.getBaseSalary().toPlainString() : "",
                    pkg.getCurrency(),
                    pkg.getFrequency(),
                    pkg.getBonusTarget() != null ? pkg.getBonusTarget().toPlainString() : "",
                    pkg.getEmploymentType(),
                    pkg.getStartDate() != null ? pkg.getStartDate().toString() : "",
                    pkg.getProbationDays() != null ? String.valueOf(pkg.getProbationDays()) : "",
                    pkg.getNoticeDays() != null ? String.valueOf(pkg.getNoticeDays()) : "",
                    pkg.getVacationDays() != null ? String.valueOf(pkg.getVacationDays()) : "",
                    pkg.getHealthInsurance() != null ? String.valueOf(pkg.getHealthInsurance()) : "",
                    pkg.getRetirement() != null ? String.valueOf(pkg.getRetirement()) : "",
                    pkg.getExportedAt() != null ? pkg.getExportedAt().toString() : ""
                };
                writer.writeNext(row);
            }

            writer.flush();
            return baos.toByteArray();
        } catch (Exception e) {
            logger.error("CSV export failed: {}", e.getMessage());
            throw new RuntimeException("Failed to export payroll data to CSV", e);
        }
    }

    public byte[] exportToJson(List<PayrollPackage> packages) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(packages);
        } catch (Exception e) {
            logger.error("JSON export failed: {}", e.getMessage());
            throw new RuntimeException("Failed to export payroll data to JSON", e);
        }
    }

    public Map<String, Object> getExportSummary(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        List<Offer> acceptedOffers = offerRepository.findByStatusInWithDetails(
            List.of(OfferStatus.ACCEPTED, OfferStatus.SIGNED)
        ).stream()
            .filter(o -> o.getAcceptedAt() != null &&
                         o.getAcceptedAt().isAfter(start) &&
                         o.getAcceptedAt().isBefore(end))
            .toList();

        BigDecimal totalValue = acceptedOffers.stream()
            .map(Offer::getBaseSalary)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> byDepartment = acceptedOffers.stream()
            .collect(Collectors.groupingBy(Offer::getDepartment, Collectors.counting()));

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalOffers", acceptedOffers.size());
        summary.put("totalAnnualValue", totalValue);
        summary.put("byDepartment", byDepartment);
        summary.put("startDate", startDate.toString());
        summary.put("endDate", endDate.toString());
        summary.put("generatedAt", LocalDateTime.now().toString());

        return summary;
    }
}
