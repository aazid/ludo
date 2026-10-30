import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store/gameStore';
import HomePage from './screens/HomePage';
import GameScreen from './screens/GameScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import HowToPlayScreen from './screens/HowToPlayScreen';
import LobbyScreen from './screens/LobbyScreen';

const pageVariants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, scale: 1.02, transition: { duration: 0.2, ease: 'easeIn' } },
};

export default function App() {
  const screen = useAppStore(s => s.screen);

  return (
    <div className="min-h-screen bg-[#050a1a] text-white overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-screen"
        >
          {screen === 'home'      && <HomePage />}
          {screen === 'game'      && <GameScreen />}
          {screen === 'lobby'     && <LobbyScreen />}
          {screen === 'settings'  && <SettingsScreen />}
          {screen === 'profile'   && <ProfileScreen />}
          {screen === 'howtoplay' && <HowToPlayScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

