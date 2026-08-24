package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.AgencyProfile;
import com.arthmatic.shumelahire.entity.AgencyStatus;
import com.arthmatic.shumelahire.repository.AgencyProfileDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Covers editing an agency in place, and removing one.
 *
 * <p>Neither operation existed. The UI's "Edit Agency" form had nowhere to send its changes, so
 * {@code handleSaveAgency} posted to {@code /api/agencies/register} whether it was registering or
 * editing — ignoring {@code editingAgency} entirely. Every edit therefore created a second agency
 * under a fresh id and left the original untouched. On the IDC demonstration tenant that produced
 * four agencies where there should have been two: three of them were successive attempts to rename
 * one record, two of which carried a typo in the name that the "edit" had been opened to fix.</p>
 *
 * <p>There was no delete either, so nothing could be undone through the product.</p>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Agency update and delete")
class AgencyUpdateAndDeleteTest {

    private static final String ID = "9c6f041d-2dda-468a-a5f2-a33645a3feae";

    @Mock
    private AgencyProfileDataRepository agencyProfileRepository;

    @InjectMocks
    private AgencyPortalService service;

    private AgencyProfile stored;

    @BeforeEach
    void setUp() {
        stored = new AgencyProfile();
        stored.setId(ID);
        stored.setAgencyName("Recruitment Agency");
        stored.setContactPerson("Arthur");
        stored.setContactEmail("arthur@agency.co.za");
        stored.setSpecializations("Engineering, IT & Software Development");
        stored.setStatus(AgencyStatus.APPROVED);
        stored.setCreatedAt(LocalDateTime.of(2026, 8, 21, 18, 27));
        stored.setBeeLevel(2);

        when(agencyProfileRepository.findById(ID)).thenReturn(Optional.of(stored));
        when(agencyProfileRepository.save(any(AgencyProfile.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    private AgencyProfile changes() {
        AgencyProfile updates = new AgencyProfile();
        updates.setAgencyName("Talent Bridge Recruitment");
        updates.setContactPerson("Nomsa Radebe");
        updates.setContactEmail("nomsa.radebe@talentbridge.co.za");
        updates.setRegistrationNumber("2019/384021/07");
        updates.setSpecializations("Finance, Investment Analysis, Executive Search");
        updates.setFeePercentage(new BigDecimal("12.5"));
        updates.setBeeLevel(1);
        return updates;
    }

    @Test
    @DisplayName("an edit updates the existing record rather than creating a second one")
    void updateMutatesInPlace() {
        service.updateAgency(ID, changes());

        ArgumentCaptor<AgencyProfile> captor = ArgumentCaptor.forClass(AgencyProfile.class);
        verify(agencyProfileRepository).save(captor.capture());
        AgencyProfile saved = captor.getValue();

        // The whole point: same id back, so this is an update and not an insert.
        assertEquals(ID, saved.getId(), "the edited record must keep its id");
        assertEquals("Talent Bridge Recruitment", saved.getAgencyName());
        assertEquals("Nomsa Radebe", saved.getContactPerson());
        assertEquals("nomsa.radebe@talentbridge.co.za", saved.getContactEmail());
        assertEquals("2019/384021/07", saved.getRegistrationNumber());
        assertEquals(new BigDecimal("12.5"), saved.getFeePercentage());
        assertEquals(1, saved.getBeeLevel());
    }

    @Test
    @DisplayName("an edit cannot change the agency's approval standing")
    void updateDoesNotTouchStatus() {
        AgencyProfile updates = changes();
        updates.setStatus(AgencyStatus.PENDING_APPROVAL);

        AgencyProfile saved = service.updateAgency(ID, updates);

        // Status belongs to approveAgency/suspendAgency, which enforce canTransitionTo. If an
        // edit could set it, the transition check could be walked around by editing a name.
        assertEquals(AgencyStatus.APPROVED, saved.getStatus(),
                "editing an agency must not re-open or alter its approval standing");
    }

    @Test
    @DisplayName("an edit preserves createdAt and stamps updatedAt")
    void updateKeepsCreatedAtAndStampsUpdatedAt() {
        AgencyProfile saved = service.updateAgency(ID, changes());

        assertEquals(LocalDateTime.of(2026, 8, 21, 18, 27), saved.getCreatedAt(),
                "createdAt is when the agency was registered, not when it was last edited");
        assertNotNull(saved.getUpdatedAt(), "an edit must record that it happened");
    }

    @Test
    @DisplayName("editing an agency that does not exist fails instead of creating one")
    void updateUnknownIdThrows() {
        when(agencyProfileRepository.findById("missing")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.updateAgency("missing", changes()));
        verify(agencyProfileRepository, never()).save(any(AgencyProfile.class));
    }

    @Test
    @DisplayName("delete removes the record by id")
    void deleteRemoves() {
        service.deleteAgency(ID);

        verify(agencyProfileRepository).deleteById(ID);
    }

    @Test
    @DisplayName("deleting an agency that does not exist fails rather than silently succeeding")
    void deleteUnknownIdThrows() {
        when(agencyProfileRepository.findById("missing")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.deleteAgency("missing"));
        verify(agencyProfileRepository, never()).deleteById(anyString());
    }
}
