// ─── Core Ludo Types ────────────────────────────────────────────────────────

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';
export type GameMode = 'computer' | 'private' | 'local';
export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type TokenState = 'base' | 'active' | 'home';
export type GamePhase = 'rolling' | 'moving' | 'waiting' | 'finished';

export interface Position {
  row: number;
  col: number;
}

export interface Token {
  id: string;          // e.g. "red-0"
  color: PlayerColor;
  index: number;       // 0-3
  state: TokenState;
  position: number;    // -1 = base, 0-56 = track/home path, 57 = home
  stepsMoved: number;
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
  isConnected: boolean;
  isHost: boolean;
  tokens: Token[];
  finishPosition?: number; // 1st, 2nd, 3rd, 4th
  avatar: string;
  xp: number;
  level: number;
  wins: number;
  losses: number;
}

export interface GameEvent {
  id: string;
  timestamp: number;
  type: 'roll' | 'move' | 'capture' | 'home' | 'win' | 'six' | 'skip' | 'enter';
  playerColor: PlayerColor;
  playerName: string;
  description: string;
  diceValue?: number;
}

export interface GameState {
  id: string;
  mode: GameMode;
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  currentDiceValue: number | null;
  consecutiveSixes: number;
  isRolling: boolean;
  diceRolled: boolean;
  validMoves: ValidMove[];
  events: GameEvent[];
  finishedPlayers: PlayerColor[];
  winner: PlayerColor | null;
  turnCount: number;
  startedAt: number;
}

export interface ValidMove {
  tokenId: string;
  tokenColor: PlayerColor;
  tokenIndex: number;
  fromPosition: number;
  toPosition: number;
  willCapture: boolean;
  capturedTokenId?: string;
  willEnterHome: boolean;
  isEnteringFromBase: boolean;
}

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  players: RoomPlayer[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  settings: GameSettings;
  createdAt: number;
}

export interface GameSettings {
  maxPlayers: number;
  botCount: number;
  botDifficulty: BotDifficulty;
  soundEnabled: boolean;
  musicEnabled: boolean;
  animationQuality: 'low' | 'medium' | 'high';
  theme: BoardTheme;
}

export type BoardTheme = 'classic' | 'neon' | 'galaxy' | 'crystal';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  wins: number;
  losses: number;
  totalGames: number;
  winStreak: number;
}

export interface Reaction {
  id: string;
  text: string;
  playerColor: PlayerColor;
  playerName: string;
  timestamp: number;
}

