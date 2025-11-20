// ===== GAME ENGINE (Embedded) =====
export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  capturedIds?: string[];
}

export interface Piece {
  id: string;
  name: string;
  player: number;
  color: string;
  row: number;
  col: number;
  isQueen: boolean;
}

export class Game {
  boardSize: number;
  pieces: Map<string, Piece> = new Map();
  firstPlayer: number = 0;
  currentPlayer: number = 0;
  gameOver: boolean = false;
  winner: number | null = null;
  direction: string;
  pieces_config: any[];
  isCaptureManutory: boolean;
  nextId: number = 0;
  diceConfig: { faces: number } | null = null;
  diceResult: number | null = null;
  movesRemaining: number;
  mustRollDice: boolean;

  constructor(boardSize: number, direction: string, pieces_config: any[], firstPlayer: number = 0,  isCaptureManutory: boolean = false, diceConfig: { faces: number } | null = null) {
      this.boardSize = boardSize;
      this.pieces = new Map();
      this.firstPlayer = firstPlayer;
      this.currentPlayer = firstPlayer;
      this.gameOver = false;
      this.winner = null;
      this.direction = direction;
      this.pieces_config = pieces_config;
      this.isCaptureManutory = isCaptureManutory;
      this.nextId = 0;
      this.diceConfig = diceConfig;
      this.diceResult = null;
      this.movesRemaining = 0;
      this.mustRollDice = diceConfig !== null;
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
          isQueen: false,
        };
        this.pieces.set(piece.id, piece);
      }
    }
  }

  getStartPositions(playerId: number, quantity: number) {
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

    if (this.pieces_config.length === 1) {
      let placed = 0;
      for (let r = 0; r < size && placed < quantity; r++) {
        for (let c = 0; c < size && placed < quantity; c++) {
          pos.push({ row: r, col: c });
          placed++;
        }
      }
      return pos;
    }

    return pos;
  }

  getLegalMoves(): Move[] {
    if (this.pieces_config.length === 1) {
      const moves: Move[] = [];
      this.pieces.forEach((piece) => {
        moves.push(...this.getMovesForPiece(piece, false));
      });
      return moves;
    }

    const moves: Move[] = [];
    
    // If mandatory capture is enabled, check if ANY piece can capture
    if (this.isCaptureManutory) {
      let hasAnyCaptures = false;
      
      // First pass: check if any piece can capture
      this.pieces.forEach((piece) => {
        if (piece.player === this.currentPlayer) {
          const jumpMoves = this.getJumpMoves(piece, new Set());
          if (jumpMoves.length > 0) {
            hasAnyCaptures = true;
          }
        }
      });
      
      // Second pass: if captures exist, only return capture moves; otherwise return all moves
      this.pieces.forEach((piece) => {
        if (piece.player === this.currentPlayer) {
          if (hasAnyCaptures) {
            // Only add capture moves if any captures are available
            const jumpMoves = this.getJumpMoves(piece, new Set());
            moves.push(...jumpMoves);
          } else {
            // No captures available, add all moves (regular non-capture moves)
            moves.push(...this.getMovesForPiece(piece, true));
          }
        }
      });
    } else {
      // No mandatory capture rule, proceed normally
      this.pieces.forEach((piece) => {
        if (piece.player === this.currentPlayer) {
          moves.push(...this.getMovesForPiece(piece, false));
        }
      });
    }
    
    return moves;
  }

  getMovesForPiece(piece: Piece, skipJumps: boolean = false) {
    const moves = [];
    
    // First check for capture moves (jumps)
    const jumpMoves = this.getJumpMoves(piece, new Set());
    
    // If we should skip jump checking (when called from getLegalMoves with no captures), don't add them
    if (!skipJumps && jumpMoves.length > 0) {
        moves.push(...jumpMoves); // Add all jumps
    }
    
    // Otherwise allow normal moves
    let dirs = this.direction === 'diagonal'
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        : this.direction === 'orthogonal'
            ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
            : [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    // Filter based on direction type and piece type
    if (this.direction === 'diagonal' && this.pieces_config.length !== 1) {
        // Diagonal: only forward for normal pieces, all diagonal for queens
        if (!piece.isQueen) {
            if (piece.player === 0) {
                dirs = dirs.filter(([dr]) => dr > 0);
            } else {
                dirs = dirs.filter(([dr]) => dr < 0);
            }
        }
    } else if (this.direction === 'orthogonal' && this.pieces_config.length !== 1) {
        // Orthogonal: allow forward and sideways for normal pieces, all for queens
        if (!piece.isQueen) {
            if (piece.player === 0) {
                dirs = dirs.filter(([dr, dc]) => dr > 0 || dc !== 0);
            } else {
                dirs = dirs.filter(([dr, dc]) => dr < 0 || dc !== 0);
            }
        }
    }
    // else: all-directions mode, no filtering needed
    
    if (this.pieces_config.length === 1) {
        dirs = [];
    }

    for (const [dr, dc] of dirs) {
        // Queens can move multiple squares, regular pieces only move 1 square
        const maxDistance = piece.isQueen ? this.boardSize : 1;
        
        for (let distance = 1; distance <= maxDistance; distance++) {
            const newRow = piece.row + dr * distance;
            const newCol = piece.col + dc * distance;

            if (newRow < 0 || newRow >= this.boardSize || newCol < 0 || newCol >= this.boardSize) {
                break; // Out of bounds, stop searching in this direction
            }

            const targetPiece = this.getPieceAt(newRow, newCol);
            if (!targetPiece) {
                moves.push({ 
                    from: { row: piece.row, col: piece.col }, 
                    to: { row: newRow, col: newCol } 
                });
            } else {
                break; // Hit a piece, can't continue in this direction (without capturing)
            }
        }
    }

    return moves;
  }

  getJumpMoves(piece: Piece, capturedIds: Set<string>, originalFrom: Position | null = null): Move[] {
    // originalFrom keeps track of the ACTUAL piece starting position for chain jumps
    if (originalFrom === null) {
        originalFrom = { row: piece.row, col: piece.col };
    }
      
    const moves: Move[] = [];
    let dirs = this.direction === 'diagonal'
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : this.direction === 'orthogonal'
        ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
        : [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    // Filter based on direction type and piece type
    if (this.direction === 'diagonal') {
        // Diagonal: only forward for normal pieces, all diagonal for queens
        if (!piece.isQueen) {
            if (piece.player === 0) {
                dirs = dirs.filter(([dr]) => dr > 0);
            } else {
                dirs = dirs.filter(([dr]) => dr < 0);
            }
        }
    } else if (this.direction === 'orthogonal') {
        // Orthogonal: allow forward jumps for normal pieces, all for queens
        if (!piece.isQueen && this.pieces_config.length !== 1) {
            if (piece.player === 0) {
                dirs = dirs.filter(([dr, dc]) => dr > 0 || dc !== 0);
            } else {
                dirs = dirs.filter(([dr, dc]) => dr < 0 || dc !== 0);
            }
        }
    }
    // else: all-directions mode, no filtering needed

      for (const [dr, dc] of dirs) {
          // For queens, check multiple jumps in the same direction
          // For normal pieces, only check one square away
          const maxDistance = piece.isQueen ? this.boardSize : 1;
          
          let foundEnemy = false;
          let enemyPos: { row: number; col: number } | null = null;
          
          for (let distance = 1; distance <= maxDistance; distance++) {
              const targetRow = piece.row + dr * distance;
              const targetCol = piece.col + dc * distance;
              const landRow = piece.row + dr * (distance + 1);
              const landCol = piece.col + dc * (distance + 1);

              if (landRow < 0 || landRow >= this.boardSize || landCol < 0 || landCol >= this.boardSize) {
                  break; // Out of bounds
              }

              const targetPiece = this.getPieceAt(targetRow, targetCol);
              
              if (targetPiece && (targetPiece.player !== piece.player || this.pieces_config.length === 1) && !capturedIds.has(targetPiece.id)) {
                  // Found an enemy piece
                  if (!foundEnemy) {
                      // First enemy found - this is the one we can potentially capture
                      foundEnemy = true;
                      enemyPos = { row: targetRow, col: targetCol };
                      
                      // Check if landing square is free
                      const landingPiece = this.getPieceAt(landRow, landCol);
                      
                      if (!landingPiece) {
                          const newCapturedIds = new Set(capturedIds);
                          newCapturedIds.add(targetPiece.id);
                          
                          // IMPORTANT: Use originalFrom, not piece.row/col!
                          const jumpMove: Move = {
                              from: { row: originalFrom.row, col: originalFrom.col },
                              to: { row: landRow, col: landCol },
                              capturedIds: Array.from(newCapturedIds)
                          };
                          
                          moves.push(jumpMove);
                          
                          // Check for chain jumps from the new position
                          const tempPiece = { ...piece, row: landRow, col: landCol };
                          const chainMoves = this.getJumpMoves(tempPiece, newCapturedIds, originalFrom);
                          
                          if (chainMoves.length > 0) {
                              moves.push(...chainMoves);
                          }
                      }
                  } else {
                      // Another enemy found - but we already found one earlier
                      // For queens: check if there's a gap between first enemy and this one
                      if (enemyPos) {
                          const distBetweenEnemies = distance - Math.abs(enemyPos.row - piece.row) - 1;
                          
                          if (distBetweenEnemies > 0) {
                              // There's a gap - this enemy can be captured
                              const landingPiece = this.getPieceAt(landRow, landCol);
                              
                              if (!landingPiece) {
                                  const newCapturedIds = new Set(capturedIds);
                                  newCapturedIds.add(targetPiece.id);
                                  
                                  const jumpMove: Move = {
                                      from: { row: originalFrom.row, col: originalFrom.col },
                                      to: { row: landRow, col: landCol },
                                      capturedIds: Array.from(newCapturedIds)
                                  };
                                  
                                  moves.push(jumpMove);
                                  
                                  const tempPiece = { ...piece, row: landRow, col: landCol };
                                  const chainMoves = this.getJumpMoves(tempPiece, newCapturedIds, originalFrom);
                                  
                                  if (chainMoves.length > 0) {
                                      moves.push(...chainMoves);
                                  }
                              }
                          }
                      }
                      // If no gap, skip this enemy and continue
                  }
              } else if (targetPiece && targetPiece.player === piece.player) {
                  // Hit own piece, stop searching this direction
                  break;
              }
              // If empty square, continue searching
          }
      }

      return moves;
  }

    getPieceAt(row: number, col: number): Piece | null {
      for (const piece of this.pieces.values()) {
        if (piece.row === row && piece.col === col) return piece;
      }
      return null;
    }

    executeMove(move: Move): boolean {
      if (this.diceConfig && this.mustRollDice) {
        console.log("Must roll dice before moving!");
        return false;
      }

      if (this.diceConfig && this.movesRemaining <= 0) {
        console.log("No moves remaining! Roll the dice again.");
        return false;
      }

      // VALIDATE MOVE FIRST
      const legalMoves = this.getLegalMoves();
      const isLegal = legalMoves.some(m => 
          m.from.row === move.from.row &&
          m.from.col === move.from.col &&
          m.to.row === move.to.row &&
          m.to.col === move.to.col
      );
      
      if (!isLegal) {
          return false;
      }

      const piece = this.getPieceAt(move.from.row, move.from.col);
      if (!piece) {
          return false;
      }

      // SIMPLE FIX: If the move has capturedIds, remove those pieces
      // The move generation already calculated exactly which pieces to capture
      if (move.capturedIds && move.capturedIds.length > 0) {
          for (const capturedId of move.capturedIds) {
              this.pieces.delete(capturedId);
          }
      }

      // Move the piece
      piece.row = move.to.row;
      piece.col = move.to.col;

      // CHECK FOR QUEEN PROMOTION
      // Player 0 reaches bottom (last row), Player 1 reaches top (first row)
      if (this.pieces_config.length !== 1) {
          const isPromotionRow = (piece.player === 0 && piece.row === this.boardSize - 1) ||
                                  (piece.player === 1 && piece.row === 0);
          
          if (isPromotionRow && !piece.isQueen) {
              piece.isQueen = true;
          }
      }

      // Decrement moves remaining if using dice
      if (this.diceConfig) {
        this.movesRemaining--;
        
        // If no moves left, switch to next player
        if (this.movesRemaining <= 0) {
          this.checkWin();
          if (!this.gameOver) {
            if (this.pieces_config.length === 1) {
              this.currentPlayer = 0;
            } else {
              this.currentPlayer = 1 - this.currentPlayer;
            }
            this.mustRollDice = true;
            this.diceResult = null;
          }
        }
      } else {
        // Normal game without dice
        this.checkWin();
        if (!this.gameOver) {
            if (this.pieces_config.length === 1) {
                this.currentPlayer = 0;
            } else {
                this.currentPlayer = 1 - this.currentPlayer;
            }
        }
      }
      
      return true;
  }

  rollDice(): number | null {
    if (!this.diceConfig || typeof this.diceConfig.faces !== "number") {
        console.error("Invalid dice configuration");
        return null;
    }

    if (!this.mustRollDice) {
        console.log("Already rolled dice for this turn!");
        return null;
    }

    const result: number = Math.floor(Math.random() * this.diceConfig.faces) + 1;

    this.diceResult = result;        // doit être de type number | null
    this.movesRemaining = result;    // doit être de type number | null
    this.mustRollDice = false;

    console.log(`Dice rolled: ${result}. You have ${result} moves.`);
    return result;
}


    checkWin(): void {
        if (this.pieces_config.length === 1) {
            const pieces = Array.from(this.pieces.values()).filter(p => p.player === 0);
            
            // Condition Solitaire : plus de pièces
            if (pieces.length === 1) {
                this.gameOver = true;
                this.winner = 0;
                return;
            }

            // Condition : plus de mouvements possibles
            if (this.getLegalMoves().length === 0 && pieces.length !== 1) {
                this.gameOver = true;
                this.winner = null;
                return;
            }
        } else {
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
    }

    forceEndGame(): void {
        const p0Pieces = Array.from(this.pieces.values()).filter((p) => p.player === 0);
        const p1Pieces = Array.from(this.pieces.values()).filter((p) => p.player === 1);

        if (p0Pieces.length > p1Pieces.length) {
            this.winner = 0;
        } else if (p1Pieces.length > p0Pieces.length) {
            this.winner = 1;
        } else {
            // En cas d'égalité, c'est le joueur courant qui perd
            this.winner = 1 - this.currentPlayer;
        }
        
        this.gameOver = true;
    }

    reset(): void {
        this.pieces.clear();
        this.currentPlayer = this.firstPlayer;
        this.gameOver = false;
        this.winner = null;
        this.nextId = 0;
        this.initBoard();
        this.diceResult = null;
        this.movesRemaining = 0;
        this.mustRollDice = this.diceConfig !== null;
    }
}