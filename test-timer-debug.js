const io = require('socket.io-client');

console.log('🧪 Testing Live Countdown Timer System (Debug Mode)');
console.log('==================================================\n');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_PLAYERS = ['Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6'];

let gameState = null;
let roomCode = null;
let players = [];

// Create socket connections for all players
function createPlayerSockets() {
  return TEST_PLAYERS.map((name, index) => {
    const socket = io(SERVER_URL);
    const player = { name, socket, playerId: null, index };
    
    socket.on('connect', () => {
      console.log(`📡 ${name} connected`);
    });
    
    socket.on('game_created', (data) => {
      console.log(`✅ Game created by ${name}: ${data.roomCode}`);
      roomCode = data.roomCode;
      player.playerId = data.playerId;
    });
    
    socket.on('game_joined', (data) => {
      console.log(`✅ ${name} joined game`);
      player.playerId = data.playerId;
    });
    
    socket.on('state_update', (data) => {
      gameState = data.gameState;
      console.log(`🔄 State update - Phase: ${gameState.phase}, Players: ${Object.keys(gameState.players).length}`);
      
      if (gameState.phase === 'playing') {
        console.log(`🏠 Room assignments:`);
        console.log(`   Room 0: ${gameState.rooms[0].players.length} players`);
        console.log(`   Room 1: ${gameState.rooms[1].players.length} players`);
        console.log(`⏲️  Timer state:`);
        console.log(`   Room 0 cooldown: ${gameState.timers.room0LeaderCooldown}`);
        console.log(`   Room 1 cooldown: ${gameState.timers.room1LeaderCooldown}`);
      }
    });
    
    socket.on('timer_started', (data) => {
      console.log(`⏱️  Timer started for room ${data.room}: ${data.duration} seconds`);
    });
    
    socket.on('timer_expired', (data) => {
      console.log(`⏰ Timer expired for room ${data.room}`);
    });
    
    socket.on('pointing_changed', (data) => {
      console.log(`👉 ${data.playerId} pointing at ${data.targetId}`);
    });
    
    socket.on('leader_elected', (data) => {
      console.log(`👑 Leader elected in room ${data.roomIndex}: Player ${data.leaderId}`);
    });
    
    socket.on('player_sent', (data) => {
      console.log(`🚀 Player sent from room ${data.fromRoom} to room ${data.toRoom}`);
    });
    
    socket.on('error', (data) => {
      console.log(`❌ Error: ${data.message}`);
    });
    
    return player;
  });
}

async function runDetailedTest() {
  console.log('🚀 Starting detailed test...\n');
  
  // Create player sockets
  players = createPlayerSockets();
  
  // Wait for connections
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 1: Create game
  console.log('\n📋 Step 1: Creating game...');
  players[0].socket.emit('create_game', {
    playerName: players[0].name,
    playerCount: 6
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 2: Join remaining players
  console.log('\n📋 Step 2: Joining remaining players...');
  for (let i = 1; i < players.length; i++) {
    console.log(`   Joining ${players[i].name}...`);
    players[i].socket.emit('join_game', {
      roomCode: roomCode,
      playerName: players[i].name
    });
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 3: Ready up all players
  console.log('\n📋 Step 3: Readying up players...');
  players.forEach((player, index) => {
    console.log(`   ${player.name} ready`);
    player.socket.emit('player_ready');
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 4: Start game
  console.log('\n📋 Step 4: Starting game...');
  players[0].socket.emit('start_game');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Step 5: Ready up for role reveal
  console.log('\n📋 Step 5: Role reveal readiness...');
  players.forEach((player, index) => {
    console.log(`   ${player.name} role ready`);
    player.socket.emit('player_role_ready');
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Step 6: Confirm rooms
  console.log('\n📋 Step 6: Confirming room assignments...');
  players.forEach((player, index) => {
    const room = index < 3 ? 0 : 1;
    console.log(`   ${player.name} confirming room ${room}`);
    player.socket.emit('confirm_room', { room });
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check current state
  if (gameState) {
    console.log('\n🔍 Current Game State:');
    console.log(`   Phase: ${gameState.phase}`);
    console.log(`   Room 0 players: ${gameState.rooms[0].players.length}`);
    console.log(`   Room 1 players: ${gameState.rooms[1].players.length}`);
    console.log(`   Room 0 leader: ${gameState.rooms[0].leaderId || 'none'}`);
    console.log(`   Room 1 leader: ${gameState.rooms[1].leaderId || 'none'}`);
  }
  
  // Step 7: Test leader election by pointing
  console.log('\n📋 Step 7: Testing leader election...');
  console.log('   Players in room 0 pointing at Player1...');
  
  // Get actual player IDs for room 0
  if (gameState && gameState.rooms[0].players.length >= 2) {
    const room0Players = gameState.rooms[0].players;
    const targetPlayerId = room0Players[0]; // First player in room 0
    
    console.log(`   Target player ID: ${targetPlayerId}`);
    
    // All players in room 0 point at the first player
    room0Players.forEach((playerId, index) => {
      const playerSocket = players.find(p => p.playerId === playerId)?.socket;
      if (playerSocket && index > 0) { // Don't have player point at themselves
        console.log(`   Player ${playerId} pointing at ${targetPlayerId}`);
        playerSocket.emit('point_at_player', { targetId: targetPlayerId });
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 8: Test kick functionality if leader exists
    if (gameState.rooms[0].leaderId) {
      console.log('\n📋 Step 8: Testing kick functionality...');
      const leaderId = gameState.rooms[0].leaderId;
      const leaderSocket = players.find(p => p.playerId === leaderId)?.socket;
      const targetId = room0Players.find(id => id !== leaderId);
      
      if (leaderSocket && targetId) {
        console.log(`   Leader ${leaderId} kicking ${targetId}`);
        leaderSocket.emit('send_player', { targetId });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } else {
      console.log('❌ No leader elected, cannot test kick');
    }
  }
  
  // Disconnect all players
  console.log('\n🔚 Test complete, disconnecting...');
  players.forEach(player => {
    player.socket.disconnect();
  });
  
  process.exit(0);
}

// Run the test
runDetailedTest().catch(console.error);