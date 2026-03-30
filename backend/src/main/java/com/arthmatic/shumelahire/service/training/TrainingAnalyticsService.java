package com.arthmatic.shumelahire.service.training;

import com.arthmatic.shumelahire.repository.CertificationDataRepository;
import com.arthmatic.shumelahire.repository.TrainingCourseDataRepository;
import com.arthmatic.shumelahire.repository.TrainingEnrollmentDataRepository;
import com.arthmatic.shumelahire.repository.TrainingSessionDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class TrainingAnalyticsService {

    @Autowired
    private TrainingCourseDataRepository courseRepository;

    @Autowired
    private TrainingSessionDataRepository sessionRepository;

    @Autowired
    private TrainingEnrollmentDataRepository enrollmentRepository;

    @Autowired
    private CertificationDataRepository certificationRepository;

    public Map<String, Object> getAnalytics() {
        Map<String, Object> analytics = new HashMap<>();

        // Course stats
        analytics.put("totalCourses", (long) courseRepository.findAll().size());
        analytics.put("activeCourses", courseRepository.findByIsActiveTrue().size());
        analytics.put("mandatoryCourses", courseRepository.findByIsMandatoryTrue().size());
        analytics.put("categories", courseRepository.findDistinctCategories());

        // Session stats
        analytics.put("totalSessions", (long) sessionRepository.findAll().size());
        analytics.put("upcomingSessions", sessionRepository.findUpcomingSessions().size());
        analytics.put("openSessions", sessionRepository.findOpenWithAvailableSeats().size());

        // Enrollment stats
        analytics.put("totalEnrollments", (long) enrollmentRepository.findAll().size());
        analytics.put("completedEnrollments", enrollmentRepository.countCompleted());

        // Certification stats
        analytics.put("activeCertifications", certificationRepository.countActive());
        analytics.put("expiringCertifications", certificationRepository.findExpiringSoon(
                LocalDate.now(), LocalDate.now().plusDays(30)).size());
        analytics.put("expiredCertifications", certificationRepository.findExpired().size());

        return analytics;
    }
}
