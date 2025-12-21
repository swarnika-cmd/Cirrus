import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Landing = () => {
    const letters = "CIRRUS".split("");

    return (
        <div className="landing-page" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            textAlign: 'center',
            zIndex: 10,
            position: 'relative'
        }}>
            <div className="landing-content" style={{ maxWidth: '600px', padding: '20px' }}>
                {/* Welcome To */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
                        fontWeight: '300',
                        color: 'white',
                        marginBottom: '0.5rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase'
                    }}
                >
                    Welcome to
                </motion.div>

                {/* Animated Logo */}
                <div style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden', marginBottom: '1rem' }}>
                    {letters.map((letter, index) => (
                        <motion.span
                            key={index}
                            initial={{ y: 100, opacity: 0, filter: 'blur(20px)' }}
                            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                            transition={{
                                duration: 1.2,
                                delay: 1 + index * 0.12, // Cinematic Stagger
                                ease: [0.22, 1, 0.36, 1]
                            }}
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 'clamp(4rem, 12vw, 8rem)',
                                fontWeight: '900',
                                color: 'white', // Clean White
                                display: 'inline-block',
                                margin: '0 -2px',
                                textShadow: '0 20px 40px rgba(0,0,0,0.3)'
                            }}
                        >
                            {letter}
                        </motion.span>
                    ))}
                </div>

                {/* Quote */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2, duration: 1 }}
                    style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: 'clamp(1rem, 2vw, 1.3rem)',
                        fontStyle: 'italic',
                        color: 'rgba(255,255,255,0.9)',
                        marginBottom: '4rem',
                        letterSpacing: '0.05em'
                    }}
                >
                    "Where conversations never skip a beat"
                </motion.p>

                {/* Actions */}
                <motion.div
                    className="landing-actions"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.8, duration: 0.8 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '300px', margin: '0 auto' }}
                >
                    <Link to="/register" style={{ width: '100%' }}>
                        <button className="landing-btn primary" style={{
                            width: '100%', padding: '16px', borderRadius: '50px',
                            border: 'none', background: 'white', color: '#4f46e5',
                            fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                        }}>Create Account</button>
                    </Link>
                    <Link to="/login" style={{ width: '100%' }}>
                        <button className="landing-btn outline" style={{
                            width: '100%', padding: '16px', borderRadius: '50px',
                            background: 'rgba(255,255,255,0.1)', color: 'white',
                            fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                            border: '2px solid rgba(255,255,255,0.5)',
                            backdropFilter: 'blur(5px)'
                        }}>Log In</button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default Landing;
