// server/server.js (Updated for Advanced Features and Deployment)

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

// --- Import All Components ---
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
// 💡 NEW: Import the new upload routes and the specific error handlers
const uploadRoutes = require('./routes/uploadRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const User = require('./models/User'); // 💡 NEW: We need the User model here for offline status update

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// 🚨 DEPLOYMENT CHANGE: Determine allowed origins dynamically
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const allowedOrigins = [
    'http://localhost:5173',
    'https://real-time-chat-application-frontend-u0s4.onrender.com', // ADD YOUR FRONTEND URL
    CLIENT_ORIGIN
].filter(Boolean);


// --- 1. CORS Configuration (More robust function for dynamic origins) ---
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or local file access)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`CORS blocked: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// --- 2. Socket.io Configuration ---
const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});


// --- 3. Middleware (Including new extended form parser) ---
app.use(express.json());
// 💡 NEW: express.urlencoded is essential for file uploads and complex form data
app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // You'll need this for serving files later


// --- 4. Routes (Including new upload route) ---
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes); // 💡 NEW: File upload route


// --- 5. Socket.io Logic (Advanced Real-Time Features) ---

// Store online users (Map<userId, socketId>)
// --- 5. Socket.io Logic (Advanced Real-Time Features) ---

// Store online users (Map<userId, socketId>)
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // User comes online
    socket.on('user-online', async (userId) => {
        console.log('👤 User online:', userId);
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;

        // Update user status in DB
        await User.findByIdAndUpdate(userId, { isOnline: true })
            .catch(err => console.error('Error setting user online:', err));

        // Broadcast to all users
        io.emit('user-status-change', {
            userId,
            status: 'online'
        });

        console.log(`✅ User ${userId} is online. Total online: ${onlineUsers.size}`);
    });

    // Join a chat room
    socket.on('join_chat', (roomId) => {
        console.log('🚪 Socket', socket.id, 'joining room:', roomId);
        socket.join(roomId);
        socket.currentRoom = roomId;
    });

    // Leave a chat room
    socket.on('leave_chat', (roomId) => {
        console.log('🚪 Socket', socket.id, 'leaving room:', roomId);
        socket.leave(roomId);
    });

    // Handle message sending
    socket.on('send-message', (message) => {
        console.log('📤 Message received by server:', message);

        // Determine the receiver ID
        const receiverId = message.receiver?._id || message.receiver;
        const senderId = message.sender?._id || message.sender;

        // Calculate room ID (same logic as frontend)
        const roomId = senderId < receiverId
            ? `${senderId}_${receiverId}`
            : `${receiverId}_${senderId}`;

        console.log('📨 Emitting to room:', roomId);

        // Emit to room (both users in the conversation)
        io.to(roomId).emit('receive-message', message);

        // Also try direct delivery to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
            console.log('📨 Direct emit to receiver:', receiverSocketId);
            io.to(receiverSocketId).emit('receive-message', message);
        }
    });

    // Typing indicators
    socket.on('typing-start', ({ senderId, receiverId }) => {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user-typing', { userId: senderId });
        }
    });

    socket.on('typing-stop', ({ senderId, receiverId }) => {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user-stopped-typing', { userId: senderId });
        }
    });

    // Message Read Receipt
    socket.on('message-read', ({ senderId, receiverId }) => {
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
            io.to(senderSocketId).emit('message-read', { receiverId });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);

        if (socket.userId) {
            onlineUsers.delete(socket.userId);

            // Update user status in database
            User.findByIdAndUpdate(socket.userId, {
                lastSeen: new Date(),
                isOnline: false
            }).catch(err => console.error('Error updating user status:', err));

            // Broadcast offline status
            io.emit('user-status-change', {
                userId: socket.userId,
                status: 'offline'
            });

            console.log(`User ${socket.userId} went offline. Total online: ${onlineUsers.size}`);
        }
    });
});


// --- 6. Health Check and Error Middleware ---

// Health check (Replaces old Sample route)
app.get('/', (req, res) => {
    res.json({ message: 'PINSTAGRAM API is running' });
});

// Error Middleware (Must be after all routes)
app.use(notFound);
app.use(errorHandler);


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});