import { Game } from "./game.js";
import { UI } from "./ui.js";
import { setupDice } from "./dice.js";

declare global {
  interface Window {
    __GAME_CONFIG?: any;
  }
}

const cfg = (globalThis as any).__GAME_CONFIG;

if (!cfg) {
  console.error("Missing window.__GAME_CONFIG");
} else {
  const game = new Game(cfg.boardSize, cfg.direction, cfg.pieces, cfg.firstPlayer);
  new UI(game);
  setupDice();
}
