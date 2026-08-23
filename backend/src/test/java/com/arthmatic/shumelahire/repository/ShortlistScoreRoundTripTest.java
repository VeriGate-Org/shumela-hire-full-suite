package com.arthmatic.shumelahire.repository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Guards a load-then-save cycle that destroyed data.
 *
 * <p>{@code DynamoShortlistScoreRepository.toItem} derives both {@code applicationId} and
 * {@code jobPostingId} from {@code entity.getApplication()}. {@code toEntity} did not set that
 * association at all. So reading a score and writing it back wrote both ids away — and
 * {@code autoShortlist} saves <em>every</em> score it examines, not only the ones it selects, so a
 * single run silently orphaned every score row for that vacancy. Six rows on the IDC tenant were
 * lost this way.</p>
 *
 * <p>The same null also made {@code autoShortlist} throw: it reads
 * {@code score.getApplication().getStatus()} to decide whether to advance a candidate. That stayed
 * invisible for as long as scoring was broken enough that nobody crossed the threshold — the NPE
 * appeared the same hour the scoring bug was fixed, because that was the first time anything
 * qualified.</p>
 *
 * <p>Fourth occurrence of this shape in this repository, and the second destructive one after
 * {@code DynamoOfferRepository}. A mapper that reads a field off an association must be paired with
 * a mapper that rebuilds it, or persistence quietly becomes deletion.</p>
 */
class ShortlistScoreRoundTripTest {

    private static final Path REPO = Path.of(
            "src/main/java/com/arthmatic/shumelahire/repository/dynamo/DynamoShortlistScoreRepository.java");
    private static final Path SERVICE =
            Path.of("src/main/java/com/arthmatic/shumelahire/service/ShortlistingService.java");

    @Test
    @DisplayName("toEntity rebuilds the application association it will later be asked to serialise")
    void roundTripPreservesTheAssociation() throws IOException {
        String s = Files.readString(REPO);

        int toEntity = s.indexOf("protected ShortlistScore toEntity");
        int toItem = s.indexOf("protected ShortlistScoreItem toItem");
        assertTrue(toEntity > 0 && toItem > toEntity, "mapper layout changed — revisit this guard");

        String body = s.substring(toEntity, toItem);
        assertTrue(body.contains("entity.setApplication("),
                "toEntity must rebuild the association: toItem derives applicationId and "
                        + "jobPostingId from it, so leaving it null turns every save into a delete");
        assertTrue(body.contains("item.getApplicationId()"),
                "the rebuilt association must carry the id that was actually stored");
    }

    @Test
    @DisplayName("autoShortlist resolves a real application before reading or changing its status")
    void autoShortlistDoesNotTrustTheStub() throws IOException {
        String s = Files.readString(SERVICE);

        assertTrue(s.contains("applicationRepository.findById(score.getApplication().getId())"),
                "the association is a stub — its status is null, which is neither SUBMITTED nor an "
                        + "error, so every candidate would silently fail to advance");

        // The status change has to be persisted. Previously the loop mutated the stub and saved
        // only the ShortlistScore, so the advance existed for the length of one iteration.
        assertTrue(s.contains("applicationRepository.save(application)"),
                "advancing a candidate must persist the application, not just the score");
    }
}
