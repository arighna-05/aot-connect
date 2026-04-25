const express = require("express");
const router = express.Router();
const db = require("../db");

// Get user profile
router.get("/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT id, email, username, full_name, role, department, year, bio, interests, avatar_url, banner_url, is_verified FROM users WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).send("User not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error fetching profile");
  }
});

// Update profile
router.put("/:id", async (req, res) => {
  const { fullName, bio, interests, department, year, avatarUrl, pronouns } = req.body;
  try {
    const result = await db.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name), 
           bio = COALESCE($2, bio), 
           interests = COALESCE($3, interests), 
           department = COALESCE($4, department), 
           year = COALESCE($5, year),
           avatar_url = COALESCE($6, avatar_url),
           pronouns = COALESCE($7, pronouns)
       WHERE id = $8 RETURNING *`,
      [fullName, bio, interests, department, year, avatarUrl, pronouns, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error updating profile");
  }
});

// Get following/followers list
router.get("/:id/network", async (req, res) => {
  const { id } = req.params;
  try {
    const following = await db.query(
      "SELECT u.id, u.full_name, u.avatar_url FROM users u JOIN follows f ON u.id = f.following_id WHERE f.follower_id = $1",
      [id]
    );
    const followers = await db.query(
      "SELECT u.id, u.full_name, u.avatar_url FROM users u JOIN follows f ON u.id = f.follower_id WHERE f.following_id = $1",
      [id]
    );
    res.json({ following: following.rows, followers: followers.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error fetching network");
  }
});

// Follow/Unfollow toggle
router.post("/:id/follow", async (req, res) => {
  const { id } = req.params; // Target user to follow
  const { userId } = req.body; // Current user
  try {
    const exists = await db.query(
      "SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2",
      [userId, id]
    );
    if (exists.rows.length > 0) {
      await db.query("DELETE FROM follows WHERE follower_id = $1 AND following_id = $2", [userId, id]);
      res.send("Unfollowed");
    } else {
      await db.query("INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)", [userId, id]);
      res.send("Followed");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error toggling follow");
  }
});

module.exports = router;

