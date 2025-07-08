import { create } from 'zustand';
import { GameState, Player, Role } from '../shared';

interface GameStore {
  // Connection state
  connected: boolean;
  roomCode: string | null;
  playerId: string | null;
  
  // Game state
  gameState: GameState | null;
  myRole: Role | null;
  servantKingId: string | null;
  currentRoom: 0 | 1;
  roomChangeRequired: boolean;
  
  // UI state
  error: string | null;
  loading: boolean;
  reconnecting: boolean;
  
  // Live timer state
  liveTimers: {
    room0: number | null; // seconds remaining, null if not active
    room1: number | null; // seconds remaining, null if not active
  };
  
  // Room confirmation progress
  roomConfirmationProgress: {
    confirmed: number;
    total: number;
    names: string[];
  } | null;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setRoomCode: (roomCode: string | null) => void;
  setPlayerId: (playerId: string | null) => void;
  setGameState: (gameState: GameState) => void;
  setMyRole: (role: Role, servantKingId?: string) => void;
  clearMyRole: () => void;
  setCurrentRoom: (room: 0 | 1) => void;
  setRoomChangeRequired: (required: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setLiveTimer: (room: 0 | 1, seconds: number | null) => void;
  updateLiveTimers: () => void; // called every second
  setRoomConfirmationProgress: (progress: { confirmed: number; total: number; names: string[] } | null) => void;
  reset: () => void;
  
  // Computed getters
  getMyPlayer: () => Player | null;
  getPlayersInMyRoom: () => Player[];
  getOtherRoomPlayerCount: () => number;
  amIHost: () => boolean;
  amILeader: () => boolean;
  canIAssassinate: () => boolean;
}

const initialState = {
  connected: false,
  roomCode: null,
  playerId: null,
  gameState: null,
  myRole: null,
  servantKingId: null,
  currentRoom: 0 as const,
  roomChangeRequired: false,
  error: null,
  loading: false,
  reconnecting: false,
  liveTimers: { room0: null, room1: null },
  roomConfirmationProgress: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  
  setConnected: (connected) => set({ connected }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setPlayerId: (playerId) => set({ playerId }),
  setGameState: (gameState) => set({ gameState }),
  setMyRole: (role, servantKingId) => set({ myRole: role, servantKingId }),
  clearMyRole: () => set({ myRole: null, servantKingId: null }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setRoomChangeRequired: (required) => set({ roomChangeRequired: required }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  setReconnecting: (reconnecting) => set({ reconnecting }),
  
  setLiveTimer: (room, seconds) => set(state => {
    const newTimers = { ...state.liveTimers, [room === 0 ? 'room0' : 'room1']: seconds };
    return { liveTimers: newTimers };
  }),

  updateLiveTimers: () => set(state => {
    const newTimers = { ...state.liveTimers };
    if (newTimers.room0 !== null && newTimers.room0 > 0) {
      newTimers.room0--;
    }
    if (newTimers.room1 !== null && newTimers.room1 > 0) {
      newTimers.room1--;
    }
    return { liveTimers: newTimers };
  }),
  
  setRoomConfirmationProgress: (progress) => set({ roomConfirmationProgress: progress }),
  
  reset: () => set(initialState),
  
  getMyPlayer: () => {
    const { gameState, playerId } = get();
    if (!gameState || !playerId) return null;
    return gameState.players[playerId] || null;
  },
  
  getPlayersInMyRoom: () => {
    const { gameState, currentRoom } = get();
    if (!gameState) return [];
    
    const playerIds = gameState.rooms[currentRoom].players;
    return playerIds.map((id: string) => gameState.players[id]).filter(Boolean) as Player[];
  },
  
  getOtherRoomPlayerCount: () => {
    const { gameState, currentRoom } = get();
    if (!gameState) return 0;
    
    const otherRoom = currentRoom === 0 ? 1 : 0;
    return gameState.rooms[otherRoom].players.length;
  },
  
  amIHost: () => {
    const player = get().getMyPlayer();
    return player?.isHost || false;
  },
  
  amILeader: () => {
    const player = get().getMyPlayer();
    return player?.isLeader || false;
  },
  
  canIAssassinate: () => {
    const { myRole, gameState } = get();
    const player = get().getMyPlayer();
    
    if (!myRole || !player || myRole.type !== 'ASSASSIN') return false;
    if (player.hasUsedAbility) return false;
    
    // In games with 8+ players, need swordsmith confirmation
    if (gameState && Object.keys(gameState.players).length >= 8) {
      return player.canAssassinate || false;
    }
    
    return true;
  },
}))