'use client';

import { memo, useState, useCallback, useRef, type MouseEvent } from 'react';
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

export const NumericKeypad = memo(function NumericKeypad({
  onDigit,
  onBackspace,
  onSubmit,
  enabled,
}: NumericKeypadProps) {
  return (
    <div
      className="w-full h-full flex flex-col gap-1.5 p-2"
      style={{ backgroundColor: colors.keypadBackground }}
    >
      {ROWS.map((row, i) => (
        <div key={i} className="flex flex-1 min-h-0 gap-1.5 w-full">
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
});

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
  // Mirror of `pressed` for pointer handlers (avoids stale state in callbacks)
  const pressedRef = useRef(false);

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
    pressedRef.current = true;
    setPressed(true);
  }, [enabled]);

  const handlePointerUp = useCallback(() => {
    if (!enabled) return;
    // Only fire if the press started on this button (not a stray pointerup)
    if (!pressedRef.current) return;
    pressedRef.current = false;
    setPressed(false);
    onPress();
  }, [enabled, onPress]);

  const handlePointerLeave = useCallback(() => {
    pressedRef.current = false;
    setPressed(false);
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      // detail === 0 means keyboard/assistive-tech activation; pointer
      // clicks (detail >= 1) are already handled by pointerup
      if (!enabled) return;
      if (e.detail === 0) onPress();
    },
    [enabled, onPress]
  );

  const ariaLabel =
    keyDef.kind === 'backspace' ? 'Backspace' : keyDef.kind === 'submit' ? 'Submit answer' : undefined;

  return (
    <button
      className={`keypad-btn flex-1 h-full min-h-0 rounded-lg flex items-center justify-center text-2xl font-bold select-none cursor-pointer ${fontClass}`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        transition: 'background-color 0.05s',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      onClick={handleClick}
      disabled={!enabled}
      aria-label={ariaLabel}
    >
      {label}
    </button>
  );
}
