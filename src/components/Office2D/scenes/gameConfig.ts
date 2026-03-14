/**
 * Phaser game configuration for the Office 2D scene.
 * Extracted from Agent Town: components/game/config.ts
 */

import * as Phaser from "phaser";
import { OfficeScene } from "./OfficeScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./constants";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scene: [OfficeScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
};
