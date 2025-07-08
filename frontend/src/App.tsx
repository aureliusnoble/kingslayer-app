import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useGameStore } from './stores/gameStore';
import { socketService } from './services/socket';
import HomeScreen from './screens/HomeScreen';
import CreateGameScreen from './screens/CreateGameScreen';
import JoinGameScreen from './screens/JoinGameScreen';
import LobbyScreen from './screens/LobbyScreen';
import RoleRevealScreen from './screens/RoleRevealScreen';
import GameScreen from './screens/GameScreen';
import EndScreen from './screens/EndScreen';

function App() {
  const { gameState, roomCode, loading } = useGameStore();

  useEffect(() => {
    // Connect to socket on app mount
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Routing logic based on game state
  const getActiveRoute = () => {
    if (!roomCode) {
      return <Navigate to="/" />;
    }

    // If we have roomCode but no gameState yet, and we're loading, don't navigate
    // This prevents navigation away during game creation
    if (!gameState) {
      if (loading) {
        return null; // Stay on current screen while loading
      }
      return <Navigate to="/" />;
    }

    switch (gameState.phase) {
      case 'lobby':
        return <Navigate to="/lobby" />;
      case 'setup':
        return <Navigate to="/role" />;
      case 'playing':
        return <Navigate to="/game" />;
      case 'ended':
        return <Navigate to="/end" />;
      default:
        return <Navigate to="/" />;
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-neutral-light portrait-only">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/create" element={<CreateGameScreen />} />
          <Route path="/join" element={<JoinGameScreen />} />
          <Route 
            path="/lobby" 
            element={roomCode ? <LobbyScreen /> : <Navigate to="/" />} 
          />
          <Route 
            path="/role" 
            element={gameState?.phase === 'setup' ? <RoleRevealScreen /> : getActiveRoute()} 
          />
          <Route 
            path="/game" 
            element={gameState?.phase === 'playing' ? <GameScreen /> : getActiveRoute()} 
          />
          <Route 
            path="/end" 
            element={gameState?.phase === 'ended' ? <EndScreen /> : getActiveRoute()} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;