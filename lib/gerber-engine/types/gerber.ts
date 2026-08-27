export type GerberUnit = "mm" | "in";

export type ApertureType = "C" | "R" | "O" | "P" | "M"; // Circle, Rect, Obround, Polygon, Macro

export interface MacroPrimitive {
  type: number; // 1=Circle, 20=Vector Line, 21=Center Line, 4=Outline, 5=Polygon, 7=Thermal, etc.
  params: number[];
}

export interface ApertureMacro {
  name: string;
  primitives: MacroPrimitive[];
  raw: string;
}

export interface ApertureDefinition {
  code: number; // e.g. 10 for D10
  type: ApertureType;
  params: number[];
  macroName?: string;
  macro?: ApertureMacro;
}

export type Polarity = "dark" | "clear";

export type LayerType =
  | "copper"
  | "solder-mask"
  | "silkscreen"
  | "paste"
  | "outline"
  | "drill"
  | "other";

export type LayerSide = "top" | "bottom" | "inner";

export interface GerberFile {
  filename: string;
  content: string;
  type: LayerType;
  side?: LayerSide;
  layerIndex?: number;
}

export interface ParserWarning {
  code: string;
  message: string;
  filename?: string;
  line?: number;
  command?: string;
}

export interface ParseStatistics {
  moveCount: number;
  drawCount: number;
  flashCount: number;
  arcCount: number;
  regionCount: number;
  apertureCount: number;
  macroCount: number;
  warningCount: number;
}

export interface CoordinateFormat {
  zeroSuppression: "leading" | "trailing";
  integerDigits: number;
  decimalDigits: number;
}

export interface GerberCommand {
  raw: string;
  code?: string;
  params?: Record<string, any>;
  line?: number;
}

