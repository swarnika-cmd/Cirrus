/*
After successfully completing the authentication part, the next step is to build the core chat functionality: managing messages and conversations

We will start with  the Rouiites and controllers for messaging 
*/

//----------------------------------------------------------------------------------------------------------------


const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    // 1. Get sender ID from middleware and data from body
    const { receiverId, content, messageType, fileUrl, fileName, fileSize, mimeType } = req.body;
    const senderId = req.user._id;

    // 2. Basic validation - either content OR fileUrl must exist
    if (!receiverId || (!content && !fileUrl)) {
        res.status(400);
        throw new Error('Please include receiverId and either message content or a file.');
    }

    // 3. Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
        res.status(404);
        throw new Error('Receiver user not found');
    }

    // 4. Create message data object
    const messageData = {
        sender: senderId,
        receiver: receiverId,
        messageType: messageType || 'text'
    };

    // Add content if provided
    if (content) {
        messageData.content = content;
    }

    // Add file data if provided
    if (fileUrl) {
        messageData.fileUrl = fileUrl;
        messageData.fileName = fileName;
        messageData.fileSize = fileSize;
        messageData.mimeType = mimeType;
    }

    // 5. Create and save the new message
    const newMessage = await Message.create(messageData);

    // 6. Populate sender/receiver data for response
    const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'username avatar _id')
        .populate('receiver', 'username avatar _id');

    if (populatedMessage) {
        res.status(201).json(populatedMessage);
    } else {
        res.status(500);
        throw new Error('Failed to save message.');
    }
});

// Keep your getMessages function EXACTLY as it is - no changes needed

// @desc    Get all messages between two users (conversation history)
// @route   GET /api/messages/:receiverId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const receiverId = req.params.receiverId;

    // 1. Basic Validation
    if (!receiverId) {
        res.status(400);
        throw new Error('Receiver ID must be provided in the URL.');
    }

    // 2. Query the database
    const messages = await Message.find({
        $or: [
            { sender: userId, receiver: receiverId },
            { sender: receiverId, receiver: userId },
        ],
    })
        .sort({ createdAt: 1 })
        // 🐛 FIX 4: Include '_id' in populate for consistency
        .populate('sender', 'username avatar _id')
        .populate('receiver', 'username avatar _id');

    // 3. Send the history back
    // 🐛 FIX 5: Send an empty array (200 OK) if no messages are found, rather than throwing a 404 error
    // Throwing an error for an empty history can unnecessarily crash the frontend's fetch logic.
    res.status(200).json(messages);
});

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:senderId
// @access  Private
const markMessagesRead = asyncHandler(async (req, res) => {
    const { senderId } = req.params;
    const userId = req.user._id;

    // Update all messages sent BY senderId TO userId (me) that are currently unread
    await Message.updateMany(
        { sender: senderId, receiver: userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({ message: 'Messages marked as read' });
});

module.exports = { sendMessage, getMessages, markMessagesRead };
