/**
 * Wall Street Theme Colors.
 * Ported from Android Color.kt.
 * All hex values match the Android source exactly.
 */

// Sky and Background (Night financial district)
export const SkyBlue = '#0D1B2A';
export const SkyBlueDark = '#1B263B';
export const SkyMid = '#152238';

// Ground / Trading Floor
export const TradingFloor = '#1A202C';
export const TradingFloorLight = '#2D3748';
export const GoldAccent = '#D69E2E';

// Building Colors
export const BuildingDark = '#1A202C';
export const BuildingMid = '#2D3748';
export const BuildingLight = '#4A5568';
export const WindowGold = '#D69E2E';

// Bird / Analyst Colors
export const SuitNavy = '#1E3A5F';
export const SuitNavyLight = '#2C5282';
export const ShirtWhite = '#FFFFFF';
export const TieRed = '#E53E3E';
export const SkinTone = '#F6AD55';
export const HairDark = '#2D3748';

// Stock Bar (Pipe) Colors - Bearish (Red)
export const StockRed = '#E53E3E';
export const StockRedLight = '#FC8181';
export const StockRedDark = '#C53030';

// Stock Bar (Pipe) Colors - Bullish (Blue)
export const StockBlue = '#3182CE';
export const StockBlueLight = '#63B3ED';
export const StockBlueDark = '#2B6CB0';

// Stock Bar (Pipe) Colors - Bullish (Green)
export const StockGreen = '#38A169';
export const StockGreenLight = '#68D391';
export const StockGreenDark = '#276749';

// Terminal / Ticker Colors
export const TerminalBlack = '#1A202C';
export const TerminalGreen = '#48BB78';
export const TerminalAmber = '#ED8936';

// Keypad Colors (Trading Terminal Style)
export const KeypadBackground = '#1A202C';
export const KeypadButton = '#2D3748';
export const KeypadButtonPressed = '#4A5568';
export const KeypadText = '#FFFFFF';

// Action Button Colors
export const SubmitButton = '#38A169';
export const SubmitButtonPressed = '#276749';
export const BackspaceButton = '#E53E3E';
export const BackspaceButtonPressed = '#C53030';

// Feedback Colors
export const CorrectGreen = '#48BB78';
export const WrongRed = '#E53E3E';
export const ScoreWhite = '#FFFFFF';
export const ScoreGold = '#D69E2E';

// Problem Display (Terminal Style)
// Note: Android uses 0xE6 alpha (90%) for ProblemBackground
export const ProblemBackground = 'rgba(26, 32, 44, 0.9)';
export const ProblemText = '#48BB78';
export const InputBackground = '#2D3748';
export const InputText = '#FFFFFF';

// Theme Colors
export const Primary = '#3182CE';
export const PrimaryDark = '#2B6CB0';
export const Secondary = '#D69E2E';
export const Background = '#0D1B2A';
export const Surface = '#1A202C';
export const OnPrimary = '#FFFFFF';
export const OnSecondary = '#1A202C';
export const OnBackground = '#FFFFFF';
export const OnSurface = '#FFFFFF';

// Game Over Screen
// Note: Android uses 0xE6 alpha (90%) for GameOverBackground
export const GameOverBackground = 'rgba(0, 0, 0, 0.9)';
export const NewHighScoreGold = '#D69E2E';

// Consolidated colors object for component imports
export const colors = {
  skyBlue: SkyBlue,
  skyBlueDark: SkyBlueDark,
  tradingFloor: TradingFloor,
  tradingFloorLight: TradingFloorLight,
  goldAccent: GoldAccent,
  stockRed: StockRed,
  stockRedLight: StockRedLight,
  stockRedDark: StockRedDark,
  stockBlue: StockBlue,
  stockBlueLight: StockBlueLight,
  stockBlueDark: StockBlueDark,
  terminalGreen: TerminalGreen,
  keypadBackground: KeypadBackground,
  keypadButton: KeypadButton,
  keypadButtonPressed: KeypadButtonPressed,
  keypadText: KeypadText,
  submitButton: SubmitButton,
  submitButtonPressed: SubmitButtonPressed,
  backspaceButton: BackspaceButton,
  backspaceButtonPressed: BackspaceButtonPressed,
  correctGreen: CorrectGreen,
  wrongRed: WrongRed,
  scoreWhite: ScoreWhite,
  scoreGold: ScoreGold,
  problemBackground: ProblemBackground,
  problemText: ProblemText,
  inputBackground: InputBackground,
  inputText: InputText,
  gameOverBackground: GameOverBackground,
  newHighScoreGold: NewHighScoreGold,
};
