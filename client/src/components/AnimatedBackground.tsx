import React, { useEffect } from 'react';
import '../styles/AnimatedBackground.css';

const AnimatedBackground: React.FC = () => {
  useEffect(() => {
    const container = document.querySelector('.animated-background');
    if (!container) return;

    const createDustParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle dust';
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.top = `${Math.random() * 26 + 92}vh`;
      particle.style.animationDuration = `${Math.random() * 18 + 30}s`;
      particle.style.animationDelay = `-${Math.random() * 44}s`;
      particle.style.setProperty('--particle-opacity', `${Math.random() * 0.22 + 0.16}`);
      const animations = ['ashRise1', 'ashRise2', 'ashRise3', 'ashRise4'];
      particle.style.animationName = animations[Math.floor(Math.random() * animations.length)];
      if (Math.random() < 0.18) particle.classList.add('large');
      if (Math.random() < 0.16) particle.classList.add('soft');
      return particle;
    };

    for (let i = 0; i < 90; i++) {
      container.appendChild(createDustParticle());
    }

    const createEmberParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle ember';
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.top = `${Math.random() * 6 + 98}vh`;
      particle.style.animationName = Math.random() < 0.5 ? 'emberRise1' : 'emberRise2';
      particle.style.animationDuration = `${Math.random() * 0.9 + 1.25}s`;
      particle.style.animationTimingFunction = 'linear';
      particle.style.animationIterationCount = '1';
      particle.style.animationFillMode = 'forwards';
      particle.addEventListener('animationend', () => particle.remove());
      container.appendChild(particle);
    };

    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleEmber = (delay?: number) => {
      timeoutId = setTimeout(() => {
        const burstSize = Math.random() < 0.12 ? 2 : 1;
        for (let i = 0; i < burstSize; i++) {
          createEmberParticle();
        }
        scheduleEmber(Math.random() * 2400 + 1000);
      }, delay ?? 900);
    };
    scheduleEmber();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(timeoutId);
      } else {
        scheduleEmber(Math.random() * 2400 + 1000);
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
