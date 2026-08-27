import { ApertureDefinition, ApertureMacro, GerberUnit, ParseStatistics, ParserWarning, Polarity } from "../types/gerber";
import { BoundingBox, Geometry, Point, PolarityBlock } from "../types/geometry";
import { evaluateMacroGeometry, parseApertureMacroBlock } from "./macroParser";

export interface ParsedGerberLayer {
  filename: string;
  unit: GerberUnit;
  apertures: Map<number, ApertureDefinition>;
  geometry: Geometry[];
  polarityBlocks: PolarityBlock[];
  bounds: BoundingBox;
  statistics: ParseStatistics;
  warnings: ParserWarning[];
}

export function parseGerberContent(content: string, filename: string = "unknown.gbr"): ParsedGerberLayer {
  let unit: GerberUnit = "mm";
  let unitScale = 1.0;
  let zeroSuppression: "leading" | "trailing" = "leading";
  let integerDigits = 2;
  let decimalDigits = 4;
  let isAbsolute = true;
  let polarity: Polarity = "dark";

  let currentX = 0;
  let currentY = 0;
  let currentAperture = 10;
  let currentInterpolation: "linear" | "cw" | "ccw" = "linear";
  let multiQuadrant = true;

  let inRegion = false;
  let regionContours: Point[][] = [];
  let currentContour: Point[] = [];

  const apertures = new Map<number, ApertureDefinition>();
  const macros = new Map<string, ApertureMacro>();
  const geometry: Geometry[] = [];
  const polarityBlocks: PolarityBlock[] = [];
  let currentBlockGeom: Geometry[] = [];
  let currentBlockPolarity: Polarity = "dark";


  const warnings: ParserWarning[] = [];

  let moveCount = 0;
  let drawCount = 0;
  let flashCount = 0;
  let arcCount = 0;
  let regionCount = 0;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  function addGeometry(geom: Geometry) {
    if (geom.polarity !== currentBlockPolarity) {
      if (currentBlockGeom.length > 0) {
        polarityBlocks.push({
          polarity: currentBlockPolarity,
          geometry: [...currentBlockGeom]
        });
        currentBlockGeom = [];
      }
      currentBlockPolarity = geom.polarity;
    }
    currentBlockGeom.push(geom);
    geometry.push(geom);
  }

  function updateBounds(x: number, y: number, padding: number = 0) {
    if (isNaN(x) || isNaN(y)) return;
    if (x - padding < minX) minX = x - padding;
    if (x + padding > maxX) maxX = x + padding;
    if (y - padding < minY) minY = y - padding;
    if (y + padding > maxY) maxY = y + padding;
  }

  function parseCoord(coordStr: string): number {
    if (coordStr.includes(".")) {
      return parseFloat(coordStr) * unitScale;
    }
    const isNeg = coordStr.startsWith("-");
    const cleanStr = coordStr.replace(/^[+-]/, "");

    let rawVal = 0;
    if (zeroSuppression === "trailing") {
      const padded = cleanStr.padEnd(integerDigits + decimalDigits, "0");
      const intPart = padded.slice(0, integerDigits) || "0";
      const decPart = padded.slice(integerDigits);
      rawVal = parseFloat(`${intPart}.${decPart}`);
    } else {
      // Default: Leading zero suppression
      rawVal = parseFloat(cleanStr) / Math.pow(10, decimalDigits);
    }

    const val = isNeg ? -rawVal : rawVal;
    return val * unitScale;
  }

  // Parse lines & block commands
  const blocks: string[] = [];
  let inPercentBlock = false;
  let percentBuffer = "";

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let starBuffer = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("G04") || trimmed.startsWith("G4")) continue;

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (char === "%") {
        if (inPercentBlock) {
          // End of percent block
          percentBuffer += "%";
          blocks.push(percentBuffer);
          percentBuffer = "";
          inPercentBlock = false;
        } else {
          // Start of percent block
          inPercentBlock = true;
          percentBuffer = "%";
        }
      } else if (inPercentBlock) {
        percentBuffer += char;
      } else {
        if (char === "*") {
          if (starBuffer.trim()) blocks.push(starBuffer.trim());
          starBuffer = "";
        } else {
          starBuffer += char;
        }
      }
    }
  }
  if (starBuffer.trim()) blocks.push(starBuffer.trim());


  for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
    const block = blocks[bIdx];
    if (!block) continue;

    // Header Directives %...%
    if (block.startsWith("%")) {
      const directive = block.replace(/%/g, "");

      // Units
      if (directive.includes("MOIN")) {
        unit = "in";
        unitScale = 25.4;
      } else if (directive.includes("MOMM")) {
        unit = "mm";
        unitScale = 1.0;
      }

      // Format Specifier e.g. %FSLAX24Y24*% or %FSTAX34Y34*%
      if (directive.startsWith("FS")) {
        if (directive.includes("T")) zeroSuppression = "trailing";
        else zeroSuppression = "leading";

        const match = directive.match(/X(\d)(\d)/i);
        if (match) {
          integerDigits = parseInt(match[1], 10);
          decimalDigits = parseInt(match[2], 10);
        }
      }

      // Aperture Macro Definition %AMMACRO_NAME*...%
      if (directive.startsWith("AM")) {
        const parsedMacro = parseApertureMacroBlock(block);
        if (parsedMacro) {
          macros.set(parsedMacro.name, parsedMacro);
        }
        continue;
      }

      // Aperture Definitions %ADD10C,0.1% or %ADD11R,1.0X2.0% or %ADD12MACRONAME*%
      if (directive.startsWith("ADD")) {
        const apMatch = directive.match(/ADD(\d+)([A-Z0-9_]+)(?:,(.+))?/i);
        if (apMatch) {
          const code = parseInt(apMatch[1], 10);
          const rawType = apMatch[2].toUpperCase();
          const paramStr = apMatch[3] || "";
          const params = paramStr.split("X").map((p) => parseFloat(p) * unitScale).filter((p) => !isNaN(p));

          if (["C", "R", "O", "P"].includes(rawType)) {
            apertures.set(code, { code, type: rawType as any, params });
          } else if (macros.has(rawType)) {
            apertures.set(code, {
              code,
              type: "M",
              params,
              macroName: rawType,
              macro: macros.get(rawType)
            });
          } else {
            apertures.set(code, { code, type: "C", params: [0.2 * unitScale] });
          }
        }
        continue;
      }

      // Polarity %LPD*% (Dark) or %LPC*% (Clear)
      if (directive.startsWith("LPD")) polarity = "dark";
      if (directive.startsWith("LPC")) polarity = "clear";

      continue;
    }

    // Standard Gerber Commands
    if (block.includes("G36")) {
      inRegion = true;
      regionContours = [];
      currentContour = [];
      continue;
    }
    if (block.includes("G37")) {
      inRegion = false;
      if (currentContour.length >= 3) {
        regionContours.push([...currentContour]);
      }
      const validContours = regionContours.filter((c) => c.length >= 3);
      if (validContours.length > 0) {
        regionCount++;
        addGeometry({
          type: "region",
          contours: validContours,
          polarity
        });
      }
      regionContours = [];
      currentContour = [];
      continue;
    }

    // Interpolation modes
    if (block.includes("G01") || block.includes("G1")) currentInterpolation = "linear";
    if (block.includes("G02") || block.includes("G2")) currentInterpolation = "cw";
    if (block.includes("G03") || block.includes("G3")) currentInterpolation = "ccw";
    if (block.includes("G74")) multiQuadrant = false;
    if (block.includes("G75")) multiQuadrant = true;

    // Aperture Select e.g. D10* or G54D10*
    const dSelectMatch = block.match(/(?:G54)?D(\d+)/i);
    if (dSelectMatch) {
      const code = parseInt(dSelectMatch[1], 10);
      if (code >= 10) {
        currentAperture = code;
        continue;
      }
    }

    // Coordinate & Draw Commands
    const hasX = /X[+-]?\d+/i.test(block);
    const hasY = /Y[+-]?\d+/i.test(block);
    const hasD = /D0?[123]/i.test(block);

    if (hasX || hasY || hasD) {
      let x = currentX;
      let y = currentY;
      let iVal = 0;
      let jVal = 0;

      const xMatch = block.match(/X([+-]?\d+(?:\.\d+)?)/i);
      if (xMatch) x = parseCoord(xMatch[1]);

      const yMatch = block.match(/Y([+-]?\d+(?:\.\d+)?)/i);
      if (yMatch) y = parseCoord(yMatch[1]);

      const iMatch = block.match(/I([+-]?\d+(?:\.\d+)?)/i);
      if (iMatch) iVal = parseCoord(iMatch[1]);

      const jMatch = block.match(/J([+-]?\d+(?:\.\d+)?)/i);
      if (jMatch) jVal = parseCoord(jMatch[1]);

      let dCode = 2; // Default to move if not specified
      const dMatch = block.match(/D0?([123])/i);
      if (dMatch) dCode = parseInt(dMatch[1], 10);

      if (dCode === 2) {
        // D02: Move
        moveCount++;
        currentX = x;
        currentY = y;
        updateBounds(x, y);
        if (inRegion) {
          if (currentContour.length >= 3) {
            regionContours.push([...currentContour]);
          }
          currentContour = [{ x, y }];
        }
      } else if (dCode === 1) {
        // D01: Draw / Interpolate
        drawCount++;
        const startPoint: Point = { x: currentX, y: currentY };
        const endPoint: Point = { x, y };

        const apDef = apertures.get(currentAperture);
        const width = apDef?.params[0] || 0.1;

        if (inRegion) {
          if (currentContour.length === 0) {
            currentContour.push(startPoint);
          }

          if (currentInterpolation === "linear") {
            currentContour.push(endPoint);
          } else {
            // Arc boundary in region mode: Subdivide arc into polyline vertices
            const cx = currentX + iVal;
            const cy = currentY + jVal;
            const radius = Math.hypot(iVal, jVal) || 0.1;
            const startAngle = Math.atan2(currentY - cy, currentX - cx);
            let endAngle = Math.atan2(y - cy, x - cx);

            if (currentInterpolation === "cw" && endAngle > startAngle) endAngle -= Math.PI * 2;
            if (currentInterpolation === "ccw" && endAngle < startAngle) endAngle += Math.PI * 2;

            const steps = 12;
            for (let step = 1; step <= steps; step++) {
              const ang = startAngle + (endAngle - startAngle) * (step / steps);
              const px = cx + radius * Math.cos(ang);
              const py = cy + radius * Math.sin(ang);
              currentContour.push({ x: px, y: py });
              updateBounds(px, py);
            }
          }
        } else if (currentInterpolation === "linear") {

          addGeometry({
            type: "line",
            start: startPoint,
            end: endPoint,
            width,
            polarity
          });
        } else {
          // Circular Arc
          arcCount++;
          const cx = currentX + iVal;
          const cy = currentY + jVal;
          const radius = Math.hypot(iVal, jVal) || 0.1;

          const startAngle = Math.atan2(currentY - cy, currentX - cx);
          const endAngle = Math.atan2(y - cy, x - cx);

          addGeometry({
            type: "arc",
            start: startPoint,
            end: endPoint,
            center: { x: cx, y: cy },
            radius,
            startAngle,
            endAngle,
            clockwise: currentInterpolation === "cw",
            width,
            polarity
          });
        }

        updateBounds(x, y, width / 2);
        currentX = x;
        currentY = y;
      } else if (dCode === 3) {
        // D03: Flash aperture
        flashCount++;
        currentX = x;
        currentY = y;

        const apDef = apertures.get(currentAperture);
        if (apDef) {
          if (apDef.type === "M" && apDef.macro) {
            const macroGeom = evaluateMacroGeometry(apDef.macro, { x, y }, apDef.params, unitScale);
            addGeometry({
              type: "flash",
              point: { x, y },
              apertureCode: apDef.code,
              shape: "macro",
              size: { width: 1.0, height: 1.0 },
              polarity,
              macroPrimitives: macroGeom
            });
            updateBounds(x, y, 1.0);
          } else {
            const shapeMap: Record<string, "circle" | "rect" | "obround" | "polygon"> = {
              C: "circle",
              R: "rect",
              O: "obround",
              P: "polygon"
            };

            const shape = shapeMap[apDef.type] || "circle";
            const width = apDef.params[0] || 0.2;
            const height = apDef.params[1] || width;

            addGeometry({
              type: "flash",
              point: { x, y },
              apertureCode: apDef.code,
              shape,
              size: { width, height, radius: width / 2 },
              polarity
            });
            updateBounds(x, y, Math.max(width, height) / 2);
          }
        }
      }
    }
  }

  // Push trailing block
  if (currentBlockGeom.length > 0) {
    polarityBlocks.push({
      polarity: currentBlockPolarity,
      geometry: [...currentBlockGeom]
    });
  }

  const bounds: BoundingBox = {
    minX: isFinite(minX) ? minX : 0,
    minY: isFinite(minY) ? minY : 0,
    maxX: isFinite(maxX) ? maxX : 100,
    maxY: isFinite(maxY) ? maxY : 100,
    width: isFinite(maxX - minX) ? Math.max(maxX - minX, 1) : 100,
    height: isFinite(maxY - minY) ? Math.max(maxY - minY, 1) : 100
  };

  const statistics: ParseStatistics = {
    moveCount,
    drawCount,
    flashCount,
    arcCount,
    regionCount,
    apertureCount: apertures.size,
    macroCount: macros.size,
    warningCount: warnings.length
  };

  return {
    filename,
    unit,
    apertures,
    geometry,
    polarityBlocks,
    bounds,
    statistics,
    warnings
  };
}
