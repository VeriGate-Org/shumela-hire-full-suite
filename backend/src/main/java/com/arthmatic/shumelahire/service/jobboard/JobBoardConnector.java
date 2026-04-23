package com.arthmatic.shumelahire.service.jobboard;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;

public interface JobBoardConnector {

    JobBoardType getSupportedType();

    JobBoardPosting post(String jobPostingId, String boardConfig);

    JobBoardPosting remove(String postingId);

    JobBoardPosting sync(String postingId);

    boolean isEnabled();
}
