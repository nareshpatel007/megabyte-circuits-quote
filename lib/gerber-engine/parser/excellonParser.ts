import { DrillData, DrillHole, DrillTool } from "../types/analysis";
import { BoundingBox } from "../types/geometry";

export function parseExcellonContent(content: string, filename: string = "drill.drl"): DrillData {
  let unit: "mm" | "in" = "mm";
  let unitScale = 1.0;
  let zeroSuppression: "leading" | "trailing" | "none" = "leading";
  let decimalPlaces = 3;
  let integerPlaces = 2;

  const toolsMap = new Map<number, DrillTool>();
  const holes: DrillHole[] = [];
  let currentTool: number | null = null;
  let slotsCount = 0;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  function updateBounds(x: number, y: number) {
    if (isNaN(x) || isNaN(y)) return;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  function parseCoordValue(valStr: string): number {
    if (valStr.includes(".")) {
      return parseFloat(valStr) * unitScale;
    }
    const isNeg = valStr.startsWith("-");
    const digits = valStr.replace(/^[+-]/, "");
    
    // Default 2.3 for inch, 3.2 or 3.3 for mm
    const totalDigits = integerPlaces + decimalPlaces;
    const padded = digits.padStart(totalDigits, "0");
    const intPart = padded.slice(0, padded.length - decimalPlaces) || "0";
    const decPart = padded.slice(padded.length - decimalPlaces);

    const parsed = parseFloat(`${isNeg ? "-" : ""}${intPart}.${decPart}`);
    return parsed * unitScale;
  }

  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim().toUpperCase();
    if (!trimmed || trimmed.startsWith(";") || trimmed.startsWith("%")) continue;

    // Unit directives
    if (trimmed.includes("METRIC")) {
      unit = "mm";
      unitScale = 1.0;
      decimalPlaces = 3;
      integerPlaces = 3;
    } else if (trimmed.includes("INCH")) {
      unit = "in";
      unitScale = 25.4;
      decimalPlaces = 4;
      integerPlaces = 2;
    }

    // Tool Definition: e.g., T1C0.8000 or T01C0.032
    if (trimmed.startsWith("T") && trimmed.includes("C")) {
      const toolMatch = trimmed.match(/T(\d+)C([\d.]+)/);
      if (toolMatch) {
        const toolNumber = parseInt(toolMatch[1], 10);
        let diameter = parseFloat(toolMatch[2]);
        // If no decimal point, assume based on unit
        if (!toolMatch[2].includes(".")) {
          diameter = diameter / Math.pow(10, decimalPlaces);
        }
        diameter = diameter * unitScale;

        toolsMap.set(toolNumber, {
          toolNumber,
          diameter,
          count: 0,
          plated: true
        });
      }
      continue;
    }

    // Tool Change e.g. T01 or T1
    if (/^T\d+$/.test(trimmed)) {
      const tNum = parseInt(trimmed.slice(1), 10);
      if (tNum > 0) {
        currentTool = tNum;
      }
      continue;
    }

    // Hole Coordinate e.g., X1234Y5678 or X12.34Y56.78
    const xMatch = trimmed.match(/X([+-]?\d+(?:\.\d+)?)/);
    const yMatch = trimmed.match(/Y([+-]?\d+(?:\.\d+)?)/);

    if (xMatch || yMatch) {
      if (currentTool !== null && toolsMap.has(currentTool)) {
        const tool = toolsMap.get(currentTool)!;
        const x = xMatch ? parseCoordValue(xMatch[1]) : 0;
        const y = yMatch ? parseCoordValue(yMatch[1]) : 0;

        holes.push({
          x,
          y,
          diameter: tool.diameter,
          plated: tool.plated !== false,
          toolNumber: currentTool
        });

        tool.count++;
        updateBounds(x, y);
      }
    }

    // Slots G85
    if (trimmed.includes("G85")) {
      slotsCount++;
    }
  }

  const tools = Array.from(toolsMap.values());
  const holeCount = holes.length;
  const diameters = tools.map((t) => t.diameter).filter((d) => d > 0);

  const minDiam = diameters.length ? Math.min(...diameters) : 0.3;
  const maxDiam = diameters.length ? Math.max(...diameters) : 1.0;

  const bounds: BoundingBox = {
    minX: isFinite(minX) ? minX : 0,
    minY: isFinite(minY) ? minY : 0,
    maxX: isFinite(maxX) ? maxX : 100,
    maxY: isFinite(maxY) ? maxY : 100,
    width: isFinite(maxX - minX) ? Math.max(maxX - minX, 1) : 100,
    height: isFinite(maxY - minY) ? Math.max(maxY - minY, 1) : 100
  };

  return {
    holes,
    tools,
    holeCount,
    minimumDiameter: Number(minDiam.toFixed(2)),
    maximumDiameter: Number(maxDiam.toFixed(2)),
    sizes: Array.from(new Set(diameters.map((d) => Number(d.toFixed(2))))).sort((a, b) => a - b),
    slotsCount,
    bounds
  };
}
