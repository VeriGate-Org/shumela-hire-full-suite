package com.arthmatic.shumelahire.config;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.Interview;
import com.arthmatic.shumelahire.repository.ApplicantRepository;
import com.arthmatic.shumelahire.repository.ApplicationRepository;
import com.arthmatic.shumelahire.repository.InterviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Component
public class TestDataLoader implements CommandLineRunner {

    @Autowired
    @Qualifier("shumelahireApplicantRepository")
    private ApplicantRepository applicantRepository;

    @Autowired
    @Qualifier("shumelahireApplicationRepository")
    private ApplicationRepository applicationRepository;

    @Autowired
    @Qualifier("shumelahireInterviewRepository")
    private InterviewRepository interviewRepository;

    private final Random random = new Random();

    @Override
    public void run(String... args) throws Exception {
        // Only load test data if database is empty
        if (applicantRepository.count() == 0) {
            loadTestData();
        }
    }

    private void loadTestData() {
        // Create test applicants
        String[] sources = {"LinkedIn", "Company Website", "Job Board", "Referral", "Indeed", "Glassdoor", "Recruiter", "Other"};
        List<Applicant> applicants = Arrays.asList(
            createApplicant("John Doe", "john.doe@email.com", "+1234567890", "New York", "5+ years", "Java, Spring, React", sources[0]),
            createApplicant("Jane Smith", "jane.smith@email.com", "+1234567891", "San Francisco", "3+ years", "Python, Django, Vue.js", sources[1]),
            createApplicant("Mike Johnson", "mike.johnson@email.com", "+1234567892", "Austin", "7+ years", "JavaScript, Node.js, Angular", sources[2]),
            createApplicant("Sarah Williams", "sarah.williams@email.com", "+1234567893", "Seattle", "4+ years", "C#, .NET, React", sources[3]),
            createApplicant("David Brown", "david.brown@email.com", "+1234567894", "Boston", "6+ years", "Java, Spring Boot, Microservices", sources[4]),
            createApplicant("Lisa Davis", "lisa.davis@email.com", "+1234567895", "Chicago", "2+ years", "PHP, Laravel, MySQL", sources[5]),
            createApplicant("Tom Wilson", "tom.wilson@email.com", "+1234567896", "Denver", "8+ years", "Python, FastAPI, PostgreSQL", sources[6]),
            createApplicant("Anna Garcia", "anna.garcia@email.com", "+1234567897", "Miami", "3+ years", "React, TypeScript, AWS", sources[7])
        );

        applicantRepository.saveAll(applicants);

        // Create test applications
        List<String> positions = Arrays.asList(
            "Senior Software Engineer",
            "Frontend Developer",
            "Backend Developer",
            "Full Stack Developer",
            "DevOps Engineer",
            "Data Engineer",
            "Product Manager"
        );

        List<String> statuses = Arrays.asList(
            "SUBMITTED", "SCREENING", "INTERVIEWING", "OFFERED", "ACCEPTED", "REJECTED"
        );

        for (Applicant applicant : applicants) {
            // Create 1-2 applications per applicant
            int numApplications = random.nextInt(2) + 1;
            
            for (int i = 0; i < numApplications; i++) {
                Application application = new Application();
                application.setApplicant(applicant);
                application.setJobTitle(positions.get(random.nextInt(positions.size())));
                application.setJobId("JOB-" + (random.nextInt(1000) + 1000));
                application.setStatus(statuses.get(random.nextInt(statuses.size())));
                
                // Random rating between 1-5 for some applications
                if (random.nextBoolean()) {
                    application.setRating(random.nextInt(5) + 1);
                }
                
                // Random salary expectation
                application.setSalaryExpectation(75000.0 + random.nextDouble() * 75000.0);
                
                // Random submitted date in the last 60 days
                LocalDateTime submittedAt = LocalDateTime.now().minusDays(random.nextInt(60));
                application.setSubmittedAt(submittedAt);
                application.setUpdatedAt(submittedAt.plusDays(random.nextInt(10)));
                
                // Add some screening notes for demonstration
                if (random.nextBoolean()) {
                    application.setScreeningNotes("Initial screening completed. Good technical background.");
                }
                
                applicationRepository.save(application);
            }
        }

        // Create test interviews
        List<Application> applications = applicationRepository.findAll();
        List<String> interviewTypes = Arrays.asList(
            "PHONE", "VIDEO", "ON_SITE", "TECHNICAL", "HR", "FINAL"
        );
        
        List<String> interviewStatuses = Arrays.asList(
            "SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"
        );
        
        List<String> interviewerNames = Arrays.asList(
            "Sarah Johnson", "Mike Davis", "Lisa Chen", "Tom Wilson", 
            "Anna Martinez", "David Kim", "Rachel Brown"
        );
        
        List<String> interviewerEmails = Arrays.asList(
            "sarah.johnson@company.com", "mike.davis@company.com", "lisa.chen@company.com", 
            "tom.wilson@company.com", "anna.martinez@company.com", "david.kim@company.com", 
            "rachel.brown@company.com"
        );

        // Create 1-2 interviews per application that's in INTERVIEWING status
        for (Application application : applications) {
            if ("INTERVIEWING".equals(application.getStatus()) || random.nextBoolean()) {
                Interview interview = new Interview();
                interview.setApplication(application);
                interview.setInterviewType(interviewTypes.get(random.nextInt(interviewTypes.size())));
                
                // Schedule interviews from 2 weeks ago to 2 weeks in the future
                LocalDateTime baseDate = LocalDateTime.now().minusDays(14);
                LocalDateTime scheduledDate = baseDate.plusDays(random.nextInt(28)).withHour(9 + random.nextInt(8));
                interview.setScheduledDate(scheduledDate);
                
                interview.setDurationMinutes(30 + random.nextInt(90)); // 30-120 minutes
                interview.setStatus(interviewStatuses.get(random.nextInt(interviewStatuses.size())));
                
                int interviewerIndex = random.nextInt(interviewerNames.size());
                interview.setInterviewerName(interviewerNames.get(interviewerIndex));
                interview.setInterviewerEmail(interviewerEmails.get(interviewerIndex));
                
                // Add meeting details for VIDEO interviews
                if ("VIDEO".equals(interview.getInterviewType())) {
                    interview.setMeetingUrl("https://zoom.us/j/" + (1000000000L + random.nextInt(999999999)));
                } else if ("ON_SITE".equals(interview.getInterviewType())) {
                    interview.setLocation("Conference Room " + (char)('A' + random.nextInt(5)));
                }
                
                // Add feedback for completed interviews
                if ("COMPLETED".equals(interview.getStatus())) {
                    interview.setRating(3 + random.nextInt(3)); // 3-5 rating
                    interview.setTechnicalScore(6 + random.nextInt(5)); // 6-10
                    interview.setCommunicationScore(6 + random.nextInt(5)); // 6-10
                    interview.setCulturalFitScore(6 + random.nextInt(5)); // 6-10
                    interview.setCompletedAt(scheduledDate.plusMinutes(interview.getDurationMinutes()));
                    
                    String[] recommendations = {"PROCEED", "STRONG_PROCEED", "REJECT"};
                    interview.setRecommendation(recommendations[random.nextInt(recommendations.length)]);
                    
                    interview.setFeedback("Good technical skills and communication. " +
                                        (interview.getRating() >= 4 ? "Strong candidate." : "Average candidate."));
                }
                
                // Set confirmation status for scheduled/confirmed interviews
                if ("CONFIRMED".equals(interview.getStatus())) {
                    interview.setConfirmationReceived(true);
                }
                
                interviewRepository.save(interview);
            }
        }

        System.out.println("Test data loaded successfully!");
        System.out.println("Applicants: " + applicantRepository.count());
        System.out.println("Applications: " + applicationRepository.count());
        System.out.println("Interviews: " + interviewRepository.count());
    }

    private Applicant createApplicant(String fullName, String email, String phone, String location, String experience, String skills, String source) {
        Applicant applicant = new Applicant();
        applicant.setFullName(fullName);
        applicant.setEmail(email);
        applicant.setPhone(phone);
        applicant.setLocation(location);
        applicant.setExperience(experience);
        applicant.setSkills(skills);
        applicant.setSource(source);
        applicant.setLinkedinUrl("https://linkedin.com/in/" + fullName.toLowerCase().replace(" ", ""));
        applicant.setResumeUrl("https://example.com/resume/" + email.split("@")[0] + ".pdf");
        return applicant;
    }
}
