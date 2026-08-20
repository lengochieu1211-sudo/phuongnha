/**
 * Camera frame helpers.
 *
 * RULE: Camera previews must preserve the source aspect ratio. We use "contain"
 * (letterbox/pillarbox) instead of stretching or center-cropping. This keeps
 * MediaPipe landmarks aligned with the visible person.
 */

export interface NormalizedContentRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getSourceSize(source: CanvasImageSource): { width: number; height: number } {
  const anySource = source as any;

  const width =
    Number(anySource.videoWidth) ||
    Number(anySource.naturalWidth) ||
    Number(anySource.width) ||
    1;

  const height =
    Number(anySource.videoHeight) ||
    Number(anySource.naturalHeight) ||
    Number(anySource.height) ||
    1;

  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
}

/**
 * Draw a camera/canvas/image into a destination canvas without distortion.
 * Returns the actual visible content rect in normalized destination coordinates.
 */
export function drawImageContain(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  destWidth: number,
  destHeight: number,
  mirror = false,
  background = '#000000',
): NormalizedContentRect {
  const dw = Math.max(1, destWidth);
  const dh = Math.max(1, destHeight);
  const src = getSourceSize(source);

  const scale = Math.min(dw / src.width, dh / src.height);
  const drawW = src.width * scale;
  const drawH = src.height * scale;
  const dx = (dw - drawW) * 0.5;
  const dy = (dh - drawH) * 0.5;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, dw, dh);

  if (mirror) {
    ctx.translate(dw, 0);
    ctx.scale(-1, 1);
  }

  // Because contain is centered, dx remains correct after whole-canvas mirroring.
  ctx.drawImage(source, dx, dy, drawW, drawH);
  ctx.restore();

  return {
    x: dx / dw,
    y: dy / dh,
    width: drawW / dw,
    height: drawH / dh,
  };
}

export function mapPointToContent(
  x: number,
  y: number,
  rect: NormalizedContentRect,
): { x: number; y: number } {
  return {
    x: rect.x + x * rect.width,
    y: rect.y + y * rect.height,
  };
}
