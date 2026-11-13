/**
 * Bộ tạo âm thanh hiệu ứng điện ảnh tổng hợp bằng Web Audio API thuần (Không cần tải file mp3 bên ngoài)
 */
class CinemaSoundFx {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Tiếng Boom rền vang mở đầu phim chuẩn IMAX / Dolby Atmos
  playCinemaIntroBoom() {
    try {
      this.init();
      const now = this.ctx.currentTime;

      // 1. Sub Bass Rền Vang
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 1.8);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 2.5);

      // 2. High Shimmer Chime
      const shimmer = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();

      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(520, now + 0.1);
      shimmer.frequency.exponentialRampToValueAtTime(880, now + 1.2);

      shimmerGain.gain.setValueAtTime(0.3, now + 0.1);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      shimmer.connect(shimmerGain);
      shimmerGain.connect(this.ctx.destination);

      shimmer.start(now + 0.1);
      shimmer.stop(now + 1.5);
    } catch (e) {
      console.warn('Audio FX error:', e);
    }
  }

  // Tiếng Click vé / Tiếng máy in vé giòn giã
  playTicketChime() {
    try {
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.08);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }
}

export const cinemaSound = new CinemaSoundFx();
