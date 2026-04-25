const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all communities
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM communities ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error fetching communities");
  }
});

// Join a community
router.post("/join", async (req, res) => {
  const { userId, communityId } = req.body;
  try {
    const exists = await db.query("SELECT 1 FROM community_members WHERE user_id = $1 AND community_id = $2", [userId, communityId]);
    if (exists.rows.length === 0) {
        await db.query(
          "INSERT INTO community_members (user_id, community_id) VALUES ($1, $2)",
          [userId, communityId]
        );
        // Increment member count
        await db.query("UPDATE communities SET member_count = member_count + 1 WHERE id = $1", [communityId]);
    }
    res.send("Joined successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error joining community");
  }
});

// Leave a community
router.post("/leave", async (req, res) => {
    const { userId, communityId } = req.body;
    try {
        const result = await db.query("DELETE FROM community_members WHERE user_id = $1 AND community_id = $2", [userId, communityId]);
        if (result.rowCount > 0) {
            await db.query("UPDATE communities SET member_count = GREATEST(0, member_count - 1) WHERE id = $1", [communityId]);
        }
        res.send("Left successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error leaving community");
    }
});


module.exports = router;
