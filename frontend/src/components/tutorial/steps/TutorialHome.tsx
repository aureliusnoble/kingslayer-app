import { BookOpen } from 'lucide-react';
import Button from '../../common/Button';

interface TutorialHomeProps {
  onStartTutorial: () => void;
  onQuickReference: () => void;
}

export default function TutorialHome({ onStartTutorial, onQuickReference }: TutorialHomeProps) {
  return (
    <div className="space-y-12 text-center">
      {/* Welcome Message */}
      <div className="space-y-10">

        <div className="text-lg text-medieval-stone-light leading-relaxed space-y-3">
          <p>
            This is a quick social deduction game where you are split into two teams, and must have the opposing team's King assassinated. During the game you will be split into two rooms, where you can talk openly with each other.
          </p>
          <p>
            Within your room you can elect a leader, who will get to (periodically) send players to the other room. You can show your team or role to players using the app, and also use the app to activate special abilities.
          </p>
          <p className="text-medieval-metal-gold font-semibold">
            Now let's take a look at how that works.
          </p>
        </div>
      </div>


      {/* Action Buttons */}
      <div className="space-y-4">
        <Button
          variant="medieval-gold"
          size="large"
          fullWidth
          onClick={onStartTutorial}
          className="bg-opacity-90 hover:bg-opacity-100 transition-opacity text-white"
        >
          START TUTORIAL
        </Button>

        <Button
          variant="medieval-stone"
          size="medium"
          fullWidth
          onClick={onQuickReference}
          className="bg-opacity-90 hover:bg-opacity-100 transition-opacity flex items-center justify-center space-x-2"
        >
          <BookOpen size={18} />
          <span>QUICK REFERENCE</span>
        </Button>
      </div>
    </div>
  );
}