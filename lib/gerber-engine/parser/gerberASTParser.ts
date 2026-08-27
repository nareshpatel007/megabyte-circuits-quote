import {
  ApertureDefinition,
  ApertureMacro,
  CoordinateFormat,
  GerberCommand,
  ParseStatistics,
  ParserWarning
} from "../types/gerber";
import { BoundingBox } from "../types/geometry";
import { parseApertureMacroBlock } from "./macroParser";

export interface GerberDocument {
  filename: string;
  units: "mm" | "in";
  format: CoordinateFormat;
  apertures: Map<number, ApertureDefinition>;
  macros: Map<string, ApertureMacro>;
  commands: GerberCommand[];
  bounds: BoundingBox;
  statistics: ParseStatistics;
  warnings: ParserWarning[];
}

export function parseGerberToAST(content: string, filename: string): GerberDocument {
  let units: "mm" | "in" = "mm";
  let unitScale = 1.0;

  let zeroSuppression: "leading" | "trailing" = "leading";
  let integerDigits = 2;
  let decimalDigits = 4;

  const apertures = new Map<number, ApertureDefinition>();
  const macros = new Map<string, ApertureMacro>();
  const commands: GerberCommand[] = [];
  const warnings: ParserWarning[] = [];

  const statistics: ParseStatistics = {
    moveCount: 0,
    drawCount: 0,
    flashCount: 0,
    arcCount: 0,
    regionCount: 0,
    apertureCount: 0,
    macroCount: 0,
    warningCount: 0
  };

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
          percentBuffer += "%";
          blocks.push(percentBuffer);
          percentBuffer = "";
          inPercentBlock = false;
        } else {
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

  for (const block of blocks) {
    if (block.startsWith("%")) {
      const directive = block.replace(/%/g, "").trim();

      if (directive.includes("MOIN")) {
        units = "in";
        unitScale = 25.4;
      } else if (directive.includes("MOMM")) {
        units = "mm";
        unitScale = 1.0;
      }

      if (directive.startsWith("FS")) {
        if (directive.includes("T")) zeroSuppression = "trailing";
        else zeroSuppression = "leading";

        const match = directive.match(/X(\d)(\d)/i);
        if (match) {
          integerDigits = parseInt(match[1], 10);
          decimalDigits = parseInt(match[2], 10);
        }
      }

      if (directive.startsWith("AM")) {
        const parsedMacro = parseApertureMacroBlock(block);
        if (parsedMacro) {
          macros.set(parsedMacro.name, parsedMacro);
          statistics.macroCount++;
        }
      }

      if (directive.startsWith("ADD")) {
        const apMatch = directive.match(/ADD(\d+)([A-Z0-9_]+)(?:,(.+))?/i);
        if (apMatch) {
          const code = parseInt(apMatch[1], 10);
          const rawType = apMatch[2].toUpperCase();
          const paramStr = apMatch[3] || "";
          const params = paramStr.split("X").map((p) => parseFloat(p) * unitScale).filter((p) => !isNaN(p));

          if (["C", "R", "O", "P"].includes(rawType)) {
            apertures.set(code, { code, type: rawType as any, params });
            statistics.apertureCount++;
          } else if (macros.has(rawType)) {
            apertures.set(code, {
              code,
              type: "M",
              params,
              macroName: rawType,
              macro: macros.get(rawType)
            });
            statistics.apertureCount++;
          } else {
            apertures.set(code, { code, type: "C", params: [0.2 * unitScale] });
            statistics.apertureCount++;
          }
        }
      }
    }
  }

  return {
    filename,
    units,
    format: {
      zeroSuppression,
      integerDigits,
      decimalDigits
    },
    apertures,
    macros,
    commands,
    bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 },
    statistics,
    warnings
  };
}
