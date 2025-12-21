import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onFinish }) => {
    // "CIRRUS" - The Brand Name
    const text = "CIRRUS";
    const letters = text.split("");

    useEffect(() => {
        const timer = setTimeout(() => {
            onFinish();
        }, 4500);
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <motion.div
            className="splash-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                // Sophisticated Gray/Metallic Gradient (Professional)
                background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
                overflow: 'hidden'
            }}
        >
            {/* Animated Background Orb (Bio-Organic Feel) */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 0.5 }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                style={{
                    position: 'absolute',
                    width: '50vw',
                    height: '50vw',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                    filter: 'blur(80px)',
                    borderRadius: '50%',
                    zIndex: -1
                }}
            />

            <div style={{ display: 'flex', overflow: 'hidden', zIndex: 1 }}>
                {letters.map((letter, index) => (
                    <motion.span
                        key={index}
                        initial={{ y: 200, opacity: 0, filter: 'blur(20px)' }}
                        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                        transition={{
                            duration: 1.2,
                            delay: index * 0.12,
                            ease: [0.22, 1, 0.36, 1] // Custom Luxury Bezier
                        }}
                        style={{
                            fontSize: 'clamp(5rem, 12vw, 10rem)',
                            fontWeight: '800',
                            color: '#2d3748',
                            fontFamily: "'Outfit', sans-serif",
                            display: 'inline-block',
                            margin: '0 -4px', // Tight premium tracking
                            letterSpacing: '-0.02em',
                            textShadow: '0 20px 40px rgba(0,0,0,0.05)'
                        }}
                    >
                        {letter}
                    </motion.span>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 1, ease: "easeOut" }}
                style={{
                    marginTop: '30px',
                    fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
                    color: '#4a5568',
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: '0.4em', // Wide tracking for tagline
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    zIndex: 1,
                    fontWeight: '500' // Slightly bolder to read better
                }}
            >
                Where conversations never skip a beat
            </motion.div>
        </motion.div>
    );
};

export default SplashScreen;
