export interface TutorialPlayer {
  id: string;
  name: string;
  role: {
    type: 'KING' | 'ASSASSIN' | 'GATEKEEPER' | 'SWORDSMITH' | 'GUARD' | 'SPY' | 'SERVANT';
    team: 'RED' | 'BLUE';
    fakeRole?: {
      type: 'KING' | 'ASSASSIN' | 'GATEKEEPER' | 'SWORDSMITH' | 'GUARD' | 'SPY' | 'SERVANT';
      team: 'RED' | 'BLUE';
    };
  };
  currentRoom: 0 | 1;
  isLeader: boolean;
  isHost?: boolean;
  hasUsedAbility?: boolean;
}

export interface TutorialGameState {
  phase: 'lobby' | 'role-reveal' | 'playing' | 'ended';
  roomCode: string;
  players: { [id: string]: TutorialPlayer };
  playerCount: number;
  servantInfo?: { [playerId: string]: string };
  timers: {
    room0: number | null;
    room1: number | null;
  };
}

// Mock players for tutorial scenarios
export const tutorialPlayers: TutorialPlayer[] = [
  {
    id: 'player1',
    name: 'Alex',
    role: { type: 'ASSASSIN', team: 'RED' },
    currentRoom: 0,
    isLeader: false,
    isHost: false
  },
  {
    id: 'player2',
    name: 'Bailey',
    role: { type: 'GUARD', team: 'BLUE' },
    currentRoom: 0,
    isLeader: true,
    isHost: false
  },
  {
    id: 'player3',
    name: 'Charlie',
    role: { type: 'KING', team: 'RED' },
    currentRoom: 1,
    isLeader: false,
    isHost: false
  },
  {
    id: 'player4',
    name: 'Dana',
    role: { type: 'GUARD', team: 'BLUE' },
    currentRoom: 1,
    isLeader: false,
    isHost: true
  },
  {
    id: 'player5',
    name: 'Ellis',
    role: { type: 'GATEKEEPER', team: 'RED' },
    currentRoom: 0,
    isLeader: false,
    isHost: false
  },
  {
    id: 'player6',
    name: 'You',
    role: { type: 'ASSASSIN', team: 'RED' },
    currentRoom: 0,
    isLeader: false,
    isHost: false
  }
];

// Different tutorial scenarios
export const tutorialGameStates = {
  // Role reveal scenario - showing an ASSASSIN role
  roleReveal: {
    phase: 'role-reveal' as const,
    roomCode: 'DEMO',
    players: {
      'you': {
        id: 'you',
        name: 'You',
        role: { type: 'ASSASSIN' as const, team: 'RED' as const },
        currentRoom: 0 as const,
        isLeader: false,
            isHost: false
      }
    },
    playerCount: 1,
    timers: { room0: null, room1: null }
  },

  // Game start scenario - showing main interface
  gameStart: {
    phase: 'playing' as const,
    roomCode: 'DEMO',
    players: {
      'you': {
        id: 'you',
        name: 'You',
        role: { type: 'ASSASSIN' as const, team: 'RED' as const },
        currentRoom: 0 as const,
        isLeader: false,
            isHost: false
      },
      'bailey': {
        id: 'bailey',
        name: 'Bailey',
        role: { type: 'GUARD' as const, team: 'BLUE' as const },
        currentRoom: 0 as const,
        isLeader: true,
        isHost: false
      },
      'charlie': {
        id: 'charlie',
        name: 'Charlie',
        role: { type: 'KING' as const, team: 'RED' as const },
        currentRoom: 1 as const,
        isLeader: false,
            isHost: false
      },
      'dana': {
        id: 'dana',
        name: 'Dana',
        role: { type: 'GUARD' as const, team: 'BLUE' as const },
        currentRoom: 1 as const,
        isLeader: false,
        isHost: true
      }
    },
    playerCount: 4,
    timers: { room0: 90, room1: 45 }
  },

  // Leadership scenario - showing election in progress
  leadership: {
    phase: 'playing' as const,
    roomCode: 'DEMO',
    players: {
      'you': {
        id: 'you',
        name: 'You',
        role: { type: 'GUARD' as const, team: 'BLUE' as const },
        currentRoom: 0 as const,
        isLeader: true,
        isHost: false
      },
      'alex': {
        id: 'alex',
        name: 'Alex',
        role: { type: 'ASSASSIN' as const, team: 'RED' as const },
        currentRoom: 0 as const,
        isLeader: false,
            isHost: false
      },
      'bailey': {
        id: 'bailey',
        name: 'Bailey',
        role: { type: 'GATEKEEPER' as const, team: 'BLUE' as const },
        currentRoom: 0 as const,
        isLeader: false,
        isHost: false
      },
      'charlie': {
        id: 'charlie',
        name: 'Charlie',
        role: { type: 'KING' as const, team: 'RED' as const },
        currentRoom: 1 as const,
        isLeader: false,
            isHost: false
      }
    },
    playerCount: 4,
    timers: { room0: 0, room1: 120 }
  },

  // Abilities scenario - showing role with abilities
  abilities: {
    phase: 'playing' as const,
    roomCode: 'DEMO',
    players: {
      'you': {
        id: 'you',
        name: 'You',
        role: { type: 'GATEKEEPER' as const, team: 'RED' as const },
        currentRoom: 0 as const,
        isLeader: true,
            isHost: false,
        hasUsedAbility: false
      },
      'alex': {
        id: 'alex',
        name: 'Alex',
        role: { type: 'ASSASSIN' as const, team: 'BLUE' as const },
        currentRoom: 0 as const,
        isLeader: false,
        isHost: false
      },
      'bailey': {
        id: 'bailey',
        name: 'Bailey',
        role: { type: 'GUARD' as const, team: 'BLUE' as const },
        currentRoom: 0 as const,
        isLeader: false,
        isHost: false
      }
    },
    playerCount: 3,
    timers: { room0: 0, room1: 75 }
  },

  // Spy scenario - showing spy role reveal
  spyReveal: {
    phase: 'role-reveal' as const,
    roomCode: 'DEMO',
    players: {
      'you': {
        id: 'you',
        name: 'You',
        role: { 
          type: 'SPY' as const, 
          team: 'RED' as const,
          fakeRole: { type: 'GUARD' as const, team: 'BLUE' as const }
        },
        currentRoom: 0 as const,
        isLeader: false,
            isHost: false
      }
    },
    playerCount: 1,
    timers: { room0: null, room1: null }
  },

  // Servant scenario - showing servant role reveal
  servantReveal: {
    phase: 'role-reveal' as const,
    roomCode: 'DEMO',
    players: {
      'you': {
        id: 'you',
        name: 'You',
        role: { type: 'SERVANT' as const, team: 'BLUE' as const },
        currentRoom: 0 as const,
        isLeader: false,
            isHost: false
      },
      'charlie': {
        id: 'charlie',
        name: 'Charlie',
        role: { type: 'KING' as const, team: 'BLUE' as const },
        currentRoom: 1 as const,
        isLeader: false,
            isHost: false
      }
    },
    playerCount: 2,
    servantInfo: { 'you': 'charlie' },
    timers: { room0: null, room1: null }
  }
};

// Helper function to get mock data for specific tutorial step
export const getTutorialDataForStep = (step: string) => {
  switch (step) {
    case 'roleReveal':
      return tutorialGameStates.roleReveal;
    case 'gameStart':
      return tutorialGameStates.gameStart;
    case 'leadership':
      return tutorialGameStates.leadership;
    case 'abilities':
      return tutorialGameStates.abilities;
    case 'spyReveal':
      return tutorialGameStates.spyReveal;
    case 'servantReveal':
      return tutorialGameStates.servantReveal;
    default:
      return tutorialGameStates.gameStart;
  }
};

// Helper function to get current player for tutorial
export const getTutorialCurrentPlayer = (step: string) => {
  const gameState = getTutorialDataForStep(step);
  return gameState.players['you'];
};

// Helper function to get players in current room for tutorial
export const getTutorialPlayersInRoom = (step: string, room: number) => {
  const gameState = getTutorialDataForStep(step);
  return Object.values(gameState.players).filter(player => player.currentRoom === room);
};