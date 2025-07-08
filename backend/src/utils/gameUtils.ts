import { v4 as uuidv4 } from 'uuid';
import { RoleType, Team, Role } from '../shared';

export function generateRoomCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

export function generatePlayerId(): string {
  return uuidv4();
}

export function distributeRoles(playerCount: number): Role[] {
  const roles: Role[] = [];
  
  // Base roles (6 players)
  const baseRoles: RoleType[] = ['KING', 'ASSASSIN', 'GATEKEEPER'];
  
  // Add base roles for each team
  for (const roleType of baseRoles) {
    roles.push({ type: roleType, team: 'RED' });
    roles.push({ type: roleType, team: 'BLUE' });
  }
  
  // Add additional roles based on player count
  if (playerCount >= 8) {
    roles.push({ type: 'SWORDSMITH', team: 'RED' });
    roles.push({ type: 'SWORDSMITH', team: 'BLUE' });
  }
  
  if (playerCount >= 10) {
    // Spies need fake roles
    const fakeRoles = generateSpyFakeRoles();
    roles.push({ 
      type: 'SPY', 
      team: 'RED',
      fakeRole: fakeRoles.blue
    });
    roles.push({ 
      type: 'SPY', 
      team: 'BLUE',
      fakeRole: fakeRoles.red
    });
  }
  
  if (playerCount >= 12) {
    roles.push({ type: 'GUARD', team: 'RED' });
    roles.push({ type: 'GUARD', team: 'BLUE' });
  }
  
  if (playerCount >= 14) {
    roles.push({ type: 'SERVANT', team: 'RED' });
    roles.push({ type: 'SERVANT', team: 'BLUE' });
  }
  
  // Shuffle roles
  return shuffleArray(roles);
}

function generateSpyFakeRoles(): { red: { type: RoleType; team: Team }, blue: { type: RoleType; team: Team } } {
  // Possible fake roles for spies (exclude King and Spy)
  const possibleRoles: RoleType[] = ['ASSASSIN', 'GATEKEEPER', 'SWORDSMITH', 'GUARD', 'SERVANT'];
  const randomRole = possibleRoles[Math.floor(Math.random() * possibleRoles.length)];
  
  return {
    red: { type: randomRole, team: 'RED' },
    blue: { type: randomRole, team: 'BLUE' }
  };
}

export function assignRooms(playerIds: string[]): { room0: string[], room1: string[] } {
  const shuffled = shuffleArray([...playerIds]);
  const midpoint = Math.floor(shuffled.length / 2);
  
  return {
    room0: shuffled.slice(0, midpoint),
    room1: shuffled.slice(midpoint)
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}