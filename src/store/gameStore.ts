import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  GameState, Player, PlayerColor, Token, GameMode, BotDifficulty,
  GameSettings, ValidMove, GameEvent, UserProfile, BoardTheme, Room, RoomPlayer,
} from '../types/game';
import {
  rollDice, getValidMoves, applyMove, checkWinner, switchTurn,
  calculateBotMove, WINNING_POSITION,
} from '../engine/gameEngine';

// ─── Default values ──────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: GameSettings = {
  maxPlayers: 4,
  botCount: 0,
  botDifficulty: 'medium',
  soundEnabled: true,
  musicEnabled: false,
  animationQuality: 'high',
  theme: 'classic',
};

const AVATAR_LIST = ['🦁', '🐯', '🦊', '🐺', '🐻', '🦝', '🐼', '🦄'];
const BOT_NAMES = ['Atlas Bot', 'Nexus Bot', 'Vega Bot'];
const PLAYER_COLORS: PlayerColor[] = ['red', 'yellow', 'green', 'blue'];

export interface AppState {
  // Navigation
  screen: 'home' | 'game' | 'lobby' | 'settings' | 'profile' | 'howtoplay';
  gameMode: GameMode | null;

  // User
  userProfile: UserProfile;

  // Settings
  settings: GameSettings;

  // Game
  gameState: GameState | null;
  selectedTokenId: string | null;
  animatingTokenId: string | null;
  currentRoom: Room | null;

  // Reactions
  reactions: Array<{ id: string; text: string; color: PlayerColor; name: string; ts: number }>;

  // Actions
  setScreen: (screen: AppState['screen']) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateSettings: (updates: Partial<GameSettings>) => void;

  startVsComputer: (botCount: number, difficulty: BotDifficulty) => void;
  startLocalMultiplayer: (playerCount: number) => void;
  createRoom: (maxPlayers: number) => string;
  joinRoom: (code: string) => boolean;
  setCurrentRoom: (room: Room | null) => void;
  toggleReady: () => void;
  leaveRoom: () => void;
  startRoomGame: () => void;
  startGame: () => void;

  rollDiceAction: () => void;
  selectToken: (tokenId: string) => void;
  performBotTurn: () => void;

  sendReaction: (text: string) => void;
  resetGame: () => void;
}

// ─── Factory helpers ─────────────────────────────────────────────────────────

function createToken(color: PlayerColor, index: number): Token {
  return {
    id: `${color}-${index}`,
    color,
    index,
    state: 'base',
    position: -1,
    stepsMoved: 0,
  };
}

function createPlayer(
  id: string,
  name: string,
  color: PlayerColor,
  isBot: boolean,
  botDifficulty?: BotDifficulty,
  isHost = false
): Player {
  return {
    id,
    name,
    color,
    isBot,
    botDifficulty,
    isConnected: true,
    isHost,
    tokens: [0, 1, 2, 3].map(i => createToken(color, i)),
    avatar: AVATAR_LIST[Math.floor(Math.random() * AVATAR_LIST.length)],
    xp: 0,
    level: 1,
    wins: 0,
    losses: 0,
  };
}

function createInitialGameState(
  id: string,
  mode: GameMode,
  players: Player[]
): GameState {
  return {
    id,
    mode,
    phase: 'rolling',
    players,
    currentPlayerIndex: 0,
    currentDiceValue: null,
    consecutiveSixes: 0,
    isRolling: false,
    diceRolled: false,
    validMoves: [],
    events: [],
    finishedPlayers: [],
    winner: null,
    turnCount: 0,
    startedAt: Date.now(),
  };
}

function addEvent(
  state: GameState,
  type: GameEvent['type'],
  player: Player,
  description: string,
  diceValue?: number
): GameState {
  const event: GameEvent = {
    id: `evt-${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
    type,
    playerColor: player.color,
    playerName: player.name,
    description,
    diceValue,
  };
  return {
    ...state,
    events: [event, ...state.events].slice(0, 50),
  };
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    screen: 'home',
    gameMode: null,
    userProfile: {
      id: 'local-player',
      name: 'Player',
      avatar: '🦁',
      xp: 1250,
      level: 7,
      wins: 23,
      losses: 14,
      totalGames: 37,
      winStreak: 3,
    },
    settings: DEFAULT_SETTINGS,
    gameState: null,
    selectedTokenId: null,
    animatingTokenId: null,
    currentRoom: null,
    reactions: [],

    setScreen: (screen) => set({ screen }),

    updateProfile: (updates) =>
      set(s => ({ userProfile: { ...s.userProfile, ...updates } })),

    updateSettings: (updates) =>
      set(s => ({ settings: { ...s.settings, ...updates } })),

    startVsComputer: (botCount, difficulty) => {
      const { userProfile } = get();
      const players: Player[] = [
        createPlayer('local', userProfile.name, 'red', false, undefined, true),
      ];
      for (let i = 0; i < botCount; i++) {
        players.push(
          createPlayer(`bot-${i}`, BOT_NAMES[i] ?? `Bot ${i + 1}`, PLAYER_COLORS[i + 1], true, difficulty)
        );
      }
      const gs = createInitialGameState(`game-${Date.now()}`, 'computer', players);
      set({ gameState: gs, gameMode: 'computer', screen: 'game', selectedTokenId: null });
    },

    startLocalMultiplayer: (playerCount) => {
      const { userProfile } = get();
      const names = [userProfile.name, 'Player 2', 'Player 3', 'Player 4'];
      const players: Player[] = Array.from({ length: playerCount }, (_, i) =>
        createPlayer(`local-${i}`, names[i], PLAYER_COLORS[i], false, undefined, i === 0)
      );
      const gs = createInitialGameState(`game-${Date.now()}`, 'local', players);
      set({ gameState: gs, gameMode: 'local', screen: 'game', selectedTokenId: null });
    },

    createRoom: (maxPlayers: number) => {
      const { userProfile, settings } = get();
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const hostPlayer: RoomPlayer = {
        id: userProfile.id,
        name: userProfile.name,
        avatar: userProfile.avatar,
        color: 'red',
        isHost: true,
        isReady: true,
        isConnected: true,
      };
      const room: Room = {
        code,
        hostId: userProfile.id,
        players: [hostPlayer],
        maxPlayers,
        status: 'waiting',
        settings,
        createdAt: Date.now(),
      };
      set({ currentRoom: room, screen: 'lobby' });
      return code;
    },

    joinRoom: (code: string) => {
      const { userProfile, settings } = get();
      const formattedCode = code.trim().toUpperCase();
      const current = get().currentRoom;
      if (current && current.code === formattedCode) {
        set({ screen: 'lobby' });
        return true;
      }
      const guestPlayer: RoomPlayer = {
        id: `guest-${Date.now()}`,
        name: userProfile.name,
        avatar: userProfile.avatar,
        color: 'blue',
        isHost: false,
        isReady: false,
        isConnected: true,
      };
      const room: Room = {
        code: formattedCode,
        hostId: 'host-player',
        players: [
          {
            id: 'host-player',
            name: 'Room Host',
            avatar: '👑',
            color: 'red',
            isHost: true,
            isReady: true,
            isConnected: true,
          },
          guestPlayer,
        ],
        maxPlayers: 4,
        status: 'waiting',
        settings,
        createdAt: Date.now(),
      };
      set({ currentRoom: room, screen: 'lobby' });
      return true;
    },

    setCurrentRoom: (room) => set({ currentRoom: room }),

    toggleReady: () => {
      const { currentRoom, userProfile } = get();
      if (!currentRoom) return;
      const updatedPlayers = currentRoom.players.map(p =>
        p.id === userProfile.id || (!p.isHost && p.id.startsWith('guest-'))
          ? { ...p, isReady: !p.isReady }
          : p
      );
      set({ currentRoom: { ...currentRoom, players: updatedPlayers } });
    },

    leaveRoom: () => {
      set({ currentRoom: null, screen: 'home' });
    },

    startRoomGame: () => {
      const { currentRoom } = get();
      if (!currentRoom) return;

      const gamePlayers: Player[] = currentRoom.players.map((rp) =>
        createPlayer(rp.id, rp.name, rp.color, false, undefined, rp.isHost)
      );

      const remainingSlots = currentRoom.maxPlayers - gamePlayers.length;
      for (let i = 0; i < remainingSlots; i++) {
        const color = PLAYER_COLORS[gamePlayers.length];
        gamePlayers.push(
          createPlayer(`bot-${i}`, BOT_NAMES[i] ?? `Bot ${i + 1}`, color, true, 'medium', false)
        );
      }

      const gs = createInitialGameState(`game-${currentRoom.code}`, 'private', gamePlayers);
      set({ gameState: gs, gameMode: 'private', screen: 'game', selectedTokenId: null });
    },

    startGame: () => {
      get().startRoomGame();
    },

    rollDiceAction: () => {
      const { gameState, settings } = get();
      if (!gameState) return;
      if (gameState.isRolling || gameState.diceRolled) return;
      if (gameState.phase !== 'rolling') return;

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];

      // Play sound
      if (settings.soundEnabled) playSound('roll');

      // Rolling animation state
      set(s => ({
        gameState: s.gameState ? { ...s.gameState, isRolling: true } : null,
      }));

      // After animation delay, resolve dice
      setTimeout(() => {
        const diceValue = rollDice();
        let gs: GameState = { ...gameState, isRolling: false, currentDiceValue: diceValue, diceRolled: true };

        // Handle triple six
        let consecutive = gs.consecutiveSixes;
        if (diceValue === 6) {
          consecutive++;
          if (consecutive >= 3) {
            // Forfeit turn
            gs = addEvent(gs, 'skip', currentPlayer, `${currentPlayer.name} rolled three sixes! Turn forfeited.`, diceValue);
            gs = switchTurn(gs);
            gs.consecutiveSixes = 0;
            set({ gameState: gs, selectedTokenId: null });
            scheduleNextBotTurn(get);
            return;
          }
          gs.consecutiveSixes = consecutive;
          if (settings.soundEnabled) playSound('six');
        } else {
          gs.consecutiveSixes = 0;
        }

        gs = addEvent(gs, 'roll', currentPlayer, `${currentPlayer.name} rolled a ${diceValue}`, diceValue);

        // Compute valid moves
        const validMoves = getValidMoves(gs);
        gs.validMoves = validMoves;

        if (validMoves.length === 0) {
          // No valid moves – skip turn
          gs = addEvent(gs, 'skip', currentPlayer, `${currentPlayer.name} has no valid moves`, diceValue);
          const shouldGetExtraTurn = diceValue === 6;
          if (!shouldGetExtraTurn) {
            gs = switchTurn(gs);
          } else {
            gs.diceRolled = false;
            gs.phase = 'rolling';
          }
          set({ gameState: gs, selectedTokenId: null });
          scheduleNextBotTurn(get);
          return;
        }

        gs.phase = 'moving';
        set({ gameState: gs, selectedTokenId: null });

        if (currentPlayer.isBot) {
          setTimeout(() => {
            const bestMove = calculateBotMove(gs, currentPlayer.botDifficulty || 'medium');
            if (bestMove) {
              get().selectToken(bestMove.tokenId);
            }
          }, 600);
        } else if (validMoves.length === 1) {
          setTimeout(() => {
            get().selectToken(validMoves[0].tokenId);
          }, 400);
        }
      }, 900);
    },

    selectToken: (tokenId: string) => {
      const { gameState, settings } = get();
      if (!gameState) return;
      if (gameState.phase !== 'moving') return;

      const move = gameState.validMoves.find(m => m.tokenId === tokenId);
      if (!move) return;

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (settings.soundEnabled) playSound('move');

      set({ selectedTokenId: tokenId, animatingTokenId: tokenId });

      setTimeout(() => {
        let gs = applyMove(gameState, move);

        // Event logging
        if (move.isEnteringFromBase) {
          gs = addEvent(gs, 'enter', currentPlayer, `${currentPlayer.name} brought a token out!`);
        } else if (move.willCapture) {
          gs = addEvent(gs, 'capture', currentPlayer, `${currentPlayer.name} captured a token! 🎯`);
          if (settings.soundEnabled) playSound('capture');
        }
        if (move.willEnterHome && move.toPosition === WINNING_POSITION) {
          gs = addEvent(gs, 'home', currentPlayer, `${currentPlayer.name}'s token reached home! 🏠`);
          if (settings.soundEnabled) playSound('home');
        }

        // Check win
        const updatedPlayer = gs.players.find(p => p.color === currentPlayer.color)!;
        if (checkWinner(updatedPlayer)) {
          gs.finishedPlayers = [...gs.finishedPlayers, currentPlayer.color];
          if (settings.soundEnabled) playSound('win');
          updatedPlayer.finishPosition = gs.finishedPlayers.length;

          gs = addEvent(gs, 'win', currentPlayer, `🏆 ${currentPlayer.name} wins the game!`);

          if (gs.players.filter(p => !gs.finishedPlayers.includes(p.color)).length <= 1) {
            gs.winner = currentPlayer.color;
            gs.phase = 'finished';
            set({ gameState: gs, selectedTokenId: null, animatingTokenId: null });
            return;
          }
        }

        // Six = extra turn
        const extraTurn = gameState.currentDiceValue === 6;
        if (extraTurn) {
          gs.diceRolled = false;
          gs.currentDiceValue = null;
          gs.validMoves = [];
          gs.phase = 'rolling';
        } else {
          gs = switchTurn(gs);
        }

        set({ gameState: gs, selectedTokenId: null, animatingTokenId: null });
        scheduleNextBotTurn(get);
      }, 700);
    },

    performBotTurn: () => {
      const { gameState } = get();
      if (!gameState) return;
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (!currentPlayer.isBot) return;

      // Bot rolls dice
      get().rollDiceAction();
    },

    sendReaction: (text) => {
      const { gameState, userProfile } = get();
      const color: PlayerColor = 'red';
      const reaction = {
        id: `r-${Date.now()}`,
        text,
        color,
        name: userProfile.name,
        ts: Date.now(),
      };
      set(s => ({
        reactions: [...s.reactions, reaction].slice(-5),
      }));
      setTimeout(() => {
        set(s => ({
          reactions: s.reactions.filter(r => r.id !== reaction.id),
        }));
      }, 3000);
    },

    resetGame: () => {
      set({ gameState: null, gameMode: null, screen: 'home', selectedTokenId: null, animatingTokenId: null });
    },
  }))
);

// ─── Bot Scheduling ───────────────────────────────────────────────────────────

function scheduleNextBotTurn(get: () => AppState) {
  setTimeout(() => {
    const { gameState } = get();
    if (!gameState) return;
    if (gameState.phase === 'finished') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.isBot && gameState.phase === 'rolling') {
      get().performBotTurn();
    }
  }, 1200);
}

// ─── Sound ────────────────────────────────────────────────────────────────────

type SoundType = 'roll' | 'move' | 'capture' | 'six' | 'win' | 'home' | 'click';

const audioCtx: AudioContext | null = typeof window !== 'undefined'
  ? new (window.AudioContext || (window as any).webkitAudioContext)()
  : null;

function playSound(type: SoundType) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const configs: Record<SoundType, { freq: number[]; dur: number; type: OscillatorType }> = {
      roll:    { freq: [200, 400, 300], dur: 0.3, type: 'sawtooth' },
      move:    { freq: [440, 520],      dur: 0.15, type: 'sine' },
      capture: { freq: [600, 300, 200], dur: 0.4, type: 'square' },
      six:     { freq: [523, 659, 784, 1047], dur: 0.5, type: 'sine' },
      win:     { freq: [523, 659, 784, 1047, 1175], dur: 0.8, type: 'sine' },
      home:    { freq: [660, 880],      dur: 0.3, type: 'sine' },
      click:   { freq: [600],           dur: 0.05, type: 'square' },
    };

    const cfg = configs[type];
    osc.type = cfg.type;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);

    cfg.freq.forEach((f, i) => {
      const t = audioCtx!.currentTime + (i * cfg.dur) / cfg.freq.length;
      osc.frequency.setValueAtTime(f, t);
    });

    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + cfg.dur);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + cfg.dur);
  } catch (_) {}
}

