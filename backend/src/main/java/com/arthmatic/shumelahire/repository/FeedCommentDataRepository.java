package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.feed.FeedComment;

import java.util.List;
import java.util.Optional;

public interface FeedCommentDataRepository {
    Optional<FeedComment> findById(String id);
    FeedComment save(FeedComment entity);
    void deleteById(String id);
    List<FeedComment> findByPostId(String postId);
}
