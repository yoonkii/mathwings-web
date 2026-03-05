/**
 * localStorage wrapper for app settings persistence.
 * Stores BGM volume and SFX volume.
 * Ported from Android SettingsPreferences.kt.
 */

const KEY_BGM_VOLUME = 'mathwings_bgm_volume';
const KEY_SFX_VOLUME = 'mathwings_sfx_volume';
const DEFAULT_BGM_VOLUME = 0.5;
const DEFAULT_SFX_VOLUME = 0.5;

/**
 * Get the BGM volume setting.
 */
export function getBgmVolume(): number {
  return getFloatSetting(KEY_BGM_VOLUME, DEFAULT_BGM_VOLUME);
}

/**
 * Set the BGM volume setting.
 */
export function setBgmVolume(volume: number): void {
  setFloatSetting(KEY_BGM_VOLUME, volume);
}

/**
 * Get the SFX volume setting.
 */
export function getSfxVolume(): number {
  return getFloatSetting(KEY_SFX_VOLUME, DEFAULT_SFX_VOLUME);
}

/**
 * Set the SFX volume setting.
 */
export function setSfxVolume(volume: number): void {
  setFloatSetting(KEY_SFX_VOLUME, volume);
}

// ── Internal helpers ────────────────────────────────────────────────────────

function getFloatSetting(key: string, defaultValue: number): number {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return defaultValue;
    }
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setFloatSetting(key: string, value: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, String(value));
  } catch {
    // localStorage full or unavailable -- silently fail
  }
}
