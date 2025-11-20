// packages/cli/src/htmlGenerator.ts
import type { CaptureRule, Damier, MoveRule } from "dam-dam-language";

export function generateHTML(model: Damier): string {
    const size = model.board.size;
    const moveRule = model.rules.rule.find((r: any): r is MoveRule => 'direction' in r);
    const playerRule = model.rules.rule.find((r: any): r is MoveRule => 'firstPlayer' in r);
    const mandatoryRule = model.rules.rule.find((r: any): r is CaptureRule => 'mandatory' in r);
    const mandatoryCapture = mandatoryRule?.mandatory || false;
    const direction = moveRule?.direction || 'any';
    const theme = model.ui?.theme;
    const dice = model.dice;

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


    const lightColor = theme?.lightSquares || '#f0d9b5';
    const darkColor = theme?.darkSquares || '#b58863';

    let boardHTML = '';
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const isDark = (r + c) % 2 === 1;
                const color = isDark ? darkColor : lightColor;
                boardHTML += `<div class="square" data-row="${r}" data-col="${c}" style="background-color: ${color};"></div>`;
        
            }
    }

    let diceHTML = dice ? generateDiceHTML(dice.faces):'';
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

  // Serialize game config
    const gameConfig = {
        boardSize: size,
        direction,
        firstPlayer,
        mandatoryCapture,
        pieces: model.pieces.piece.map((p: any) => ({
            name: p.name,
            color: p.color,
            quantity: p.quantity,
        })),
        dice: dice ? { faces: dice.faces } : null,
    };

  const configJson = JSON.stringify(gameConfig);

  // Note: CSS is kept inline for simplicity.
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
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
            display: center;
            gap: 10px;
            justify-content: center;
            margin-bottom: 15px;
            }

        .toggle-hints-btn:hover {
            background-color: #1976D2;
        }

        .toggle-hints-btn.active {
            background-color: #2196F3;
            color: white;
        }

        .toggle-hints-btn {
            background-color: #eee;
            color: white;
        }
    </style>
</head>
<body>
  <div class="container">
        <h1>🎮 ${model.name}</h1>
        
        <div class="mode-selector">
            <button class="mode-btn active" data-mode="pvp">👥 Player vs Player</button>
            <button class="mode-btn" data-mode="pvb">🤖 Player vs Bot</button>
            <button class="mode-btn" data-mode="bvb">🤖🤖 Bot vs Bot</button>
        </div>
        <button class="toggle-hints-btn">💡 Aide</button>
        <div class="status">Loading...</div>
        <div style="display: flex; justify-content: center; align-items: flex-start; gap: 20px;">
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

  <script>
    window.__GAME_CONFIG = ${configJson};
  </script>
  <script type="module" src="./app.js"></script>
</body>
</html>`;
}