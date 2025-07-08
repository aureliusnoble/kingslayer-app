import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { useState } from 'react';
import Modal from '../components/common/Modal';
import MedievalBackground from '../components/common/MedievalBackground';
import CrownLogo from '../components/common/CrownLogo';

export default function HomeScreen() {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);

  return (
    <MedievalBackground variant="castle-hall" particles={true}>
      <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
        <div className="max-w-sm w-full space-y-8">
          {/* Logo Section */}
          <div className="text-center space-y-6">
            <CrownLogo size="xlarge" animated={true} glow={true} />
            <div>
              <h1 className="text-4xl font-bold mb-2 text-white font-display tracking-wider">
                KINGSLAYER
              </h1>
            
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-5">
            <Button
              variant="medieval-red"
              size="large"
              fullWidth
              onClick={() => navigate('/create')}
              className="bg-opacity-90 hover:bg-opacity-100 transition-opacity"
            >
              CREATE GAME
            </Button>

            <Button
              variant="medieval-blue"
              size="large"
              fullWidth
              onClick={() => navigate('/join')}
              className="bg-opacity-90 hover:bg-opacity-100 transition-opacity"
            >
              JOIN GAME
            </Button>

            <Button
              variant="medieval-stone"
              size="medium"
              fullWidth
              onClick={() => setShowRules(true)}
              className="bg-opacity-90 hover:bg-opacity-100 transition-opacity"
            >
              HOW TO PLAY
            </Button>
          </div>

          <p className="text-center text-sm text-medieval-stone-light font-medium drop-shadow-md">
            Version 0.0.1
          </p>
        </div>
      </div>

      <Modal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        title="How to Play"
        theme="parchment"
        size="medium"
      >
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-1 text-medieval-stone-dark">Objective</h3>
            <p className="text-medieval-stone-dark">Each team (Red and Blue) tries to assassinate the opposing team's King while protecting their own.</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1 text-medieval-stone-dark">Setup</h3>
            <p className="text-medieval-stone-dark">Players are secretly assigned roles and teams, then separated into two physical rooms.</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1 text-medieval-stone-dark">Gameplay</h3>
            <ul className="list-disc list-inside space-y-1 text-medieval-stone-dark">
              <li>Elect leaders by pointing at players</li>
              <li>Leaders can send players between rooms</li>
              <li>Use special abilities to gather information</li>
              <li>Assassins must identify and eliminate the enemy King</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1 text-medieval-stone-dark">Victory</h3>
            <p className="text-medieval-stone-dark">The game ends when an Assassin successfully identifies the opposing King, or fails and reveals their own team's position.</p>
          </div>
        </div>
      </Modal>
    </MedievalBackground>
  );
}