package com.arthmatic.shumelahire.tenant;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.repository.ApplicantRepository;
import com.arthmatic.shumelahire.repository.TenantRepository;

import jakarta.persistence.EntityManager;
import org.hibernate.Session;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that Hibernate @Filter-based tenant isolation works correctly.
 * TenantA's data must be invisible when the filter is set to TenantB.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ContextConfiguration(classes = com.arthmatic.shumelahire.ShumelaHireApplication.class)
class TenantIsolationTest {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @BeforeEach
    void setUp() {
        // Create two tenants
        if (!tenantRepository.existsById("tenant-a")) {
            tenantRepository.save(new Tenant("tenant-a", "Tenant A Corp", "tenant-a", "admin@tenant-a.com"));
        }
        if (!tenantRepository.existsById("tenant-b")) {
            tenantRepository.save(new Tenant("tenant-b", "Tenant B Corp", "tenant-b", "admin@tenant-b.com"));
        }
        entityManager.flush();

        // Seed data for tenant-a
        TenantContext.setCurrentTenant("tenant-a");
        enableFilter("tenant-a");

        Applicant a1 = new Applicant();
        a1.setName("Alice");
        a1.setSurname("Alpha");
        a1.setEmail("alice@tenant-a.com");
        a1.setPhone("+27000000001");
        entityManager.persist(a1);

        Applicant a2 = new Applicant();
        a2.setName("Aaron");
        a2.setSurname("Alpha");
        a2.setEmail("aaron@tenant-a.com");
        a2.setPhone("+27000000002");
        entityManager.persist(a2);

        // Seed data for tenant-b
        TenantContext.setCurrentTenant("tenant-b");
        enableFilter("tenant-b");

        Applicant b1 = new Applicant();
        b1.setName("Bob");
        b1.setSurname("Beta");
        b1.setEmail("bob@tenant-b.com");
        b1.setPhone("+27000000003");
        entityManager.persist(b1);

        entityManager.flush();
        entityManager.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void tenantA_shouldOnlySeeOwnApplicants() {
        TenantContext.setCurrentTenant("tenant-a");
        enableFilter("tenant-a");

        List<Applicant> applicants = applicantRepository.findAll();
        assertThat(applicants).hasSize(2);
        assertThat(applicants).allMatch(a -> "tenant-a".equals(a.getTenantId()));
    }

    @Test
    void tenantB_shouldOnlySeeOwnApplicants() {
        TenantContext.setCurrentTenant("tenant-b");
        enableFilter("tenant-b");

        List<Applicant> applicants = applicantRepository.findAll();
        assertThat(applicants).hasSize(1);
        assertThat(applicants.get(0).getName()).isEqualTo("Bob");
        assertThat(applicants.get(0).getTenantId()).isEqualTo("tenant-b");
    }

    @Test
    void tenantA_shouldNotSeeTenantBData() {
        TenantContext.setCurrentTenant("tenant-a");
        enableFilter("tenant-a");

        List<Applicant> applicants = applicantRepository.findAll();
        assertThat(applicants).noneMatch(a -> "tenant-b".equals(a.getTenantId()));
    }

    @Test
    void switchingTenantContext_shouldChangeVisibleData() {
        // Start as tenant-a
        TenantContext.setCurrentTenant("tenant-a");
        enableFilter("tenant-a");
        assertThat(applicantRepository.findAll()).hasSize(2);

        entityManager.clear();

        // Switch to tenant-b
        TenantContext.setCurrentTenant("tenant-b");
        enableFilter("tenant-b");
        assertThat(applicantRepository.findAll()).hasSize(1);
    }

    private void enableFilter(String tenantId) {
        Session session = entityManager.unwrap(Session.class);
        session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);
    }
}
