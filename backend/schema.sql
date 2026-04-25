-- AOT Connect Database Schema
-- Run this in your PostgreSQL Query Editor

-- 1. Enable UUID extension for generating IDs (optional, can use string IDs from frontend too)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY, -- We use string IDs (e.g., 'u-123') to match frontend logic
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255), -- Store hashed passwords here
    department VARCHAR(50),
    year VARCHAR(20),
    role VARCHAR(20) DEFAULT 'STUDENT', -- 'STUDENT' or 'ADMIN'
    is_anonymous BOOLEAN DEFAULT FALSE,
    bio TEXT,
    interests TEXT[], -- Array of strings e.g. ['Coding', 'Music']
    avatar_url TEXT,
    banner_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    pronouns VARCHAR(50),
    username_last_changed BIGINT, -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb -- Stores privacy/notification settings
);

-- 3. COMMUNITIES TABLE
CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'COMMON', 'PUBLIC_DEPT', 'RESTRICTED_YEAR', 'OPEN_CLUB'
    category VARCHAR(50), -- 'ACADEMIC', 'INTEREST', 'OFFICIAL'
    icon_url TEXT,
    banner_url TEXT,
    member_count INT DEFAULT 0,
    rules TEXT[],
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. COMMUNITY MEMBERSHIP (Junction Table)
CREATE TABLE IF NOT EXISTS community_members (
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    community_id VARCHAR(255) REFERENCES communities(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, community_id)
);

-- 5. POSTS TABLE
CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(255) PRIMARY KEY,
    community_id VARCHAR(255) REFERENCES communities(id) ON DELETE CASCADE,
    author_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    post_type VARCHAR(50) DEFAULT 'DEFAULT', -- 'ANNOUNCEMENT', 'QUESTION', 'DISCUSSION'
    is_anonymous_post BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE, -- If true, shows on Home Feed
    tags TEXT[],
    attachments JSONB, -- Array of { id, type, url, name }
    poll_data JSONB, -- Object { question, options: [{id, text, votes}], totalVotes }
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. POST LIKES & DISLIKES
CREATE TABLE IF NOT EXISTS post_interactions (
    post_id VARCHAR(255) REFERENCES posts(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'LIKE', 'DISLIKE', 'BOOKMARK'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id, type)
);

-- 7. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(255) PRIMARY KEY,
    post_id VARCHAR(255) REFERENCES posts(id) ON DELETE CASCADE,
    author_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    parent_comment_id VARCHAR(255), -- If null, it's a root comment. If set, it's a reply.
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. COMMENT LIKES
CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id VARCHAR(255) REFERENCES comments(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (comment_id, user_id)
);

-- 9. CHATS (Conversations)
CREATE TABLE IF NOT EXISTS chats (
    id VARCHAR(255) PRIMARY KEY,
    initiator_id VARCHAR(255) REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
    last_message_content TEXT,
    last_message_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. CHAT PARTICIPANTS
CREATE TABLE IF NOT EXISTS chat_participants (
    chat_id VARCHAR(255) REFERENCES chats(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (chat_id, user_id)
);

-- 11. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(255) PRIMARY KEY,
    chat_id VARCHAR(255) REFERENCES chats(id) ON DELETE CASCADE,
    sender_id VARCHAR(255) REFERENCES users(id),
    content TEXT,
    attachments JSONB, -- Array of { id, type, url, name }
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. FOLLOWS (Network)
CREATE TABLE IF NOT EXISTS follows (
    follower_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    following_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE, -- Recipient
    actor_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL, -- Triggered by
    type VARCHAR(50) NOT NULL, -- 'LIKE', 'COMMENT', 'MENTION', 'DM_REQUEST', 'SYSTEM'
    content TEXT,
    target_id VARCHAR(255), -- Link to Post ID or Chat ID
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_community ON posts(community_id);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- SEED DATA: Admin User
INSERT INTO users (id, email, username, full_name, role, is_verified, bio)
VALUES (
    'u-admin', 
    'admin@aot.edu.in', 
    'admin', 
    'System Admin', 
    'ADMIN', 
    TRUE, 
    'Official System Administrator'
) ON CONFLICT (id) DO NOTHING;

-- SEED DATA: Common Community
INSERT INTO communities (id, name, description, type, category, member_count)
VALUES (
    'c-global',
    'Common Space',
    'The main hall for everyone. Global announcements and campus-wide discussions.',
    'COMMON',
    'OFFICIAL',
    0
) ON CONFLICT (id) DO NOTHING;