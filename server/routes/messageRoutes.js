const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, markMessagesRead } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware'); // We need protection for messages!

// All message routes are private and must use the 'protect' middleware

// POST /api/messages - Send message to a user
router.post('/', protect, sendMessage);

// GET /api/messages/:receiverId - Get conversation history
router.get('/:receiverId', protect, getMessages);

module.exports = router;