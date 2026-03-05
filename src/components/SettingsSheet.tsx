'use client';

import { useState } from 'react';
import { colors } from '../theme/colors';
import { SoundManager } from '../audio/soundManager';

interface SettingsSheetProps {
  soundManager: SoundManager;
  onDismiss: () => void;
}

export function SettingsSheet({ soundManager, onDismiss }: SettingsSheetProps) {
  const [bgmVol, setBgmVol] = useState(soundManager.bgmVolume);
  const [sfxVol, setSfxVol] = useState(soundManager.sfxVolume);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm mx-8 rounded-2xl p-6"
        style={{
          backgroundColor: colors.keypadBackground,
          border: `1px solid ${colors.terminalGreen}4D`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2
          className="text-center text-2xl font-bold tracking-widest mb-2"
          style={{ color: colors.terminalGreen }}
        >
          SETTINGS
        </h2>

        {/* Divider */}
        <div
          className="w-20 h-0.5 mx-auto mb-6"
          style={{ backgroundColor: colors.terminalGreen + '66' }}
        />

        {/* BGM Volume */}
        <SliderRow
          label="BGM VOLUME"
          value={bgmVol}
          displayText={`${Math.round(bgmVol * 100)}%`}
          onChange={(v) => {
            setBgmVol(v);
            soundManager.bgmVolume = v;
          }}
        />

        <div className="h-4" />

        {/* SFX Volume */}
        <SliderRow
          label="SFX VOLUME"
          value={sfxVol}
          displayText={sfxVol > 0 ? `${Math.round(sfxVol * 100)}%` : 'OFF'}
          onChange={(v) => {
            setSfxVol(v);
            soundManager.sfxVolume = v;
          }}
        />

        <div className="h-7" />

        {/* Done button */}
        <button
          className="w-full h-12 rounded-xl text-lg font-bold tracking-widest text-white"
          style={{ backgroundColor: colors.submitButton }}
          onClick={onDismiss}
        >
          DONE
        </button>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  displayText,
  onChange,
}: {
  label: string;
  value: number;
  displayText: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span
          className="text-sm font-medium tracking-widest"
          style={{ color: colors.terminalGreen + 'CC' }}
        >
          {label}
        </span>
        <span
          className="text-sm font-bold tracking-wider"
          style={{ color: value > 0 ? colors.terminalGreen : '#ffffff66' }}
        >
          {displayText}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-emerald-500"
        style={{
          accentColor: colors.terminalGreen,
        }}
      />
    </div>
  );
}
