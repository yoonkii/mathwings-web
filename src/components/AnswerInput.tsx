'use client';

import { colors } from '../theme/colors';
import { InputFeedback } from '../domain/models';

interface AnswerInputProps {
  currentInput: string;
  feedback: InputFeedback;
}

export function AnswerInput({ currentInput, feedback }: AnswerInputProps) {
  const borderColor =
    feedback === InputFeedback.CORRECT
      ? colors.correctGreen
      : feedback === InputFeedback.INCORRECT
      ? colors.wrongRed
      : colors.terminalGreen + '40';

  return (
    <div
      className="w-full h-12 rounded-lg flex items-center justify-center transition-colors duration-150"
      style={{
        backgroundColor: colors.inputBackground,
        border: `2px solid ${borderColor}`,
      }}
    >
      <span
        className="font-dseg7 text-2xl font-bold tracking-widest"
        style={{ color: currentInput ? colors.inputText : colors.inputText + '30' }}
      >
        {currentInput || '---'}
      </span>
    </div>
  );
}
