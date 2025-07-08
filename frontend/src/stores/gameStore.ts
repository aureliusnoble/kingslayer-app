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
  
  // Actions
  setConnected: (connected: boolean) => void;
  setRoomCode: (roomCode: string | null) => void;
  setPlayerId: (playerId: string | null) => void;
  setGameState: (gameState: GameState) => void;
  setMyRole: (role: Role, servantKingId?: string) => void;
  setCurrentRoom: (room: 0 | 1) => void;
  setRoomChangeRequired: (required: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
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
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  
  setConnected: (connected) => set({ connected }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setPlayerId: (playerId) => set({ playerId }),
  setGameState: (gameState) => set({ gameState }),
  setMyRole: (role, servantKingId) => set({ myRole: role, servantKingId }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setRoomChangeRequired: (required) => set({ roomChangeRequired: required }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  
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
    if (gameState && gameState.playerCount >= 8) {
      return player.canAssassinate || false;
    }
    
    return true;
  },
}))