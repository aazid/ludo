import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Swords, Users, Monitor, Hash, BookOpen,
  User, Settings, Star, Trophy, Zap, Shield,
} from 'lucide-react';
import { useAppStore } from '../store/gameStore';
import ModeSelectModal from '../components/modals/ModeSelectModal';
import JoinRoomModal from '../components/modals/JoinRoomModal';
import AnimatedBoard from '../components/board/AnimatedBoard';

// ── Floating star background
function StarField() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 4,
    dur: Math.random() * 3 + 2,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {stars.map(s => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
          }}
          animate={{ opacity: [0.1, 0.8, 0.1], scale: [1, 1.5, 1] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-900/20 rounded-full blur-3xl" />
    </div>
  );
}

type Modal = 'computer' | 'local' | 'join' | null;

const NAV_ITEMS = [
  { icon: BookOpen, label: 'How to Play', screen: 'howtoplay' as const },
  { icon: User,     label: 'Profile',     screen: 'profile'   as const },
  { icon: Settings, label: 'Settings',    screen: 'settings'  as const },
];

const STATS = [
  { icon: Trophy, value: '50K+', label: 'Players Online' },
  { icon: Star,   value: '4.9★', label: 'Rating' },
  { icon: Zap,    value: '1M+',  label: 'Games Played' },
  { icon: Shield, value: '100%', label: 'Fair Play' },
];

export default function HomePage() {
  const setScreen   = useAppStore(s => s.setScreen);
  const userProfile = useAppStore(s => s.userProfile);
  const [modal, setModal] = useState<Modal>(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowStats(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col">
      <StarField />

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center">
            <Swords size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-widest text-gradient">
            LUDO LEGENDS
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2"
        >
          {NAV_ITEMS.map(item => (
            <button
              key={item.label}
              onClick={() => setScreen(item.screen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/70
                         hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <item.icon size={16} />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}

          {/* User avatar pill */}
          <button
            onClick={() => setScreen('profile')}
            className="ml-2 flex items-center gap-2 px-3 py-2 rounded-xl glass hover:bg-white/10 transition-all"
          >
            <span className="text-lg">{userProfile.avatar}</span>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-none">{userProfile.name}</p>
              <p className="text-xs text-purple-400">Lv. {userProfile.level}</p>
            </div>
          </button>
        </motion.div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-8 max-w-7xl mx-auto w-full">

        {/* Left: logo + buttons */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-purple-300 mb-6 border border-purple-500/30">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              50,000+ players online now
            </div>

            <h1 className="font-display font-black leading-none mb-4">
              <span className="block text-5xl sm:text-6xl lg:text-7xl text-white drop-shadow-lg">
                LUDO
              </span>
              <motion.span
                className="block text-5xl sm:text-6xl lg:text-8xl text-gradient"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                style={{ backgroundSize: '200% auto' }}
              >
                LEGENDS
              </motion.span>
            </h1>

            <p className="text-white/60 text-lg mb-10 max-w-md">
              The ultimate premium Ludo experience. Battle friends, crush AI opponents,
              and rise to the top of the leaderboard.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col gap-3 w-full max-w-xs"
          >
            <PlayButton
              icon={<Zap size={20} />}
              label="Play Now"
              sublabel="Quick match vs AI"
              gradient="from-purple-600 to-purple-900"
              glow="shadow-purple-500/40"
              onClick={() => setModal('computer')}
              primary
            />
            <PlayButton
              icon={<Users size={20} />}
              label="Play With Friends"
              sublabel="Private room with code"
              gradient="from-blue-600 to-blue-900"
              glow="shadow-blue-500/40"
              onClick={() => setModal('join')}
            />
            <PlayButton
              icon={<Monitor size={20} />}
              label="Local Multiplayer"
              sublabel="Same device, 2-4 players"
              gradient="from-green-700 to-green-900"
              glow="shadow-green-500/40"
              onClick={() => setModal('local')}
            />
            <PlayButton
              icon={<Hash size={20} />}
              label="Join Private Room"
              sublabel="Enter a 6-digit code"
              gradient="from-yellow-700 to-yellow-900"
              glow="shadow-yellow-500/40"
              onClick={() => setModal('join')}
            />
          </motion.div>

          {/* Stats bar */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-6 mt-10"
              >
                {STATS.map(stat => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <stat.icon size={16} className="text-purple-400" />
                    <div>
                      <p className="text-white font-bold text-sm leading-none">{stat.value}</p>
                      <p className="text-white/40 text-xs">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: animated board preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          className="hidden lg:block flex-shrink-0"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-3xl scale-110" />
            <AnimatedBoard />
          </div>
        </motion.div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'computer' && (
          <ModeSelectModal mode="computer" onClose={() => setModal(null)} />
        )}
        {modal === 'local' && (
          <ModeSelectModal mode="local" onClose={() => setModal(null)} />
        )}
        {modal === 'join' && (
          <JoinRoomModal onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

interface PlayButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  gradient: string;
  glow: string;
  onClick: () => void;
  primary?: boolean;
}

function PlayButton({ icon, label, sublabel, gradient, glow, onClick, primary }: PlayButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left
        bg-gradient-to-r ${gradient}
        shadow-lg ${glow}
        border border-white/10
        transition-all duration-200
        ${primary ? 'ring-2 ring-purple-500/50' : ''}
      `}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="font-bold text-white text-base leading-tight">{label}</p>
        <p className="text-white/60 text-xs">{sublabel}</p>
      </div>
      {primary && (
        <motion.div
          className="ml-auto text-yellow-400"
          animate={{ rotate: [0, 20, -20, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Star size={16} fill="currentColor" />
        </motion.div>
      )}
    </motion.button>
  );
}

