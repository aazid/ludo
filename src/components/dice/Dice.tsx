import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/gameStore';

const FACES: Record<number, string> = {
  1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅',
};

// Dot positions for each dice face: [cx%, cy%][]
const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

interface Props {
  size?: number;
  disabled?: boolean;
}

export default function Dice({ size = 80, disabled = false }: Props) {
  const gameState    = useAppStore(s => s.gameState);
  const rollDiceAct  = useAppStore(s => s.rollDiceAction);
  const [displayVal, setDisplayVal] = useState<number>(1);
  const [isShaking, setIsShaking]   = useState(false);

  const diceValue  = gameState?.currentDiceValue ?? null;
  const isRolling  = gameState?.isRolling ?? false;
  const diceRolled = gameState?.diceRolled ?? false;
  const canRoll    = gameState?.phase === 'rolling' && !isRolling;

  // Animate random faces while rolling, then lock in result
  useEffect(() => {
    if (!isRolling) {
      if (diceValue !== null) setDisplayVal(diceValue);
      return;
    }

    setIsShaking(true);
    let interval = setInterval(() => {
      setDisplayVal(Math.floor(Math.random() * 6) + 1);
    }, 80);

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

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className="relative"
        style={{ width: size, height: size }}
        animate={isShaking ? {
          rotate: [0, -15, 15, -12, 12, -8, 8, 0],
          scale: [1, 1.1, 0.95, 1.08, 0.97, 1.03, 0.99, 1],
          x: [0, -4, 4, -3, 3, -1, 1, 0],
          y: [0, -3, 5, -4, 3, -2, 1, 0],
        } : {}}
        transition={isShaking ? { duration: 0.8, ease: 'easeInOut' } : {}}
      >
        {/* Glow for six */}
        {isSix && !isRolling && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'radial-gradient(circle, rgba(250,204,21,0.4) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        {/* Dice body */}
        <motion.div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
            boxShadow: `
              inset -3px -3px 6px rgba(0,0,0,0.2),
              inset 3px 3px 6px rgba(255,255,255,0.9),
              0 8px 24px rgba(0,0,0,0.5),
              ${isSix && !isRolling ? '0 0 30px rgba(250,204,21,0.8)' : '0 4px 12px rgba(0,0,0,0.4)'}
            `,
          }}
          animate={isShaking ? { rotateX: [0, 30, -20, 15, -10, 5, 0], rotateY: [0, -20, 30, -15, 10, -5, 0] } : {}}
          transition={isShaking ? { duration: 0.8 } : {}}
        >
          {/* Dots */}
          {(DOT_POSITIONS[displayVal] ?? []).map(([cx, cy], i) => (
            <motion.div
              key={`${displayVal}-${i}`}
              className="absolute rounded-full"
              style={{
                left:   `${cx}%`,
                top:    `${cy}%`,
                width:  size * 0.13,
                height: size * 0.13,
                background: isSix ? '#ca8a04' : '#1e293b',
                transform: 'translate(-50%, -50%)',
                boxShadow: isSix ? '0 0 6px rgba(202,138,4,0.8)' : 'inset 1px 1px 2px rgba(0,0,0,0.3)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, delay: i * 0.03 }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Roll button */}
      <motion.button
        whileHover={canRoll && !disabled ? { scale: 1.05, y: -2 } : {}}
        whileTap={canRoll && !disabled ? { scale: 0.95 } : {}}
        onClick={() => canRoll && !disabled && rollDiceAct()}
        disabled={!canRoll || disabled}
        className={`
          px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-200
          ${canRoll && !disabled
            ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 cursor-pointer'
            : 'bg-white/10 text-white/30 cursor-not-allowed'
          }
        `}
      >
        {isRolling ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              ⚡
            </motion.span>
            Rolling...
          </span>
        ) : canRoll ? 'Roll Dice' : diceRolled ? 'Pick a Token' : 'Waiting...'}
      </motion.button>

      {/* Result badge */}
      <AnimatePresence>
        {diceValue && !isRolling && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.8 }}
            className={`text-sm font-bold ${isSix ? 'text-yellow-400' : 'text-white/60'}`}
          >
            {isSix ? '🎲 SIX! Extra turn!' : `Rolled: ${diceValue}`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

