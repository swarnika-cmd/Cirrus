import { FaComments } from 'react-icons/fa';
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { dispatch } = useContext(AuthContext);

    // Destructuring formData is correct here
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

        const userData = { email, password };

        console.log("Submitting Data:", userData);

        try {
            // 💡 CORRECTION: Pass the destructured variables directly for clarity
            // Your original line was also correct, but this ensures we pass a clean object.
            const userData = { email, password };

            // This is the core API call
            const response = await authService.login(userData);

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user: response, token: response.token }
            });

            navigate('/chat');
            console.log("Login successful! Redirecting to chat.");

        } catch (err) {
            const errorMessage =
                err.response?.data?.message || 'Login failed. Invalid credentials or server error.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // 💡 WRAPPER 1: Main Auth Container (Crucial for background/centering)
        <div className="auth-page-container login-page">

            {/* WRAPPER 2: The beautiful, translucent form box */}
            <div className="form-container">

                {/* Logo/Icon */}
                {FaComments && <FaComments className="logo-icon" />}

                <h2>{"PINSTAGRAM"}</h2>
                <p>Welcome Back! Connect in real-time</p>

                {/* Tab-Style Button Group */}
                <div className="button-group">
                    {/* Login Button (Active) */}
                    <button type="button" disabled style={{ flex: 1 }}>Sign In</button>
                    {/* Register Button (Inactive) */}
                    <Link to="/register" style={{ flex: 1 }}>
                        <button type="button">Register</button>
                    </Link>
                </div>

                {/* --- Form --- */}
                <form onSubmit={onSubmit}>
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
                        placeholder="Password"
                        autoComplete="current-password"
                        required
                    />
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                {/* --- Messages and Errors --- */}
                {error && <p style={{ color: '#ff4d4f', marginTop: '10px' }}>{error}</p>}
            </div>
        </div>
    );
};

export default Login;