import confetti from 'canvas-confetti';

export class ConfettiService {
  private static readonly defaults = {
    origin: { y: 0.7 },
    spread: 90,
    ticks: 400,
    gravity: 1.2,
    decay: 0.94,
    startVelocity: 45,
    colors: ['#37bd7e', '#34D399', '#6EE7B7', '#059669', '#047857']
  };

  private static fire(particleRatio: number, opts: any) {
    confetti({
      ...this.defaults,
      ...opts,
      particleCount: Math.floor(200 * particleRatio)
    });
  }

  public static celebrate() {
    // Left side burst
    this.fire(0.25, {
      spread: 26,
      startVelocity: 55,
      origin: { x: 0.2, y: 0.9 }
    });

    // Right side burst
    this.fire(0.25, {
      spread: 26,
      startVelocity: 55,
      origin: { x: 0.8, y: 0.9 }
    });

    // Center burst
    this.fire(0.35, {
      spread: 100,
      decay: 0.91,
      origin: { x: 0.5, y: 0.8 }
    });

    // Delayed follow-up bursts
    setTimeout(() => {
      this.fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        origin: { x: 0.3, y: 0.8 }
      });
    }, 200);

    setTimeout(() => {
      this.fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        origin: { x: 0.7, y: 0.8 }
      });
    }, 200);

    // Final celebratory burst
    setTimeout(() => {
      this.fire(0.2, {
        spread: 150,
        startVelocity: 45,
        decay: 0.91,
        origin: { x: 0.5, y: 0.9 }
      });
    }, 400);
  }
}