import { Game, Piece } from "./game.js";
import { Bot } from "./randomBot.js";

type GameMode = 'pvp' | 'pvb' | 'pvl' | 'bvb' | 'lvl';

interface Position {
    row: number;
    col: number;
}

interface LLMResponse {
    success: boolean;
    piece_id: string;
    target: { row: number; col: number };
    reasoning: string;
    cost?: string;
    tokens_used?: number;
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
    private backendUrl: string = "http://127.0.0.1:5000/api/move";

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

        const llmBtn = document.querySelector('.llm-btn') as HTMLButtonElement;
        if (llmBtn) {
            llmBtn.addEventListener('click', async () => {
                await this.triggerLLMMove();
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
        const llmBtn = document.querySelector('.llm-btn') as HTMLButtonElement;
        const llmStatus = document.getElementById('llmStatus') as HTMLElement;

        if (botBtn) {
            botBtn.style.display = (newMode === 'pvb' || newMode === 'bvb') ? 'inline-block' : 'none';
        }

        if (llmBtn) {
            llmBtn.style.display = (newMode === 'pvl' || newMode === 'lvl') ? 'inline-block' : 'none';
        }

        if (llmStatus) {
            llmStatus.style.display = (newMode === 'pvl' || newMode === 'lvl') ? 'block' : 'none';
        }

        // Disable clicks in bot vs bot and LLM vs LLM modes
        this.render();

        setTimeout(() => {
            this.stopBotLoop = false;
            this.checkBotTurn();
        }, 100);
    }

    private async handleClick(e: MouseEvent): Promise<void> {
        if (this.isProcessing || this.game.gameOver) return;

        // Disable clicks in bot vs bot and LLM vs LLM modes
        if (this.mode === 'bvb' || this.mode === 'lvl') return;

        // In pvb mode, disable clicks when it's bot's turn
        if (this.mode === 'pvb' && this.game.currentPlayer === 1) return;

        // In pvl mode, disable clicks when it's LLM's turn
        if (this.mode === 'pvl' && this.game.currentPlayer === 1) return;

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
                // If mandatory capture is enabled, check if this piece has capture moves available
                if (this.game.isCaptureManutory) {
                    const allLegalMoves = this.game.getLegalMoves();
                    const hasCaptureMoves = allLegalMoves.some(m => m.capturedIds && m.capturedIds.length > 0);
                    
                    if (hasCaptureMoves) {
                        // If there are captures available anywhere, only allow selecting pieces that can capture
                        const pieceCanCapture = allLegalMoves.some(m =>
                            m.from.row === clickedPiece.row &&
                            m.from.col === clickedPiece.col &&
                            m.capturedIds &&
                            m.capturedIds.length > 0
                        );
                        
                        if (!pieceCanCapture) {
                            this.updateStatus('⚠️ Mandatory capture! You must capture with another piece.');
                            return;
                        }
                    }
                }
                
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

    private async triggerLLMMove(): Promise<void> {
        if (this.isProcessing || this.game.gameOver) return;

        this.isProcessing = true;
        this.showLLMStatus('🧠 LLM Thinking...');
        this.render();

        try {
            const move = await this.getLLMMove();
            if (move) {
                this.game.executeMove(move);
                this.showLLMStatus(`✅ LLM moved - Cost: ${move.cost || 'N/A'}`, move.reasoning);
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                this.showLLMStatus('❌ LLM failed to make a move', 'Using fallback move');
            }
        } catch (error) {
            console.error('LLM move error:', error);
            this.showLLMStatus('❌ LLM Error', String(error));
        }

        this.isProcessing = false;
        this.render();
        await this.checkBotTurn();
    }

    private async getLLMMove(): Promise<any> {
        const legalMoves = this.game.getLegalMoves();
        if (legalMoves.length === 0) {
            return null;
        }

        // Collect game state
        const gameState = {
            board_size: this.game.boardSize,
            direction: this.game.direction,
            current_player: this.game.currentPlayer,
            mandatory_capture: this.game.isCaptureManutory,
            pieces: Array.from(this.game.pieces.values()).map(p => ({
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
            }))
        };

        try {
            const response = await fetch(this.backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gameState)
            });

            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }

            const data: LLMResponse = await response.json();

            // if (data.success && data.piece_id) {
            //     // Find piece by ID
            //     const piece = this.game.pieces.get(data.piece_id);
            //     if (piece) {
            //         // Create move object
            //         const moveToExecute = {
            //             from: { row: piece.row, col: piece.col },
            //             to: { row: data.target.row, col: data.target.col },
            //             capturedIds: [],
            //             cost: data.cost,
            //             reasoning: data.reasoning,
            //             tokens_used: data.tokens_used
            //         };

            //         // Validate move is in legal moves
            //         const isLegal = legalMoves.some(m =>
            //             m.from.row === moveToExecute.from.row &&
            //             m.from.col === moveToExecute.from.col &&
            //             m.to.row === moveToExecute.to.row &&
            //             m.to.col === moveToExecute.to.col
            //         );

            //         if (isLegal) {
            //             return moveToExecute;
            //         }
            //     }
            // }
            if (data.success && data.piece_id && data.target) {
                // Find piece by ID
                const piece = this.game.pieces.get(data.piece_id);
                if (piece) {
                    // Find the matching LEGAL move (includes capturedIds if it's a capture)
                    const matchingMove = legalMoves.find(m =>
                        m.from.row === piece.row &&
                        m.from.col === piece.col &&
                        m.to.row === data.target.row &&
                        m.to.col === data.target.col
                    );

                    if (matchingMove) {
                        // Return the legal move, but add the LLM extra info
                        return {
                            ...matchingMove,
                            cost: data.cost,
                            reasoning: data.reasoning,
                            tokens_used: data.tokens_used
                        };
                    }
                }
            }

        } catch (error) {
            console.error('Failed to call LLM backend:', error);
        }
    }

    private showLLMStatus(status: string, reasoning?: string): void {
        const statusDiv = document.getElementById('llmStatus') as HTMLElement;
        const thinkingDiv = document.getElementById('llmThinking') as HTMLElement;
        const costDiv = document.getElementById('llmCost') as HTMLElement;
        const reasoningDiv = document.getElementById('llmReasoning') as HTMLElement;

        if (statusDiv) {
            statusDiv.style.display = 'block';

            if (status.includes('Thinking') && thinkingDiv) {
                thinkingDiv.style.display = 'block';
                if (costDiv) costDiv.textContent = '';
                if (reasoningDiv) reasoningDiv.textContent = '';
            } else {
                if (thinkingDiv) thinkingDiv.style.display = 'none';
                if (costDiv) costDiv.textContent = status;
                if (reasoningDiv && reasoning) {
                    reasoningDiv.textContent = `💭 ${reasoning}`;
                }
            }
        }
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
        } else if (this.mode === 'lvl') {
            // LLM vs LLM mode - both LLMs play
            this.isProcessing = true;
            this.stopBotLoop = false;

            while (!this.game.gameOver && !this.stopBotLoop && this.mode === 'lvl') {
                this.render();
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (this.stopBotLoop || this.mode !== 'lvl') break;

                await this.triggerLLMMove();

                if (this.game.gameOver || this.stopBotLoop || this.mode !== 'lvl') break;
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
        } else if (this.mode === 'pvl' && this.game.currentPlayer === 1) {
            // Player vs LLM mode - LLM plays as player 1
            this.isProcessing = true;
            this.render();
            await this.triggerLLMMove();
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