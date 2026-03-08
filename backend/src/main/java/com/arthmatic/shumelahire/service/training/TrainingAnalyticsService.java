package com.arthmatic.shumelahire.service.training;

import com.arthmatic.shumelahire.repository.training.CertificationRepository;
import com.arthmatic.shumelahire.repository.training.TrainingCourseRepository;
import com.arthmatic.shumelahire.repository.training.TrainingEnrollmentRepository;
import com.arthmatic.shumelahire.repository.training.TrainingSessionRepository;
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
    private TrainingCourseRepository courseRepository;

    @Autowired
    private TrainingSessionRepository sessionRepository;

    @Autowired
    private TrainingEnrollmentRepository enrollmentRepository;

    @Autowired
    private CertificationRepository certificationRepository;

    public Map<String, Object> getAnalytics() {
        Map<String, Object> analytics = new HashMap<>();

        // Course stats
        analytics.put("totalCourses", courseRepository.count());
        analytics.put("activeCourses", courseRepository.findByIsActiveTrue().size());
        analytics.put("mandatoryCourses", courseRepository.findByIsMandatoryTrue().size());
        analytics.put("categories", courseRepository.findDistinctCategories());

        // Session stats
        analytics.put("totalSessions", sessionRepository.count());
        analytics.put("upcomingSessions", sessionRepository.findUpcomingSessions(LocalDateTime.now()).size());
        analytics.put("openSessions", sessionRepository.findOpenWithAvailableSeats().size());

        // Enrollment stats
        analytics.put("totalEnrollments", enrollmentRepository.count());
        analytics.put("completedEnrollments", enrollmentRepository.countCompleted());

        // Certification stats
        analytics.put("activeCertifications", certificationRepository.countActive());
        analytics.put("expiringCertifications", certificationRepository.findExpiringSoon(
                LocalDate.now(), LocalDate.now().plusDays(30)).size());
        analytics.put("expiredCertifications", certificationRepository.findExpired(LocalDate.now()).size());

        return analytics;
    }
}
