import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { GameManager } from '../services/GameManager';

const router = Router();
export const gameManager = new GameManager();

const CreateGameSchema = z.object({
  playerName: z.string().min(1).max(20),
  playerCount: z.number().int().min(6).max(14).refine(n => n % 2 === 0, {
    message: 'Player count must be even'
  })
});

router.post('/games/create', (req: Request, res: Response) => {
  try {
    const data = CreateGameSchema.parse(req.body);
    const { game, playerId } = gameManager.createGame(
      data.playerName, 
      data.playerCount,
      '' // Socket ID will be set when they connect via WebSocket
    );
    
    res.json({ roomCode: game.roomCode, playerId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create game' });
    }
  }
});

router.get('/games/:roomCode/exists', (req: Request, res: Response) => {
  const { roomCode } = req.params;
  const game = gameManager.getGame(roomCode);
  
  if (game) {
    res.json({ 
      exists: true, 
      playerCount: Object.keys(game.players).length,
      maxPlayers: game.playerCount,
      phase: game.phase
    });
  } else {
    res.json({ exists: false });
  }
});

export { router as gameRouter };