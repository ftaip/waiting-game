/**
 * Drawing primitives shared by every game's renderer.
 * Sprites are 1-bit `number[][]` arrays drawn at an integer scale via fillRect.
 */

export type Sprite = readonly (readonly number[])[];

export const PIXEL_SCALE = 2;

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale = PIXEL_SCALE,
) {
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      if (sprite[row][col]) {
        ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
      }
    }
  }
}

export function spriteSize(sprite: Sprite): { w: number; h: number } {
  return { w: sprite[0].length * PIXEL_SCALE, h: sprite.length * PIXEL_SCALE };
}
