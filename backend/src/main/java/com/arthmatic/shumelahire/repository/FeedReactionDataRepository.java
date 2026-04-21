package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.feed.FeedReaction;

import java.util.List;
import java.util.Optional;

public interface FeedReactionDataRepository {
    Optional<FeedReaction> findById(String id);
    FeedReaction save(FeedReaction entity);
    void deleteById(String id);
    List<FeedReaction> findByPostId(String postId);
    Optional<FeedReaction> findByPostIdAndUserId(String postId, String userId);
}
