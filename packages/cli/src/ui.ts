/// <reference lib="dom" />

/**
 * Minimal UI Controller
 * Only what's needed for playable UI
 */

import type { Game, Piece } from './game.js';

export class UI {
  game: Game;
  selected: Piece | null = null;

  constructor(game: Game) {
    this.game = game;
    console.log('UI initialized. Pieces count:', this.game.pieces.size);
    console.log('Game board size:', this.game.boardSize);
    console.log('Pieces:', Array.from(this.game.pieces.values()));
    
    this.setupEvents();
    this.render();
  }

  private setupEvents(): void {
    const squares = document.querySelectorAll('.square');
    console.log('Found squares:', squares.length);
    
    squares.forEach((square) => {
      square.addEventListener('click', (e) => this.handleClick(e));
    });

    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.game.reset();
        this.render();
      });
    }
  }

  private handleClick(e: Event): void {
    const target = e.target as any;
    const square = target?.closest?.('.square');
    if (!square) return;

    const rowStr = square.getAttribute('data-row');
    const colStr = square.getAttribute('data-col');
    
    if (!rowStr || !colStr) return;
    
    const row = parseInt(rowStr, 10);
    const col = parseInt(colStr, 10);

    if (!this.selected) {
      const piece = this.getPieceAt(row, col);
      if (piece && piece.player === this.game.currentPlayer) {
        this.selected = piece;
        this.render();
      }
    } else {
      const move = { 
        from: { row: this.selected.row, col: this.selected.col }, 
        to: { row, col } 
      };
      if (this.game.executeMove(move)) {
        this.selected = null;
        this.render();
      }
    }
  }

  private getPieceAt(row: number, col: number): Piece | null {
    for (const piece of this.game.pieces.values()) {
      if (piece.row === row && piece.col === col) return piece;
    }
    return null;
  }

  render(): void {
    // Update squares
    const squares = document.querySelectorAll('.square');
    
    squares.forEach((sq) => {
      const square = sq as any;
      const rowStr = square.getAttribute('data-row');
      const colStr = square.getAttribute('data-col');
      
      if (!rowStr || !colStr) return;
      
      const row = parseInt(rowStr, 10);
      const col = parseInt(colStr, 10);

      // Clear existing content
      square.innerHTML = '';
      square.classList.remove('selected');

      // Add piece if one exists here
      const piece = this.getPieceAt(row, col);
      if (piece) {
        const el = document.createElement('div');
        el.className = `piece ${piece.color}`;
        el.textContent = piece.name[0].toUpperCase();
        el.title = piece.name;
        square.appendChild(el);
      }

      // Highlight selected piece
      if (this.selected && this.selected.row === row && this.selected.col === col) {
        square.classList.add('selected');
      }
    });

    // Update status
    const status = document.querySelector('.status') as any;
    if (status) {
      if (this.game.gameOver) {
        const winner = this.game.winner !== null ? this.game.winner + 1 : 'unknown';
        status.textContent = `🎉 Player ${winner} wins!`;
      } else {
        status.textContent = `Player ${this.game.currentPlayer + 1}'s turn`;
      }
    }
  }
}