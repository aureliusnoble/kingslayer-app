// Socket.io setup
import { gameManager } from '../routes/gameRoutes';
import { z } from 'zod';

// Debug logging helper
const DEBUG = process.env.NODE_ENV === 'development';
const debugLog = (event: string, data: any, socketId?: string) => {
  if (DEBUG) {
    console.log(`[SOCKET] ${event}:`, {
      socketId: socketId ? socketId.substring(0, 8) + '...' : 'N/A',
      data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
      timestamp: new Date().toISOString()
    });
  }
};

// Validation schemas
const JoinGameSchema = z.object({
  roomCode: z.string().length(6).regex(/^[A-Z0-9]+$/),
  playerName: z.string().min(1).max(20)
});

const CreateGameSchema = z.object({
  playerName: z.string().min(1).max(20),
  playerCount: z.number().int().min(6).max(14).refine(n => n % 2 === 0)
});

// Store socket ID to player ID mapping
const socketToPlayer = new Map<string, string>();

export function setupSocketHandlers(io: any) {
  // Timer updates every second
  setInterval(() => {
    gameManager.updateTimers();
    
    // Send timer updates to all games
    io.sockets.sockets.forEach((socket: any) => {
      const playerId = socketToPlayer.get(socket.id);
      if (playerId) {
        const game = gameManager.getGameByPlayerId(playerId);
        if (game && game.phase === 'playing') {
          socket.emit('timer_update', {
            room0Timer: game.timers.room0LeaderCooldown,
            room1Timer: game.timers.room1LeaderCooldown
          });
        }
      }
    });
  }, 1000);

  io.on('connection', (socket: any) => {
    console.log('Client connected:', socket.id);

    socket.on('create_game', (data: any) => {
      debugLog('create_game', data, socket.id);
      try {
        const validated = CreateGameSchema.parse(data);
        const { game, playerId } = gameManager.createGame(
          validated.playerName,
          validated.playerCount,
          socket.id
        );

        socketToPlayer.set(socket.id, playerId);
        socket.join(game.roomCode);
        
        debugLog('game_created', { roomCode: game.roomCode, playerId }, socket.id);
        socket.emit('game_created', { 
          roomCode: game.roomCode, 
          playerId 
        });
        
        debugLog('state_update', { phase: game.phase, playerCount: Object.keys(game.players).length }, socket.id);
        socket.emit('state_update', { gameState: game });
      } catch (error) {
        debugLog('create_game_error', error, socket.id);
        socket.emit('error', { 
          message: 'Failed to create game', 
          code: 'CREATE_FAILED' 
        });
      }
    });

    socket.on('join_game', (data: any) => {
      try {
        const validated = JoinGameSchema.parse(data);
        const result = gameManager.joinGame(
          validated.roomCode,
          validated.playerName,
          socket.id
        );

        if (!result) {
          socket.emit('error', { 
            message: 'Game not found or full', 
            code: 'JOIN_FAILED' 
          });
          return;
        }

        const { game, playerId } = result;
        socketToPlayer.set(socket.id, playerId);
        socket.join(game.roomCode);

        socket.emit('game_joined', { gameState: game, playerId });
        
        // Notify others
        socket.to(game.roomCode).emit('player_joined', { 
          player: game.players[playerId] 
        });
      } catch (error) {
        socket.emit('error', { 
          message: 'Invalid game code or name', 
          code: 'VALIDATION_ERROR' 
        });
      }
    });

    socket.on('leave_game', () => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;

      const game = gameManager.leaveGame(playerId);
      if (game) {
        socket.leave(game.roomCode);
        socket.to(game.roomCode).emit('player_left', { playerId });
        io.to(game.roomCode).emit('state_update', { gameState: game });
      }

      socketToPlayer.delete(socket.id);
    });

    socket.on('player_ready', () => {
      const playerId = socketToPlayer.get(socket.id);
      debugLog('player_ready', { playerId }, socket.id);
      if (!playerId) return;

      const currentGame = gameManager.getGameByPlayerId(playerId);
      if (!currentGame) return;

      const player = currentGame.players[playerId];
      const newReadyState = !player.isReady;
      const game = gameManager.setPlayerReady(playerId, newReadyState);
      
      if (game) {
        debugLog('player_ready_changed', { playerId, ready: newReadyState }, socket.id);
        io.to(game.roomCode).emit('player_ready_changed', { 
          playerId, 
          ready: newReadyState  // Use the new state, not the old one
        });
        io.to(game.roomCode).emit('state_update', { gameState: game });
      }
    });

    socket.on('start_game', () => {
      debugLog('start_game_received', {}, socket.id);
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) {
        debugLog('start_game_no_player_id', { socketId: socket.id }, socket.id);
        return;
      }

      const currentGame = gameManager.getGameByPlayerId(playerId);
      if (!currentGame) {
        debugLog('start_game_no_game', { playerId }, socket.id);
        return;
      }

      const player = currentGame.players[playerId];
      debugLog('start_game_player_check', { 
        playerId, 
        isHost: player.isHost,
        playerCount: Object.keys(currentGame.players).length,
        maxPlayers: currentGame.playerCount,
        allReady: Object.values(currentGame.players).every((p: any) => p.isReady)
      }, socket.id);
      
      if (!player.isHost) {
        debugLog('start_game_not_host', { playerId }, socket.id);
        socket.emit('error', { 
          message: 'Only host can start game', 
          code: 'NOT_HOST' 
        });
        return;
      }

      const game = gameManager.startGame(currentGame.roomCode);
      if (!game) {
        debugLog('start_game_failed', { roomCode: currentGame.roomCode }, socket.id);
        socket.emit('error', { 
          message: 'Cannot start game', 
          code: 'START_FAILED' 
        });
        return;
      }
      
      debugLog('start_game_success', { roomCode: game.roomCode, phase: game.phase }, socket.id);

      // Send role assignments to each player
      Object.values(game.players).forEach((p: any) => {
        const playerSocket = io.sockets.sockets.get(p.socketId);
        if (playerSocket && p.role) {
          playerSocket.emit('role_assigned', { 
            role: p.role,
            servantKingId: game.servantInfo?.[p.id]
          });
          
          // Send room assignment
          playerSocket.emit('room_assignment', { room: p.currentRoom });
        }
      });

      io.to(game.roomCode).emit('game_started', { gameState: game });
      io.to(game.roomCode).emit('phase_changed', { phase: 'setup' });
      io.to(game.roomCode).emit('state_update', { gameState: game });
    });

    socket.on('confirm_room', (data: any) => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;

      const game = gameManager.confirmPlayerRoom(playerId, data.room);
      if (game) {
        io.to(game.roomCode).emit('room_confirmed', { playerId, room: data.room });
        
        if (game.phase === 'playing') {
          io.to(game.roomCode).emit('phase_changed', { phase: 'playing' });
        }
        
        io.to(game.roomCode).emit('state_update', { gameState: game });
      }
    });

    socket.on('point_at_player', (data: any) => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;

      const game = gameManager.updatePointing(playerId, data.targetId);
      if (game) {
        io.to(game.roomCode).emit('pointing_changed', { playerId, targetId: data.targetId });
        
        // Check if leader changed
        const player = game.players[playerId];
        const room = game.rooms[player.currentRoom];
        if (room.leaderId) {
          io.to(game.roomCode).emit('leader_elected', { 
            roomIndex: player.currentRoom, 
            leaderId: room.leaderId 
          });
        }
        
        io.to(game.roomCode).emit('state_update', { gameState: game });
      }
    });

    socket.on('send_player', (data: any) => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;

      const game = gameManager.sendPlayer(playerId, data.targetId);
      if (game) {
        const target = game.players[data.targetId];
        const fromRoom = target.currentRoom === 0 ? 1 : 0;
        
        io.to(game.roomCode).emit('player_sent', { 
          playerId: data.targetId, 
          fromRoom, 
          toRoom: target.currentRoom 
        });
        
        // Notify the player to move
        const targetSocket = io.sockets.sockets.get(target.socketId);
        if (targetSocket) {
          targetSocket.emit('room_assignment', { room: target.currentRoom });
        }
        
        io.to(game.roomCode).emit('state_update', { gameState: game });
      }
    });

    socket.on('gatekeeper_send', (data: any) => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;

      const game = gameManager.gatekeeperSend(playerId, data.targetId);
      if (game) {
        const target = game.players[data.targetId];
        const fromRoom = target.currentRoom === 0 ? 1 : 0;
        
        io.to(game.roomCode).emit('player_sent', { 
          playerId: data.targetId, 
          fromRoom, 
          toRoom: target.currentRoom 
        });
        
        // Notify the player to move
        const targetSocket = io.sockets.sockets.get(target.socketId);
        if (targetSocket) {
          targetSocket.emit('room_assignment', { room: target.currentRoom });
        }
        
        io.to(game.roomCode).emit('state_update', { gameState: game });
      }
    });

    socket.on('swordsmith_confirm', (data: any) => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;

      const game = gameManager.swordsmithConfirm(playerId, data.assassinId);
      if (game) {
        // Notify the assassin
        const assassin = game.players[data.assassinId];
        const assassinSocket = io.sockets.sockets.get(assassin.socketId);
        if (assassinSocket) {
          assassinSocket.emit('swordsmith_confirmed', { assassinId: data.assassinId });
        }
        
        io.to(game.roomCode).emit('state_update', { gameState: game });
      }
    });

    socket.on('request_state', () => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;

      const game = gameManager.getGameByPlayerId(playerId);
      if (game) {
        socket.emit('state_update', { gameState: game });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      const playerId = socketToPlayer.get(socket.id);
      if (playerId) {
        const game = gameManager.disconnectPlayer(playerId);
        if (game) {
          socket.to(game.roomCode).emit('state_update', { gameState: game });
        }
      }
      
      socketToPlayer.delete(socket.id);
    });
  });
}