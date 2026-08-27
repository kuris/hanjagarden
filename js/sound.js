// sound.js — Web Audio API 기반의 효과음(SFX) 및 배경음악(BGM) 오디오 엔진

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimeout = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;

    // 로컬 스토리지에서 음소거 여부 불러오기
    try {
      this.isMuted = localStorage.getItem('hanja_garden_muted') === 'true';
    } catch (e) {
      this.isMuted = false;
    }
  }

  // 사용자 제스처 시 AudioContext 초기화
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('hanja_garden_muted', String(this.isMuted));
    } catch (e) {}

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  getMuted() {
    return this.isMuted;
  }

  // ─── SFX 효과음 ──────────────────────────────────────────

  // 타일 선택음
  playSelect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.06);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // 스왑 성공음
  playSwap() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.1);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  // 스왑 실패(제자리 복귀)음
  playSwapFail() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.setValueAtTime(200, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  // 3매치 팝 사운드 (콤보가 올라갈수록 경쾌하게 높은 음)
  playMatch(combo = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreqs = [440, 494, 554, 587, 659, 740, 830, 880, 988, 1108];
    const freq = baseFreqs[Math.min(combo - 1, baseFreqs.length - 1)];

    // 팝 타악기 성분
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq * 1.5, now);
    osc1.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.12);

    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.13);

    // 반짝이는 배음
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(freq * 2.5, now + 0.14);

    gain2.gain.setValueAtTime(0.2, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.15);
  }

  // 4매치 폭탄 아이템 생성음
  playBombSpawn() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554, 659, 880];
    notes.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.04;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  // 4매치 폭탄 폭발음 (쾅!)
  playBombExplode() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 저음 펀치
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.36);

    // 노이즈 버스트 (폭발 솨아악 효과)
    this.playNoise(0.3, 0.45);
  }

  // 5매치 슈퍼 무지개 아이템 생성음
  playSuperSpawn() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523, 659, 784, 1046, 1318, 1568];
    notes.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.045;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  // 5매치 슈퍼 대폭발음 (우주/레이저 + 대폭발)
  playSuperExplode() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 레이저 스윕
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(120, now + 0.45);

    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.46);

    // 강력한 서브우퍼 폭발
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, now);
    osc2.frequency.exponentialRampToValueAtTime(25, now + 0.55);

    gain2.gain.setValueAtTime(0.7, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now);
    osc2.stop(now + 0.56);

    this.playNoise(0.45, 0.5);
  }

  // 노이즈 버스트 헬퍼
  playNoise(duration = 0.2, volume = 0.3) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // 로우패스 필터로 부드러운 폭발 질감
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  // 승리/클리어 팡파레
  playWin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0,    d: 0.12 },
      { f: 659.25, t: 0.12, d: 0.12 },
      { f: 783.99, t: 0.24, d: 0.12 },
      { f: 1046.5, t: 0.36, d: 0.45 },
    ];

    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.35, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.01);
    });
  }

  // ─── BGM 배경음악 (절차적 생성 루프) ──────────────────────────

  startBGM() {
    if (this.bgmPlaying) return;
    this.initContext();
    this.bgmPlaying = true;
    this.scheduleBGM();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimeout) {
      clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }
  }

  scheduleBGM() {
    if (!this.bgmPlaying || !this.ctx) return;

    const tempo = 112; // BPM
    const beat = 60 / tempo;
    const sixteenth = beat / 4;

    // 밝고 아기자기한 C장조 멜로디 (C4, D4, E4, G4, A4, C5, D5, E5)
    // 4마디 루프
    const melody = [
      // 1마디
      { note: 523.25, time: 0 },
      { note: 659.25, time: beat * 0.5 },
      { note: 783.99, time: beat * 1.0 },
      { note: 1046.5, time: beat * 1.5 },
      { note: 880.00, time: beat * 2.0 },
      { note: 783.99, time: beat * 2.75 },
      { note: 659.25, time: beat * 3.25 },
      // 2마디
      { note: 587.33, time: beat * 4.0 },
      { note: 659.25, time: beat * 4.5 },
      { note: 783.99, time: beat * 5.0 },
      { note: 880.00, time: beat * 6.0 },
      { note: 783.99, time: beat * 7.0 },
      // 3마디
      { note: 659.25, time: beat * 8.0 },
      { note: 783.99, time: beat * 8.5 },
      { note: 880.00, time: beat * 9.0 },
      { note: 1046.5, time: beat * 9.5 },
      { note: 1174.6, time: beat * 10.0 },
      { note: 1046.5, time: beat * 10.75 },
      { note: 880.00, time: beat * 11.25 },
      // 4마디
      { note: 783.99, time: beat * 12.0 },
      { note: 659.25, time: beat * 13.0 },
      { note: 587.33, time: beat * 14.0 },
      { note: 523.25, time: beat * 15.0 },
    ];

    // 부드러운 베이스 라인
    const bass = [
      { note: 130.81, time: 0 },         // C3
      { note: 130.81, time: beat * 2 },
      { note: 174.61, time: beat * 4 },   // F3
      { note: 174.61, time: beat * 6 },
      { note: 146.83, time: beat * 8 },   // D3
      { note: 146.83, time: beat * 10 },
      { note: 196.00, time: beat * 12 },  // G3
      { note: 196.00, time: beat * 14 },
    ];

    const now = this.ctx.currentTime + 0.05;
    const totalDuration = beat * 16;

    // 멜로디 재생 (마림바/오르골 느낌의 사인파)
    melody.forEach(item => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + item.time;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(item.note, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.4);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(t);
      osc.stop(t + beat * 0.45);
    });

    // 베이스 재생 (따뜻한 트라이앵글파)
    bass.forEach(item => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + item.time;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.note, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + beat * 1.6);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(t);
      osc.stop(t + beat * 1.8);
    });

    // 다음 루프 예약
    this.bgmTimeout = setTimeout(() => {
      this.scheduleBGM();
    }, totalDuration * 1000 - 100);
  }
}

export const sound = new SoundEngine();
