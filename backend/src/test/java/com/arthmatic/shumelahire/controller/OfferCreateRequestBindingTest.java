package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Binds and validates the exact JSON the create-offer form sends.
 *
 * <p>This guards a failure that every cheaper test missed. {@code createOffer} declares
 * {@code @Valid @RequestBody Offer}, and {@code application} carried a default-group
 * {@code @NotNull} while {@code OfferService.createOffer} sets it from the path variable
 * <em>after</em> binding. So the handler rejected every request with
 * "Validation failed for argument [1] … Application is required" before the service ran. Type
 * checks, linting and a component test with a mocked fetch all passed — the endpoint was reachable,
 * correctly secured, and not once satisfiable.</p>
 *
 * <p>The payload below is copied from what {@code OfferManagement}'s create modal builds. If the
 * form changes, change it here too; that coupling is the point.</p>
 */
class OfferCreateRequestBindingTest {

    /** What the create modal POSTs: no application, no id, no status. */
    private static final String CREATE_REQUEST_JSON = """
            {
              "offerType": "FULL_TIME_PERMANENT",
              "baseSalary": 750000,
              "currency": "ZAR",
              "salaryFrequency": "ANNUALLY",
              "startDate": "2026-10-01",
              "noticePeriodDays": 30,
              "offerExpiryDate": "2026-09-30T23:59:59",
              "signingBonus": 50000,
              "probationaryPeriodDays": 90,
              "workLocation": "Sandton"
            }
            """;

    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private Offer bind(String json) throws Exception {
        return mapper.readValue(json, Offer.class);
    }

    private Set<String> violations(Offer offer, Class<?>... groups) {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            return validator.validate(offer, groups).stream()
                    .map(ConstraintViolation::getPropertyPath)
                    .map(Object::toString)
                    .collect(Collectors.toSet());
        }
    }

    @Test
    @DisplayName("The payload the create form sends deserialises into an Offer")
    void payloadBinds() throws Exception {
        Offer offer = bind(CREATE_REQUEST_JSON);

        assertEquals(OfferType.FULL_TIME_PERMANENT, offer.getOfferType());
        assertEquals(new BigDecimal("750000"), offer.getBaseSalary());
        assertEquals("ZAR", offer.getCurrency());
        assertEquals(90, offer.getProbationaryPeriodDays());
        assertEquals("Sandton", offer.getWorkLocation());
    }

    @Test
    @DisplayName("@Valid accepts a create request that carries no application")
    void createRequestPassesDefaultGroupValidation() throws Exception {
        Offer offer = bind(CREATE_REQUEST_JSON);

        assertEquals(Set.of(), violations(offer),
                "the handler's @Valid runs the default group; a violation here is a 400 on every "
                        + "single create, which is exactly the bug this test exists for");
    }

    @Test
    @DisplayName("A negative base salary is still refused on create")
    void negativeSalaryIsStillRefused() throws Exception {
        Offer offer = bind(CREATE_REQUEST_JSON.replace("750000", "-1"));

        assertTrue(violations(offer).contains("baseSalary"),
                "moving the application constraint out of the default group must not take the "
                        + "salary constraint with it");
    }

    @Test
    @DisplayName("A persisted offer without an application is still invalid")
    void persistedGroupStillRequiresAnApplication() throws Exception {
        Offer offer = bind(CREATE_REQUEST_JSON);

        assertTrue(violations(offer, Offer.Persisted.class).contains("application"),
                "the constraint should be scoped to the persisted group, not deleted");
    }

    @Test
    @DisplayName("A persisted offer with an application satisfies the persisted group")
    void persistedGroupAcceptsAnOfferWithAnApplication() throws Exception {
        Offer offer = bind(CREATE_REQUEST_JSON);
        Application application = new Application();
        application.setId("a7f3c2e1-0000-4000-8000-000000000001");
        offer.setApplication(application);

        assertEquals(Set.of(), violations(offer, Offer.Persisted.class));
    }

    @Test
    @DisplayName("The create handler validates the body, so the constraint groups matter")
    void createHandlerStillValidatesTheBody() throws Exception {
        String source = java.nio.file.Files.readString(java.nio.file.Path.of(
                "src/main/java/com/arthmatic/shumelahire/controller/OfferController.java"));

        java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                "@PostMapping\\(\"/applications/\\{applicationId\\}\"\\).*?public ResponseEntity<\\?> createOffer\\(([^)]*)\\)",
                java.util.regex.Pattern.DOTALL).matcher(source);
        assertTrue(m.find(), "no createOffer handler found — did the mapping change?");

        assertTrue(m.group(1).contains("@Valid"),
                "if @Valid is dropped the salary constraint stops being enforced; scope the "
                        + "constraint instead of removing the validation");
    }
}
