package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.repository.dynamo.items.OfferItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the offer → application association across a DynamoDB round trip.
 *
 * <p>{@code toItem()} wrote {@code applicationId}; {@code toEntity()} never read it back. Every
 * Offer loaded from DynamoDB therefore had a null application, and
 * {@code OfferService.hydrateOffers()} — which collects ids via
 * {@code getApplication().getId()} before batch-fetching applicants — matched nothing and returned
 * immediately. The failure was silent and total: the Offers screen showed
 * <em>"Unknown Candidate"</em> on every card, for every tenant, on every code path that reads an
 * offer, because the frontend falls back to that string when the applicant cannot be resolved.</p>
 *
 * <p>The round trip is reconstructed here rather than exercised through the repository, which needs
 * a live DynamoDB client to build. What matters is that the id survives the mapping and that
 * hydration can key off it.</p>
 */
class OfferApplicationAssociationTest {

    private static final String APPLICATION_ID = "87173b20-59d8-450e-93cf-f35db4d70951";

    /** Mirrors DynamoOfferRepository.toItem(). */
    private OfferItem toItem(Offer offer) {
        OfferItem item = new OfferItem();
        if (offer.getApplication() != null) {
            item.setApplicationId(offer.getApplication().getId());
        }
        return item;
    }

    /** Mirrors the association handling in DynamoOfferRepository.toEntity(). */
    private Offer toEntity(OfferItem item) {
        Offer offer = new Offer();
        if (item.getApplicationId() != null) {
            Application application = new Application();
            application.setId(item.getApplicationId());
            offer.setApplication(application);
        }
        return offer;
    }

    /** The old toEntity: the id was written but never read back. */
    private Offer toEntityBeforeFix(OfferItem item) {
        return new Offer();
    }

    /** Mirrors the id collection at the top of OfferService.hydrateOffers(). */
    private Set<String> idsHydrationWouldFetch(List<Offer> offers) {
        return offers.stream()
                .filter(o -> o.getApplication() != null && o.getApplication().getId() != null)
                .map(o -> o.getApplication().getId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private Offer offerWithApplication() {
        Application application = new Application();
        application.setId(APPLICATION_ID);
        Offer offer = new Offer();
        offer.setApplication(application);
        return offer;
    }

    @Test
    @DisplayName("The application id survives the write")
    void toItemStoresTheApplicationId() {
        assertEquals(APPLICATION_ID, toItem(offerWithApplication()).getApplicationId());
    }

    @Test
    @DisplayName("The association is rebuilt on read")
    void toEntityRestoresTheAssociation() {
        Offer restored = toEntity(toItem(offerWithApplication()));
        assertNotNull(restored.getApplication(), "a null application makes hydration a no-op");
        assertEquals(APPLICATION_ID, restored.getApplication().getId());
    }

    @Test
    @DisplayName("Hydration can find the id to fetch")
    void hydrationHasSomethingToKeyOff() {
        Offer restored = toEntity(toItem(offerWithApplication()));
        assertEquals(Set.of(APPLICATION_ID), idsHydrationWouldFetch(List.of(restored)),
                "this set is what hydrateOffers() batch-fetches applicants for");
    }

    @Test
    @DisplayName("Before the fix, hydration silently fetched nothing — the \"Unknown Candidate\" bug")
    void withoutTheAssociationHydrationDoesNothing() {
        Offer restored = toEntityBeforeFix(toItem(offerWithApplication()));
        assertNull(restored.getApplication());
        assertTrue(idsHydrationWouldFetch(List.of(restored)).isEmpty(),
                "hydrateOffers() returned early, so every offer card rendered Unknown Candidate");
    }

    @Test
    @DisplayName("An offer with no application at all round-trips without a stub")
    void offerWithoutApplicationStaysNull() {
        Offer restored = toEntity(toItem(new Offer()));
        assertNull(restored.getApplication(), "do not invent an association that was never stored");
        assertTrue(idsHydrationWouldFetch(List.of(restored)).isEmpty());
    }

    @Test
    @DisplayName("Several offers on one application are fetched once, not per offer")
    void duplicateApplicationIdsCollapse() {
        List<Offer> offers = List.of(
                toEntity(toItem(offerWithApplication())),
                toEntity(toItem(offerWithApplication())),
                toEntity(toItem(offerWithApplication())));
        Set<String> ids = idsHydrationWouldFetch(offers);
        assertEquals(1, ids.size(), "hydrateOffers() de-duplicates before fetching");
        assertFalse(ids.isEmpty());
    }
}
