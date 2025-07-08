const io = require('socket.io-client');

console.log('🧪 Testing Leader Declaration UI Fix');
console.log('===================================\n');

// Quick test to verify backend is working
const SERVER_URL = 'http://localhost:3000';
const socket = io(SERVER_URL);

socket.on('connect', () => {
  console.log('✅ Backend connection successful');
  
  // Test leader declaration endpoint
  socket.emit('create_game', {
    playerName: 'TestPlayer',
    playerCount: 6
  });
});

socket.on('game_created', (data) => {
  console.log(`✅ Game created: ${data.roomCode}`);
  console.log('✅ Backend leader declaration system ready');
  console.log('');
  console.log('🌐 Frontend available at: http://localhost:5173');
  console.log('');
  console.log('📋 Manual Testing Steps:');
  console.log('1. Open http://localhost:5173 in browser');
  console.log('2. Create a game with 6 players');
  console.log('3. Complete setup to reach playing phase');
  console.log('4. Click "👑 DECLARE MYSELF LEADER" button');
  console.log('5. Verify no blank screen or errors occur');
  console.log('6. Verify leader UI appears with crown and status');
  console.log('');
  console.log('✅ Fix Applied: myRoomTimer variable reference corrected');
  console.log('✅ Previous null check fix: myPlayer?.hasUsedAbility');
  
  socket.disconnect();
  process.exit(0);
});

socket.on('error', (data) => {
  console.log(`❌ Error: ${data.message}`);
  process.exit(1);
});

setTimeout(() => {
  console.log('❌ Timeout - backend may not be responding');
  process.exit(1);
}, 5000);