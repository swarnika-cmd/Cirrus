// client/src/pages/Chat.jsx - Final Integration with Animations & Features

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

// Context and Services
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';

import { API_BASE_URL } from '../config/api';
import EmojiPicker from '../components/EmojiPicker';

// Icons
import {
    FaComments,
    FaSearch,
    FaEllipsisH,
    FaPaperclip,
    FaPaperPlane,
    FaSignOutAlt
} from 'react-icons/fa';

const ENDPOINT = API_BASE_URL;
let typingTimeout = null;

const Chat = () => {
    const { user, token, dispatch } = useContext(AuthContext);
    const navigate = useNavigate();

    // State
    const [socket, setSocket] = useState(null); // 💡 Socket is now managed in state
    const [allUsers, setAllUsers] = useState([]);
    const [chatTarget, setChatTarget] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false); // Validates if *other* user is typing

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- UTILITY FUNCTIONS ---
    const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

    const formatTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleEmojiSelect = (emoji) => {
        setMessageInput(prev => prev + emoji);
    };

    // --- EFFECTS & SOCKETS ---

    const typingTimeoutRef = useRef(null); // Ref for typing timeout

    // --- EFFECTS & SOCKETS ---

    // 1. Initialize Socket
    useEffect(() => {
        const newSocket = io(ENDPOINT, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            if (user?._id) {
                newSocket.emit('user-online', user._id);
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    // 2. Handle Typing Events
    useEffect(() => {
        if (!socket) return;

        const handleTyping = ({ userId }) => {
            if (chatTarget && userId === chatTarget._id) {
                setIsTyping(true);
                scrollToBottom();
            }
        };

        const handleStoppedTyping = ({ userId }) => {
            if (chatTarget && userId === chatTarget._id) {
                setIsTyping(false);
            }
        };

        // 💡 NEW: Handle One-Time User Status Changes
        const handleStatusChange = ({ userId, status }) => {
            setAllUsers(prevUsers => prevUsers.map(u =>
                u._id === userId ? { ...u, isOnline: status === 'online' } : u
            ));
        };

        socket.on('user-typing', handleTyping);
        socket.on('user-stopped-typing', handleStoppedTyping);
        socket.on('user-status-change', handleStatusChange);

        return () => {
            socket.off('user-typing', handleTyping);
            socket.off('user-stopped-typing', handleStoppedTyping);
            socket.off('user-status-change', handleStatusChange);
        };
    }, [socket, chatTarget]);

    // 3. Listen for Messages
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (newMessage) => {
            console.log('📨 Message received in FE:', newMessage);

            // A. Update current active chat messages
            if (chatTarget) {
                const isForCurrentChat =
                    (newMessage.sender?._id === chatTarget._id || newMessage.sender === chatTarget._id) ||
                    (newMessage.receiver?._id === chatTarget._id || newMessage.receiver === chatTarget._id);

                if (isForCurrentChat) {
                    setMessages((prev) => {
                        const isDuplicate = prev.some(msg => msg._id === newMessage._id);
                        if (isDuplicate) return prev;
                        return [...prev, newMessage];
                    });
                    setIsTyping(false);
                }
            }

            // B. Update Chat List Preview (Dynamic "WhatsApp-like" behavior)
            setAllUsers(prevUsers => {
                return prevUsers.map(user => {
                    const isSender = (newMessage.sender?._id || newMessage.sender) === user._id;
                    const isReceiver = (newMessage.receiver?._id || newMessage.receiver) === user._id;

                    if (isSender || isReceiver) {
                        return {
                            ...user,
                            lastMessage: newMessage.content || 'Photo',
                            lastMessageTime: newMessage.createdAt
                        };
                    }
                    return user;
                    // Optional: You could sort here to move the updated user to the top
                }).sort((a, b) => {
                    const timeA = new Date(a.lastMessageTime || 0);
                    const timeB = new Date(b.lastMessageTime || 0);
                    return timeB - timeA; // Sort descending
                });
            });
        };

        socket.on('receive-message', handleReceiveMessage);
        return () => socket.off('receive-message', handleReceiveMessage);
    }, [socket, chatTarget]);

    // Room Joining
    useEffect(() => {
        if (!chatTarget || !socket) return;
        const roomId = user._id < chatTarget._id ? `${user._id}_${chatTarget._id}` : `${chatTarget._id}_${user._id}`;
        socket.emit('join_chat', roomId);
        return () => socket.emit('leave_chat', roomId);
    }, [chatTarget, socket, user._id]);

    // Fetch Users
    useEffect(() => {
        if (!token) return;
        const fetchUsers = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get(`${ENDPOINT}/api/users/all`, config);
                setAllUsers(response.data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
                if (error.response?.status === 401) {
                    authService.logout();
                    dispatch({ type: 'LOGOUT' });
                    navigate('/login');
                }
            }
        };
        fetchUsers();
    }, [token]);

    // Scroll effect
    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);


    // --- HANDLERS ---

    const handleLogout = () => {
        authService.logout();
        dispatch({ type: 'LOGOUT' });
        navigate('/login');
    };

    const selectChatTarget = async (targetUser) => {
        setChatTarget(targetUser);
        setMessages([]);
        setIsTyping(false);

        const roomId = user._id < targetUser._id ? `${user._id}_${targetUser._id}` : `${targetUser._id}_${user._id}`;
        if (socket) socket.emit('join_chat', roomId);

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${ENDPOINT}/api/messages/${targetUser._id}`, config);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const handleTyping = (e) => {
        setMessageInput(e.target.value);

        if (!socket || !chatTarget) return;

        // Emit typing start
        socket.emit('typing-start', { senderId: user._id, receiverId: chatTarget._id });

        // Clear existing timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Set timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing-stop', { senderId: user._id, receiverId: chatTarget._id });
        }, 2000);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !chatTarget) return;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('receiverId', chatTarget._id);

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };
            const response = await axios.post(`${ENDPOINT}/api/upload`, formData, config);

            // Emit the file message
            console.log("📤 Sending file:", response.data);
            socket.emit('send-message', response.data);
            setMessages(prev => [...prev, response.data]);

        } catch (error) {
            console.error("File upload failed:", error);
            alert("Failed to upload image.");
        }
    };

    const sendChatMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !chatTarget) return;

        const messageData = {
            receiverId: chatTarget._id,
            content: messageInput,
        };

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const savedMessage = await axios.post(`${ENDPOINT}/api/messages`, messageData, config);

            socket.emit('send-message', savedMessage.data);
            socket.emit('typing-stop', { senderId: user._id, receiverId: chatTarget._id }); // Ensure typing stops

            setMessages(prev => [...prev, savedMessage.data]);
            setMessageInput('');

        } catch (error) {
            console.error("Failed to send:", error);
        }
    };

    const filteredUsers = allUsers.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="chat-app-container">
            {/* CHAT LIST PANEL */}
            <div className="chat-list-panel">
                <div className="chat-list-header">
                    <div className="header-title-row">
                        <h2>Chats</h2>
                        <button className="more-btn" onClick={handleLogout} title="Logout"><FaSignOutAlt /></button>
                    </div>
                    <div className="search-box">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="chat-list">
                    {filteredUsers.map((targetUser) => (
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            key={targetUser._id}
                            className={`chat-list-item ${chatTarget?._id === targetUser._id ? 'active' : ''}`}
                            onClick={() => selectChatTarget(targetUser)}
                        >
                            <div className="chat-avatar">
                                {getInitials(targetUser.username)}
                                {/* 💡 Dynamic Online Indicator */}
                                {targetUser.isOnline && <span className="online-indicator"></span>}
                            </div>
                            <div className="chat-info">
                                <div className="chat-name">{targetUser.username}</div>
                                {/* 💡 Dynamic Last Message Preview */}
                                <div className="chat-preview">
                                    {targetUser.lastMessage || 'Click to chat'}
                                </div>
                            </div>
                            <div className="chat-time">
                                {/* 💡 Dynamic Time */}
                                {targetUser.lastMessageTime ? formatTime(targetUser.lastMessageTime) : ''}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* MAIN CHAT AREA */}
            <div className="main-chat-area">
                {!chatTarget ? (
                    <div className="no-chat-selected">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <FaComments size={64} style={{ color: '#cbd5e0' }} />
                            <h3>Welcome to PINSTAGRAM</h3>
                            <p>Select a conversation to start messaging</p>
                        </motion.div>
                    </div>
                ) : (
                    <>
                        <div className="chat-area-header">
                            <div className="header-user-info">
                                <div className="chat-avatar large">{getInitials(chatTarget.username)}<span className="online-indicator"></span></div>
                                <div><h3>{chatTarget.username}</h3><div className="status-text">Active now</div></div>
                            </div>
                            <button className="more-btn"><FaEllipsisH size={20} /></button>
                        </div>

                        <div className="messages-container">
                            <AnimatePresence>
                                {messages.map((msg, index) => {
                                    const isSent = msg.sender?._id === user._id || msg.sender === user._id;
                                    return (
                                        <motion.div
                                            key={msg._id || index}
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className={`message-row ${isSent ? 'sent' : 'received'}`}
                                        >
                                            {!isSent && <div className="message-avatar">{getInitials(chatTarget.username)}</div>}

                                            <div className="message-content">
                                                {msg.messageType === 'image' || msg.fileUrl ? (
                                                    <img
                                                        src={`${ENDPOINT}${msg.fileUrl}`}
                                                        alt="Attachment"
                                                        className="message-image"
                                                        onClick={() => window.open(`${ENDPOINT}${msg.fileUrl}`, '_blank')}
                                                    />
                                                ) : (
                                                    <div className="message-bubble">{msg.content}</div>
                                                )}
                                                <div className="message-time">{formatTime(msg.createdAt)}</div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="typing-indicator"
                                >
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="message-input-area">
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />

                            <form className="message-form-controls" onSubmit={sendChatMessage}>
                                <button type="button" className="attachment-btn" onClick={() => fileInputRef.current?.click()}>
                                    <FaPaperclip size={18} />
                                </button>

                                <EmojiPicker onEmojiSelect={handleEmojiSelect} />

                                <input
                                    type="text"
                                    className="message-input-field"
                                    placeholder="Type a message..."
                                    value={messageInput}
                                    onChange={handleTyping} // Uses handleTyping instead of direct set state
                                />

                                <button
                                    type="submit"
                                    className="send-message-btn"
                                    disabled={!messageInput.trim()}
                                >
                                    <FaPaperPlane size={16} />
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Chat;