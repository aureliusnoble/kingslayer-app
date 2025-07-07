import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from 'kingslayer-shared';
import { useGameStore } from '../stores/gameStore';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private socket: TypedSocket | null = null;
  
  connect(): void {
    if (this.socket?.connected) return;
    
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    
    this.setupEventListeners();
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  private setupEventListeners(): void {
    if (!this.socket) return;
    
    const store = useGameStore.getState();
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
      store.setConnected(true);
      store.setError(null);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      store.setConnected(false);
    });
    
    this.socket.on('game_created', ({ roomCode, playerId }) => {
      store.setRoomCode(roomCode);
      store.setPlayerId(playerId);
    });
    
    this.socket.on('game_joined', ({ gameState, playerId }) => {
      store.setGameState(gameState);
      store.setPlayerId(playerId);
      store.setRoomCode(gameState.roomCode);
    });
    
    this.socket.on('state_update', ({ gameState }) => {
      store.setGameState(gameState);
    });
    
    this.socket.on('role_assigned', ({ role, servantKingId }) => {
      store.setMyRole(role, servantKingId);
    });
    
    this.socket.on('room_assignment', ({ room }) => {
      store.setCurrentRoom(room);
      store.setRoomChangeRequired(true);
    });
    
    this.socket.on('error', ({ message }) => {
      store.setError(message);
      store.setLoading(false);
    });
    
    this.socket.on('timer_update', ({ room0Timer, room1Timer }) => {
      const gameState = store.gameState;
      if (gameState) {
        store.setGameState({
          ...gameState,
          timers: {
            room0LeaderCooldown: room0Timer,
            room1LeaderCooldown: room1Timer,
          }
        });
      }
    });
    
    this.socket.on('game_ended', ({ winner, reason }) => {
      const gameState = store.gameState;
      if (gameState) {
        store.setGameState({
          ...gameState,
          phase: 'ended',
          victory: { winner, reason }
        });
      }
    });
    
    this.socket.on('swordsmith_confirmed', () => {
      // Update local player state
      const gameState = store.gameState;
      const playerId = store.playerId;
      
      if (gameState && playerId) {
        const player = gameState.players[playerId];
        if (player) {
          player.canAssassinate = true;
          store.setGameState({ ...gameState });
        }
      }
    });
  }
  
  // Emit events
  createGame(playerName: string, playerCount: number): void {
    if (!this.socket) return;
    useGameStore.getState().setLoading(true);
    this.socket.emit('create_game', { playerName, playerCount });
  }
  
  joinGame(roomCode: string, playerName: string): void {
    if (!this.socket) return;
    useGameStore.getState().setLoading(true);
    this.socket.emit('join_game', { roomCode: roomCode.toUpperCase(), playerName });
  }
  
  leaveGame(): void {
    if (!this.socket) return;
    this.socket.emit('leave_game');
    useGameStore.getState().reset();
  }
  
  toggleReady(): void {
    if (!this.socket) return;
    this.socket.emit('player_ready');
  }
  
  startGame(): void {
    if (!this.socket) return;
    this.socket.emit('start_game');
  }
  
  confirmRoom(room: 0 | 1): void {
    if (!this.socket) return;
    this.socket.emit('confirm_room', { room });
    useGameStore.getState().setRoomChangeRequired(false);
  }
  
  pointAtPlayer(targetId: string | null): void {
    if (!this.socket) return;
    this.socket.emit('point_at_player', { targetId });
  }
  
  sendPlayer(targetId: string): void {
    if (!this.socket) return;
    this.socket.emit('send_player', { targetId });
  }
  
  gatekeeperSend(targetId: string): void {
    if (!this.socket) return;
    this.socket.emit('gatekeeper_send', { targetId });
  }
  
  swordsmithConfirm(assassinId: string): void {
    if (!this.socket) return;
    this.socket.emit('swordsmith_confirm', { assassinId });
  }
  
  requestState(): void {
    if (!this.socket) return;
    this.socket.emit('request_state');
  }
}

export const socketService = new SocketService();