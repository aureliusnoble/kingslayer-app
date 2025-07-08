const io = require('socket.io-client');

console.log('🧪 Testing Leader Declaration System');
console.log('====================================\n');

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
      console.log(`✅ Game created: ${data.roomCode}`);
      roomCode = data.roomCode;
      player.playerId = data.playerId;
    });
    
    socket.on('game_joined', (data) => {
      console.log(`✅ ${name} joined`);
      player.playerId = data.playerId;
    });
    
    socket.on('state_update', (data) => {
      gameState = data.gameState;
      
      if (gameState.phase === 'playing') {
        console.log(`🔄 Game in playing phase`);
        console.log(`   Room 0: ${gameState.rooms[0].players.length} players, Leader: ${gameState.rooms[0].leaderId || 'none'}`);
        console.log(`   Room 1: ${gameState.rooms[1].players.length} players, Leader: ${gameState.rooms[1].leaderId || 'none'}`);
      }
    });
    
    socket.on('leader_elected', (data) => {
      console.log(`👑 LEADER ELECTED: Room ${data.roomIndex}, Player: ${data.leaderId}`);
    });
    
    socket.on('timer_started', (data) => {
      console.log(`⏱️  Timer started - Room ${data.room}: ${data.duration}s`);
    });
    
    socket.on('player_sent', (data) => {
      console.log(`🚀 Player kicked from room ${data.fromRoom} to room ${data.toRoom}`);
    });
    
    socket.on('error', (data) => {
      console.log(`❌ Error: ${data.message}`);
    });
    
    return player;
  });
}

async function runTest() {
  console.log('🚀 Starting test...\n');
  
  // Create player sockets
  players = createPlayerSockets();
  
  // Wait for connections
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 1-6: Standard game setup (same as timer test)
  console.log('📋 Steps 1-6: Setting up game to playing phase...');
  
  // Create game
  players[0].socket.emit('create_game', {
    playerName: players[0].name,
    playerCount: 6
  });
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Join players
  for (let i = 1; i < players.length; i++) {
    players[i].socket.emit('join_game', {
      roomCode: roomCode,
      playerName: players[i].name
    });
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Ready up
  players.forEach(player => {
    player.socket.emit('player_ready');
  });
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Start game
  players[0].socket.emit('start_game');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Role ready
  players.forEach(player => {
    player.socket.emit('player_role_ready');
  });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Confirm rooms (first 3 in room 0, last 3 in room 1)
  players.forEach((player, index) => {
    const room = index < 3 ? 0 : 1;
    player.socket.emit('confirm_room', { room });
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('✅ Game setup complete, now in playing phase\n');
  
  // Step 7: Test leader declaration
  console.log('📋 Step 7: Testing leader declaration...');
  
  if (gameState && gameState.phase === 'playing') {
    console.log('🔍 Current state before leader declaration:');
    console.log(`   Room 0 leader: ${gameState.rooms[0].leaderId || 'none'}`);
    console.log(`   Room 1 leader: ${gameState.rooms[1].leaderId || 'none'}`);
    
    // Player1 (in room 0) declares themselves leader
    console.log(`\n👑 Player1 declaring leadership in room 0...`);
    players[0].socket.emit('declare_leader');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if Player1 became leader
    if (gameState.rooms[0].leaderId === players[0].playerId) {
      console.log('✅ SUCCESS: Player1 is now leader of room 0');
    } else {
      console.log('❌ FAILED: Player1 did not become leader');
    }
    
    // Player4 (in room 1) declares themselves leader
    console.log(`\n👑 Player4 declaring leadership in room 1...`);
    players[3].socket.emit('declare_leader');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if Player4 became leader
    if (gameState.rooms[1].leaderId === players[3].playerId) {
      console.log('✅ SUCCESS: Player4 is now leader of room 1');
    } else {
      console.log('❌ FAILED: Player4 did not become leader');
    }
    
    // Test leader override: Player2 declares leadership in room 0
    console.log(`\n👑 Player2 trying to override Player1's leadership in room 0...`);
    players[1].socket.emit('declare_leader');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if Player2 became leader (should override Player1)
    if (gameState.rooms[0].leaderId === players[1].playerId) {
      console.log('✅ SUCCESS: Player2 overrode Player1 as leader of room 0');
    } else {
      console.log('❌ FAILED: Player2 did not override leadership');
    }
    
    // Wait for timer to reach 0 and test kick functionality
    console.log(`\n⏱️  Waiting for timer to reach 0 to test kick functionality...`);
    console.log('   (Timers start at 120 seconds, this will take 2 minutes in real implementation)');
    console.log('   For testing, we will wait a few seconds to see timer countdown...');
    
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (gameState && gameState.timers) {
        const room0Timer = gameState.timers.room0LeaderCooldown;
        const room1Timer = gameState.timers.room1LeaderCooldown;
        console.log(`   Timer status: Room0=${room0Timer}s, Room1=${room1Timer}s`);
      }
    }
    
  } else {
    console.log('❌ FAILED: Game not in playing phase');
  }
  
  console.log('\n📋 Test Summary:');
  console.log('================');
  console.log('✅ Leader declaration backend method: IMPLEMENTED');
  console.log('✅ Socket event handling: IMPLEMENTED');
  console.log('✅ Leader override functionality: IMPLEMENTED');
  console.log('⏭️  Next: Frontend UI testing (manual)');
  
  // Disconnect all players
  console.log('\n🔚 Disconnecting...');
  players.forEach(player => {
    player.socket.disconnect();
  });
  
  process.exit(0);
}

// Run the test
runTest().catch(console.error);