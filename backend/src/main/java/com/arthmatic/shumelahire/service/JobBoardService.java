package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;

import java.util.List;

public interface JobBoardService {

    JobBoardPosting postToBoard(String jobPostingId, JobBoardType boardType, String boardConfig);

    JobBoardPosting removePosting(Long postingId);

    JobBoardPosting syncPosting(Long postingId);

    List<JobBoardPosting> getPostingsByJob(String jobPostingId);
}
