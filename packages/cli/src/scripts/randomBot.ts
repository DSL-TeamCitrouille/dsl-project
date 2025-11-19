/**
 * Bot Player
 * Plays random legal moves
 * Updated to match game.ts (supports capturedIds in moves)
 */

import type { Game, Move } from './game.js';

export class Bot {
  game: Game;
  playerId: number;

  constructor(game: Game, playerId: number) {
    this.game = game;
    this.playerId = playerId;
  }

  /**
   * Makes a random legal move for the bot's player
   * @returns The move that was made, or null if no legal moves available
   */
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

    // Pick a random legal move
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    const selectedMove = legalMoves[randomIndex];

    // Execute the move
    const success = this.game.executeMove(selectedMove);

    if (success) {
      return selectedMove;
    }

    return null;
  }

  /**
   * Makes a move after a delay (useful for UI visualization)
   * @param delayMs Delay in milliseconds before making the move
   * @returns Promise that resolves with the move that was made
   */
  async makeMoveWithDelay(delayMs: number = 500): Promise<Move | null> {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return this.makeMove();
  }
}