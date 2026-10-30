import { motion } from 'framer-motion';
import { useState } from 'react';
import { X, Hash, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/gameStore';

interface Props {
  onClose: () => void;
}

export default function JoinRoomModal({ onClose }: Props) {
  const [tab, setTab]           = useState<'join' | 'create'>('join');
  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const [playerCount, setCount] = useState(4);

  const createRoom = useAppStore(s => s.createRoom);
  const joinRoom   = useAppStore(s => s.joinRoom);

  const handleJoin = () => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setError('Please enter a valid 6-character room code.');
      return;
    }
    const success = joinRoom(cleanCode);
    if (success) {
      onClose();
    }
  };

  const handleCreate = () => {
    createRoom(playerCount);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative z-10 w-full max-w-md glass-dark rounded-3xl p-6 border border-white/10"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-900 flex items-center justify-center">
            <Hash size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Private Room</h2>
            <p className="text-white/50 text-sm">Create or join a private match</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-white/5 p-1 mb-5">
          {(['join', 'create'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize
                ${tab === t ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white'}`}
            >
              {t === 'join' ? 'Join Room' : 'Create Room'}
            </button>
          ))}
        </div>

        {tab === 'join' ? (
          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-sm font-semibold mb-2 block uppercase tracking-wider">
                Room Code
              </label>
              <input
                type="text"
                placeholder="Enter 6-character code"
                maxLength={6}
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20
                           text-white placeholder-white/30 font-mono text-lg tracking-widest
                           focus:outline-none focus:border-purple-500 transition-all uppercase"
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleJoin}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-900
                         text-white font-bold text-lg flex items-center justify-center gap-2
                         shadow-lg shadow-blue-500/30 border border-blue-500/30"
            >
              Join Room <ChevronRight size={20} />
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-sm font-semibold mb-2 block uppercase tracking-wider">
                Max Players
              </label>
              <div className="flex gap-2">
                {[2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`flex-1 py-3 rounded-xl border font-bold transition-all
                      ${playerCount === n ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'}`}
                  >
                    {n}P
                  </button>
                ))}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCreate}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-900
                         text-white font-bold text-lg flex items-center justify-center gap-2
                         shadow-lg shadow-purple-500/30 border border-purple-500/30"
            >
              Create Room <ChevronRight size={20} />
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
