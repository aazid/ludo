import { io, Socket } from 'socket.io-client';
import type { GameState, Room } from '../types/game';

// ─── Socket.IO Multiplayer Service ───────────────────────────────────────────
// This service provides a clean abstraction over the Socket.IO connection.
// The game store can call these methods to interact with the server.

class MultiplayerService {
  private socket: Socket | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  connect(serverUrl = 'http://localhost:3001') {
    if (this.socket?.connected) return;

    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[multiplayer] connected:', this.socket?.id);
      this.emit('connect');
    });

    this.socket.on('disconnect', () => {
      console.log('[multiplayer] disconnected');
      this.emit('disconnect');
    });

    this.socket.on('room:joined',  (data: { room: Room; playerId: string }) => this.emit('room:joined', data));
    this.socket.on('room:updated', (room: Room)      => this.emit('room:updated', room));
    this.socket.on('room:error',   (err: { message: string })  => this.emit('room:error', err));
    this.socket.on('game:started', (gs: GameState)  => this.emit('game:started', gs));
    this.socket.on('game:state',   (gs: GameState)  => this.emit('game:state', gs));
    this.socket.on('game:error',   (err: { message: string })  => this.emit('game:error', err));
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, cb: Function) {
    if (!this.callbacks.has(event)) this.callbacks.set(event, []);
    this.callbacks.get(event)!.push(cb);
  }

  off(event: string, cb: Function) {
    const cbs = this.callbacks.get(event) ?? [];
    this.callbacks.set(event, cbs.filter(c => c !== cb));
  }

  private emit(event: string, ...args: any[]) {
    (this.callbacks.get(event) ?? []).forEach(cb => cb(...args));
  }

  // ── Room actions ────────────────────────────────────────────────────────────

  joinRoom(params: { roomCode: string; playerName: string; playerAvatar: string; playerId?: string }) {
    this.socket?.emit('room:join', params);
  }

  setReady(roomCode: string, playerId: string, isReady: boolean) {
    this.socket?.emit('room:ready', { roomCode, playerId, isReady });
  }

  kickPlayer(roomCode: string, hostId: string, targetId: string) {
    this.socket?.emit('room:kick', { roomCode, hostId, targetId });
  }

  startGame(roomCode: string, hostId: string) {
    this.socket?.emit('game:start', { roomCode, hostId });
  }

  // ── Game actions ─────────────────────────────────────────────────────────────

  rollDice(roomCode: string, playerId: string) {
    this.socket?.emit('game:roll', { roomCode, playerId });
  }

  moveToken(roomCode: string, playerId: string, tokenId: string) {
    this.socket?.emit('game:move', { roomCode, playerId, tokenId });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Singleton
export const multiplayerService = new MultiplayerService();
export default multiplayerService;

