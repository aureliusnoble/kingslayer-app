import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { useState } from 'react';
import Modal from '../components/common/Modal';

export default function HomeScreen() {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">KINGSLAYER</h1>
          <p className="text-neutral-medium">Social Deduction Game</p>
        </div>

        <div className="space-y-4">
          <Button
            variant="primary"
            size="large"
            fullWidth
            onClick={() => navigate('/create')}
          >
            CREATE GAME
          </Button>

          <Button
            variant="secondary"
            size="large"
            fullWidth
            onClick={() => navigate('/join')}
          >
            JOIN GAME
          </Button>

          <Button
            variant="secondary"
            size="medium"
            fullWidth
            onClick={() => setShowRules(true)}
          >
            HOW TO PLAY
          </Button>
        </div>

        <p className="text-center text-sm text-neutral-medium">
          Version 1.0.0
        </p>
      </div>

      <Modal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        title="How to Play"
      >
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-1">Objective</h3>
            <p>Each team (Red and Blue) tries to assassinate the opposing team's King while protecting their own.</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">Setup</h3>
            <p>Players are secretly assigned roles and teams, then separated into two physical rooms.</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">Gameplay</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Elect leaders by pointing at players</li>
              <li>Leaders can send players between rooms</li>
              <li>Use special abilities to gather information</li>
              <li>Assassins must identify and eliminate the enemy King</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">Victory</h3>
            <p>The game ends when an Assassin successfully identifies the opposing King, or fails and reveals their own team's position.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}