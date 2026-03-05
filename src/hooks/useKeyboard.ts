import { useEffect } from 'react';

interface KeyboardHandlers {
  onDigitPressed: (digit: number) => void;
  onBackspacePressed: () => void;
  onSubmitPressed: () => void;
  onStartGame?: () => void;
  enabled: boolean;
}

export function useKeyboard({
  onDigitPressed,
  onBackspacePressed,
  onSubmitPressed,
  onStartGame,
  enabled,
}: KeyboardHandlers) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Digits 0-9
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        onDigitPressed(parseInt(e.key));
        return;
      }

      // Numpad digits
      if (e.code.startsWith('Numpad') && e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        onDigitPressed(parseInt(e.key));
        return;
      }

      // Enter or NumpadEnter → submit
      if (e.key === 'Enter') {
        e.preventDefault();
        onSubmitPressed();
        return;
      }

      // Backspace → delete last digit
      if (e.key === 'Backspace') {
        e.preventDefault();
        onBackspacePressed();
        return;
      }

      // Space → start game (when in READY state)
      if (e.key === ' ' && onStartGame) {
        e.preventDefault();
        onStartGame();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onDigitPressed, onBackspacePressed, onSubmitPressed, onStartGame]);
}
