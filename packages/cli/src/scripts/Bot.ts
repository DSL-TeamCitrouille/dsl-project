/**
 * Bot Player
 * Supports multiple strategies: random, greedy, heuristic
 */
import type { Game, Move } from './game.js';

export class Bot {
  game: Game;
  playerId: number;
  type: string;

  constructor(game: Game, playerId: number, type: string) {
    this.game = game;
    this.playerId = playerId;
    this.type = type;
  }

  // Makes a move based on the bot's strategy
  makeMove(): Move | null {
    // Check if it's the bot's turn
    if (this.game.currentPlayer !== this.playerId || this.game.gameOver) {
      return null;
    }

    // Get all legal moves for the current player
    const legalMoves = this.game.getLegalMoves();
    if (legalMoves.length === 0) {
      return null;
    }

    // Select a move based on the bot's type
    let selectedMove: Move;

    switch (this.type) {
      case 'random':
        selectedMove = this.selectRandomMove(legalMoves);
        break;
      case 'greedy':
        selectedMove = this.selectGreedyMove(legalMoves);
        break;
      case 'heuristic':
        selectedMove = this.selectHeuristicMove(legalMoves);
        break;
      default:
        selectedMove = legalMoves[0];
    }

    // Execute the move
    const success = this.game.executeMove(selectedMove);
    if (success) {
      return selectedMove;
    }

    return null;
  }

  // Random strategy: picks a random legal move
  private selectRandomMove(legalMoves: Move[]): Move {
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[randomIndex];
  }

  // Greedy strategy: prioritizes captures and advancing pieces
  private selectGreedyMove(legalMoves: Move[]): Move {
    let bestMove = legalMoves[0];
    let bestScore = -Infinity;

    for (const move of legalMoves) {
      let score = 0;

      // Prioritize captures (highest priority)
      if (move.capturedIds && move.capturedIds.length > 0) {
        score += move.capturedIds.length * 100;
        
        // Extra points for capturing queens
        for (const capturedId of move.capturedIds) {
          const capturedPiece = this.game.pieces.get(capturedId);
          if (capturedPiece && capturedPiece.isQueen) {
            score += 50;
          }
        }
      }

      // Favor advancing towards opponent's side
      const advancement = this.calculateAdvancement(move);
      score += advancement * 10;

      // Bonus for promoting to queen
      if (this.wouldPromoteToQueen(move)) {
        score += 50;
      }

      // Bonus for central control
      score += this.evaluateCentralControl(move.to) * 3;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // Heuristic strategy: evaluates board position after each move
  private selectHeuristicMove(legalMoves: Move[]): Move {
    let bestMove = legalMoves[0];
    let bestScore = -Infinity;

    for (const move of legalMoves) {
      const score = this.evaluateMovePosition(move);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // Calculates how much a piece advances toward opponent's side
  private calculateAdvancement(move: Move): number {
    const direction = this.playerId === 0 ? 1 : -1;
    return (move.to.row - move.from.row) * direction;
  }

  // Checks if a move would promote the piece to queen
  private wouldPromoteToQueen(move: Move): boolean {
    const piece = this.game.getPieceAt(move.from.row, move.from.col);
    if (!piece || piece.isQueen) return false;

    // Solitaire mode: no promotion
    if (this.game.pieces_config.length === 1) return false;

    const promotionRow = this.playerId === 0 ? this.game.boardSize - 1 : 0;
    return move.to.row === promotionRow;
  }

  // Evaluates the board position after a hypothetical move
  private evaluateMovePosition(move: Move): number {
    let score = 0;

    // Material advantage
    const materialScore = this.evaluateMaterial();
    score += materialScore;

    // Positional advantages
    score += this.evaluatePosition(move) * 5;

    // Capture value
    if (move.capturedIds && move.capturedIds.length > 0) {
      score += move.capturedIds.length * 100;
      
      // Extra points for capturing queens
      for (const capturedId of move.capturedIds) {
        const capturedPiece = this.game.pieces.get(capturedId);
        if (capturedPiece && capturedPiece.isQueen) {
          score += 50;
        }
      }
    }

    // Queen promotion bonus
    if (this.wouldPromoteToQueen(move)) {
      score += 75;
    }

    // Central control bonus
    const centerBonus = this.evaluateCentralControl(move.to);
    score += centerBonus * 3;

    // Avoid edges (except back row for defense)
    const backRow = this.playerId === 0 ? 0 : this.game.boardSize - 1;
    const isEdge = (move.to.col === 0 || move.to.col === this.game.boardSize - 1) 
                   && move.to.row !== backRow;
    if (isEdge) score -= 5;

    return score;
  }

  // Evaluates material advantage (piece count)
  private evaluateMaterial(): number {
    let myPieces = 0;
    let opponentPieces = 0;
    let myQueens = 0;
    let opponentQueens = 0;

    this.game.pieces.forEach((piece) => {
      if (piece.player === this.playerId) {
        myPieces++;
        if (piece.isQueen) myQueens++;
      } else {
        opponentPieces++;
        if (piece.isQueen) opponentQueens++;
      }
    });

    return (myPieces - opponentPieces) * 10 + (myQueens - opponentQueens) * 5;
  }

  // Evaluates positional advantages
  private evaluatePosition(move: Move): number {
    let score = 0;

    // Favor advancement
    score += this.calculateAdvancement(move);

    // Protect back row (for defense)
    const backRow = this.playerId === 0 ? 0 : this.game.boardSize - 1;
    if (move.from.row === backRow) {
      score -= 3; // Penalty for leaving back row undefended
    }

    return score;
  }

  // Evaluates control of center squares
  private evaluateCentralControl(position: { row: number; col: number }): number {
    const centerRow = Math.floor(this.game.boardSize / 2);
    const centerCol = Math.floor(this.game.boardSize / 2);
    
    const distanceFromCenter = 
      Math.abs(position.row - centerRow) + Math.abs(position.col - centerCol);
    
    return Math.max(0, 4 - distanceFromCenter);
  }

  // Makes a move after a delay (useful for UI visualization)
  async makeMoveWithDelay(delayMs: number = 500): Promise<Move | null> {
    if (this.game.diceConfig && this.game.mustRollDice) {
      const result = this.game.rollDice();
      if (!result) return null;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    if (this.game.diceConfig && this.game.movesRemaining <= 0) {
      return null;
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
    return this.makeMove();
  }
}