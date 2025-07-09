import { useState } from 'react';
import { Crown, Swords, Shield, DoorClosed, Hammer, UserX, Bell, Eye } from 'lucide-react';
import Button from '../../common/Button';
import clsx from 'clsx';

const roleIcons = {
  KING: Crown,
  ASSASSIN: Swords,
  GATEKEEPER: DoorClosed,
  SWORDSMITH: Hammer,
  GUARD: Shield,
  SPY: UserX,
  SERVANT: Bell
};

interface TutorialRoleSystemProps {
  onContinue: () => void;
}

export default function TutorialRoleSystem({ onContinue }: TutorialRoleSystemProps) {
  const [roleRevealed, setRoleRevealed] = useState(false);
  const [showRoleDetails, setShowRoleDetails] = useState(false);

  const demoRole = {
    type: 'ASSASSIN' as const,
    team: 'RED' as const,
    description: 'Identify and publicly name the opposing King to win the game!'
  };

  const RoleIcon = roleIcons[demoRole.type];

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-white font-display">
          Roles & Teams
        </h2>
        <p className="text-medieval-stone-light leading-relaxed">
          Every player gets a <strong className="text-white">SECRET ROLE</strong> and 
          a <strong className="text-white">TEAM</strong> (Red or Blue).
        </p>
      </div>

      {/* Interactive Role Card */}
      <div className="flex flex-col items-center space-y-4">
        {!roleRevealed ? (
          <div className="relative">
            <div className="w-48 h-32 bg-surface-dark border-2 border-medieval-stone-light rounded-lg flex items-center justify-center cursor-pointer hover:bg-surface-medium transition-colors"
                 onClick={() => setRoleRevealed(true)}>
              <div className="text-center">
                <Eye size={32} className="text-medieval-stone-light mx-auto mb-2" />
                <p className="text-medieval-stone-light font-semibold">TAP TO REVEAL</p>
                <p className="text-medieval-stone-light text-sm">YOUR ROLE</p>
              </div>
            </div>
          </div>
        ) : (
          <div className={clsx(
            'relative p-6 rounded-lg w-48 text-center transition-all duration-500 transform',
            'animate-in zoom-in-95 fade-in duration-300',
            demoRole.team === 'RED' ? 'role-card-medieval-red' : 'role-card-medieval-blue'
          )}>
            {/* Role Icon */}
            <div className={clsx(
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
              'bg-surface-light border-2',
              demoRole.team === 'RED' ? 'border-red-highlight' : 'border-blue-highlight'
            )}>
              <RoleIcon 
                size={32} 
                className={clsx(
                  demoRole.team === 'RED' ? 'text-red-highlight' : 'text-blue-highlight'
                )} 
              />
            </div>
            
            {/* Role Name */}
            <h3 className="text-xl font-bold text-white font-display mb-2">
              {demoRole.type}
            </h3>
            
            {/* Team Indicator */}
            <div className={clsx(
              'px-3 py-1 rounded-full text-sm font-semibold mx-auto inline-block',
              demoRole.team === 'RED' 
                ? 'bg-red-primary text-white' 
                : 'bg-blue-primary text-white'
            )}>
              Team: {demoRole.team}
            </div>
          </div>
        )}

        {/* Role Details */}
        {roleRevealed && (
          <div className="space-y-4 w-full animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="bg-surface-dark bg-opacity-50 p-4 rounded-lg border border-medieval-stone-light">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-medieval-metal-gold rounded-full"></div>
                <span className="text-white font-semibold">Important:</span>
              </div>
              <p className="text-medieval-stone-light text-sm">
                This thick border shows your team color - others can see it from the edge of your phone!
              </p>
            </div>

            <Button
              variant="medieval-stone"
              size="medium"
              fullWidth
              onClick={() => setShowRoleDetails(!showRoleDetails)}
              className="bg-opacity-90 hover:bg-opacity-100 transition-opacity"
            >
              {showRoleDetails ? 'Hide' : 'Show'} Role Details
            </Button>

            {showRoleDetails && (
              <div className="bg-surface-dark bg-opacity-50 p-4 rounded-lg border border-medieval-stone-light animate-in slide-in-from-bottom-2 fade-in duration-200">
                <p className="text-white font-medium mb-2">Assassin Ability:</p>
                <p className="text-medieval-stone-light text-sm">
                  {demoRole.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Continue Button */}
      {roleRevealed && (
        <div className="pt-4 animate-in slide-in-from-bottom-2 fade-in duration-500">
          <Button
            variant="medieval-gold"
            size="large"
            fullWidth
            onClick={onContinue}
            className="bg-opacity-90 hover:bg-opacity-100 transition-opacity"
          >
            CONTINUE
          </Button>
        </div>
      )}
    </div>
  );
}