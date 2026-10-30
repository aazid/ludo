import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Music, Monitor, Moon, Palette, BookOpen } from 'lucide-react';
import { useAppStore } from '../store/gameStore';
import type { BoardTheme } from '../types/game';

const THEMES: { value: BoardTheme; label: string; desc: string }[] = [
  { value: 'classic', label: 'Classic', desc: 'Traditional elegant board' },
  { value: 'neon',    label: 'Neon',    desc: 'Vibrant cyberpunk style' },
  { value: 'galaxy',  label: 'Galaxy',  desc: 'Deep space aesthetic' },
  { value: 'crystal', label: 'Crystal', desc: 'Crystalline prismatic' },
];

export default function SettingsScreen() {
  const setScreen      = useAppStore(s => s.setScreen);
  const settings       = useAppStore(s => s.settings);
  const updateSettings = useAppStore(s => s.updateSettings);

  return (
    <div className="min-h-screen bg-[#050a1a] p-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setScreen('home')}
            className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-white/40 text-sm">Customize your experience</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Sound & Music */}
          <SettingsSection title="Audio" icon={<Volume2 size={18} />}>
            <SettingsToggle
              label="Sound Effects"
              desc="Dice rolls, captures, and game sounds"
              icon={<Volume2 size={16} />}
              checked={settings.soundEnabled}
              onChange={v => updateSettings({ soundEnabled: v })}
            />
            <SettingsToggle
              label="Background Music"
              desc="Ambient game soundtrack"
              icon={<Music size={16} />}
              checked={settings.musicEnabled}
              onChange={v => updateSettings({ musicEnabled: v })}
            />
          </SettingsSection>

          {/* Display */}
          <SettingsSection title="Display" icon={<Monitor size={18} />}>
            <div className="space-y-2">
              <p className="text-sm text-white/60 font-semibold">Animation Quality</p>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(q => (
                  <button
                    key={q}
                    onClick={() => updateSettings({ animationQuality: q })}
                    className={`flex-1 py-2 rounded-xl border text-sm font-semibold capitalize transition-all
                      ${settings.animationQuality === q
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
                      }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </SettingsSection>

          {/* Board Theme */}
          <SettingsSection title="Board Theme" icon={<Palette size={18} />}>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(t => (
                <button
                  key={t.value}
                  onClick={() => updateSettings({ theme: t.value })}
                  className={`p-3 rounded-xl border text-left transition-all
                    ${settings.theme === t.value
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
                    }`}
                >
                  <p className="font-bold text-sm">{t.label}</p>
                  <p className="text-xs opacity-60">{t.desc}</p>
                </button>
              ))}
            </div>
          </SettingsSection>

          {/* About */}
          <SettingsSection title="About" icon={<BookOpen size={18} />}>
            <div className="space-y-2 text-sm text-white/50">
              <p>Ludo Legends v1.0.0</p>
              <p>Built with React, TypeScript, and Framer Motion</p>
              <p>For entertainment purposes only</p>
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({
  title, icon, children
}: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-dark rounded-2xl p-5 border border-white/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="text-purple-400">{icon}</div>
        <h2 className="text-base font-bold text-white">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

function SettingsToggle({
  label, desc, icon, checked, onChange
}: {
  label: string; desc: string; icon: React.ReactNode;
  checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-white/40">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-white/40">{desc}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0
          ${checked ? 'bg-purple-600' : 'bg-white/20'}`}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
          animate={{ x: checked ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

