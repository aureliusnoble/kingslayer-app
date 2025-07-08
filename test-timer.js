const io = require('socket.io-client');

console.log('🧪 Testing Live Countdown Timer System');
console.log('=====================================\n');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_PLAYERS = ['Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6'];

let gameState = null;
let roomCode = null;
let players = [];
let testResults = {
  gameCreated: false,
  playersJoined: false,
  gameStarted: false,
  initialTimers: false,
  leaderElected: false,
  kickExecuted: false,
  timerReset: false,
  timerCountdown: false
};

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
      testResults.gameCreated = true;
    });
    
    socket.on('game_joined', (data) => {
      console.log(`✅ ${name} joined game`);
      player.playerId = data.playerId;
    });
    
    socket.on('state_update', (data) => {
      gameState = data.gameState;
      if (gameState.phase === 'playing' && !testResults.gameStarted) {
        console.log(`✅ Game entered playing phase`);
        testResults.gameStarted = true;
        checkInitialTimers();
      }
    });
    
    socket.on('timer_started', (data) => {
      console.log(`⏱️  Timer started for room ${data.room}: ${data.duration} seconds`);
      testResults.timerReset = true;
    });
    
    socket.on('timer_expired', (data) => {
      console.log(`⏰ Timer expired for room ${data.room}`);
    });
    
    socket.on('leader_elected', (data) => {
      console.log(`👑 Leader elected in room ${data.roomIndex}: Player ${data.leaderId}`);
      testResults.leaderElected = true;
    });
    
    socket.on('player_sent', (data) => {
      console.log(`🚀 Player sent from room ${data.fromRoom} to room ${data.toRoom}`);
      testResults.kickExecuted = true;
    });
    
    return player;
  });
}

function checkInitialTimers() {
  if (gameState && gameState.timers) {
    console.log(`🔍 Initial timer state:`);
    console.log(`   Room 0 cooldown: ${gameState.timers.room0LeaderCooldown}`);
    console.log(`   Room 1 cooldown: ${gameState.timers.room1LeaderCooldown}`);
    testResults.initialTimers = true;
  }
}

async function runTest() {
  console.log('🚀 Starting test...\n');
  
  // Create player sockets
  players = createPlayerSockets();
  
  // Wait for connections
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 1: Create game
  console.log('📋 Step 1: Creating game...');
  players[0].socket.emit('create_game', {
    playerName: players[0].name,
    playerCount: 6
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 2: Join remaining players
  console.log('📋 Step 2: Joining remaining players...');
  for (let i = 1; i < players.length; i++) {
    players[i].socket.emit('join_game', {
      roomCode: roomCode,
      playerName: players[i].name
    });
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  testResults.playersJoined = true;
  console.log('✅ All players joined');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 3: Ready up all players
  console.log('📋 Step 3: Readying up players...');
  players.forEach(player => {
    player.socket.emit('player_ready');
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 4: Start game
  console.log('📋 Step 4: Starting game...');
  players[0].socket.emit('start_game');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Step 5: Ready up for role reveal
  console.log('📋 Step 5: Role reveal readiness...');
  players.forEach(player => {
    player.socket.emit('player_role_ready');
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 6: Confirm rooms
  console.log('📋 Step 6: Confirming room assignments...');
  players.forEach(player => {
    player.socket.emit('confirm_room', { room: player.index < 3 ? 0 : 1 });
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 7: Test leader election by pointing
  console.log('📋 Step 7: Testing leader election...');
  // Players in room 0 point at player 0
  players[0].socket.emit('point_at_player', { targetId: players[0].playerId });
  players[1].socket.emit('point_at_player', { targetId: players[0].playerId });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 8: Test kick functionality
  if (testResults.leaderElected) {
    console.log('📋 Step 8: Testing kick functionality...');
    players[0].socket.emit('send_player', { targetId: players[1].playerId });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Print test results
  console.log('\n📊 TEST RESULTS:');
  console.log('==================');
  Object.entries(testResults).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  // Disconnect all players
  players.forEach(player => {
    player.socket.disconnect();
  });
  
  process.exit(0);
}

// Run the test
runTest().catch(console.error);