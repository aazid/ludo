import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Wifi, Copy, Check, Play, UserPlus, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/gameStore';
import type { RoomPlayer, PlayerColor } from '../types/game';

const COLOR_HEX: Record<PlayerColor, string> = {
  red:    '#ef4444',
  blue:   '#3b82f6',
  green:  '#22c55e',
  yellow: '#eab308',
};

const COLOR_NAMES: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];

export default function LobbyScreen() {
  const currentRoom    = useAppStore(s => s.currentRoom);
  const userProfile    = useAppStore(s => s.userProfile);
  const leaveRoom      = useAppStore(s => s.leaveRoom);
  const toggleReady    = useAppStore(s => s.toggleReady);
  const startRoomGame  = useAppStore(s => s.startRoomGame);
  const setCurrentRoom = useAppStore(s => s.setCurrentRoom);
  const [copied, setCopied] = useState(false);

  // If no room is set, return to home
  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-[#050a1a] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-white/60 mb-4">No active room found.</p>
        <button onClick={leaveRoom} className="btn-primary">Return to Home</button>
      </div>
    );
  }

  const roomCode = currentRoom.code;
  const isHost = currentRoom.players.some(p => p.id === userProfile.id && p.isHost);
  const me = currentRoom.players.find(p => p.id === userProfile.id) || currentRoom.players[1];
  const isReady = me?.isReady ?? false;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addBotPlayer = () => {
    if (currentRoom.players.length >= currentRoom.maxPlayers) return;
    const botIdx = currentRoom.players.length;
    const color = COLOR_NAMES[botIdx] || 'yellow';
    const botPlayer: RoomPlayer = {
      id: `bot-${Date.now()}-${botIdx}`,
      name: `AI Bot ${botIdx}`,
      avatar: '🤖',
      color,
      isHost: false,
      isReady: true,
      isConnected: true,
    };
    setCurrentRoom({
      ...currentRoom,
      players: [...currentRoom.players, botPlayer],
    });
  };

  // Build slot list up to maxPlayers
  const slots: Array<RoomPlayer | null> = [];
  for (let i = 0; i < currentRoom.maxPlayers; i++) {
    slots.push(currentRoom.players[i] || null);
  }

  return (
    <div className="min-h-screen bg-[#050a1a] p-6 relative overflow-hidden flex flex-col items-center justify-center">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={leaveRoom}
              className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Private Lobby</h1>
              <p className="text-white/40 text-xs">Ready up to begin the match</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Lobby Active
          </div>
        </div>

        {/* Room Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-3xl p-6 border border-white/10 mb-5 text-center relative overflow-hidden"
        >
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <div className="px-6 py-3 rounded-2xl bg-white/10 border border-white/20">
              <span className="font-mono font-black text-3xl text-white tracking-widest">{roomCode}</span>
            </div>
            <button
              onClick={handleCopy}
              className="p-3.5 rounded-2xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 transition-all text-white"
            >
              {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
            </button>
          </div>
          {copied && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-green-400 font-semibold mt-2"
            >
              ✓ Code copied to clipboard! Share it with friends.
            </motion.p>
          )}
        </motion.div>

        {/* Player Slots */}
        <div className="glass-dark rounded-3xl p-5 border border-white/10 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">
              Players ({currentRoom.players.length}/{currentRoom.maxPlayers})
            </p>
            {isHost && currentRoom.players.length < currentRoom.maxPlayers && (
              <button
                onClick={addBotPlayer}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-all"
              >
                <UserPlus size={14} /> Add AI Bot
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {slots.map((player, idx) => {
              const color = COLOR_NAMES[idx];
              if (!player) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white/40 text-sm font-medium">Waiting for player...</p>
                      <p className="text-white/20 text-xs">Share code to invite</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-white/20"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.2 }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-white/20"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.2 + 0.3 }}
                      />
                    </div>
                  </div>
                );
              }

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border transition-all"
                  style={{
                    background: `${COLOR_HEX[player.color]}12`,
                    borderColor: `${COLOR_HEX[player.color]}35`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${COLOR_HEX[player.color]}25` }}
                  >
                    {player.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-white truncate">{player.name}</p>
                      {player.isHost && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 font-bold">
                          <Crown size={10} /> HOST
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: COLOR_HEX[player.color] }}>
                      {player.color.toUpperCase()} • {player.isReady ? '✓ Ready' : 'Not ready'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                        player.isReady
                          ? 'bg-green-500/20 border-green-500/40 text-green-400'
                          : 'bg-white/10 border-white/20 text-white/50'
                      }`}
                    >
                      {player.isReady ? 'Ready' : 'Waiting'}
                    </span>
                    <Wifi size={14} className="text-green-400" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-3">
          {!isHost && (
            <button
              onClick={toggleReady}
              className={`flex-1 py-3.5 rounded-2xl font-bold transition-all border ${
                isReady
                  ? 'bg-green-600/30 border-green-500/50 text-green-300 hover:bg-green-600/40'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
              }`}
            >
              {isReady ? '✓ You Are Ready' : 'Click to Ready Up'}
            </button>
          )}

          {isHost ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startRoomGame}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-900 text-white font-bold text-base shadow-lg shadow-purple-500/30 border border-purple-500/30 flex items-center justify-center gap-2"
            >
              <Play size={18} fill="currentColor" /> Start Match Now
            </motion.button>
          ) : (
            <div className="flex-1 py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-white/50 flex items-center justify-center">
              Waiting for Host to start match...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
