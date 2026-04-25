const express = require("express");
const router = express.Router();
const db = require("../db");

// Get posts (with optional community filter)
router.get("/", async (req, res) => {
  const { communityId } = req.query;
  try {
    let query = `
      SELECT p.*, u.full_name as author_name, u.avatar_url as author_avatar, c.name as community_name
      FROM posts p
      JOIN users u ON p.author_id = u.id
      JOIN communities c ON p.community_id = c.id
    `;
    const params = [];
    if (communityId) {
      query += " WHERE p.community_id = $1";
      params.push(communityId);
    }
    query += " ORDER BY p.created_at DESC";
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error fetching posts");
  }
});

// Create a post
router.post("/", async (req, res) => {
  const { id, communityId, authorId, title, content, postType, isAnonymousPost, tags } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO posts (id, community_id, author_id, title, content, post_type, is_anonymous_post, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id || `p-${Date.now()}`, communityId, authorId, title, content, postType || 'DEFAULT', isAnonymousPost || false, tags || []]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error creating post");
  }
});

// Interaction (Like/Dislike/Bookmark)
router.post("/:id/interact", async (req, res) => {
  const { id } = req.params;
  const { userId, type } = req.body; // type: 'LIKE', 'DISLIKE', 'BOOKMARK'
  try {
    if (type === 'UNLIKE' || type === 'UNDISLIKE' || type === 'UNBOOKMARK') {
        const actualType = type.substring(2);
        await db.query(
            "DELETE FROM post_interactions WHERE post_id = $1 AND user_id = $2 AND type = $3",
            [id, userId, actualType]
        );
    } else {
        await db.query(
          "INSERT INTO post_interactions (post_id, user_id, type) VALUES ($1, $2, $3) ON CONFLICT (post_id, user_id, type) DO NOTHING",
          [id, userId, type]
        );
    }
    res.send("Interaction updated");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error updating interaction");
  }
});

// Comments
router.get("/:id/comments", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT c.*, u.full_name as author_name, u.avatar_url as author_avatar, u.is_anonymous as author_is_anonymous
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error fetching comments");
  }
});

router.post("/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { authorId, content, parentCommentId } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO comments (id, post_id, author_id, content, parent_comment_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [`cm-${Date.now()}`, id, authorId, content, parentCommentId || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error adding comment");
  }
});

module.exports = router;

