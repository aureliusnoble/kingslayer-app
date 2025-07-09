import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import MedievalBackground from '../components/common/MedievalBackground';
import CrownLogo from '../components/common/CrownLogo';

export default function HomeScreen() {
  const navigate = useNavigate();

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
              variant="medieval-gold"
              size="large"
              fullWidth
              onClick={() => navigate('/tutorial')}
              className="bg-opacity-90 hover:bg-opacity-100 transition-opacity text-white"
            >
              TUTORIAL
            </Button>
          </div>

          <p className="text-center text-sm text-medieval-stone-light font-medium drop-shadow-md">
            Version 0.0.1
          </p>
        </div>
      </div>
    </MedievalBackground>
  );
}