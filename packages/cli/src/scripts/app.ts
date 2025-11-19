import { Game } from "./game.js";
import { UI } from "./ui.js";

declare global {
  interface Window {
    __GAME_CONFIG?: any;
  }
}

const cfg = (globalThis as any).__GAME_CONFIG;

if (!cfg) {
  console.error("Missing window.__GAME_CONFIG");
} else {
  const diceConfig = cfg.dice || null;
  const game = new Game(cfg.boardSize, cfg.direction, cfg.pieces, cfg.firstPlayer, cfg.isCaptureManutory, diceConfig);
  const ui = new UI(game);

  // Setup dice functionality
  let isRolling = false;

  function throwDice() {
    const diceElement = document.querySelector('.dice') as HTMLElement;
    const resultElement = document.querySelector('.dice-result') as HTMLElement;
    const button = document.querySelector('.throw-button') as HTMLButtonElement;
    
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
      
      if (result !== null) {
        diceElement.classList.remove('rolling');
        diceElement.textContent = result.toString();
        
        resultElement.innerHTML = `
          <div style="margin-top: 10px; padding: 8px; background: white; border-radius: 6px; font-weight: bold; color: #333;">
            Result: ${result}<br>
            <span style="font-size: 12px; color: #666;">You have ${result} move(s)</span>
          </div>
        `;
      }
      
      isRolling = false;
      ui.render();
      
      // If bot's turn, trigger bot moves after dice roll
      ui.checkBotTurn();
    }, 600);
  }

  // Attach event listener
  const throwButton = document.querySelector('.throw-button');
  if (throwButton) {
    throwButton.addEventListener('click', throwDice);
  }
}