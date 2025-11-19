import { Game, Piece } from "./game.js";
import { Bot } from "./randomBot.js";

type GameMode = 'pvp' | 'pvb' | 'bvb';

interface Position {
    row: number;
    col: number;
}

export class UI {
    private game: Game;
    private selected: Piece | null = null;
    private mode: GameMode = 'pvp';
    private bot1: Bot;
    private bot0: Bot;
    private isProcessing: boolean = false;
    private stopBotLoop: boolean = false;
    private showLegalMoves: boolean = true;

    constructor(game: Game) {
        this.game = game;
        this.bot1 = new Bot(game, 1);
        this.bot0 = new Bot(game, 0);
        this.setupEvents();
        this.render();
    }

    private setupEvents(): void {
        const squares = document.querySelectorAll('.square');
        squares.forEach((square) => {
            square.addEventListener('click', (e) => this.handleClick(e as MouseEvent));
        });

        const resetBtn = document.querySelector('.reset-btn') as HTMLButtonElement;
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.game.reset();
                this.selected = null;
                this.render();
                this.checkBotTurn();
            });
        }

        const botBtn = document.querySelector('.bot-btn') as HTMLButtonElement;
        if (botBtn) {
            botBtn.addEventListener('click', async () => {
                await this.triggerBotMove();
            });
        }

        const toggleHintsBtn = document.querySelector('.toggle-hints-btn') as HTMLButtonElement;
        if (toggleHintsBtn) {
            toggleHintsBtn.classList.add('active');
            toggleHintsBtn.addEventListener('click', () => {
                this.showLegalMoves = !this.showLegalMoves;
                toggleHintsBtn.classList.toggle('active');
                toggleHintsBtn.textContent = this.showLegalMoves ? '💡 Aide' : '💡 Aide (désactivée)';
                this.render();
            });
        }

        const forfaitBtn = document.querySelector('.forfait-btn') as HTMLButtonElement;
        const forfaitModal = document.getElementById('forfaitModal') as HTMLElement;
        const confirmForfait = document.getElementById('confirmForfait') as HTMLButtonElement;
        const cancelForfait = document.getElementById('cancelForfait') as HTMLButtonElement;

        if (forfaitBtn) {
            forfaitBtn.addEventListener('click', () => {
                if (!this.game.gameOver) {
                    forfaitModal?.classList.add('active');
                }
            });
        }

        if (confirmForfait) {
            confirmForfait.addEventListener('click', () => {
                this.stopBotLoop = true;
                this.game.forceEndGame();
                this.selected = null;
                forfaitModal?.classList.remove('active');
                this.render();
            });
        }

        if (cancelForfait) {
            cancelForfait.addEventListener('click', () => {
                forfaitModal?.classList.remove('active');
            });
        }

        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const newMode = (btn as HTMLElement).dataset.mode as GameMode;
                this.setMode(newMode);
            });
        });
    }

    private setMode(newMode: GameMode): void {
        this.stopBotLoop = true;
        this.mode = newMode;
        this.game.reset();
        this.selected = null;

        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === newMode);
        });

        const botBtn = document.querySelector('.bot-btn') as HTMLButtonElement;
        if (botBtn) {
            botBtn.style.display = newMode === 'pvb' ? 'inline-block' : 'none';
        }

        this.render();

        setTimeout(() => {
            this.stopBotLoop = false;
            this.checkBotTurn();
        }, 100);
    }

    private async handleClick(e: MouseEvent): Promise<void> {
        if (this.isProcessing || this.game.gameOver) return;

        // Disable clicks in bot vs bot mode
        if (this.mode === 'bvb') return;

        // In pvb mode, disable clicks when it's bot's turn
        if (this.mode === 'pvb' && this.game.currentPlayer === 1) return;

        if (this.game.diceConfig && this.game.mustRollDice) {
            this.updateStatus('⚠️ You must roll the dice first!');
            return;
        }

        // NOUVEAU : If no moves remaining, prevent moves
        if (this.game.diceConfig && this.game.movesRemaining <= 0) {
            this.updateStatus('⚠️ No moves remaining! Roll the dice again.');
            return;
        }

        const target = e.target as HTMLElement;
        const square = target?.closest?.('.square') as HTMLElement;
        if (!square) return;

        const rowStr = square.getAttribute('data-row');
        const colStr = square.getAttribute('data-col');

        if (!rowStr || !colStr) return;

        const row = parseInt(rowStr, 10);
        const col = parseInt(colStr, 10);
        const clickedPiece = this.getPieceAt(row, col);

        if (!this.selected) {
            // Initial selection
            if (clickedPiece && clickedPiece.player === this.game.currentPlayer) {
                this.selected = clickedPiece;
                this.render();
            }
        } else {
            // If clicking on another piece of same player => change selection
            if (clickedPiece && clickedPiece.player === this.game.currentPlayer) {
                this.selected = clickedPiece;
                this.render();
                return;
            }

            // Try to move
            const move = {
                from: { row: this.selected.row, col: this.selected.col },
                to: { row, col }
            };

            // Find the legal move that matches this destination
            const legalMoves = this.game.getLegalMoves();
            const matchingMove = legalMoves.find(m =>
                m.from.row === move.from.row &&
                m.from.col === move.from.col &&
                m.to.row === move.to.row &&
                m.to.col === move.to.col
            );

            // Use the legal move (which has capturedIds if it's a jump)
            const moveToExecute = matchingMove || move;

            if (this.game.executeMove(moveToExecute)) {
                this.selected = null;
                this.render();
                await this.checkBotTurn();
            }
        }
    }

    updateStatus(message : string): void {
        const status = document.querySelector('.status');
        if (status) {
            status.textContent = message;
            setTimeout(() => {
                this.render(); // Restore normal status
            }, 2000);
        }
    }

    private async triggerBotMove(): Promise<void> {
        if (this.isProcessing || this.game.gameOver) return;

        this.isProcessing = true;
        this.render();

        if (this.mode === 'pvb' && this.game.currentPlayer === 1) {
            await this.bot1.makeMoveWithDelay(500);
        }

        this.isProcessing = false;
        this.render();
    }

    public async checkBotTurn(): Promise<void> {
        if (this.game.gameOver || this.isProcessing) return;

        if (this.mode === 'bvb') {
            // Bot vs Bot mode - both bots play
            this.isProcessing = true;
            this.stopBotLoop = false;

            while (!this.game.gameOver && !this.stopBotLoop && this.mode === 'bvb') {
                this.render();
                await new Promise(resolve => setTimeout(resolve, 800));

                if (this.stopBotLoop || this.mode !== 'bvb') break;

                if (this.game.currentPlayer === 0) {
                    await this.bot0.makeMoveWithDelay(100);
                } else {
                    await this.bot1.makeMoveWithDelay(100);
                }

                if (this.game.gameOver || this.stopBotLoop || this.mode !== 'bvb') break;
            }

            this.isProcessing = false;
            this.render();
        } else if (this.mode === 'pvb' && this.game.currentPlayer === 1) {
            // Player vs Bot mode - bot plays as player 1
            this.isProcessing = true;
            this.render();
            await this.bot1.makeMoveWithDelay(500);
            this.isProcessing = false;
            this.render();
        }
    }

    private getPieceAt(row: number, col: number): Piece | null {
        for (const piece of this.game.pieces.values()) {
            if (piece.row === row && piece.col === col) return piece;
        }
        return null;
    }

    public render(): void {
        let legalDestinations: Position[] = [];
        if (this.selected && this.showLegalMoves) {
            const allLegalMoves = this.game.getLegalMoves();
            legalDestinations = allLegalMoves
                .filter(m =>
                    m.from.row === this.selected!.row &&
                    m.from.col === this.selected!.col
                )
                .map(m => ({ row: m.to.row, col: m.to.col }));
        }

        const squares = document.querySelectorAll('.square');

        squares.forEach((sq) => {
            const square = sq as HTMLElement;
            const rowStr = square.getAttribute('data-row');
            const colStr = square.getAttribute('data-col');

            if (!rowStr || !colStr) return;

            const row = parseInt(rowStr, 10);
            const col = parseInt(colStr, 10);

            square.innerHTML = '';
            square.classList.remove('selected', 'legalmoves');

            const piece = this.getPieceAt(row, col);
            if (piece) {
                const el = document.createElement('div');
                el.className = `piece ${piece.color}`;
                if (piece.isQueen) {
                    el.classList.add('queen');
                }
                el.title = piece.isQueen ? piece.name + ' (Queen)' : piece.name;
                square.appendChild(el);
            }

            if (this.selected && this.selected.row === row && this.selected.col === col) {
                square.classList.add('selected');
            }

            if (this.showLegalMoves && legalDestinations.some(dest => dest.row === row && dest.col === col)) {
                square.classList.add('legalmoves');
            }
        });

        const status = document.querySelector('.status') as HTMLElement;
        const botBtn = document.querySelector('.bot-btn') as HTMLButtonElement;
        const diceResult = document.querySelector('.dice-result') as HTMLElement;
        const throwButton = document.querySelector('.throw-button') as HTMLButtonElement;

        if (status) {
            if (this.game.gameOver) {
                const winner = this.game.winner !== null ? this.game.winner + 1 : 'unknown';
                const winnerName = this.mode === 'bvb' ? `Bot ${winner}` :
                    (this.mode === 'pvb' && this.game.winner === 1) ? 'Bot' :
                        `Player ${winner}`;
                status.textContent = `🎉 ${winnerName} wins!`;
            } else if (this.isProcessing) {
                status.textContent = '🤖 Bot is thinking...';
            } else {
                const currentName = this.mode === 'bvb' ? `Bot ${this.game.currentPlayer + 1}` :
                    (this.mode === 'pvb' && this.game.currentPlayer === 1) ? 'Bot' :
                        `Player ${this.game.currentPlayer + 1}`;
                if (this.game.diceConfig) {
                            if (this.game.mustRollDice) {
                                status.textContent = `${currentName}'s turn - 🎲 Roll the dice!`;
                            } else {
                                status.textContent = `${currentName}'s turn - ${this.game.movesRemaining} move(s) left`;
                            }
                        } else {
                            status.textContent = `${currentName}'s turn`;
                        }
                        
                    }
                }
                
                if (diceResult && this.game.diceConfig) {
                    if (this.game.diceResult !== null && !this.game.mustRollDice) {
                        diceResult.innerHTML = `
                            <div style="margin-top: 10px; padding: 8px; background: white; border-radius: 6px; font-weight: bold; color: #333;">
                                Result: ${this.game.diceResult}<br>
                                <span style="font-size: 12px; color: #666;">Moves left: ${this.game.movesRemaining}</span>
                            </div>
                        `;
                    } else {
                        diceResult.innerHTML = '';
                    }
                }

                if (throwButton && this.game.diceConfig) {
                    const shouldDisable = this.isProcessing || 
                                        this.game.gameOver || 
                                        !this.game.mustRollDice ||
                                        (this.mode === 'pvb' && this.game.currentPlayer === 1) ||
                                        this.mode === 'bvb';
                    throwButton.disabled = shouldDisable;
                }
        
        if (botBtn) {
            botBtn.disabled = this.isProcessing || this.game.gameOver ||
                this.mode !== 'pvb' || this.game.currentPlayer !== 1;
        }
    }
}
