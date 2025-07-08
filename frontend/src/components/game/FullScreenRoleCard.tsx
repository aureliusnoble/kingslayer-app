import { useState, useEffect } from 'react';
import { Role } from '../../shared';
import clsx from 'clsx';
import Button from '../common/Button';
import { Crown, Swords, DoorClosed, Hammer, Shield, UserX, Bell, Eye } from 'lucide-react';

interface FullScreenRoleCardProps {
  role: Role;
  isVisible: boolean;
  onClose: () => void;
}

type RevealStage = 'eye' | 'full';

const getRoleIcon = (roleType: string) => {
  switch (roleType) {
    case 'KING': return <Crown size={120} className="text-white mx-auto" />;
    case 'ASSASSIN': return <Swords size={120} className="text-white mx-auto" />;
    case 'GATEKEEPER': return <DoorClosed size={120} className="text-white mx-auto" />;
    case 'SWORDSMITH': return <Hammer size={120} className="text-white mx-auto" />;
    case 'GUARD': return <Shield size={120} className="text-white mx-auto" />;
    case 'SPY': return <UserX size={120} className="text-white mx-auto" />;
    case 'SERVANT': return <Bell size={120} className="text-white mx-auto" />;
    default: return <Crown size={120} className="text-white mx-auto" />;
  }
};

export default function FullScreenRoleCard({ role, isVisible, onClose }: FullScreenRoleCardProps) {
  const [revealStage, setRevealStage] = useState<RevealStage>('eye');
  
  // Reset to eye stage whenever the component becomes visible
  useEffect(() => {
    if (isVisible) {
      setRevealStage('eye');
    }
  }, [isVisible]);
  
  if (!isVisible) return null;

  // Use true role (not fake role for spies) when showing to others
  const displayRole = role;
  const teamColor = displayRole.team === 'RED' ? 'bg-red-primary' : 'bg-blue-primary';
  const borderColor = displayRole.team === 'RED' ? 'border-red-background' : 'border-blue-background';

  const handleEyeClick = () => {
    setRevealStage(revealStage === 'eye' ? 'full' : 'eye');
  };

  const handleClose = () => {
    setRevealStage('eye'); // Reset to eye state when closing
    onClose();
  };

  return (
    <div 
      className={clsx(
        'fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer',
        teamColor
      )}
      onClick={handleEyeClick}
    >
      {/* Thick team-colored border at edge of screen */}
      <div className={clsx(
        'absolute inset-0 border-[20px] pointer-events-none',
        borderColor
      )} />
      
      {/* Center content area */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full text-white">
        
        {/* Stage 1: Eye button */}
        {revealStage === 'eye' && (
          <div className="text-center">
            <button
              onClick={handleEyeClick}
              className="hover:scale-110 transition-transform duration-200 active:scale-95 p-4"
            >
              <Eye size={120} className="text-white" />
            </button>
            <p className="text-lg mt-4 opacity-80">Tap to reveal role</p>
          </div>
        )}
        
        {/* Stage 2: Full role revealed (smaller than original) */}
        {revealStage === 'full' && (
          <div className="text-center space-y-6">
            {/* Smaller role icon */}
            <div className="leading-none">
              {getRoleIcon(displayRole.type)}
            </div>
            
            {/* Smaller role text */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-wider">
                {displayRole.type}
              </h1>
              <h2 className="text-2xl font-semibold">
                {displayRole.team} TEAM
              </h2>
            </div>
            
            {/* Tap to hide */}
            <button
              onClick={handleEyeClick}
              className="text-lg opacity-80 hover:opacity-100 transition-opacity"
            >
              Tap to hide
            </button>
          </div>
        )}
      </div>
      
      {/* Back button at bottom - always visible */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="secondary"
          size="large"
          onClick={handleClose}
          className="bg-white text-black border-4 border-white px-6 py-3 text-lg font-bold"
        >
          ← BACK
        </Button>
      </div>
    </div>
  );
}