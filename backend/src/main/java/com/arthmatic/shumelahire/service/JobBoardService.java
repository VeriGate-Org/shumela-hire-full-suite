package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.repository.JobBoardPostingRepository;
import com.arthmatic.shumelahire.service.jobboard.JobBoardConnector;
import com.arthmatic.shumelahire.service.jobboard.JobBoardConnectorRegistry;
import com.arthmatic.shumelahire.service.jobboard.ManualJobBoardConnector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private JobBoardPostingRepository repository;

    public JobBoardPosting postToBoard(String jobPostingId, JobBoardType boardType, String boardConfig) {
        logger.info("Posting job {} to {}", jobPostingId, boardType.getDisplayName());
        JobBoardConnector connector = connectorRegistry.getConnector(boardType);
        if (connector != null) {
            return connector.post(jobPostingId, boardConfig);
        }
        logger.info("No API connector for {}; creating manual posting", boardType.getDisplayName());
        return manualConnector.post(jobPostingId, boardType, boardConfig);
    }

    public JobBoardPosting removePosting(Long postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));
        JobBoardConnector connector = connectorRegistry.getConnector(posting.getBoardType());
        if (connector != null) {
            return connector.remove(postingId);
        }
        return manualConnector.remove(postingId);
    }

    public JobBoardPosting syncPosting(Long postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new RuntimeException("Posting not found: " + postingId));
        JobBoardConnector connector = connectorRegistry.getConnector(posting.getBoardType());
        if (connector != null) {
            return connector.sync(postingId);
        }
        return manualConnector.sync(postingId);
    }

    public List<JobBoardPosting> getPostingsByJob(String jobPostingId) {
        return repository.findByJobPostingId(jobPostingId);
    }

    public List<Map<String, Object>> getAvailableBoards() {
        return connectorRegistry.getAvailableBoards();
    }
}
