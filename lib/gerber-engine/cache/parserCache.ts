import { PCBAnalysis, DrillData } from "../types/analysis";
import { ParsedLayerData } from "../geometry/geometryEngine";

export interface CacheEntry {
  key: string;
  layers: ParsedLayerData[];
  analysis: PCBAnalysis;
  drillData?: DrillData;
  timestamp: number;
}

class GerberParserCache {
  private cache = new Map<string, CacheEntry>();

  public generateKey(files: Array<{ name: string; size?: number }>): string {
    return files
      .map((f) => `${f.name}:${f.size || 0}`)
      .sort()
      .join("|");
  }

  public get(key: string): CacheEntry | undefined {
    return this.cache.get(key);
  }

  public set(key: string, layers: ParsedLayerData[], analysis: PCBAnalysis, drillData?: DrillData): void {
    this.cache.set(key, {
      key,
      layers,
      analysis,
      drillData,
      timestamp: Date.now()
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const parserCache = new GerberParserCache();
