import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Zap, Target, TrendingUp, Star, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/gameStore';

const AVATARS = ['🦁', '🐯', '🦊', '🐺', '🐻', '🦝', '🐼', '🦄', '🦅', '🦋', '🐲', '⚡'];

export default function ProfileScreen() {
  const setScreen    = useAppStore(s => s.setScreen);
  const userProfile  = useAppStore(s => s.userProfile);
  const updateProfile = useAppStore(s => s.updateProfile);
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const xpToNext = (userProfile.level * 500) - (userProfile.xp % (userProfile.level * 500));
  const xpProgress = ((userProfile.xp % (userProfile.level * 500)) / (userProfile.level * 500)) * 100;
  const winRate = userProfile.totalGames > 0
    ? Math.round((userProfile.wins / userProfile.totalGames) * 100)
    : 0;

  const stats = [
    { icon: Trophy, label: 'Wins',       value: userProfile.wins,       color: 'text-yellow-400' },
    { icon: Target, label: 'Win Rate',   value: `${winRate}%`,           color: 'text-green-400' },
    { icon: Zap,    label: 'Total Games', value: userProfile.totalGames, color: 'text-purple-400' },
    { icon: TrendingUp, label: 'Streak', value: userProfile.winStreak,   color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen bg-[#050a1a] p-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setScreen('home')} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Player Profile</h1>
            <p className="text-white/40 text-sm">Your gaming journey</p>
          </div>
        </div>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-3xl p-6 border border-white/10 mb-5"
        >
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <button
                onClick={() => setShowAvatarPicker(o => !o)}
                className="w-20 h-20 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-4xl hover:bg-purple-500/30 transition-all"
              >
                {userProfile.avatar}
              </button>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                <Edit2 size={12} className="text-white" />
              </div>
            </div>

            <div className="flex-1">
              {editName ? (
                <div className="flex gap-2">
                  <input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-lg font-bold focus:outline-none focus:border-purple-500"
                    maxLength={20}
                    autoFocus
                  />
                  <button
                    onClick={() => { updateProfile({ name: nameInput }); setEditName(false); }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-sm font-semibold"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">{userProfile.name}</h2>
                  <button onClick={() => setEditName(true)} className="text-white/30 hover:text-white transition-all">
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
              <p className="text-purple-400 font-semibold">Level {userProfile.level} Legend</p>
            </div>
          </div>

          {/* Avatar picker */}
          {showAvatarPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 grid grid-cols-6 gap-2"
            >
              {AVATARS.map(av => (
                <button
                  key={av}
                  onClick={() => { updateProfile({ avatar: av }); setShowAvatarPicker(false); }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl hover:bg-white/10 transition-all
                    ${userProfile.avatar === av ? 'bg-purple-500/30 ring-2 ring-purple-500' : ''}`}
                >
                  {av}
                </button>
              ))}
            </motion.div>
          )}

          {/* XP bar */}
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>{userProfile.xp.toLocaleString()} XP</span>
              <span>{xpToNext} XP to Level {userProfile.level + 1}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-300"
              />
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="glass-dark rounded-2xl p-4 border border-white/10"
            >
              <s.icon size={20} className={`${s.color} mb-2`} />
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-white/40 text-sm">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Daily reward */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-dark rounded-2xl p-5 border border-yellow-500/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Star size={24} className="text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">Daily Reward</p>
              <p className="text-white/40 text-sm">Come back tomorrow for bonus XP!</p>
            </div>
            <button className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/30 transition-all">
              Claim
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

