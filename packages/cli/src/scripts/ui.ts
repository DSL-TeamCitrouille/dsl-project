import { Game, Move, Piece } from "./game.js";
import { Bot } from "./randomBot.js";


export type Mode = 'pvp' | 'pvb' | 'bvb';

export class UI {
  game: Game;
  selected: Piece | null = null;
  mode: Mode = 'pvp';
  bot1: Bot;
  bot0: Bot;
  isProcessing: boolean = false;
  stopBotLoop: boolean = false;

  // Boutons typés pour éviter les redeclarations
  private botBtn: HTMLButtonElement | null = null;
  private resetBtn: HTMLButtonElement | null = null;
  private forfaitBtn: HTMLButtonElement | null = null;
  private confirmForfait: HTMLButtonElement | null = null;
  private cancelForfait: HTMLButtonElement | null = null;

  constructor(game: Game) {
    this.game = game;
    this.bot1 = new Bot(game, 1);
    this.bot0 = new Bot(game, 0);

    this.botBtn = document.querySelector<HTMLButtonElement>('.bot-btn');
    this.resetBtn = document.querySelector<HTMLButtonElement>('.reset-btn');
    this.forfaitBtn = document.querySelector<HTMLButtonElement>('.forfait-btn');
    this.confirmForfait = document.getElementById('confirmForfait') as HTMLButtonElement | null;
    this.cancelForfait = document.getElementById('cancelForfait') as HTMLButtonElement | null;

    this.setupEvents();
    this.render();
  }

  setupEvents() {
    const squares = document.querySelectorAll<HTMLElement>('.square');
    squares.forEach((square) => {
      square.addEventListener('click', (e) => this.handleClick(e));
    });

    this.resetBtn?.addEventListener('click', () => {
      this.game.reset();
      this.selected = null;
      this.render();
      this.checkBotTurn();
    });

    this.botBtn?.addEventListener('click', async () => {
      await this.triggerBotMove();
    });

    const forfaitModal = document.getElementById('forfaitModal');

    this.forfaitBtn?.addEventListener('click', () => {
      if (!this.game.gameOver && forfaitModal) {
        forfaitModal.classList.add('active');
      }
    });

    this.confirmForfait?.addEventListener('click', () => {
      this.stopBotLoop = true;
      this.game.forceEndGame();
      this.selected = null;
      forfaitModal?.classList.remove('active');
      this.render();
    });

    this.cancelForfait?.addEventListener('click', () => {
      forfaitModal?.classList.remove('active');
    });

    const modeBtns = document.querySelectorAll<HTMLElement>('.mode-btn');
    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const newMode = btn.dataset.mode as Mode;
        if (newMode) this.setMode(newMode);
      });
    });
  }

  setMode(newMode: Mode) {
    this.stopBotLoop = true;
    this.mode = newMode;
    this.game.reset();
    this.selected = null;

    const modeBtns = document.querySelectorAll<HTMLElement>('.mode-btn');
    modeBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === newMode);
    });

    if (this.botBtn) this.botBtn.style.display = newMode === 'pvb' ? 'inline-block' : 'none';

    this.render();

    setTimeout(() => {
      this.stopBotLoop = false;
      this.checkBotTurn();
    }, 100);
  }

  async handleClick(e: Event) {
    if (this.isProcessing || this.game.gameOver) return;
    if (this.mode === 'bvb') return;
    if (this.mode === 'pvb' && this.game.currentPlayer === 1) return;

    const target = e.target as HTMLElement;
    const square = target.closest<HTMLElement>('.square');
    if (!square) return;

    const row = parseInt(square.dataset.row || '', 10);
    const col = parseInt(square.dataset.col || '', 10);
    if (isNaN(row) || isNaN(col)) return;

    const clickedPiece = this.getPieceAt(row, col);

    if (!this.selected) {
      if (clickedPiece && clickedPiece.player === this.game.currentPlayer) {
        this.selected = clickedPiece;
        this.render();
      }
    } else {
      if (clickedPiece && clickedPiece.player === this.game.currentPlayer) {
        this.selected = clickedPiece;
        this.render();
        return;
      }

      const move: Partial<Move> = {
        from: { row: this.selected.row, col: this.selected.col },
        to: { row, col },
      };

      const legalMoves = this.game.getLegalMoves();
      const matchingMove = legalMoves.find(
        (m) =>
          m.from.row === move.from?.row &&
          m.from.col === move.from?.col &&
          m.to.row === move.to?.row &&
          m.to.col === move.to?.col
      );

      const moveToExecute = matchingMove || { ...move, capturedIds: [] } as Move;

      if (this.game.executeMove(moveToExecute)) {
        this.selected = null;
        this.render();
        await this.checkBotTurn();
      }
    }
  }

  async triggerBotMove() {
    if (this.isProcessing || this.game.gameOver) return;

    this.isProcessing = true;
    this.render();

    if (this.mode === 'pvb' && this.game.currentPlayer === 1) {
      await this.bot1.makeMoveWithDelay(500);
    }

    this.isProcessing = false;
    this.render();
  }

  async checkBotTurn() {
    if (this.game.gameOver || this.isProcessing) return;

    if (this.mode === 'bvb') {
      this.isProcessing = true;
      this.stopBotLoop = false;

      while (!this.game.gameOver && !this.stopBotLoop && this.mode === 'bvb') {
        this.render();
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (this.stopBotLoop || this.mode !== 'bvb') break;

        if (this.game.currentPlayer === 0) {
          await this.bot0.makeMoveWithDelay(100);
        } else {
          await this.bot1.makeMoveWithDelay(100);
        }
      }

      this.isProcessing = false;
      this.render();
    } else if (this.mode === 'pvb' && this.game.currentPlayer === 1) {
      this.isProcessing = true;
      this.render();
      await this.bot1.makeMoveWithDelay(500);
      this.isProcessing = false;
      this.render();
    }
  }

  getPieceAt(row: number, col: number): Piece | null {
    for (const piece of this.game.pieces.values()) {
      if (piece.row === row && piece.col === col) return piece;
    }
    return null;
  }

  render() {
    const squares = document.querySelectorAll<HTMLElement>('.square');

    squares.forEach((square) => {
      const row = parseInt(square.dataset.row || '', 10);
      const col = parseInt(square.dataset.col || '', 10);
      if (isNaN(row) || isNaN(col)) return;

      square.innerHTML = '';
      square.classList.remove('selected');

      const piece = this.getPieceAt(row, col);
      if (piece) {
        const el = document.createElement('div');
        el.className = `piece ${piece.color}`;
        if (piece.isQueen) el.classList.add('queen');
        el.title = piece.isQueen ? `${piece.name} (Queen)` : piece.name;
        square.appendChild(el);
      }

      if (this.selected?.row === row && this.selected?.col === col) {
        square.classList.add('selected');
      }
    });

    const status = document.querySelector<HTMLElement>('.status');

    if (status) {
      if (this.game.gameOver) {
        const winner = this.game.winner !== null ? this.game.winner + 1 : 'unknown';
        const winnerName =
          this.mode === 'bvb'
            ? `Bot ${winner}`
            : this.mode === 'pvb' && this.game.winner === 1
            ? 'Bot'
            : `Player ${winner}`;
        status.textContent = `🎉 ${winnerName} wins!`;
      } else if (this.isProcessing) {
        status.textContent = '🤖 Bot is thinking...';
      } else {
        const currentName =
          this.mode === 'bvb'
            ? `Bot ${this.game.currentPlayer + 1}`
            : this.mode === 'pvb' && this.game.currentPlayer === 1
            ? 'Bot'
            : `Player ${this.game.currentPlayer + 1}`;
        status.textContent = `${currentName}'s turn`;
      }
    }

    if (this.botBtn) {
      this.botBtn.disabled =
        this.isProcessing || this.game.gameOver || this.mode !== 'pvb' || this.game.currentPlayer !== 1;
    }
  }
}
