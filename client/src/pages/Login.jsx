import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { dispatch } = useContext(AuthContext);
    const { email, password } = formData;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const userData = { email, password };
            const response = await authService.login(userData);

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user: response, token: response.token }
            });
            navigate('/chat');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Login failed.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container login-page">
            <motion.div
                className="login-split-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                {/* LEFT PANEL: Illustration & Vibe */}
                <div className="login-left">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{ fontSize: '80px', marginBottom: '20px' }}
                    >
                        ☁️
                    </motion.div>
                    <h2 style={{ fontFamily: 'Outfit', marginBottom: '10px' }}>Cirrus</h2>
                    <p style={{ opacity: 0.9, lineHeight: '1.6', fontSize: '14px' }}>
                        Where conversations float effortlessly.<br />Join the flow.
                    </p>

                    {/* Decorative Circles */}
                    <div style={{
                        position: 'absolute', bottom: -50, left: -50, width: 150, height: 150,
                        background: 'rgba(255,255,255,0.1)', borderRadius: '50%'
                    }} />
                    <div style={{
                        position: 'absolute', top: -30, right: -30, width: 100, height: 100,
                        background: 'rgba(255,255,255,0.1)', borderRadius: '50%'
                    }} />
                </div>

                {/* RIGHT PANEL: Form */}
                <div className="login-right">
                    <h2 className="login-brand-title">Cirrus</h2>
                    <p className="login-welcome-text">Welcome back to Cirrus</p>

                    <form onSubmit={onSubmit}>
                        <div className="line-input-wrapper">
                            <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                className="line-input"
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <div className="line-input-wrapper">
                            <label style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '600' }}>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                className="line-input"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="forgot-password">
                            <a href="#">Forgot password?</a>
                        </div>

                        {error && <div style={{ color: 'red', fontSize: '13px', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}

                        <button type="submit" className="login-btn" disabled={isLoading}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="login-divider">or</div>

                    <button className="google-btn">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" width="20" />
                        Sign in with Google
                    </button>

                    <div className="create-account-link">
                        New to Cirrus? <Link to="/register">Create Account</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;