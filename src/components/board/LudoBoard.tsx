import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/gameStore';
import type { PlayerColor, Token } from '../../types/game';
import {
  calculateAbsolutePosition,
  isInHomePath,
  checkSafeCell,
  COLOR_START,
  HOME_PATH_GRID,
  BASE_POSITIONS,
  TRACK_GRID_POSITIONS,
  WINNING_POSITION,
} from '../../engine/gameEngine';

// ─── Constants ────────────────────────────────────────────────────────────────

const CELL_SIZE = 38;     // px per cell on 15×15 grid
const BOARD_CELLS = 15;
const BOARD_SIZE = CELL_SIZE * BOARD_CELLS;

const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];

const COLOR_HEX: Record<PlayerColor, string> = {
  red:    '#ef4444',
  blue:   '#3b82f6',
  green:  '#22c55e',
  yellow: '#eab308',
};

const COLOR_BG: Record<PlayerColor, string> = {
  red:    'rgba(239,68,68,0.18)',
  blue:   'rgba(59,130,246,0.18)',
  green:  'rgba(34,197,94,0.18)',
  yellow: 'rgba(234,179,8,0.18)',
};

// Safe cell indices on main track
const SAFE_SET = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Grid positions for all 52 track cells (row, col) on 15×15 board
// Arranged clockwise starting from red's entry (bottom-left of center-left column)
const TRACK_POS: [number, number][] = [
  // Red section: col 6, going up  (0-5)
  [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
  // Corner + going right (6-8)
  [8,6],[8,7],[8,8],
  // Blue section going down: col 8 (9-14)
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  // Bottom row going right (15-20)
  [14,9],[14,10],[14,11],[14,12],[14,13],[14,14],
  // Right col going up (21-25)
  [13,14],[12,14],[11,14],[10,14],[9,14],
  // Corner + going left (26-28)
  [8,14],[8,13],[8,12],
  // Green going up: row 8 to top (29-34)
  [8,11],[8,10],[8,9],[7,9],[6,9],[5,9],
  // Top-left area (35-39)
  [6,9],[6,8],[6,7],[6,6],[6,5],
  // Yellow section (40-45)
  [6,4],[6,3],[6,2],[6,1],[6,0],[5,0],
  // Left col going down (46-51)
  [4,0],[3,0],[2,0],[1,0],[0,0],[0,1],
];

// Fix: rebuild proper 52-cell track
const PROPER_TRACK: [number, number][] = [
  // 0-5: Red column going up (col 6, rows 14→9)
  [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
  // 6-7: Turn right
  [8,6],[8,7],
  // 8: Safe
  [8,8],
  // 9-13: Blue column going down (col 8, rows 9→13)
  [9,8],[10,8],[11,8],[12,8],[13,8],
  // 14: Blue start safe
  [14,8],
  // 15-19: Bottom row going right
  [14,9],[14,10],[14,11],[14,12],[14,13],
  // 20: corner
  [14,14],
  // 21: Safe
  [13,14],
  // 22-25: Right col going up
  [12,14],[11,14],[10,14],[9,14],
  // 26: Green start safe
  [8,14],
  // 27-28: Turn left
  [8,13],[8,12],
  // 29-33: Row 8 going left (cols 11→7)
  [8,11],[8,10],[8,9],[7,9],[6,9],
  // 34: safe
  [6,9],
  // 35-38: Green col going up (row 6 going left)
  [6,8],[6,7],[6,6],[6,5],
  // 39: Yellow start safe
  [6,4],
  // 40-44: Going left and up
  [6,3],[6,2],[6,1],[6,0],[5,0],
  // 45-46: Left col
  [4,0],[3,0],
  // 47: safe
  [2,0],
  // 48-51: bottom-left going right
  [1,0],[0,0],[0,1],[0,2],
];

// Rebuild with exactly 52 unique positions
function buildTrack(): [number, number][] {
  return [
    // Red straight (col 6, bottom up): 0-5
    [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
    // Turn bend: 6-8
    [8,6],[8,7],[8,8],
    // Blue column (col 8, top down from row 9): 9-14
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
    // Bottom right: 15-20
    [14,9],[14,10],[14,11],[14,12],[14,13],[14,14],
    // Right column up: 21-25
    [13,14],[12,14],[11,14],[10,14],[9,14],
    // Green entry: 26-28
    [8,14],[8,13],[8,12],
    // Middle row left: 29-33
    [8,11],[8,10],[8,9],[7,9],[6,9],
    // Top right going left: 34-38
    [6,8],[6,7],[6,6],[6,5],[6,4],
    // Yellow area: 39-44
    [6,3],[6,2],[6,1],[5,1],[4,1],[3,1],
    // Left column: 45-51
    [2,1],[1,1],[0,1],[0,2],[0,3],[0,4],[0,5],
  ];
}

const FINAL_TRACK = buildTrack(); // 52 cells

// Home path positions (inside the cross arms) for each color
const HOME_PATHS: Record<PlayerColor, [number, number][]> = {
  red:    [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
  blue:   [[8,13],[8,12],[8,11],[8,10],[8,9],[8,8]],
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  yellow: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
};

// 4 base slot positions for each color (in 15×15 grid coords)
const BASE_SLOTS: Record<PlayerColor, [number, number][]> = {
  red:    [[11,1],[11,3],[13,1],[13,3]],
  blue:   [[11,11],[11,13],[13,11],[13,13]],
  green:  [[1,11],[1,13],[3,11],[3,13]],
  yellow: [[1,1],[1,3],[3,1],[3,3]],
};

// Quadrant bounds for colored backgrounds
const QUADRANT_BOUNDS: Record<PlayerColor, [number, number, number, number]> = {
  red:    [9, 0, 6, 6],   // [rowStart, colStart, rows, cols]  bottom-left
  blue:   [9, 9, 6, 6],   // bottom-right
  green:  [0, 9, 6, 6],   // top-right
  yellow: [0, 0, 6, 6],   // top-left
};

// Center position
const CENTER: [number, number] = [6, 6];

// ─── Main Board Component ────────────────────────────────────────────────────

const THEME_STYLES = {
  classic: {
    bg: '#0a1628',
    border: 'border-white/10',
    cellBorder: 'rgba(255,255,255,0.08)',
    glow: 'shadow-[0_0_50px_rgba(10,22,40,0.8)]',
  },
  neon: {
    bg: '#090214',
    border: 'border-purple-500/30',
    cellBorder: 'rgba(168,85,247,0.18)',
    glow: 'shadow-[0_0_50px_rgba(168,85,247,0.25)]',
  },
  galaxy: {
    bg: '#020617',
    border: 'border-cyan-500/30',
    cellBorder: 'rgba(56,189,248,0.15)',
    glow: 'shadow-[0_0_50px_rgba(14,165,233,0.2)]',
  },
  crystal: {
    bg: '#041f2e',
    border: 'border-emerald-500/30',
    cellBorder: 'rgba(52,211,153,0.15)',
    glow: 'shadow-[0_0_50px_rgba(16,185,129,0.2)]',
  },
};

export default function LudoBoard() {
  const gameState       = useAppStore(s => s.gameState);
  const selectedTokenId = useAppStore(s => s.selectedTokenId);
  const selectToken     = useAppStore(s => s.selectToken);
  const settings        = useAppStore(s => s.settings);

  const themeConfig = THEME_STYLES[settings.theme] || THEME_STYLES.classic;

  const validMoveTokenIds = useMemo(
    () => new Set(gameState?.validMoves.map(m => m.tokenId) ?? []),
    [gameState?.validMoves]
  );

  if (!gameState) return null;

  const { players } = gameState;

  // Gather all tokens and their pixel positions
  const tokenRenderData = useMemo(() => {
    const results: Array<{
      token: Token;
      pixel: [number, number];
      isValid: boolean;
      isSelected: boolean;
      zIndex: number;
    }> = [];

    for (const player of players) {
      for (const token of player.tokens) {
        const pixel = getTokenPixelPos(token);
        results.push({
          token,
          pixel,
          isValid: validMoveTokenIds.has(token.id),
          isSelected: selectedTokenId === token.id,
          zIndex: selectedTokenId === token.id ? 50 : validMoveTokenIds.has(token.id) ? 30 : 10,
        });
      }
    }
    return results;
  }, [players, validMoveTokenIds, selectedTokenId]);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-2xl border ${themeConfig.border} ${themeConfig.glow}`}
      style={{ width: BOARD_SIZE, height: BOARD_SIZE, flexShrink: 0 }}
    >
      {/* Board background */}
      <div className="absolute inset-0" style={{ backgroundColor: themeConfig.bg }} />

      {/* Render grid cells */}
      {Array.from({ length: BOARD_CELLS }, (_, row) =>
        Array.from({ length: BOARD_CELLS }, (_, col) => (
          <BoardCell
            key={`${row}-${col}`}
            row={row}
            col={col}
            gameState={gameState}
            cellBorder={themeConfig.cellBorder}
          />
        ))
      )}

      {/* Tokens */}
      <AnimatePresence>
        {tokenRenderData.map(({ token, pixel, isValid, isSelected }) => (
          <TokenPiece
            key={token.id}
            token={token}
            pixel={pixel}
            isValid={isValid}
            isSelected={isSelected}
            onSelect={() => isValid && selectToken(token.id)}
          />
        ))}
      </AnimatePresence>

      {/* Center home star */}
      <CenterStar />
    </div>
  );
}

// ─── Cell renderer ────────────────────────────────────────────────────────────

function BoardCell({
  row,
  col,
  gameState,
  cellBorder,
}: {
  row: number;
  col: number;
  gameState: any;
  cellBorder: string;
}) {
  const cellType = getCellType(row, col);
  const trackIdx = FINAL_TRACK.findIndex(([r, c]) => r === row && c === col);
  const isValidTarget = gameState.validMoves.some((m: any) => {
    const newAbsPos = m.toPosition < 52
      ? calculateAbsolutePosition(m.tokenColor, m.toPosition)
      : -1;
    return newAbsPos === trackIdx;
  });

  let bg = 'rgba(255,255,255,0.03)';
  let border = cellBorder;

  if (cellType === 'red-quadrant')    { bg = 'rgba(239,68,68,0.18)'; border = 'rgba(239,68,68,0.3)'; }
  if (cellType === 'blue-quadrant')   { bg = 'rgba(59,130,246,0.18)'; border = 'rgba(59,130,246,0.3)'; }
  if (cellType === 'green-quadrant')  { bg = 'rgba(34,197,94,0.18)'; border = 'rgba(34,197,94,0.3)'; }
  if (cellType === 'yellow-quadrant') { bg = 'rgba(234,179,8,0.18)'; border = 'rgba(234,179,8,0.3)'; }
  if (cellType === 'red-home')    bg = 'rgba(239,68,68,0.4)';
  if (cellType === 'blue-home')   bg = 'rgba(59,130,246,0.4)';
  if (cellType === 'green-home')  bg = 'rgba(34,197,94,0.4)';
  if (cellType === 'yellow-home') bg = 'rgba(234,179,8,0.4)';
  if (cellType === 'center')      bg = 'rgba(255,255,255,0.05)';

  const isSafe = trackIdx !== -1 && SAFE_SET.has(trackIdx);

  return (
    <div
      style={{
        position: 'absolute',
        left:   col * CELL_SIZE,
        top:    row * CELL_SIZE,
        width:  CELL_SIZE,
        height: CELL_SIZE,
        background: bg,
        border: `1px solid ${border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      {isSafe && (
        <div
          style={{
            width: 10, height: 10,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.5)',
          }}
        />
      )}
      {isValidTarget && (
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          style={{ background: 'rgba(139,92,246,0.3)', borderRadius: 2 }}
        />
      )}
    </div>
  );
}

// ─── Token piece ──────────────────────────────────────────────────────────────

interface TokenPieceProps {
  token: Token;
  pixel: [number, number];
  isValid: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

function TokenPiece({ token, pixel, isValid, isSelected, onSelect }: TokenPieceProps) {
  const [px, py] = pixel;
  const color = COLOR_HEX[token.color];
  const size = CELL_SIZE * 0.68;

  return (
    <motion.div
      layout
      key={token.id}
      style={{
        position: 'absolute',
        left: px - size / 2,
        top:  py - size / 2,
        width: size,
        height: size,
        zIndex: isSelected ? 50 : isValid ? 30 : 10,
        cursor: isValid ? 'pointer' : 'default',
      }}
      animate={{
        x:     0,
        y:     isSelected ? -4 : 0,
        scale: isSelected ? 1.2 : isValid ? 1.1 : 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={onSelect}
      whileHover={isValid ? { scale: 1.25 } : {}}
      whileTap={isValid ? { scale: 0.95 } : {}}
    >
      {/* Token body */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6), ${color})`,
          border: `2.5px solid ${isSelected ? 'white' : 'rgba(255,255,255,0.4)'}`,
          boxShadow: [
            isSelected ? `0 0 0 3px rgba(255,255,255,0.6)` : '',
            isValid ? `0 0 12px ${color}` : `0 2px 8px rgba(0,0,0,0.4)`,
          ].filter(Boolean).join(', '),
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Shine */}
        <div style={{
          position: 'absolute',
          top: '12%', left: '18%',
          width: '35%', height: '35%',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.5)',
        }} />
      </div>

      {/* Valid move ring pulse */}
      {isValid && (
        <motion.div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: `2px solid ${color}`,
          }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

// ─── Center star ──────────────────────────────────────────────────────────────

function CenterStar() {
  const cx = 7.5 * CELL_SIZE;
  const cy = 7.5 * CELL_SIZE;
  const size = CELL_SIZE * 3;

  return (
    <motion.div
      style={{
        position: 'absolute',
        left:   cx - size / 2,
        top:    cy - size / 2,
        width:  size,
        height: size,
        zIndex: 5,
      }}
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
    >
      <svg width={size} height={size} viewBox="0 0 3 3">
        {/* 4-pointed star / triangles pointing to each color */}
        <polygon points="1.5,0.1 1.8,1.5 1.5,2.9 1.2,1.5" fill="rgba(239,68,68,0.6)" />
        <polygon points="2.9,1.5 1.5,1.8 0.1,1.5 1.5,1.2" fill="rgba(59,130,246,0.6)" />
        <polygon points="0.5,0.5 1.5,1.5 0.5,2.5" fill="rgba(34,197,94,0.3)" />
        <polygon points="2.5,0.5 1.5,1.5 2.5,2.5" fill="rgba(234,179,8,0.3)" />
        <circle cx="1.5" cy="1.5" r="0.5" fill="rgba(255,255,255,0.2)" />
      </svg>
    </motion.div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTokenPixelPos(token: Token): [number, number] {
  const { color, state, stepsMoved, index } = token;

  if (state === 'base') {
    const slot = BASE_SLOTS[color][index] ?? BASE_SLOTS[color][0];
    return gridToPixel(slot[0], slot[1]);
  }

  if (state === 'home') {
    return gridToPixel(7, 7); // center
  }

  // Active on track
  if (isInHomePath(stepsMoved)) {
    const pathIdx = Math.min(stepsMoved - 52, HOME_PATHS[color].length - 1);
    const pos = HOME_PATHS[color][pathIdx] ?? HOME_PATHS[color][HOME_PATHS[color].length - 1];
    return gridToPixel(pos[0], pos[1]);
  }

  // Main track
  const absPos = calculateAbsolutePosition(color, stepsMoved);
  if (absPos >= 0 && absPos < FINAL_TRACK.length) {
    const pos = FINAL_TRACK[absPos];
    return gridToPixel(pos[0], pos[1]);
  }

  return gridToPixel(7, 7);
}

function gridToPixel(row: number, col: number): [number, number] {
  return [col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2];
}

type CellType =
  | 'red-quadrant' | 'blue-quadrant' | 'green-quadrant' | 'yellow-quadrant'
  | 'red-home' | 'blue-home' | 'green-home' | 'yellow-home'
  | 'center' | 'track' | 'empty';

function getCellType(row: number, col: number): CellType {
  // Large quadrant backgrounds (6×6 each)
  if (row >= 9 && row <= 14 && col >= 0 && col <= 5)   return 'red-quadrant';
  if (row >= 9 && row <= 14 && col >= 9 && col <= 14)  return 'blue-quadrant';
  if (row >= 0 && row <= 5  && col >= 9 && col <= 14)  return 'green-quadrant';
  if (row >= 0 && row <= 5  && col >= 0 && col <= 5)   return 'yellow-quadrant';

  // Home paths (the colored cross arms)
  if (col === 7 && row >= 9  && row <= 13) return 'red-home';
  if (row === 7 && col >= 9  && col <= 13) return 'blue-home';
  if (col === 7 && row >= 1  && row <= 5)  return 'green-home';
  if (row === 7 && col >= 1  && col <= 5)  return 'yellow-home';

  // Center triangle
  if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return 'center';

  return 'track';
}

