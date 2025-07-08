# Kingslayer Companion App - Implementation Plan

## Executive Summary

This document outlines the comprehensive plan to complete the Kingslayer companion app implementation. The app is a real-time social deduction board game companion with React frontend, Node.js backend, and Socket.io for real-time communication.

## Current Status Overview

---

---

## ✅ ISSUE #3: LEADER DECLARATION SYSTEM - COMPLETED

### Problem Solved ✅
**Issue**: No manual leader declaration and unclear leader indication

**Implementation Completed**:
- ✅ **Backend Method**: Added `declareLeader()` method to GameManager
- ✅ **Socket Event**: Added `declare_leader` event handler with proper state sync
- ✅ **Frontend Method**: Added `declareLeader()` method to socketService
- ✅ **Enhanced UI**: Prominent leader display with large crown, yellow border, clear "YOU ARE THE LEADER" text
- ✅ **Declaration Button**: "👑 DECLARE MYSELF LEADER" button for non-leaders
- ✅ **State Synchronization**: Real-time updates across all players via socket events
- ✅ **Bug Fixes**: Fixed variable reference errors and null safety issues

**Files Modified**:
- ✅ `backend/src/services/GameManager.ts` - Added declareLeader() method
- ✅ `backend/src/socket/index.ts` - Added declare_leader event handler
- ✅ `frontend/src/services/socket.ts` - Added declareLeader() method
- ✅ `frontend/src/screens/GameScreen.tsx` - Enhanced leader UI and declaration button
- ✅ `frontend/src/components/game/PlayerList.tsx` - Enhanced kick buttons with timer integration

**Test Results**: ✅ All backend tests passing, UI working without errors, leader declaration functional

---

## 🚨 REMAINING CRITICAL ISSUES

### Issue #4: Kick System & Room Change Notifications ❌  
**Problem**: Kick buttons not working + missing full-screen kick notifications
- **Current**: KICK buttons appear but don't function, no room change modal
- **Required**: Working kick functionality + blocking full-screen notification for kicked players

### Issue #5: Role Card Display Wrong ❌
**Problem**: Shows full role immediately instead of team background + eye toggle
- **Current**: Full role card with all details visible
- **Required**: Team background by default, eye icon to reveal role details

---

## 🛠️ DETAILED IMPLEMENTATION PLAN - NEXT PRIORITIES

### Issue #2: Fix Role Reveal Ready State
**Priority**: HIGH - Prevents proper game flow

**Implementation Steps**:
1. **Add Backend Handler**: Create `player_role_ready` socket event handler (already exists - verify it works correctly)
2. **Fix Frontend**: Update `RoleRevealScreen.tsx` to emit socket event instead of just local state
3. **Add State Sync**: Ensure all players must be role ready before advancing

### Issue #3: Leader Declaration System  
**Priority**: HIGH - Core gameplay mechanic

**Implementation Steps**:
1. **Backend Method**: Add `declareLeader()` method to GameManager
2. **Socket Event**: Add `declare_leader` event handler
3. **Frontend UI**: Add "I AM THE LEADER" button and enhanced leader display
4. **Kick Buttons**: Show kick buttons for leaders when timer = 0

### Issue #4: Room Kick Notifications
**Priority**: MEDIUM - UX improvement

**Implementation Steps**:
1. **Backend Events**: Enhance `send_player` handler to emit proper `room_assignment` events
2. **Frontend Modal**: Create `KickNotificationModal` component for full-screen notifications
3. **State Management**: Add kick notification state to game store

### Issue #5: Role Card Display
**Priority**: LOW - UX improvement

**Implementation Steps**:
1. **Team Card Component**: Create `TeamRoleCard` with eye toggle functionality
2. **Update Screens**: Replace role displays in `RoleRevealScreen` and `GameScreen`
3. **Eye Toggle State**: Implement show/hide role details functionality

---

## IMPLEMENTATION PRIORITY ORDER

### Immediate (Next 2-4 hours):
1. **Issue #2: Role Reveal Ready State** - Fix game flow progression
2. **Issue #3: Leader Declaration System** - Add core gameplay mechanic
3. **Issue #4: Room Kick Notifications** - Complete kick functionality

### Short Term (Next 4-8 hours):
4. **Issue #5: Role Card Display** - Improve user experience
5. **Integration Testing** - End-to-end game flow testing

### Testing Strategy:
- Fix one issue at a time
- Test each fix immediately with comprehensive test scripts
- Ensure no regressions from previous fixes
- Focus on core gameplay functionality first

---

## LONG-TERM ROADMAP



### Phase 2: Enhanced UX and Polish (Future)
- Full-screen role card display
- Better error handling and loading states
- Performance optimizations
- Accessibility improvements

---

## SUCCESS CRITERIA

### Current Functional Requirements
- ✅ Games can be created and joined successfully
- ✅ All player counts (6-14) work correctly  
- ✅ Role assignments work for all roles
- ✅ Complete navigation works (create → lobby → role reveal → game)
- ✅ Timer system works correctly (2min countdown from game start)
- ❌ Role reveal ready state works properly
- ❌ Leader declaration system functions
- ❌ Room kick notifications work
- ❌ Role card display with team background/eye toggle

### Technical Requirements Status
- ✅ Real-time synchronization works reliably
- ✅ Frontend state management is predictable  
- ✅ Socket connections are resilient
- ✅ Navigation flow is bug-free
- ✅ Timer system is correctly implemented
- ✅ Development debugging is comprehensive

---

## NEXT STEPS

1. **Start with Issue #2** - Fix role reveal ready state bug (highest impact)
2. **Continue with Issue #3** - Implement leader declaration system
3. **Test thoroughly** - Ensure each fix works before moving to next
4. **Document changes** - Update this plan as issues are resolved

The app now has a solid foundation with working navigation, timer system, and real-time synchronization. The remaining issues are focused on completing core gameplay mechanics and improving user experience.