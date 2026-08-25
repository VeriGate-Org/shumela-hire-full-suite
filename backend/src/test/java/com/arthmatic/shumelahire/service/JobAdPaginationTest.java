package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.dto.JobAdResponse;
import com.arthmatic.shumelahire.entity.JobAd;
import com.arthmatic.shumelahire.entity.JobAdStatus;
import com.arthmatic.shumelahire.repository.JobAdDataRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Paging on the two job-ad list endpoints.
 *
 * <p><b>Neither endpoint paged.</b> Both built {@code new PageImpl<>(content, pageable,
 * content.size())} over a cursor-addressed repository, passing {@code null} as the cursor — so the
 * page number the caller asked for was discarded and every page returned the first rows again. The
 * candidate-facing job list at {@code /api/ads} sends {@code page=N} and a candidate clicking
 * "next" was served page one each time.
 *
 * <p>The total was wrong in the same breath: reporting the current page's length as the size of the
 * whole result set collapses {@code totalPages} to 1, which is also why nothing looked broken —
 * a one-page result set has no second page to be wrong about.
 *
 * <p>These two faults share a cause and are fixed together, so they are pinned together.
 */
@ExtendWith(MockitoExtension.class)
class JobAdPaginationTest {

    @Mock
    private JobAdDataRepository jobAdRepository;

    @InjectMocks
    private JobAdService jobAdService;

    @Captor
    private ArgumentCaptor<Integer> pageCaptor;

    private List<JobAd> onePageOfAds;

    @BeforeEach
    void setUp() {
        // A full page of 20. The fixture has to be internally consistent, because PageImpl quietly
        // rewrites a total that contradicts the page it was handed: when
        // offset + pageSize > total it replaces the total with offset + content.size(). Handing it
        // 2 rows on a page-size of 20 and claiming 57 elements therefore reports 42, and the
        // resulting failure looks like the code discarding the total when it is Spring rejecting
        // an impossible one.
        onePageOfAds = java.util.stream.IntStream.rangeClosed(1, 20)
                .mapToObj(i -> ad(String.valueOf(i), "Job " + i))
                .toList();
    }

    private JobAd ad(String id, String title) {
        JobAd jobAd = new JobAd();
        jobAd.setId(id);
        jobAd.setTitle(title);
        jobAd.setStatus(JobAdStatus.PUBLISHED);
        jobAd.setCreatedAt(LocalDateTime.now());
        return jobAd;
    }

    /** A full page of 20 drawn from a set of 57 — the shape that exposes both faults at once. */
    private CursorPage<JobAd> pageOf57() {
        return new CursorPage<>(onePageOfAds, "40", true, onePageOfAds.size(), 57L);
    }

    @Test
    @DisplayName("Asking for page 3 of the search asks the repository for page 3")
    void searchPassesThePageNumberThrough() {
        when(jobAdRepository.findWithFilters(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(pageOf57());

        jobAdService.searchJobAds(null, null, null, PageRequest.of(3, 20));

        verify(jobAdRepository).findWithFilters(any(), any(), any(), any(), pageCaptor.capture(), eq(20));
        // Previously this argument did not exist: the service passed a null cursor, so the
        // repository always started from row zero regardless of the page requested.
        assertEquals(3, pageCaptor.getValue());
    }

    @Test
    @DisplayName("Asking for page 3 of the internal list asks the repository for page 3")
    void internalListPassesThePageNumberThrough() {
        when(jobAdRepository.findActiveInternalAdsPaged(any(LocalDate.class), anyInt(), anyInt()))
                .thenReturn(pageOf57());

        jobAdService.getPublishedInternalAds(PageRequest.of(3, 20));

        verify(jobAdRepository).findActiveInternalAdsPaged(any(LocalDate.class), pageCaptor.capture(), eq(20));
        assertEquals(3, pageCaptor.getValue());
    }

    @Test
    @DisplayName("The total is the whole result set, not the length of the page in hand")
    void totalIsTheWholeSet() {
        when(jobAdRepository.findWithFilters(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(pageOf57());

        Page<JobAdResponse> page = jobAdService.searchJobAds(null, null, null, PageRequest.of(1, 20));

        assertEquals(57, page.getTotalElements());
        // The consequence that mattered: reporting the page as the whole set made totalPages 1, so
        // there was never a "next page" to offer and the remaining 37 ads were unreachable.
        assertEquals(3, page.getTotalPages());
        assertEquals(20, page.getContent().size());
    }

    @Test
    @DisplayName("A repository that does not count gives a total that still exceeds the pages behind it")
    void uncountedTotalDoesNotUnderstateWhatHasAlreadyBeenSeen() {
        // No implementation returns a null total today. If one ever does, the fallback must not
        // report a number smaller than the rows the caller has already paged past — that would
        // place the reader beyond the end of a set they are demonstrably inside.
        when(jobAdRepository.findWithFilters(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(new CursorPage<>(onePageOfAds, null, false, onePageOfAds.size(), null));

        Pageable thirdPage = PageRequest.of(2, 20);
        Page<JobAdResponse> page = jobAdService.searchJobAds(null, null, null, thirdPage);

        // 40 rows already paged past, plus the 20 in hand. Never fewer than what has been seen.
        assertEquals(60, page.getTotalElements());
    }
}
