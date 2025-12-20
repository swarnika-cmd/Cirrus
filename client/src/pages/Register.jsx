// client/src/pages/Register.jsx - Finalized with Emoji Avatar Selection and UI Structure

import { FaComments } from 'react-icons/fa';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

// 💡 EMOJI AVATARS LIST (Used for the picker UI)
const EMOJI_AVATARS = ['😊', '🚀', '🎨', '🎮', '🎵', '⚡', '🌟', '🔥', '💎', '🦄', '🐱', '🌈'];

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        // 💡 Initialize avatar fields
        avatar: EMOJI_AVATARS[0],
        avatarType: 'emoji'
    });

    const { username, email, password, avatar } = formData;
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    // Handler to select a new avatar
    const onAvatarSelect = (newAvatar) => {
        setFormData(prevData => ({
            ...prevData,
            avatar: newAvatar,
            avatarType: 'emoji'
        }));
    };

    const onChange = (e) => {
        // Correctly handle state update for input fields
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);
        setIsLoading(true);

        try {
            // Note: formData now includes avatar and avatarType for the backend
            await authService.register(formData);

            setMessage(`Registration successful! Redirecting to login...`);

            // Clear only necessary form fields
            setFormData(prevData => ({
                ...prevData,
                username: '',
                email: '',
                password: ''
            }));

            setTimeout(() => navigate('/login'), 1500);

        } catch (err) {
            const errorMessage =
                err.response?.data?.message || 'Registration failed due to a server error.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // 💡 WRAPPER 1: Main Auth Container for background and centering
        <div className="auth-page-container register-page">

            {/* WRAPPER 2: The beautiful, translucent form box */}
            <div className="form-container">

                {/* Logo/Icon */}
                {FaComments && <FaComments className="logo-icon" />}

                <h2>{"PINSTAGRAM"}</h2>
                <p>Join the community and chat instantly</p>

                {/* 💡 AVATAR SELECTION AREA */}
                <div className="avatar-selection-area">
                    <div className="current-avatar">{avatar}</div>
                    <div className="avatar-picker">
                        {EMOJI_AVATARS.map((emoji, index) => (
                            <button
                                key={index}
                                type="button"
                                className={`emoji-btn ${avatar === emoji ? 'selected' : ''}`}
                                onClick={() => onAvatarSelect(emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab-Style Button Group */}
                <div className="button-group">
                    {/* Sign In Button (Unactive) */}
                    <Link to="/login" style={{ flex: 1 }}>
                        <button type="button">Sign In</button>
                    </Link>
                    {/* Register Button (Active) - Disabled to hold the style */}
                    <button type="button" disabled style={{ flex: 1 }}>Register</button>
                </div>

                {/* --- Form --- */}
                <form onSubmit={onSubmit}>
                    <input
                        type="text"
                        name="username"
                        value={username}
                        onChange={onChange}
                        placeholder="Username"
                        autoComplete="username"
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={onChange}
                        placeholder="Email"
                        autoComplete="email"
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        value={password}
                        onChange={onChange}
                        placeholder="Password (min 6 chars)"
                        autoComplete="new-password"
                        required
                    />
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>

                {/* --- Messages and Errors --- */}
                {message && <p className="success-message" style={{ color: '#4cc9f0', marginTop: '20px' }}>{message}</p>}
                {error && <p className="error-message" style={{ color: '#ff4d4f', marginTop: '10px' }}>{error}</p>}

            </div>
        </div>
    );
};

export default Register;