package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.feed.FeedPost;

import java.util.List;
import java.util.Optional;

public interface FeedPostDataRepository {
    Optional<FeedPost> findById(String id);
    FeedPost save(FeedPost entity);
    void deleteById(String id);
    List<FeedPost> findByCategory(String category, int page, int size);
    List<FeedPost> findAll(int page, int size);
    List<FeedPost> findPinned();
    long count();
}
