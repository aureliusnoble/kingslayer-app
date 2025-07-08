# Bug Fix Plan - Kingslayer Companion App

## Overview
This document outlines the step-by-step plan to fix four critical issues in the Kingslayer companion app. Each issue is broken down into small, methodical steps with specific testing procedures.

## Issue #1: Timer System - Room Kick Timer Countdown

### Current Problem
- Timer logic is inverted: kick button disabled when timer > 0, should be enabled when timer = 0
- Display shows "Room X Kick Timer" but doesn't indicate when kicks are available
- No clear visual indication when leader can kick vs. cooldown period

### Root Cause Analysis
- `GameManager.sendPlayer()` checks if timer > 0 and blocks kick (should allow kick when timer = 0)
- Frontend displays timer countdown but doesn't indicate kick availability
- Timer resets correctly to 120 seconds after use

### Fix Steps

#### Step 1.1: Fix Backend Timer Logic
**File**: `backend/src/services/GameManager.ts`
**Method**: `sendPlayer()`
**Changes**:
```typescript
// BEFORE (line 271):
if (game.timers[cooldownKey] && game.timers[cooldownKey]! > 0) return null;

// AFTER:
if (game.timers[cooldownKey] && game.timers[cooldownKey]! > 0) return null;
// Keep this logic - it's actually correct. The issue is elsewhere.
```

**Wait - Analysis shows the logic is correct. The real issue is timer initialization.**

#### Step 1.2: Fix Timer Initialization
**File**: `backend/src/services/GameManager.ts`
**Method**: `checkLeaderElection()`
**Changes**:
```typescript
// Ensure timers start at 0, not 120
if (roomIndex === 0) {
  game.timers.room0LeaderCooldown = 0; // Changed from 120
} else {
  game.timers.room1LeaderCooldown = 0; // Changed from 120
}
```

#### Step 1.3: Update Frontend Timer Display
**File**: `frontend/src/screens/GameScreen.tsx`
**Add kick availability indicator**:
```typescript
const canKick = myPlayer?.isLeader && (
  (currentRoom === 0 && (!gameState.timers.room0LeaderCooldown || gameState.timers.room0LeaderCooldown === 0)) ||
  (currentRoom === 1 && (!gameState.timers.room1LeaderCooldown || gameState.timers.room1LeaderCooldown === 0))
);

// Display:
{canKick ? (
  <div className="text-green-600 font-bold">✓ KICK AVAILABLE</div>
) : (
  <div className="text-orange-600">Kick cooldown: {timerValue}s</div>
)}
```

### Testing Plan 1
1. Start a game with 6+ players
2. Have someone become leader through pointing
3. Verify timer shows 0 seconds initially and "KICK AVAILABLE"
4. Use kick action
5. Verify timer resets to 120 seconds and shows cooldown
6. Wait for timer to reach 0 again
7. Verify "KICK AVAILABLE" appears again

## Issue #2: Leader Declaration and Display System

### Current Problem
- No manual "I AM THE LEADER" button - only automatic election through pointing
- Leader indication (crown) is too small and unclear
- No functional kick button connected to leader status

### Root Cause Analysis
- Current system only supports pointing-based majority election
- Leader UI components exist but lack clear visual emphasis
- Kick button logic not properly connected to leader status

### Fix Steps

#### Step 2.1: Add Manual Leader Declaration
**File**: `backend/src/services/GameManager.ts`
**Add new method**:
```typescript
declareLeader(playerId: string): GameState | null {
  const game = this.getGameByPlayerId(playerId);
  if (!game || game.phase !== 'playing') return null;

  const player = game.players[playerId];
  if (!player) return null;

  const roomIndex = player.currentRoom;
  const room = game.rooms[roomIndex];

  // Remove previous leader if any
  if (room.leaderId) {
    game.players[room.leaderId].isLeader = false;
  }

  // Set new leader
  room.leaderId = playerId;
  room.leaderElectedAt = Date.now();
  player.isLeader = true;

  // Set timer to 0 (can kick immediately)
  if (roomIndex === 0) {
    game.timers.room0LeaderCooldown = 0;
  } else {
    game.timers.room1LeaderCooldown = 0;
  }

  return game;
}
```

#### Step 2.2: Add Socket Event Handler
**File**: `backend/src/socket/index.ts`
**Add new event handler**:
```typescript
socket.on('declare_leader', () => {
  const playerId = socketToPlayer.get(socket.id);
  if (!playerId) return;

  const game = gameManager.declareLeader(playerId);
  if (game) {
    const player = game.players[playerId];
    io.to(game.roomCode).emit('leader_declared', { 
      roomIndex: player.currentRoom, 
      leaderId: playerId 
    });
    io.to(game.roomCode).emit('state_update', { gameState: game });
  }
});
```

#### Step 2.3: Add Frontend Socket Method
**File**: `frontend/src/services/socket.ts`
**Add method**:
```typescript
declareLeader(): void {
  this.socket?.emit('declare_leader');
}
```

#### Step 2.4: Enhance Leader UI in GameScreen
**File**: `frontend/src/screens/GameScreen.tsx`
**Add leader declaration button and enhanced display**:
```typescript
// Leader declaration button
{!amILeader() && (
  <Button
    variant="primary"
    onClick={() => socketService.declareLeader()}
    className="bg-yellow-500 text-black font-bold border-2 border-yellow-600"
  >
    👑 DECLARE MYSELF LEADER
  </Button>
)}

// Enhanced leader display
{amILeader() && (
  <div className="p-4 bg-yellow-100 border-4 border-yellow-500 rounded-lg text-center">
    <div className="text-4xl mb-2">👑</div>
    <div className="text-lg font-bold">YOU ARE THE LEADER</div>
    {canKick ? (
      <div className="text-green-600 font-bold mt-2">Ready to kick players</div>
    ) : (
      <div className="text-orange-600 mt-2">Kick cooldown: {timerValue}s</div>
    )}
  </div>
)}

// Enhanced player list leader indication
{playersInRoom.map(player => (
  <div key={player.id} className={`
    p-3 rounded-lg border-2 
    ${player.isLeader ? 'bg-yellow-100 border-yellow-500 border-4' : 'border-gray-300'}
  `}>
    <div className="flex items-center justify-between">
      <span className="font-medium">{player.name}</span>
      {player.isLeader && <span className="text-2xl">👑</span>}
    </div>
  </div>
))}
```

### Testing Plan 2
1. Start a game and reach playing phase
2. Click "DECLARE MYSELF LEADER" button
3. Verify prominent leader display appears with crown and status
4. Verify other players see leader indication in player list
5. Verify kick functionality becomes available immediately
6. Test leader declaration by multiple players (should override)

## Issue #3: Room Kick Notifications

### Current Problem
- RoomChangeModal exists but doesn't trigger when kicked by leader
- Backend doesn't emit proper `room_assignment` event for kicks
- No distinction between voluntary room change and being kicked

### Root Cause Analysis
- `GameManager.sendPlayer()` doesn't emit the required socket events
- Frontend expects `room_assignment` event to trigger modal
- Missing notification context (kicked vs. moved)

### Fix Steps

#### Step 3.1: Fix Backend Room Assignment Emission
**File**: `backend/src/socket/index.ts`
**Method**: `send_player` event handler
**Enhancement around line 294**:
```typescript
socket.on('send_player', (data: any) => {
  const playerId = socketToPlayer.get(socket.id);
  if (!playerId) return;

  const game = gameManager.sendPlayer(playerId, data.targetId);
  if (game) {
    const target = game.players[data.targetId];
    const leader = game.players[playerId];
    const fromRoom = target.currentRoom === 0 ? 1 : 0;
    
    // Notify everyone about the kick
    io.to(game.roomCode).emit('player_sent', { 
      playerId: data.targetId, 
      fromRoom, 
      toRoom: target.currentRoom,
      kickedBy: playerId,
      kickerName: leader.name
    });
    
    // Critical: Notify the kicked player specifically
    const targetSocket = io.sockets.sockets.get(target.socketId);
    if (targetSocket) {
      targetSocket.emit('room_assignment', { 
        room: target.currentRoom,
        wasKicked: true,
        kickedBy: leader.name,
        fromRoom: fromRoom
      });
    }
    
    io.to(game.roomCode).emit('state_update', { gameState: game });
  }
});
```

#### Step 3.2: Add Kick Context to Socket Service
**File**: `frontend/src/services/socket.ts`
**Enhance room_assignment handler**:
```typescript
this.socket.on('room_assignment', (data: { room: 0 | 1; wasKicked?: boolean; kickedBy?: string; fromRoom?: number }) => {
  const store = useGameStore.getState();
  
  if (data.wasKicked) {
    // Set kick notification data
    store.setKickNotification({
      wasKicked: true,
      kickedBy: data.kickedBy || 'Unknown',
      fromRoom: data.fromRoom || 0,
      toRoom: data.room
    });
  }
  
  store.setCurrentRoom(data.room);
  store.setRoomChangeRequired(true);
});
```

#### Step 3.3: Add Kick Notification State
**File**: `frontend/src/stores/gameStore.ts`
**Add state and methods**:
```typescript
interface GameStore {
  // ... existing properties
  kickNotification: {
    wasKicked: boolean;
    kickedBy: string;
    fromRoom: number;
    toRoom: number;
  } | null;
  
  // ... existing methods
  setKickNotification: (notification: typeof kickNotification | null) => void;
}

// In the store implementation:
const initialState = {
  // ... existing state
  kickNotification: null,
};

// Add to the store:
setKickNotification: (notification) => set({ kickNotification: notification }),
```

#### Step 3.4: Create Kick Notification Modal
**File**: `frontend/src/components/game/KickNotificationModal.tsx`
**New component**:
```typescript
import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface KickNotificationModalProps {
  isOpen: boolean;
  kickedBy: string;
  fromRoom: number;
  toRoom: number;
  onConfirm: () => void;
}

export default function KickNotificationModal({ 
  isOpen, 
  kickedBy, 
  fromRoom, 
  toRoom, 
  onConfirm 
}: KickNotificationModalProps) {
  return (
    <Modal isOpen={isOpen} title="You Were Kicked!" hideCloseButton>
      <div className="space-y-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        
        <div className="space-y-3">
          <p className="text-xl font-bold text-red-600">
            You have been kicked from Room {fromRoom === 0 ? 'A' : 'B'}!
          </p>
          
          <p className="text-lg">
            Kicked by: <span className="font-bold">{kickedBy}</span>
          </p>
          
          <p className="text-lg">
            You must now move to Room {toRoom === 0 ? 'A' : 'B'}
          </p>
        </div>
        
        <div className="p-4 bg-yellow-100 border-2 border-yellow-500 rounded-lg">
          <p className="text-sm text-yellow-800">
            Please physically move to your new room before continuing.
          </p>
        </div>
        
        <Button 
          variant="primary" 
          fullWidth 
          onClick={onConfirm}
          className="bg-red-600 hover:bg-red-700"
        >
          I'M IN MY NEW ROOM
        </Button>
      </div>
    </Modal>
  );
}
```

#### Step 3.5: Integrate Kick Modal in GameScreen
**File**: `frontend/src/screens/GameScreen.tsx`
**Add modal handling**:
```typescript
import KickNotificationModal from '../components/game/KickNotificationModal';

// In the component:
const { kickNotification, setKickNotification, setRoomChangeRequired } = useGameStore();

const handleKickConfirm = () => {
  if (kickNotification) {
    socketService.confirmRoom(kickNotification.toRoom);
    setKickNotification(null);
    setRoomChangeRequired(false);
  }
};

// In the JSX:
<KickNotificationModal
  isOpen={!!kickNotification}
  kickedBy={kickNotification?.kickedBy || ''}
  fromRoom={kickNotification?.fromRoom || 0}
  toRoom={kickNotification?.toRoom || 0}
  onConfirm={handleKickConfirm}
/>
```

### Testing Plan 3
1. Set up two players in same room with one as leader
2. Leader kicks the other player
3. Verify kicked player sees full-screen "You Were Kicked!" modal
4. Verify modal shows correct room information and kicker name
5. Verify modal blocks all other interactions
6. Click "I'M IN MY NEW ROOM" and verify modal dismisses
7. Verify game continues normally after confirmation

## Issue #4: Role Card Display - Team Background with Eye Toggle

### Current Problem
- Role cards show full role information immediately
- No eye toggle to hide/show role details
- Inconsistent display between role types
- Missing team-only background view

### Root Cause Analysis
- RoleRevealScreen shows complete role info by default
- GameScreen role cards also show full details
- No component for team-background-only display
- Eye toggle functionality not implemented

### Fix Steps

#### Step 4.1: Create Team Background Component
**File**: `frontend/src/components/game/TeamRoleCard.tsx`
**New component**:
```typescript
import React, { useState } from 'react';
import clsx from 'clsx';
import { Role } from '../../shared';

interface TeamRoleCardProps {
  role: Role;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function TeamRoleCard({ role, className = '', size = 'medium' }: TeamRoleCardProps) {
  const [showFullRole, setShowFullRole] = useState(false);
  
  const sizeClasses = {
    small: 'p-3 text-sm',
    medium: 'p-4 text-base', 
    large: 'p-6 text-lg'
  };
  
  const iconSizes = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl'
  };

  return (
    <div className={clsx(
      'rounded-lg border-4 relative',
      role.team === 'RED' ? 'bg-red-100 border-red-500' : 'bg-blue-100 border-blue-500',
      sizeClasses[size],
      className
    )}>
      {/* Eye toggle button */}
      <button
        onClick={() => setShowFullRole(!showFullRole)}
        className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
      >
        <span className={iconSizes[size]}>
          {showFullRole ? '👁️' : '👁️‍🗨️'}
        </span>
      </button>
      
      {showFullRole ? (
        // Full role display
        <div className="text-center pr-8">
          <div className={clsx('mb-2', iconSizes[size])}>
            {role.type === 'KING' && '👑'}
            {role.type === 'ASSASSIN' && '🗡️'}
            {role.type === 'GATEKEEPER' && '🚪'}
            {role.type === 'SWORDSMITH' && '⚔️'}
            {role.type === 'GUARD' && '🛡️'}
            {role.type === 'SPY' && '🕵️'}
            {role.type === 'SERVANT' && '🤝'}
          </div>
          <div className="font-bold">{role.type}</div>
          <div className="text-sm opacity-75">Team {role.team}</div>
        </div>
      ) : (
        // Team background only
        <div className="text-center pr-8">
          <div className={clsx(
            'font-bold',
            role.team === 'RED' ? 'text-red-700' : 'text-blue-700'
          )}>
            TEAM {role.team}
          </div>
          <div className="text-xs opacity-60 mt-1">
            Click eye to reveal role
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Step 4.2: Update GameScreen Role Display
**File**: `frontend/src/screens/GameScreen.tsx`
**Replace existing role display**:
```typescript
import TeamRoleCard from '../components/game/TeamRoleCard';

// Replace existing role display with:
{myRole && (
  <div className="mb-4">
    <TeamRoleCard role={myRole} size="small" />
  </div>
)}
```

#### Step 4.3: Update RoleRevealScreen Default Display
**File**: `frontend/src/screens/RoleRevealScreen.tsx`
**Replace large role display sections**:
```typescript
// For normal roles (around line 230), replace with:
<TeamRoleCard role={myRole} size="large" className="mb-4" />

// For SPY roles (around line 65), update to show team background first:
<div className="space-y-4">
  <div className="text-sm font-medium text-center mb-2">YOUR REAL ROLE:</div>
  <TeamRoleCard role={myRole} size="medium" className="mb-4" />
  
  <div className="text-sm font-medium text-center mb-2">YOU APPEAR AS:</div>
  <TeamRoleCard role={myRole.fakeRole} size="medium" />
</div>

// For SERVANT roles (around line 146), replace with:
<TeamRoleCard role={myRole} size="large" className="mb-4" />
```

#### Step 4.4: Add Eye Toggle State Management
**File**: `frontend/src/stores/gameStore.ts`
**Add role reveal state**:
```typescript
interface GameStore {
  // ... existing properties
  roleRevealed: boolean;
  
  // ... existing methods
  setRoleRevealed: (revealed: boolean) => void;
}

// In implementation:
const initialState = {
  // ... existing state
  roleRevealed: false,
};

// Add method:
setRoleRevealed: (revealed) => set({ roleRevealed: revealed }),
```

### Testing Plan 4
1. Complete role assignment phase
2. Verify role cards show only team background by default
3. Click eye icon and verify full role details appear
4. Click eye icon again and verify role details hide
5. Test with different role types (King, Assassin, Spy, etc.)
6. Verify Spy shows both real and fake role with separate eye toggles
7. Test role display in both RoleRevealScreen and GameScreen
8. Verify eye icon state persists during screen navigation

## Integration Testing Plan

### Full Game Flow Test
1. Create game with 6 players
2. All players join and ready up
3. Start game and assign roles
4. Verify role cards show team background only
5. Move to playing phase
6. Test leader declaration functionality
7. Verify timer system shows correct cooldown
8. Test room kick with notification modal
9. Verify kicked player sees full-screen notification
10. Continue game and verify all systems work together

### Cross-Browser Testing
- Test on Chrome, Firefox, Safari mobile
- Verify modal displays correctly on mobile devices
- Test touch interactions for eye toggle and leader buttons
- Verify responsive design for all new components

### Edge Case Testing
- Test with minimum (6) and maximum (14) players
- Test rapid leader declaration changes
- Test multiple simultaneous kick attempts
- Test network disconnection during kick process
- Test role reveal with different screen orientations

## Implementation Order

1. **Issue #1 (Timer System)** - Foundation for kick functionality
2. **Issue #2 (Leader Declaration)** - Required for kick testing
3. **Issue #3 (Kick Notifications)** - Builds on timer and leader systems
4. **Issue #4 (Role Cards)** - Independent improvement, can be done in parallel

## Risk Assessment

### Low Risk
- Role card eye toggle (isolated component change)
- Leader declaration button (additive feature)

### Medium Risk  
- Timer logic changes (affects existing functionality)
- Kick notification modal (new socket events)

### High Risk
- Backend timer initialization changes (could break existing games)

## Rollback Plan

Each change should be implemented with feature flags or the ability to quickly revert:
- Keep original timer logic commented out until new logic is tested
- Implement role card toggle as optional prop until fully tested
- Add kick notifications as additive feature that can be disabled

## Success Criteria

1. ✅ Room timers count down from 120 seconds after leader election
2. ✅ Leaders can kick players when timer reaches 0
3. ✅ Manual leader declaration works alongside pointing system
4. ✅ Kicked players see immediate full-screen notification
5. ✅ Role cards show team background by default with working eye toggle
6. ✅ All existing functionality remains intact
7. ✅ No performance degradation or memory leaks
8. ✅ Cross-platform compatibility maintained