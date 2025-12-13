// packages/cli/src/headless.ts
import type { CaptureRule, Damier, MoveRule } from 'dam-dam-language';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Bot } from './scripts/Bot.js';
import { Game } from './scripts/game.js';

/**
 * Seeded Random Number Generator for reproducibility
 * Uses Linear Congruential Generator (LCG) algorithm
 */
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

/**
 * SeededBot - Bot avec random reproductible
 * Réutilise les méthodes greedy et heuristic de Bot.ts
 */
class SeededBot extends Bot {
  private seededRandom: SeededRandom;

  constructor(game: Game, playerId: number, type: string, seed: number) {
    super(game, playerId, type);
    this.seededRandom = new SeededRandom(seed);
  }

  override makeMove(): any | null {
    if (this.game.currentPlayer !== this.playerId || this.game.gameOver) {
      return null;
    }

    const legalMoves = this.game.getLegalMoves();
    if (legalMoves.length === 0) {
      return null;
    }

    let selectedMove: any;

    switch (this.type) {
      case 'random':
        const randomIndex = this.seededRandom.nextInt(legalMoves.length);
        selectedMove = legalMoves[randomIndex];
        break;
      case 'greedy':
        selectedMove = (this as any).selectGreedyMove(legalMoves);
        break;
      case 'heuristic':
        selectedMove = (this as any).selectHeuristicMove(legalMoves);
        break;
      default:
        selectedMove = legalMoves[0];
    }

    if (selectedMove) {
        (selectedMove as any).diceRoll = (this.game as any).diceResult ?? null;
    }
    const success = this.game.executeMove(selectedMove);
    if (success) {
      return selectedMove;
    }

    return null;
  }
}

interface LLMResponse {
  success: boolean;
  piece_id: string;
  target: { row: number; col: number };
  reasoning: string;
  cost?: string;
  tokens_used?: number;
  error?: string;
}

/**
 * Appelle le LLM backend exactement comme UI.ts
 */
async function getLLMMove(game: Game, backendUrl: string, turn: number): Promise<any | null> {
  const legalMoves = game.getLegalMoves();
  if (legalMoves.length === 0) {
    return null;
  }

  // Collect game state - MÊME FORMAT que UI.ts
  const gameState = {
    board_size: game.boardSize,
    direction: game.direction,
    current_player: game.currentPlayer,
    mandatory_capture: game.isCaptureMandatory,
    pieces: Array.from(game.pieces.values()).map(p => ({
      id: p.id,
      player: p.player,
      row: p.row,
      col: p.col,
      isQueen: p.isQueen,
      color: p.color,
      name: p.name
    })),
    legal_moves: legalMoves.map(m => ({
      from: { row: m.from.row, col: m.from.col },
      to: { row: m.to.row, col: m.to.col },
      capturedIds: m.capturedIds
    })),
    turn: turn,
  };

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameState)
    });

    if (!response.ok) {
      console.error(`Backend error: ${response.status}`);
      return null;
    }

    const data = await response.json() as LLMResponse;

    if (data.success && data.piece_id && data.target) {
      const piece = game.pieces.get(data.piece_id);
      if (piece) {
        const matchingMove = legalMoves.find(m =>
          m.from.row === piece.row &&
          m.from.col === piece.col &&
          m.to.row === data.target.row &&
          m.to.col === data.target.col
        );

        if (matchingMove) {
          if (data.cost) {
          }
          return {
            ...matchingMove,
            cost: data.cost,
            reasoning: data.reasoning,
            tokens_used: data.tokens_used
          };
        } else {
          console.warn(`   ⚠️  LLM suggested illegal move`);
        }
      }
    } else if (data.error) {
      console.error(`   ❌ LLM error: ${data.error}`);
    }

  } catch (error) {
    console.error('   ❌ Failed to call LLM backend:', error);
  }

  return null;
}

/**
 * Fallback move si LLM échoue
 */
function makeFallbackMove(game: Game): any | null {
  const legalMoves = game.getLegalMoves();
  if (legalMoves.length === 0) {
    return null;
  }

  const captureMoves = legalMoves.filter(m => m.capturedIds && m.capturedIds.length > 0);
  const moveToMake = captureMoves.length > 0 ? captureMoves[0] : legalMoves[0];

  (moveToMake as any).diceRoll = (game as any).diceResult ?? null;
  if (game.executeMove(moveToMake)) {
    console.log(`   🔄 Fallback move executed`);
    return moveToMake;
  }

  return null;
}

/**
 * Fonction principale du mode headless
 */
export async function runHeadless(
  model: Damier,
  options: {
    ai: string;
    seed: number;
    outputPath: string;
    firstPlayer?: number;
    mandatoryCapture?: boolean;
    llm?: boolean;
  }
): Promise<void> {
  
  // Limite de moves
  let maxMoves = 50;
  if(options.ai == "greedy" || options.ai == "heuristic"){
    maxMoves = 250;
  }else if(options.llm){
    maxMoves = 150;
  }

  console.log('🤖 Running headless simulation...');
  console.log(`   AI Strategy: ${options.llm ? 'LLM' : options.ai}`);
  console.log(`   Seed: ${options.seed}`);
  console.log(`   Max Moves: ${maxMoves}`);
  
  const size = model.board.size;
  const moveRule = model.rules.rule.find((r: any): r is MoveRule => 'direction' in r);
  const captureRule = model.rules.rule.find((r: any): r is CaptureRule => 'mandatory' in r);
  const dice = model.dice;
  
  const direction = moveRule?.direction || 'any';
  const mandatoryCapture = options.mandatoryCapture !== undefined 
    ? options.mandatoryCapture 
    : (captureRule?.mandatory || false);
  
  const firstPlayer = options.firstPlayer !== undefined ? options.firstPlayer : 0;

  const pieces_config = model.pieces.piece.map((p: any) => ({
    name: p.name,
    color: p.color,
    quantity: p.quantity,
  }));

  const diceConfig = dice ? { faces: dice.faces } : null;

  const game = new Game(
    size,
    direction,
    pieces_config,
    firstPlayer,
    mandatoryCapture,
    diceConfig
  );

  // Override rollDice pour reproductibilité
  const seededRandom = new SeededRandom(options.seed);
  if (diceConfig) {
    game.rollDice = function(): number | null {
      if (!game.diceConfig || !game.mustRollDice) return null;
      
      const result = seededRandom.nextInt(game.diceConfig.faces) + 1;
      game.diceResult = result;
      game.movesRemaining = result;
      game.mustRollDice = false;
      
      return result;
    };
  }

  // Track history
  const moveHistory: any[] = [];
  const diceHistory: number[] = [];

  const originalExecuteMove = game.executeMove.bind(game);
  game.executeMove = function(move: any): boolean {
    const playerBefore = game.currentPlayer;
    const result = originalExecuteMove(move);
    
    if (result) {
      const piece = game.getPieceAt(move.to.row, move.to.col);
      moveHistory.push({
        moveNumber: moveHistory.length + 1,
        player: playerBefore,
        from: { ...move.from },
        to: { ...move.to },
        pieceId: piece?.id || 'unknown',
        diceRoll: move.diceRoll || null
      });
    }
    
    return result;
  };

  const originalRollDiceTracked = game.rollDice.bind(game);
  game.rollDice = function(): number | null {
    const result = originalRollDiceTracked();
    if (result !== null) {
      diceHistory.push(result);
    }
    return result;
  };

  const initialState = {
    boardSize: game.boardSize,
    currentPlayer: game.currentPlayer,
    gameOver: game.gameOver,
    winner: game.winner,
    diceEnabled: diceConfig !== null,
    diceFaces: diceConfig?.faces || null,
    pieces: Array.from(game.pieces.values()).map(p => ({
      id: p.id,
      name: p.name,
      player: p.player,
      color: p.color,
      row: p.row,
      col: p.col,
      isQueen: p.isQueen
    }))
  };

  // Create bots UNIQUEMENT si pas en mode LLM
  let bot0: SeededBot | null = null;
  let bot1: SeededBot | null = null;
  
  if (!options.llm) {
    bot0 = new SeededBot(game, 0, options.ai, options.seed);
    bot1 = new SeededBot(game, 1, options.ai, options.seed + 1000);
  }

  const llmUrl = 'http://127.0.0.1:5000/api/move';
  
  let totalMoves = 0;
  let turn = 0;

  // Main game loop
  while (!game.gameOver && totalMoves < maxMoves) {
    // Handle dice if enabled
    if (diceConfig && game.mustRollDice) {
      game.rollDice();
      
      // Play all moves for this roll
      while (!game.gameOver && game.movesRemaining > 0 && totalMoves < maxMoves) {
        let move = null;

        if (options.llm) {
          // MODE LLM - appel fetch comme UI.ts
          move = await getLLMMove(game, llmUrl, turn);
          
          if (!move) {
            console.log(`   ⚠️  LLM failed, using fallback`);
            move = makeFallbackMove(game);
          } else {
            (move as any).diceRoll = (game as any).diceResult ?? null;
            game.executeMove(move);
          }
        } else {
          // MODE BOT
          const currentBot = game.currentPlayer === 0 ? bot0 : bot1;
          move = currentBot?.makeMove();
          
          if (!move) {
            console.log(`⚠️  No legal moves for Player ${game.currentPlayer + 1}`);
            break;
          }
        }
        
        if (!move) break;
        
        totalMoves++;
        turn++;
      }
    } else {
      // No dice - one move per turn
      let move = null;

      if (options.llm) {
        // MODE LLM
        move = await getLLMMove(game, llmUrl, turn);
        
        if (!move) {
          console.log(`   ⚠️  LLM failed, using fallback`);
          move = makeFallbackMove(game);
        } else {
           (move as any).diceRoll = (game as any).diceResult ?? null;
            game.executeMove(move);
        }
      } else {
        // MODE BOT
        const currentBot = game.currentPlayer === 0 ? bot0 : bot1;
        move = currentBot?.makeMove();
        
        if (!move) {
          console.log(`⚠️  No legal moves available`);
          break;
        }
      }
      
      if (!move) break;
      
      totalMoves++;
      turn++;
    }
  }

  const finalState = {
    boardSize: game.boardSize,
    currentPlayer: game.currentPlayer,
    gameOver: game.gameOver,
    winner: game.winner,
    diceEnabled: diceConfig !== null,
    diceFaces: diceConfig?.faces || null,
    pieces: Array.from(game.pieces.values()).map(p => ({
      id: p.id,
      name: p.name,
      player: p.player,
      color: p.color,
      row: p.row,
      col: p.col,
      isQueen: p.isQueen
    })),
    diceHistory: diceHistory.length > 0 ? diceHistory : null
  };

  const output = {
    metadata: {
      variant: model.name,
      seed: options.seed,
      ai_strategy: options.llm ? 'LLM' : options.ai,
      moves_simulated: moveHistory.length,
      timestamp: new Date().toISOString()
    },
    initial_state: initialState,
    final_state: finalState,
    moves: moveHistory
  };

  const outputDir = path.dirname(options.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    options.outputPath,
    JSON.stringify(output, null, 2),
    'utf-8'
  );

  console.log(`\n✅ Headless simulation complete!`);
  console.log(`   Total moves: ${moveHistory.length}`);
  console.log(`   Final state: ${game.gameOver ? '🏁 Game Over' : '⏸️  In Progress (reached move limit)'}`);
  if (game.winner !== null) {
    console.log(`   Winner: 🏆 Player ${game.winner + 1}`);
  } else if (!game.gameOver) {
    console.log(`   ⚠️  Simulation stopped: reached ${maxMoves} moves limit`);
  }
  console.log(`   Output: ${options.outputPath}`);
}