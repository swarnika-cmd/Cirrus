import { FaComments } from 'react-icons/fa';
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });

    const { username, email, password } = formData;
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { dispatch } = useContext(AuthContext);

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);
        setIsLoading(true);

        try {
            const data = await authService.register(formData);
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                    user: data,
                    token: data.token
                }
            });
            setMessage(`Registration successful!`);
            setTimeout(() => navigate('/set-avatar'), 500);
        } catch (err) {
            const errorMessage =
                err.response?.data?.message || 'Registration failed due to a server error.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container register-page">
            <div className="modern-auth-card">

                {/* Header Illustration (Leaf SVG) */}
                <div className="auth-header-illustration">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4a5568' }}>
                        <path d="M2 22s5-2 9-9 9-18 9-18-9 5-18 9 9 9 9 9z" />
                        <path d="M12 12l9-7" />
                    </svg>
                </div>

                {/* Text */}
                <h2 className="modern-auth-title">Sign up</h2>
                <p className="modern-auth-subtitle">Create an account, It's free</p>

                {/* Form */}
                <form onSubmit={onSubmit}>
                    <div className="line-input-wrapper">
                        <input
                            type="text"
                            name="username"
                            value={username}
                            onChange={onChange}
                            placeholder="Username"
                            className="line-input"
                            required
                        />
                    </div>
                    <div className="line-input-wrapper">
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            placeholder="Email"
                            className="line-input"
                            required
                        />
                    </div>
                    <div className="line-input-wrapper">
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            placeholder="Password"
                            className="line-input"
                            required
                        />
                    </div>

                    <button type="submit" className="modern-auth-btn" disabled={isLoading}>
                        {isLoading ? 'Wait...' : 'Sign Up'}
                    </button>
                </form>

                {/* Footer */}
                <div className="auth-footer">
                    Already have an account? <Link to="/login">Log In</Link>
                </div>

                {error && (
                    <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '15px' }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register;