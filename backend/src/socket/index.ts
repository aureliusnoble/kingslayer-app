// Socket.io setup
import { gameManager } from '../routes/gameRoutes';
import { z } from 'zod';

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
      try {
        const validated = CreateGameSchema.parse(data);
        const { game, playerId } = gameManager.createGame(
          validated.playerName,
          validated.playerCount,
          socket.id
        );

        socketToPlayer.set(socket.id, playerId);
        socket.join(game.roomCode);
        
        socket.emit('game_created', { 
          roomCode: game.roomCode, 
          playerId 
        });
        
        socket.emit('state_update', { gameState: game });
      } catch (error) {
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
      if (!playerId) return;

      const currentGame = gameManager.getGameByPlayerId(playerId);
      if (!currentGame) return;

      const player = currentGame.players[playerId];
      const newReadyState = !player.isReady;
      const game = gameManager.setPlayerReady(playerId, newReadyState);
      
      if (game) {
        io.to(game.roomCode).emit('player_ready_changed', { 
          playerId, 
          ready: newReadyState  // Use the new state, not the old one
        });
        io.to(game.roomCode).emit('state_update', { gameState: game });
      }
    });

    socket.on('start_game', () => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;

      const currentGame = gameManager.getGameByPlayerId(playerId);
      if (!currentGame) return;

      const player = currentGame.players[playerId];
      if (!player.isHost) {
        socket.emit('error', { 
          message: 'Only host can start game', 
          code: 'NOT_HOST' 
        });
        return;
      }

      const game = gameManager.startGame(currentGame.roomCode);
      if (!game) {
        socket.emit('error', { 
          message: 'Cannot start game', 
          code: 'START_FAILED' 
        });
        return;
      }

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