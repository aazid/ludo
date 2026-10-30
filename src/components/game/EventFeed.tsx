import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/gameStore';
import type { GameEvent, PlayerColor } from '../../types/game';

const EVENT_ICONS: Record<GameEvent['type'], string> = {
  roll:    '🎲',
  move:    '▶️',
  capture: '💥',
  home:    '🏠',
  win:     '🏆',
  six:     '⭐',
  skip:    '⏭️',
  enter:   '🚀',
};

const EVENT_COLOR: Record<PlayerColor, string> = {
  red:    'text-red-400',
  blue:   'text-blue-400',
  green:  'text-green-400',
  yellow: 'text-yellow-400',
};

export default function EventFeed() {
  const events = useAppStore(s => s.gameState?.events ?? []);

  return (
    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
      <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1">Game Log</p>
      <AnimatePresence initial={false}>
        {events.slice(0, 15).map(event => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-2 py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="text-sm flex-shrink-0 mt-0.5">{EVENT_ICONS[event.type]}</span>
            <p className={`text-xs leading-tight ${EVENT_COLOR[event.playerColor]}`}>
              {event.description}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
      {events.length === 0 && (
        <p className="text-white/20 text-xs italic">Game events will appear here...</p>
      )}
    </div>
  );
}

