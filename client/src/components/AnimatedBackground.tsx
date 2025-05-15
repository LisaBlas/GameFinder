import React, { useEffect } from 'react';
import '../styles/AnimatedBackground.css';

const AnimatedBackground: React.FC = () => {
  useEffect(() => {
    // Create particles
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random starting position
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.top = `${Math.random() * 100}vh`;
      
      // Random animation duration (between 20 and 40 seconds)
      particle.style.animationDuration = `${Math.random() * 20 + 20}s`;
      
      // Random animation delay
      particle.style.animationDelay = `-${Math.random() * 40}s`;
      
      // Random opacity
      particle.style.opacity = `${Math.random() * 0.5 + 0.2}`;
      
      // Random animation name (one of four directions)
      const animations = ['drift1', 'drift2', 'drift3', 'drift4'];
      particle.style.animationName = animations[Math.floor(Math.random() * animations.length)];
      
      return particle;
    };

    const container = document.querySelector('.animated-background');
    if (container) {
      // Add particles
      for (let i = 0; i < 50; i++) {
        container.appendChild(createParticle());
      }
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="animated-background" />
  );
};

export default AnimatedBackground; 