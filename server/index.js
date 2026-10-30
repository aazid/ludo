import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app  = express();
const http = createServer(app);

const io = new Server(http, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// ─── In-memory room store ─────────────────────────────────────────────────────

const rooms = new Map(); // roomCode → Room

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

// ─── REST endpoints ───────────────────────────────────────────────────────────

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

app.post('/api/rooms', (req, res) => {
  const { hostName, hostAvatar, maxPlayers = 4 } = req.body;
  const code = generateRoomCode();
  const hostId = uuidv4();

  const room = {
    code,
    hostId,
    maxPlayers,
    status: 'waiting',
    players: [{
      id: hostId,
      name: hostName || 'Host',
      avatar: hostAvatar || '🦁',
      color: 'red',
      isHost: true,
      isReady: true,
      isConnected: true,
      socketId: null,
    }],
    gameState: null,
    createdAt: Date.now(),
  };

  rooms.set(code, room);
  setTimeout(() => rooms.delete(code), 60 * 60 * 1000); // 1hr cleanup

  res.json({ code, hostId });
});

// ─── Socket.IO events ─────────────────────────────────────────────────────────

const COLORS = ['red', 'blue', 'green', 'yellow'];

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on('room:join', ({ roomCode, playerName, playerAvatar, playerId }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('room:error', { message: 'Room not found. Check the code and try again.' });
      return;
    }
    if (room.status !== 'waiting') {
      socket.emit('room:error', { message: 'This game has already started.' });
      return;
    }
    if (room.players.length >= room.maxPlayers) {
      socket.emit('room:error', { message: 'Room is full.' });
      return;
    }

    // Check if reconnecting
    let player = room.players.find(p => p.id === playerId);
    if (player) {
      player.socketId = socket.id;
      player.isConnected = true;
    } else {
      const usedColors = room.players.map(p => p.color);
      const color = COLORS.find(c => !usedColors.includes(c)) || 'blue';
      player = {
        id: uuidv4(),
        name: playerName || 'Player',
        avatar: playerAvatar || '🦄',
        color,
        isHost: false,
        isReady: false,
        isConnected: true,
        socketId: socket.id,
      };
      room.players.push(player);
    }

    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerId = player.id;

    socket.emit('room:joined', { room, playerId: player.id });
    io.to(roomCode).emit('room:updated', room);
    console.log(`[room:${roomCode}] ${player.name} joined (${room.players.length}/${room.maxPlayers})`);
  });

  socket.on('room:ready', ({ roomCode, playerId, isReady }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === playerId);
    if (player) { player.isReady = isReady; }
    io.to(roomCode).emit('room:updated', room);
  });

  socket.on('room:kick', ({ roomCode, hostId, targetId }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== hostId) return;
    room.players = room.players.filter(p => p.id !== targetId);
    io.to(roomCode).emit('room:updated', room);
    // Optionally disconnect the kicked socket
  });

  socket.on('game:start', ({ roomCode, hostId }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== hostId) return;
    if (room.players.length < 2) {
      socket.emit('room:error', { message: 'Need at least 2 players to start.' });
      return;
    }

    room.status = 'playing';
    room.gameState = initServerGameState(room.players);
    io.to(roomCode).emit('game:started', room.gameState);
    console.log(`[room:${roomCode}] Game started with ${room.players.length} players`);
  });

  socket.on('game:roll', ({ roomCode, playerId }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState) return;

    const gs = room.gameState;
    const currentPlayer = gs.players[gs.currentPlayerIndex];

    // Validate it's this player's turn
    if (currentPlayer.id !== playerId) {
      socket.emit('game:error', { message: 'Not your turn.' });
      return;
    }
    if (gs.diceRolled) {
      socket.emit('game:error', { message: 'Already rolled.' });
      return;
    }

    const dice = Math.floor(Math.random() * 6) + 1;
    gs.currentDiceValue = dice;
    gs.diceRolled = true;

    if (dice === 6) {
      gs.consecutiveSixes = (gs.consecutiveSixes || 0) + 1;
      if (gs.consecutiveSixes >= 3) {
        // Forfeit
        advanceTurn(gs);
        io.to(roomCode).emit('game:state', gs);
        return;
      }
    } else {
      gs.consecutiveSixes = 0;
    }

    gs.validMoves = computeValidMoves(gs);
    io.to(roomCode).emit('game:state', gs);
  });

  socket.on('game:move', ({ roomCode, playerId, tokenId }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState) return;

    const gs = room.gameState;
    const currentPlayer = gs.players[gs.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    const move = gs.validMoves?.find(m => m.tokenId === tokenId);
    if (!move) {
      socket.emit('game:error', { message: 'Invalid move.' });
      return;
    }

    applyServerMove(gs, move);

    // Check win
    const player = gs.players.find(p => p.color === move.tokenColor);
    if (player && player.tokens.every(t => t.state === 'home')) {
      if (!gs.finishedPlayers.includes(player.color)) {
        gs.finishedPlayers.push(player.color);
        player.finishPosition = gs.finishedPlayers.length;
      }
      const remaining = gs.players.filter(p => !gs.finishedPlayers.includes(p.color));
      if (remaining.length <= 1) {
        gs.winner = player.color;
        gs.phase = 'finished';
        io.to(roomCode).emit('game:state', gs);
        return;
      }
    }

    // Extra turn on 6
    if (gs.currentDiceValue === 6) {
      gs.diceRolled = false;
      gs.currentDiceValue = null;
      gs.validMoves = [];
    } else {
      advanceTurn(gs);
    }

    io.to(roomCode).emit('game:state', gs);
  });

  socket.on('disconnect', () => {
    const { roomCode, playerId } = socket.data ?? {};
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;
      io.to(roomCode).emit('room:updated', room);
      console.log(`[room:${roomCode}] ${player.name} disconnected`);
    }
  });
});

// ─── Server-side game helpers ────────────────────────────────────────────────

function initServerGameState(roomPlayers) {
  const players = roomPlayers.map(rp => ({
    id: rp.id,
    name: rp.name,
    color: rp.color,
    avatar: rp.avatar,
    isBot: false,
    isHost: rp.isHost,
    isConnected: rp.isConnected,
    tokens: [0, 1, 2, 3].map(i => ({
      id: `${rp.color}-${i}`,
      color: rp.color,
      index: i,
      state: 'base',
      position: -1,
      stepsMoved: 0,
    })),
    finishPosition: null,
    xp: 0, level: 1, wins: 0, losses: 0,
  }));

  return {
    id: uuidv4(),
    mode: 'private',
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

const COLOR_START = { red: 0, blue: 13, green: 26, yellow: 39 };
const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

function calcAbsPos(color, steps) {
  if (steps <= 0) return -1;
  if (steps > 57) return 57;
  if (steps > 51) return steps;
  return (COLOR_START[color] + steps - 1) % 52;
}

function computeValidMoves(gs) {
  const { players, currentPlayerIndex, currentDiceValue } = gs;
  if (currentDiceValue == null) return [];
  const current = players[currentPlayerIndex];
  const moves = [];

  for (const token of current.tokens) {
    if (token.state === 'home') continue;
    if (token.state === 'base') {
      if (currentDiceValue === 6) {
        const move = {
          tokenId: token.id, tokenColor: token.color, tokenIndex: token.index,
          fromPosition: -1, toPosition: 1, willCapture: false, isEnteringFromBase: true, willEnterHome: false,
        };
        const cap = findCapture(COLOR_START[token.color], token.color, players);
        if (cap) { move.willCapture = true; move.capturedTokenId = cap; }
        moves.push(move);
      }
      continue;
    }
    const newSteps = token.stepsMoved + currentDiceValue;
    if (newSteps > 57) continue;
    const move = {
      tokenId: token.id, tokenColor: token.color, tokenIndex: token.index,
      fromPosition: token.stepsMoved, toPosition: newSteps,
      willCapture: false, isEnteringFromBase: false, willEnterHome: newSteps >= 52,
    };
    if (newSteps <= 51) {
      const absPos = calcAbsPos(token.color, newSteps);
      const cap = findCapture(absPos, token.color, players);
      if (cap && !SAFE_CELLS.has(absPos)) { move.willCapture = true; move.capturedTokenId = cap; }
    }
    moves.push(move);
  }
  return moves;
}

function findCapture(absPos, movingColor, players) {
  for (const p of players) {
    if (p.color === movingColor) continue;
    for (const t of p.tokens) {
      if (t.state !== 'active') continue;
      if (t.stepsMoved > 51) continue;
      if (calcAbsPos(t.color, t.stepsMoved) === absPos) return t.id;
    }
  }
  return null;
}

function applyServerMove(gs, move) {
  if (move.willCapture && move.capturedTokenId) {
    for (const p of gs.players) {
      for (const t of p.tokens) {
        if (t.id === move.capturedTokenId) {
          t.state = 'base'; t.stepsMoved = 0; t.position = -1;
        }
      }
    }
  }
  const player = gs.players.find(p => p.color === move.tokenColor);
  const token  = player.tokens.find(t => t.id === move.tokenId);
  if (move.isEnteringFromBase) {
    token.state = 'active'; token.stepsMoved = 1; token.position = calcAbsPos(token.color, 1);
  } else {
    token.stepsMoved = move.toPosition;
    token.state = move.toPosition >= 57 ? 'home' : 'active';
    token.position = move.toPosition >= 57 ? 57 : calcAbsPos(token.color, move.toPosition);
  }
  gs.validMoves = [];
}

function advanceTurn(gs) {
  const n = gs.players.length;
  let next = (gs.currentPlayerIndex + 1) % n;
  let safety = 0;
  while (gs.finishedPlayers.includes(gs.players[next].color) && safety++ < n) {
    next = (next + 1) % n;
  }
  gs.currentPlayerIndex = next;
  gs.currentDiceValue   = null;
  gs.consecutiveSixes   = 0;
  gs.diceRolled         = false;
  gs.validMoves         = [];
  gs.phase              = 'rolling';
  gs.turnCount          = (gs.turnCount || 0) + 1;
}

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => {
  console.log(`\n🎮 Ludo Legends Server running at http://localhost:${PORT}`);
  console.log('   Socket.IO ready for connections\n');
});

