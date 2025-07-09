import { Crown, Swords, Shield, DoorClosed, Hammer, UserX, Bell, Target, Trophy } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

// Add custom scrollbar styles
const scrollbarStyles = `
  .quick-reference-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .quick-reference-scrollbar::-webkit-scrollbar-track {
    background: rgba(107, 114, 128, 0.2);
    border-radius: 4px;
  }
  .quick-reference-scrollbar::-webkit-scrollbar-thumb {
    background: #d4af37;
    border-radius: 4px;
    border: 1px solid rgba(107, 114, 128, 0.3);
  }
  .quick-reference-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #c4a037;
  }
`;

interface QuickReferenceProps {
  isOpen: boolean;
  onClose: () => void;
}

const roleData = [
  {
    type: 'KING',
    icon: Crown,
    description: 'Stay alive! If identified by the enemy Assassin, your team loses.',
    team: 'Both'
  },
  {
    type: 'ASSASSIN',
    icon: Swords,
    description: 'Identify and publicly name the opposing King to win.',
    team: 'Both'
  },
  {
    type: 'GATEKEEPER',
    icon: DoorClosed,
    description: 'Send any player in your room to the other room (once per game).',
    team: 'Both'
  },
  {
    type: 'SWORDSMITH',
    icon: Hammer,
    description: 'Confirm when your Assassin visits you (8+ players).',
    team: 'Both'
  },
  {
    type: 'GUARD',
    icon: Shield,
    description: 'Protect your King by being in the same room during assassination.',
    team: 'Both'
  },
  {
    type: 'SPY',
    icon: UserX,
    description: 'Appear as a random opposing team member while gathering intel.',
    team: 'Both'
  },
  {
    type: 'SERVANT',
    icon: Bell,
    description: 'Know your King\'s identity from the start. Protect them!',
    team: 'Both'
  }
];

export default function QuickReference({ isOpen, onClose }: QuickReferenceProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Quick Reference"
        theme="medieval"
        size="large"
      >
      <div 
        className="space-y-6 max-h-96 overflow-y-auto pr-1 quick-reference-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d4af37 rgba(107, 114, 128, 0.2)'
        }}
      >
        {/* Game Overview Section - moved to top */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Game Overview</h3>
          <div className="space-y-3">
            <div className="p-3 bg-surface-dark bg-opacity-50 rounded-lg border border-medieval-stone-light">
              <h4 className="font-semibold text-white text-sm mb-1">Objective</h4>
              <p className="text-medieval-stone-light text-xs">Each team (Red and Blue) tries to assassinate the opposing team's King first.</p>
            </div>
            <div className="p-3 bg-surface-dark bg-opacity-50 rounded-lg border border-medieval-stone-light">
              <h4 className="font-semibold text-white text-sm mb-1">Setup</h4>
              <p className="text-medieval-stone-light text-xs">Players are secretly assigned roles and teams, and then are randomly assigned into two physical rooms.</p>
            </div>
            <div className="p-3 bg-surface-dark bg-opacity-50 rounded-lg border border-medieval-stone-light">
              <h4 className="font-semibold text-white text-sm mb-1">Gameplay</h4>
              <ul className="text-medieval-stone-light text-xs space-y-1">
                <li>• Discuss and elect leaders through the app</li>
                <li>• Leaders can send players between rooms (with cooldown timer)</li>
                <li>• Use special abilities (explained in the app)</li>
                <li>• Assassins must eliminate the enemy King</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Game Flow Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Game Flow</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-medieval-metal-gold rounded-full flex items-center justify-center text-surface-dark font-bold text-xs">1</div>
              <span className="text-medieval-stone-light">Role assignment & room separation</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-medieval-metal-gold rounded-full flex items-center justify-center text-surface-dark font-bold text-xs">2</div>
              <span className="text-medieval-stone-light">Discuss, deduce, and elect leaders</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-medieval-metal-gold rounded-full flex items-center justify-center text-surface-dark font-bold text-xs">3</div>
              <span className="text-medieval-stone-light">Use abilities and send players between rooms</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-medieval-metal-gold rounded-full flex items-center justify-center text-surface-dark font-bold text-xs">4</div>
              <span className="text-medieval-stone-light">Assassin attempts to eliminate enemy King</span>
            </div>
          </div>
        </div>

        {/* Victory Conditions Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Trophy size={20} className="text-medieval-metal-gold" />
            <span>Victory Conditions</span>
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-surface-dark bg-opacity-50 rounded-lg border border-medieval-stone-light">
              <div className="flex items-start space-x-3">
                <Target size={16} className="text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white text-sm">Assassination Victory</h4>
                  <p className="text-medieval-stone-light text-xs mt-1">
                    Successfully assassinate the opposing team's King
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-surface-dark bg-opacity-50 rounded-lg border border-medieval-stone-light">
              <div className="flex items-start space-x-3">
                <Target size={16} className="text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white text-sm">Failed Assassination</h4>
                  <p className="text-medieval-stone-light text-xs mt-1">
                    Assassin targets wrong person = their team loses
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-surface-dark bg-opacity-50 rounded-lg border border-medieval-stone-light">
              <div className="flex items-start space-x-3">
                <Shield size={16} className="text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white text-sm">Guard Protection</h4>
                  <p className="text-medieval-stone-light text-xs mt-1">
                    Guard in same room as King blocks assassination
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Crown size={20} className="text-medieval-metal-gold" />
            <span>Roles & Abilities</span>
          </h3>
          <div className="space-y-3">
            {roleData.map((role) => {
              const RoleIcon = role.icon;
              return (
                <div 
                  key={role.type}
                  className="flex items-start space-x-3 p-3 bg-surface-dark bg-opacity-50 rounded-lg border border-medieval-stone-light"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-light border border-medieval-stone-light flex items-center justify-center flex-shrink-0">
                    <RoleIcon size={16} className="text-medieval-metal-gold" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm">{role.type}</h4>
                    <p className="text-medieval-stone-light text-xs mt-1">{role.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      
      {/* Close Button - outside scrollable area */}
      <div className="mt-4 pt-4 border-t border-medieval-stone-light border-opacity-30">
        <Button
          variant="medieval-gold"
          size="large"
          fullWidth
          onClick={onClose}
          className="bg-opacity-90 hover:bg-opacity-100 transition-opacity text-white"
        >
          CLOSE
        </Button>
      </div>
    </Modal>
    </>
  );
}