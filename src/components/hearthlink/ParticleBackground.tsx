'use client';

import React, { useEffect, useState } from 'react';
import styles from './ParticleBackground.module.css';

const ParticleBackground: React.FC = () => {
  const [particles, setParticles] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const numParticles = 50; 
      const newParticles = Array.from({ length: numParticles }).map((_, i) => {
        const style = {
          '--particle-x-start': `${Math.random() * 100}vw`,
          '--particle-x-end': `${Math.random() * 100}vw`,
          '--particle-y-end': `-${Math.random() * 100 + 100}vh`, // Corrected to be negative for upward movement
          '--particle-size': `${Math.random() * 3 + 1}px`,
          '--particle-duration': `${Math.random() * 5 + 5}s`,
          '--particle-delay': `${Math.random() * 5}s`,
          '--particle-color-start': 'hsla(var(--primary), 0.9)',
          '--particle-color-mid': 'hsla(var(--accent), 0.7)',
          '--particle-color-end': 'hsla(var(--accent), 0)',
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
