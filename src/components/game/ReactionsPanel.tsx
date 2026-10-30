import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAppStore } from '../../store/gameStore';
import type { PlayerColor } from '../../types/game';

const REACTIONS = [
  { text: 'Nice Move! 👏', emoji: '👏' },
  { text: 'Lucky Six! 🎲', emoji: '🎲' },
  { text: 'Oops! 😅',      emoji: '😅' },
  { text: 'Good Game! 🤝', emoji: '🤝' },
  { text: 'Well Played! ⭐', emoji: '⭐' },
  { text: 'Got you! 😈',   emoji: '😈' },
];

const REACTION_COLORS: Record<PlayerColor, string> = {
  red:    'border-red-500/50 text-red-400',
  blue:   'border-blue-500/50 text-blue-400',
  green:  'border-green-500/50 text-green-400',
  yellow: 'border-yellow-500/50 text-yellow-400',
};

export default function ReactionsPanel() {
  const sendReaction = useAppStore(s => s.sendReaction);
  const reactions    = useAppStore(s => s.reactions);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Floating reactions */}
      <AnimatePresence>
        {reactions.map(r => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.7 }}
            className={`absolute bottom-full mb-2 right-0 px-3 py-1.5 rounded-xl text-sm font-semibold
                        glass border ${REACTION_COLORS[r.color] ?? 'border-white/20 text-white'}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            {r.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="px-3 py-2 rounded-xl glass border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
      >
        😄 React
      </button>

      {/* Picker */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            className="absolute bottom-full mb-2 right-0 glass-dark rounded-2xl border border-white/10 p-3 z-20"
            style={{ minWidth: 200 }}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {REACTIONS.map(r => (
                <button
                  key={r.text}
                  onClick={() => { sendReaction(r.text); setOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-xs text-white/70 hover:text-white transition-all text-left"
                >
                  <span>{r.emoji}</span>
                  <span>{r.text.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

