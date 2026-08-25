package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.AgencyProfile;
import com.arthmatic.shumelahire.entity.AgencyStatus;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.AgencyProfileDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Suspending agencies whose contract has ended.
 *
 * <p><b>Nothing acted on {@code contractEndDate}.</b> An agency could be suspended by hand, and
 * {@code AgencyResponse} computed a {@code LAPSED} contract state for display, but a lapsed agency
 * kept its portal login and went on submitting candidates — the expiry was a label on a screen, not
 * a change in what the agency could do. Job ads have had a nightly expiry job all along.
 *
 * <p>The cases that matter here are the ones where an over-eager job would do damage: a null end
 * date is not an expiry, and a contract ending today has not ended yet.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Agency contract expiry")
class AgencyContractExpiryTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 8, 25);

    @Mock
    private AgencyProfileDataRepository agencyProfileRepository;

    @Mock
    private UserDataRepository userRepository;

    @InjectMocks
    private AgencyPortalService service;

    private List<AgencyProfile> approved;

    @BeforeEach
    void setUp() {
        approved = new ArrayList<>();
        when(agencyProfileRepository.findByStatus(AgencyStatus.APPROVED)).thenReturn(approved);
        when(agencyProfileRepository.save(any(AgencyProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
    }

    private AgencyProfile agency(String id, LocalDate contractEnd) {
        AgencyProfile agency = new AgencyProfile();
        agency.setId(id);
        agency.setAgencyName("Agency " + id);
        agency.setContactEmail(id + "@example.com");
        agency.setStatus(AgencyStatus.APPROVED);
        agency.setContractEndDate(contractEnd);
        approved.add(agency);
        when(agencyProfileRepository.findById(id)).thenReturn(Optional.of(agency));
        return agency;
    }

    @Test
    @DisplayName("An agency whose contract ended yesterday is suspended")
    void lapsedContractIsSuspended() {
        AgencyProfile lapsed = agency("a1", TODAY.minusDays(1));

        assertEquals(1, service.suspendExpiredContracts(TODAY));
        assertEquals(AgencyStatus.SUSPENDED, lapsed.getStatus());
    }

    @Test
    @DisplayName("A contract ending today is still running today")
    void endDateIsInclusive() {
        // Off by one here means cutting an agency off on the last day it is entitled to work.
        AgencyProfile endingToday = agency("a2", TODAY);

        assertEquals(0, service.suspendExpiredContracts(TODAY));
        assertEquals(AgencyStatus.APPROVED, endingToday.getStatus());
    }

    @Test
    @DisplayName("An agency with no recorded end date is never suspended")
    void nullEndDateIsNotAnExpiry() {
        // Most profiles carry no contract end date. Reading "not recorded" as "ended" would suspend
        // the entire agency base on the first run, which is the worst thing this job could do.
        AgencyProfile undated = agency("a3", null);

        assertEquals(0, service.suspendExpiredContracts(TODAY));
        assertEquals(AgencyStatus.APPROVED, undated.getStatus());
    }

    @Test
    @DisplayName("The agency's login is disabled, not just its status changed")
    void suspensionDisablesTheContactAccount() {
        // A status of SUSPENDED with a working login is worse than no expiry at all, because it
        // looks handled. Suspension goes through the same path a person uses.
        agency("a4", TODAY.minusMonths(2));
        User contact = new User();
        contact.setEmail("a4@example.com");
        contact.setEnabled(true);
        when(userRepository.findByEmail("a4@example.com")).thenReturn(Optional.of(contact));

        service.suspendExpiredContracts(TODAY);

        assertFalse(contact.isEnabled());
        verify(userRepository).save(contact);
    }

    @Test
    @DisplayName("Running twice suspends nothing the second time")
    void isIdempotent() {
        // The second run reads APPROVED agencies; a suspended one is no longer among them.
        agency("a5", TODAY.minusDays(30));

        assertEquals(1, service.suspendExpiredContracts(TODAY));
        approved.removeIf(a -> a.getStatus() != AgencyStatus.APPROVED);
        assertEquals(0, service.suspendExpiredContracts(TODAY));
    }

    @Test
    @DisplayName("One unsuspendable agency does not stop the others")
    void oneFailureDoesNotAbortTheRun() {
        // A lapsed contract stays lapsed. Letting one bad record abort the loop would leave every
        // agency after it running on an expired contract until somebody noticed.
        agency("bad", TODAY.minusDays(5));
        AgencyProfile good = agency("good", TODAY.minusDays(5));
        when(agencyProfileRepository.findById("bad"))
                .thenThrow(new IllegalStateException("unreadable record"));

        assertEquals(1, service.suspendExpiredContracts(TODAY));
        assertEquals(AgencyStatus.SUSPENDED, good.getStatus());
    }

    @Test
    @DisplayName("Agencies still awaiting approval are left alone")
    void pendingAgenciesAreNotTouched() {
        // PENDING_APPROVAL cannot transition to SUSPENDED, and an expiry date on an unapproved
        // agency is a data problem for a person, not something to resolve silently overnight.
        AgencyProfile pending = new AgencyProfile();
        pending.setId("p1");
        pending.setStatus(AgencyStatus.PENDING_APPROVAL);
        pending.setContractEndDate(TODAY.minusYears(1));
        // Deliberately not added to the APPROVED list — this asserts the query, not the filter.

        assertEquals(0, service.suspendExpiredContracts(TODAY));
        verify(agencyProfileRepository, never()).save(pending);
    }
}
