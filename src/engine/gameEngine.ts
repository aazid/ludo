import type { PlayerColor, Token, ValidMove, GameState, Player, BotDifficulty } from '../types/game';

// ─── Board Constants ─────────────────────────────────────────────────────────

// The Ludo board has 52 main track cells (0-51) + 6 home-path cells per color (52-57 relative)
// Total per-token track: 57 steps to reach home center (position 57 = home)

export const TOTAL_TRACK_CELLS = 52;
export const HOME_PATH_LENGTH = 6;
export const WINNING_POSITION = 57; // one past last home path cell

// Starting positions on the main track (where a token enters when leaving base)
export const COLOR_START: Record<PlayerColor, number> = {
  red:    0,
  blue:   13,
  green:  26,
  yellow: 39,
};

// Home entry position: the cell BEFORE entering the home path
// A token at this track position on its next move enters the home path
export const HOME_ENTRY: Record<PlayerColor, number> = {
  red:    50,
  blue:   11,
  green:  24,
  yellow: 37,
};

// Safe cells on the main track (cannot be captured here)
export const SAFE_CELLS = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);

// ─── Position Calculation ─────────────────────────────────────────────────────

/**
 * Returns the absolute track position for a given color and steps moved.
 * position -1 = base, 0-51 = main track, 52-57 = home path, 57 = home
 * The steps moved represents how far the token has moved since leaving base.
 */
export function calculateAbsolutePosition(color: PlayerColor, stepsMoved: number): number {
  if (stepsMoved <= 0) return -1; // still in base
  if (stepsMoved > WINNING_POSITION) return WINNING_POSITION;

  // First 51 steps are on main track; steps 52-57 are on home path
  if (stepsMoved > 51) {
    // In home path: 52 = first home cell, 57 = home center
    return stepsMoved; // just return stepsMoved as the logical position
  }

  // Main track: offset from start position, wrapping around 52 cells
  const trackPos = (COLOR_START[color] + stepsMoved - 1) % TOTAL_TRACK_CELLS;
  return trackPos;
}

/**
 * Returns true if the given absolute track position is a safe cell for any player.
 */
export function checkSafeCell(absolutePos: number): boolean {
  return SAFE_CELLS.has(absolutePos);
}

/**
 * Returns true if a token is in the home path (not capturable).
 */
export function isInHomePath(stepsMoved: number): boolean {
  return stepsMoved > 51;
}

/**
 * Get valid moves for all tokens of the current player.
 */
export function getValidMoves(state: GameState): ValidMove[] {
  const { players, currentPlayerIndex, currentDiceValue } = state;
  if (currentDiceValue === null) return [];

  const currentPlayer = players[currentPlayerIndex];
  const dice = currentDiceValue;
  const moves: ValidMove[] = [];

  for (const token of currentPlayer.tokens) {
    if (token.state === 'home') continue;

    // Token in base: only a 6 can bring it out
    if (token.state === 'base') {
      if (dice === 6) {
        const move: ValidMove = {
          tokenId: token.id,
          tokenColor: token.color,
          tokenIndex: token.index,
          fromPosition: -1,
          toPosition: 0,
          willCapture: false,
          willEnterHome: false,
          isEnteringFromBase: true,
        };

        // Check if there's an opponent token at the start position
        const captureInfo = checkCaptureAtPosition(
          COLOR_START[token.color],
          token.color,
          players
        );
        if (captureInfo) {
          move.willCapture = true;
          move.capturedTokenId = captureInfo.tokenId;
        }

        moves.push(move);
      }
      continue;
    }

    // Token is active on the track
    const newSteps = token.stepsMoved + dice;

    // Cannot overshoot home
    if (newSteps > WINNING_POSITION) continue;

    const isEnteringHome = newSteps === WINNING_POSITION;
    const newAbsPos = isEnteringHome ? WINNING_POSITION : calculateAbsolutePosition(token.color, newSteps);

    const move: ValidMove = {
      tokenId: token.id,
      tokenColor: token.color,
      tokenIndex: token.index,
      fromPosition: token.stepsMoved,
      toPosition: newSteps,
      willCapture: false,
      willEnterHome: isEnteringHome || newSteps > 51,
      isEnteringFromBase: false,
    };

    // Capture check (only on main track, not home path)
    if (!isInHomePath(newSteps) && !isEnteringHome) {
      const captureInfo = checkCaptureAtPosition(newAbsPos, token.color, players);
      if (captureInfo && !checkSafeCell(newAbsPos)) {
        move.willCapture = true;
        move.capturedTokenId = captureInfo.tokenId;
      }
    }

    moves.push(move);
  }

  return moves;
}

interface CaptureInfo {
  tokenId: string;
  playerColor: PlayerColor;
}

function checkCaptureAtPosition(
  absolutePos: number,
  movingColor: PlayerColor,
  players: Player[]
): CaptureInfo | null {
  for (const player of players) {
    if (player.color === movingColor) continue;
    for (const token of player.tokens) {
      if (token.state !== 'active') continue;
      if (isInHomePath(token.stepsMoved)) continue;
      const tokenAbsPos = calculateAbsolutePosition(token.color, token.stepsMoved);
      if (tokenAbsPos === absolutePos) {
        return { tokenId: token.id, playerColor: token.color };
      }
    }
  }
  return null;
}

/**
 * Roll a dice: returns 1-6.
 */
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Apply a move to the game state, returning a new state.
 */
export function applyMove(state: GameState, move: ValidMove): GameState {
  const newState = deepCloneState(state);
  const player = newState.players.find(p => p.color === move.tokenColor)!;
  const token = player.tokens.find(t => t.id === move.tokenId)!;

  // Handle capture
  if (move.willCapture && move.capturedTokenId) {
    for (const p of newState.players) {
      for (const t of p.tokens) {
        if (t.id === move.capturedTokenId) {
          t.state = 'base';
          t.stepsMoved = 0;
          t.position = -1;
        }
      }
    }
  }

  // Move token
  if (move.isEnteringFromBase) {
    token.state = 'active';
    token.stepsMoved = 1;
    token.position = calculateAbsolutePosition(token.color, 1);
  } else {
    token.stepsMoved = move.toPosition;
    if (move.toPosition === WINNING_POSITION) {
      token.state = 'home';
      token.position = WINNING_POSITION;
    } else {
      token.position = calculateAbsolutePosition(token.color, move.toPosition);
    }
  }

  return newState;
}

/**
 * Check if a player has won (all tokens home).
 */
export function checkWinner(player: Player): boolean {
  return player.tokens.every(t => t.state === 'home');
}

/**
 * Switch to the next player's turn.
 */
export function switchTurn(state: GameState): GameState {
  const newState = deepCloneState(state);
  const numPlayers = newState.players.length;

  // Find next non-finished player
  let nextIndex = (newState.currentPlayerIndex + 1) % numPlayers;
  let safety = 0;
  while (
    newState.finishedPlayers.includes(newState.players[nextIndex].color) &&
    safety < numPlayers
  ) {
    nextIndex = (nextIndex + 1) % numPlayers;
    safety++;
  }

  newState.currentPlayerIndex = nextIndex;
  newState.currentDiceValue = null;
  newState.consecutiveSixes = 0;
  newState.diceRolled = false;
  newState.validMoves = [];
  newState.phase = 'rolling';

  return newState;
}

/**
 * Check if a token at a given position is stacked with a same-color token (blocker).
 */
export function hasBlocker(absolutePos: number, color: PlayerColor, players: Player[]): boolean {
  let count = 0;
  for (const player of players) {
    if (player.color !== color) continue;
    for (const token of player.tokens) {
      if (token.state !== 'active') continue;
      if (!isInHomePath(token.stepsMoved)) {
        const pos = calculateAbsolutePosition(token.color, token.stepsMoved);
        if (pos === absolutePos) count++;
      }
    }
  }
  return count >= 2;
}

function deepCloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

// ─── Bot AI ──────────────────────────────────────────────────────────────────

export function calculateBotMove(
  state: GameState,
  difficulty: BotDifficulty
): ValidMove | null {
  const moves = getValidMoves(state);
  if (moves.length === 0) return null;

  switch (difficulty) {
    case 'easy':   return easyBot(moves);
    case 'medium': return mediumBot(moves, state);
    case 'hard':   return hardBot(moves, state);
    case 'expert': return expertBot(moves, state);
    default:       return easyBot(moves);
  }
}

function easyBot(moves: ValidMove[]): ValidMove {
  return moves[Math.floor(Math.random() * moves.length)];
}

function mediumBot(moves: ValidMove[], _state: GameState): ValidMove {
  // Prefer captures, then entering from base, then most-advanced token
  const capture = moves.find(m => m.willCapture);
  if (capture) return capture;
  const enter = moves.find(m => m.isEnteringFromBase);
  if (enter) return enter;
  return moves.reduce((best, m) => m.toPosition > best.toPosition ? m : best, moves[0]);
}

function hardBot(moves: ValidMove[], state: GameState): ValidMove {
  // Score each move
  const scored = moves.map(m => ({ move: m, score: scoreMove(m, state) }));
  scored.sort((a, b) => b.score - a.score);
  // Add slight randomness
  const topK = scored.slice(0, Math.min(2, scored.length));
  return topK[Math.floor(Math.random() * topK.length)].move;
}

function expertBot(moves: ValidMove[], state: GameState): ValidMove {
  const scored = moves.map(m => ({ move: m, score: scoreMove(m, state) }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}

function scoreMove(move: ValidMove, state: GameState): number {
  let score = 0;

  // Strongly prefer captures
  if (move.willCapture) score += 100;

  // Prefer entering home
  if (move.willEnterHome) score += 80;

  // Prefer getting off base
  if (move.isEnteringFromBase) score += 50;

  // Prefer advancing further
  score += move.toPosition * 0.5;

  // Prefer safe cells
  const player = state.players.find(p => p.color === move.tokenColor)!;
  const newAbsPos = calculateAbsolutePosition(move.tokenColor, move.toPosition);
  if (checkSafeCell(newAbsPos)) score += 30;

  // Penalize moving a token that is under threat
  // Check if the destination puts us in danger
  const threatenedPositions = getDangerousPositions(move.tokenColor, state);
  if (!checkSafeCell(newAbsPos) && threatenedPositions.has(newAbsPos)) score -= 40;

  return score;
}

function getDangerousPositions(ownColor: PlayerColor, state: GameState): Set<number> {
  const dangerous = new Set<number>();
  for (const player of state.players) {
    if (player.color === ownColor) continue;
    // For each opponent token, compute where it could reach in 1-6 moves
    for (const token of player.tokens) {
      if (token.state !== 'active') continue;
      if (isInHomePath(token.stepsMoved)) continue;
      for (let d = 1; d <= 6; d++) {
        const newSteps = token.stepsMoved + d;
        if (newSteps <= 51) {
          dangerous.add(calculateAbsolutePosition(token.color, newSteps));
        }
      }
    }
  }
  return dangerous;
}

// ─── Board Grid Mapping ──────────────────────────────────────────────────────

// Maps logical track position to grid [row, col] on a 15x15 board
// The standard Ludo board layout
export const TRACK_GRID_POSITIONS: [number, number][] = [
  // Red path (bottom-left going right): 0-5
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Turn (going right): 6-7
  [8, 6], [8, 7],
  // Bottom row going right: 8-11
  [8, 8], [9, 8], [10, 8], [11, 8],
  // Blue start column: 12-13
  [12, 8], [13, 8],
  // Blue going up: 14
  [14, 8],
  // Right column going up: 15-19
  [14, 9], [14, 10], [14, 11], [14, 12], [14, 13],
  // Turn up: 20
  [14, 14],
  // Right column going left: 21
  [13, 14],
  // Top of right: 22-25
  [12, 14], [11, 14], [10, 14], [9, 14],
  // Green start: 26-27
  [8, 14], [8, 13],
  // Turn: 28
  [8, 12],
  // Top row: 29-33
  [8, 11], [8, 10], [8, 9], [7, 9], [6, 9],
  // Top row continuing: 34-37
  [6, 8], [6, 7], [6, 6], [6, 5],
  // Yellow start: 38-39
  [6, 4], [6, 3],
  // Turn: 40
  [6, 2],
  // Left column going down: 41-45
  [6, 1], [6, 0], [5, 0], [4, 0], [3, 0],
  // Turn: 46
  [2, 0],
  // Left: 47
  [1, 0],
  // Bottom of left: 48-51
  [0, 0], [0, 1], [0, 2], [0, 3],
];

// Home path grid positions for each color (steps 52-56, center = 57)
export const HOME_PATH_GRID: Record<PlayerColor, [number, number][]> = {
  red:    [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  blue:   [[8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [8, 8]],
  green:  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6]],
};

// Base positions for each color (4 tokens in base)
export const BASE_POSITIONS: Record<PlayerColor, [number, number][]> = {
  red:    [[11, 2], [11, 4], [13, 2], [13, 4]],
  blue:   [[11, 10], [11, 12], [13, 10], [13, 12]],
  green:  [[1, 10], [1, 12], [3, 10], [3, 12]],
  yellow: [[1, 2], [1, 4], [3, 2], [3, 4]],
};

// Home zone center
export const HOME_CENTER: [number, number] = [7, 7];

