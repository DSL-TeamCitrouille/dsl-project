/// <reference lib="dom" />

/**
 * Bundled HTML Generator
 * Creates single self-contained HTML file with all code embedded
 * No server or external files needed!
 */

import type { Damier, MoveRule } from 'dam-dam-language';

export function generateBundledHTML(model: Damier): string {
  const size = model.board.size;
  const moveRule = model.rules.rule.find((r: any): r is MoveRule => 'direction' in r);
  const direction = moveRule?.direction || 'any';
  const theme = model.ui?.theme;

  const lightColor = theme?.lightSquares || '#f0d9b5';
  const darkColor = theme?.darkSquares || '#b58863';

  // Generate board HTML
  let boardHTML = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isDark = (r + c) % 2 === 1;
      const color = isDark ? darkColor : lightColor;
      boardHTML += `<div class="square" data-row="${r}" data-col="${c}" style="background-color: ${color};"></div>`;
    }
  }

  // Serialize game config
  const gameConfig = {
    boardSize: size,
    direction,
    pieces: model.pieces.piece.map((p: any) => ({
      name: p.name,
      color: p.color,
      quantity: p.quantity,
    })),
  };

  const configJson = JSON.stringify(gameConfig);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${model.name}</title>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }

        .container {
            text-align: center;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
        }

        h1 { 
            margin-bottom: 10px; 
            color: #333; 
            font-size: 28px;
        }

        .status {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #666;
            min-height: 24px;
        }

        .board {
            display: inline-grid;
            grid-template-columns: repeat(${size}, 50px);
            gap: 0;
            border: 3px solid #333;
            margin-bottom: 20px;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .square {
            width: 50px;
            height: 50px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: all 0.2s ease;
            user-select: none;
        }

        .square:hover { 
            filter: brightness(0.95);
        }

        .square.selected {
            box-shadow: inset 0 0 10px rgba(255, 200, 0, 0.8);
            background-color: rgba(255, 200, 0, 0.2) !important;
        }

        .piece {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease;
        }

        .square:hover .piece {
            transform: scale(1.1);
        }

        .piece.white { 
            background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
            color: #333; 
            border: 2px solid #333; 
        }
        .piece.black { 
            background: linear-gradient(135deg, #333333 0%, #1a1a1a 100%);
        }
        .piece.red { 
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
        }
        .piece.blue { 
            background: linear-gradient(135deg, #4ecdc4 0%, #44a5c2 100%);
        }
        .piece.green { 
            background: linear-gradient(135deg, #95de64 0%, #69db7c 100%);
            color: #333;
        }
        .piece.yellow { 
            background: linear-gradient(135deg, #ffd93d 0%, #ffec99 100%);
            color: #333;
        }

        .controls {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }

        button {
            padding: 10px 20px;
            font-size: 14px;
            border: none;
            border-radius: 6px;
            background: #2196F3;
            color: white;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.2s ease;
        }

        button:hover { 
            background: #1976D2;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        button:active {
            transform: translateY(0);
        }

        .reset-btn { 
            background: #4CAF50;
        }
        .reset-btn:hover { 
            background: #45a049;
        }

        @media (max-width: 600px) {
            .container {
                padding: 20px;
            }
            .board {
                margin-bottom: 15px;
            }
            .controls {
                gap: 8px;
            }
            button {
                padding: 8px 16px;
                font-size: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 ${model.name}</h1>
        <div class="status">Loading...</div>
        <div class="board">${boardHTML}</div>
        <div class="controls">
            <button class="reset-btn">↻ Reset</button>
        </div>
    </div>

    <script>
        // ===== GAME ENGINE (Embedded) =====
        class Game {
            constructor(boardSize, direction, pieces_config) {
                this.boardSize = boardSize;
                this.pieces = new Map();
                this.currentPlayer = 0;
                this.gameOver = false;
                this.winner = null;
                this.direction = direction;
                this.pieces_config = pieces_config;
                this.nextId = 0;
                this.initBoard();
            }

            initBoard() {
                for (let playerId = 0; playerId < this.pieces_config.length; playerId++) {
                    const cfg = this.pieces_config[playerId];
                    const positions = this.getStartPositions(playerId, cfg.quantity);
                    
                    for (const pos of positions) {
                        const piece = {
                            id: \`p\${this.nextId++}\`,
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

            getStartPositions(playerId, quantity) {
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

            getLegalMoves() {
                const moves = [];
                this.pieces.forEach((piece) => {
                    if (piece.player === this.currentPlayer) {
                        const pieceMoves = this.getMovesForPiece(piece);
                        if (pieceMoves.length > 0) {
                            pieceMoves.forEach(m => {
                                console.log('  Legal move:', piece.id, 'from', m.from, 'to', m.to, 'captures:', m.capturedIds ? m.capturedIds.length : 0);
                            });
                        }
                        moves.push(...pieceMoves);
                    }
                });
                console.log('TOTAL LEGAL MOVES:', moves.length);
                return moves;
            }

            getMovesForPiece(piece) {
                const moves = [];
                
                // First check for capture moves (jumps)
                const jumpMoves = this.getJumpMoves(piece, new Set());
                
                if (jumpMoves.length > 0) {
                    console.log('Found', jumpMoves.length, 'jump moves');
                    return jumpMoves; // Return all jumps (including chains)
                }
                
                console.log('No jumps available, showing normal moves');
                
                // Otherwise allow normal moves
                let dirs = this.direction === 'diagonal'
                    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
                    : this.direction === 'orthogonal'
                        ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
                        : [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

                // Filter based on direction type
                if (this.direction === 'diagonal') {
                    // Diagonal: only forward (no backward)
                    if (piece.player === 0) {
                        dirs = dirs.filter(([dr]) => dr > 0);
                    } else {
                        dirs = dirs.filter(([dr]) => dr < 0);
                    }
                } else if (this.direction === 'orthogonal') {
                    // Orthogonal: allow forward and sideways, but not backward
                    if (piece.player === 0) {
                        dirs = dirs.filter(([dr, dc]) => dr > 0 || dc !== 0);  // Forward or sideways
                    } else {
                        dirs = dirs.filter(([dr, dc]) => dr < 0 || dc !== 0);  // Forward or sideways
                    }
                }
                // else: all-directions mode, no filtering needed

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

                console.log('Returning', moves.length, 'normal moves');
                return moves;
            }

            getJumpMoves(piece, capturedIds, originalFrom = null) {
                // originalFrom keeps track of the ACTUAL piece starting position for chain jumps
                if (originalFrom === null) {
                    originalFrom = { row: piece.row, col: piece.col };
                }
                
                const moves = [];
                let dirs = this.direction === 'diagonal'
                    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
                    : this.direction === 'orthogonal'
                        ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
                        : [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

                // Filter based on direction type
                if (this.direction === 'diagonal') {
                    // Diagonal: only forward jumps
                    if (piece.player === 0) {
                        dirs = dirs.filter(([dr]) => dr > 0);
                    } else {
                        dirs = dirs.filter(([dr]) => dr < 0);
                    }
                } else if (this.direction === 'orthogonal') {
                    // Orthogonal: allow forward jumps and sideways jumps
                    if (piece.player === 0) {
                        dirs = dirs.filter(([dr, dc]) => dr > 0 || dc !== 0);  // Forward or sideways
                    } else {
                        dirs = dirs.filter(([dr, dc]) => dr < 0 || dc !== 0);  // Forward or sideways
                    }
                }
                // else: all-directions mode, no filtering needed

                for (const [dr, dc] of dirs) {
                    const targetRow = piece.row + dr;
                    const targetCol = piece.col + dc;
                    const landRow = piece.row + dr * 2;
                    const landCol = piece.col + dc * 2;

                    if (landRow < 0 || landRow >= this.boardSize || landCol < 0 || landCol >= this.boardSize) {
                        continue;
                    }

                    const targetPiece = this.getPieceAt(targetRow, targetCol);
                    
                    if (targetPiece && targetPiece.player !== piece.player && !capturedIds.has(targetPiece.id)) {
                        const landingPiece = this.getPieceAt(landRow, landCol);
                        
                        if (!landingPiece) {
                            const newCapturedIds = new Set(capturedIds);
                            newCapturedIds.add(targetPiece.id);
                            
                            // IMPORTANT: Use originalFrom, not piece.row/col!
                            const jumpMove = {
                                from: { row: originalFrom.row, col: originalFrom.col },
                                to: { row: landRow, col: landCol },
                                capturedIds: Array.from(newCapturedIds)
                            };
                            
                            moves.push(jumpMove);
                            
                            // Check for chain jumps from the new position
                            // Pass originalFrom through so chain jumps use it
                            const tempPiece = { ...piece, row: landRow, col: landCol };
                            const chainMoves = this.getJumpMoves(tempPiece, newCapturedIds, originalFrom);
                            
                            if (chainMoves.length > 0) {
                                moves.push(...chainMoves);
                            }
                        }
                    }
                }

                return moves;
            }

            getPieceAt(row, col) {
                for (const piece of this.pieces.values()) {
                    if (piece.row === row && piece.col === col) return piece;
                }
                return null;
            }

            executeMove(move) {
                // VALIDATE MOVE FIRST
                const legalMoves = this.getLegalMoves();
                const isLegal = legalMoves.some(m => 
                    m.from.row === move.from.row &&
                    m.from.col === move.from.col &&
                    m.to.row === move.to.row &&
                    m.to.col === move.to.col
                );
                
                if (!isLegal) {
                    console.log('Illegal move:', move);
                    return false;
                }

                const piece = this.getPieceAt(move.from.row, move.from.col);
                if (!piece) {
                    console.log('No piece at from position:', move.from);
                    return false;
                }

                // Check distance to determine if it's a jump
                const rowDist = Math.abs(move.to.row - move.from.row);
                const colDist = Math.abs(move.to.col - move.from.col);
                console.log('Move distance:', rowDist, colDist, 'from', move.from, 'to', move.to);

                if (rowDist > 1 || colDist > 1) {
                    // IT'S A JUMP - remove all pieces on the path
                    console.log('JUMP DETECTED');
                    
                    // Calculate step direction
                    const rowStep = move.to.row > move.from.row ? 1 : 
                                   move.to.row < move.from.row ? -1 : 0;
                    const colStep = move.to.col > move.from.col ? 1 : 
                                   move.to.col < move.from.col ? -1 : 0;
                    
                    console.log('Step direction:', rowStep, colStep);
                    
                    // Walk each square on the path
                    let row = move.from.row + rowStep;
                    let col = move.from.col + colStep;
                    
                    while (row !== move.to.row || col !== move.to.col) {
                        console.log('Checking path position:', row, col);
                        const pathPiece = this.getPieceAt(row, col);
                        
                        if (pathPiece) {
                            console.log('  Found piece:', pathPiece.id, 'player:', pathPiece.player);
                            if (pathPiece.player !== piece.player) {
                                this.pieces.delete(pathPiece.id);
                                console.log('  DELETED opponent piece');
                            } else {
                                console.log('  Own piece, kept');
                            }
                        } else {
                            console.log('  Empty square');
                        }
                        
                        // Move to next square
                        if (row !== move.to.row) row += rowStep;
                        if (col !== move.to.col) col += colStep;
                    }
                }

                // Move the piece
                console.log('Moving piece to destination');
                piece.row = move.to.row;
                piece.col = move.to.col;

                this.checkWin();
                if (!this.gameOver) {
                    this.currentPlayer = 1 - this.currentPlayer;
                    console.log('Turn switched to player:', this.currentPlayer);
                }
                return true;
            }

            checkWin() {
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

            reset() {
                this.pieces.clear();
                this.currentPlayer = 0;
                this.gameOver = false;
                this.winner = null;
                this.nextId = 0;
                this.initBoard();
            }
        }

        // ===== UI CONTROLLER (Embedded) =====
        class UI {
            constructor(game) {
                this.game = game;
                this.selected = null;
                console.log('UI initialized. Pieces:', this.game.pieces.size);
                this.setupEvents();
                this.render();
            }

            setupEvents() {
                const squares = document.querySelectorAll('.square');
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

            handleClick(e) {
                const target = e.target;
                const square = target?.closest?.('.square');
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
                        console.log('Selected piece:', clickedPiece.id, 'at', row, col);
                        this.render();
                    }
                } else {
                    // If clicking on another piece of same player => change selection
                    if (clickedPiece && clickedPiece.player === this.game.currentPlayer) {
                        this.selected = clickedPiece;
                        console.log('Changed selection to:', clickedPiece.id);
                        this.render();
                        return;
                    }

                    // Try to move
                    console.log('Attempting move from', this.selected.row, this.selected.col, 'to', row, col);
                    
                    const move = {
                        from: { row: this.selected.row, col: this.selected.col },
                        to: { row, col }
                    };

                    // Find the legal move that matches this destination
                    const legalMoves = this.game.getLegalMoves();
                    console.log('Legal moves available:', legalMoves.length);
                    
                    const matchingMove = legalMoves.find(m => 
                        m.from.row === move.from.row &&
                        m.from.col === move.from.col &&
                        m.to.row === move.to.row &&
                        m.to.col === move.to.col
                    );

                    if (matchingMove) {
                        console.log('Found matching move! From', matchingMove.from, 'to', matchingMove.to);
                        console.log('Captures:', matchingMove.capturedIds);
                    } else {
                        console.log('No matching move. Looking for from', move.from, 'to', move.to);
                        console.log('Available moves from this piece:');
                        legalMoves.forEach(m => {
                            if (m.from.row === move.from.row && m.from.col === move.from.col) {
                                console.log('  Can go to', m.to);
                            }
                        });
                    }

                    // Use the legal move (which has capturedIds if it's a jump)
                    const moveToExecute = matchingMove || move;

                    if (this.game.executeMove(moveToExecute)) {
                        this.selected = null;
                        this.render();
                    } else {
                        console.log('Move execution failed');
                    }
                }
            }

            getPieceAt(row, col) {
                for (const piece of this.game.pieces.values()) {
                    if (piece.row === row && piece.col === col) return piece;
                }
                return null;
            }

            render() {
                const squares = document.querySelectorAll('.square');
                
                squares.forEach((sq) => {
                    const rowStr = sq.getAttribute('data-row');
                    const colStr = sq.getAttribute('data-col');
                    
                    if (!rowStr || !colStr) return;
                    
                    const row = parseInt(rowStr, 10);
                    const col = parseInt(colStr, 10);

                    sq.innerHTML = '';
                    sq.classList.remove('selected');

                    const piece = this.getPieceAt(row, col);
                    if (piece) {
                        const el = document.createElement('div');
                        el.className = \`piece \${piece.color}\`;
                        el.textContent = piece.name[0].toUpperCase();
                        el.title = piece.name;
                        sq.appendChild(el);
                    }

                    if (this.selected && this.selected.row === row && this.selected.col === col) {
                        sq.classList.add('selected');
                    }
                });

                const status = document.querySelector('.status');
                if (status) {
                    if (this.game.gameOver) {
                        const winner = this.game.winner !== null ? this.game.winner + 1 : 'unknown';
                        status.textContent = \`🎉 Player \${winner} wins!\`;
                    } else {
                        status.textContent = \`Player \${this.game.currentPlayer + 1}'s turn\`;
                    }
                }
            }
        }

        // ===== INITIALIZE GAME =====
        const config = ${configJson};
        const game = new Game(config.boardSize, config.direction, config.pieces);
        new UI(game);
    </script>
</body>
</html>`;
}