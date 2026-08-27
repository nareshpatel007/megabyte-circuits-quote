import { parseGerberContent } from "../lib/gerber-engine/parser/gerberParser";
import { parseExcellonContent } from "../lib/gerber-engine/parser/excellonParser";
import { detectLayerType } from "../lib/gerber-engine/layers/layerDetector";
import { analyzePCBProject } from "../lib/gerber-engine/analysis/pcbAnalyzer";
import { mapPCBAnalysisToQuoteOptions } from "../lib/pcb-quote-integration/extractionMapper";
import { validateGerberProject } from "../lib/gerber-engine/validation/gerberValidator";

describe("Gerber Engine Overhaul & Regression Suite", () => {
  test("parseGerberContent parses RS-274X coordinates & apertures", () => {
    const gerberSample = `%FSLAX24Y24*%
%MOMM*%
%ADD10C,0.2000*%
G54D10*
X0Y0D02*
X916200Y0D01*
X916200Y543500D01*
X0Y543500D01*
X0Y0D01*
M02*`;

    const parsed = parseGerberContent(gerberSample, "board.GKO");
    expect(parsed.unit).toBe("mm");
    expect(parsed.apertures.has(10)).toBe(true);
    expect(parsed.bounds.width).toBeCloseTo(91.62, 0);
    expect(parsed.bounds.height).toBeCloseTo(54.35, 0);
  });


  test("Aperture Macro (%AM%) parsing and flash geometry generation", () => {
    const macroGerber = `%FSLAX24Y24*%
%MOMM*%
%AMTHERMAL_PAD*1,1,1.5,0,0*21,1,0.5,0.8,0,0,0*%
%ADD10THERMAL_PAD*%
G54D10*
X100000Y100000D03*
M02*`;

    const parsed = parseGerberContent(macroGerber, "top_copper.gtl");
    expect(parsed.apertures.get(10)?.type).toBe("M");
    expect(parsed.apertures.get(10)?.macroName).toBe("THERMAL_PAD");
    expect(parsed.geometry.length).toBe(1);
    const flashGeom = parsed.geometry[0] as any;
    expect(flashGeom.shape).toBe("macro");
    expect(flashGeom.macroPrimitives.length).toBeGreaterThan(0);
  });

  test("Region G36/G37 with arc interpolation and multi-contour isolation", () => {
    const regionGerber = `%FSLAX24Y24*%
%MOMM*%
G36*
X0Y0D02*
X500000Y0D01*
G02*
X500000Y500000I0J250000D01*
G01*
X0Y0D01*
X100000Y100000D02*
X200000Y100000D01*
X200000Y200000D01*
X100000Y100000D01*
G37*
M02*`;

    const parsed = parseGerberContent(regionGerber, "outline.gko");
    expect(parsed.statistics.regionCount).toBe(1);
    const regionGeom = parsed.geometry[0] as any;
    expect(regionGeom.type).toBe("region");
    expect(regionGeom.contours.length).toBe(2); // Two distinct contours separated by D02 move
  });


  test("Polarity LPD and LPC block grouping", () => {
    const polarityGerber = `%FSLAX24Y24*%
%MOMM*%
%ADD10C,1.0*%
%LPD*%
G54D10*
X0Y0D02*
X100000Y0D01*
%LPC*%
X200000Y0D02*
X300000Y0D01*
M02*`;

    const parsed = parseGerberContent(polarityGerber, "copper_plane.gtl");
    expect(parsed.polarityBlocks.length).toBe(2);
    expect(parsed.polarityBlocks[0].polarity).toBe("dark");
    expect(parsed.polarityBlocks[1].polarity).toBe("clear");
  });

  test("parseExcellonContent parses drill tool definitions and hole coordinates", () => {
    const drillSample = `M48
METRIC,TZ
T1C0.8
%
T1
X1000Y1000
X2000Y2000
X3000Y3000
M30`;

    const parsed = parseExcellonContent(drillSample, "board.drl");
    expect(parsed.holeCount).toBe(3);
    expect(parsed.minimumDiameter).toBe(0.8);
    expect(parsed.tools.length).toBe(1);
  });

  test("detectLayerType accurately identifies layers by filename", () => {
    expect(detectLayerType("board.GTL").side).toBe("top");
    expect(detectLayerType("board.GTL").type).toBe("copper");
    expect(detectLayerType("board.GBL").side).toBe("bottom");
    expect(detectLayerType("board.GTS").type).toBe("solder-mask");
    expect(detectLayerType("board.GTO").type).toBe("silkscreen");
    expect(detectLayerType("board.drl").type).toBe("drill");
    expect(detectLayerType("board.gko").type).toBe("outline");
  });

  test("analyzePCBProject computes 2-layer PCB metrics and bounding box", () => {
    const topCopperLayer = {
      filename: "top.gtl",
      type: "copper" as const,
      side: "top" as const,
      geometry: [
        {
          type: "line" as const,
          start: { x: 0, y: 0 },
          end: { x: 91.62, y: 54.35 },
          width: 0.2,
          polarity: "dark" as const
        }
      ],
      bounds: { minX: 0, minY: 0, maxX: 91.62, maxY: 54.35, width: 91.62, height: 54.35 }
    };

    const bottomCopperLayer = {
      filename: "bottom.gbl",
      type: "copper" as const,
      side: "bottom" as const,
      geometry: [],
      bounds: { minX: 0, minY: 0, maxX: 91.62, maxY: 54.35, width: 91.62, height: 54.35 }
    };

    const outlineLayer = {
      filename: "outline.gko",
      type: "outline" as const,
      geometry: [
        {
          type: "line" as const,
          start: { x: 0, y: 0 },
          end: { x: 91.62, y: 54.35 },
          width: 0.1,
          polarity: "dark" as const
        }
      ],
      bounds: { minX: 0, minY: 0, maxX: 91.62, maxY: 54.35, width: 91.62, height: 54.35 }
    };

    const analysis = analyzePCBProject([topCopperLayer, bottomCopperLayer, outlineLayer]);

    expect(analysis.layers.copper).toBe(2);
    expect(analysis.dimensions.width).toBe(91.62);
    expect(analysis.dimensions.height).toBe(54.35);

    const autoSelected = mapPCBAnalysisToQuoteOptions(analysis);
    expect(autoSelected.layers).toBe("2");
    expect(autoSelected.width).toBe("91.62");
    expect(autoSelected.height).toBe("54.35");
  });
});
