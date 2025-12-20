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
    const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
    const [viewRequests, setViewRequests] = useState(false);
    const [contactSearchQuery, setContactSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [requests, setRequests] = useState([]);

    // ... (Existing effects)

    // Fetch Friends (Main List)
    useEffect(() => {
        if (!token) return;
        const fetchFriends = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get(`${ENDPOINT}/api/users/all`, config); // Now returns friends
                setAllUsers(response.data);
            } catch (error) {
                console.error('Failed to fetch friends:', error);
            }
        };
        fetchFriends();
    }, [token, isAddFriendOpen, viewRequests]); // Refresh when closing modals

    // Search Handler
    const handleSearchNewUsers = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${ENDPOINT}/api/users/search?query=${contactSearchQuery}`, config);
            setSearchResults(data);
        } catch (error) { console.error(error); }
    };

    // Send Request Handler
    const handleSendRequest = async (userId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`${ENDPOINT}/api/users/request/${userId}`, {}, config);
            alert("Request sent!");
            setSearchResults(prev => prev.filter(u => u._id !== userId));
        } catch (error) { alert(error.response?.data?.message || "Error sending request"); }
    };

    // Accept Request Handler
    const handleAcceptRequest = async (userId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`${ENDPOINT}/api/users/accept/${userId}`, {}, config);
            // Refresh requests
            setRequests(prev => prev.filter(u => u._id !== userId));
            alert("Request accepted! You can now chat.");
            setIsAddFriendOpen(false); // Close modal to refresh main list
        } catch (error) { alert("Error accepting request"); }
    };

    // Load Requests when opening Add Friend Modal
    useEffect(() => {
        if (isAddFriendOpen && token) {
            axios.get(`${ENDPOINT}/api/users/requests`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setRequests(res.data))
                .catch(err => console.error(err));
        }
    }, [isAddFriendOpen, token]);


    return (
        <div className="chat-app-container">
            {/* ... (Profile Modal) ... */}
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
                                <h2>Profile</h2>
                                <button className="close-btn" onClick={() => setIsProfileOpen(false)}>×</button>
                            </div>
                            <div className="profile-body">
                                <div className="profile-avatar-large">
                                    {getInitials(user?.username)}
                                </div>
                                <div className="profile-detail">
                                    <label>Your Name</label>
                                    <p>{user?.username}</p>
                                </div>
                                <div className="profile-detail">
                                    <label>Email / ID</label>
                                    <p>{user?.email}</p>
                                </div>
                                <div className="profile-status">
                                    <span className="status-dot online"></span> Active
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 💡 ADD FRIEND & REQUESTS MODAL */}
            <AnimatePresence>
                {isAddFriendOpen && (
                    <motion.div
                        className="profile-modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsAddFriendOpen(false)}
                    >
                        <motion.div
                            className="profile-modal-content"
                            style={{ maxWidth: '500px' }}
                            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="profile-header">
                                <h2>Manage Connections</h2>
                                <button className="close-btn" onClick={() => setIsAddFriendOpen(false)}>×</button>
                            </div>
                            <div className="profile-body" style={{ alignItems: 'stretch', textAlign: 'left', padding: '20px' }}>
                                {/* TABS */}
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                    <button
                                        onClick={() => setViewRequests(false)}
                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: !viewRequests ? '#667eea' : '#f0f0f0', color: !viewRequests ? 'white' : 'black', cursor: 'pointer' }}
                                    >
                                        Search Users
                                    </button>
                                    <button
                                        onClick={() => setViewRequests(true)}
                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: viewRequests ? '#667eea' : '#f0f0f0', color: viewRequests ? 'white' : 'black', cursor: 'pointer' }}
                                    >
                                        Requests ({requests.length})
                                    </button>
                                </div>

                                {/* CONTENT */}
                                {viewRequests ? (
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {requests.length === 0 ? <p style={{ textAlign: 'center', color: '#888' }}>No pending requests.</p> : (
                                            requests.map(req => (
                                                <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div className="chat-avatar" style={{ width: '30px', height: '30px', fontSize: '12px' }}>{getInitials(req.username)}</div>
                                                        <span>{req.username}</span>
                                                    </div>
                                                    <button onClick={() => handleAcceptRequest(req._id)} style={{ padding: '6px 12px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Accept</button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <form onSubmit={handleSearchNewUsers} style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                                            <input
                                                type="text"
                                                placeholder="Enter username/email..."
                                                value={contactSearchQuery}
                                                onChange={(e) => setContactSearchQuery(e.target.value)}
                                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                            />
                                            <button type="submit" style={{ padding: '10px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><FaSearch /></button>
                                        </form>
                                        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                            {searchResults.map(res => (
                                                <div key={res._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div className="chat-avatar" style={{ width: '30px', height: '30px', fontSize: '12px' }}>{getInitials(res.username)}</div>
                                                        <span>{res.username}</span>
                                                    </div>
                                                    <button onClick={() => handleSendRequest(res._id)} style={{ padding: '6px 12px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Add</button>
                                                </div>
                                            ))}
                                        </div>
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
                        <div className="user-avatar-small" onClick={() => setIsProfileOpen(true)} title="View Profile" style={{ cursor: 'pointer', marginRight: '10px', width: '35px', height: '35px', borderRadius: '50%', background: '#3182ce', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {getInitials(user?.username)}
                        </div>
                        <h2>Chats</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {/* 💡 Add Friend Button */}
                            <button className="more-btn" onClick={() => setIsAddFriendOpen(true)} title="Add Friend / Requests">
                                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span>
                            </button>
                            <button className="more-btn" onClick={handleLogout} title="Logout"><FaSignOutAlt /></button>
                        </div>
                    </div>
                    {/* ... (Search and List remain same) ... */}
                    <div className="search-box">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="chat-list">
                    {filteredUsers.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#a0aec0', fontSize: '14px' }}>
                            <p>No chats yet.</p>
                            <button onClick={() => setIsAddFriendOpen(true)} style={{ marginTop: '10px', color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Find People</button>
                        </div>
                    ) : (
                        filteredUsers.map((targetUser) => (
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
                        ))
                    )}
                </div>
            </div>

            {/* MAIN CHAT AREA */}
            <div className="main-chat-area">
                {!chatTarget ? (
                    <div className="no-chat-selected">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <FaComments size={64} style={{ color: '#cbd5e0' }} />
                            <h3>Welcome to PINSTAGRAM</h3>
                            <p>Select a conversation or add a friend to start messaging</p>
                        </motion.div>
                    </div>
                ) : (
                    <>
                        {/* ... (Existing Chat Area) ... */}
                        <div className="chat-area-header">
                            <div className="header-user-info">
                                <div className="chat-avatar large">{getInitials(chatTarget.username)}<span className="online-indicator"></span></div>
                                <div><h3>{chatTarget.username}</h3><div className="status-text">{chatTarget.isOnline ? 'Online' : 'Offline'}</div></div>
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