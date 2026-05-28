import { CLOSE_CONFETTI } from './close-effect-constants';

/**
 * Shoot a burst of confetti particles from screen coordinates (x, y).
 * Pure DOM + requestAnimationFrame, no external libraries.
 */
export function shootConfetti(x: number, y: number): void {
  try {
    const {
      particleCount,
      colors,
      sizeRange,
      speedRange,
      upwardBias,
      gravity,
      durationRange,
      rotation,
    } = CLOSE_CONFETTI;

    for (let i = 0; i < particleCount; i++) {
      const el = document.createElement('div');

      const isCircle = Math.random() > 0.5;
      const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
      const color = colors[Math.floor(Math.random() * colors.length)];

      el.style.cssText = [
        'position: fixed',
        `left: ${x}px`,
        `top: ${y}px`,
        `width: ${size}px`,
        `height: ${size}px`,
        `background: ${color}`,
        `border-radius: ${isCircle ? '50%' : '2px'}`,
        'pointer-events: none',
        'z-index: 9999',
        'transform: translate(-50%, -50%)',
        'opacity: 1',
      ].join('; ');

      document.body.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed + upwardBias;

      const startTime = performance.now();
      const duration = durationRange[0] + Math.random() * (durationRange[1] - durationRange[0]);

      function frame(now: number): void {
        const elapsed = (now - startTime) / 1000;
        const progress = elapsed / (duration / 1000);

        if (progress >= 1) {
          el.remove();
          return;
        }

        const px = vx * elapsed;
        const py = vy * elapsed + 0.5 * gravity * elapsed * elapsed;
        const opacity = progress < 0.5 ? 1 : 1 - (progress - 0.5) * 2;
        const rotateAngle = elapsed * rotation * (isCircle ? 0 : 1);

        el.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px)) rotate(${rotateAngle}deg)`;
        el.style.opacity = String(opacity);

        requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }
  } catch {
    // DOM not available or other error -- fail silently
  }
}
