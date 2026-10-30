import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Settings, Volume2, VolumeX, LogOut } from 'lucide-react';
import { useAppStore } from '../store/gameStore';
import LudoBoard from '../components/board/LudoBoard';
import DraggableDice from '../components/dice/DraggableDice';
import PlayerCard from '../components/players/PlayerCard';
import EventFeed from '../components/game/EventFeed';
import ReactionsPanel from '../components/game/ReactionsPanel';
import VictoryScreen from './VictoryScreen';
import type { PlayerColor } from '../types/game';
import confetti from 'canvas-confetti';

const COLOR_HEX: Record<PlayerColor, string> = {
  red:    '#ef4444',
  yellow: '#eab308',
  green:  '#22c55e',
  blue:   '#3b82f6',
};

export default function GameScreen() {
  const gameState      = useAppStore(s => s.gameState);
  const settings       = useAppStore(s => s.settings);
  const resetGame      = useAppStore(s => s.resetGame);
  const updateSettings = useAppStore(s => s.updateSettings);
  const performBotTurn = useAppStore(s => s.performBotTurn);

  const [showExit, setShowExit]     = useState(false);
  const [boardScale, setBoardScale] = useState(1);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const prevWinner = useRef<PlayerColor | null>(null);

  // Responsive board scaling
  useEffect(() => {
    const resize = () => {
      if (!boardContainerRef.current) return;
      const container = boardContainerRef.current;
      const maxW = container.clientWidth - 16;
      const maxH = container.clientHeight - 16;
      const boardNaturalSize = 570; // 15 cells × 38px
      const scale = Math.min(maxW / boardNaturalSize, maxH / boardNaturalSize, 1);
      setBoardScale(Math.max(scale, 0.45));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Trigger bot turns
  useEffect(() => {
    if (!gameState) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer?.isBot && gameState.phase === 'rolling' && !gameState.isRolling) {
      const t = setTimeout(() => performBotTurn(), 1000);
      return () => clearTimeout(t);
    }
  }, [gameState?.currentPlayerIndex, gameState?.phase, gameState?.diceRolled]);

  // Confetti on win
  useEffect(() => {
    if (!gameState?.winner || gameState.winner === prevWinner.current) return;
    prevWinner.current = gameState.winner;

    const colors: Record<PlayerColor, string[]> = {
      red:    ['#ef4444', '#fca5a5'],
      yellow: ['#eab308', '#fde047'],
      green:  ['#22c55e', '#86efac'],
      blue:   ['#3b82f6', '#93c5fd'],
    };

    confetti({
      particleCount: 220,
      spread: 110,
      colors: colors[gameState.winner] ?? ['#9333ea', '#ec4899'],
      origin: { y: 0.6 },
    });
  }, [gameState?.winner]);

  if (!gameState) return null;

  const { players, currentPlayerIndex, phase } = gameState;
  const currentPlayer = players[currentPlayerIndex];

  // Victory screen
  if (phase === 'finished' && gameState.winner) {
    return <VictoryScreen />;
  }

  // 4 corners: p0=Red(BL), p1=Yellow(TL), p2=Green(TR), p3=Blue(BR)
  const p0 = players[0];
  const p1 = players[1];
  const p2 = players[2];
  const p3 = players[3];

  return (
    <div className="min-h-screen bg-[#050a1a] flex flex-col relative overflow-hidden select-none">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/15 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2.5 glass-dark border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-900 flex items-center justify-center font-bold text-xs text-white">
            LL
          </div>
          <div>
            <p className="text-xs font-bold text-white tracking-wider">LUDO LEGENDS</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">
              {gameState.mode === 'computer' ? 'vs Computer' : gameState.mode === 'local' ? 'Local Pass & Play' : 'Private Match'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Turn Badge */}
          <motion.div
            key={currentPlayer?.color}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass border border-white/10"
          >
            <motion.div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: currentPlayer ? COLOR_HEX[currentPlayer.color] : 'white' }}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <span className="text-xs font-bold text-white/90">
              {currentPlayer?.name}'s Turn
            </span>
          </motion.div>

          <ReactionsPanel />

          {/* Sound toggle */}
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
            title="Toggle Sound"
          >
            {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Exit */}
          <button
            onClick={() => setShowExit(true)}
            className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
            title="Leave Match"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Game Layout */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 gap-4 p-4 min-h-0 items-center justify-center">
        {/* Left Sidebar (Desktop) */}
        <div className="hidden lg:flex flex-col gap-4 w-52 flex-shrink-0 h-full justify-between py-2">
          {p1 && <PlayerCard player={p1} position="top-left" />}
          {p0 && <PlayerCard player={p0} position="bottom-left" />}

          <div className="glass-dark rounded-2xl p-3 border border-white/10 max-h-56">
            <EventFeed />
          </div>
        </div>

        {/* Center Board Column */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 gap-3 w-full max-w-2xl">
          {/* Mobile Top Player Cards */}
          <div className="flex lg:hidden gap-2 w-full justify-between px-2">
            {p1 && <PlayerCard player={p1} position="top-left" />}
            {p2 && <PlayerCard player={p2} position="top-right" />}
          </div>

          {/* Scaled Board */}
          <div
            ref={boardContainerRef}
            className="flex items-center justify-center w-full"
            style={{ height: 'calc(100vh - 160px)', minHeight: 340, maxHeight: 600 }}
          >
            <div style={{ transform: `scale(${boardScale})`, transformOrigin: 'center center' }}>
              <LudoBoard />
            </div>
          </div>

          {/* Mobile Bottom Player Cards */}
          <div className="flex lg:hidden gap-2 w-full justify-between px-2">
            {p0 && <PlayerCard player={p0} position="bottom-left" />}
            {p3 && <PlayerCard player={p3} position="bottom-right" />}
          </div>
        </div>

        {/* Right Sidebar (Desktop) */}
        <div className="hidden lg:flex flex-col gap-4 w-52 flex-shrink-0 h-full justify-between py-2">
          {p2 && <PlayerCard player={p2} position="top-right" />}
          {p3 && <PlayerCard player={p3} position="bottom-right" />}

          {/* Helper instructions */}
          <div className="glass-dark rounded-2xl p-3 border border-white/10 text-xs text-white/50 space-y-1.5">
            <p className="font-bold text-white/80">💡 Pro Tips:</p>
            <p>• You can <strong className="text-purple-400">drag the dice anywhere</strong> on the board/screen!</p>
            <p>• Rolling a 6 grants an extra turn (max 2 consecutive).</p>
            <p>• Stars (★) are safe cells.</p>
          </div>
        </div>
      </div>

      {/* Floating Draggable Dice (Can be moved anywhere on the entire screen!) */}
      <DraggableDice />

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExit && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-dark rounded-3xl p-6 border border-white/10 text-center max-w-sm w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <p className="text-3xl mb-2">🚪</p>
              <h3 className="text-xl font-bold text-white mb-1">Leave Match?</h3>
              <p className="text-white/50 text-xs mb-5">Your current game progress will be lost.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExit(false)}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm font-semibold"
                >
                  Stay
                </button>
                <button
                  onClick={resetGame}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-red-500/30"
                >
                  Leave Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
