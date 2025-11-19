/// <reference lib="dom" />

/**
 * Bundled HTML Generator with Bot Support
 * FIXED: Use capturedIds from move generation instead of path walking
 */

import type { Damier, MoveRule } from 'dam-dam-language';

export function generateBundledHTML(model: Damier): string {
    const size = model.board.size;
    const moveRule = model.rules.rule.find((r: any): r is MoveRule => 'direction' in r);
    const playerRule = model.rules.rule.find((r: any): r is MoveRule => 'firstPlayer' in r);
    const direction = moveRule?.direction || 'any';
    const dice = model.dice;

    // Map firstPlayer to player index
    let firstPlayerIndex = 0;
    if (playerRule?.firstPlayer) {
        const firstPlayerName = playerRule.firstPlayer;
        // Find the index of the piece with matching color/name
        const pieceIndex = model.pieces.piece.findIndex((p: any) =>
            p.name?.toLowerCase() === firstPlayerName?.toLowerCase() ||
            p.color?.toLowerCase() === firstPlayerName?.toLowerCase()
        );
        firstPlayerIndex = pieceIndex >= 0 ? pieceIndex : 0;
    }
    const firstPlayer = firstPlayerIndex;

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
    let diceHTML = dice ? generateDiceHTML(dice.faces) : '';
    if (dice) {
        diceHTML = `
        <div style="margin-left: 40px; min-width: 200px;">
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="color: #1e3c72; margin: 0 0 15px 0; text-align: center;">🎲 Dice</h3>
                <div style="text-align: center; margin-bottom: 15px;">
                    <div class="dice" data-faces="${dice.faces}" style="width: 40px; height: 40px; background: white; border: 3px solid #333; border-radius: 12px; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: transform 0.1s;">
                        🎲
                    </div>
                </div>
                <div class="dice-result"></div>
                <button class="throw-button" style="width: 100%; padding: 12px; font-size: 14px; border: none; border-radius: 6px; background: #FF9800; color: white; cursor: pointer; font-weight: bold; transition: all 0.2s;">
                    Throw Dice
                </button>
            </div>
        </div>
    `;
    }

    // Extract capture rule for mandatory capture
    const captureRule = model.rules.rule.find((r: any): r is any => 'mandatory' in r);
    const isCaptureManutory = captureRule?.mandatory ?? false;
    // Serialize game config
    const gameConfig = {
        boardSize: size,
        direction,
        firstPlayer,
        pieces: model.pieces.piece.map((p: any) => ({
            name: p.name,
            color: p.color,
            quantity: p.quantity,
        })),
        dice: dice ? { faces: dice.faces } : null,
        isCaptureManutory,
    };

    function generateDiceHTML(faces: number): string {
        return `
    <div class="dice-container">
        <h3 style="color: #1e3c72; margin: 0;">🎲 Dice</h3>
        <div class="dice-display">
            <div class="dice" data-faces="${faces}">
            </div>
        </div>
        <div class="dice-result"></div>
        <button class="throw-button">Throw Dice</button>
    </div>
  `;
    }

    const configJson = JSON.stringify(gameConfig);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${model.name} - With Bot</title>
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
            max-width: 1200px;
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

        .square.legalmoves {
            box-shadow: inset 0 0 10px rgba(218, 76, 253, 0.8);
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

        .piece.queen::after {
            content: '👑';
            position: absolute;
            font-size: 16px;
            top: -2px;
            right: 0px;
        }

        .piece.queen {
            position: relative;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 8px rgba(255, 215, 0, 0.6);
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

        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }

        .reset-btn { 
            background: #4CAF50;
        }
        .reset-btn:hover { 
            background: #45a049;
        }
        
        .forfait-btn {
            background: #FF5722;
        }
        .forfait-btn:hover {
            background: #E64A19;
        }

        .bot-btn {
            background: #9C27B0;
        }
        .bot-btn:hover {
            background: #7B1FA2;
        }

        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            align-items: center;
            justify-content: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background-color: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
            from {
                transform: translateY(-50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .modal-content h2 {
            margin-bottom: 15px;
            color: #333;
            font-size: 22px;
        }

        .modal-content p {
            margin-bottom: 25px;
            color: #666;
            font-size: 16px;
        }

        .modal-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }

        .modal-buttons button {
            padding: 10px 25px;
            font-size: 14px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.2s ease;
        }

        .confirm-btn {
            background: #FF5722;
            color: white;
        }

        .confirm-btn:hover {
            background: #E64A19;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .cancel-btn {
            background: #757575;
            color: white;
        }

        .cancel-btn:hover {
            background: #616161;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .mode-selector {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-bottom: 15px;
        }

        .mode-btn {
            padding: 8px 16px;
            font-size: 13px;
            background: #eee;
            color: #333;
        }

        .mode-btn.active {
            background: #2196F3;
            color: white;
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

        .dice.rolling {
            animation: diceRoll 0.6s ease-in-out;
        }

        @keyframes diceRoll {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(90deg) scale(1.1); }
            50% { transform: rotate(180deg); }
            75% { transform: rotate(270deg) scale(1.1); }
        }

        .throw-button:hover {
            background: #F57C00 !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .throw-button:active {
            transform: translateY(0);
        }

        .throw-button:disabled {
            background: #ccc !important;
            cursor: not-allowed;
            transform: none;
        }
        
        .toggle-hints-btn {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-bottom: 15px;
            }

        .toggle-hints-btn:hover {
            background-color: rgba(218, 76, 253, 0.4);
        }

        .toggle-hints-btn.active {
            background-color: #da4cfd;
            color: white;
        }
    </style>
</head>
<body>
    <div class="board-wrapper">
        <div class="container">
            <h1>🎮 ${model.name}</h1>

            <div class="mode-selector">
                <button class="mode-btn active" data-mode="pvp">👥 Player vs Player</button>
                <button class="mode-btn" data-mode="pvb">🤖 Player vs Bot</button>
                <button class="mode-btn" data-mode="bvb">🤖🤖 Bot vs Bot</button>
            </div>
            <button class="toggle-hints-btn">💡 Aide</button>
            <div class="status">Loading...</div>
            <div style="display: flex; justify-content: flex-start; align-items: flex-start; gap: 20px;">
                <div class="board">${boardHTML}</div>
                <div class="dice-container">${diceHTML}</div>
            </div>

            <div class="controls">
                <button class="reset-btn">↻ Reset</button>
                <button class="bot-btn" style="display:none;">🤖 Bot Move</button>
                <button class="forfait-btn">🏳️ Forfait</button>
            </div>
            <!-- Forfait Confirmation Modal -->
            <div class="modal" id="forfaitModal">
                <div class="modal-content">
                    <h2>Forfait Confirmation</h2>
                    <p>Are you sure you want to forfait? You will lose the game.</p>
                    <div class="modal-buttons">
                        <button class="confirm-btn" id="confirmForfait">Yes, Forfait</button>
                        <button class="cancel-btn" id="cancelForfait">No, Continue</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>



    <script>
        // ===== GAME ENGINE (Embedded) =====
        class Game {
            constructor(boardSize, direction, pieces_config, firstPlayer = 0, diceConfig = null, isCaptureManutory = false) {
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
                            isQueen: false, // Add queen status
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

            getLegalMoves() {
                        if (this.pieces_config.length === 1) {
                    const moves = [];
                    this.pieces.forEach((piece) => {
                        moves.push(...this.getMovesForPiece(piece));
                    });
                    console.log("MOVES SOLO ", moves)
                    return moves;
                }

            const moves = [];
                this.pieces.forEach((piece) => {
                    if (piece.player === this.currentPlayer) {
                        moves.push(...this.getMovesForPiece(piece));
                    }
                });
                return moves;
            }

            getMovesForPiece(piece) {
                const moves = [];
                
                // First check for capture moves (jumps)
                const jumpMoves = this.getJumpMoves(piece, new Set());
                
                                // If capture is mandatory and this piece can capture, return ONLY capture moves
                if (this.isCaptureManutory && jumpMoves.length > 0) {
                    return jumpMoves; // Must capture if possible
                }
                
                // If capture is NOT mandatory, return captures along with regular moves
                // This gives the player freedom to choose
                if (jumpMoves.length > 0) {
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
                    let enemyPos = null;
                    
                    for (let distance = 1; distance <= maxDistance; distance++) {
                        const targetRow = piece.row + dr * distance;
                        const targetCol = piece.col + dc * distance;
                        const landRow = piece.row + dr * (distance + 1);
                        const landCol = piece.col + dc * (distance + 1);

                        if (landRow < 0 || landRow >= this.boardSize || landCol < 0 || landCol >= this.boardSize) {
                            break; // Out of bounds
                        }

                        const targetPiece = this.getPieceAt(targetRow, targetCol);
                        
                        if (targetPiece && (targetPiece.player !== piece.player  || this.pieces_config.length === 1 ) && !capturedIds.has(targetPiece.id)) {
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
                                    const jumpMove = {
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
                                const distBetweenEnemies = distance - Math.abs(enemyPos.row - piece.row) - 1;
                                
                                if (distBetweenEnemies > 0) {
                                    // There's a gap - this enemy can be captured
                                    const landingPiece = this.getPieceAt(landRow, landCol);
                                    
                                    if (!landingPiece) {
                                        const newCapturedIds = new Set(capturedIds);
                                        newCapturedIds.add(targetPiece.id);
                                        
                                        const jumpMove = {
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

            getPieceAt(row, col) {
                for (const piece of this.pieces.values()) {
                    if (piece.row === row && piece.col === col) return piece;
                }
                return null;
            }

            executeMove(move) {
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
                if (this.pieces_config.length !== 1){
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

            rollDice() {
                if (!this.diceConfig) return null;
                if (!this.mustRollDice) {
                    console.log("Already rolled dice for this turn!");
                    return null;
                }

                const result = Math.floor(Math.random() * this.diceConfig.faces) + 1;
                this.diceResult = result;
                this.movesRemaining = result;
                this.mustRollDice = false;
                
                console.log('Dice rolled: ' + result + '. You have ' + result + ' moves.');
                return result;
            }

            checkWin() {

                if (this.pieces_config.length === 1) {

                    const pieces = Array.from(this.pieces.values()).filter(p => p.player === 0);
                    
                    // Condition Solitaire : plus de pièces
                    if (pieces.length === 1) {
                        this.gameOver = true;
                        this.winner = 0;
                        return;
                    }

                    // Condition : plus de mouvements possibles
                    if (this.getLegalMoves(0).length === 0 && pieces.length !== 1) {
                        this.gameOver = true;
                        this.winner = null;
                        return;
                    }
                }
                else{
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

            forceEndGame() {
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

            reset() {
                this.pieces.clear();
                this.currentPlayer = this.firstPlayer;
                this.gameOver = false;
                this.winner = null;
                this.nextId = 0;
                this.diceResult = null;
                this.movesRemaining = 0;
                this.mustRollDice = this.diceConfig !== null;
                this.initBoard();
            }
        }

        // ===== BOT PLAYER =====
        class Bot {
            constructor(game, playerId) {
                this.game = game;
                this.playerId = playerId;
            }

            makeMove() {
                if (this.game.currentPlayer !== this.playerId || this.game.gameOver) {
                    return null;
                }

                const legalMoves = this.game.getLegalMoves();

                if (legalMoves.length === 0) {
                    console.log(\`Bot (Player \${this.playerId}) has no legal moves\`);
                    return null;
                }

                const randomIndex = Math.floor(Math.random() * legalMoves.length);
                const selectedMove = legalMoves[randomIndex];

                const success = this.game.executeMove(selectedMove);

                if (success) {
                    console.log(\`Bot (Player \${this.playerId}) played:\`, selectedMove);
                    return selectedMove;
                }

                return null;
            }

            async makeMoveWithDelay(delayMs = 500) {
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

        // ===== UI CONTROLLER =====
        class UI {
            constructor(game) {
                this.game = game;
                this.selected = null;
                this.mode = 'pvp'; // pvp, pvb, bvb
                this.bot1 = new Bot(game, 1);
                this.bot0 = new Bot(game, 0);
                this.isProcessing = false;
                this.stopBotLoop = false;
                this.showLegalMoves = true; 
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
                        this.selected = null;
                        this.render();
                        this.checkBotTurn();
                    });
                }

                const botBtn = document.querySelector('.bot-btn');
                if (botBtn) {
                    botBtn.addEventListener('click', async () => {
                        await this.triggerBotMove();
                    });
                }
                
                const toggleHintsBtn = document.querySelector('.toggle-hints-btn');
                if (toggleHintsBtn) {
                    toggleHintsBtn.classList.add('active'); // Actif par défaut
                    toggleHintsBtn.addEventListener('click', () => {
                        this.showLegalMoves = !this.showLegalMoves;
                        toggleHintsBtn.classList.toggle('active');
                        toggleHintsBtn.textContent = this.showLegalMoves ? '💡 Aide' : '💡 Aide (désactivée)';
                        this.render();
                    });
                }

                const forfaitBtn = document.querySelector('.forfait-btn');
                const forfaitModal = document.getElementById('forfaitModal');
                const confirmForfait = document.getElementById('confirmForfait');
                const cancelForfait = document.getElementById('cancelForfait');

                if (forfaitBtn) {
                    forfaitBtn.addEventListener('click', () => {
                        if (!this.game.gameOver) {
                            forfaitModal.classList.add('active');
                        }
                    });
                }

                if (confirmForfait) {
                    confirmForfait.addEventListener('click', () => {
                        this.stopBotLoop = true;
                        this.game.forceEndGame();
                        this.selected = null;
                        forfaitModal.classList.remove('active');
                        this.render();
                    });
                }

                if (cancelForfait) {
                    cancelForfait.addEventListener('click', () => {
                        forfaitModal.classList.remove('active');
                    });
                }

                const modeBtns = document.querySelectorAll('.mode-btn');
                modeBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const newMode = btn.dataset.mode;
                        this.setMode(newMode);
                    });
                });
            }

            setMode(newMode) {
                this.stopBotLoop = true;
                this.mode = newMode;
                this.game.reset();
                this.selected = null;
                
                const modeBtns = document.querySelectorAll('.mode-btn');
                modeBtns.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.mode === newMode);
                });

                const botBtn = document.querySelector('.bot-btn');
                if (botBtn) {
                    botBtn.style.display = newMode === 'pvb' ? 'inline-block' : 'none';
                }

                this.render();

                setTimeout(() => {
                    this.stopBotLoop = false;
                    this.checkBotTurn();
                }, 100);
            }

            async handleClick(e) {
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

            updateStatus(message) {
                const status = document.querySelector('.status');
                if (status) {
                    const originalMessage = status.textContent;
                    status.textContent = message;
                    setTimeout(() => {
                        this.render(); // Restore normal status
                    }, 2000);
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

            getPieceAt(row, col) {
                for (const piece of this.game.pieces.values()) {
                    if (piece.row === row && piece.col === col) return piece;
                }
                return null;
            }

            render() {
                
                let legalDestinations = [];
                if (this.selected && this.showLegalMoves) {
                    const allLegalMoves = this.game.getLegalMoves();
                    legalDestinations = allLegalMoves
                        .filter(m => 
                            m.from.row === this.selected.row && 
                            m.from.col === this.selected.col
                        )
                        .map(m => ({ row: m.to.row, col: m.to.col }));
                }

                const squares = document.querySelectorAll('.square');

                squares.forEach((sq) => {
                    const square = sq;
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
                        el.className = \`piece \${piece.color}\`;
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

                const status = document.querySelector('.status');
                const botBtn = document.querySelector('.bot-btn');
                const diceResult = document.querySelector('.dice-result');
                const throwButton = document.querySelector('.throw-button');
                
                if (status) {
                    if (this.game.gameOver) {
                        const winner = this.game.winner !== null ? this.game.winner + 1 : 'unknown';
                        const winnerName = this.mode === 'bvb' ? \`Bot \${winner}\` : 
                                         (this.mode === 'pvb' && this.game.winner === 1) ? 'Bot' : 
                                         \`Player \${winner}\`;
                        status.textContent = \`🎉 \${winnerName} wins!\`;
                    } else if (this.isProcessing) {
                        status.textContent = '🤖 Bot is thinking...';
                    } else {
                        const currentName = this.mode === 'bvb' ? \`Bot \${this.game.currentPlayer + 1}\` :
                                          (this.mode === 'pvb' && this.game.currentPlayer === 1) ? 'Bot' :
                                          \`Player \${this.game.currentPlayer + 1}\`;
                        if (this.game.diceConfig) {
                            if (this.game.mustRollDice) {
                                status.textContent = \`\${currentName}\'s turn - 🎲 Roll the dice!\`;
                            } else {
                                status.textContent = \`\${currentName}\'s turn - \${this.game.movesRemaining} move(s) left\`;
                            }
                        } else {
                            status.textContent = \`\${currentName}\'s turn\`;
                        }
                        
                    }
                }
                
                if (diceResult && this.game.diceConfig) {
                    if (this.game.diceResult !== null && !this.game.mustRollDice) {
                        diceResult.innerHTML = \`\
                            <div style="margin-top: 10px; padding: 8px; background: white; border-radius: 6px; font-weight: bold; color: #333;">
                                Result: \${this.game.diceResult}<br>
                                <span style="font-size: 12px; color: #666;">Moves left: \${this.game.movesRemaining}</span>
                            </div>
                        \`;
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

        // ===== INITIALIZE GAME =====
        const config = ${configJson};
        const diceConfig = config.dice || null;
        const game = new Game(config.boardSize, config.direction, config.pieces, config.firstPlayer, diceConfig, config.isCaptureManutory);
        const ui = new UI(game);

        let isRolling = false;

        function throwDice() {
            const diceElement = document.querySelector('.dice');
            const resultElement = document.querySelector('.dice-result');
            const button = document.querySelector('.throw-button');
            
            if (!diceElement || !resultElement || !button) return;
            if (isRolling) return;
            
            // Check if it's allowed to roll
            if (!game.mustRollDice || game.gameOver) {
                console.log("Cannot roll dice right now");
                return;
            }
            
            isRolling = true;
            button.disabled = true;
            resultElement.textContent = '';
            diceElement.textContent = '🎲';

            // Add rolling animation
            diceElement.classList.add('rolling');

            // Simulate dice roll
            setTimeout(() => {
                const result = game.rollDice();
                
                diceElement.classList.remove('rolling');
                diceElement.textContent = result.toString();
                
                resultElement.innerHTML = \`\
                    <div style="margin-top: 10px; padding: 8px; background: white; border-radius: 6px; font-weight: bold; color: #333;">
                        Result: \${result}<br>
                        <span style="font-size: 12px; color: #666;">You have \${result} move(s)</span>
                    </div>
                \`;
                
                isRolling = false;
                ui.render();
                
                // If bot's turn, trigger bot moves after dice roll
                if (ui.mode === 'pvb' && game.currentPlayer === 1) {
                    ui.checkBotTurn();
                } else if (ui.mode === 'bvb') {
                    ui.checkBotTurn();
                }
            }, 600);
        }

        // Attach event listener
        const throwButton = document.querySelector('.throw-button');
        if (throwButton) {
            throwButton.addEventListener('click', throwDice);
        }
    </script>
</body>
</html>`;
}