import JSZip from "jszip";
import { parseGerberContent } from "./parser/gerberParser";
import { parseExcellonContent } from "./parser/excellonParser";
import { parseGbrJobContent } from "./parser/gbrjobParser";
import { detectLayerType } from "./layers/layerDetector";
import { analyzePCBProject } from "./analysis/pcbAnalyzer";
import { validateGerberProject } from "./validation/gerberValidator";
import { parserCache } from "./cache/parserCache";
import { PCBAnalysis, DrillData } from "./types/analysis";
import { ParsedLayerData, combineBoardBounds } from "./geometry/geometryEngine";
import { GerberValidationResult } from "./types/validation";
import { generatePCBSvgMarkup, RenderOptions } from "./renderer/svgRenderer";

export * from "./types/gerber";
export * from "./types/geometry";
export * from "./types/analysis";
export * from "./types/validation";
export * from "./parser/gerberParser";
export * from "./parser/excellonParser";
export * from "./layers/layerDetector";
export * from "./geometry/geometryEngine";
export * from "./analysis/pcbAnalyzer";
export * from "./renderer/svgRenderer";
export * from "./validation/gerberValidator";

export interface ProcessedGerberProject {
  layers: ParsedLayerData[];
  analysis: PCBAnalysis;
  validation: GerberValidationResult;
  drillData?: DrillData;
}

export type ProgressCallback = (stage: string, percent: number) => void;

export async function processGerberFiles(
  filesInput: File[] | File,
  onProgress?: ProgressCallback
): Promise<ProcessedGerberProject> {
  onProgress?.("Uploading & Extracting...", 10);

  const rawFiles: Array<{ name: string; content: string; size: number }> = [];
  const inputList = Array.isArray(filesInput) ? filesInput : [filesInput];

  for (const file of inputList) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      const entries = Object.keys(zipContent.files);
      let count = 0;
      for (const filename of entries) {
        count++;
        onProgress?.(`Extracting files (${count}/${entries.length})...`, 10 + Math.floor((count / entries.length) * 20));

        const zipEntry = zipContent.files[filename];
        if (!zipEntry.dir) {
          const content = await zipEntry.async("string");
          const cleanName = filename.includes("/") ? filename.slice(filename.lastIndexOf("/") + 1) : filename;
          rawFiles.push({
            name: cleanName,
            content,
            size: content.length
          });
        }
      }
    } else {
      const content = await file.text();
      rawFiles.push({
        name: file.name,
        content,
        size: file.size
      });
    }
  }

  // Check cache
  const cacheKey = parserCache.generateKey(rawFiles);
  const cached = parserCache.get(cacheKey);
  if (cached) {
    onProgress?.("Loaded from cache", 100);
    const validation = validateGerberProject(cached.layers, cached.analysis);
    return {
      layers: cached.layers,
      analysis: cached.analysis,
      validation,
      drillData: cached.drillData
    };
  }

  onProgress?.("Detecting layers & formats...", 35);
  let drillData: DrillData | undefined;
  const parsedLayers: ParsedLayerData[] = [];

  let idx = 0;
  for (const f of rawFiles) {
    idx++;
    onProgress?.(`Parsing ${f.name}...`, 35 + Math.floor((idx / rawFiles.length) * 45));

    const detected = detectLayerType(f.name, f.content);

    if (detected.type === "drill") {
      const parsedDrill = parseExcellonContent(f.content, f.name);
      if (!drillData) {
        drillData = parsedDrill;
      } else {
        const combinedHoles = [...drillData.holes, ...parsedDrill.holes];
        const combinedTools = [...drillData.tools, ...parsedDrill.tools];
        const diameters = combinedHoles.map((h) => h.diameter);
        drillData = {
          holes: combinedHoles,
          tools: combinedTools,
          holeCount: combinedHoles.length,
          slotsCount: (drillData.slotsCount || 0) + (parsedDrill.slotsCount || 0),
          minimumDiameter: diameters.length > 0 ? Math.min(...diameters) : 0,
          maximumDiameter: diameters.length > 0 ? Math.max(...diameters) : 0,
          sizes: combinedTools.map((t) => t.diameter)
        };
      }
    } else {


      const parsedLayer = parseGerberContent(f.content, f.name);
      parsedLayers.push({
        filename: f.name,
        type: detected.type,
        side: detected.side,
        geometry: parsedLayer.geometry,
        polarityBlocks: parsedLayer.polarityBlocks,
        bounds: parsedLayer.bounds,
        statistics: parsedLayer.statistics,
        warnings: parsedLayer.warnings
      });
    }
  }

  onProgress?.("Analyzing PCB geometry & features...", 85);
  const analysis = analyzePCBProject(parsedLayers, drillData);

  onProgress?.("Validating Gerber stackup...", 95);
  const validation = validateGerberProject(parsedLayers, analysis);

  parserCache.set(cacheKey, parsedLayers, analysis, drillData);
  onProgress?.("Ready", 100);

  return {
    layers: parsedLayers,
    analysis,
    validation,
    drillData
  };

}
