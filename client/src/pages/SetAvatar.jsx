import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const AVATAR_OPTIONS = [
    {
        id: 1,
        src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sadness&backgroundColor=b6e3f4',
        color: '#4B9CD3',
        name: 'Sadness'
    },
    {
        id: 2,
        src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Disgust&backgroundColor=c0e6ba',
        color: '#78C850',
        name: 'Disgust'
    },
    {
        id: 3,
        src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Joy&backgroundColor=ffd5dc',
        color: '#FFC0CB',
        name: 'Joy'
    },
    {
        id: 4,
        src: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Fear&backgroundColor=e1bee7',
        color: '#9C27B0',
        name: 'Fear'
    },
];

const SetAvatar = () => {
    const { token, dispatch } = useContext(AuthContext); // user not strictly needed for rendering
    const navigate = useNavigate();
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSetAvatar = async () => {
        if (!selectedAvatar) return;
        setIsLoading(true);

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const response = await axios.put(
                `${API_BASE_URL}/api/users/profile`,
                {
                    avatar: selectedAvatar.src,
                    avatarType: 'image'
                },
                config
            );

            // Update global auth state
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                    user: response.data,
                    token: token,
                },
            });

            navigate('/chat');
        } catch (error) {
            console.error("Error setting avatar:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container set-avatar-page">
            <div className="form-container" style={{ maxWidth: '700px' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Choose Your Character</h2>
                <p style={{ marginBottom: '40px', fontSize: '1.1rem' }}>Select the avatar that matches your vibe.</p>

                <div className="avatar-grid">
                    {AVATAR_OPTIONS.map((avatar) => (
                        <div
                            key={avatar.id}
                            className={`avatar-card ${selectedAvatar?.id === avatar.id ? 'selected' : ''}`}
                            onClick={() => setSelectedAvatar(avatar)}
                            style={{
                                borderColor: selectedAvatar?.id === avatar.id ? avatar.color : 'transparent',
                                boxShadow: selectedAvatar?.id === avatar.id ? `0 0 25px ${avatar.color}66` : 'none'
                            }}
                        >
                            <img src={avatar.src} alt={avatar.name} />
                        </div>
                    ))}
                </div>

                <button
                    className="submit-btn-glow"
                    onClick={handleSetAvatar}
                    disabled={!selectedAvatar || isLoading}
                >
                    {isLoading ? 'Setting Profile...' : 'Get Started 🚀'}
                </button>
            </div>

            <style>{`
                .avatar-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 30px;
                    margin-bottom: 40px;
                }
                .avatar-card {
                    background: #f7fafc;
                    border-radius: 20px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: 4px solid transparent;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                }
                .avatar-card:hover {
                    transform: translateY(-8px);
                    background: white;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                }
                .avatar-card.selected {
                    background: white;
                    transform: scale(1.05);
                }
                .avatar-card img {
                    width: 120px;
                    height: 120px;
                    object-fit: contain;
                    border-radius: 12px; 
                }
                
                .submit-btn-glow {
                    width: 100%;
                    padding: 18px;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 16px;
                    font-size: 1.2rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 5px 15px rgba(118, 75, 162, 0.4);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .submit-btn-glow:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 8px 25px rgba(118, 75, 162, 0.6);
                    filter: brightness(1.1);
                }
                .submit-btn-glow:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                @media (min-width: 600px) {
                    .avatar-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }
            `}</style>
        </div>
    );
};

export default SetAvatar;
