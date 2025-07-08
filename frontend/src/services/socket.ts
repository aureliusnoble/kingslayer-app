import { io } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';

// Game lifecycle tracking for kick detection
let gameHasStarted = false;
let playingPhaseReached = false;

// Debug logging helper
const DEBUG = import.meta.env.DEV;
const debugLog = (event: string, data: any) => {
  if (DEBUG) {
    console.log(`[FRONTEND-SOCKET] ${event}:`, {
      data: typeof data === 'object' ? data : { value: data },
      timestamp: new Date().toISOString()
    });
  }
};

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
      // Reset game lifecycle flags on new connection
      gameHasStarted = false;
      playingPhaseReached = false;
      console.log(`🔄 Reset game lifecycle flags - gameHasStarted: ${gameHasStarted}, playingPhaseReached: ${playingPhaseReached}`);
      store.setConnected(true);
      store.setError(null);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      store.setConnected(false);
    });
    
    this.socket.on('game_created', (data: any) => {
      debugLog('game_created', data);
      store.setRoomCode(data.roomCode);
      store.setPlayerId(data.playerId);
      // Don't set loading=false yet - wait for state_update
    });
    
    this.socket.on('game_joined', (data: any) => {
      debugLog('game_joined', { roomCode: data.gameState.roomCode, playerCount: Object.keys(data.gameState.players).length });
      store.setGameState(data.gameState);
      store.setPlayerId(data.playerId);
      store.setRoomCode(data.gameState.roomCode);
      store.setLoading(false);
    });
    
    this.socket.on('state_update', (data: any) => {
      debugLog('state_update', { phase: data.gameState.phase, playerCount: Object.keys(data.gameState.players).length });
      store.setGameState(data.gameState);
      // Set loading=false if we have roomCode (indicates game creation complete)
      const currentState = useGameStore.getState();
      if (currentState.roomCode && currentState.loading) {
        debugLog('loading_complete', { roomCode: currentState.roomCode });
        store.setLoading(false);
      }
    });
    
    this.socket.on('role_assigned', (data: any) => {
      store.setMyRole(data.role, data.servantKingId);
    });
    
    this.socket.on('room_assignment', (data: any) => {
      console.log(`🚪 ROOM_ASSIGNMENT received: Moving to room ${data.room}`);
      console.log(`🚪 Game lifecycle - gameHasStarted: ${gameHasStarted}, playingPhaseReached: ${playingPhaseReached}`);
      
      store.setCurrentRoom(data.room);
      
      // Use lifecycle flags to determine if this is a kick or initial assignment
      // Initial assignments happen during the game start sequence BEFORE playing phase
      // Kicks only happen AFTER we've reached the playing phase
      const isKick = playingPhaseReached;
      
      console.log(`🚪 Is this a kick? ${isKick}`);
      
      // Show kick modal only for actual kicks (after playing phase reached)
      if (isKick) {
        store.setRoomChangeRequired(true);
        console.log(`🚪 Room change modal should now be visible (KICKED!)`);
      } else {
        console.log(`🚪 Initial room assignment during game start - no modal needed`);
      }
    });
    
    this.socket.on('player_ready_changed', (data: any) => {
      // Update player ready status in game state
      const gameState = store.gameState;
      if (gameState && gameState.players[data.playerId]) {
        gameState.players[data.playerId].isReady = data.ready;
        store.setGameState({ ...gameState });
      }
    });

    this.socket.on('player_role_ready_changed', (data: any) => {
      // Update player role ready status in game state
      const gameState = store.gameState;
      if (gameState && gameState.players[data.playerId]) {
        gameState.players[data.playerId].isRoleReady = data.ready;
        store.setGameState({ ...gameState });
      }
    });

    this.socket.on('pointing_changed', (data: any) => {
      // Update pointing in game state
      const gameState = store.gameState;
      if (gameState && gameState.players[data.playerId]) {
        gameState.players[data.playerId].pointingAt = data.targetId;
        store.setGameState({ ...gameState });
      }
    });

    this.socket.on('leader_elected', (data: any) => {
      console.log(`🟢 LEADER_ELECTED received: Room ${data.roomIndex}, Leader: ${data.leaderId}`);
      // Update leader in game state
      const gameState = store.gameState;
      if (gameState) {
        // Clear previous leader
        Object.values(gameState.players).forEach(player => {
          player.isLeader = false;
        });
        
        // Set new leader
        if (data.leaderId && gameState.players[data.leaderId]) {
          gameState.players[data.leaderId].isLeader = true;
        }
        
        store.setGameState({ ...gameState });
      }
    });

    this.socket.on('timer_started', (data: { room: 0 | 1; duration: number; startTime: number }) => {
      console.log(`🟢 TIMER_STARTED received: Room ${data.room}, Duration: ${data.duration}s`);
      const store = useGameStore.getState();
      store.setLiveTimer(data.room, data.duration);
    });

    this.socket.on('timer_expired', (data: { room: 0 | 1 }) => {
      const store = useGameStore.getState();
      store.setLiveTimer(data.room, 0);
    });

    this.socket.on('game_started', (data: any) => {
      debugLog('game_started', { phase: data.gameState.phase });
      gameHasStarted = true;
      console.log(`🟢 Game has started - gameHasStarted: ${gameHasStarted}`);
      // Game started event - state_update will handle the actual state change
    });

    this.socket.on('phase_changed', (data: any) => {
      debugLog('phase_changed', { phase: data.phase });
      console.log(`🔵 PHASE_CHANGED received: ${data.phase}`);
      
      // Track when we reach playing phase
      if (data.phase === 'playing') {
        playingPhaseReached = true;
        console.log(`🟢 Playing phase reached - playingPhaseReached: ${playingPhaseReached}`);
      }
      
      // When entering playing phase, ensure timers are properly initialized
      if (data.phase === 'playing') {
        const store = useGameStore.getState();
        console.log(`🔵 Entering playing phase - current timer state:`, store.liveTimers);
        
        // If timers are still null after 500ms, initialize them manually
        setTimeout(() => {
          const currentState = useGameStore.getState();
          if (currentState.liveTimers.room0 === null || currentState.liveTimers.room1 === null) {
            console.log(`🟡 FALLBACK: Initializing timers manually to 120s`);
            currentState.setLiveTimer(0, 120);
            currentState.setLiveTimer(1, 120);
          }
        }, 500);
      }
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
    
    this.socket.on('room_confirmation_progress', (data: { confirmed: number; total: number; names: string[] }) => {
      console.log(`🏠 Room confirmation progress: ${data.confirmed}/${data.total}`, data.names);
      const store = useGameStore.getState();
      store.setRoomConfirmationProgress(data);
    });
  }
  
  // Emit events
  createGame(playerName: string, playerCount: number): void {
    if (!this.socket) return;
    debugLog('emit_create_game', { playerName, playerCount });
    useGameStore.getState().setLoading(true);
    this.socket.emit('create_game', { playerName, playerCount });
  }
  
  joinGame(roomCode: string, playerName: string): void {
    if (!this.socket) return;
    debugLog('emit_join_game', { roomCode: roomCode.toUpperCase(), playerName });
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

  setRoleReady(): void {
    if (!this.socket) return;
    this.socket.emit('player_role_ready');
  }
  
  startGame(): void {
    if (!this.socket) {
      console.log('Cannot start game - no socket connection');
      return;
    }
    debugLog('emit_start_game', {});
    console.log('Emitting start_game event to server');
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
  
  declareLeader(): void {
    if (!this.socket) return;
    console.log('🟡 DECLARING LEADER - Emitting declare_leader event');
    this.socket.emit('declare_leader');
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