import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/gameStore';
import type { PlayerColor, Token, ValidMove } from '../../types/game';
import {
  calculateAbsolutePosition,
  isInHomePath,
  checkSafeCell,
  COLOR_START,
  HOME_PATH_GRID,
  BASE_POSITIONS,
  TRACK_GRID_POSITIONS,
  SAFE_CELLS,
  WINNING_POSITION,
} from '../../engine/gameEngine';

// ─── Dimensions ───────────────────────────────────────────────────────────────

const CELL_SIZE = 38;
const BOARD_CELLS = 15;
const BOARD_SIZE = CELL_SIZE * BOARD_CELLS; // 570px

const COLOR_HEX: Record<PlayerColor, string> = {
  red:    '#ef4444',
  yellow: '#eab308',
  green:  '#22c55e',
  blue:   '#3b82f6',
};

const COLOR_BG: Record<PlayerColor, string> = {
  red:    'rgba(239, 68, 68, 0.25)',
  yellow: 'rgba(234, 179, 8, 0.25)',
  green:  'rgba(34, 197, 94, 0.25)',
  blue:   'rgba(59, 130, 246, 0.25)',
};

const COLOR_BORDER: Record<PlayerColor, string> = {
  red:    'rgba(239, 68, 68, 0.6)',
  yellow: 'rgba(234, 179, 8, 0.6)',
  green:  'rgba(34, 197, 94, 0.6)',
  blue:   'rgba(59, 130, 246, 0.6)',
};

// Start arrows on starting cells pointing in clockwise movement direction
const START_ARROWS: Record<number, string> = {
  0:  '▲', // Red start (moves UP)
  13: '▶', // Yellow start (moves RIGHT)
  26: '▼', // Green start (moves DOWN)
  39: '◀', // Blue start (moves LEFT)
};

// ─── Theme Configurations ────────────────────────────────────────────────────

const THEME_STYLES = {
  classic: {
    bg: '#0a1628',
    border: 'border-white/10',
    cellBg: 'rgba(255, 255, 255, 0.03)',
    cellBorder: 'rgba(255, 255, 255, 0.08)',
    glow: 'shadow-[0_0_50px_rgba(10,22,40,0.8)]',
  },
  neon: {
    bg: '#090214',
    border: 'border-purple-500/30',
    cellBg: 'rgba(168, 85, 247, 0.05)',
    cellBorder: 'rgba(168, 85, 247, 0.2)',
    glow: 'shadow-[0_0_50px_rgba(168,85,247,0.3)]',
  },
  galaxy: {
    bg: '#020617',
    border: 'border-cyan-500/30',
    cellBg: 'rgba(14, 165, 233, 0.04)',
    cellBorder: 'rgba(14, 165, 233, 0.16)',
    glow: 'shadow-[0_0_50px_rgba(14,165,233,0.25)]',
  },
  crystal: {
    bg: '#041f2e',
    border: 'border-emerald-500/30',
    cellBg: 'rgba(16, 185, 129, 0.04)',
    cellBorder: 'rgba(16, 185, 129, 0.16)',
    glow: 'shadow-[0_0_50px_rgba(16,185,129,0.25)]',
  },
};

export default function LudoBoard() {
  const gameState       = useAppStore(s => s.gameState);
  const selectedTokenId = useAppStore(s => s.selectedTokenId);
  const selectToken     = useAppStore(s => s.selectToken);
  const settings        = useAppStore(s => s.settings);

  const themeConfig = THEME_STYLES[settings.theme] || THEME_STYLES.classic;

  const validMoveMap = useMemo(() => {
    const map = new Map<string, ValidMove>();
    (gameState?.validMoves ?? []).forEach(m => map.set(m.tokenId, m));
    return map;
  }, [gameState?.validMoves]);

  if (!gameState) return null;

  const { players } = gameState;

  // Compute token pixel positions + stacking offsets
  const tokenRenderData = useMemo(() => {
    const list: Array<{
      token: Token;
      pixel: [number, number];
      isValid: boolean;
      isSelected: boolean;
      move?: ValidMove;
    }> = [];

    // Group active tokens by cell to offset overlaps
    const cellCounts = new Map<string, number>();
    const cellIndices = new Map<string, number>();

    for (const player of players) {
      for (const token of player.tokens) {
        const key = getTokenLocationKey(token);
        cellCounts.set(key, (cellCounts.get(key) || 0) + 1);
      }
    }

    for (const player of players) {
      for (const token of player.tokens) {
        const key = getTokenLocationKey(token);
        const count = cellCounts.get(key) || 1;
        const index = cellIndices.get(key) || 0;
        cellIndices.set(key, index + 1);

        const basePixel = getTokenPixel(token);
        const offsetPixel = applyStackOffset(basePixel, index, count, token.state);

        list.push({
          token,
          pixel: offsetPixel,
          isValid: validMoveMap.has(token.id),
          isSelected: selectedTokenId === token.id,
          move: validMoveMap.get(token.id),
        });
      }
    }

    return list;
  }, [players, validMoveMap, selectedTokenId]);

  return (
    <div
      className={`relative rounded-3xl overflow-hidden shadow-2xl border ${themeConfig.border} ${themeConfig.glow}`}
      style={{ width: BOARD_SIZE, height: BOARD_SIZE, flexShrink: 0 }}
    >
      {/* Background layer */}
      <div className="absolute inset-0" style={{ backgroundColor: themeConfig.bg }} />

      {/* 4 Corner Yards */}
      <CornerYard color="yellow" row={0} col={0} label="YELLOW YARD" />
      <CornerYard color="green"  row={0} col={9} label="GREEN YARD" />
      <CornerYard color="red"    row={9} col={0} label="RED YARD" />
      <CornerYard color="blue"   row={9} col={9} label="BLUE YARD" />

      {/* Center 3x3 Finishing Area */}
      <CenterTriangleArea />

      {/* 52 Main Track Cells */}
      {TRACK_GRID_POSITIONS.map(([r, c], idx) => {
        const isSafe = SAFE_CELLS.has(idx);
        const arrow = START_ARROWS[idx];
        const isTargetCell = gameState.validMoves.some(m => {
          if (m.isEnteringFromBase) {
            return COLOR_START[m.tokenColor] === idx;
          }
          if (m.toPosition <= 51) {
            return calculateAbsolutePosition(m.tokenColor, m.toPosition) === idx;
          }
          return false;
        });

        // Coloring for starting cells
        let startColor: string | null = null;
        if (idx === 0)  startColor = COLOR_HEX.red;
        if (idx === 13) startColor = COLOR_HEX.yellow;
        if (idx === 26) startColor = COLOR_HEX.green;
        if (idx === 39) startColor = COLOR_HEX.blue;

        return (
          <div
            key={`track-${idx}`}
            style={{
              position: 'absolute',
              left:   c * CELL_SIZE,
              top:    r * CELL_SIZE,
              width:  CELL_SIZE,
              height: CELL_SIZE,
              background: startColor
                ? `${startColor}28`
                : isSafe
                  ? 'rgba(234, 179, 8, 0.12)'
                  : themeConfig.cellBg,
              border: `1px solid ${
                startColor
                  ? `${startColor}66`
                  : isSafe
                    ? 'rgba(234, 179, 8, 0.35)'
                    : themeConfig.cellBorder
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            {/* Safe Star */}
            {isSafe && (
              <span className="text-yellow-400 text-sm drop-shadow-[0_0_6px_rgba(234,179,8,0.8)] font-bold">
                ★
              </span>
            )}

            {/* Start Arrow */}
            {arrow && !isSafe && (
              <span className="text-xs font-bold" style={{ color: startColor || 'white' }}>
                {arrow}
              </span>
            )}

            {/* Target highlight */}
            {isTargetCell && (
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                style={{ background: 'rgba(168, 85, 247, 0.35)' }}
              />
            )}
          </div>
        );
      })}

      {/* Colored Home Paths */}
      {(['red', 'yellow', 'green', 'blue'] as PlayerColor[]).map(color => {
        const path = HOME_PATH_GRID[color];
        return path.map(([r, c], stepIdx) => {
          const isTargetCell = gameState.validMoves.some(m => {
            return m.tokenColor === color && m.toPosition === (52 + stepIdx);
          });

          return (
            <div
              key={`home-path-${color}-${stepIdx}`}
              style={{
                position: 'absolute',
                left:   c * CELL_SIZE,
                top:    r * CELL_SIZE,
                width:  CELL_SIZE,
                height: CELL_SIZE,
                background: `${COLOR_HEX[color]}44`,
                border: `1px solid ${COLOR_HEX[color]}77`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
              }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: COLOR_HEX[color], opacity: 0.8 }}
              >
                ●
              </span>

              {isTargetCell && (
                <motion.div
                  className="absolute inset-0"
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  style={{ background: `${COLOR_HEX[color]}88` }}
                />
              )}
            </div>
          );
        });
      })}

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
    </div>
  );
}

// ─── Corner Yard Component ────────────────────────────────────────────────────

interface CornerYardProps {
  color: PlayerColor;
  row: number;
  col: number;
  label: string;
}

function CornerYard({ color, row, col, label }: CornerYardProps) {
  const yardWidth = 6 * CELL_SIZE;
  const hex = COLOR_HEX[color];
  const sockets = BASE_POSITIONS[color];

  return (
    <div
      style={{
        position: 'absolute',
        left:   col * CELL_SIZE,
        top:    row * CELL_SIZE,
        width:  yardWidth,
        height: yardWidth,
        background: COLOR_BG[color],
        border: `2px solid ${COLOR_BORDER[color]}`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Inner White Court */}
      <div
        className="rounded-2xl relative shadow-inner"
        style={{
          width: yardWidth - 32,
          height: yardWidth - 32,
          background: 'rgba(15, 23, 42, 0.8)',
          border: `1.5px solid ${hex}44`,
          backdropFilter: 'blur(4px)',
        }}
      >
        {/* Yard Label */}
        <div
          className="absolute top-2 left-0 right-0 text-center text-[10px] font-bold tracking-widest uppercase opacity-60"
          style={{ color: hex }}
        >
          {label}
        </div>

        {/* 4 Base Sockets */}
        {sockets.map(([sr, sc], i) => {
          // relative coordinate inside the yard
          const rx = (sc - col) * CELL_SIZE;
          const ry = (sr - row) * CELL_SIZE;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: rx - 16 - 16, // offset from inner court
                top:  ry - 16 - 16,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: `${hex}22`,
                border: `2px solid ${hex}66`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 10px ${hex}33`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: hex,
                  opacity: 0.7,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Center Triangle Area ─────────────────────────────────────────────────────

function CenterTriangleArea() {
  const centerLeft = 6 * CELL_SIZE;
  const centerTop  = 6 * CELL_SIZE;
  const size       = 3 * CELL_SIZE;

  return (
    <div
      style={{
        position: 'absolute',
        left:   centerLeft,
        top:    centerTop,
        width:  size,
        height: size,
        background: '#070d1d',
        border: '1.5px solid rgba(255,255,255,0.15)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 114 114">
        {/* Yellow Left Triangle */}
        <polygon points="0,0 57,57 0,114" fill={COLOR_HEX.yellow} fillOpacity="0.45" stroke={COLOR_HEX.yellow} strokeWidth="1" />
        {/* Green Top Triangle */}
        <polygon points="0,0 114,0 57,57" fill={COLOR_HEX.green} fillOpacity="0.45" stroke={COLOR_HEX.green} strokeWidth="1" />
        {/* Blue Right Triangle */}
        <polygon points="114,0 114,114 57,57" fill={COLOR_HEX.blue} fillOpacity="0.45" stroke={COLOR_HEX.blue} strokeWidth="1" />
        {/* Red Bottom Triangle */}
        <polygon points="0,114 114,114 57,57" fill={COLOR_HEX.red} fillOpacity="0.45" stroke={COLOR_HEX.red} strokeWidth="1" />
      </svg>

      {/* Center Golden Star / Crown */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-2xl drop-shadow-[0_0_12px_rgba(234,179,8,0.9)]"
        >
          👑
        </motion.div>
      </div>
    </div>
  );
}

// ─── Token Piece ──────────────────────────────────────────────────────────────

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
  const size = CELL_SIZE * 0.72;

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
        zIndex: isSelected ? 60 : isValid ? 40 : 20,
        cursor: isValid ? 'pointer' : 'default',
      }}
      animate={{
        x:     0,
        y:     isSelected ? -6 : 0,
        scale: isSelected ? 1.25 : isValid ? 1.12 : 1,
      }}
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      onClick={onSelect}
      whileHover={isValid ? { scale: 1.28 } : {}}
      whileTap={isValid ? { scale: 0.95 } : {}}
    >
      {/* 3D Sphere Body */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${color} 60%, #000000 100%)`,
          border: `2px solid ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)'}`,
          boxShadow: [
            isSelected ? '0 0 0 3px #ffffff, 0 0 20px #ffffff' : '',
            isValid ? `0 0 16px ${color}` : '0 4px 10px rgba(0,0,0,0.6)',
          ].filter(Boolean).join(', '),
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Specular Shine */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '18%',
            width: '38%',
            height: '38%',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.7)',
            filter: 'blur(0.5px)',
          }}
        />
      </div>

      {/* Valid Move Pulse Ring */}
      {isValid && (
        <motion.div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: `2.5px solid ${color}`,
          }}
          animate={{ scale: [1, 1.45, 1], opacity: [0.9, 0, 0.9] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTokenLocationKey(token: Token): string {
  const { color, state, stepsMoved, index } = token;
  if (state === 'base') return `base-${color}-${index}`;
  if (state === 'home') return 'home-center';
  if (isInHomePath(stepsMoved)) return `homepath-${color}-${stepsMoved}`;
  const absPos = calculateAbsolutePosition(color, stepsMoved);
  return `track-${absPos}`;
}

function getTokenPixel(token: Token): [number, number] {
  const { color, state, stepsMoved, index } = token;

  if (state === 'base') {
    const slot = BASE_POSITIONS[color][index] || BASE_POSITIONS[color][0];
    return [slot[1] * CELL_SIZE + CELL_SIZE / 2, slot[0] * CELL_SIZE + CELL_SIZE / 2];
  }

  if (state === 'home') {
    return [7.5 * CELL_SIZE, 7.5 * CELL_SIZE];
  }

  // Active on Home Path (steps 52-56)
  if (isInHomePath(stepsMoved)) {
    const pathIdx = Math.min(Math.max(stepsMoved - 52, 0), HOME_PATH_GRID[color].length - 1);
    const pos = HOME_PATH_GRID[color][pathIdx];
    return [pos[1] * CELL_SIZE + CELL_SIZE / 2, pos[0] * CELL_SIZE + CELL_SIZE / 2];
  }

  // Active on Main Track (0-51)
  const absPos = calculateAbsolutePosition(color, stepsMoved);
  if (absPos >= 0 && absPos < TRACK_GRID_POSITIONS.length) {
    const pos = TRACK_GRID_POSITIONS[absPos];
    return [pos[1] * CELL_SIZE + CELL_SIZE / 2, pos[0] * CELL_SIZE + CELL_SIZE / 2];
  }

  return [7.5 * CELL_SIZE, 7.5 * CELL_SIZE];
}

function applyStackOffset(
  pixel: [number, number],
  index: number,
  count: number,
  state: string
): [number, number] {
  if (count <= 1 || state === 'base') return pixel;

  // Offsets for 2, 3, 4 tokens on the same cell
  const offsets: [number, number][] = [
    [-6, -6],
    [6, 6],
    [-6, 6],
    [6, -6],
  ];

  const off = offsets[index % offsets.length] || [0, 0];
  return [pixel[0] + off[0], pixel[1] + off[1]];
}
