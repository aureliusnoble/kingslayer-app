import { Check, Play, Users, BookOpen, RotateCcw, Trophy } from 'lucide-react';
import Button from '../../common/Button';

interface TutorialCompleteProps {
  onCreateGame: () => void;
  onJoinGame: () => void;
  onQuickReference: () => void;
  onReplayTutorial: () => void;
}

export default function TutorialComplete({
  onCreateGame,
  onJoinGame,
  onQuickReference,
  onReplayTutorial
}: TutorialCompleteProps) {
  return (
    <div className="space-y-8 text-center">
      {/* Celebration Header */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <Trophy size={64} className="text-medieval-metal-gold" />
        </div>
        <h1 className="text-3xl font-bold text-medieval-metal-gold font-display tracking-wider">
          TUTORIAL COMPLETE!
        </h1>
        <p className="text-lg text-medieval-stone-light">
          You're now ready to play Kingslayer!
        </p>
      </div>

      {/* Learning Summary */}
      <div className="bg-surface-dark bg-opacity-50 p-6 rounded-lg border border-medieval-stone-light">
        <h3 className="text-lg font-semibold text-white mb-4">You've learned:</h3>
        <div className="space-y-3 text-left">
          <div className="flex items-center space-x-3">
            <Check size={16} className="text-green-400 flex-shrink-0" />
            <span className="text-medieval-stone-light">Role system & team assignments</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check size={16} className="text-green-400 flex-shrink-0" />
            <span className="text-medieval-stone-light">Physical room separation</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check size={16} className="text-green-400 flex-shrink-0" />
            <span className="text-medieval-stone-light">Game interface navigation</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check size={16} className="text-green-400 flex-shrink-0" />
            <span className="text-medieval-stone-light">Leadership mechanics</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check size={16} className="text-green-400 flex-shrink-0" />
            <span className="text-medieval-stone-light">Abilities & actions</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check size={16} className="text-green-400 flex-shrink-0" />
            <span className="text-medieval-stone-light">Victory conditions</span>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="space-y-4">
        <p className="text-white font-semibold">Ready to play?</p>
        
        <div className="space-y-3">
          <Button
            variant="medieval-red"
            size="large"
            fullWidth
            onClick={onCreateGame}
            className="bg-opacity-90 hover:bg-opacity-100 transition-opacity flex items-center justify-center space-x-2"
          >
            <Play size={18} />
            <span>CREATE GAME</span>
          </Button>

          <Button
            variant="medieval-blue"
            size="large"
            fullWidth
            onClick={onJoinGame}
            className="bg-opacity-90 hover:bg-opacity-100 transition-opacity flex items-center justify-center space-x-2"
          >
            <Users size={18} />
            <span>JOIN GAME</span>
          </Button>
        </div>
      </div>

      {/* Additional Options */}
      <div className="pt-4 border-t border-medieval-stone-light border-opacity-30">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="medieval-stone"
            size="medium"
            onClick={onReplayTutorial}
            className="bg-opacity-90 hover:bg-opacity-100 transition-opacity flex items-center justify-center space-x-2"
          >
            <RotateCcw size={16} />
            <span>Replay</span>
          </Button>

          <Button
            variant="medieval-stone"
            size="medium"
            onClick={onQuickReference}
            className="bg-opacity-90 hover:bg-opacity-100 transition-opacity flex items-center justify-center space-x-2"
          >
            <BookOpen size={16} />
            <span>Reference</span>
          </Button>
        </div>
      </div>
    </div>
  );
}