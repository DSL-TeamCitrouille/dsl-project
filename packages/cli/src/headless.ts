// packages/cli/src/headless.ts
import type { CaptureRule, Damier, MoveRule } from 'dam-dam-language';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Seeded random number generator (simple LCG)
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

// Simplified Game class for headless execution
class HeadlessGame {
  boardSize: number;
  pieces: Map<string, any> = new Map();
  currentPlayer: number = 0;
  gameOver: boolean = false;
  winner: number | null = null;
  direction: string;
  pieces_config: any[];
  isCaptureMandatory: boolean;
  nextId: number = 0;
  random: SeededRandom;
  moveHistory: any[] = [];
  diceConfig: { faces: number } | null = null;
  diceHistory: number[] = [];

  constructor(
    boardSize: number,
    direction: string,
    pieces_config: any[],
    firstPlayer: number,
    isCaptureMandatory: boolean,
    seed: number,
    diceConfig: { faces: number } | null = null
  ) {
    this.boardSize = boardSize;
    this.direction = direction;
    this.pieces_config = pieces_config;
    this.currentPlayer = firstPlayer;
    this.isCaptureMandatory = isCaptureMandatory;
    this.random = new SeededRandom(seed);
    this.diceConfig = diceConfig;
    this.initBoard();
  }

  private initBoard(): void {
    for (let playerId = 0; playerId < this.pieces_config.length; playerId++) {
      const cfg = this.pieces_config[playerId];
      const positions = this.getStartPositions(playerId, cfg.quantity);
      
      for (const pos of positions) {
        const piece = {
          id: `p${this.nextId++}`,
          name: cfg.name,
          player: playerId,
          color: cfg.color,
          row: pos.row,
          col: pos.col,
          isQueen: false,
        };
        this.pieces.set(piece.id, piece);
      }
    }
  }

  private getStartPositions(playerId: number, quantity: number) {
    const pos = [];
    const size = this.boardSize;

    if (this.pieces_config.length === 2) {
      const isSecond = playerId === 1;
      if (this.direction === 'diagonal') {
        let placed = 0;
        if (isSecond) {
          for (let r = size - 1; r >= 0 && placed < quantity; r--) {
            for (let c = size - 1; c >= 0 && placed < quantity; c--) {
              if ((r + c) % 2 === 1) {
                pos.push({ row: r, col: c });
                placed++;
              }
            }
          }
        } else {
          for (let r = 0; r < size && placed < quantity; r++) {
            for (let c = 0; c < size && placed < quantity; c++) {
              if ((r + c) % 2 === 1) {
                pos.push({ row: r, col: c });
                placed++;
              }
            }
          }
        }
      } else {
        let placed = 0;
        if (isSecond) {
          for (let r = size - 2; r >= 0 && placed < quantity; r--) {
            for (let c = 0; c < size && placed < quantity; c++) {
              pos.push({ row: r, col: c });
              placed++;
            }
          }
        } else {
          for (let r = 1; r < size && placed < quantity; r++) {
            for (let c = 0; c < size && placed < quantity; c++) {
              pos.push({ row: r, col: c });
              placed++;
            }
          }
        }
      }
    }

    return pos;
  }

  getLegalMoves(): any[] {
    const moves: any[] = [];
    
    this.pieces.forEach((piece) => {
      if (piece.player === this.currentPlayer) {
        moves.push(...this.getMovesForPiece(piece));
      }
    });
    
    return moves;
  }

  private getMovesForPiece(piece: any): any[] {
    const moves = [];
    
    let dirs = this.direction === 'diagonal'
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : this.direction === 'orthogonal'
        ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
        : [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    if (this.direction === 'diagonal' && !piece.isQueen) {
      if (piece.player === 0) {
        dirs = dirs.filter(([dr]) => dr > 0);
      } else {
        dirs = dirs.filter(([dr]) => dr < 0);
      }
    }

    for (const [dr, dc] of dirs) {
      const maxDistance = piece.isQueen ? this.boardSize : 1;
      
      for (let distance = 1; distance <= maxDistance; distance++) {
        const newRow = piece.row + dr * distance;
        const newCol = piece.col + dc * distance;

        if (newRow < 0 || newRow >= this.boardSize || newCol < 0 || newCol >= this.boardSize) {
          break;
        }

        const targetPiece = this.getPieceAt(newRow, newCol);
        if (!targetPiece) {
          moves.push({ 
            from: { row: piece.row, col: piece.col }, 
            to: { row: newRow, col: newCol },
            pieceId: piece.id
          });
        } else {
          break;
        }
      }
    }

    return moves;
  }

  private getPieceAt(row: number, col: number): any | null {
    for (const piece of this.pieces.values()) {
      if (piece.row === row && piece.col === col) return piece;
    }
    return null;
  }

  executeMove(move: any): boolean {
    const piece = this.pieces.get(move.pieceId);
    if (!piece) return false;

    // Record move in history
    this.moveHistory.push({
      moveNumber: this.moveHistory.length + 1,
      player: this.currentPlayer,
      from: { ...move.from },
      to: { ...move.to },
      pieceId: move.pieceId,
      diceRoll: move.diceRoll || null // Add dice roll to move history
    });

    // Move the piece
    piece.row = move.to.row;
    piece.col = move.to.col;

    // Check for queen promotion
    if (this.pieces_config.length !== 1) {
      const isPromotionRow = (piece.player === 0 && piece.row === this.boardSize - 1) ||
                              (piece.player === 1 && piece.row === 0);
      
      if (isPromotionRow && !piece.isQueen) {
        piece.isQueen = true;
      }
    }

    this.checkWin();
    if (!this.gameOver) {
      this.currentPlayer = 1 - this.currentPlayer;
    }
    
    return true;
  }

  rollDice(): number {
    if (!this.diceConfig) return 1;
    const result = this.random.nextInt(this.diceConfig.faces) + 1;
    this.diceHistory.push(result);
    return result;
  }

  private checkWin(): void {
    const p0Pieces = Array.from(this.pieces.values()).filter((p) => p.player === 0);
    const p1Pieces = Array.from(this.pieces.values()).filter((p) => p.player === 1);

    if (p1Pieces.length === 0) {
      this.gameOver = true;
      this.winner = 0;
    } else if (p0Pieces.length === 0) {
      this.gameOver = true;
      this.winner = 1;
    }
  }

  selectMove(strategy: string): any | null {
    const legalMoves = this.getLegalMoves();
    if (legalMoves.length === 0) return null;

    switch (strategy) {
      case 'random':
        return legalMoves[this.random.nextInt(legalMoves.length)];
      
      case 'greedy':
        // Simple greedy: prefer moves that advance pieces
        let bestMove = legalMoves[0];
        let bestScore = -Infinity;
        
        for (const move of legalMoves) {
          const piece = this.pieces.get(move.pieceId);
          if (!piece) continue;
          
          const direction = piece.player === 0 ? 1 : -1;
          const advancement = (move.to.row - move.from.row) * direction;
          
          if (advancement > bestScore) {
            bestScore = advancement;
            bestMove = move;
          }
        }
        return bestMove;
      
      case 'heuristic':
        // Simple heuristic: advance + center control
        bestMove = legalMoves[0];
        bestScore = -Infinity;
        
        for (const move of legalMoves) {
          const piece = this.pieces.get(move.pieceId);
          if (!piece) continue;
          
          const direction = piece.player === 0 ? 1 : -1;
          const advancement = (move.to.row - move.from.row) * direction;
          
          const centerRow = Math.floor(this.boardSize / 2);
          const centerCol = Math.floor(this.boardSize / 2);
          const distanceFromCenter = 
            Math.abs(move.to.row - centerRow) + Math.abs(move.to.col - centerCol);
          const centerBonus = Math.max(0, 4 - distanceFromCenter);
          
          const score = advancement * 10 + centerBonus * 3;
          
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
        return bestMove;
      
      default:
        return legalMoves[this.random.nextInt(legalMoves.length)];
    }
  }

  getState() {
    return {
      boardSize: this.boardSize,
      currentPlayer: this.currentPlayer,
      gameOver: this.gameOver,
      winner: this.winner,
      diceEnabled: this.diceConfig !== null,
      diceFaces: this.diceConfig?.faces || null,
      pieces: Array.from(this.pieces.values()).map(p => ({
        id: p.id,
        name: p.name,
        player: p.player,
        color: p.color,
        row: p.row,
        col: p.col,
        isQueen: p.isQueen
      })),
      moveHistory: this.moveHistory,
      diceHistory: this.diceHistory.length > 0 ? this.diceHistory : null
    };
  }
}

export async function runHeadless(
  model: Damier,
  options: {
    ai: string;
    seed: number;
    numMoves?: number;
    outputPath: string;
    firstPlayer?: number;
    mandatoryCapture?: boolean;
  }
): Promise<void> {
  console.log('🤖 Running headless simulation...');
  console.log(`   AI Strategy: ${options.ai}`);
  console.log(`   Seed: ${options.seed}`);
  console.log(`   Moves: ${options.numMoves || 1}`);

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

  const game = new HeadlessGame(
    size,
    direction,
    pieces_config,
    firstPlayer,
    mandatoryCapture,
    options.seed,
    diceConfig
  );

  const initialState = game.getState();
  const numMoves = options.numMoves || 1;

  // Execute moves
  for (let i = 0; i < numMoves && !game.gameOver; i++) {
    // Roll dice if enabled
    let diceRoll = null;
    if (diceConfig) {
      diceRoll = game.rollDice();
    }

    const move = game.selectMove(options.ai);
    if (!move) {
      console.log(`No legal moves available after ${i} moves`);
      break;
    }
    
    // Add dice roll to move if applicable
    if (diceRoll !== null) {
      move.diceRoll = diceRoll;
    }
    
    game.executeMove(move);
  }

  const finalState = game.getState();

  // Generate output
  const output = {
    metadata: {
      variant: model.name,
      seed: options.seed,
      ai_strategy: options.ai,
      moves_simulated: finalState.moveHistory.length,
      timestamp: new Date().toISOString()
    },
    initial_state: initialState,
    final_state: finalState,
    moves: finalState.moveHistory
  };

  // Write to file
  const outputDir = path.dirname(options.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    options.outputPath,
    JSON.stringify(output, null, 2),
    'utf-8'
  );

  console.log(`✅ Headless simulation complete!`);
  console.log(`   Final state: ${game.gameOver ? 'Game Over' : 'In Progress'}`);
  if (game.winner !== null) {
    console.log(`   Winner: Player ${game.winner + 1}`);
  }
  console.log(`   Output: ${options.outputPath}`);
}
