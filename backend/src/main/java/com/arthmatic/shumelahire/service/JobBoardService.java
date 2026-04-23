package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.repository.JobBoardPostingDataRepository;
import com.arthmatic.shumelahire.service.jobboard.JobBoardConnector;
import com.arthmatic.shumelahire.service.jobboard.JobBoardConnectorRegistry;
import com.arthmatic.shumelahire.service.jobboard.ManualJobBoardConnector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.arthmatic.shumelahire.dto.BatchPostRequest;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class JobBoardService {

    private static final Logger logger = LoggerFactory.getLogger(JobBoardService.class);

    @Autowired
    private JobBoardConnectorRegistry connectorRegistry;

    @Autowired
    private ManualJobBoardConnector manualConnector;

    @Autowired
    private JobBoardPostingDataRepository repository;

    public JobBoardPosting postToBoard(String jobPostingId, JobBoardType boardType, String boardConfig) {
        logger.info("Posting job {} to {}", jobPostingId, boardType.getDisplayName());
        JobBoardConnector connector = connectorRegistry.getConnector(boardType);
        if (connector != null) {
            return connector.post(jobPostingId, boardConfig);
        }
        logger.info("No API connector for {}; creating manual posting", boardType.getDisplayName());
        return manualConnector.post(jobPostingId, boardType, boardConfig);
    }

    public JobBoardPosting removePosting(String postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));
        JobBoardConnector connector = connectorRegistry.getConnector(posting.getBoardType());
        if (connector != null) {
            return connector.remove(postingId);
        }
        return manualConnector.remove(postingId);
    }

    public JobBoardPosting syncPosting(String postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));
        JobBoardConnector connector = connectorRegistry.getConnector(posting.getBoardType());
        if (connector != null) {
            return connector.sync(postingId);
        }
        return manualConnector.sync(postingId);
    }

    public List<Map<String, Object>> postToMultipleBoards(String jobPostingId, List<BatchPostRequest.BoardSelection> boards) {
        logger.info("Batch posting job {} to {} boards", jobPostingId, boards.size());
        List<Map<String, Object>> results = new ArrayList<>();

        for (BatchPostRequest.BoardSelection board : boards) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("boardType", board.getBoardType().name());
            result.put("boardDisplayName", board.getBoardType().getDisplayName());
            try {
                JobBoardPosting posting = postToBoard(jobPostingId, board.getBoardType(), board.getBoardConfig());
                result.put("success", true);
                result.put("posting", posting);
            } catch (Exception e) {
                logger.error("Failed to post to {}: {}", board.getBoardType().getDisplayName(), e.getMessage());
                result.put("success", false);
                result.put("error", e.getMessage());
            }
            results.add(result);
        }

        return results;
    }

    public List<JobBoardPosting> getPostingsByJob(String jobPostingId) {
        return repository.findByJobPostingId(jobPostingId);
    }

    public List<Map<String, Object>> getAvailableBoards() {
        return connectorRegistry.getAvailableBoards();
    }
}
