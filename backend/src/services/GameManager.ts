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

    // Transfer host if needed
    if (game.players[playerId]?.isHost) {
      const newHostId = Object.keys(game.players)[0];
      if (newHostId) {
        game.players[newHostId].isHost = true;
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
    });

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

    console.log(`[GAME RESTART] Game ${game.roomCode} restarted by host ${host.name}`);

    return game;
  }

  joinGameWithReconnect(roomCode: string, playerName: string, socketId: string, attemptReconnect: boolean = false): 
    { success: true; game: GameState; playerId: string; isReconnection: boolean } | 
    { success: false; error: 'GAME_NOT_FOUND' | 'GAME_FULL' | 'NAME_TAKEN' } {
    
    const game = this.games.get(roomCode.toUpperCase());
    if (!game) return { success: false, error: 'GAME_NOT_FOUND' };

    // Check for reconnection opportunity
    if (attemptReconnect) {
      const disconnectedPlayer = Object.values(game.players).find(p => 
        p.name.toLowerCase() === playerName.toLowerCase() && !p.connected
      );

      if (disconnectedPlayer) {
        // Reconnection case
        disconnectedPlayer.socketId = socketId;
        disconnectedPlayer.connected = true;
        this.playerToGame.set(disconnectedPlayer.id, roomCode.toUpperCase());
        
        console.log(`[PLAYER RECONNECT] Player ${playerName} reconnected to game ${roomCode}`);
        return { 
          success: true, 
          game, 
          playerId: disconnectedPlayer.id, 
          isReconnection: true 
        };
      }
    }

    // Check if name is taken by a connected player
    const connectedPlayerWithName = Object.values(game.players).find(p => 
      p.name.toLowerCase() === playerName.toLowerCase() && p.connected
    );
    if (connectedPlayerWithName) {
      return { success: false, error: 'NAME_TAKEN' };
    }

    // Normal join logic
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

    return { success: true, game, playerId, isReconnection: false };
  }

  private generateUniqueRoomCode(): string {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.games.has(code));
    return code;
  }
}