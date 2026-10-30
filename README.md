# 🎲 LUDO LEGENDS

> **A high-end, premium multiplayer Ludo game built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and Socket.IO.**

---

## 🌟 Features

### 🎮 Game Modes
1. **Play with Computer (Intelligent AI Bots)**
   - 1 vs 1, 1 vs 2, or 1 vs 3 Bots
   - 4 Difficulty Levels:
     - **Easy**: Casual, legal moves
     - **Medium**: Prioritizes captures and token exits
     - **Hard**: Evaluates risk, threats, and safe cell positioning
     - **Expert**: Competitive heuristics, danger zone avoidance, home stretch optimization
2. **Private Multiplayer (Room Codes)**
   - 6-character room codes
   - Host lobby with player management, copyable invite codes, and slot status
   - Dynamic fill with AI bots if desired
   - Real-time Socket.IO synchronization
3. **Local Multiplayer**
   - 2 to 4 players on the same screen with active turn indicators

### 🎲 3D-Inspired Animated Dice & Token Physics
- Shaking and roll bounce simulation with dynamic random pip cycling
- Glowing celebration effect on rolling a six
- Extra turn awarded on 6 (up to 2 times; 3 consecutive 6s forfeits the turn)
- Smooth cell-to-cell token movement, valid move pulsing rings, selection lift, and home celebrations

### 🛡️ Mathematically Accurate Ludo Board
- Standard 52-cell main track + colored home columns (steps 52-57)
- Proper coordinate mapping with safe cells (indicated by safe markers)
- Safe cells prevent opponent captures
- Tokens cannot overshoot home (exact roll required)

### 🎨 Premium Visuals & Audio Design
- Glassmorphic dark gaming aesthetic with vibrant player palettes
- 4 Board Themes: **Classic Navy**, **Cyberpunk Neon**, **Deep Space Galaxy**, **Prismatic Crystal**
- Live game activity log & quick reaction chat (emojis & celebratory toasts)
- Procedural audio effects for dice rolls, token moves, captures, sixes, and victories (no external audio files needed)
- Confetti celebration upon winning

---

## 🚀 Quick Start

### 1. Run Frontend
```bash
npm run dev
```
The game will start at `http://localhost:3000`.

### 2. Run Socket.IO Multiplayer Backend (Optional for private rooms)
```bash
npm run server
```
The backend server will run on `http://localhost:3001`.

### 3. Run Everything Together
```bash
npm run dev:all
```

### 4. Run Game Engine Tests
```bash
npm test
```

---

## 📐 Project Architecture

```
ludo/
├── src/
│   ├── types/
│   │   └── game.ts                # TypeScript interfaces and game types
│   ├── engine/
│   │   └── gameEngine.ts          # Pure deterministic Ludo rule engine & AI bot logic
│   ├── store/
│   │   └── gameStore.ts           # Zustand reactive state store & audio synthesizer
│   ├── services/
│   │   └── multiplayerService.ts  # Socket.IO client service abstraction
│   ├── components/
│   │   ├── board/
│   │   │   ├── LudoBoard.tsx      # 15×15 coordinate grid board & token rendering
│   │   │   └── AnimatedBoard.tsx  # Hero landing page live preview board
│   │   ├── dice/
│   │   │   └── Dice.tsx           # 3D dice rolling component
│   │   ├── players/
│   │   │   └── PlayerCard.tsx     # Player HUD cards with tokens status
│   │   ├── game/
│   │   │   ├── EventFeed.tsx      # Real-time event log
│   │   │   └── ReactionsPanel.tsx # In-game emoji & quick reaction panel
│   │   └── modals/
│   │       ├── ModeSelectModal.tsx
│   │       └── JoinRoomModal.tsx
│   ├── screens/
│   │   ├── HomePage.tsx           # Hero landing page with animated stars & mode selection
│   │   ├── GameScreen.tsx         # Main gameplay screen
│   │   ├── LobbyScreen.tsx        # Private room lobby
│   │   ├── VictoryScreen.tsx      # Final podium rankings & match XP
│   │   ├── ProfileScreen.tsx      # Player profile, avatar picker, stats & XP
│   │   ├── SettingsScreen.tsx     # Audio, themes, animation quality
│   │   └── HowToPlayScreen.tsx    # Interactive rule handbook
│   ├── App.tsx                    # Screen router & page transitions
│   ├── main.tsx
│   └── index.css                  # Tailwind styles & gaming glow effects
├── server/
│   ├── index.js                   # Express + Socket.IO authoritative server
│   └── package.json
└── tests/
    └── gameEngine.test.ts         # Automated test suite for Ludo rules (28 tests)
```

