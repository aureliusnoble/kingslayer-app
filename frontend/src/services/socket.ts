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
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
      // Reset game lifecycle flags on new connection
      gameHasStarted = false;
      playingPhaseReached = false;
      console.log(`🔄 Reset game lifecycle flags - gameHasStarted: ${gameHasStarted}, playingPhaseReached: ${playingPhaseReached}`);
      useGameStore.getState().setConnected(true);
      useGameStore.getState().setError(null);
      
      // Handle reconnection - if we have game state, reconnect to the game
      const currentStore = useGameStore.getState();
      if (currentStore.roomCode && currentStore.playerId) {
        console.log('🔄 Reconnecting to game:', currentStore.roomCode);
        // Set reconnecting state to prevent premature navigation
        currentStore.setReconnecting(true);
        // Reconnect to the game using the player's stored name
        setTimeout(() => {
          const gameState = currentStore.gameState;
          const playerId = currentStore.playerId;
          if (gameState && playerId && currentStore.roomCode) {
            const player = gameState.players[playerId];
            if (player) {
              // Use joinGame with attemptReconnect for the new reconnection system
              this.joinGame(currentStore.roomCode, player.name, true);
            }
          }
        }, 100);
      }
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      useGameStore.getState().setConnected(false);
      
      // Debug: Log current game state when disconnecting
      if (DEBUG) {
        const currentState = useGameStore.getState();
        if (currentState.gameState) {
          console.log('[DISCONNECT] Current game state players:');
          Object.entries(currentState.gameState.players).forEach(([playerId, player]: [string, any]) => {
            console.log(`  Player ${player.name} (${playerId.substring(0, 8)}): connected=${player.connected}, ready=${player.isReady}`);
          });
        }
      }
    });
    
    this.socket.on('game_created', (data: any) => {
      debugLog('game_created', data);
      useGameStore.getState().setRoomCode(data.roomCode);
      useGameStore.getState().setPlayerId(data.playerId);
      // Don't set loading=false yet - wait for state_update
    });
    
    this.socket.on('game_joined', (data: any) => {
      debugLog('game_joined', { roomCode: data.gameState.roomCode, playerCount: Object.keys(data.gameState.players).length, isReconnection: data.isReconnection });
      
      // Debug: Log connection states on join
      if (DEBUG) {
        console.log('🔄 GAME_JOINED - Player connection states:');
        Object.entries(data.gameState.players).forEach(([playerId, player]: [string, any]) => {
          console.log(`  Player ${player.name} (${playerId.substring(0, 8)}): connected=${player.connected}, ready=${player.isReady}`);
        });
      }
      
      useGameStore.getState().setGameState(data.gameState);
      useGameStore.getState().setPlayerId(data.playerId);
      useGameStore.getState().setRoomCode(data.gameState.roomCode);
      useGameStore.getState().setLoading(false);
      useGameStore.getState().setReconnecting(false); // Clear reconnecting state
      
      // Handle reconnection navigation
      if (data.isReconnection) {
        console.log('🔄 Reconnection successful, navigating to appropriate screen');
        // The navigation will be handled by the calling component based on game phase
      }
    });

    this.socket.on('player_joined', (data: any) => {
      debugLog('player_joined', { playerName: data.player.name, playerId: data.player.id });
      // Note: state_update event will handle the actual UI update
      // This event is mainly for potential future notifications/animations
    });

    this.socket.on('player_left', (data: any) => {
      debugLog('player_left', { playerId: data.playerId });
      // Note: state_update event will handle the actual UI update
      // This event is mainly for potential future notifications/animations
    });
    
    this.socket.on('state_update', (data: any) => {
      debugLog('state_update', { phase: data.gameState.phase, playerCount: Object.keys(data.gameState.players).length });
      
      // Enhanced debugging for connection states
      if (DEBUG) {
        console.log('🔄 STATE_UPDATE received - Player connection states:');
        Object.entries(data.gameState.players).forEach(([playerId, player]: [string, any]) => {
          console.log(`  Player ${player.name} (${playerId}): connected=${player.connected}, ready=${player.isReady}`);
        });
      }
      
      useGameStore.getState().setGameState(data.gameState);
      // Set loading=false if we have roomCode (indicates game creation complete)
      const currentState = useGameStore.getState();
      if (currentState.roomCode && currentState.loading) {
        debugLog('loading_complete', { roomCode: currentState.roomCode });
        useGameStore.getState().setLoading(false);
      }
    });
    
    this.socket.on('role_assigned', (data: any) => {
      useGameStore.getState().setMyRole(data.role, data.servantKingId);
    });
    
    this.socket.on('room_assignment', (data: any) => {
      console.log(`[ROOM] ROOM_ASSIGNMENT received: Moving to room ${data.room}`);
      console.log(`[ROOM] Game lifecycle - gameHasStarted: ${gameHasStarted}, playingPhaseReached: ${playingPhaseReached}`);
      
      useGameStore.getState().setCurrentRoom(data.room);
      
      // Use lifecycle flags to determine if this is a kick or initial assignment
      // Initial assignments happen during the game start sequence BEFORE playing phase
      // Kicks only happen AFTER we've reached the playing phase
      const isKick = playingPhaseReached;
      
      console.log(`[ROOM] Is this a kick? ${isKick}`);
      
      // Show kick modal only for actual kicks (after playing phase reached)
      if (isKick) {
        useGameStore.getState().setRoomChangeRequired(true);
        console.log(`[ROOM] Room change modal should now be visible (KICKED!)`);
      } else {
        console.log(`[ROOM] Initial room assignment during game start - no modal needed`);
      }
    });
    
    this.socket.on('player_ready_changed', (data: any) => {
      // Update player ready status in game state
      const gameState = useGameStore.getState().gameState;
      if (gameState && gameState.players[data.playerId]) {
        gameState.players[data.playerId].isReady = data.ready;
        useGameStore.getState().setGameState({ ...gameState });
      }
    });

    this.socket.on('player_role_ready_changed', (data: any) => {
      // Update player role ready status in game state
      const gameState = useGameStore.getState().gameState;
      if (gameState && gameState.players[data.playerId]) {
        gameState.players[data.playerId].isRoleReady = data.ready;
        useGameStore.getState().setGameState({ ...gameState });
      }
    });


    this.socket.on('leader_elected', (data: any) => {
      console.log(`🟢 LEADER_ELECTED received: Room ${data.roomIndex}, Leader: ${data.leaderId}`);
      // Update leader in game state
      const gameState = useGameStore.getState().gameState;
      if (gameState) {
        // Clear previous leader
        Object.values(gameState.players).forEach(player => {
          player.isLeader = false;
        });
        
        // Set new leader
        if (data.leaderId && gameState.players[data.leaderId]) {
          gameState.players[data.leaderId].isLeader = true;
        }
        
        useGameStore.getState().setGameState({ ...gameState });
      }
    });

    this.socket.on('timer_started', (data: { room: 0 | 1; duration: number; startTime: number }) => {
      console.log(`🟢 TIMER_STARTED received: Room ${data.room}, Duration: ${data.duration}s`);
      const gameStore = useGameStore.getState();
      gameStore.setLiveTimer(data.room, data.duration);
    });

    this.socket.on('timer_expired', (data: { room: 0 | 1 }) => {
      const gameStore = useGameStore.getState();
      gameStore.setLiveTimer(data.room, 0);
    });

    this.socket.on('game_started', (data: any) => {
      debugLog('game_started', { phase: data.gameState.phase });
      gameHasStarted = true;
      console.log(`🟢 Game has started - gameHasStarted: ${gameHasStarted}`);
      // Game started event - state_update will handle the actual state change
    });

    this.socket.on('phase_changed', (data: any) => {
      debugLog('phase_changed', { phase: data.phase });
      console.log(`[PHASE] PHASE_CHANGED received: ${data.phase}`);
      
      // Track when we reach playing phase
      if (data.phase === 'playing') {
        playingPhaseReached = true;
        console.log(`🟢 Playing phase reached - playingPhaseReached: ${playingPhaseReached}`);
      }
      
      // When entering playing phase, ensure timers are properly initialized
      if (data.phase === 'playing') {
        const gameStore = useGameStore.getState();
        console.log(`[PHASE] Entering playing phase - current timer state:`, gameStore.liveTimers);
        
        // If timers are still null after 500ms, initialize them manually
        setTimeout(() => {
          const currentState = useGameStore.getState();
          if (currentState.liveTimers.room0 === null || currentState.liveTimers.room1 === null) {
            console.log(`[FALLBACK] Initializing timers manually to 120s`);
            currentState.setLiveTimer(0, 120);
            currentState.setLiveTimer(1, 120);
          }
        }, 500);
      }
    });

    this.socket.on('error', (data: any) => {
      useGameStore.getState().setError(data.message);
      useGameStore.getState().setLoading(false);
      useGameStore.getState().setReconnecting(false); // Clear reconnecting state on error
    });
    
    this.socket.on('timer_update', (data: any) => {
      const gameState = useGameStore.getState().gameState;
      if (gameState) {
        useGameStore.getState().setGameState({
          ...gameState,
          timers: {
            room0LeaderCooldown: data.room0Timer,
            room1LeaderCooldown: data.room1Timer,
          }
        });
      }
    });
    
    this.socket.on('game_ended', (data: any) => {
      const gameState = useGameStore.getState().gameState;
      if (gameState) {
        useGameStore.getState().setGameState({
          ...gameState,
          phase: 'ended',
          victory: { winner: data.winner, reason: data.reason }
        });
      }
    });
    
    this.socket.on('swordsmith_confirmed', () => {
      // Update local player state
      const gameState = useGameStore.getState().gameState;
      const playerId = useGameStore.getState().playerId;
      
      if (gameState && playerId) {
        const player = gameState.players[playerId];
        if (player) {
          player.canAssassinate = true;
          useGameStore.getState().setGameState({ ...gameState });
        }
      }
    });
    
    this.socket.on('room_confirmation_progress', (data: { confirmed: number; total: number; names: string[] }) => {
      console.log(`[ROOM_CONFIRM] Room confirmation progress: ${data.confirmed}/${data.total}`, data.names);
      const gameStore = useGameStore.getState();
      gameStore.setRoomConfirmationProgress(data);
    });
    
    this.socket.on('game_restarted', (data: any) => {
      debugLog('game_restarted', { roomCode: data.gameState.roomCode });
      console.log('🔄 Game restarted, returning to lobby');
      
      // Reset game lifecycle flags
      gameHasStarted = false;
      playingPhaseReached = false;
      
      // Update game state
      useGameStore.getState().setGameState(data.gameState);
      
      // Clear any modals or temporary states
      useGameStore.getState().setRoomChangeRequired(false);
      useGameStore.getState().clearMyRole();
      
      // Navigate to lobby will be handled by screen components listening to game state
    });
    
    this.socket.on('player_reconnected', (data: any) => {
      debugLog('player_reconnected', { playerId: data.playerId, playerName: data.playerName });
      console.log(`🔄 Player ${data.playerName} reconnected to the game`);
      // The state update will be handled by the state_update event
    });

    this.socket.on('player_kicked', (data: any) => {
      debugLog('player_kicked', { playerId: data.playerId, message: data.message });
      console.log('[KICK] Player kicked:', data.message);
      
      // If this player was kicked, navigate them away
      if (!data.playerId) {
        // This is the kicked player
        alert(data.message);
        useGameStore.getState().reset();
        window.location.href = '/';
      } else {
        // This is a notification about someone else being kicked
        console.log(`Player ${data.playerId} was kicked from the game`);
      }
    });
  }
  
  // Emit events
  createGame(playerName: string, playerCount: number): void {
    if (!this.socket) return;
    debugLog('emit_create_game', { playerName, playerCount });
    useGameStore.getState().setLoading(true);
    this.socket.emit('create_game', { playerName, playerCount });
  }
  
  joinGame(roomCode: string, playerName: string, attemptReconnect: boolean = true): void {
    if (!this.socket) return;
    debugLog('emit_join_game', { roomCode: roomCode.toUpperCase(), playerName, attemptReconnect });
    useGameStore.getState().setLoading(true);
    this.socket.emit('join_game', { 
      roomCode: roomCode.toUpperCase(), 
      playerName,
      attemptReconnect 
    });
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
  
  
  declareLeader(): void {
    if (!this.socket) return;
    console.log('[LEADER] DECLARING LEADER - Emitting declare_leader event');
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

  restartGame(): void {
    if (!this.socket) return;
    debugLog('emit_restart_game', {});
    console.log('🔄 Requesting game restart');
    this.socket.emit('restart_game');
  }

  kickPlayer(targetId: string): void {
    if (!this.socket) return;
    debugLog('emit_kick_player', { targetId });
    console.log('[KICK] Kicking player:', targetId);
    this.socket.emit('kick_player', { targetId });
  }
  
}

export const socketService = new SocketService();