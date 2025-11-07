/// <reference lib="dom" />

/**
 * Generate Playable HTML
 * Creates HTML that imports game.ts and ui.ts via ES modules
 * Requires server (http://) due to ES module imports
 */

import type { Damier, MoveRule } from 'dam-dam-language';
import './game.ts';
import './ui.ts';

export function generatePlayableHTML(model: Damier): string {
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

    <script type="module">
        import { Game } from './game.ts';
        import { UI } from './ui.ts';

        const config = ${configJson};
        const game = new Game(config.boardSize, config.direction, config.pieces);
        new UI(game);
    </script>
</body>
</html>`;
}