import {
  calculateAbsolutePosition,
  checkSafeCell,
  isInHomePath,
  COLOR_START,
  SAFE_CELLS,
  WINNING_POSITION,
  getValidMoves,
  applyMove,
  checkWinner,
  switchTurn,
  calculateBotMove,
} from '../src/engine/gameEngine.ts';
import type { GameState, Player, Token, PlayerColor } from '../src/types/game.ts';

function createTestToken(color: PlayerColor, index: number, state: 'base' | 'active' | 'home' = 'base', steps = 0): Token {
  return {
    id: `${color}-${index}`,
    color,
    index,
    state,
    position: state === 'base' ? -1 : state === 'home' ? WINNING_POSITION : steps,
    stepsMoved: steps,
  };
}

function createTestPlayer(color: PlayerColor, tokens?: Token[]): Player {
  return {
    id: `p-${color}`,
    name: `${color.toUpperCase()} Player`,
    color,
    isBot: color !== 'red',
    isConnected: true,
    isHost: color === 'red',
    tokens: tokens || [0, 1, 2, 3].map(i => createTestToken(color, i)),
    avatar: '🦁',
    xp: 0,
    level: 1,
    wins: 0,
    losses: 0,
  };
}

function createTestState(players: Player[], diceValue: number = 6): GameState {
  return {
    id: 'test-game',
    mode: 'computer',
    phase: 'moving',
    players,
    currentPlayerIndex: 0,
    currentDiceValue: diceValue,
    consecutiveSixes: diceValue === 6 ? 1 : 0,
    isRolling: false,
    diceRolled: true,
    validMoves: [],
    events: [],
    finishedPlayers: [],
    winner: null,
    turnCount: 1,
    startedAt: Date.now(),
  };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
    failed++;
  }
}

console.log('\n--- RUNNING LUDO LEGENDS RULE ENGINE TESTS ---');

// Test 1: Absolute position & track calculation
console.log('\n1. Track & Safe Cell Mathematics:');
assert(calculateAbsolutePosition('red', 1) === 0, 'Red start cell is track 0');
assert(calculateAbsolutePosition('blue', 1) === 13, 'Blue start cell is track 13');
assert(calculateAbsolutePosition('green', 1) === 26, 'Green start cell is track 26');
assert(calculateAbsolutePosition('yellow', 1) === 39, 'Yellow start cell is track 39');
assert(checkSafeCell(0), 'Track cell 0 is safe (Red start)');
assert(checkSafeCell(8), 'Track cell 8 is safe');
assert(checkSafeCell(13), 'Track cell 13 is safe (Blue start)');
assert(checkSafeCell(26), 'Track cell 26 is safe (Green start)');
assert(checkSafeCell(39), 'Track cell 39 is safe (Yellow start)');
assert(!checkSafeCell(5), 'Track cell 5 is not safe');

// Test 2: Leaving base rules
console.log('\n2. Token Exit Rules:');
const pRed = createTestPlayer('red');
const pBlue = createTestPlayer('blue');
let state = createTestState([pRed, pBlue], 5);
let moves = getValidMoves(state);
assert(moves.length === 0, 'Rolling 5 cannot bring token out of base');

state = createTestState([pRed, pBlue], 6);
moves = getValidMoves(state);
assert(moves.length === 4, 'Rolling 6 offers all 4 base tokens as valid exit moves');
assert(moves.every(m => m.isEnteringFromBase), 'All moves are exit moves');

// Test 3: Moving token & capturing
console.log('\n3. Movement & Capturing:');
const activeRed = createTestToken('red', 0, 'active', 1); // at track 0
const otherRedTokens = [1, 2, 3].map(i => createTestToken('red', i));
const redWithActive = createTestPlayer('red', [activeRed, ...otherRedTokens]);

// Blue token at track 4 (step 1 from track 0 + 4 steps = track 4)
// Blue start is 13, so to be at track 4, blue would have needed 44 steps
// Or let's test a token at track 4:
const activeBlue = createTestToken('blue', 0, 'active', 44); // track 4: (13 + 44 - 1)%52 = 56%52 = 4
const bluePlayer = createTestPlayer('blue', [activeBlue, ...[1, 2, 3].map(i => createTestToken('blue', i))]);

state = createTestState([redWithActive, bluePlayer], 4);
moves = getValidMoves(state);
assert(moves.length === 1, 'Only the active token can move with a roll of 4');
assert(moves[0].willCapture === true, 'Landing on opponent token detects capture');

// Apply capture move
const newState = applyMove(state, moves[0]);
const capturedBlue = newState.players[1].tokens[0];
assert(capturedBlue.state === 'base', 'Captured token is sent back to base');
assert(capturedBlue.stepsMoved === 0, 'Captured token steps reset to 0');

// Test 4: Safe cells prevent capture
console.log('\n4. Safe Cells Protection:');
// Blue token at safe cell 8: (13 + 48 - 1)%52 = 60%52 = 8
const safeBlue = createTestToken('blue', 0, 'active', 48); // at track 8
const bluePlayerSafe = createTestPlayer('blue', [safeBlue, ...[1, 2, 3].map(i => createTestToken('blue', i))]);
// Red token at track 0 rolling 8 => lands on track 8
state = createTestState([redWithActive, bluePlayerSafe], 8);
moves = getValidMoves(state);
assert(moves.length === 1 && !moves[0].willCapture, 'Opponent on safe cell cannot be captured');

// Test 5: Exact roll needed to enter home
console.log('\n5. Home Entry Rules:');
const almostHomeRed = createTestToken('red', 0, 'active', 55); // needs 2 to reach 57
const redNearHome = createTestPlayer('red', [almostHomeRed, ...otherRedTokens]);
state = createTestState([redNearHome, pBlue], 3); // rolls 3 (overshoots 55 + 3 = 58 > 57)
moves = getValidMoves(state);
assert(moves.length === 0, 'Cannot overshoot home (roll of 3 when 2 needed is invalid)');

state = createTestState([redNearHome, pBlue], 2); // rolls 2 (exact 55 + 2 = 57)
moves = getValidMoves(state);
assert(moves.length === 1 && moves[0].toPosition === WINNING_POSITION, 'Exact roll of 2 reaches home');
const stateAtHome = applyMove(state, moves[0]);
assert(stateAtHome.players[0].tokens[0].state === 'home', 'Token state becomes home');

// Test 6: Win condition
console.log('\n6. Win Condition:');
const allHomeTokens = [0, 1, 2, 3].map(i => createTestToken('red', i, 'home', 57));
const winningPlayer = createTestPlayer('red', allHomeTokens);
assert(checkWinner(winningPlayer) === true, 'Player with all 4 tokens at home wins');
assert(checkWinner(pRed) === false, 'Player with tokens in base has not won');

// Test 7: Turn rotation
console.log('\n7. Turn Switching:');
let turnState = createTestState([pRed, pBlue], 4);
assert(turnState.currentPlayerIndex === 0, 'Initial turn is player 0');
turnState = switchTurn(turnState);
assert(turnState.currentPlayerIndex === 1, 'Turn switches to player 1');
turnState = switchTurn(turnState);
assert(turnState.currentPlayerIndex === 0, 'Turn wraps around back to player 0');

// Test 8: Bot strategic moves
console.log('\n8. Bot Artificial Intelligence:');
const botEasy = calculateBotMove(createTestState([pRed, pBlue], 6), 'easy');
assert(botEasy !== null, 'Easy bot picks a valid legal move');

const botExpert = calculateBotMove(createTestState([pRed, pBlue], 6), 'expert');
assert(botExpert !== null, 'Expert bot evaluates and picks an optimal move');

console.log(`\n================================`);
console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log(`================================\n`);

if (failed > 0) process.exit(1);

