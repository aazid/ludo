import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { GripHorizontal, RotateCcw, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/gameStore';

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78]],
};

const COLOR_HEX: Record<string, string> = {
  red:    '#ef4444',
  yellow: '#eab308',
  green:  '#22c55e',
  blue:   '#3b82f6',
};

export default function DraggableDice() {
  const gameState     = useAppStore(s => s.gameState);
  const rollDiceAct   = useAppStore(s => s.rollDiceAction);
  const [displayVal, setDisplayVal] = useState<number>(1);
  const [isShaking, setIsShaking]   = useState(false);
  const [positionKey, setPositionKey] = useState(0);

  const diceValue  = gameState?.currentDiceValue ?? null;
  const isRolling  = gameState?.isRolling ?? false;
  const diceRolled = gameState?.diceRolled ?? false;
  const currentPlayer = gameState?.players[gameState?.currentPlayerIndex ?? 0];
  const isBotTurn  = currentPlayer?.isBot ?? false;
  const canRoll    = gameState?.phase === 'rolling' && !isRolling && !isBotTurn;

  // Animate random faces while rolling
  useEffect(() => {
    if (!isRolling) {
      if (diceValue !== null) setDisplayVal(diceValue);
      return;
    }

    setIsShaking(true);
    const interval = setInterval(() => {
      setDisplayVal(Math.floor(Math.random() * 6) + 1);
    }, 70);

    const timer = setTimeout(() => {
      clearInterval(interval);
      setIsShaking(false);
      if (diceValue) setDisplayVal(diceValue);
    }, 850);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isRolling, diceValue]);

  const isSix = displayVal === 6;
  const playerColor = currentPlayer ? COLOR_HEX[currentPlayer.color] || '#a855f7' : '#a855f7';

  const handleRoll = () => {
    if (canRoll) {
      rollDiceAct();
    }
  };

  const handleResetPos = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPositionKey(k => k + 1);
  };

  return (
    <motion.div
      key={positionKey}
      drag
      dragMomentum={false}
      dragElastic={0.08}
      whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 100 }}
      initial={{ x: 0, y: 0 }}
      className="absolute right-4 bottom-4 z-40 cursor-grab active:cursor-grabbing select-none"
    >
      <div
        className="glass-dark rounded-3xl p-4 border border-white/20 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-3"
        style={{
          boxShadow: `0 12px 36px rgba(0,0,0,0.6), 0 0 24px ${playerColor}33`,
          minWidth: 150,
        }}
      >
        {/* Drag handle & header */}
        <div className="w-full flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-1.5 text-white/50 text-xs font-semibold">
            <GripHorizontal size={16} className="text-white/40" />
            <span>DRAG ANYWHERE</span>
          </div>
          <button
            onClick={handleResetPos}
            title="Reset position"
            className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all"
          >
            <RotateCcw size={12} />
          </button>
        </div>

        {/* Turn indicator */}
        <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
          <span className="text-sm">{currentPlayer?.avatar ?? '🎲'}</span>
          <span style={{ color: playerColor }}>
            {isBotTurn ? `${currentPlayer?.name} (Bot)` : `${currentPlayer?.name ?? 'Player'}'s Turn`}
          </span>
        </div>

        {/* 3D Dice */}
        <div className="relative py-2" onClick={handleRoll}>
          <motion.div
            className="relative cursor-pointer"
            style={{ width: 84, height: 84 }}
            animate={isShaking ? {
              rotate: [0, -25, 25, -15, 15, -8, 8, 0],
              scale: [1, 1.15, 0.92, 1.12, 0.95, 1.05, 1],
              x: [0, -6, 6, -4, 4, -2, 2, 0],
              y: [0, -5, 6, -4, 5, -2, 2, 0],
            } : {
              scale: canRoll ? [1, 1.04, 1] : 1,
            }}
            transition={isShaking ? { duration: 0.85, ease: 'easeInOut' } : {
              duration: 1.5, repeat: canRoll ? Infinity : 0, ease: 'easeInOut'
            }}
            whileHover={canRoll ? { scale: 1.08 } : {}}
            whileTap={canRoll ? { scale: 0.95 } : {}}
          >
            {/* Glow for six */}
            {isSix && !isRolling && (
              <motion.div
                className="absolute -inset-3 rounded-3xl"
                style={{
                  background: 'radial-gradient(circle, rgba(234,179,8,0.6) 0%, transparent 75%)',
                  filter: 'blur(10px)',
                }}
                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.25, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
            )}

            {/* Turn pulse ring */}
            {canRoll && (
              <motion.div
                className="absolute -inset-2 rounded-2xl border-2"
                style={{ borderColor: playerColor }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}

            {/* Dice Face Body */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden border border-white/60"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 70%, #cbd5e1 100%)',
                boxShadow: `
                  inset -3px -3px 8px rgba(0,0,0,0.25),
                  inset 3px 3px 8px rgba(255,255,255,0.9),
                  0 10px 25px rgba(0,0,0,0.5),
                  ${isSix && !isRolling ? '0 0 25px rgba(234,179,8,0.8)' : `0 4px 15px ${playerColor}40`}
                `,
              }}
            >
              {/* Corner specular gloss */}
              <div
                className="absolute top-0 left-0 w-8 h-8 rounded-br-2xl pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.8), transparent)' }}
              />

              {/* Dots */}
              {(DOT_POSITIONS[displayVal] ?? []).map(([cx, cy], i) => (
                <motion.div
                  key={`${displayVal}-${i}`}
                  className="absolute rounded-full"
                  style={{
                    left: `${cx}%`,
                    top:  `${cy}%`,
                    width: 14,
                    height: 14,
                    background: isSix ? '#b45309' : '#0f172a',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: isSix
                      ? '0 0 8px rgba(234,179,8,0.9), inset 1px 1px 2px rgba(255,255,255,0.4)'
                      : 'inset 1px 1px 2px rgba(0,0,0,0.5), 0 1px 2px rgba(255,255,255,0.6)',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, delay: i * 0.02 }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={canRoll ? { scale: 1.03 } : {}}
          whileTap={canRoll ? { scale: 0.97 } : {}}
          onClick={handleRoll}
          disabled={!canRoll}
          className={`
            w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5
            ${canRoll
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/40 hover:from-purple-500 hover:to-indigo-500 cursor-pointer'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
            }
          `}
        >
          {isRolling ? (
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="animate-spin" />
              Rolling...
            </span>
          ) : isBotTurn ? (
            'Bot Playing...'
          ) : canRoll ? (
            '🎲 Click to Roll'
          ) : diceRolled ? (
            '👉 Pick a Token'
          ) : (
            'Waiting...'
          )}
        </motion.button>

        {/* Status result */}
        <AnimatePresence>
          {diceValue && !isRolling && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.9 }}
              className={`text-xs font-bold text-center ${isSix ? 'text-yellow-400 animate-pulse' : 'text-white/70'}`}
            >
              {isSix ? '🔥 SIX! Extra Turn!' : `Rolled: ${diceValue}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
