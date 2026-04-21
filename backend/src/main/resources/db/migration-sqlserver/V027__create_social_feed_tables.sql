-- V027: Social collaboration feed
CREATE TABLE feed_posts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id NVARCHAR(100) NOT NULL,
    author_id BIGINT NOT NULL,
    title NVARCHAR(255),
    content NVARCHAR(4000) NOT NULL,
    category NVARCHAR(50) DEFAULT 'DISCUSSION',
    pinned BIT DEFAULT 0,
    published_at DATETIME2 DEFAULT GETDATE(),
    status NVARCHAR(50) DEFAULT 'PUBLISHED',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE feed_comments (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id NVARCHAR(100) NOT NULL,
    post_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    content NVARCHAR(2000) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES feed_posts(id)
);

CREATE TABLE feed_reactions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id NVARCHAR(100) NOT NULL,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    reaction_type NVARCHAR(50) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_reaction_post FOREIGN KEY (post_id) REFERENCES feed_posts(id),
    CONSTRAINT uq_feed_reaction UNIQUE (post_id, user_id)
);

CREATE INDEX idx_feed_posts_tenant ON feed_posts(tenant_id, published_at DESC);
CREATE INDEX idx_feed_comments_post ON feed_comments(post_id);
CREATE INDEX idx_feed_reactions_post ON feed_reactions(post_id);
