import React, { useEffect } from 'react';
import '../styles/AnimatedBackground.css';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1200;
const LOW_END_CPU_THRESHOLD = 4;
const LOW_END_MEMORY_THRESHOLD = 4;
const EMBER_SESSION_STORAGE_KEY = 'animated-background-ember-count';

const isLowEndDevice = () => {
  const { hardwareConcurrency, deviceMemory } = navigator as Navigator & {
    deviceMemory?: number;
  };

  return (
    hardwareConcurrency <= LOW_END_CPU_THRESHOLD ||
    (deviceMemory !== undefined && deviceMemory <= LOW_END_MEMORY_THRESHOLD)
  );
};

const getDustParticleCount = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 12;
  }

  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    return isLowEndDevice() ? 18 : 24;
  }

  if (window.innerWidth <= TABLET_BREAKPOINT) {
    return isLowEndDevice() ? 28 : 40;
  }

  return isLowEndDevice() ? 44 : 60;
};

const getMaxEmbersPerSession = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 0;
  }

  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    return isLowEndDevice() ? 8 : 12;
  }

  if (window.innerWidth <= TABLET_BREAKPOINT) {
    return isLowEndDevice() ? 12 : 18;
  }

  return isLowEndDevice() ? 18 : 28;
};

const readSessionEmberCount = () => {
  try {
    const value = window.sessionStorage.getItem(EMBER_SESSION_STORAGE_KEY);
    return value ? Number.parseInt(value, 10) || 0 : 0;
  } catch {
    return 0;
  }
};

const writeSessionEmberCount = (count: number) => {
  try {
    window.sessionStorage.setItem(EMBER_SESSION_STORAGE_KEY, String(count));
  } catch {
    // Ignore storage access failures; the runtime cap still applies for this mount.
  }
};

const AnimatedBackground: React.FC = () => {
  useEffect(() => {
    const container = document.querySelector('.animated-background');
    if (!container) return;
    const dustParticleCount = getDustParticleCount();
    const maxEmbersPerSession = getMaxEmbersPerSession();

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

    for (let i = 0; i < dustParticleCount; i++) {
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

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let emberCount = readSessionEmberCount();

    const scheduleEmber = (delay?: number) => {
      if (document.hidden || emberCount >= maxEmbersPerSession) {
        return;
      }

      timeoutId = setTimeout(() => {
        if (document.hidden || emberCount >= maxEmbersPerSession) {
          return;
        }

        const burstSize = Math.random() < 0.12 ? 2 : 1;
        const availableSlots = maxEmbersPerSession - emberCount;
        const spawnCount = Math.min(burstSize, availableSlots);

        for (let i = 0; i < spawnCount; i++) {
          createEmberParticle();
        }
        emberCount += spawnCount;
        writeSessionEmberCount(emberCount);

        if (emberCount < maxEmbersPerSession) {
          scheduleEmber(Math.random() * 2400 + 1000);
        }
      }, delay ?? 900);
    };

    if (maxEmbersPerSession > 0) {
      scheduleEmber();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(timeoutId);
      } else if (emberCount < maxEmbersPerSession) {
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
