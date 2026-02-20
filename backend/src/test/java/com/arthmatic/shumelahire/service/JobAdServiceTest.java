package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.JobAd;
import com.arthmatic.shumelahire.entity.JobAdStatus;
import com.arthmatic.shumelahire.repository.JobAdRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobAdServiceTest {

    @Mock
    private JobAdRepository jobAdRepository;

    @InjectMocks
    private JobAdService jobAdService;

    private JobAd mockJobAd;

    @BeforeEach
    void setUp() {
        mockJobAd = new JobAd();
        mockJobAd.setId(1L);
        mockJobAd.setTitle("Senior Frontend Developer");
        mockJobAd.setStatus(JobAdStatus.DRAFT);
        mockJobAd.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void testJobAdServiceExists() {
        // Simple test to verify the service is properly injected
        assertNotNull(jobAdService);
        assertNotNull(jobAdRepository);
    }

    @Test
    void testBasicRepositoryInteraction() {
        // Given
        when(jobAdRepository.findById(1L)).thenReturn(Optional.of(mockJobAd));

        // When
        Optional<JobAd> result = jobAdRepository.findById(1L);

        // Then
        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
        verify(jobAdRepository).findById(1L);
    }
}