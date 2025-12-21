// client/src/pages/Chat.jsx - Final Integration with Robust Avatar Handling

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

// --- UTILITY COMPONENT: AvatarDisplay ---
// Handles image loading errors gracefully (fall back to initials)
const AvatarDisplay = ({ user, size = 'small' }) => {
    const [imgError, setImgError] = useState(false);

    if (!user) return <div className={`avatar-placeholder ${size}`}>?</div>;

    const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

    // Determine if we should try to render an image
    // Check for 'image' type OR if the avatar string looks like a URL (backward compatibility)
    const isImage = (user.avatarType === 'image') || (user.avatar && (user.avatar.startsWith('/') || user.avatar.startsWith('http')));

    // If it's an image and hasn't failed yet:
    if (isImage && !imgError && user.avatar) {
        return (
            <img
                src={user.avatar}
                alt={user.username}
                onError={() => setImgError(true)}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%'
                }}
            />
        );
    }

    // Fallback: Render Emoji or Initials
    // If it was an image but failed (imgError=true), we show Initials.
    // If it's explicitly an emoji type, we show the emoji.
    if (user.avatarType === 'emoji' && !imgError) {
        return <span style={{ fontSize: size === 'large' ? '1.5em' : '1.2em' }}>{user.avatar}</span>;
    }

    return <span style={{ fontSize: size === 'large' ? '1.5em' : '1.2em' }}>{getInitials(user.username)}</span>;
};


const Chat = () => {
    const { user, token, dispatch } = useContext(AuthContext);
    const navigate = useNavigate();

    // State
    const [socket, setSocket] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [chatTarget, setChatTarget] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // --- UTILITY ---
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

        newSocket.on('message-read', ({ receiverId }) => {
            setMessages(prev => prev.map(msg =>
                msg.sender === user._id || msg.sender?._id === user._id
                    ? { ...msg, isRead: true }
                    : msg
            ));
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    // 2. Handle Typing & Status
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

        const handleReceiveMessage = async (newMessage) => {
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

                    if (newMessage.sender?._id === chatTarget._id || newMessage.sender === chatTarget._id) {
                        try {
                            const config = { headers: { Authorization: `Bearer ${token}` } };
                            await axios.put(`${ENDPOINT}/api/messages/read/${chatTarget._id}`, {}, config);
                            socket.emit('message-read', { senderId: chatTarget._id, receiverId: user._id });
                        } catch (err) { console.error("Error marking read:", err); }
                    }
                }
            }

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
                }).sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
            });
        };

        socket.on('receive-message', handleReceiveMessage);
        return () => socket.off('receive-message', handleReceiveMessage);
    }, [socket, chatTarget, token, user]);

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
                const endpoint = searchQuery.trim()
                    ? `${ENDPOINT}/api/users/all`
                    : `${ENDPOINT}/api/users/recent`;

                const response = await axios.get(endpoint, config);
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

        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [token, searchQuery]);

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
        // Force refresh avatar state for target if needed by resetting something? No, Component handles it.

        const roomId = user._id < targetUser._id ? `${user._id}_${targetUser._id}` : `${targetUser._id}_${user._id}`;
        if (socket) socket.emit('join_chat', roomId);

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${ENDPOINT}/api/messages/${targetUser._id}`, config);
            setMessages(response.data);

            await axios.put(`${ENDPOINT}/api/messages/read/${targetUser._id}`, {}, config);
            if (socket) socket.emit('message-read', { senderId: targetUser._id, receiverId: user._id });

        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const handleTyping = (e) => {
        setMessageInput(e.target.value);
        if (!socket || !chatTarget) return;

        socket.emit('typing-start', { senderId: user._id, receiverId: chatTarget._id });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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
            socket.emit('typing-stop', { senderId: user._id, receiverId: chatTarget._id });

            setMessages(prev => [...prev, savedMessage.data]);
            setMessageInput('');

        } catch (error) {
            console.error("Failed to send:", error);
        }
    };

    const filteredUsers = allUsers.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const createEmojiWallpaper = (emoji) => {
        if (!emoji) return 'none';
        if (emoji.startsWith('/') || emoji.startsWith('http')) return 'none';

        const svg = `
            <svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'>
                <text x='40' y='40' dominant-baseline='middle' text-anchor='middle' font-size='24' opacity='0.05' font-family='Arial'>
                    ${emoji}
                </text>
            </svg>
        `.trim().replace(/\s+/g, ' ');
        return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
    };

    const [isEditingEmoji, setIsEditingEmoji] = useState(false);

    const handleUpdateProfile = async (newEmoji) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.put(`${ENDPOINT}/api/users/profile`, {
                avatar: newEmoji,
                avatarType: 'emoji'
            }, config);

            const updatedUser = { ...user, avatar: newEmoji };
            localStorage.setItem('userInfo', JSON.stringify({ ...updatedUser, token }));
            dispatch({ type: 'LOGIN_SUCCESS', payload: { ...updatedUser, token } });
            setIsEditingEmoji(false);
        } catch (error) {
            console.error('Failed to update:', error);
        }
    };

    const emojis = ['😎', '👻', '🤖', '👽', '💀', '🤡', '👹', '👺', '💩', '😺', '🐵', '🐶', '🐺', '🦊', '🐯', '🦁', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🕷', '🕸', '🐢', '🐍', '🦎', '🦖', '🦕'];

    return (
        <div className="chat-app-container">
            {/* PROFILE MODAL */}
            <AnimatePresence>
                {isProfileOpen && (
                    <motion.div
                        className="profile-modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsProfileOpen(false)}
                    >
                        <motion.div
                            className="profile-modal-content"
                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="profile-header">
                                <h2>Profile & Settings</h2>
                                <button className="close-btn" onClick={() => setIsProfileOpen(false)}>×</button>
                            </div>
                            <div className="profile-body">
                                {!isEditingEmoji ? (
                                    <>
                                        <motion.div whileHover={{ scale: 1.1 }} className="profile-avatar-large" style={{ fontSize: '64px', overflow: 'hidden' }}>
                                            <AvatarDisplay user={user} size="large" />
                                        </motion.div>

                                        <div className="profile-detail">
                                            <label>Name</label>
                                            <p>{user?.username}</p>
                                        </div>
                                        <div className="profile-detail">
                                            <label>Theme Emoji / Avatar</label>
                                            <div style={{ fontSize: '24px', opacity: 0.7 }}>
                                                {user?.avatarType === 'image' ? 'Character Avatar' : user?.avatar}
                                            </div>
                                        </div>

                                        <div className="button-group-vertical" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                                            <button className="primary-btn-outline" onClick={() => setIsEditingEmoji(true)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #667eea', background: 'transparent', color: '#667eea', cursor: 'pointer', fontWeight: 'bold' }}>
                                                Change Theme Emoji
                                            </button>
                                            <button className="logout-btn-full" onClick={handleLogout} style={{ padding: '10px', borderRadius: '8px', border: 'none', background: '#e53e3e', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                                                Logout
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="emoji-picker-profile">
                                        <h4>Pick a theme emoji</h4>
                                        <div className="avatar-picker" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxHeight: '300px', overflowY: 'auto' }}>
                                            {emojis.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleUpdateProfile(emoji)}
                                                    className="emoji-btn"
                                                    style={{ fontSize: '24px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: user?.avatar === emoji ? '#e2e8f0' : 'white' }}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={() => { setIsEditingEmoji(false); navigate('/set-avatar'); }} style={{ marginTop: '16px', color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                            Switch to Character Avatar
                                        </button>
                                        <button onClick={() => setIsEditingEmoji(false)} style={{ marginTop: '16px', color: '#718096', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CHAT LIST PANEL */}
            <div className="chat-list-panel">
                <div className="chat-list-header">
                    <div className="header-title-row">
                        <div className="user-avatar-small" onClick={() => setIsProfileOpen(true)} title="View Profile" style={{ cursor: 'pointer', marginRight: '10px', width: '35px', height: '35px', borderRadius: '50%', background: '#3182ce', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                            <AvatarDisplay user={user} size="small" />
                        </div>
                        <h2>Chats</h2>
                        <button className="more-btn" onClick={() => setIsProfileOpen(true)} title="Settings"><FaEllipsisH /></button>
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
                            <div className="chat-avatar" style={{ overflow: 'hidden' }}>
                                <AvatarDisplay user={targetUser} />
                                {targetUser.isOnline && <span className="online-indicator"></span>}
                            </div>
                            <div className="chat-info">
                                <div className="chat-name">{targetUser.username}</div>
                                <div className="chat-preview">
                                    {targetUser.lastMessage || 'Click to chat'}
                                </div>
                            </div>
                            <div className="chat-time">
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
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                            {/* Floating Illustration */}
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                style={{
                                    fontSize: '80px',
                                    marginBottom: '20px',
                                    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))'
                                }}
                            >
                                🪐
                            </motion.div>

                            <h3>Welcome, {user?.username}!</h3>
                            <p>Explore the universe of conversations.<br />Select a chat to begin.</p>
                        </motion.div>
                    </div>
                ) : (
                    <>
                        <div className="chat-area-header">
                            <div className="header-user-info">
                                <div className="chat-avatar large" style={{ overflow: 'hidden' }}>
                                    <AvatarDisplay user={chatTarget} size="large" />
                                    <span className="online-indicator"></span>
                                </div>
                                <div><h3>{chatTarget.username}</h3><div className="status-text">{chatTarget.isOnline ? 'Online' : 'Offline'}</div></div>
                            </div>
                            <button className="more-btn"><FaEllipsisH size={20} /></button>
                        </div>

                        <div
                            className="messages-container"
                            style={{
                                backgroundImage: createEmojiWallpaper(user?.avatar || '😎'),
                            }}
                        >
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
                                            {!isSent && (
                                                <div className="message-avatar" style={{ overflow: 'hidden' }}>
                                                    <AvatarDisplay user={chatTarget} size="tiny" />
                                                </div>
                                            )}

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
                                                <div className="message-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                                                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                                                    {isSent && (
                                                        <span className="read-receipt" style={{ fontWeight: 'bold', color: msg.isRead ? '#63b3ed' : 'inherit' }}>
                                                            {msg.isRead ? '✓✓' : '✓'}
                                                        </span>
                                                    )}
                                                </div>
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
                                    onChange={handleTyping}
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