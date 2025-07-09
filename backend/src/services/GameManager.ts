import { GameState, Player } from '../shared';
import { generateRoomCode, generatePlayerId, distributeRoles, assignRooms } from '../utils/gameUtils';

export class GameManager {
  private games: Map<string, GameState> = new Map();
  private playerToGame: Map<string, string> = new Map();

  createGame(hostName: string, playerCount: number, socketId: string): { game: GameState; playerId: string } {
    const roomCode = this.generateUniqueRoomCode();
    const playerId = generatePlayerId();
    
    const host: Player = {
      id: playerId,
      name: hostName,
      socketId,
      connected: true,
      currentRoom: 0,
      isHost: true,
      isReady: false,
      isRoleReady: false,
      isRoomConfirmed: false,
      hasUsedAbility: false,
      isLeader: false
    };

    const game: GameState = {
      id: roomCode,
      roomCode,
      phase: 'lobby',
      playerCount,
      players: {
        [playerId]: host
      },
      rooms: [
        { players: [] },
        { players: [] }
      ],
      originalHostId: playerId,
      leftPlayers: {},
      previousPlayers: {},
      timers: {}
    };

    this.games.set(roomCode, game);
    this.playerToGame.set(playerId, roomCode);

    return { game, playerId };
  }

  joinGame(roomCode: string, playerName: string, socketId: string): { success: true; game: GameState; playerId: string } | { success: false; error: 'GAME_NOT_FOUND' | 'GAME_FULL' | 'NAME_TAKEN' } {
    const game = this.games.get(roomCode.toUpperCase());
    if (!game) return { success: false, error: 'GAME_NOT_FOUND' };

    const playerIds = Object.keys(game.players);
    if (playerIds.length >= game.playerCount) return { success: false, error: 'GAME_FULL' };

    // Check for duplicate names (case-insensitive)
    const existingNames = Object.values(game.players).map(p => p.name.toLowerCase());
    if (existingNames.includes(playerName.toLowerCase())) {
      return { success: false, error: 'NAME_TAKEN' };
    }

    const playerId = generatePlayerId();
    const player: Player = {
      id: playerId,
      name: playerName,
      socketId,
      connected: true,
      currentRoom: 0,
      isHost: false,
      isReady: false,
      isRoleReady: false,
      isRoomConfirmed: false,
      hasUsedAbility: false,
      isLeader: false
    };

    game.players[playerId] = player;
    this.playerToGame.set(playerId, roomCode);

    return { success: true, game, playerId };
  }

  leaveGame(playerId: string): GameState | null {
    const roomCode = this.playerToGame.get(playerId);
    if (!roomCode) return null;

    const game = this.games.get(roomCode);
    if (!game) return null;

    // Check if leaving player is host BEFORE deleting them
    const leavingPlayer = game.players[playerId];
    const wasHost = leavingPlayer?.isHost || false;

    // Track player who left (for potential rejoin)
    if (leavingPlayer) {
      const now = Date.now();
      
      // Basic tracking for leftPlayers
      if (!game.leftPlayers) game.leftPlayers = {};
      game.leftPlayers[playerId] = {
        name: leavingPlayer.name,
        leftAt: now
      };
      
      // Complete state tracking for full reconnection (only during setup/playing phases)
      if (game.phase === 'setup' || game.phase === 'playing') {
        if (!game.previousPlayers) game.previousPlayers = {};
        
        // Store complete player state for reconnection
        game.previousPlayers[leavingPlayer.name.toLowerCase()] = {
          player: { ...leavingPlayer }, // Deep copy of player state
          leftAt: now,
          originalId: playerId
        };
        
        console.log(`[PLAYER LEFT] ${leavingPlayer.name} left game ${game.roomCode} - complete state stored for reconnection`);
      } else {
        console.log(`[PLAYER LEFT] ${leavingPlayer.name} left game ${game.roomCode} - basic tracking only (phase: ${game.phase})`);
      }
    }

    delete game.players[playerId];
    this.playerToGame.delete(playerId);

    // Remove from room if playing
    if (game.phase === 'playing') {
      game.rooms[0].players = game.rooms[0].players.filter(id => id !== playerId);
      game.rooms[1].players = game.rooms[1].players.filter(id => id !== playerId);
    }

    // Delete game if empty
    if (Object.keys(game.players).length === 0) {
      this.games.delete(roomCode);
      return null;
    }

    // Transfer host if the leaving player was host
    if (wasHost) {
      const newHostId = Object.keys(game.players)[0];
      if (newHostId) {
        game.players[newHostId].isHost = true;
        console.log(`[HOST TRANSFER] Player ${game.players[newHostId].name} is now host after ${leavingPlayer.name} left`);
      }
    }

    return game;
  }

  kickPlayer(hostId: string, targetId: string): GameState | null {
    const roomCode = this.playerToGame.get(hostId);
    if (!roomCode) return null;

    const game = this.games.get(roomCode);
    if (!game) return null;

    const host = game.players[hostId];
    const target = game.players[targetId];

    // Validate kick permissions
    if (!host || !host.isHost) return null; // Only host can kick
    if (!target) return null; // Target must exist
    if (hostId === targetId) return null; // Host cannot kick themselves

    // Remove player using same logic as leaveGame
    delete game.players[targetId];
    this.playerToGame.delete(targetId);

    // Remove from room if playing
    if (game.phase === 'playing') {
      game.rooms[0].players = game.rooms[0].players.filter(id => id !== targetId);
      game.rooms[1].players = game.rooms[1].players.filter(id => id !== targetId);
    }

    return game;
  }

  setPlayerReady(playerId: string, ready: boolean): GameState | null {
    const game = this.getGameByPlayerId(playerId);
    if (!game || game.phase !== 'lobby') return null;

    const player = game.players[playerId];
    if (player) {
      player.isReady = ready;
    }

    return game;
  }

  setPlayerRoleReady(playerId: string, ready: boolean): GameState | null {
    const game = this.getGameByPlayerId(playerId);
    if (!game || game.phase !== 'setup') return null;

    const player = game.players[playerId];
    if (player) {
      player.isRoleReady = ready;
    }

    return game;
  }

  startGame(roomCode: string): GameState | null {
    const game = this.games.get(roomCode);
    if (!game || game.phase !== 'lobby') return null;

    const playerIds = Object.keys(game.players);
    const actualPlayerCount = playerIds.length;
    
    // Validate minimum players and even count requirement
    if (actualPlayerCount < 6) return null;
    if (actualPlayerCount % 2 !== 0) return null; // Must be even
    if (actualPlayerCount > 14) return null; // Max 14 players

    // Check all players are ready
    const allReady = playerIds.every(id => game.players[id].isReady);
    if (!allReady) return null;

    // Distribute roles based on actual player count
    const roles = distributeRoles(actualPlayerCount);
    playerIds.forEach((playerId, index) => {
      game.players[playerId].role = roles[index];
    });

    // Assign rooms
    const roomAssignment = assignRooms(playerIds);
    game.rooms[0].players = roomAssignment.room0;
    game.rooms[1].players = roomAssignment.room1;

    // Update player room assignments and reset confirmation status
    roomAssignment.room0.forEach(id => {
      game.players[id].currentRoom = 0;
      game.players[id].isRoomConfirmed = false; // Must confirm they're physically in the room
    });
    roomAssignment.room1.forEach(id => {
      game.players[id].currentRoom = 1;
      game.players[id].isRoomConfirmed = false; // Must confirm they're physically in the room
    });

    // Create servant info
    if (actualPlayerCount >= 14) {
      game.servantInfo = {};
      const servants = playerIds.filter(id => game.players[id].role?.type === 'SERVANT');
      servants.forEach(servantId => {
        const servant = game.players[servantId];
        const kingId = playerIds.find(id => 
          game.players[id].role?.type === 'KING' && 
          game.players[id].role?.team === servant.role?.team
        );
        if (kingId) {
          game.servantInfo![servantId] = kingId;
        }
      });
    }

    game.phase = 'setup';
    return game;
  }

  confirmPlayerRoom(playerId: string, room: 0 | 1): GameState | null {
    const game = this.getGameByPlayerId(playerId);
    if (!game || game.phase !== 'setup') return null;

    const player = game.players[playerId];
    if (!player) return null;

    // Mark this player as having confirmed their room
    player.isRoomConfirmed = true;
    console.log(`[ROOM CONFIRM] Player ${player.name} confirmed room ${room}`);

    // Check if ALL players have confirmed their rooms AND are role ready
    const allRoomConfirmed = Object.values(game.players).every(p => p.isRoomConfirmed);
    const allRoleReady = Object.values(game.players).every(p => p.isRoleReady);
    
    console.log(`[ROOM CONFIRM] Room confirmations: ${Object.values(game.players).filter(p => p.isRoomConfirmed).length}/${Object.values(game.players).length}`);
    console.log(`[ROOM CONFIRM] Role ready: ${Object.values(game.players).filter(p => p.isRoleReady).length}/${Object.values(game.players).length}`);

    if (allRoomConfirmed && allRoleReady) {
      // Only initialize timers when transitioning to playing phase for the first time
      game.phase = 'playing';
      
      // Initialize timers when game starts playing - 2 minutes (120 seconds)
      const now = Date.now();
      game.timers.room0LeaderCooldown = 120;
      game.timers.room1LeaderCooldown = 120;
      game.timers.room0TimerStarted = now;
      game.timers.room1TimerStarted = now;
      
      console.log(`[GAME START] Game ${game.roomCode} entering playing phase with 120s timers - ALL PLAYERS CONFIRMED ROOMS`);
    }

    return game;
  }

  getRoomConfirmationProgress(gameId: string): { confirmed: number; total: number; names: string[] } | null {
    const game = this.games.get(gameId);
    if (!game || game.phase !== 'setup') return null;

    const players = Object.values(game.players);
    const confirmed = players.filter(p => p.isRoomConfirmed);
    const notConfirmed = players.filter(p => !p.isRoomConfirmed);

    return {
      confirmed: confirmed.length,
      total: players.length,
      names: notConfirmed.map(p => p.name)
    };
  }

  updatePointing(playerId: string, targetId: string | null): GameState | null {
    const game = this.getGameByPlayerId(playerId);
    if (!game || game.phase !== 'playing') return null;

    const player = game.players[playerId];
    if (!player) return null;

    player.pointingAt = targetId || undefined;
    
    // Check for leader election
    this.checkLeaderElection(game, player.currentRoom);

    return game;
  }

  private checkLeaderElection(game: GameState, roomIndex: 0 | 1): void {
    const room = game.rooms[roomIndex];
    const playersInRoom = room.players.map(id => game.players[id]);
    
    // Count points for each player
    const pointCounts: Record<string, number> = {};
    playersInRoom.forEach(player => {
      if (player.pointingAt && room.players.includes(player.pointingAt)) {
        pointCounts[player.pointingAt] = (pointCounts[player.pointingAt] || 0) + 1;
      }
    });

    // Check for majority
    const majorityNeeded = Math.floor(playersInRoom.length / 2) + 1;
    const newLeaderId = Object.entries(pointCounts).find(([_, count]) => count >= majorityNeeded)?.[0];

    if (newLeaderId && newLeaderId !== room.leaderId) {
      // Remove previous leader status
      if (room.leaderId) {
        game.players[room.leaderId].isLeader = false;
      }
      
      // Set new leader
      room.leaderId = newLeaderId;
      room.leaderElectedAt = Date.now();
      game.players[newLeaderId].isLeader = true;
      
      // Timer is independent of leader election - don't reset it here
    }
  }

  sendPlayer(leaderId: string, targetId: string): GameState | null {
    const game = this.getGameByPlayerId(leaderId);
    if (!game || game.phase !== 'playing') return null;

    const leader = game.players[leaderId];
    const target = game.players[targetId];
    
    if (!leader || !target || !leader.isLeader) return null;
    if (leader.currentRoom !== target.currentRoom) return null;

    // Check cooldown - leader can only kick when timer reaches 0
    const roomIndex = leader.currentRoom;
    const cooldownKey = roomIndex === 0 ? 'room0LeaderCooldown' : 'room1LeaderCooldown';
    if (game.timers[cooldownKey] && game.timers[cooldownKey]! > 0) return null;

    // Move player
    const fromRoom = target.currentRoom;
    const toRoom = fromRoom === 0 ? 1 : 0;
    
    game.rooms[fromRoom].players = game.rooms[fromRoom].players.filter(id => id !== targetId);
    game.rooms[toRoom].players.push(targetId);
    target.currentRoom = toRoom;

    // Reset kick timer after use (2 minutes = 120 seconds)
    const now = Date.now();
    if (roomIndex === 0) {
      game.timers.room0LeaderCooldown = 120;
      game.timers.room0TimerStarted = now;
    } else {
      game.timers.room1LeaderCooldown = 120;
      game.timers.room1TimerStarted = now;
    }

    return game;
  }

  declareLeader(playerId: string): GameState | null {
    const game = this.getGameByPlayerId(playerId);
    if (!game || game.phase !== 'playing') return null;

    const player = game.players[playerId];
    if (!player) return null;

    const roomIndex = player.currentRoom;
    const room = game.rooms[roomIndex];

    // Remove previous leader if any
    if (room.leaderId && game.players[room.leaderId]) {
      game.players[room.leaderId].isLeader = false;
    }

    // Set new leader
    room.leaderId = playerId;
    room.leaderElectedAt = Date.now();
    player.isLeader = true;

    console.log(`[LEADER DECLARATION] Player ${playerId} (${player.name}) declared leader in room ${roomIndex}`);

    return game;
  }

  gatekeeperSend(gatekeeperId: string, targetId: string): GameState | null {
    const game = this.getGameByPlayerId(gatekeeperId);
    if (!game || game.phase !== 'playing') return null;

    const gatekeeper = game.players[gatekeeperId];
    const target = game.players[targetId];
    
    if (!gatekeeper || !target) return null;
    if (gatekeeper.role?.type !== 'GATEKEEPER') return null;
    if (gatekeeper.hasUsedAbility) return null;
    if (gatekeeper.currentRoom !== target.currentRoom) return null;

    // Mark ability as used
    gatekeeper.hasUsedAbility = true;

    // Move player
    const fromRoom = target.currentRoom;
    const toRoom = fromRoom === 0 ? 1 : 0;
    
    game.rooms[fromRoom].players = game.rooms[fromRoom].players.filter(id => id !== targetId);
    game.rooms[toRoom].players.push(targetId);
    target.currentRoom = toRoom;

    return game;
  }

  swordsmithConfirm(swordsmithId: string, assassinId: string): GameState | null {
    const game = this.getGameByPlayerId(swordsmithId);
    if (!game || game.phase !== 'playing') return null;

    const swordsmith = game.players[swordsmithId];
    const assassin = game.players[assassinId];
    
    if (!swordsmith || !assassin) return null;
    if (swordsmith.role?.type !== 'SWORDSMITH') return null;
    if (assassin.role?.type !== 'ASSASSIN') return null;
    if (swordsmith.role.team !== assassin.role.team) return null;

    // Enable assassination
    assassin.canAssassinate = true;

    return game;
  }

  updateTimers(): void {
    this.games.forEach(game => {
      // Update room leader cooldowns for playing games
      if (game.phase === 'playing') {
        const before = { room0: game.timers.room0LeaderCooldown, room1: game.timers.room1LeaderCooldown };
        
        if (game.timers.room0LeaderCooldown && game.timers.room0LeaderCooldown > 0) {
          game.timers.room0LeaderCooldown--;
        }
        if (game.timers.room1LeaderCooldown && game.timers.room1LeaderCooldown > 0) {
          game.timers.room1LeaderCooldown--;
        }
        
        const after = { room0: game.timers.room0LeaderCooldown, room1: game.timers.room1LeaderCooldown };
        if (before.room0 !== after.room0 || before.room1 !== after.room1) {
          console.log(`[TIMER UPDATE] Room ${game.roomCode}: Room0 ${before.room0} -> ${after.room0}, Room1 ${before.room1} -> ${after.room1}`);
        }
      }
      
      // Clean up old previousPlayers data (older than 1 hour)
      if (game.previousPlayers) {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds
        
        Object.keys(game.previousPlayers).forEach(playerName => {
          const playerData = game.previousPlayers![playerName];
          if (playerData.leftAt < oneHourAgo) {
            console.log(`[CLEANUP] Removing old previousPlayer data for ${playerName} (left ${new Date(playerData.leftAt).toISOString()})`);
            delete game.previousPlayers![playerName];
          }
        });
      }
    });
  }

  getGame(roomCode: string): GameState | null {
    return this.games.get(roomCode.toUpperCase()) || null;
  }

  getGameByPlayerId(playerId: string): GameState | null {
    const roomCode = this.playerToGame.get(playerId);
    return roomCode ? this.games.get(roomCode) || null : null;
  }

  updateSocketId(playerId: string, socketId: string): GameState | null {
    const game = this.getGameByPlayerId(playerId);
    if (!game) return null;

    const player = game.players[playerId];
    if (player) {
      player.socketId = socketId;
      player.connected = true;
    }

    return game;
  }

  disconnectPlayer(playerId: string): GameState | null {
    const game = this.getGameByPlayerId(playerId);
    if (!game) return null;

    const player = game.players[playerId];
    if (player) {
      player.connected = false;
      
      // Store complete player state for potential full reconnection (only during setup/playing phases)
      if (game.phase === 'setup' || game.phase === 'playing') {
        if (!game.previousPlayers) game.previousPlayers = {};
        
        // Store complete player state (in case they need to fully reconnect later)
        game.previousPlayers[player.name.toLowerCase()] = {
          player: { ...player }, // Deep copy of player state
          leftAt: Date.now(),
          originalId: playerId
        };
        
        console.log(`[PLAYER DISCONNECTED] ${player.name} disconnected from game ${game.roomCode} - state stored for potential reconnection`);
      } else {
        console.log(`[PLAYER DISCONNECTED] ${player.name} disconnected from game ${game.roomCode} - basic tracking only (phase: ${game.phase})`);
      }
    }

    return game;
  }

  reconnectPlayer(playerId: string, socketId: string): GameState | null {
    const game = this.getGameByPlayerId(playerId);
    if (!game) return null;

    const player = game.players[playerId];
    if (player) {
      player.connected = true;
      player.socketId = socketId;
    }

    return game;
  }

  restartGame(hostId: string): GameState | null {
    const game = this.getGameByPlayerId(hostId);
    if (!game) return null;

    const host = game.players[hostId];
    if (!host || !host.isHost) return null;

    // Reset game state to lobby phase
    game.phase = 'lobby';

    // Reset all player states but keep the player list
    Object.values(game.players).forEach(player => {
      player.role = undefined;
      player.isReady = false;
      player.isRoleReady = false;
      player.isRoomConfirmed = false;
      player.hasUsedAbility = false;
      player.canAssassinate = false;
      player.isLeader = false;
      player.pointingAt = undefined;
      player.currentRoom = 0; // Reset everyone to room 0
      player.isHost = false; // Reset host status for everyone
    });

    // Reassign host to the original host if they're still in the game
    if (game.players[game.originalHostId]) {
      game.players[game.originalHostId].isHost = true;
      console.log(`[GAME RESTART] Original host ${game.players[game.originalHostId].name} reassigned as host`);
    } else {
      // If original host is not in game, current host remains host
      host.isHost = true;
      console.log(`[GAME RESTART] Current host ${host.name} remains host (original host not present)`);
    }

    // Reset room state
    game.rooms = [
      { players: [] },
      { players: [] }
    ];

    // Clear timers
    game.timers = {};

    // Clear victory state
    game.victory = undefined;

    // Clear servant info
    game.servantInfo = undefined;

    // Clear left players list (fresh start)
    game.leftPlayers = {};

    console.log(`[GAME RESTART] Game ${game.roomCode} restarted by host ${host.name}`);

    return game;
  }

  joinGameWithReconnect(roomCode: string, playerName: string, socketId: string, attemptReconnect: boolean = false): 
    { success: true; game: GameState; playerId: string; isReconnection: boolean; timerState?: { room0Timer: number | null; room1Timer: number | null } } | 
    { success: false; error: 'GAME_NOT_FOUND' | 'GAME_FULL' | 'NAME_TAKEN' | 'GAME_IN_PROGRESS' | 'INVALID_PHASE' | 'NO_PREVIOUS_PLAYER' } {
    
    const game = this.games.get(roomCode.toUpperCase());
    if (!game) return { success: false, error: 'GAME_NOT_FOUND' };

    // Check for simple reconnection (player still in game but disconnected)
    if (attemptReconnect) {
      const disconnectedPlayer = Object.values(game.players).find(p => 
        p.name.toLowerCase() === playerName.toLowerCase() && !p.connected
      );

      if (disconnectedPlayer) {
        // Simple reconnection case
        disconnectedPlayer.socketId = socketId;
        disconnectedPlayer.connected = true;
        this.playerToGame.set(disconnectedPlayer.id, roomCode.toUpperCase());
        
        // Check if this player should become host
        this.checkAndAssignHost(game, disconnectedPlayer.id);
        
        // Get timer state for reconnection
        const timerState = this.getTimerStateForReconnection(game);
        
        console.log(`[PLAYER SIMPLE RECONNECT] Player ${playerName} reconnected to game ${roomCode}`);
        return { 
          success: true, 
          game, 
          playerId: disconnectedPlayer.id, 
          isReconnection: true,
          timerState 
        };
      }
    }

    // Handle different logic based on game phase
    if (game.phase === 'lobby') {
      // In lobby phase: allow normal joins, no reconnection validation needed
      // Skip to normal join logic below
    } else if (game.phase === 'setup' || game.phase === 'playing') {
      // In setup/playing phase: only allow reconnection
      const reconnectionValidation = this.validateReconnection(game, playerName);
      if (reconnectionValidation.valid && reconnectionValidation.previousPlayerData) {
        // Full reconnection case - restore complete player state
        const newPlayerId = generatePlayerId();
        const restoredPlayer = this.restorePlayerState(game, newPlayerId, socketId, reconnectionValidation.previousPlayerData);
        
        // Check if this player should become host
        this.checkAndAssignHost(game, newPlayerId);
        
        // Get timer state for reconnection
        const timerState = this.getTimerStateForReconnection(game);
        
        console.log(`[PLAYER FULL RECONNECT] Player ${playerName} fully reconnected to game ${roomCode}`);
        return { 
          success: true, 
          game, 
          playerId: newPlayerId, 
          isReconnection: true,
          timerState 
        };
      }

      // If reconnection validation failed in setup/playing phase, return error
      if (!reconnectionValidation.valid) {
        return { success: false, error: reconnectionValidation.error! };
      }
    } else {
      // Game ended or other phase - don't allow any joins
      return { success: false, error: 'GAME_IN_PROGRESS' };
    }

    // Check if name is taken by a connected player (for normal joining)
    const connectedPlayerWithName = Object.values(game.players).find(p => 
      p.name.toLowerCase() === playerName.toLowerCase() && p.connected
    );
    if (connectedPlayerWithName) {
      return { success: false, error: 'NAME_TAKEN' };
    }

    // Normal join logic (we only reach here in lobby phase)

    const playerIds = Object.keys(game.players);
    if (playerIds.length >= game.playerCount) return { success: false, error: 'GAME_FULL' };

    const playerId = generatePlayerId();
    const player: Player = {
      id: playerId,
      name: playerName,
      socketId,
      connected: true,
      currentRoom: 0,
      isHost: false,
      isReady: false,
      isRoleReady: false,
      isRoomConfirmed: false,
      hasUsedAbility: false,
      isLeader: false
    };

    game.players[playerId] = player;
    this.playerToGame.set(playerId, roomCode.toUpperCase());

    // Check if this player should become host (e.g., if they're the original host rejoining)
    this.checkAndAssignHost(game, playerId);

    return { success: true, game, playerId, isReconnection: false };
  }

  private findPreviousPlayer(game: GameState, playerName: string): { player: Player; leftAt: number; originalId: string } | null {
    if (!game.previousPlayers) return null;
    
    const previousPlayerData = game.previousPlayers[playerName.toLowerCase()];
    if (!previousPlayerData) return null;
    
    console.log(`[FIND PREVIOUS] Found previous player ${playerName} in game ${game.roomCode} - left at ${new Date(previousPlayerData.leftAt).toISOString()}`);
    return previousPlayerData;
  }

  private getTimerStateForReconnection(game: GameState): { room0Timer: number | null; room1Timer: number | null } {
    // Only return timer state during playing phase
    if (game.phase !== 'playing') {
      return { room0Timer: null, room1Timer: null };
    }

    const room0Timer = game.timers.room0LeaderCooldown ?? null;
    const room1Timer = game.timers.room1LeaderCooldown ?? null;

    console.log(`[TIMER STATE] Game ${game.roomCode} timer state: room0=${room0Timer}, room1=${room1Timer}`);
    
    return {
      room0Timer,
      room1Timer
    };
  }

  private validateReconnection(game: GameState, playerName: string): { 
    valid: boolean; 
    error?: 'INVALID_PHASE' | 'NAME_TAKEN' | 'NO_PREVIOUS_PLAYER' | 'GAME_NOT_FOUND';
    previousPlayerData?: { player: Player; leftAt: number; originalId: string };
  } {
    // Check if game is in valid phase for reconnection
    if (game.phase !== 'setup' && game.phase !== 'playing') {
      console.log(`[RECONNECTION VALIDATION] Player ${playerName} cannot reconnect - invalid phase: ${game.phase}`);
      return { valid: false, error: 'INVALID_PHASE' };
    }

    // Check if name is currently taken by a connected player
    const connectedPlayerWithName = Object.values(game.players).find(p => 
      p.name.toLowerCase() === playerName.toLowerCase() && p.connected
    );
    if (connectedPlayerWithName) {
      console.log(`[RECONNECTION VALIDATION] Player ${playerName} cannot reconnect - name taken by connected player`);
      return { valid: false, error: 'NAME_TAKEN' };
    }

    // Check if previous player exists
    const previousPlayerData = this.findPreviousPlayer(game, playerName);
    if (!previousPlayerData) {
      console.log(`[RECONNECTION VALIDATION] Player ${playerName} cannot reconnect - no previous player found`);
      return { valid: false, error: 'NO_PREVIOUS_PLAYER' };
    }

    console.log(`[RECONNECTION VALIDATION] Player ${playerName} can reconnect to game ${game.roomCode}`);
    return { valid: true, previousPlayerData };
  }

  private restorePlayerState(
    game: GameState, 
    newPlayerId: string, 
    socketId: string, 
    previousPlayerData: { player: Player; leftAt: number; originalId: string }
  ): Player {
    const { player: previousPlayer, originalId } = previousPlayerData;
    
    // Create new player with restored state
    const restoredPlayer: Player = {
      ...previousPlayer, // Copy all previous state
      id: newPlayerId, // New ID for this session
      socketId, // New socket ID
      connected: true, // Mark as connected
    };

    // Add restored player to game
    game.players[newPlayerId] = restoredPlayer;
    this.playerToGame.set(newPlayerId, game.roomCode);

    // Update room player lists if game is in playing phase
    if (game.phase === 'playing' && previousPlayer.currentRoom !== undefined) {
      const roomIndex = previousPlayer.currentRoom;
      
      // Remove old player ID from room if it exists
      game.rooms[roomIndex].players = game.rooms[roomIndex].players.filter(id => id !== originalId);
      
      // Add new player ID to room
      if (!game.rooms[roomIndex].players.includes(newPlayerId)) {
        game.rooms[roomIndex].players.push(newPlayerId);
      }

      // Restore leader status if they were the leader
      if (previousPlayer.isLeader) {
        game.rooms[roomIndex].leaderId = newPlayerId;
        game.rooms[roomIndex].leaderElectedAt = Date.now();
      }
    }

    // Remove from previousPlayers collection
    if (game.previousPlayers) {
      delete game.previousPlayers[previousPlayer.name.toLowerCase()];
    }

    console.log(`[PLAYER RESTORED] ${previousPlayer.name} reconnected to game ${game.roomCode} with full state restoration`);
    console.log(`[PLAYER RESTORED] Role: ${previousPlayer.role?.type}, Team: ${previousPlayer.role?.team}, Room: ${previousPlayer.currentRoom}, Leader: ${previousPlayer.isLeader}`);
    
    return restoredPlayer;
  }

  private checkAndAssignHost(game: GameState, playerId: string): boolean {
    const player = game.players[playerId];
    if (!player) return false;

    // Check if there's currently no host
    const currentHost = Object.values(game.players).find(p => p.isHost);
    const hasNoHost = !currentHost;
    
    // Check if this player is the original host
    const isOriginalHost = game.originalHostId === playerId;
    
    // Assign host if there's no current host OR if this is the original host returning
    if (hasNoHost || isOriginalHost) {
      // Clear any existing host first (in case original host is returning)
      Object.values(game.players).forEach(p => p.isHost = false);
      
      // Make this player the host
      player.isHost = true;
      
      console.log(`[HOST ASSIGNMENT] ${player.name} is now host (originalHost: ${isOriginalHost}, noHost: ${hasNoHost})`);
      return true;
    }
    
    return false;
  }

  private generateUniqueRoomCode(): string {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.games.has(code));
    return code;
  }
}