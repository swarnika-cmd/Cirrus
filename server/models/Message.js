const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        trim: true  // REMOVED required:true to allow file-only messages
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'], // ADDED more types
        default: 'text'
    },
    // ✨ NEW FIELDS FOR FILE UPLOADS
    fileUrl: {
        type: String,
        default: ''
    },
    fileName: {
        type: String,
        default: null
    },
    fileSize: {
        type: Number,
        default: null
    },
    mimeType: {
        type: String,
        default: null
    },
    // EXISTING FIELDS
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);