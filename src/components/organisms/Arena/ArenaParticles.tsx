import type { CSSProperties } from 'react';
import styles from './Arena.module.css';

// Seeded variation keeps the scattered arrangement stable across hydration and rerenders.
function createParticles() {
  let seed = 417;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  return Array.from({ length: 24 }, (_, index) => {
    const angle = random() * Math.PI * 2;
    const radius = 0.35 + Math.sqrt(random()) * 0.55;
    const size = 5 + random() * 14;
    return {
      id: `particle-${index}`,
      style: {
        left: `${50 + Math.cos(angle) * radius * 47}%`,
        top: `${50 + Math.sin(angle) * radius * 45}%`,
        width: `${size}px`,
        height: `${size}px`,
        filter: `blur(${4 + random() * 6}px)`,
        animationDuration: `${12 + random() * 14}s`,
        animationDelay: `${-random() * 30}s`,
        '--particle-opacity': 0.1 + random() * 0.55,
        '--particle-drift-x': `${(random() - 0.5) * 180}px`,
        '--particle-drift-y': `${-48 - random() * 96}px`,
      } as CSSProperties,
    };
  });
}

const PARTICLES = createParticles();

export function ArenaParticles() {
  return (
    <div className={styles.particles} aria-hidden="true" data-testid="arena-particles">
      {PARTICLES.map(({ id, style }) => (
        <span key={id} className={styles.particle} style={style} />
      ))}
    </div>
  );
}
