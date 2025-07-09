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
  playerName: z.string().min(1).max(20),
  attemptReconnect: z.boolean().optional()
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
    
    // Send timer updates to all games and check for expiration
    const processedGames = new Set();
    io.sockets.sockets.forEach((socket: any) => {
      const playerId = socketToPlayer.get(socket.id);
      if (playerId) {
        const game = gameManager.getGameByPlayerId(playerId);
        if (game && game.phase === 'playing' && !processedGames.has(game.roomCode)) {
          processedGames.add(game.roomCode);
          
          // Check for timer expiration and emit events
          if (game.timers.room0LeaderCooldown === 0) {
            io.to(game.roomCode).emit('timer_expired', { room: 0 });
          }
          if (game.timers.room1LeaderCooldown === 0) {
            io.to(game.roomCode).emit('timer_expired', { room: 1 });
          }
          
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
        const result = gameManager.joinGameWithReconnect(
          validated.roomCode,
          validated.playerName,
          socket.id,
          validated.attemptReconnect || true // Default to attempting reconnection
        );

        if (!result.success) {
          const errorMessages = {
            GAME_NOT_FOUND: 'Game not found. Please check the room code.',
            GAME_FULL: 'Game is full. Cannot join.',
            NAME_TAKEN: 'Cannot join game in session. This name is already taken by a connected player.',
            GAME_IN_PROGRESS: 'Cannot join game in session. Only players who previously left this game can rejoin.',
            INVALID_PHASE: 'Cannot reconnect during this game phase.',
            NO_PREVIOUS_PLAYER: 'Cannot join game in session. No previous player found with this name.'
          } as const;
          
          const errorResult = result as { success: false; error: keyof typeof errorMessages };
          socket.emit('error', { 
            message: errorMessages[errorResult.error], 
            code: errorResult.error
          });
          return;
        }

        const { game, playerId, isReconnection, timerState } = result;
        socketToPlayer.set(socket.id, playerId);
        socket.join(game.roomCode);

        socket.emit('game_joined', { 
          gameState: game, 
          playerId,
          isReconnection 
        });
        
        if (isReconnection) {
          // Notify others about reconnection
          socket.to(game.roomCode).emit('player_reconnected', { 
            playerId,
            playerName: game.players[playerId].name
          });
          
          // Send role info if player has one
          const player = game.players[playerId];
          if (player.role) {
            socket.emit('role_assigned', { 
              role: player.role,
              servantKingId: game.servantInfo?.[playerId]
            });
            
            // Send room assignment
            socket.emit('room_assignment', { room: player.currentRoom });
          }
          
          // Send timer state for reconnection
          if (timerState) {
            socket.emit('timer_update', {
              room0Timer: timerState.room0Timer,
              room1Timer: timerState.room1Timer
            });
            
            // Send timer started events if timers are active
            if (timerState.room0Timer !== null) {
              socket.emit('timer_started', {
                room: 0,
                duration: timerState.room0Timer,
                startTime: game.timers.room0TimerStarted || Date.now()
              });
            }
            if (timerState.room1Timer !== null) {
              socket.emit('timer_started', {
                room: 1,
                duration: timerState.room1Timer,
                startTime: game.timers.room1TimerStarted || Date.now()
              });
            }
          }
          
          debugLog('player_reconnected', { playerId, playerName: player.name }, socket.id);
        } else {
          // Notify others about new player
          socket.to(game.roomCode).emit('player_joined', { 
            player: game.players[playerId] 
          });
        }
        
        // Send updated game state to all players in the room
        io.to(game.roomCode).emit('state_update', { gameState: game });
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

    socket.on('kick_player', (data: any) => {
      const hostId = socketToPlayer.get(socket.id);
      if (!hostId) return;

      const game = gameManager.kickPlayer(hostId, data.targetId);
      if (game) {
        // Get the kicked player's socket to disconnect them
        const kickedPlayer = data.targetId;
        const kickedSocket = [...socketToPlayer.entries()].find(([_, playerId]) => playerId === kickedPlayer)?.[0];
        
        if (kickedSocket) {
          const kickedSocketObj = io.sockets.sockets.get(kickedSocket);
          if (kickedSocketObj) {
            // Notify the kicked player
            kickedSocketObj.emit('player_kicked', { 
              message: 'You have been kicked from the game by the host' 
            });
            // Remove them from the room
            kickedSocketObj.leave(game.roomCode);
            socketToPlayer.delete(kickedSocket);
          }
        }

        // Notify remaining players
        socket.to(game.roomCode).emit('player_kicked', { 
          playerId: data.targetId,
          message: `Player was kicked from the game`
        });
        
        io.to(game.roomCode).emit('state_update', { gameState: game });
      }
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

    socket.on('player_role_ready', () => {
      const playerId = socketToPlayer.get(socket.id);
      debugLog('player_role_ready', { playerId }, socket.id);
      if (!playerId) return;

      const game = gameManager.setPlayerRoleReady(playerId, true);
      
      if (game) {
        debugLog('player_role_ready_changed', { playerId, ready: true }, socket.id);
        io.to(game.roomCode).emit('player_role_ready_changed', { 
          playerId, 
          ready: true
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

      const gameBeforeConfirm = gameManager.getGameByPlayerId(playerId);
      const wasPlaying = gameBeforeConfirm?.phase === 'playing';
      
      const game = gameManager.confirmPlayerRoom(playerId, data.room);
      if (game) {
        io.to(game.roomCode).emit('room_confirmed', { playerId, room: data.room });
        
        // Emit room confirmation progress
        const progress = gameManager.getRoomConfirmationProgress(game.roomCode);
        if (progress) {
          io.to(game.roomCode).emit('room_confirmation_progress', progress);
        }
        
        // Only emit timer events when transitioning to playing for the first time
        if (game.phase === 'playing' && !wasPlaying) {
          io.to(game.roomCode).emit('phase_changed', { phase: 'playing' });
          
          // Emit timer started events for both rooms when game begins
          console.log(`[TIMER] EMITTING timer_started for room 0 and 1 to game ${game.roomCode}`);
          
          // Use setTimeout to ensure phase_changed is processed first
          setTimeout(() => {
            io.to(game.roomCode).emit('timer_started', {
              room: 0,
              duration: 120,
              startTime: game.timers.room0TimerStarted || Date.now()
            });
            io.to(game.roomCode).emit('timer_started', {
              room: 1,
              duration: 120,
              startTime: game.timers.room1TimerStarted || Date.now()
            });
            console.log(`[TIMER] Timer events emitted for both rooms`);
          }, 100);
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
        const leader = game.players[playerId];
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
        
        // After successful kick, emit timer start event
        const roomIndex = leader.currentRoom;
        io.to(game.roomCode).emit('timer_started', {
          room: roomIndex,
          duration: 120,
          startTime: Date.now()
        });
        
        io.to(game.roomCode).emit('state_update', { gameState: game });
      }
    });

    socket.on('declare_leader', () => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) {
        console.log('[LEADER] DECLARE_LEADER: No playerId found for socket');
        return;
      }

      console.log(`[LEADER] DECLARE_LEADER: Player ${playerId} attempting to declare leadership`);
      const game = gameManager.declareLeader(playerId);
      if (game) {
        const player = game.players[playerId];
        console.log(`[LEADER] DECLARE_LEADER: SUCCESS - ${player.name} is now leader in room ${player.currentRoom}`);
        
        // Notify all players about the leader declaration
        io.to(game.roomCode).emit('leader_elected', { 
          roomIndex: player.currentRoom, 
          leaderId: playerId 
        });
        
        io.to(game.roomCode).emit('state_update', { gameState: game });
      } else {
        console.log(`[LEADER] DECLARE_LEADER: FAILED - gameManager.declareLeader returned null`);
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

    socket.on('restart_game', () => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) {
        socket.emit('error', {
          message: 'Player not found',
          code: 'PLAYER_NOT_FOUND'
        });
        return;
      }

      const game = gameManager.restartGame(playerId);
      if (!game) {
        socket.emit('error', {
          message: 'Failed to restart game. Only the host can restart.',
          code: 'RESTART_FAILED'
        });
        return;
      }

      debugLog('game_restarted', { roomCode: game.roomCode }, socket.id);
      
      // Notify all players about the restart
      io.to(game.roomCode).emit('game_restarted', { gameState: game });
      io.to(game.roomCode).emit('state_update', { gameState: game });
    });

    socket.on('request_state', () => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;

      const game = gameManager.getGameByPlayerId(playerId);
      if (game) {
        socket.emit('state_update', { gameState: game });
      }
    });

    socket.on('reconnect_game', (data: any) => {
      const { playerId, roomCode } = data;
      if (!playerId || !roomCode) return;

      const game = gameManager.reconnectPlayer(playerId, socket.id);
      if (game) {
        socketToPlayer.set(socket.id, playerId);
        socket.join(game.roomCode);
        socket.emit('game_joined', { gameState: game, playerId });
        socket.emit('state_update', { gameState: game });
        
        // Notify others that player reconnected
        socket.to(game.roomCode).emit('state_update', { gameState: game });
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