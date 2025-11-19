// packages/cli/src/scripts/app.ts
import { Game } from "./game.js";
import { UI } from "./ui.js";

declare global {
  interface Window { __GAME_CONFIG?: any; }
}

const cfg = (globalThis as any).__GAME_CONFIG;
if (!cfg) {
  console.error("Missing window.__GAME_CONFIG");
} else {
  const game = new Game(cfg.boardSize, cfg.direction, cfg.pieces);
  new UI(game);
}