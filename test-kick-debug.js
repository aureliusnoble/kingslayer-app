const io = require('socket.io-client');

console.log('🧪 Debugging Kick Button Functionality');
console.log('=====================================\n');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_PLAYERS = ['Leader', 'Target', 'Player3', 'Player4', 'Player5', 'Player6'];

let gameState = null;
let roomCode = null;
let players = [];

// Create socket connections
function createPlayerSockets() {
  return TEST_PLAYERS.map((name, index) => {
    const socket = io(SERVER_URL);
    const player = { name, socket, playerId: null, index };
    
    socket.on('connect', () => {
      if (index === 0) console.log(`📡 All players connected`);
    });
    
    socket.on('game_created', (data) => {
      if (index === 0) console.log(`✅ Game created: ${data.roomCode}`);
      roomCode = data.roomCode;
      player.playerId = data.playerId;
    });
    
    socket.on('game_joined', (data) => {
      player.playerId = data.playerId;
    });
    
    socket.on('state_update', (data) => {
      gameState = data.gameState;
    });
    
    socket.on('leader_elected', (data) => {
      console.log(`👑 Leader elected: ${data.leaderId} in room ${data.roomIndex}`);
    });
    
    socket.on('timer_started', (data) => {
      console.log(`⏱️  Timer started - Room ${data.room}: ${data.duration}s`);
    });
    
    socket.on('player_sent', (data) => {
      console.log(`🚀 KICK SUCCESSFUL: Player moved from room ${data.fromRoom} to room ${data.toRoom}`);
    });
    
    socket.on('error', (data) => {
      console.log(`❌ Error: ${data.message}`);
    });
    
    return player;
  });
}

async function runKickTest() {
  console.log('🚀 Setting up kick test...\n');
  
  try {
    // Create player sockets
    players = createPlayerSockets();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Quick game setup to playing phase
    console.log('📋 Setting up game...');
    players[0].socket.emit('create_game', {
      playerName: players[0].name,
      playerCount: 6
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    for (let i = 1; i < players.length; i++) {
      players[i].socket.emit('join_game', {
        roomCode: roomCode,
        playerName: players[i].name
      });
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    players.forEach(player => player.socket.emit('player_ready'));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    players[0].socket.emit('start_game');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    players.forEach(player => player.socket.emit('player_role_ready'));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    players.forEach((player, index) => {
      const room = index < 3 ? 0 : 1;
      player.socket.emit('confirm_room', { room });
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (gameState && gameState.phase === 'playing') {
      console.log('✅ Game in playing phase');
      
      // Make Leader (Player1) the leader of room 0
      console.log('\n📋 Making Player1 leader...');
      players[0].socket.emit('declare_leader');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check timer state
      const room0Timer = gameState.timers.room0LeaderCooldown;
      console.log(`⏱️  Current Room 0 timer: ${room0Timer} seconds`);
      
      if (room0Timer && room0Timer > 0) {
        console.log(`⚠️  Timer is ${room0Timer}s, kicks not available yet`);
        console.log('   In real game, wait 2 minutes for timer to reach 0');
        console.log('   For testing, let\'s try a kick anyway to see the error...');
        
        // Try to kick Target (Player2) - should fail
        console.log(`\n🔧 Testing kick while timer > 0...`);
        players[0].socket.emit('send_player', { targetId: players[1].playerId });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('   Expected: No kick should occur (timer > 0)');
      } else if (room0Timer === 0) {
        console.log('✅ Timer is 0, kicks should be available!');
        
        // Try to kick Target (Player2) - should work
        console.log(`\n🔧 Testing kick with timer = 0...`);
        players[0].socket.emit('send_player', { targetId: players[1].playerId });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('   Expected: Kick should succeed');
      }
      
      console.log('\n📊 Debug Information:');
      console.log('=====================');
      console.log(`Room 0 players: ${gameState.rooms[0].players.length}`);
      console.log(`Room 1 players: ${gameState.rooms[1].players.length}`);
      console.log(`Room 0 leader: ${gameState.rooms[0].leaderId || 'none'}`);
      console.log(`Room 0 timer: ${gameState.timers.room0LeaderCooldown}`);
      console.log(`Room 1 timer: ${gameState.timers.room1LeaderCooldown}`);
      
      console.log('\n💡 Frontend Kick Button Logic:');
      console.log('- Kick buttons only enabled when myRoomTimer === 0');
      console.log('- Timer starts at 120s, counts down to 0');
      console.log('- Kick becomes available when timer reaches 0');
      console.log('- After kick, timer resets to 120s');
      
    } else {
      console.log('❌ Failed to reach playing phase');
    }
    
  } catch (error) {
    console.log(`❌ Test error: ${error.message}`);
  }
  
  // Cleanup
  players.forEach(player => player.socket.disconnect());
  process.exit(0);
}

// Run test
runKickTest().catch(console.error);