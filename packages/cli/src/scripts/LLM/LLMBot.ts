import { Game } from "../game.js";

/**
 * LLMBot - Intelligent game AI using production service
 * 
 * Uses a backend service that sends complete game state and rules to LLM
 * LLM returns piece_id and target position for the best move
 */
export class LLMBot {
    private game: Game;
    private playerNumber: number;
    private backendUrl: string = "/api/move";

    constructor(game: Game, playerNumber: number, backendUrl: string = "/api/move") {
        this.game = game;
        this.playerNumber = playerNumber;
        this.backendUrl = backendUrl;
    }

    /**
     * Create complete game state for the service
     */
    private getGameState(): any {
        const pieces: any[] = [];
        
        // Serialize all pieces
        for (const piece of this.game.pieces.values()) {
            pieces.push({
                id: piece.id,
                name: piece.name,
                player: piece.player,
                color: piece.color,
                row: piece.row,
                col: piece.col,
                isQueen: piece.isQueen
            });
        }

        // Get legal moves
        const legalMoves = this.game.getLegalMoves();
        const serializedMoves: any[] = [];
        
        for (const move of legalMoves) {
            serializedMoves.push({
                from: {
                    row: move.from.row,
                    col: move.from.col
                },
                to: {
                    row: move.to.row,
                    col: move.to.col
                },
                capturedIds: move.capturedIds || []
            });
        }

        return {
            board_size: this.game.boardSize,
            direction: this.game.direction,
            current_player: this.game.currentPlayer,
            mandatory_capture: this.game.isCaptureManutory,
            pieces: pieces,
            legal_moves: serializedMoves,
            dice_config: this.game.diceConfig,
            moves_remaining: this.game.movesRemaining
        };
    }

    /**
     * Make a move with delay
     */
    public async makeMoveWithDelay(delayMs: number = 500): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(async () => {
                try {
                    await this.makeMove();
                } catch (error) {
                    console.error("Error in LLM bot move:", error);
                    // Fallback: make random legal move
                    await this.makeFallbackMove();
                }
                resolve();
            }, delayMs);
        });
    }

    /**
     * Make a move by querying the LLM service
     */
    private async makeMove(): Promise<void> {
        if (this.game.gameOver) {
            console.log("Game is over, cannot make move");
            return;
        }

        if (this.game.currentPlayer !== this.playerNumber) {
            console.log(`It's not Player ${this.playerNumber}'s turn`);
            return;
        }

        const gameState = this.getGameState();

        try {
            console.log(`[LLM Bot ${this.playerNumber}] Requesting move suggestion...`);
            
            const response = await fetch(this.backendUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...gameState,
                    model: "openai/gpt-4o-mini",
                    temperature: 0.7
                }),
            });

            if (!response.ok) {
                console.error(`Backend error: ${response.statusText}`);
                await this.makeFallbackMove();
                return;
            }

            const data = await response.json();

            if (!data.success) {
                console.error(`Service error: ${data.error}`);
                await this.makeFallbackMove();
                return;
            }

            const pieceId = data.piece_id;
            const targetRow = data.target.row;
            const targetCol = data.target.col;

            console.log(`[LLM Bot ${this.playerNumber}] Suggested move:`);
            console.log(`  Piece: ${pieceId}`);
            console.log(`  Target: (${targetRow}, ${targetCol})`);
            console.log(`  Reasoning: ${data.reasoning}`);
            console.log(`  Cost: ${data.cost} | Tokens: ${data.tokens_used}`);

            // Find the piece
            const piece = this.game.pieces.get(pieceId);
            if (!piece) {
                console.error(`Piece not found: ${pieceId}`);
                await this.makeFallbackMove();
                return;
            }

            // Create move object
            const suggestedMove = {
                from: {
                    row: piece.row,
                    col: piece.col
                },
                to: {
                    row: targetRow,
                    col: targetCol
                }
            };

            // Validate move is legal
            const legalMoves = this.game.getLegalMoves();
            const matchingMove = legalMoves.find(m =>
                m.from.row === suggestedMove.from.row &&
                m.from.col === suggestedMove.from.col &&
                m.to.row === suggestedMove.to.row &&
                m.to.col === suggestedMove.to.col
            );

            if (!matchingMove) {
                console.warn(`LLM suggested an illegal move: ${pieceId} → (${targetRow},${targetCol})`);
                await this.makeFallbackMove();
                return;
            }

            // Execute the move
            if (this.game.executeMove(matchingMove)) {
                console.log(`✓ LLM Bot ${this.playerNumber} moved ${pieceId} → (${targetRow},${targetCol})`);
            } else {
                console.error("Failed to execute move in game engine");
                await this.makeFallbackMove();
            }

        } catch (error) {
            console.error("Network or parsing error:", error);
            await this.makeFallbackMove();
        }
    }

    /**
     * Fallback: make a random legal move if LLM fails
     */
    private async makeFallbackMove(): Promise<void> {
        const legalMoves = this.game.getLegalMoves();
        
        if (legalMoves.length === 0) {
            console.log(`Player ${this.playerNumber} has no legal moves`);
            return;
        }

        // Prefer capture moves
        const captureMoves = legalMoves.filter(m => m.capturedIds && m.capturedIds.length > 0);
        const moveToMake = captureMoves.length > 0 ? captureMoves[0] : legalMoves[0];

        if (this.game.executeMove(moveToMake)) {
            console.log(`[LLM Bot ${this.playerNumber}] Made fallback move (random legal move)`);
            console.log(`  From: (${moveToMake.from.row},${moveToMake.from.col})`);
            console.log(`  To: (${moveToMake.to.row},${moveToMake.to.col})`);
        }
    }
}