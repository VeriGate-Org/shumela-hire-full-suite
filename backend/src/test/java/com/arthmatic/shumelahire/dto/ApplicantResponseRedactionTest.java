package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Applicant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * What actually leaves the building.
 *
 * <p>{@code DemographicsAccessTest} pins who may see these fields; this pins that a withheld
 * response genuinely does not carry them. The two are separate on purpose — a correct rule feeding
 * a DTO that serialises the values anyway would still be a leak.
 */
class ApplicantResponseRedactionTest {

    private static Applicant applicant() {
        Applicant applicant = new Applicant();
        applicant.setId("a1");
        applicant.setName("Thabo");
        applicant.setSurname("Nkosi");
        applicant.setEmail("t.nkosi@example.com");
        applicant.setIdPassportNumber("8405205717088");
        applicant.setGender("Male");
        applicant.setRace("African");
        applicant.setDisabilityStatus("None");
        applicant.setCitizenshipStatus("South African");
        applicant.setDemographicsConsent(true);
        return applicant;
    }

    @Test
    @DisplayName("A withheld response carries none of the four fields")
    void redactedResponseOmitsEverySensitiveField() {
        var response = ApplicantResponse.fromEntity(applicant(), false);

        assertNull(response.getRace());
        assertNull(response.getGender());
        assertNull(response.getDisabilityStatus());
        assertNull(response.getCitizenshipStatus());
    }

    @Test
    @DisplayName("Redaction is the default, so a call site that forgets withholds rather than leaks")
    void defaultIsRedacted() {
        // The single-argument constructor is what every existing call site uses.
        var response = new ApplicantResponse(applicant());

        assertNull(response.getRace());
        assertTrue(response.isDemographicsRedacted());
    }

    @Test
    @DisplayName("A disclosed response carries them")
    void disclosedResponseCarriesThem() {
        var response = ApplicantResponse.fromEntity(applicant(), true);

        assertEquals("African", response.getRace());
        assertEquals("Male", response.getGender());
        assertFalse(response.isDemographicsRedacted());
    }

    @Test
    @DisplayName("Withheld is distinguishable from never captured")
    void redactionIsDeclared() {
        // Without the flag a redacted record looks identical to an applicant who declined to
        // answer, and a report built on the difference would be wrong invisibly.
        Applicant neverAnswered = applicant();
        neverAnswered.setRace(null);
        neverAnswered.setGender(null);

        var disclosed = ApplicantResponse.fromEntity(neverAnswered, true);
        var withheld = ApplicantResponse.fromEntity(applicant(), false);

        assertNull(disclosed.getRace());
        assertNull(withheld.getRace());
        assertFalse(disclosed.isDemographicsRedacted());
        assertTrue(withheld.isDemographicsRedacted());
    }

    @Test
    @DisplayName("The consent flag is always sent — whether they answered is not itself sensitive")
    void consentFlagSurvivesRedaction() {
        // HR needs to know whether an applicant answered; that is a different question from what
        // they answered, and only the second is withheld.
        assertTrue(ApplicantResponse.fromEntity(applicant(), false).getDemographicsConsent());
    }

    @Test
    @DisplayName("Redaction does not disturb the identity fields, including the existing ID mask")
    void nonSensitiveFieldsAreUnaffected() {
        var response = ApplicantResponse.fromEntity(applicant(), false);

        assertEquals("Thabo", response.getName());
        assertEquals("t.nkosi@example.com", response.getEmail());
        assertEquals("*********7088", response.getIdPassportNumber());
    }
}
