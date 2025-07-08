const io = require('socket.io-client');

console.log('🧪 Testing Complete Leader Declaration System');
console.log('===========================================\n');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_PLAYERS = ['Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6'];

let gameState = null;
let roomCode = null;
let players = [];
let testResults = {
  gameSetup: false,
  leaderDeclaration: false,
  stateUpdate: false,
  noErrors: true
};

// Create socket connections
function createPlayerSockets() {
  return TEST_PLAYERS.map((name, index) => {
    const socket = io(SERVER_URL);
    const player = { name, socket, playerId: null, index };
    
    socket.on('connect', () => {
      if (index === 0) console.log(`📡 All players connecting...`);
    });
    
    socket.on('game_created', (data) => {
      if (index === 0) {
        console.log(`✅ Game created: ${data.roomCode}`);
        roomCode = data.roomCode;
      }
      player.playerId = data.playerId;
    });
    
    socket.on('game_joined', (data) => {
      player.playerId = data.playerId;
    });
    
    socket.on('state_update', (data) => {
      gameState = data.gameState;
      if (gameState.phase === 'playing' && !testResults.gameSetup) {
        console.log(`✅ Game reached playing phase`);
        testResults.gameSetup = true;
      }
      
      if (gameState.phase === 'playing') {
        testResults.stateUpdate = true;
      }
    });
    
    socket.on('leader_elected', (data) => {
      console.log(`👑 Leader elected - Room ${data.roomIndex}: ${data.leaderId}`);
      testResults.leaderDeclaration = true;
    });
    
    socket.on('error', (data) => {
      console.log(`❌ Socket Error: ${data.message}`);
      testResults.noErrors = false;
    });
    
    return player;
  });
}

async function runCompleteTest() {
  console.log('🚀 Starting complete test...\n');
  
  try {
    // Create player sockets
    players = createPlayerSockets();
    
    // Wait for connections
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Quick game setup
    console.log('📋 Setting up game to playing phase...');
    
    // Create and join
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
    
    // Ready and start
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
    
    // Test leader declaration
    if (gameState && gameState.phase === 'playing') {
      console.log('\n📋 Testing leader declaration...');
      
      // Player1 declares leadership
      players[0].socket.emit('declare_leader');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Player4 declares leadership
      players[3].socket.emit('declare_leader');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('\n📊 Test Results:');
      console.log('================');
      Object.entries(testResults).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
      });
      
      if (testResults.gameSetup && testResults.leaderDeclaration && testResults.stateUpdate && testResults.noErrors) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ Leader declaration system working correctly');
        console.log('✅ Frontend should now work without errors');
      } else {
        console.log('\n⚠️  Some tests failed - check implementation');
      }
    } else {
      console.log('❌ Failed to reach playing phase');
    }
    
  } catch (error) {
    console.log(`❌ Test error: ${error.message}`);
    testResults.noErrors = false;
  }
  
  // Cleanup
  players.forEach(player => player.socket.disconnect());
  process.exit(0);
}

// Run test
runCompleteTest().catch(console.error);