import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DynamicBackground = () => {
    // 25 Bubbles for a full effect
    const [bubbles, setBubbles] = useState([]);

    useEffect(() => {
        const generatedBubbles = Array.from({ length: 25 }).map((_, i) => ({
            id: i,
            size: Math.random() * 80 + 20, // 20px - 100px
            left: Math.random() * 100, // 0% - 100%
            duration: Math.random() * 15 + 10, // 10s - 25s
            delay: Math.random() * 10,
        }));
        setBubbles(generatedBubbles);
    }, []);

    return (
        <div className="dynamic-background-container" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            overflow: 'hidden',
            // Soft Purple/Pink Gradient (Image 1 style)
            background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
        }}>
            {/* Grid Overlay for texture */}
            <div className="grid-overlay" style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                pointerEvents: 'none'
            }}></div>

            {bubbles.map((bubble) => (
                <motion.div
                    key={bubble.id}
                    className="bubble"
                    initial={{
                        y: '120vh',
                        x: `${bubble.left}vw`,
                        scale: 0.5,
                        opacity: 0
                    }}
                    animate={{
                        y: '-20vh',
                        opacity: [0, 0.8, 0.8, 0], // Fade in, stay, then pop (fade out)
                        scale: [0.5, 1, 1.2, 1.5], // Grow slightly
                        x: [
                            `${bubble.left}vw`,
                            `${bubble.left + (Math.random() * 10 - 5)}vw`,
                            `${bubble.left - (Math.random() * 10 - 5)}vw`
                        ]
                    }}
                    transition={{
                        duration: bubble.duration,
                        repeat: Infinity,
                        delay: bubble.delay,
                        ease: "linear",
                        times: [0, 0.1, 0.9, 1]
                    }}
                    style={{
                        position: 'absolute',
                        width: `${bubble.size}px`,
                        height: `${bubble.size}px`,
                        borderRadius: '50%',
                        // Glassy Bubble Style
                        background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.1) 60%, rgba(255, 255, 255, 0.05) 100%)',
                        boxShadow: 'inset -5px -5px 15px rgba(255, 255, 255, 0.1), inset 5px 5px 15px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(2px)'
                    }}
                />
            ))}
        </div>
    );
};

export default DynamicBackground;
