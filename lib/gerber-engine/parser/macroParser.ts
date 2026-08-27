import { ApertureMacro, MacroPrimitive } from "../types/gerber";
import { Point } from "../types/geometry";

export function parseApertureMacroBlock(macroBlock: string): ApertureMacro | null {
  // e.g. %AMMACRO_NAME*1,1,1.5,0,0*21,1,0.5,0.8,0,0,45*%
  const clean = macroBlock.replace(/%/g, "").trim();
  if (!clean.startsWith("AM")) return null;

  const lines = clean.slice(2).split("*").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const name = lines[0];
  const primitives: MacroPrimitive[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("$")) continue; // Skip variable assignments for basic macro parsing

    const tokens = line.split(",").map((t) => parseFloat(t));
    if (tokens.length > 0 && !isNaN(tokens[0])) {
      primitives.push({
        type: tokens[0],
        params: tokens.slice(1)
      });
    }
  }

  return {
    name,
    primitives,
    raw: macroBlock
  };
}

export function evaluateMacroGeometry(
  macro: ApertureMacro,
  center: Point,
  modifiers: number[],
  unitScale: number = 1.0
) {
  const resultPrimitives: Array<{
    type: string;
    points?: Point[];
    center?: Point;
    radius?: number;
    width?: number;
    height?: number;
  }> = [];

  for (const prim of macro.primitives) {
    const p = prim.params;
    switch (prim.type) {
      case 1: {
        // Circle: 1, exposure, diameter, center_x, center_y, rotation
        const exposure = p[0] ?? 1;
        const diam = (p[1] ?? 1.0) * unitScale;
        const cx = center.x + (p[2] ?? 0) * unitScale;
        const cy = center.y + (p[3] ?? 0) * unitScale;
        if (exposure !== 0) {
          resultPrimitives.push({
            type: "circle",
            center: { x: cx, y: cy },
            radius: diam / 2
          });
        }
        break;
      }
      case 20: {
        // Vector Line: 20, exposure, width, start_x, start_y, end_x, end_y, rotation
        const exposure = p[0] ?? 1;
        const width = (p[1] ?? 0.1) * unitScale;
        const sx = center.x + (p[2] ?? 0) * unitScale;
        const sy = center.y + (p[3] ?? 0) * unitScale;
        const ex = center.x + (p[4] ?? 0) * unitScale;
        const ey = center.y + (p[5] ?? 0) * unitScale;
        if (exposure !== 0) {
          resultPrimitives.push({
            type: "line",
            points: [
              { x: sx, y: sy },
              { x: ex, y: ey }
            ],
            width
          });
        }
        break;
      }
      case 21: {
        // Center Line: 21, exposure, width, height, center_x, center_y, rotation
        const exposure = p[0] ?? 1;
        const w = (p[1] ?? 1.0) * unitScale;
        const h = (p[2] ?? 1.0) * unitScale;
        const cx = center.x + (p[3] ?? 0) * unitScale;
        const cy = center.y + (p[4] ?? 0) * unitScale;
        if (exposure !== 0) {
          resultPrimitives.push({
            type: "rect",
            center: { x: cx, y: cy },
            width: w,
            height: h
          });
        }
        break;
      }
      case 4: {
        // Outline: 4, exposure, n_points, x1, y1, x2, y2, ... rotation
        const exposure = p[0] ?? 1;
        const nPoints = p[1] ?? 0;
        const pts: Point[] = [];
        for (let idx = 0; idx < nPoints * 2; idx += 2) {
          const px = center.x + (p[2 + idx] ?? 0) * unitScale;
          const py = center.y + (p[3 + idx] ?? 0) * unitScale;
          pts.push({ x: px, y: py });
        }
        if (exposure !== 0 && pts.length > 2) {
          resultPrimitives.push({
            type: "polygon",
            points: pts
          });
        }
        break;
      }
      default: {
        // Fallback for polygon/circle
        const diam = (modifiers[0] || p[1] || 1.0) * unitScale;
        resultPrimitives.push({
          type: "circle",
          center,
          radius: diam / 2
        });
        break;
      }
    }
  }

  return resultPrimitives;
}
