import { io } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';

class SocketService {
  private socket: any = null;
  
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
    
    this.socket.on('game_created', (data: any) => {
      store.setRoomCode(data.roomCode);
      store.setPlayerId(data.playerId);
    });
    
    this.socket.on('game_joined', (data: any) => {
      store.setGameState(data.gameState);
      store.setPlayerId(data.playerId);
      store.setRoomCode(data.gameState.roomCode);
    });
    
    this.socket.on('state_update', (data: any) => {
      store.setGameState(data.gameState);
    });
    
    this.socket.on('role_assigned', (data: any) => {
      store.setMyRole(data.role, data.servantKingId);
    });
    
    this.socket.on('room_assignment', (data: any) => {
      store.setCurrentRoom(data.room);
      store.setRoomChangeRequired(true);
    });
    
    this.socket.on('error', (data: any) => {
      store.setError(data.message);
      store.setLoading(false);
    });
    
    this.socket.on('timer_update', (data: any) => {
      const gameState = store.gameState;
      if (gameState) {
        store.setGameState({
          ...gameState,
          timers: {
            room0LeaderCooldown: data.room0Timer,
            room1LeaderCooldown: data.room1Timer,
          }
        });
      }
    });
    
    this.socket.on('game_ended', (data: any) => {
      const gameState = store.gameState;
      if (gameState) {
        store.setGameState({
          ...gameState,
          phase: 'ended',
          victory: { winner: data.winner, reason: data.reason }
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