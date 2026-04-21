package com.arthmatic.shumelahire.controller.feed;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.entity.feed.FeedComment;
import com.arthmatic.shumelahire.entity.feed.FeedPost;
import com.arthmatic.shumelahire.entity.feed.FeedReaction;
import com.arthmatic.shumelahire.repository.FeedPostDataRepository;
import com.arthmatic.shumelahire.repository.FeedCommentDataRepository;
import com.arthmatic.shumelahire.repository.FeedReactionDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feed")
@FeatureGate("SOCIAL_FEED")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER','EMPLOYEE')")
public class FeedController {

    private static final Logger logger = LoggerFactory.getLogger(FeedController.class);

    @Autowired
    private FeedPostDataRepository postRepository;

    @Autowired
    private FeedCommentDataRepository commentRepository;

    @Autowired
    private FeedReactionDataRepository reactionRepository;

    // ---- Posts ----

    @GetMapping
    public ResponseEntity<?> getFeed(@RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size,
                                     @RequestParam(required = false) String category) {
        List<FeedPost> posts;
        if (category != null && !category.isEmpty()) {
            posts = postRepository.findByCategory(category, page, size);
        } else {
            posts = postRepository.findAll(page, size);
        }
        // Enrich with comments and reactions
        for (FeedPost post : posts) {
            List<FeedComment> comments = commentRepository.findByPostId(String.valueOf(post.getId()));
            List<FeedReaction> reactions = reactionRepository.findByPostId(String.valueOf(post.getId()));
            post.setComments(comments);
            post.setReactions(reactions);
            post.setCommentCount(comments.size());
            post.setReactionCount(reactions.size());
        }
        return ResponseEntity.ok(Map.of(
                "content", posts,
                "totalElements", postRepository.count(),
                "page", page,
                "size", size
        ));
    }

    @GetMapping("/pinned")
    public ResponseEntity<?> getPinnedPosts() {
        return ResponseEntity.ok(postRepository.findPinned());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPost(@PathVariable Long id) {
        return postRepository.findById(String.valueOf(id))
                .map(post -> {
                    post.setComments(commentRepository.findByPostId(String.valueOf(id)));
                    post.setReactions(reactionRepository.findByPostId(String.valueOf(id)));
                    post.setCommentCount(post.getComments().size());
                    post.setReactionCount(post.getReactions().size());
                    return ResponseEntity.ok((Object) post);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody FeedPost post) {
        try {
            FeedPost saved = postRepository.save(post);
            logger.info("Created feed post '{}' by author {}", saved.getTitle(), saved.getAuthorId());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id,
                                        @RequestBody FeedPost request) {
        try {
            FeedPost post = postRepository.findById(String.valueOf(id))
                    .orElseThrow(() -> new IllegalArgumentException("Post not found: " + id));
            if (request.getTitle() != null) post.setTitle(request.getTitle());
            if (request.getContent() != null) post.setContent(request.getContent());
            if (request.getCategory() != null) post.setCategory(request.getCategory());
            if (request.getPinned() != null) post.setPinned(request.getPinned());
            if (request.getStatus() != null) post.setStatus(request.getStatus());
            post.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(postRepository.save(post));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        postRepository.deleteById(String.valueOf(id));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/pin")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> togglePin(@PathVariable Long id) {
        return postRepository.findById(String.valueOf(id))
                .map(post -> {
                    post.setPinned(!post.getPinned());
                    post.setUpdatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(postRepository.save(post));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ---- Comments ----

    @GetMapping("/{postId}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long postId) {
        return ResponseEntity.ok(commentRepository.findByPostId(String.valueOf(postId)));
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long postId,
                                        @RequestBody FeedComment comment) {
        try {
            comment.setPostId(postId);
            FeedComment saved = commentRepository.save(comment);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long postId,
                                           @PathVariable Long commentId) {
        commentRepository.deleteById(String.valueOf(commentId));
        return ResponseEntity.noContent().build();
    }

    // ---- Reactions ----

    @PostMapping("/{postId}/reactions")
    public ResponseEntity<?> toggleReaction(@PathVariable Long postId,
                                            @RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String reactionType = (String) request.get("reactionType");

            var existing = reactionRepository.findByPostIdAndUserId(
                    String.valueOf(postId), String.valueOf(userId));

            if (existing.isPresent()) {
                reactionRepository.deleteById(String.valueOf(existing.get().getId()));
                return ResponseEntity.ok(Map.of("action", "removed"));
            }

            FeedReaction reaction = new FeedReaction();
            reaction.setPostId(postId);
            reaction.setUserId(userId);
            reaction.setReactionType(FeedReaction.ReactionType.valueOf(reactionType));
            FeedReaction saved = reactionRepository.save(reaction);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
