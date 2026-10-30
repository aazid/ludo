import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, Monitor, Bot, Users, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/gameStore';
import type { BotDifficulty } from '../../types/game';

interface Props {
  mode: 'computer' | 'local';
  onClose: () => void;
}

const DIFFICULTIES: { value: BotDifficulty; label: string; desc: string; color: string }[] = [
  { value: 'easy',   label: 'Easy',   desc: 'Perfect for beginners',      color: 'text-green-400 border-green-500/50' },
  { value: 'medium', label: 'Medium', desc: 'Balanced challenge',          color: 'text-yellow-400 border-yellow-500/50' },
  { value: 'hard',   label: 'Hard',   desc: 'Strategic AI opponent',       color: 'text-orange-400 border-orange-500/50' },
  { value: 'expert', label: 'Expert', desc: 'Ruthless, highly competitive', color: 'text-red-400 border-red-500/50' },
];

const BOT_COUNTS = [
  { value: 1, label: '1 Bot', desc: '2-player match' },
  { value: 2, label: '2 Bots', desc: '3-player match' },
  { value: 3, label: '3 Bots', desc: '4-player match' },
];

const LOCAL_COUNTS = [
  { value: 2, label: '2 Players', desc: 'Competitive duel' },
  { value: 3, label: '3 Players', desc: 'Three-way battle' },
  { value: 4, label: '4 Players', desc: 'Full board chaos' },
];

export default function ModeSelectModal({ mode, onClose }: Props) {
  const startVsComputer    = useAppStore(s => s.startVsComputer);
  const startLocalMultiplayer = useAppStore(s => s.startLocalMultiplayer);

  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [count,      setCount]      = useState(1);

  const handleStart = () => {
    if (mode === 'computer') {
      startVsComputer(count, difficulty);
    } else {
      startLocalMultiplayer(count + 1);
    }
    onClose();
  };

  const countOptions = mode === 'computer' ? BOT_COUNTS : LOCAL_COUNTS;
  const defaultCount = mode === 'computer' ? 1 : 2;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-md glass-dark rounded-3xl p-6 border border-white/10"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-900 flex items-center justify-center">
            {mode === 'computer' ? <Bot size={24} /> : <Users size={24} />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {mode === 'computer' ? 'Play vs Computer' : 'Local Multiplayer'}
            </h2>
            <p className="text-white/50 text-sm">
              {mode === 'computer' ? 'Challenge AI bots' : 'Same device, multiple players'}
            </p>
          </div>
        </div>

        {/* Player count */}
        <div className="mb-5">
          <p className="text-white/60 text-sm font-semibold mb-3 uppercase tracking-wider">
            {mode === 'computer' ? 'Number of Bots' : 'Number of Players'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {countOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setCount(opt.value)}
                className={`
                  p-3 rounded-xl border text-center transition-all duration-200
                  ${count === opt.value
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
                  }
                `}
              >
                <p className="font-bold text-sm">{opt.label}</p>
                <p className="text-xs text-white/40">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty (computer only) */}
        {mode === 'computer' && (
          <div className="mb-6">
            <p className="text-white/60 text-sm font-semibold mb-3 uppercase tracking-wider">
              Bot Difficulty
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`
                    p-3 rounded-xl border text-left transition-all duration-200
                    ${difficulty === d.value
                      ? `border-current bg-white/10 ${d.color}`
                      : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
                    }
                  `}
                >
                  <p className="font-bold text-sm">{d.label}</p>
                  <p className="text-xs opacity-70">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Start button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-900
                     text-white font-bold text-lg flex items-center justify-center gap-2
                     shadow-lg shadow-purple-500/30 border border-purple-500/30"
        >
          Start Game
          <ChevronRight size={20} />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

