package com.arthmatic.shumelahire.config;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.ApplicantRepository;
import com.arthmatic.shumelahire.repository.ApplicationRepository;
import com.arthmatic.shumelahire.repository.InterviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Component
@Profile("dev")
public class TestDataLoader implements CommandLineRunner {

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    private final Random random = new Random();

    @Override
    public void run(String... args) throws Exception {
        if (applicantRepository.count() == 0) {
            loadTestData();
        }
    }

    private void loadTestData() {
        String[] sources = {"LinkedIn", "Company Website", "Job Board", "Referral", "Indeed", "PNet", "Recruiter", "Other"};
        List<Applicant> applicants = Arrays.asList(
            createApplicant("John", "Doe", "john.doe@email.com", "+1234567890", "New York", "5+ years", "Java, Spring, React", sources[0]),
            createApplicant("Jane", "Smith", "jane.smith@email.com", "+1234567891", "San Francisco", "3+ years", "Python, Django, Vue.js", sources[1]),
            createApplicant("Mike", "Johnson", "mike.johnson@email.com", "+1234567892", "Austin", "7+ years", "JavaScript, Node.js, Angular", sources[2]),
            createApplicant("Sarah", "Williams", "sarah.williams@email.com", "+1234567893", "Seattle", "4+ years", "C#, .NET, React", sources[3]),
            createApplicant("David", "Brown", "david.brown@email.com", "+1234567894", "Boston", "6+ years", "Java, Spring Boot, Microservices", sources[4]),
            createApplicant("Lisa", "Davis", "lisa.davis@email.com", "+1234567895", "Chicago", "2+ years", "PHP, Laravel, MySQL", sources[5]),
            createApplicant("Tom", "Wilson", "tom.wilson@email.com", "+1234567896", "Denver", "8+ years", "Python, FastAPI, PostgreSQL", sources[6]),
            createApplicant("Anna", "Garcia", "anna.garcia@email.com", "+1234567897", "Miami", "3+ years", "React, TypeScript, AWS", sources[7])
        );

        applicantRepository.saveAll(applicants);

        List<String> positions = Arrays.asList(
            "Senior Software Engineer", "Frontend Developer", "Backend Developer",
            "Full Stack Developer", "DevOps Engineer", "Data Engineer", "Product Manager"
        );

        ApplicationStatus[] statuses = {
            ApplicationStatus.SUBMITTED, ApplicationStatus.SCREENING,
            ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.OFFERED,
            ApplicationStatus.OFFER_ACCEPTED, ApplicationStatus.REJECTED
        };

        for (Applicant applicant : applicants) {
            int numApplications = random.nextInt(2) + 1;
            for (int i = 0; i < numApplications; i++) {
                Application application = new Application();
                application.setApplicant(applicant);
                application.setJobTitle(positions.get(random.nextInt(positions.size())));
                application.setJobId("JOB-" + (random.nextInt(1000) + 1000));
                application.setStatus(statuses[random.nextInt(statuses.length)]);

                if (random.nextBoolean()) {
                    application.setRating(random.nextInt(5) + 1);
                }
                application.setSalaryExpectation(75000.0 + random.nextDouble() * 75000.0);

                LocalDateTime submittedAt = LocalDateTime.now().minusDays(random.nextInt(60));
                application.setSubmittedAt(submittedAt);
                application.setUpdatedAt(submittedAt.plusDays(random.nextInt(10)));

                if (random.nextBoolean()) {
                    application.setScreeningNotes("Initial screening completed. Good technical background.");
                }
                applicationRepository.save(application);
            }
        }

        List<Application> applications = applicationRepository.findAll();
        InterviewType[] interviewTypes = InterviewType.values();
        InterviewStatus[] interviewStatuses = {
            InterviewStatus.SCHEDULED, InterviewStatus.IN_PROGRESS,
            InterviewStatus.COMPLETED, InterviewStatus.CANCELLED
        };

        List<String> interviewerNames = Arrays.asList(
            "Sarah Johnson", "Mike Davis", "Lisa Chen", "Tom Wilson",
            "Anna Martinez", "David Kim", "Rachel Brown"
        );
        List<String> interviewerEmails = Arrays.asList(
            "sarah.johnson@company.com", "mike.davis@company.com", "lisa.chen@company.com",
            "tom.wilson@company.com", "anna.martinez@company.com", "david.kim@company.com",
            "rachel.brown@company.com"
        );

        for (Application application : applications) {
            if (application.getStatus() == ApplicationStatus.INTERVIEW_SCHEDULED || random.nextBoolean()) {
                Interview interview = new Interview();
                interview.setApplication(application);
                interview.setTitle("Interview - " + application.getJobTitle());
                interview.setType(interviewTypes[random.nextInt(interviewTypes.length)]);

                LocalDateTime baseDate = LocalDateTime.now().minusDays(14);
                LocalDateTime scheduledDate = baseDate.plusDays(random.nextInt(28)).withHour(9 + random.nextInt(8));
                interview.setScheduledAt(scheduledDate);

                interview.setDurationMinutes(30 + random.nextInt(90));
                interview.setStatus(interviewStatuses[random.nextInt(interviewStatuses.length)]);

                int interviewerIndex = random.nextInt(interviewerNames.size());
                interview.setInterviewerName(interviewerNames.get(interviewerIndex));
                interview.setInterviewerEmail(interviewerEmails.get(interviewerIndex));
                interview.setInterviewerId((long) (interviewerIndex + 1));
                interview.setCreatedBy(1L);

                if (interview.getType() == InterviewType.VIDEO) {
                    interview.setMeetingUrl("https://zoom.us/j/" + (1000000000L + random.nextInt(999999999)));
                } else if (interview.getType() == InterviewType.IN_PERSON) {
                    interview.setLocation("Conference Room " + (char) ('A' + random.nextInt(5)));
                }

                if (interview.getStatus() == InterviewStatus.COMPLETED) {
                    interview.setRating(3 + random.nextInt(3));
                    interview.setTechnicalScore(6 + random.nextInt(5));
                    interview.setCommunicationScore(6 + random.nextInt(5));
                    interview.setCulturalFitScore(6 + random.nextInt(5));
                    interview.setCompletedAt(scheduledDate.plusMinutes(interview.getDurationMinutes()));
                    interview.setFeedback("Good technical skills and communication. " +
                        (interview.getRating() >= 4 ? "Strong candidate." : "Average candidate."));
                }

                if (interview.getStatus() == InterviewStatus.IN_PROGRESS) {
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

    private Applicant createApplicant(String name, String surname, String email, String phone,
                                       String location, String experience, String skills, String source) {
        Applicant applicant = new Applicant();
        applicant.setName(name);
        applicant.setSurname(surname);
        applicant.setEmail(email);
        applicant.setPhone(phone);
        applicant.setLocation(location);
        applicant.setExperience(experience);
        applicant.setSkills(skills);
        applicant.setSource(source);
        applicant.setLinkedinUrl("https://linkedin.com/in/" + name.toLowerCase() + surname.toLowerCase());
        applicant.setResumeUrl("https://example.com/resume/" + email.split("@")[0] + ".pdf");
        return applicant;
    }
}
