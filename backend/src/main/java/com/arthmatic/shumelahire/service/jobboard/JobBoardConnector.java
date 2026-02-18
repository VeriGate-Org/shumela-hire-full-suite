package com.arthmatic.shumelahire.service.jobboard;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;

public interface JobBoardConnector {

    JobBoardType getSupportedType();

    JobBoardPosting post(String jobPostingId, String boardConfig);

    JobBoardPosting remove(Long postingId);

    JobBoardPosting sync(Long postingId);

    boolean isEnabled();
}
