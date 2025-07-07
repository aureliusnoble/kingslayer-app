# Kingslayer Companion App

A real-time companion app for the Kingslayer social deduction board game. Built with React, Node.js, and Socket.io.

## Features

- Real-time multiplayer game management
- Role assignment and revelation
- Room-based player separation
- Leader election system with timers
- Special ability tracking
- Mobile-first responsive design

## Prerequisites

- Node.js 18+ and npm
- Git

## Local Development Setup

1. **Clone the repository** (or navigate to the project folder)
```bash
cd kingslayer-app
```

2. **Install dependencies**
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd shared && npm install && cd ..
```

3. **Build the shared types**
```bash
cd shared && npm run build && cd ..
```

4. **Set up environment variables**

Backend (.env in /backend):
```
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

Frontend (.env in /frontend):
```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

5. **Run the development servers**

From the root directory:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3000
- Frontend dev server on http://localhost:5173

## Testing the Game

1. Open http://localhost:5173 in your browser
2. Create a game with one player
3. Open additional browser tabs/windows for other players
4. Join the game using the room code
5. Test the complete game flow

## Project Structure

```
kingslayer-app/
├── backend/          # Node.js/Express/Socket.io server
├── frontend/         # React/Vite client application  
├── shared/           # Shared TypeScript types
└── package.json      # Root package with workspace config
```

## Game Flow

1. **Create/Join**: Host creates game, players join with room code
2. **Lobby**: Players ready up, host starts when all ready
3. **Role Reveal**: Players see their secret roles
4. **Room Assignment**: Players move to physical rooms
5. **Main Game**: Real-time gameplay with abilities
6. **End Game**: Victory/defeat screen with results

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions on deploying to free hosting services.