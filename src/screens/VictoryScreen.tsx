import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home, Star, Zap } from 'lucide-react';
import { useAppStore } from '../store/gameStore';
import type { PlayerColor } from '../types/game';

const COLOR_HEX: Record<PlayerColor, string> = {
  red:    '#ef4444',
  blue:   '#3b82f6',
  green:  '#22c55e',
  yellow: '#eab308',
};

const POSITION_BADGES = ['🏆', '🥈', '🥉', '4️⃣'];
const POSITION_LABELS = ['1st Place', '2nd Place', '3rd Place', '4th Place'];

export default function VictoryScreen() {
  const gameState  = useAppStore(s => s.gameState);
  const resetGame  = useAppStore(s => s.resetGame);
  const setScreen  = useAppStore(s => s.setScreen);

  if (!gameState) return null;

  const { players, finishedPlayers, winner } = gameState;

  // Sort by finish order
  const sorted = [...players].sort((a, b) => {
    const ai = finishedPlayers.indexOf(a.color);
    const bi = finishedPlayers.indexOf(b.color);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const winnerPlayer = players.find(p => p.color === winner);

  const statsItems = [
    { label: 'Total Turns', value: gameState.turnCount },
    { label: 'Duration', value: formatDuration(Date.now() - gameState.startedAt) },
    { label: 'Players', value: players.length },
  ];

  return (
    <div className="min-h-screen bg-[#050a1a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
        <motion.div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 40%, ${COLOR_HEX[winner ?? 'red']}15, transparent 60%)` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Trophy header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [-10, 10, -10], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl mb-4"
          >
            🏆
          </motion.div>
          <h1 className="font-display font-black text-4xl text-gradient mb-2">
            GAME OVER
          </h1>
          {winnerPlayer && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold"
              style={{ color: COLOR_HEX[winnerPlayer.color] }}
            >
              {winnerPlayer.name} Wins! 🎉
            </motion.p>
          )}
        </div>

        {/* Player rankings */}
        <div className="glass-dark rounded-3xl p-5 border border-white/10 mb-5">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Final Rankings</p>
          <div className="space-y-3">
            {sorted.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 * i }}
                className="flex items-center gap-4 p-3 rounded-2xl"
                style={{
                  background: i === 0 ? `${COLOR_HEX[player.color]}15` : 'rgba(255,255,255,0.03)',
                  border: i === 0 ? `1px solid ${COLOR_HEX[player.color]}40` : '1px solid transparent',
                }}
              >
                <span className="text-2xl w-8 text-center">{POSITION_BADGES[i]}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: `${COLOR_HEX[player.color]}20` }}>
                  {player.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{player.name}</p>
                  <p className="text-xs text-white/40">{POSITION_LABELS[i]}</p>
                </div>
                {player.isBot && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40">BOT</span>
                )}
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: COLOR_HEX[player.color] }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {statsItems.map(item => (
            <div key={item.label} className="glass rounded-2xl p-3 text-center border border-white/10">
              <p className="text-white font-bold">{item.value}</p>
              <p className="text-white/40 text-xs">{item.label}</p>
            </div>
          ))}
        </div>

        {/* XP earned */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-4 border border-purple-500/20 mb-6 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Zap size={24} className="text-purple-400" />
          </div>
          <div>
            <p className="font-bold text-white">+{winner ? 150 : 50} XP Earned</p>
            <p className="text-white/40 text-sm">Keep playing to level up!</p>
          </div>
          <div className="ml-auto">
            <Star size={20} className="text-yellow-400" fill="currentColor" />
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={resetGame}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl
                       border border-white/20 text-white font-bold hover:bg-white/10 transition-all"
          >
            <Home size={20} />
            Main Menu
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              resetGame();
              // Could re-launch with same settings
            }}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl
                       bg-gradient-to-r from-purple-600 to-purple-900 text-white font-bold
                       shadow-lg shadow-purple-500/30"
          >
            <RotateCcw size={20} />
            Play Again
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

