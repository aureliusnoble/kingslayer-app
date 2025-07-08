export type Team = 'RED' | 'BLUE';
export type GamePhase = 'lobby' | 'setup' | 'playing' | 'ended';

export type RoleType = 
  | 'KING' 
  | 'ASSASSIN' 
  | 'GATEKEEPER' 
  | 'SWORDSMITH' 
  | 'GUARD' 
  | 'SPY' 
  | 'SERVANT';

export interface Role {
  type: RoleType;
  team: Team;
  fakeRole?: {
    type: RoleType;
    team: Team;
  }; // For spies
}

export interface Player {
  id: string;
  name: string;
  socketId: string;
  connected: boolean;
  role?: Role;
  currentRoom: 0 | 1;
  isHost: boolean;
  isReady: boolean;
  isRoleReady: boolean; // Ready after seeing role assignment
  isRoomConfirmed: boolean; // Confirmed they're physically in their assigned room
  hasUsedAbility: boolean;
  canAssassinate?: boolean; // For assassins after swordsmith visit
  isLeader: boolean;
  pointingAt?: string; // Player ID they're pointing at
}

export interface RoomState {
  players: string[]; // Player IDs
  leaderId?: string;
  leaderElectedAt?: number;
}

export interface GameState {
  id: string;
  roomCode: string;
  phase: GamePhase;
  playerCount: number;
  players: Record<string, Player>;
  rooms: [RoomState, RoomState];
  timers: {
    room0LeaderCooldown?: number;
    room1LeaderCooldown?: number;
    // Add timestamps for live countdown
    room0TimerStarted?: number; // timestamp when timer started
    room1TimerStarted?: number; // timestamp when timer started
  };
  victory?: {
    winner: Team;
    reason: string;
  };
  servantInfo?: Record<string, string>; // servant ID -> king ID
}

// Socket Events
export interface ClientToServerEvents {
  'create_game': { playerName: string; playerCount: number };
  'join_game': { roomCode: string; playerName: string };
  'leave_game': void;
  'player_ready': void;
  'player_role_ready': void; // Ready after seeing role assignment
  'start_game': void;
  'confirm_room': { room: 0 | 1 };
  'point_at_player': { targetId: string | null };
  'elect_leader': { playerId: string };
  'send_player': { targetId: string };
  'gatekeeper_send': { targetId: string };
  'swordsmith_confirm': { assassinId: string };
  'request_state': void;
}

export interface ServerToClientEvents {
  'game_created': { roomCode: string; playerId: string };
  'game_joined': { gameState: GameState; playerId: string };
  'player_joined': { player: Player };
  'player_left': { playerId: string };
  'player_ready_changed': { playerId: string; ready: boolean };
  'player_role_ready_changed': { playerId: string; ready: boolean };
  'game_started': { gameState: GameState };
  'role_assigned': { role: Role; servantKingId?: string };
  'phase_changed': { phase: GamePhase };
  'room_assignment': { room: 0 | 1 };
  'room_confirmed': { playerId: string; room: 0 | 1 };
  'room_confirmation_progress': { confirmed: number; total: number; names: string[] };
  'pointing_changed': { playerId: string; targetId: string | null };
  'leader_elected': { roomIndex: 0 | 1; leaderId: string };
  'player_sent': { playerId: string; fromRoom: 0 | 1; toRoom: 0 | 1 };
  'swordsmith_confirmed': { assassinId: string };
  'game_ended': { winner: Team; reason: string };
  'timer_update': { 
    room0Timer?: number; 
    room1Timer?: number; 
  };
  'error': { message: string; code: string };
  'state_update': { gameState: GameState };
}