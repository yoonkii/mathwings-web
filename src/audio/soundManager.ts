/**
 * Manages game sound effects, BGM, and title music.
 * Uses Web Audio API OscillatorNode for synthesized SFX and
 * HTMLAudioElement for BGM playback.
 * Ported from Android SoundManager.kt.
 */

import { getBgmVolume, setBgmVolume, getSfxVolume, setSfxVolume } from '../data/settingsStore';

// --- SFX tone definitions (matching Android ToneGenerator) ---

interface ToneDefinition {
  frequency: number;
  type: OscillatorType;
  durationMs: number;
}

interface TwoToneDefinition {
  tones: ToneDefinition[];
}

const TONE_FLAP: ToneDefinition = { frequency: 880, type: 'sine', durationMs: 80 };
const TONE_CORRECT: ToneDefinition = { frequency: 1200, type: 'sine', durationMs: 100 };
const TONE_WRONG: ToneDefinition = { frequency: 300, type: 'sawtooth', durationMs: 150 };
const TONE_HIT: ToneDefinition = { frequency: 200, type: 'triangle', durationMs: 100 };
const TONE_SCORE: TwoToneDefinition = {
  tones: [
    { frequency: 1400, type: 'sine', durationMs: 60 },
    { frequency: 1800, type: 'sine', durationMs: 60 },
  ],
};
const TONE_KEY_PRESS: ToneDefinition = { frequency: 600, type: 'sine', durationMs: 30 };

// --- BGM file paths ---

const TITLE_BGM_PATH = '/audio/title_bgm.mp3';
const GAME_BGM_PATHS = ['/audio/bgm_1.mp3', '/audio/bgm_2.mp3'];
const GAME_OVER_MUSIC_PATH = '/audio/game_over.mp3';

// --- Fade-out configuration ---

const GAME_OVER_FADE_STEPS = 30;
const GAME_OVER_FADE_DURATION_MS = 3000;
const GAME_OVER_VOLUME_BOOST = 1.2;

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private sfxGainNode: GainNode | null = null;

  private titleBgmAudio: HTMLAudioElement | null = null;
  private gameBgmAudio: HTMLAudioElement | null = null;
  private gameOverAudio: HTMLAudioElement | null = null;

  private fadeOutTimerId: ReturnType<typeof setTimeout> | null = null;
  private fadeOutIntervalId: ReturnType<typeof setInterval> | null = null;

  private _bgmVolume: number;
  private _sfxVolume: number;

  constructor() {
    this._bgmVolume = getBgmVolume();
    this._sfxVolume = getSfxVolume();
  }

  // --- AudioContext lifecycle ---

  /**
   * Resume or create the AudioContext after a user interaction.
   * Browsers block autoplay until a user gesture triggers context resume.
   */
  ensureAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.sfxGainNode = this.audioContext.createGain();
      this.sfxGainNode.gain.value = this._sfxVolume;
      this.sfxGainNode.connect(this.audioContext.destination);
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {
        // Context resume may fail in restricted environments
      });
    }
  }

  // --- Volume getters/setters ---

  get bgmVolume(): number {
    return this._bgmVolume;
  }

  set bgmVolume(value: number) {
    this._bgmVolume = Math.max(0, Math.min(1, value));
    setBgmVolume(this._bgmVolume);

    // Apply to all active BGM audio elements immediately
    if (this.titleBgmAudio) {
      this.titleBgmAudio.volume = this._bgmVolume;
    }
    if (this.gameBgmAudio) {
      this.gameBgmAudio.volume = this._bgmVolume;
    }
    if (this.gameOverAudio) {
      this.gameOverAudio.volume = Math.min(this._bgmVolume * GAME_OVER_VOLUME_BOOST, 1);
    }
  }

  get sfxVolume(): number {
    return this._sfxVolume;
  }

  set sfxVolume(value: number) {
    this._sfxVolume = Math.max(0, Math.min(1, value));
    setSfxVolume(this._sfxVolume);

    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this._sfxVolume;
    }
  }

  // --- Title BGM ---

  startTitleBgm(): void {
    this.stopTitleBgm();
    this.titleBgmAudio = this.createBgmAudio(TITLE_BGM_PATH, true);
    this.playAudioSafe(this.titleBgmAudio);
  }

  stopTitleBgm(): void {
    this.stopAndCleanupAudio(this.titleBgmAudio);
    this.titleBgmAudio = null;
  }

  // --- Game BGM ---

  startBgm(): void {
    this.stopBgm();
    const trackIndex = Math.floor(Math.random() * GAME_BGM_PATHS.length);
    const trackPath = GAME_BGM_PATHS[trackIndex];
    this.gameBgmAudio = this.createBgmAudio(trackPath, true);
    this.playAudioSafe(this.gameBgmAudio);
  }

  stopBgm(): void {
    this.stopAndCleanupAudio(this.gameBgmAudio);
    this.gameBgmAudio = null;
  }

  // --- Game Over Music ---

  playGameOverMusic(): void {
    this.stopGameOverMusic();
    const boostedVolume = Math.min(this._bgmVolume * GAME_OVER_VOLUME_BOOST, 1);
    this.gameOverAudio = this.createBgmAudio(GAME_OVER_MUSIC_PATH, false);
    this.gameOverAudio.volume = boostedVolume;
    this.playAudioSafe(this.gameOverAudio);

    // Auto fade-out after 3 seconds (matching Android behavior)
    this.startGameOverFadeOut(boostedVolume);
  }

  stopGameOverMusic(): void {
    this.cancelGameOverFade();
    this.stopAndCleanupAudio(this.gameOverAudio);
    this.gameOverAudio = null;
  }

  // --- Pause / Resume ---

  pauseAll(): void {
    this.pauseAudioSafe(this.titleBgmAudio);
    this.pauseAudioSafe(this.gameBgmAudio);
    this.pauseAudioSafe(this.gameOverAudio);
  }

  resumeAll(): void {
    this.resumeAudioSafe(this.titleBgmAudio);
    this.resumeAudioSafe(this.gameBgmAudio);
    this.resumeAudioSafe(this.gameOverAudio);
  }

  // --- SFX playback (synthesized oscillators) ---

  playFlap(): void {
    this.playSingleTone(TONE_FLAP);
  }

  playCorrect(): void {
    this.playSingleTone(TONE_CORRECT);
  }

  playWrong(): void {
    this.playSingleTone(TONE_WRONG);
  }

  playHit(): void {
    this.playSingleTone(TONE_HIT);
  }

  playScore(): void {
    this.playTwoToneSequence(TONE_SCORE);
  }

  playKeyPress(): void {
    this.playSingleTone(TONE_KEY_PRESS);
  }

  // --- Cleanup ---

  /**
   * Stop all audio and release the AudioContext.
   * Call when the game is unmounted.
   */
  release(): void {
    this.stopTitleBgm();
    this.stopBgm();
    this.stopGameOverMusic();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {
        // Ignore close errors
      });
    }
    this.audioContext = null;
    this.sfxGainNode = null;
  }

  // --- Private helpers: BGM ---

  private createBgmAudio(src: string, loop: boolean): HTMLAudioElement {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = this._bgmVolume;
    return audio;
  }

  private playAudioSafe(audio: HTMLAudioElement | null): void {
    if (!audio) return;
    audio.play().catch(() => {
      // NotAllowedError: browser blocked autoplay before user interaction
    });
  }

  private pauseAudioSafe(audio: HTMLAudioElement | null): void {
    if (!audio) return;
    try {
      if (!audio.paused) {
        audio.pause();
      }
    } catch {
      // Ignore pause errors
    }
  }

  private resumeAudioSafe(audio: HTMLAudioElement | null): void {
    if (!audio) return;
    this.playAudioSafe(audio);
  }

  private stopAndCleanupAudio(audio: HTMLAudioElement | null): void {
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.load();
    } catch {
      // Ignore cleanup errors
    }
  }

  // --- Private helpers: Game Over fade ---

  private startGameOverFadeOut(peakVolume: number): void {
    this.cancelGameOverFade();

    const intervalMs = GAME_OVER_FADE_DURATION_MS / GAME_OVER_FADE_STEPS;
    let remainingSteps = GAME_OVER_FADE_STEPS;

    this.fadeOutIntervalId = setInterval(() => {
      remainingSteps--;
      if (remainingSteps <= 0 || !this.gameOverAudio) {
        this.cancelGameOverFade();
        this.stopAndCleanupAudio(this.gameOverAudio);
        this.gameOverAudio = null;
        return;
      }

      const volume = (remainingSteps / GAME_OVER_FADE_STEPS) * peakVolume;
      try {
        if (this.gameOverAudio) {
          this.gameOverAudio.volume = Math.max(0, volume);
        }
      } catch {
        // Ignore volume adjustment errors during fade
      }
    }, intervalMs);
  }

  private cancelGameOverFade(): void {
    if (this.fadeOutTimerId !== null) {
      clearTimeout(this.fadeOutTimerId);
      this.fadeOutTimerId = null;
    }
    if (this.fadeOutIntervalId !== null) {
      clearInterval(this.fadeOutIntervalId);
      this.fadeOutIntervalId = null;
    }
  }

  // --- Private helpers: SFX oscillators ---

  private playSingleTone(tone: ToneDefinition): void {
    if (this._sfxVolume <= 0) return;
    if (!this.audioContext || !this.sfxGainNode) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const durationSec = tone.durationMs / 1000;

    const oscillator = ctx.createOscillator();
    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.frequency, now);
    oscillator.connect(this.sfxGainNode);
    oscillator.start(now);
    oscillator.stop(now + durationSec);
  }

  private playTwoToneSequence(definition: TwoToneDefinition): void {
    if (this._sfxVolume <= 0) return;
    if (!this.audioContext || !this.sfxGainNode) return;

    const ctx = this.audioContext;
    let startTime = ctx.currentTime;

    for (const tone of definition.tones) {
      const durationSec = tone.durationMs / 1000;

      const oscillator = ctx.createOscillator();
      oscillator.type = tone.type;
      oscillator.frequency.setValueAtTime(tone.frequency, startTime);
      oscillator.connect(this.sfxGainNode);
      oscillator.start(startTime);
      oscillator.stop(startTime + durationSec);

      startTime += durationSec;
    }
  }
}
