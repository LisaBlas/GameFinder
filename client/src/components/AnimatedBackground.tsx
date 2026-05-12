import React, { useEffect } from 'react';
import '../styles/AnimatedBackground.css';

const AnimatedBackground: React.FC = () => {
  useEffect(() => {
    const container = document.querySelector('.animated-background');
    if (!container) return;

    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.top = `${Math.random() * 100}vh`;
      particle.style.animationDuration = `${Math.random() * 20 + 20}s`;
      particle.style.animationDelay = `-${Math.random() * 40}s`;
      particle.style.opacity = `${Math.random() * 0.4 + 0.35}`;
      const animations = ['drift1', 'drift2', 'drift3', 'drift4'];
      particle.style.animationName = animations[Math.floor(Math.random() * animations.length)];
      if (Math.random() < 0.2) particle.classList.add('emerald');
      if (Math.random() < 0.12) particle.classList.add('large');
      if (Math.random() < 0.18) particle.classList.add('shiny');
      return particle;
    };

    for (let i = 0; i < 65; i++) {
      container.appendChild(createParticle());
    }

    const createGoldenParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle golden';

      const type = Math.floor(Math.random() * 4);
      if (type === 0) {
        particle.style.left = '0';
        particle.style.top = `${Math.random() * 80 + 10}vh`;
        particle.style.animationName = 'goldenFly1';
      } else if (type === 1) {
        particle.style.left = '0';
        particle.style.top = `${Math.random() * 80 + 10}vh`;
        particle.style.animationName = 'goldenFly2';
      } else if (type === 2) {
        particle.style.left = `${Math.random() * 60}vw`;
        particle.style.top = '0';
        particle.style.animationName = 'goldenFly3';
      } else {
        particle.style.left = `${Math.random() * 40}vw`;
        particle.style.top = '100vh';
        particle.style.animationName = 'goldenFly4';
      }

      particle.style.animationDuration = `${Math.random() * 1.5 + 2}s`;
      particle.style.animationTimingFunction = 'ease-in-out';
      particle.style.animationIterationCount = '1';
      particle.style.animationFillMode = 'forwards';
      particle.addEventListener('animationend', () => particle.remove());
      container.appendChild(particle);
    };

    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleGolden = (delay?: number) => {
      timeoutId = setTimeout(() => {
        createGoldenParticle();
        scheduleGolden(Math.random() * 4000 + 3000);
      }, delay ?? 2000);
    };
    scheduleGolden();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(timeoutId);
      } else {
        scheduleGolden(Math.random() * 4000 + 3000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      container.innerHTML = '';
    };
  }, []);

  return (
    <div className="animated-background" />
  );
};

export default AnimatedBackground;
