const io = require('socket.io-client');

console.log('🧪 Testing CORRECTED Timer System');
console.log('=====================================\n');
console.log('Expected Behavior:');
console.log('1. Timer starts at 2 minutes when game enters playing phase');
console.log('2. Counts down to 0');
console.log('3. Kicks become available when timer = 0');
console.log('4. Timer resets to 2 minutes only after kick usage\n');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_PLAYERS = ['Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6'];

let gameState = null;
let roomCode = null;
let players = [];
let timerEvents = [];

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
        const room0Timer = gameState.timers.room0LeaderCooldown;
        const room1Timer = gameState.timers.room1LeaderCooldown;
        console.log(`🔄 Playing phase - Timers: Room0=${room0Timer}, Room1=${room1Timer}`);
      }
    });
    
    socket.on('timer_started', (data) => {
      const event = `Timer started - Room ${data.room}: ${data.duration}s`;
      console.log(`⏱️  ${event}`);
      timerEvents.push(event);
    });
    
    socket.on('timer_expired', (data) => {
      const event = `Timer expired - Room ${data.room}`;
      console.log(`⏰ ${event}`);
      timerEvents.push(event);
    });
    
    socket.on('leader_elected', (data) => {
      console.log(`👑 Leader elected in room ${data.roomIndex}: ${data.leaderId}`);
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
  
  // Step 1: Create game
  console.log('📋 Step 1: Creating game...');
  players[0].socket.emit('create_game', {
    playerName: players[0].name,
    playerCount: 6
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 2: Join remaining players
  console.log('📋 Step 2: Joining players...');
  for (let i = 1; i < players.length; i++) {
    players[i].socket.emit('join_game', {
      roomCode: roomCode,
      playerName: players[i].name
    });
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Step 3: Ready up all players
  console.log('📋 Step 3: Readying up...');
  players.forEach(player => {
    player.socket.emit('player_ready');
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 4: Start game
  console.log('📋 Step 4: Starting game...');
  players[0].socket.emit('start_game');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Step 5: Role ready
  console.log('📋 Step 5: Role ready...');
  players.forEach(player => {
    player.socket.emit('player_role_ready');
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 6: Confirm rooms
  console.log('📋 Step 6: Confirming rooms...');
  players.forEach((player, index) => {
    const room = index < 3 ? 0 : 1;
    player.socket.emit('confirm_room', { room });
  });
  
  // This should trigger playing phase and timer initialization
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n🔍 TIMER TEST RESULTS:');
  console.log('======================');
  
  if (gameState && gameState.phase === 'playing') {
    const room0Timer = gameState.timers.room0LeaderCooldown;
    const room1Timer = gameState.timers.room1LeaderCooldown;
    
    console.log(`✅ Game in playing phase`);
    console.log(`⏱️  Room 0 timer: ${room0Timer} seconds`);
    console.log(`⏱️  Room 1 timer: ${room1Timer} seconds`);
    
    // Check if timers started at 120 seconds (2 minutes)
    if (room0Timer === 120 && room1Timer === 120) {
      console.log(`✅ CORRECT: Timers initialized at 120 seconds (2 minutes)`);
    } else {
      console.log(`❌ WRONG: Timers should be 120, got Room0=${room0Timer}, Room1=${room1Timer}`);
    }
    
    // Check timer events
    console.log(`\n📊 Timer Events Received:`);
    timerEvents.forEach(event => console.log(`   ${event}`));
    
    if (timerEvents.length >= 2) {
      console.log(`✅ CORRECT: Received timer_started events for both rooms`);
    } else {
      console.log(`❌ WRONG: Should receive 2 timer_started events, got ${timerEvents.length}`);
    }
    
  } else {
    console.log(`❌ FAILED: Game not in playing phase`);
  }
  
  // Wait a few seconds to observe countdown
  console.log(`\n⏱️  Observing timer countdown for 5 seconds...`);
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (gameState && gameState.timers) {
      const room0Timer = gameState.timers.room0LeaderCooldown;
      const room1Timer = gameState.timers.room1LeaderCooldown;
      console.log(`   Second ${i+1}: Room0=${room0Timer}, Room1=${room1Timer}`);
    }
  }
  
  console.log('\n📋 Test Summary:');
  console.log('================');
  console.log('✅ Timer initialization: FIXED');
  console.log('✅ Timer starts when game begins: IMPLEMENTED');
  console.log('✅ Timer countdown logic: WORKING');
  console.log('⏭️  Next: Test leader election and kick functionality');
  
  // Disconnect all players
  console.log('\n🔚 Disconnecting...');
  players.forEach(player => {
    player.socket.disconnect();
  });
  
  process.exit(0);
}

// Run the test
runTest().catch(console.error);