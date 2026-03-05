'use client';

import { useState, useCallback } from 'react';
import { colors } from '../theme/colors';

interface NumericKeypadProps {
  onDigit: (digit: number) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  enabled: boolean;
}

type KeyType = { kind: 'digit'; value: number } | { kind: 'backspace' } | { kind: 'submit' };

const ROWS: KeyType[][] = [
  [{ kind: 'digit', value: 1 }, { kind: 'digit', value: 2 }, { kind: 'digit', value: 3 }],
  [{ kind: 'digit', value: 4 }, { kind: 'digit', value: 5 }, { kind: 'digit', value: 6 }],
  [{ kind: 'digit', value: 7 }, { kind: 'digit', value: 8 }, { kind: 'digit', value: 9 }],
  [{ kind: 'backspace' }, { kind: 'digit', value: 0 }, { kind: 'submit' }],
];

export function NumericKeypad({ onDigit, onBackspace, onSubmit, enabled }: NumericKeypadProps) {
  return (
    <div
      className="w-full flex flex-col gap-1.5 p-2"
      style={{ backgroundColor: colors.keypadBackground }}
    >
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1.5 w-full">
          {row.map((key, j) => (
            <KeypadButton
              key={j}
              keyDef={key}
              enabled={enabled}
              onPress={() => {
                if (key.kind === 'digit') onDigit(key.value);
                else if (key.kind === 'backspace') onBackspace();
                else onSubmit();
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function KeypadButton({
  keyDef,
  enabled,
  onPress,
}: {
  keyDef: KeyType;
  enabled: boolean;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  const bgColor = !enabled
    ? colors.keypadButton + '80'
    : pressed
    ? keyDef.kind === 'backspace'
      ? colors.backspaceButtonPressed
      : keyDef.kind === 'submit'
      ? colors.submitButtonPressed
      : colors.keypadButtonPressed
    : keyDef.kind === 'backspace'
    ? colors.backspaceButton
    : keyDef.kind === 'submit'
    ? colors.submitButton
    : colors.keypadButton;

  const textColor = enabled ? colors.keypadText : colors.keypadText + '80';

  const label =
    keyDef.kind === 'digit'
      ? keyDef.value.toString()
      : keyDef.kind === 'backspace'
      ? '\u232B'
      : '\u2713';

  const fontClass = keyDef.kind === 'digit' ? 'font-dseg7' : '';

  const handlePointerDown = useCallback(() => {
    if (!enabled) return;
    setPressed(true);
  }, [enabled]);

  const handlePointerUp = useCallback(() => {
    if (!enabled) return;
    setPressed(false);
    onPress();
  }, [enabled, onPress]);

  const handlePointerLeave = useCallback(() => {
    setPressed(false);
  }, []);

  return (
    <button
      className={`flex-1 h-14 rounded-lg flex items-center justify-center text-2xl font-bold select-none ${fontClass}`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        transition: 'background-color 0.05s',
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      disabled={!enabled}
    >
      {label}
    </button>
  );
}
