import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { X, Settings, Volume2, VolumeX, Maximize2, LogOut } from 'lucide-react';
import { useAppStore } from '../store/gameStore';
import LudoBoard from '../components/board/LudoBoard';
import Dice from '../components/dice/Dice';
import PlayerCard from '../components/players/PlayerCard';
import EventFeed from '../components/game/EventFeed';
import ReactionsPanel from '../components/game/ReactionsPanel';
import VictoryScreen from './VictoryScreen';
import type { PlayerColor } from '../types/game';
import confetti from 'canvas-confetti';

const COLOR_LABEL: Record<PlayerColor, string> = {
  red:    'Red',
  blue:   'Blue',
  green:  'Green',
  yellow: 'Yellow',
};

export default function GameScreen() {
  const gameState    = useAppStore(s => s.gameState);
  const settings     = useAppStore(s => s.settings);
  const resetGame    = useAppStore(s => s.resetGame);
  const updateSettings = useAppStore(s => s.updateSettings);
  const performBotTurn = useAppStore(s => s.performBotTurn);

  const [showExit, setShowExit]   = useState(false);
  const [boardScale, setBoardScale] = useState(1);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const prevWinner = useRef<PlayerColor | null>(null);

  // Responsive board scaling
  useEffect(() => {
    const resize = () => {
      if (!boardContainerRef.current) return;
      const container = boardContainerRef.current;
      const maxW = container.clientWidth;
      const maxH = container.clientHeight;
      const boardNaturalSize = 570; // 15 cells × 38px
      const scale = Math.min(maxW / boardNaturalSize, maxH / boardNaturalSize, 1);
      setBoardScale(scale);
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

    const colors = {
      red: ['#ef4444', '#fca5a5'],
      blue: ['#3b82f6', '#93c5fd'],
      green: ['#22c55e', '#86efac'],
      yellow: ['#eab308', '#fde047'],
    };

    confetti({
      particleCount: 200,
      spread: 100,
      colors: colors[gameState.winner] ?? ['#9333ea', '#ec4899'],
      origin: { y: 0.6 },
    });
    setTimeout(() => confetti({ particleCount: 100, spread: 80, origin: { y: 0.7, x: 0.2 } }), 400);
    setTimeout(() => confetti({ particleCount: 100, spread: 80, origin: { y: 0.7, x: 0.8 } }), 700);
  }, [gameState?.winner]);

  if (!gameState) return null;

  const { players, currentPlayerIndex, phase } = gameState;
  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = !currentPlayer?.isBot;

  // Victory screen
  if (phase === 'finished' && gameState.winner) {
    return <VictoryScreen />;
  }

  // Arrange players for display: [0]=red=bottom-left, [1]=blue=bottom-right, [2]=green=top-right, [3]=yellow=top-left
  const p0 = players[0];
  const p1 = players[1];
  const p2 = players[2];
  const p3 = players[3];

  return (
    <div className="min-h-screen bg-[#050a1a] flex flex-col relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/15 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 glass-dark border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-900 flex items-center justify-center">
            <span className="text-xs font-bold">LL</span>
          </div>
          <div>
            <p className="text-xs font-bold text-white/80">LUDO LEGENDS</p>
            <p className="text-xs text-white/40">
              {gameState.mode === 'computer' ? 'vs Computer' : gameState.mode === 'local' ? 'Local Game' : 'Private Room'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Turn indicator */}
          <motion.div
            key={currentPlayer?.color}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass border border-white/10"
          >
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: currentPlayer ? {
                red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308'
              }[currentPlayer.color] : 'white' }}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <span className="text-xs font-semibold text-white/80">
              {currentPlayer?.name}'s Turn
            </span>
          </motion.div>

          {/* Sound toggle */}
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Exit */}
          <button
            onClick={() => setShowExit(true)}
            className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main game layout */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 gap-4 p-4 min-h-0">

        {/* Left sidebar */}
        <div className="hidden lg:flex flex-col gap-3 w-52 flex-shrink-0">
          {p3 && <PlayerCard player={p3} position="top-left" />}
          {p0 && <PlayerCard player={p0} position="bottom-left" />}

          <div className="flex-1" />

          {/* Event feed */}
          <div className="glass-dark rounded-2xl p-3 border border-white/10">
            <EventFeed />
          </div>
        </div>

        {/* Board center */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 gap-4">
          {/* Mobile player row top */}
          <div className="flex lg:hidden gap-2 w-full justify-between">
            {p3 && <PlayerCard player={p3} position="top-left" />}
            {p2 && <PlayerCard player={p2} position="top-right" />}
          </div>

          {/* Board */}
          <div
            ref={boardContainerRef}
            className="flex items-center justify-center w-full"
            style={{ minHeight: 300 }}
          >
            <div style={{ transform: `scale(${boardScale})`, transformOrigin: 'center center' }}>
              <LudoBoard />
            </div>
          </div>

          {/* Mobile player row bottom */}
          <div className="flex lg:hidden gap-2 w-full justify-between">
            {p0 && <PlayerCard player={p0} position="bottom-left" />}
            {p1 && <PlayerCard player={p1} position="bottom-right" />}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="hidden lg:flex flex-col gap-3 w-52 flex-shrink-0">
          {p2 && <PlayerCard player={p2} position="top-right" />}
          {p1 && <PlayerCard player={p1} position="bottom-right" />}

          <div className="flex-1" />

          {/* Dice + controls */}
          <div className="glass-dark rounded-2xl p-4 border border-white/10 flex flex-col items-center gap-3">
            <Dice size={80} disabled={currentPlayer?.isBot} />
            <ReactionsPanel />
          </div>
        </div>
      </div>

      {/* Mobile bottom bar: dice */}
      <div className="lg:hidden flex items-center justify-center gap-4 p-4 glass-dark border-t border-white/5">
        <Dice size={64} disabled={currentPlayer?.isBot} />
        <ReactionsPanel />
      </div>

      {/* Exit confirmation */}
      <AnimatePresence>
        {showExit && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-dark rounded-3xl p-8 border border-white/10 text-center max-w-sm w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <p className="text-2xl mb-2">🚪</p>
              <h3 className="text-xl font-bold text-white mb-2">Leave Game?</h3>
              <p className="text-white/50 text-sm mb-6">Your progress will be lost. Are you sure?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExit(false)}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-all font-semibold"
                >
                  Continue Playing
                </button>
                <button
                  onClick={resetGame}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all"
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

