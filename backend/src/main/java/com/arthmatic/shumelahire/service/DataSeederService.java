package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.EmployeeDocumentType;
import com.arthmatic.shumelahire.entity.EmployeeDocumentTypeConfig;
import com.arthmatic.shumelahire.entity.JobAdTemplate;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.EmployeeDocumentTypeConfigDataRepository;
import com.arthmatic.shumelahire.repository.JobAdTemplateDataRepository;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
    private EmployeeDocumentTypeConfigDataRepository documentTypeConfigRepository;

    @Autowired
    private JobAdTemplateDataRepository jobAdTemplateRepository;

    @Autowired
    private AuditLogService auditLogService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public void run(String... args) throws Exception {
        if (documentTypeConfigRepository.findActive().isEmpty()) {
            logger.info("Seeding document type configs...");
            seedDocumentTypeConfigs();
        } else {
            logger.info("Document type configs already exist, skipping seeding");
        }

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

        if (jobAdTemplateRepository.count() == 0) {
            logger.info("Seeding job ad templates...");
            seedJobAdTemplates();
        } else {
            logger.info("Job ad templates already exist, skipping seeding");
        }
    }

    private void seedDocumentTypeConfigs() {
        Set<String> requiresExpiry = Set.of("WORK_PERMIT", "PASSPORT", "TAX_CERTIFICATE", "MEDICAL");
        Set<String> isRequired = Set.of("ID_DOCUMENT", "CONTRACT");

        for (EmployeeDocumentType type : EmployeeDocumentType.values()) {
            EmployeeDocumentTypeConfig config = new EmployeeDocumentTypeConfig();
            config.setName(type.getDisplayName());
            config.setCode(type.name());
            config.setDescription(type.getDisplayName() + " document");
            config.setRequiresExpiry(requiresExpiry.contains(type.name()));
            config.setIsRequired(isRequired.contains(type.name()));
            config.setIsActive(true);
            config.setCreatedAt(LocalDateTime.now());
            documentTypeConfigRepository.save(config);
        }
        logger.info("Seeded {} document type configs", EmployeeDocumentType.values().length);
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
    
    private void seedJobAdTemplates() {
        try {
            String seeder = "system-seed";
            LocalDateTime now = LocalDateTime.now();

            // 1. Investment Analyst
            JobAdTemplate investmentAnalyst = new JobAdTemplate();
            investmentAnalyst.setName("Investment Analyst");
            investmentAnalyst.setDescription("Template for Investment Analyst roles in development finance and industrial funding divisions.");
            investmentAnalyst.setTitle("{{jobTitle}} — {{department}}");
            investmentAnalyst.setIntro(
                "<p><strong>{{companyName}}</strong> is a leading development finance institution mandated to drive " +
                "industrial capacity and economic growth across South Africa. We are seeking a skilled " +
                "<strong>{{jobTitle}}</strong> to join our {{department}} team in {{location}}.</p>" +
                "<p>This role offers the opportunity to evaluate high-impact investment opportunities, perform rigorous " +
                "financial analysis, and contribute to strategic funding decisions that shape the country's industrial landscape.</p>"
            );
            investmentAnalyst.setResponsibilities(
                "<h3>Key Responsibilities</h3><ul>" +
                "<li>Conduct financial due diligence and feasibility assessments for investment proposals</li>" +
                "<li>Build and maintain financial models (DCF, LBO, comparable analysis) for project appraisals</li>" +
                "<li>Prepare investment memoranda and present recommendations to the Investment Committee</li>" +
                "<li>Monitor portfolio performance and covenant compliance of funded projects</li>" +
                "<li>Perform sector research and identify emerging industrial development opportunities</li>" +
                "<li>Collaborate with legal, risk, and credit teams throughout the deal lifecycle</li>" +
                "<li>Support post-investment monitoring and restructuring activities where required</li>" +
                "</ul>"
            );
            investmentAnalyst.setRequirements(
                "<h3>Requirements</h3><ul>" +
                "<li>BCom (Hons) / BBusSci in Finance, Economics, or Accounting; CFA progress advantageous</li>" +
                "<li>3–5 years' experience in investment analysis, corporate finance, or development finance</li>" +
                "<li>Advanced financial modelling skills in Excel; familiarity with Bloomberg or Capital IQ</li>" +
                "<li>Strong understanding of project finance, credit risk assessment, and deal structuring</li>" +
                "<li>Excellent written and verbal communication skills for committee-level presentations</li>" +
                "<li>Knowledge of PFMA, Companies Act, and B-BBEE regulatory frameworks</li>" +
                "</ul>"
            );
            investmentAnalyst.setBenefits(
                "<h3>What We Offer</h3><ul>" +
                "<li>Competitive salary: {{salaryRange}}</li>" +
                "<li>Performance-linked incentive bonus</li>" +
                "<li>Employer-contributed pension and medical aid</li>" +
                "<li>Study assistance and professional development funding (CFA, CA(SA))</li>" +
                "<li>Hybrid working arrangement</li>" +
                "<li>Meaningful work that drives industrialisation and job creation in South Africa</li>" +
                "</ul>"
            );
            investmentAnalyst.setLocation("{{location}}");
            investmentAnalyst.setEmploymentType("Full-time");
            investmentAnalyst.setSalaryRangeMin(new java.math.BigDecimal("550000"));
            investmentAnalyst.setSalaryRangeMax(new java.math.BigDecimal("850000"));
            investmentAnalyst.setContactEmail("careers@company.co.za");
            investmentAnalyst.setIsArchived(false);
            investmentAnalyst.setUsageCount(0);
            investmentAnalyst.setCreatedBy(seeder);
            investmentAnalyst.setCreatedAt(now);
            investmentAnalyst.setUpdatedAt(now);
            jobAdTemplateRepository.save(investmentAnalyst);

            // 2. ICT Business Analyst
            JobAdTemplate ictBa = new JobAdTemplate();
            ictBa.setName("ICT Business Analyst");
            ictBa.setDescription("Template for Business Analyst roles within IT and digital transformation divisions.");
            ictBa.setTitle("{{jobTitle}} — {{department}}");
            ictBa.setIntro(
                "<p><strong>{{companyName}}</strong> is accelerating its digital transformation journey and is looking " +
                "for a talented <strong>{{jobTitle}}</strong> to join the {{department}} team in {{location}}.</p>" +
                "<p>You will bridge the gap between business stakeholders and technology delivery teams, translating " +
                "organisational needs into well-defined requirements that power modern, user-centred solutions.</p>"
            );
            ictBa.setResponsibilities(
                "<h3>Key Responsibilities</h3><ul>" +
                "<li>Elicit, analyse, and document business and functional requirements using interviews, workshops, and process mapping</li>" +
                "<li>Produce user stories, acceptance criteria, and process flow diagrams for agile delivery squads</li>" +
                "<li>Facilitate stakeholder workshops and UAT sessions, ensuring solutions meet business objectives</li>" +
                "<li>Maintain a product backlog and prioritise features in collaboration with Product Owners</li>" +
                "<li>Analyse existing systems and data flows to identify automation and optimisation opportunities</li>" +
                "<li>Support change management, training material development, and post-go-live hypercare</li>" +
                "</ul>"
            );
            ictBa.setRequirements(
                "<h3>Requirements</h3><ul>" +
                "<li>Degree in Information Systems, Computer Science, or Business Management</li>" +
                "<li>3+ years' experience as a Business Analyst in an enterprise IT environment</li>" +
                "<li>Proficiency with BPMN, UML, or similar modelling notations</li>" +
                "<li>Experience with Agile/Scrum delivery and tools such as Jira or Azure DevOps</li>" +
                "<li>Strong SQL skills for data analysis and reporting</li>" +
                "<li>CBAP, CCBA, or IIBA certification advantageous</li>" +
                "<li>Exposure to ERP systems (SAP, Oracle, Sage) is a plus</li>" +
                "</ul>"
            );
            ictBa.setBenefits(
                "<h3>What We Offer</h3><ul>" +
                "<li>Competitive salary: {{salaryRange}}</li>" +
                "<li>Annual performance bonus</li>" +
                "<li>Medical aid and retirement fund contributions</li>" +
                "<li>Training budget for certifications and conferences</li>" +
                "<li>Flexible / hybrid working model</li>" +
                "<li>Exposure to enterprise-scale digital transformation programmes</li>" +
                "</ul>"
            );
            ictBa.setLocation("{{location}}");
            ictBa.setEmploymentType("Full-time");
            ictBa.setSalaryRangeMin(new java.math.BigDecimal("480000"));
            ictBa.setSalaryRangeMax(new java.math.BigDecimal("720000"));
            ictBa.setContactEmail("careers@company.co.za");
            ictBa.setIsArchived(false);
            ictBa.setUsageCount(0);
            ictBa.setCreatedBy(seeder);
            ictBa.setCreatedAt(now.minusDays(1));
            ictBa.setUpdatedAt(now.minusDays(1));
            jobAdTemplateRepository.save(ictBa);

            // 3. Legal Advisor (Corporate & Commercial)
            JobAdTemplate legalAdvisor = new JobAdTemplate();
            legalAdvisor.setName("Legal Advisor — Corporate & Commercial");
            legalAdvisor.setDescription("Template for in-house legal counsel roles covering corporate governance, commercial transactions, and regulatory compliance.");
            legalAdvisor.setTitle("{{jobTitle}} — {{department}}");
            legalAdvisor.setIntro(
                "<p><strong>{{companyName}}</strong> invites applications from admitted attorneys for the position of " +
                "<strong>{{jobTitle}}</strong> within our {{department}}. Based in {{location}}, this role provides " +
                "strategic legal support across corporate transactions, funding agreements, and regulatory compliance.</p>"
            );
            legalAdvisor.setResponsibilities(
                "<h3>Key Responsibilities</h3><ul>" +
                "<li>Draft, review, and negotiate commercial contracts, funding agreements, and shareholder compacts</li>" +
                "<li>Advise the Board and Executive Committee on corporate governance, fiduciary duties, and King IV compliance</li>" +
                "<li>Manage litigation, disputes, and external counsel relationships</li>" +
                "<li>Ensure compliance with the PFMA, Companies Act, POPIA, and sector-specific regulations</li>" +
                "<li>Provide legal opinions on investment transactions and risk mitigation strategies</li>" +
                "<li>Support B-BBEE verification, supply chain compliance, and procurement governance</li>" +
                "</ul>"
            );
            legalAdvisor.setRequirements(
                "<h3>Requirements</h3><ul>" +
                "<li>LLB degree; admitted attorney of the High Court of South Africa</li>" +
                "<li>5+ years' post-admission experience in corporate/commercial law (in-house or private practice)</li>" +
                "<li>Solid understanding of the PFMA, Treasury Regulations, and public entity governance</li>" +
                "<li>Experience with project finance, investment agreements, or development finance transactions</li>" +
                "<li>Strong drafting and negotiation skills</li>" +
                "<li>LLM or postgraduate diploma in commercial law advantageous</li>" +
                "</ul>"
            );
            legalAdvisor.setBenefits(
                "<h3>What We Offer</h3><ul>" +
                "<li>Competitive salary: {{salaryRange}}</li>" +
                "<li>Performance bonus</li>" +
                "<li>Medical aid subsidy and defined-contribution pension</li>" +
                "<li>CPD-accredited in-house training programmes</li>" +
                "<li>Opportunity to work on nationally significant transactions</li>" +
                "<li>Supportive, collegial legal team environment</li>" +
                "</ul>"
            );
            legalAdvisor.setLocation("{{location}}");
            legalAdvisor.setEmploymentType("Full-time");
            legalAdvisor.setSalaryRangeMin(new java.math.BigDecimal("700000"));
            legalAdvisor.setSalaryRangeMax(new java.math.BigDecimal("1100000"));
            legalAdvisor.setContactEmail("careers@company.co.za");
            legalAdvisor.setIsArchived(false);
            legalAdvisor.setUsageCount(0);
            legalAdvisor.setCreatedBy(seeder);
            legalAdvisor.setCreatedAt(now.minusDays(2));
            legalAdvisor.setUpdatedAt(now.minusDays(2));
            jobAdTemplateRepository.save(legalAdvisor);

            // 4. Project Manager — Infrastructure & Industrial
            JobAdTemplate projectManager = new JobAdTemplate();
            projectManager.setName("Project Manager — Infrastructure & Industrial");
            projectManager.setDescription("Template for Project Manager roles overseeing capital-intensive industrial and infrastructure development projects.");
            projectManager.setTitle("{{jobTitle}} — {{department}}");
            projectManager.setIntro(
                "<p><strong>{{companyName}}</strong> is at the forefront of industrial development and infrastructure " +
                "investment in South Africa. We are recruiting an experienced <strong>{{jobTitle}}</strong> to drive " +
                "the delivery of funded projects within our {{department}}, based in {{location}}.</p>" +
                "<p>This is a high-impact role for a results-driven professional who thrives on managing complex, " +
                "multi-stakeholder projects from inception through to completion.</p>"
            );
            projectManager.setResponsibilities(
                "<h3>Key Responsibilities</h3><ul>" +
                "<li>Lead end-to-end project delivery for industrial development and infrastructure programmes</li>" +
                "<li>Develop and manage project plans, budgets, timelines, and risk registers</li>" +
                "<li>Coordinate with engineers, contractors, government departments, and community stakeholders</li>" +
                "<li>Report project status to the Executive Committee and funding partners using dashboards and milestone trackers</li>" +
                "<li>Ensure compliance with environmental, safety, and regulatory requirements (EIA, OHS Act)</li>" +
                "<li>Manage procurement processes in line with PFMA and SCM policy</li>" +
                "<li>Drive post-implementation reviews and lessons-learned processes</li>" +
                "</ul>"
            );
            projectManager.setRequirements(
                "<h3>Requirements</h3><ul>" +
                "<li>Degree in Engineering, Construction Management, Project Management, or related field</li>" +
                "<li>PMP, PRINCE2 Practitioner, or equivalent project management certification</li>" +
                "<li>5–8 years' experience managing capital projects (R50M+) in infrastructure, energy, or manufacturing</li>" +
                "<li>Proficiency with MS Project, Primavera, or similar scheduling tools</li>" +
                "<li>Strong stakeholder management and communication skills</li>" +
                "<li>Valid driver's licence and willingness to travel to project sites nationally</li>" +
                "</ul>"
            );
            projectManager.setBenefits(
                "<h3>What We Offer</h3><ul>" +
                "<li>Competitive salary: {{salaryRange}}</li>" +
                "<li>Performance-based incentive scheme</li>" +
                "<li>Company vehicle or car allowance</li>" +
                "<li>Medical aid and pension fund</li>" +
                "<li>Professional body membership fees covered</li>" +
                "<li>Opportunity to deliver transformative infrastructure across South Africa</li>" +
                "</ul>"
            );
            projectManager.setLocation("{{location}}");
            projectManager.setEmploymentType("Full-time");
            projectManager.setSalaryRangeMin(new java.math.BigDecimal("650000"));
            projectManager.setSalaryRangeMax(new java.math.BigDecimal("950000"));
            projectManager.setContactEmail("careers@company.co.za");
            projectManager.setIsArchived(false);
            projectManager.setUsageCount(0);
            projectManager.setCreatedBy(seeder);
            projectManager.setCreatedAt(now.minusDays(3));
            projectManager.setUpdatedAt(now.minusDays(3));
            jobAdTemplateRepository.save(projectManager);

            // 5. Graduate Trainee Programme
            JobAdTemplate graduateTrainee = new JobAdTemplate();
            graduateTrainee.setName("Graduate Trainee Programme");
            graduateTrainee.setDescription("Template for structured graduate / internship programmes with rotational placements.");
            graduateTrainee.setTitle("{{jobTitle}} — Graduate Trainee Programme");
            graduateTrainee.setIntro(
                "<p><strong>{{companyName}}</strong> is committed to developing the next generation of professionals " +
                "who will drive South Africa's industrial and economic growth. Our <strong>Graduate Trainee Programme</strong> " +
                "offers recent graduates a structured 24-month rotational programme across key business divisions in {{location}}.</p>" +
                "<p>If you are a high-potential graduate eager to launch your career in development finance, project management, " +
                "or corporate services, we want to hear from you.</p>"
            );
            graduateTrainee.setResponsibilities(
                "<h3>What You'll Do</h3><ul>" +
                "<li>Rotate through 3–4 business units (e.g. Investment Appraisal, Risk, Strategy, Corporate Affairs) over 24 months</li>" +
                "<li>Work alongside experienced professionals on live projects and transactions</li>" +
                "<li>Complete a structured learning curriculum including technical skills, leadership, and professional ethics</li>" +
                "<li>Deliver a capstone research project aligned with the organisation's strategic priorities</li>" +
                "<li>Participate in mentorship pairings, peer learning cohorts, and executive exposure sessions</li>" +
                "<li>Receive ongoing feedback and formal performance reviews every six months</li>" +
                "</ul>"
            );
            graduateTrainee.setRequirements(
                "<h3>Requirements</h3><ul>" +
                "<li>Completed degree (NQF 7+) in Finance, Economics, Engineering, Law, IT, or related field within the last 2 years</li>" +
                "<li>South African citizen or permanent resident</li>" +
                "<li>Strong academic record (minimum 65% aggregate or equivalent)</li>" +
                "<li>No prior full-time professional work experience exceeding 12 months</li>" +
                "<li>Excellent analytical thinking, communication, and teamwork skills</li>" +
                "<li>Proficiency in MS Office (Excel, PowerPoint, Word)</li>" +
                "<li>Willingness to relocate to {{location}} for the programme duration</li>" +
                "</ul>"
            );
            graduateTrainee.setBenefits(
                "<h3>What We Offer</h3><ul>" +
                "<li>Competitive graduate stipend: {{salaryRange}}</li>" +
                "<li>Medical aid contribution during the programme</li>" +
                "<li>Study support for relevant professional qualifications</li>" +
                "<li>Structured mentorship by senior leaders</li>" +
                "<li>Possible permanent placement on successful completion</li>" +
                "<li>Networking opportunities across government and private sector partners</li>" +
                "</ul>"
            );
            graduateTrainee.setLocation("{{location}}");
            graduateTrainee.setEmploymentType("Fixed-term Contract");
            graduateTrainee.setSalaryRangeMin(new java.math.BigDecimal("240000"));
            graduateTrainee.setSalaryRangeMax(new java.math.BigDecimal("320000"));
            graduateTrainee.setContactEmail("graduates@company.co.za");
            graduateTrainee.setIsArchived(false);
            graduateTrainee.setUsageCount(0);
            graduateTrainee.setCreatedBy(seeder);
            graduateTrainee.setCreatedAt(now.minusDays(4));
            graduateTrainee.setUpdatedAt(now.minusDays(4));
            jobAdTemplateRepository.save(graduateTrainee);

            logger.info("Seeded 5 job ad templates successfully");

        } catch (Exception e) {
            logger.error("Error seeding job ad templates", e);
        }
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
            createSampleApplication(applicants.get(0), "1", "Software Developer - React/Node.js", "Engineering",
                    ApplicationStatus.INTERVIEW_SCHEDULED, "EXTERNAL",
                    "I am excited to apply for the Software Developer position. With my experience in React and Node.js, " +
                    "I believe I would be a great fit for your team. I have worked on several full-stack projects and " +
                    "am passionate about creating clean, efficient code. I look forward to discussing how I can contribute " +
                    "to your engineering team and help build innovative solutions for your customers.");
            
            if (applicants.size() > 1) {
                createSampleApplication(applicants.get(1), "2", "Marketing Manager", "Marketing",
                        ApplicationStatus.SCREENING, "REFERRAL",
                        "I am writing to express my strong interest in the Marketing Manager position at your company. " +
                        "With over 5 years of experience in digital marketing and team leadership, I have successfully " +
                        "increased brand awareness and lead generation for multiple companies. My expertise in SEO, " +
                        "content marketing, and data analytics would be valuable assets to your marketing team.");
            }
            
            if (applicants.size() > 2) {
                createSampleApplication(applicants.get(2), "3", "Data Analyst", "Analytics",
                        ApplicationStatus.SUBMITTED, "INTERNAL",
                        "As an internal candidate, I am eager to transition into the Data Analyst role. My background " +
                        "in statistics and experience with Python and R make me well-suited for this position. I have " +
                        "been working with data visualization tools and have contributed to several analytical projects " +
                        "in my current role. I would love to bring my skills to the Analytics team and help drive " +
                        "data-driven decision making across the organization.");
                
                // Create a withdrawn application example
                Application withdrawnApp = createSampleApplication(applicants.get(0), "4", "Senior Software Engineer", "Engineering",
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
    
    private Application createSampleApplication(Applicant applicant, String jobPostingId, String jobTitle, 
                                               String department, ApplicationStatus status, String source, 
                                               String coverLetter) {
        try {
            // Find the job posting
            JobPosting jobPosting = jobPostingRepository.findById(jobPostingId).orElse(null);
            
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