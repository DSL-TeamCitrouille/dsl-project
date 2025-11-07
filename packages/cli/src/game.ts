/**
 * Minimal Game Engine
 * Only what's needed to make games playable
 */

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  id: string;
  name: string;
  player: number;
  color: string;
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  capturedId?: string;
}

export class Game {
  boardSize: number;
  pieces: Map<string, Piece> = new Map();
  currentPlayer: number = 0;
  gameOver: boolean = false;
  winner: number | null = null;
  direction: string;
  pieces_config: any[];
  nextId: number = 0;

  constructor(boardSize: number, direction: string, pieces_config: any[]) {
    this.boardSize = boardSize;
    this.direction = direction;
    this.pieces_config = pieces_config;
    this.initBoard();
  }

  private initBoard(): void {
    for (let playerId = 0; playerId < this.pieces_config.length; playerId++) {
      const cfg = this.pieces_config[playerId];
      const positions = this.getStartPositions(playerId, cfg.quantity);
      
      for (const pos of positions) {
        const piece: Piece = {
          id: `p${this.nextId++}`,
          name: cfg.name,
          player: playerId,
          color: cfg.color,
          row: pos.row,
          col: pos.col,
        };
        this.pieces.set(piece.id, piece);
      }
    }
  }

  private getStartPositions(playerId: number, quantity: number): Position[] {
    const pos: Position[] = [];
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

  getLegalMoves(): Move[] {
    const moves: Move[] = [];
    this.pieces.forEach((piece) => {
      if (piece.player === this.currentPlayer) {
        moves.push(...this.getMovesForPiece(piece));
      }
    });
    return moves;
  }

  private getMovesForPiece(piece: Piece): Move[] {
    const moves: Move[] = [];
    
    // First check for capture moves (jumps)
    const jumpMoves = this.getJumpMoves(piece, new Set());
    if (jumpMoves.length > 0) {
      return jumpMoves; // If captures available, only return captures (mandatory)
    }
    
    // Otherwise allow normal moves
    const dirs =
      this.direction === 'diagonal'
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        : this.direction === 'orthogonal'
          ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
          : [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    for (const [dr, dc] of dirs) {
      const newRow = piece.row + dr;
      const newCol = piece.col + dc;

      if (newRow < 0 || newRow >= this.boardSize || newCol < 0 || newCol >= this.boardSize) {
        continue;
      }

      const targetPiece = this.getPieceAt(newRow, newCol);
      if (!targetPiece) {
        moves.push({ 
          from: { row: piece.row, col: piece.col }, 
          to: { row: newRow, col: newCol } 
        });
      }
    }

    return moves;
  }

  private getJumpMoves(piece: Piece, capturedIds: Set<string>): Move[] {
    const moves: Move[] = [];
    const dirs =
      this.direction === 'diagonal'
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        : this.direction === 'orthogonal'
          ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
          : [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    for (const [dr, dc] of dirs) {
      // Only allow forward movement (down the board for both players)
      // Player 0 moves forward (row increases), Player 1 moves forward (row decreases)
      const isForward = (piece.player === 0 && dr > 0) || (piece.player === 1 && dr < 0);
      
      if (!isForward) {
        continue; // Skip backward moves
      }

      // Look 2 squares away (jump distance)
      const targetRow = piece.row + dr;
      const targetCol = piece.col + dc;
      const landRow = piece.row + dr * 2;
      const landCol = piece.col + dc * 2;

      // Check if landing square is in bounds
      if (landRow < 0 || landRow >= this.boardSize || landCol < 0 || landCol >= this.boardSize) {
        continue;
      }

      const targetPiece = this.getPieceAt(targetRow, targetCol);
      
      // Check if there's an opponent piece to jump over
      if (targetPiece && targetPiece.player !== piece.player && !capturedIds.has(targetPiece.id)) {
        const landingPiece = this.getPieceAt(landRow, landCol);
        
        // Landing square must be empty
        if (!landingPiece) {
          const newCapturedIds = new Set(capturedIds);
          newCapturedIds.add(targetPiece.id);
          
          // Create jump move
          const jumpMove: Move = {
            from: { row: piece.row, col: piece.col },
            to: { row: landRow, col: landCol },
            capturedId: targetPiece.id,
          };
          
          moves.push(jumpMove);
          
          // Check for chain jumps (multi-jump)
          const tempPiece = { ...piece, row: landRow, col: landCol };
          const chainMoves = this.getJumpMoves(tempPiece, newCapturedIds);
          
          if (chainMoves.length > 0) {
            // If there are chain jumps, add them
            moves.push(...chainMoves);
          }
        }
      }
    }

    return moves;
  }

  private getPieceAt(row: number, col: number): Piece | null {
    for (const piece of this.pieces.values()) {
      if (piece.row === row && piece.col === col) return piece;
    }
    return null;
  }

  executeMove(move: Move): boolean {
    // VALIDATE MOVE FIRST
    const legalMoves = this.getLegalMoves();
    const isLegal = legalMoves.some(m => 
      m.from.row === move.from.row &&
      m.from.col === move.from.col &&
      m.to.row === move.to.row &&
      m.to.col === move.to.col
    );
    
    if (!isLegal) {
      console.log('Illegal move attempt');
      return false;
    }

    const piece = this.getPieceAt(move.from.row, move.from.col);
    if (!piece) return false;

    piece.row = move.to.row;
    piece.col = move.to.col;

    // Find and capture opponent piece if present
    const targetPiece = this.getPieceAt(move.to.row, move.to.col);
    if (targetPiece && targetPiece.id !== piece.id && targetPiece.player !== piece.player) {
      this.pieces.delete(targetPiece.id);
    }

    this.checkWin();
    if (!this.gameOver) this.currentPlayer = 1 - this.currentPlayer;
    return true;
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

  reset(): void {
    this.pieces.clear();
    this.currentPlayer = 0;
    this.gameOver = false;
    this.winner = null;
    this.nextId = 0;
    this.initBoard();
  }
}