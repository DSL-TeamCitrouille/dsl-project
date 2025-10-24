import type { Damier, Piece } from 'dam-dam-language';
import * as fs from 'node:fs';
import { extractDestinationAndName } from './util.js';

/**
 * Generates HTML board visualization from the Damier (game) model
 */
export function generateOutput(
  model: Damier,
  source: string,
  destination: string
): string {
  const data = extractDestinationAndName(destination);

  const htmlContent = generateBoardHTML(model);

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }

  fs.writeFileSync(destination, htmlContent);
  return destination;
}

/**
 * Generate HTML with interactive board and pieces
 */
function generateBoardHTML(model: Damier): string {
  const boardSize = model.board.size;
  const pieces = model.pieces.piece;
  const theme = model.ui?.theme;

  const lightColor = theme?.lightSquares || '#f0d9b5';
  const darkColor = theme?.darkSquares || '#b58863';
  const highlightColor = theme?.highlight || '#ffeb3b';

  const boardHTML = generateBoard(boardSize, pieces, lightColor, darkColor);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${model.name} - Board</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .game-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 900px;
            width: 100%;
        }

        .game-header {
            text-align: center;
            margin-bottom: 30px;
        }

        .game-header h1 {
            color: #1e3c72;
            font-size: 2.2em;
            margin-bottom: 8px;
        }

        .game-header p {
            color: #666;
            font-size: 1em;
        }

        .board-wrapper {
            display: flex;
            gap: 40px;
            flex-wrap: wrap;
            justify-content: center;
            align-items: flex-start;
        }

        .board-container {
            flex: 0 0 auto;
        }

        .board {
            display: inline-grid;
            grid-template-columns: repeat(${boardSize}, 1fr);
            gap: 0;
            border: 4px solid #333;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .square {
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            cursor: pointer;
            transition: all 0.2s ease;
            user-select: none;
        }

        .square.light {
            background-color: ${lightColor};
        }

        .square.dark {
            background-color: ${darkColor};
        }

        .square:hover {
            background-color: ${highlightColor} !important;
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
        }

        .square.playable {
            box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
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
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3);
            border: 2px solid rgba(0, 0, 0, 0.2);
            font-size: 1.1em;
            transition: transform 0.2s;
        }

        .square:hover .piece {
            transform: scale(1.1);
        }

        .piece.white {
            background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
            color: #333;
        }

        .piece.black {
            background: linear-gradient(135deg, #333333 0%, #1a1a1a 100%);
            color: white;
        }

        @media (max-width: 768px) {
            .game-container {
                padding: 20px;
            }

            .board-wrapper {
                gap: 20px;
                flex-direction: column;
                align-items: center;
            }

            .sidebar {
                min-width: auto;
                width: 100%;
                flex-direction: row;
                flex-wrap: wrap;
            }

            .info-card {
                flex: 1;
                min-width: 150px;
            }

            .square {
                width: 40px;
                height: 40px;
            }

            .piece {
                width: 32px;
                height: 32px;
                font-size: 0.9em;
            }

            .game-header h1 {
                font-size: 1.6em;
            }
        }
    </style>
</head>
<body>
    <div class="game-container">
        <div class="game-header">
            <h1>🎮 ${model.name}</h1>
        </div>

        <div class="board-wrapper">
            <div class="board-container">
                <div class="board">
                    ${boardHTML}
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// ============= Helper Functions =============

function generateBoard(
  size: number,
  pieces: Piece[],
  lightColor: string,
  darkColor: string
): string {
  let html = '';
  const piecesPlaced = placePieces(size, pieces);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const isPlayable = (row + col) % 2 === 1;
      const squareClass = isPlayable ? 'dark playable' : 'light';
      const squareId = `square-${row}-${col}`;

      const piece = piecesPlaced.get(`${row}-${col}`);

      html += `<div class="square ${squareClass}" id="${squareId}">`;
      if (piece) {
        html += `<div class="piece ${piece.color}" title="${piece.name}"></div>`;
      }
      html += `</div>`;
    }
  }

  return html;
}

function placePieces(
  boardSize: number,
  pieces: Piece[]
): Map<string, { name: string; color: string }> {
  const placed = new Map<string, { name: string; color: string }>();

  // Get pieces by color to place them on correct sides
  const whitePiece = pieces.find(p => p.color.toLowerCase() === 'white');
  const blackPiece = pieces.find(p => p.color.toLowerCase() === 'black');

  // Place white pieces on top (first 3 rows, dark squares only)
  if (whitePiece) {
    let piecesPlaced = 0;
    for (let row = 0; row < 3 && piecesPlaced < whitePiece.quantity; row++) {
      for (let col = 0; col < boardSize && piecesPlaced < whitePiece.quantity; col++) {
        if ((row + col) % 2 === 1) {
          placed.set(`${row}-${col}`, {
            name: whitePiece.name,
            color: whitePiece.color,
          });
          piecesPlaced++;
        }
      }
    }
  }

  // Place black pieces on bottom (last 3 rows, dark squares only)
  if (blackPiece) {
    let piecesPlaced = 0;
    for (let row = boardSize - 3; row < boardSize && piecesPlaced < blackPiece.quantity; row++) {
      for (let col = 0; col < boardSize && piecesPlaced < blackPiece.quantity; col++) {
        if ((row + col) % 2 === 1) {
          placed.set(`${row}-${col}`, {
            name: blackPiece.name,
            color: blackPiece.color,
          });
          piecesPlaced++;
        }
      }
    }
  }

  return placed;
}