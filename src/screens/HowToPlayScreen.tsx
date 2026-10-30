import { motion } from 'framer-motion';
import { ArrowLeft, Dice6, Shield, Home, Star, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/gameStore';

const RULES = [
  {
    icon: '🎲',
    title: 'Starting the Game',
    points: [
      'Each player has 4 tokens that start in their home base.',
      'Roll a 6 to bring a token onto the main track.',
      'Rolling a 6 gives you an extra turn.',
      'Three consecutive sixes forfeits your turn.',
    ],
  },
  {
    icon: '▶️',
    title: 'Moving Tokens',
    points: [
      'Move any active token by the dice roll amount.',
      'Tokens move clockwise around the board.',
      'You cannot overshoot the final home position.',
      'You must move a token if any legal move exists.',
    ],
  },
  {
    icon: '💥',
    title: 'Capturing',
    points: [
      'Landing on an opponent\'s token sends it back to their base.',
      'Tokens on safe cells (marked with ●) cannot be captured.',
      'Your own tokens protect each other by blocking.',
    ],
  },
  {
    icon: '🏠',
    title: 'Winning',
    points: [
      'Guide all 4 of your tokens to the home center.',
      'You must roll the exact number needed to reach home.',
      'The first player to bring all tokens home wins!',
    ],
  },
  {
    icon: '🛡️',
    title: 'Safe Cells',
    points: [
      'The starting position of each player is a safe cell.',
      'Several additional cells around the board are safe.',
      'All cells in the colored home paths are safe.',
      'The center home zone is always safe.',
    ],
  },
];

export default function HowToPlayScreen() {
  const setScreen = useAppStore(s => s.setScreen);

  return (
    <div className="min-h-screen bg-[#050a1a] p-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setScreen('home')} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">How to Play</h1>
            <p className="text-white/40 text-sm">Master the rules of Ludo Legends</p>
          </div>
        </div>

        {/* Quick overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-3xl p-6 border border-white/10 mb-6 text-center"
        >
          <div className="text-5xl mb-3">🎯</div>
          <h2 className="text-xl font-bold text-white mb-2">Objective</h2>
          <p className="text-white/60 text-sm max-w-md mx-auto">
            Be the first player to move all four of your tokens from the starting base
            to the home center in the middle of the board.
          </p>
        </motion.div>

        {/* Rules */}
        <div className="space-y-4">
          {RULES.map((rule, i) => (
            <motion.div
              key={rule.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className="glass-dark rounded-2xl p-5 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{rule.icon}</span>
                <h3 className="text-base font-bold text-white">{rule.title}</h3>
              </div>
              <ul className="space-y-1.5">
                {rule.points.map((pt, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-white/60">
                    <ArrowRight size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <button
            onClick={() => setScreen('home')}
            className="btn-primary text-lg px-8 py-4"
          >
            Start Playing Now 🎲
          </button>
        </motion.div>
      </div>
    </div>
  );
}

