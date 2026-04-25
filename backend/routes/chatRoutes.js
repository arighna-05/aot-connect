const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all chats for a user
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.query(
      `SELECT c.*, 
       (SELECT json_agg(user_id) FROM chat_participants WHERE chat_id = c.id) as participant_ids
       FROM chats c
       JOIN chat_participants cp ON c.id = cp.chat_id
       WHERE cp.user_id = $1
       ORDER BY c.updated_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Get messages for a specific chat
router.get("/:chatId/messages", async (req, res) => {
  const { chatId } = req.params;
  try {
    const result = await db.query(
      "SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC",
      [chatId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Create or get a chat between two users
router.post("/", async (req, res) => {
  const { user1Id, user2Id } = req.body;
  try {
    // Check if chat already exists
    const existingChat = await db.query(
      `SELECT chat_id FROM chat_participants 
       WHERE user_id IN ($1, $2)
       GROUP BY chat_id
       HAVING COUNT(user_id) = 2`,
      [user1Id, user2Id]
    );

    if (existingChat.rows.length > 0) {
      return res.json({ chatId: existingChat.rows[0].chat_id });
    }

    // Create new chat
    const chatId = `chat-${Date.now()}`;
    await db.query(
      "INSERT INTO chats (id, initiator_id, status, updated_at) VALUES ($1, $2, 'ACCEPTED', CURRENT_TIMESTAMP)",
      [chatId, user1Id]
    );

    // Add participants
    await db.query("INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2)", [chatId, user1Id]);
    await db.query("INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2)", [chatId, user2Id]);

    res.json({ chatId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Save a message
router.post("/messages", async (req, res) => {
  const { chatId, senderId, content, attachments } = req.body;
  const msgId = `msg-${Date.now()}`;
  try {
    const result = await db.query(
      "INSERT INTO messages (id, chat_id, sender_id, content, attachments) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [msgId, chatId, senderId, content, JSON.stringify(attachments || [])]
    );

    // Update last message in chat
    await db.query(
      "UPDATE chats SET last_message_content = $1, last_message_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [content, chatId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Update chat status (Accept/Reject)
router.put('/:chatId/status', async (req, res) => {
    const { chatId } = req.params;
    const { status } = req.body; // 'ACCEPTED' or 'REJECTED'

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await db.query(
            'UPDATE chats SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, chatId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
