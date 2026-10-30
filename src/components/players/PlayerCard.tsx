import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/gameStore';
import type { Player, PlayerColor } from '../../types/game';

const COLOR_HEX: Record<PlayerColor, string> = {
  red:    '#ef4444',
  blue:   '#3b82f6',
  green:  '#22c55e',
  yellow: '#eab308',
};

const COLOR_BG: Record<PlayerColor, string> = {
  red:    'rgba(239,68,68,0.15)',
  blue:   'rgba(59,130,246,0.15)',
  green:  'rgba(34,197,94,0.15)',
  yellow: 'rgba(234,179,8,0.15)',
};

const COLOR_BORDER: Record<PlayerColor, string> = {
  red:    'rgba(239,68,68,0.4)',
  blue:   'rgba(59,130,246,0.4)',
  green:  'rgba(34,197,94,0.4)',
  yellow: 'rgba(234,179,8,0.4)',
};

interface Props {
  player: Player;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export default function PlayerCard({ player, position }: Props) {
  const gameState = useAppStore(s => s.gameState);
  const isCurrentPlayer = gameState?.players[gameState.currentPlayerIndex]?.id === player.id;
  const color = player.color;

  const homeTokens   = player.tokens.filter(t => t.state === 'home').length;
  const baseTokens   = player.tokens.filter(t => t.state === 'base').length;
  const activeTokens = player.tokens.filter(t => t.state === 'active').length;
  const isFinished   = gameState?.finishedPlayers.includes(color);
  const finishPos    = player.finishPosition;

  const posStyles: Record<string, string> = {
    'top-left':     'items-start text-left',
    'top-right':    'items-end text-right',
    'bottom-left':  'items-start text-left',
    'bottom-right': 'items-end text-right',
  };

  return (
    <motion.div
      className={`flex flex-col gap-1 p-3 rounded-2xl border transition-all duration-300 ${posStyles[position]}`}
      style={{
        background:   isCurrentPlayer ? COLOR_BG[color] : 'rgba(255,255,255,0.03)',
        borderColor:  isCurrentPlayer ? COLOR_BORDER[color] : 'rgba(255,255,255,0.08)',
        boxShadow:    isCurrentPlayer ? `0 0 20px ${COLOR_HEX[color]}30` : 'none',
        minWidth: 120,
      }}
      animate={{
        scale: isCurrentPlayer ? 1.03 : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Header row */}
      <div className={`flex items-center gap-2 ${position.includes('right') ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: COLOR_BG[color], border: `1.5px solid ${COLOR_BORDER[color]}` }}
        >
          {isFinished ? (finishPos === 1 ? '🏆' : finishPos === 2 ? '🥈' : '🥉') : player.avatar}
        </div>

        <div>
          <div className="flex items-center gap-1">
            {player.isBot && (
              <span className="text-xs px-1 rounded bg-white/10 text-white/40">BOT</span>
            )}
            {player.isHost && (
              <span className="text-xs px-1 rounded bg-yellow-500/20 text-yellow-400">HOST</span>
            )}
          </div>
          <p className="text-sm font-bold text-white leading-tight truncate max-w-[80px]">
            {player.name}
          </p>
        </div>

        {/* Current turn indicator */}
        {isCurrentPlayer && !isFinished && (
          <motion.div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: COLOR_HEX[color] }}
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>

      {/* Token status */}
      <div className={`flex gap-1 mt-1 ${position.includes('right') ? 'flex-row-reverse' : ''}`}>
        {player.tokens.map(t => (
          <div
            key={t.id}
            className="w-4 h-4 rounded-full border"
            style={{
              background: t.state === 'home'
                ? COLOR_HEX[color]
                : t.state === 'active'
                  ? `${COLOR_HEX[color]}80`
                  : 'rgba(255,255,255,0.1)',
              borderColor: t.state === 'home' ? 'white' : COLOR_HEX[color],
              opacity: t.state === 'base' ? 0.4 : 1,
            }}
          />
        ))}
      </div>

      {/* Status text */}
      <p className="text-xs text-white/40 leading-none">
        {isFinished
          ? `Finished ${finishPos === 1 ? '1st 🏆' : finishPos === 2 ? '2nd 🥈' : '3rd 🥉'}`
          : isCurrentPlayer
            ? `${activeTokens} active • ${homeTokens} home`
            : `${homeTokens}/4 home`
        }
      </p>
    </motion.div>
  );
}

