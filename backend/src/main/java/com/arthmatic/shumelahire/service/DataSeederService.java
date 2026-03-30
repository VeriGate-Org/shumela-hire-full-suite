package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Profile("dev")
public class DataSeederService implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(DataSeederService.class);
    
    @Autowired
    private ApplicantDataRepository applicantRepository;

    @Autowired
    private ApplicationDataRepository applicationRepository;

    @Autowired
    private JobPostingDataRepository jobPostingRepository;
    
    @Autowired
    private AuditLogService auditLogService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public void run(String... args) throws Exception {
        if (applicantRepository.count() == 0) {
            logger.info("Seeding demo applicant data...");
            seedApplicants();
        } else {
            logger.info("Applicant data already exists, skipping seeding");
        }
        
        if (applicationRepository.count() == 0) {
            logger.info("Seeding demo application data...");
            seedApplications();
        } else {
            logger.info("Application data already exists, skipping seeding");
        }
    }
    
    private void seedApplicants() {
        try {
            // Sample applicant 1 - Software Developer
            createSampleApplicant(
                "John", "Smith", "john.smith@example.com", "+27123456789", 
                "8901234567890", "123 Tech Street, Cape Town, 8001",
                createSoftwareDeveloperEducation(),
                createSoftwareDeveloperExperience(),
                createSoftwareDeveloperSkills()
            );
            
            // Sample applicant 2 - Marketing Manager
            createSampleApplicant(
                "Sarah", "Johnson", "sarah.johnson@example.com", "+27987654321",
                "9012345678901", "456 Marketing Ave, Johannesburg, 2001",
                createMarketingManagerEducation(),
                createMarketingManagerExperience(),
                createMarketingManagerSkills()
            );
            
            // Sample applicant 3 - Data Analyst
            createSampleApplicant(
                "Michael", "Chen", "michael.chen@example.com", "+27555123456",
                "7890123456789", "789 Data Drive, Durban, 4001",
                createDataAnalystEducation(),
                createDataAnalystExperience(),
                createDataAnalystSkills()
            );
            
            logger.info("Demo applicant data seeded successfully");
            
        } catch (Exception e) {
            logger.error("Error seeding applicant data", e);
        }
    }
    
    private void createSampleApplicant(String name, String surname, String email, String phone,
                                     String idNumber, String address, String education, 
                                     String experience, String skills) {
        try {
            Applicant applicant = new Applicant();
            applicant.setName(name);
            applicant.setSurname(surname);
            applicant.setEmail(email);
            applicant.setPhone(phone);
            applicant.setIdPassportNumber(idNumber);
            applicant.setAddress(address);
            applicant.setEducation(education);
            applicant.setExperience(experience);
            applicant.setSkills(skills);
            
            Applicant saved = applicantRepository.save(applicant);
            
            auditLogService.logApplicantAction(saved.getId(), "SEEDED", "APPLICANT", 
                                             "Demo data: " + saved.getFullName());
            
            logger.info("Created demo applicant: {} {}", name, surname);
            
        } catch (Exception e) {
            logger.error("Error creating sample applicant: {} {}", name, surname, e);
        }
    }
    
    private String createSoftwareDeveloperEducation() throws Exception {
        List<Map<String, Object>> education = Arrays.asList(
            createEducationEntry("University of Cape Town", "Bachelor of Science", "Computer Science", 2020),
            createEducationEntry("CodeSpace Academy", "Certificate", "Full Stack Development", 2021)
        );
        return objectMapper.writeValueAsString(education);
    }
    
    private String createSoftwareDeveloperExperience() throws Exception {
        List<Map<String, Object>> experience = Arrays.asList(
            createExperienceEntry("TechCorp Solutions", "Junior Software Developer", 
                                "2021-01", "2023-06", 
                                "Developed web applications using React and Node.js. Collaborated with cross-functional teams to deliver high-quality software solutions."),
            createExperienceEntry("Digital Innovations", "Software Developer", 
                                "2023-07", "Present", 
                                "Lead developer on e-commerce platform. Implemented microservices architecture and improved system performance by 40%.")
        );
        return objectMapper.writeValueAsString(experience);
    }
    
    private String createSoftwareDeveloperSkills() throws Exception {
        List<String> skills = Arrays.asList(
            "JavaScript", "React", "Node.js", "TypeScript", "Python", "Java", 
            "SQL", "MongoDB", "Git", "Docker", "Kubernetes", "AWS"
        );
        return objectMapper.writeValueAsString(skills);
    }
    
    private String createMarketingManagerEducation() throws Exception {
        List<Map<String, Object>> education = Arrays.asList(
            createEducationEntry("University of Witwatersrand", "Bachelor of Commerce", "Marketing", 2018),
            createEducationEntry("IMM Graduate School", "Diploma", "Digital Marketing", 2019)
        );
        return objectMapper.writeValueAsString(education);
    }
    
    private String createMarketingManagerExperience() throws Exception {
        List<Map<String, Object>> experience = Arrays.asList(
            createExperienceEntry("Brand Builders", "Marketing Coordinator", 
                                "2018-03", "2020-12", 
                                "Coordinated marketing campaigns and managed social media presence. Increased brand awareness by 60%."),
            createExperienceEntry("Growth Marketing Agency", "Marketing Manager", 
                                "2021-01", "Present", 
                                "Led marketing team of 5. Developed and executed marketing strategies resulting in 150% increase in lead generation.")
        );
        return objectMapper.writeValueAsString(experience);
    }
    
    private String createMarketingManagerSkills() throws Exception {
        List<String> skills = Arrays.asList(
            "Digital Marketing", "SEO/SEM", "Google Analytics", "Social Media Marketing", 
            "Content Marketing", "Email Marketing", "Marketing Automation", "Adobe Creative Suite",
            "Project Management", "Data Analysis"
        );
        return objectMapper.writeValueAsString(skills);
    }
    
    private String createDataAnalystEducation() throws Exception {
        List<Map<String, Object>> education = Arrays.asList(
            createEducationEntry("University of KwaZulu-Natal", "Bachelor of Science", "Statistics", 2019),
            createEducationEntry("DataCamp", "Certificate", "Data Science with Python", 2020)
        );
        return objectMapper.writeValueAsString(education);
    }
    
    private String createDataAnalystExperience() throws Exception {
        List<Map<String, Object>> experience = Arrays.asList(
            createExperienceEntry("Data Insights Corp", "Junior Data Analyst", 
                                "2019-06", "2021-12", 
                                "Analyzed customer data and created reports for business intelligence. Developed automated reporting dashboards."),
            createExperienceEntry("Analytics Pro", "Data Analyst", 
                                "2022-01", "Present", 
                                "Lead analyst for client projects. Implemented machine learning models for predictive analytics and business optimization.")
        );
        return objectMapper.writeValueAsString(experience);
    }
    
    private String createDataAnalystSkills() throws Exception {
        List<String> skills = Arrays.asList(
            "Python", "R", "SQL", "Tableau", "Power BI", "Excel", "Machine Learning",
            "Statistical Analysis", "Data Visualization", "Pandas", "NumPy", "Scikit-learn"
        );
        return objectMapper.writeValueAsString(skills);
    }
    
    private Map<String, Object> createEducationEntry(String institution, String degree, 
                                                   String fieldOfStudy, int graduationYear) {
        Map<String, Object> entry = new HashMap<>();
        entry.put("institution", institution);
        entry.put("degree", degree);
        entry.put("fieldOfStudy", fieldOfStudy);
        entry.put("graduationYear", graduationYear);
        return entry;
    }
    
    private Map<String, Object> createExperienceEntry(String company, String position, 
                                                    String startDate, String endDate, String description) {
        Map<String, Object> entry = new HashMap<>();
        entry.put("company", company);
        entry.put("position", position);
        entry.put("startDate", startDate);
        entry.put("endDate", endDate);
        entry.put("description", description);
        return entry;
    }
    
    private void seedApplications() {
        try {
            // Get sample applicants (should exist after seeding)
            List<Applicant> applicants = applicantRepository.findAll();
            if (applicants.isEmpty()) {
                logger.warn("No applicants found, cannot seed applications");
                return;
            }
            
            // Create sample applications for different job positions
            createSampleApplication(applicants.get(0), 1L, "Software Developer - React/Node.js", "Engineering",
                    ApplicationStatus.INTERVIEW_SCHEDULED, "EXTERNAL",
                    "I am excited to apply for the Software Developer position. With my experience in React and Node.js, " +
                    "I believe I would be a great fit for your team. I have worked on several full-stack projects and " +
                    "am passionate about creating clean, efficient code. I look forward to discussing how I can contribute " +
                    "to your engineering team and help build innovative solutions for your customers.");
            
            if (applicants.size() > 1) {
                createSampleApplication(applicants.get(1), 2L, "Marketing Manager", "Marketing",
                        ApplicationStatus.SCREENING, "REFERRAL",
                        "I am writing to express my strong interest in the Marketing Manager position at your company. " +
                        "With over 5 years of experience in digital marketing and team leadership, I have successfully " +
                        "increased brand awareness and lead generation for multiple companies. My expertise in SEO, " +
                        "content marketing, and data analytics would be valuable assets to your marketing team.");
            }
            
            if (applicants.size() > 2) {
                createSampleApplication(applicants.get(2), 3L, "Data Analyst", "Analytics",
                        ApplicationStatus.SUBMITTED, "INTERNAL",
                        "As an internal candidate, I am eager to transition into the Data Analyst role. My background " +
                        "in statistics and experience with Python and R make me well-suited for this position. I have " +
                        "been working with data visualization tools and have contributed to several analytical projects " +
                        "in my current role. I would love to bring my skills to the Analytics team and help drive " +
                        "data-driven decision making across the organization.");
                
                // Create a withdrawn application example
                Application withdrawnApp = createSampleApplication(applicants.get(0), 4L, "Senior Software Engineer", "Engineering",
                        ApplicationStatus.WITHDRAWN, "EXTERNAL",
                        "I am interested in the Senior Software Engineer position. However, I have decided to withdraw " +
                        "my application due to accepting another offer.");
                withdrawnApp.setWithdrawnAt(java.time.LocalDateTime.now().minusDays(2));
                withdrawnApp.setWithdrawalReason("Accepted offer from another company");
                applicationRepository.save(withdrawnApp);
            }
            
            logger.info("Demo application data seeded successfully");
            
        } catch (Exception e) {
            logger.error("Error seeding application data", e);
        }
    }
    
    private Application createSampleApplication(Applicant applicant, Long jobPostingId, String jobTitle, 
                                               String department, ApplicationStatus status, String source, 
                                               String coverLetter) {
        try {
            // Find the job posting
            JobPosting jobPosting = jobPostingRepository.findById(String.valueOf(jobPostingId)).orElse(null);
            
            Application application = new Application();
            application.setApplicant(applicant);
            if (jobPosting != null) {
                application.setJobPosting(jobPosting);
                application.setJobTitle(jobPosting.getTitle());
                application.setDepartment(jobPosting.getDepartment());
            } else {
                application.setJobTitle(jobTitle);
                application.setDepartment(department);
            }
            application.setStatus(status);
            application.setApplicationSource(source);
            application.setCoverLetter(coverLetter);
            
            // Set submitted date to simulate realistic timeline
            java.time.LocalDateTime submittedAt = java.time.LocalDateTime.now().minusDays(
                status == ApplicationStatus.SUBMITTED ? 1 :
                status == ApplicationStatus.SCREENING ? 5 :
                status == ApplicationStatus.INTERVIEW_SCHEDULED ? 10 : 15
            );
            application.setSubmittedAt(submittedAt);
            
            // Add status-specific details
            switch (status) {
                case SUBMITTED:
                    // New application, no additional data needed
                    break;
                case SCREENING:
                    application.setScreeningNotes("Candidate has strong technical background. Moving to next stage.");
                    break;
                case INTERVIEW_SCHEDULED:
                    application.setScreeningNotes("Initial screening completed successfully.");
                    application.setInterviewFeedback("Interview scheduled for next week.");
                    break;
                case INTERVIEW_COMPLETED:
                    application.setScreeningNotes("Interview completed successfully.");
                    application.setInterviewFeedback("Positive feedback from interview panel.");
                    break;
                case REFERENCE_CHECK:
                    application.setInterviewFeedback("Interview completed. Conducting reference checks.");
                    break;
                case OFFERED:
                case OFFER_PENDING:
                    application.setInterviewFeedback("Offer extended to candidate.");
                    break;
                case OFFER_ACCEPTED:
                    application.setInterviewFeedback("Offer accepted. Starting onboarding process.");
                    break;
                case OFFER_DECLINED:
                    application.setInterviewFeedback("Offer declined by candidate.");
                    break;
                case HIRED:
                    application.setInterviewFeedback("Candidate successfully hired.");
                    break;
                case REJECTED:
                    application.setInterviewFeedback("Application rejected.");
                    break;
                case WITHDRAWN:
                    // Will be set by caller
                    break;
                default:
                    // Handle any other cases
                    break;
            }
            
            Application saved = applicationRepository.save(application);
            
            auditLogService.logUserAction(applicant.getId(), "APPLICATION_SEEDED", "APPLICATION", 
                                         "Demo data: " + jobTitle);
            
            logger.info("Created demo application: {} for {}", jobTitle, applicant.getFullName());
            
            return saved;
            
        } catch (Exception e) {
            logger.error("Error creating sample application: {} for {}", jobTitle, applicant.getFullName(), e);
            return null;
        }
    }
}