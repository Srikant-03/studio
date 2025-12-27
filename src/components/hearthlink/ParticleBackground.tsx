'use client';

import React, { useEffect, useState } from 'react';
import styles from './ParticleBackground.module.css';

const ParticleBackground: React.FC = () => {
  const [particles, setParticles] = useState<JSX.Element[]>([]);

  useEffect(() => {
    // This effect runs only on the client, avoiding hydration mismatches.
    const generateParticles = () => {
      const numParticles = 80;
      const newParticles = Array.from({ length: numParticles }).map((_, i) => {
        // Randomize spark colors: Fire (Orange/Red/Yellow)
        const hue = Math.random() < 0.2 ? 45 : (Math.random() < 0.6 ? 25 : 10); // 20% Yellow, 40% Orange, 40% Red
        const sat = Math.random() * 20 + 80; // High saturation
        const light = Math.random() * 20 + 50; // Medium-High lightness

        const style = {
          '--particle-x-start': `${Math.random() * 100}vw`,
          '--particle-x-end': `${Math.random() * 100}vw`,
          '--particle-size': `${Math.random() * 6 + 4}px`, // Larger sparks (4-10px)
          '--particle-duration': `${Math.random() * 8 + 4}s`, // Slower float
          '--particle-delay': `-${Math.random() * 10}s`, // Start immediately at random points
          '--particle-color-start': `hsla(${hue}, ${sat}%, ${light + 20}%, 1)`, // Brighter start
          '--particle-color-mid': `hsla(${hue}, ${sat}%, ${light}%, 0.8)`, // Visible mid
          '--particle-color-end': `hsla(${hue}, ${sat}%, ${light - 20}%, 0)`,
        } as React.CSSProperties;

        return <div key={i} className={styles.particle} style={style} />;
      });
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return <div className={styles.particleContainer}>{particles}</div>;
};

export default ParticleBackground;
