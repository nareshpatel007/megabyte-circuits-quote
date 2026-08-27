import { DrillData } from "../types/analysis";
import { BoundingBox, Geometry, PolarityBlock, RegionGeometry } from "../types/geometry";
import { ParsedLayerData } from "../geometry/geometryEngine";


export type RenderQuality = "draft" | "standard" | "high" | "ultra";

export interface RenderOptions {
  side: "top" | "bottom";
  maskColor?: string;
  silkscreenColor?: string;
  showDrills?: boolean;
  showOutline?: boolean;
  showGrid?: boolean;
  opacity?: Record<string, number>;
  quality?: RenderQuality;
}


export function getPCBColorPalette(maskColor: string = "green", silkColor: string = "white") {
  const maskColors: Record<string, { bg: string; border: string; mask: string }> = {
    green: { bg: "#124b27", border: "#1a6837", mask: "rgba(18, 75, 39, 0.85)" },
    blue: { bg: "#104e8b", border: "#1c6ea4", mask: "rgba(16, 78, 139, 0.85)" },
    red: { bg: "#8b1a1a", border: "#b22222", mask: "rgba(139, 26, 26, 0.85)" },
    black: { bg: "#1a1a1a", border: "#333333", mask: "rgba(26, 26, 26, 0.94)" },
    white: { bg: "#e6e6e6", border: "#cccccc", mask: "rgba(230, 230, 230, 0.95)" },
    purple: { bg: "#4b0082", border: "#6a0dad", mask: "rgba(75, 0, 130, 0.85)" },
    yellow: { bg: "#b8860b", border: "#daa520", mask: "rgba(184, 134, 11, 0.85)" }
  };

  const copperColor = "#e5a93c"; // Bright Metallic Gold Finish

  const silkHex = silkColor === "black" ? "#000000" : silkColor === "yellow" ? "#ffff00" : "#ffffff";

  return {
    palette: maskColors[maskColor.toLowerCase()] || maskColors.green,
    copperColor,
    silkscreenColor: silkHex
  };
}


export function geometryToPathCommands(geom: Geometry): string {
  switch (geom.type) {
    case "line":
      return `M ${geom.start.x} ${geom.start.y} L ${geom.end.x} ${geom.end.y}`;

    case "arc": {
      const largeArcFlag = Math.abs(geom.endAngle - geom.startAngle) > Math.PI ? 1 : 0;
      const sweepFlag = geom.clockwise ? 0 : 1;
      return `M ${geom.start.x} ${geom.start.y} A ${geom.radius} ${geom.radius} 0 ${largeArcFlag} ${sweepFlag} ${geom.end.x} ${geom.end.y}`;
    }

    case "circle": {
      const { x, y } = geom.center;
      const r = geom.radius;
      return `M ${x - r} ${y} A ${r} ${r} 0 1 0 ${x + r} ${y} A ${r} ${r} 0 1 0 ${x - r} ${y}`;
    }

    case "rectangle": {
      const rx = geom.center.x - geom.width / 2;
      const ry = geom.center.y - geom.height / 2;
      return `M ${rx} ${ry} h ${geom.width} v ${geom.height} h ${-geom.width} Z`;
    }

    case "region": {
      if (!geom.contours || geom.contours.length === 0) return "";
      return geom.contours
        .filter((contour) => contour.length >= 3)
        .map((contour) => contour.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z")
        .join(" ");
    }


    case "flash": {
      const { x, y } = geom.point;
      const w = geom.size.width;
      const h = geom.size.height;
      if (geom.shape === "rect" || geom.shape === "obround") {
        const rx = x - w / 2;
        const ry = y - h / 2;
        return `M ${rx} ${ry} h ${w} v ${h} h ${-w} Z`;
      } else if (geom.macroPrimitives && geom.macroPrimitives.length > 0) {
        return geom.macroPrimitives
          .map((mp) => {
            if (mp.type === "circle" && mp.center && mp.radius) {
              const r = mp.radius;
              return `M ${mp.center.x - r} ${mp.center.y} A ${r} ${r} 0 1 0 ${mp.center.x + r} ${mp.center.y} A ${r} ${r} 0 1 0 ${mp.center.x - r} ${mp.center.y}`;
            } else if (mp.type === "polygon" && mp.points && mp.points.length > 2) {
              return mp.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
            } else if (mp.type === "rect" && mp.center && mp.width && mp.height) {
              const rx = mp.center.x - mp.width / 2;
              const ry = mp.center.y - mp.height / 2;
              return `M ${rx} ${ry} h ${mp.width} v ${mp.height} h ${-mp.width} Z`;
            }
            return "";
          })
          .filter(Boolean)
          .join(" ");
      } else {
        const r = w / 2;
        return `M ${x - r} ${y} A ${r} ${r} 0 1 0 ${x + r} ${y} A ${r} ${r} 0 1 0 ${x - r} ${y}`;
      }
    }
  }
  return "";
}


export function renderPolarityBlocksToSvg(
  polarityBlocks: PolarityBlock[],
  darkColor: string,
  layerId: string,
  bounds?: BoundingBox
): string {
  if (!polarityBlocks || polarityBlocks.length === 0) return "";

  const hasClear = polarityBlocks.some((b) => b.polarity === "clear");

  if (!hasClear) {
    const elements: string[] = [];
    polarityBlocks.forEach((block) => {
      const paths: string[] = [];
      const strokes: string[] = [];

      block.geometry.forEach((geom) => {
        const d = geometryToPathCommands(geom);
        if (!d) return;

        if (geom.type === "line" || geom.type === "arc") {
          strokes.push(`<path d="${d}" fill="none" stroke="${darkColor}" stroke-width="${geom.width}" stroke-linecap="round" stroke-linejoin="round" />`);
        } else {
          paths.push(d);
        }
      });

      if (paths.length > 0) {
        elements.push(`<path d="${paths.join(" ")}" fill="${darkColor}" fill-rule="evenodd" />`);
      }
      if (strokes.length > 0) {
        elements.push(strokes.join("\n"));
      }
    });

    return elements.join("\n");
  }

  // Bounds for white mask background rect
  const minX = bounds ? bounds.minX - 100 : -10000;
  const minY = bounds ? bounds.minY - 100 : -10000;
  const w = bounds ? bounds.width + 200 : 20000;
  const h = bounds ? bounds.height + 200 : 20000;

  const groupElements: string[] = [];
  const defsElements: string[] = [];

  polarityBlocks.forEach((block, idx) => {
    const paths: string[] = [];
    const strokes: string[] = [];

    block.geometry.forEach((geom) => {
      const d = geometryToPathCommands(geom);
      if (!d) return;

      if (geom.type === "line" || geom.type === "arc") {
        const strokeColor = block.polarity === "clear" ? "#000000" : darkColor;
        strokes.push(`<path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${geom.width}" stroke-linecap="round" stroke-linejoin="round" />`);
      } else {
        paths.push(d);
      }
    });

    if (block.polarity === "clear") {
      const maskId = `clear-mask-${layerId}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      defsElements.push(`
        <mask id="${maskId}">
          <rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="#ffffff" />
          ${paths.length > 0 ? `<path d="${paths.join(" ")}" fill="#000000" fill-rule="evenodd" />` : ""}
          ${strokes.join("\n")}
        </mask>
      `);

      const prevContent = groupElements.join("\n");
      groupElements.length = 0;
      groupElements.push(`<g mask="url(#${maskId})">${prevContent}</g>`);
    } else {
      if (paths.length > 0) {
        groupElements.push(`<path d="${paths.join(" ")}" fill="${darkColor}" fill-rule="evenodd" />`);
      }
      if (strokes.length > 0) {
        groupElements.push(strokes.join("\n"));
      }
    }
  });

  return `
    ${defsElements.length > 0 ? `<defs>${defsElements.join("\n")}</defs>` : ""}
    ${groupElements.join("\n")}
  `;
}



export interface BoardShape {
  type: "circle" | "region" | "rect";
  circle?: { cx: number; cy: number; r: number };
  regionD?: string;
  rect?: { x: number; y: number; w: number; h: number };
}

export function detectBoardShape(outlineLayer?: ParsedLayerData, bounds?: BoundingBox): BoardShape {
  if (!bounds) {
    return { type: "rect", rect: { x: 0, y: 0, w: 100, h: 100 } };
  }

  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const w = bounds.width;
  const h = bounds.height;
  const r = Math.min(w, h) / 2;

  if (outlineLayer && outlineLayer.geometry) {
    // 1. Closed Region Mode (G36/G37)
    const regionGeoms = outlineLayer.geometry.filter(
      (g): g is RegionGeometry => g.type === "region" && Array.isArray((g as RegionGeometry).contours) && (g as RegionGeometry).contours.length > 0
    );
    if (regionGeoms.length > 0) {
      const regionD = regionGeoms
        .map((g) => geometryToPathCommands(g))
        .filter(Boolean)
        .join(" ");
      if (regionD) {
        return { type: "region", regionD };
      }
    }

    // 2. Circular Board (1:1 Aspect ratio with arc/circle geometry or circular filename)
    const aspectDiff = Math.abs(w - h) / Math.max(w, h);
    const hasArcs = outlineLayer.geometry.some((g) => g.type === "arc" || g.type === "circle");
    if (aspectDiff < 0.1 && (hasArcs || outlineLayer.filename.toLowerCase().includes("circle"))) {
      return { type: "circle", circle: { cx, cy, r } };
    }
  }

  // 3. Rectangular / Rounded Rect Fallback
  return { type: "rect", rect: { x: bounds.minX, y: bounds.minY, w, h } };
}

export function stitchOutlineSegmentsToPath(outlineLayer?: ParsedLayerData): { pathD: string; bounds?: BoundingBox } {
  if (!outlineLayer || !outlineLayer.geometry || outlineLayer.geometry.length > 0) {
    // If outline has G36/G37 region mode geometry:
    const regionGeoms = outlineLayer?.geometry?.filter(
      (g): g is RegionGeometry => g.type === "region" && Array.isArray((g as RegionGeometry).contours) && (g as RegionGeometry).contours.length > 0
    );
    if (regionGeoms && regionGeoms.length > 0) {
      const regionPaths = regionGeoms.map((g) => geometryToPathCommands(g)).filter(Boolean);
      if (regionPaths.length > 0) {
        return { pathD: regionPaths.join(" "), bounds: outlineLayer?.bounds };
      }
    }
  }

  if (!outlineLayer || !outlineLayer.geometry || outlineLayer.geometry.length === 0) {
    return { pathD: "" };
  }

  // Extract line and arc segments
  interface PathSegment {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    cmd: string;
    used: boolean;
  }

  const segments: PathSegment[] = [];

  for (const g of outlineLayer.geometry) {
    if (g.type === "line" && g.start && g.end) {
      segments.push({
        startX: g.start.x,
        startY: g.start.y,
        endX: g.end.x,
        endY: g.end.y,
        cmd: `L ${g.end.x} ${g.end.y}`,
        used: false,
      });
    } else if (g.type === "arc" && g.start && g.end) {
      const rx = g.radius || Math.hypot(g.start.x - (g.center?.x || 0), g.start.y - (g.center?.y || 0));
      const ry = rx;
      const largeArc = Math.abs((g.endAngle || 0) - (g.startAngle || 0)) > Math.PI ? 1 : 0;
      const sweep = g.clockwise ? 0 : 1;
      segments.push({
        startX: g.start.x,
        startY: g.start.y,
        endX: g.end.x,
        endY: g.end.y,
        cmd: `A ${rx} ${ry} 0 ${largeArc} ${sweep} ${g.end.x} ${g.end.y}`,
        used: false,
      });
    }
  }

  if (segments.length === 0) return { pathD: "" };

  const eps = 0.1; // 100 microns tolerance
  const contours: string[] = [];

  for (let s = 0; s < segments.length; s++) {
    if (segments[s].used) continue;

    const startSeg = segments[s];
    startSeg.used = true;

    let contourD = `M ${startSeg.startX} ${startSeg.startY} ${startSeg.cmd}`;
    let currentX = startSeg.endX;
    let currentY = startSeg.endY;

    let foundNext = true;
    while (foundNext) {
      foundNext = false;
      for (let j = 0; j < segments.length; j++) {
        if (segments[j].used) continue;

        const candidate = segments[j];
        if (Math.hypot(candidate.startX - currentX, candidate.startY - currentY) < eps) {
          candidate.used = true;
          contourD += ` ${candidate.cmd}`;
          currentX = candidate.endX;
          currentY = candidate.endY;
          foundNext = true;
          break;
        }
        if (Math.hypot(candidate.endX - currentX, candidate.endY - currentY) < eps) {
          candidate.used = true;
          let revCmd = `L ${candidate.startX} ${candidate.startY}`;
          contourD += ` ${revCmd}`;
          currentX = candidate.startX;
          currentY = candidate.startY;
          foundNext = true;
          break;
        }
      }

      if (Math.hypot(currentX - startSeg.startX, currentY - startSeg.startY) < eps) {
        contourD += " Z";
        break;
      }
    }

    if (!contourD.endsWith("Z")) {
      contourD += " Z";
    }
    contours.push(contourD);
  }

  // Filter out tiny extra corner nubs / breakaway tab circles / alignment marks outside main board
  if (contours.length > 1) {
    const areas = contours.map((c) => {
      const numbers = c.match(/[-+]?\d*\.?\d+/g);
      if (!numbers || numbers.length < 4) return 0;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < numbers.length - 1; i += 2) {
        const x = parseFloat(numbers[i]);
        const y = parseFloat(numbers[i + 1]);
        if (!isNaN(x) && !isNaN(y)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
      return (maxX - minX) * (maxY - minY);
    });

    const maxArea = Math.max(...areas);
    // Keep contours whose bounding area is at least 5% of main board area
    const mainContours = contours.filter((_, idx) => areas[idx] >= maxArea * 0.05);
    return { pathD: mainContours.join(" "), bounds: outlineLayer.bounds };
  }

  return { pathD: contours.join(" "), bounds: outlineLayer.bounds };
}



export function generatePCBSvgMarkup(
  layers: ParsedLayerData[],
  bounds: BoundingBox,
  drillData?: DrillData,
  options: RenderOptions = { side: "top" }
): string {
  const side = options.side || "top";
  const { palette, copperColor, silkscreenColor } = getPCBColorPalette(options.maskColor, options.silkscreenColor);

  const outlineLayer = layers.find((l) => l.type === "outline");
  const { pathD: outlineStitchedD, bounds: outlineBounds } = stitchOutlineSegmentsToPath(outlineLayer);

  // Use outline bounds if available to fit viewBox tightly around the actual physical PCB
  const activeBounds = (outlineBounds && outlineBounds.width > 0 && outlineBounds.height > 0) ? outlineBounds : bounds;

  const margin = Math.max(activeBounds.width, activeBounds.height) * 0.02 + 1;
  const viewBoxX = activeBounds.minX - margin;
  const viewBoxY = activeBounds.minY - margin;
  const viewBoxW = activeBounds.width + margin * 2;
  const viewBoxH = activeBounds.height + margin * 2;

  const allCopperLayers = layers.filter((l) => l.type === "copper");
  const isSingleLayer = allCopperLayers.length <= 1;

  const copperLayers = layers.filter((l) => l.type === "copper" && (l.side === side || (!l.side && side === "top")));
  const maskLayers = layers.filter((l) => l.type === "solder-mask" && (l.side === side || (!l.side && side === "top")));
  const silkLayers = layers.filter((l) => l.type === "silkscreen" && (l.side === side || (!l.side && side === "top")));

  // Check if this is the bare back side of a 1-Layer PCB
  const isBareBack = side === "bottom" && (isSingleLayer || copperLayers.length === 0);

  // Substrate Palette Colors (FR-4 bare fiberglass khaki/gold #a39e60 for 1-layer back)
  const substrateBg = isBareBack ? "#a39e60" : palette.bg;
  const substrateBorder = isBareBack ? "#8a854d" : palette.border;

  const shape = detectBoardShape(outlineLayer, activeBounds);

  let clipShapeSvg = "";
  let substrateSvg = "";
  let maskBgSvg = "";

  if (outlineStitchedD) {
    clipShapeSvg = `<path d="${outlineStitchedD}" fill-rule="evenodd" />`;
    substrateSvg = `<path d="${outlineStitchedD}" fill-rule="evenodd" fill="${substrateBg}" stroke="${substrateBorder}" stroke-width="0.5" />`;
    maskBgSvg = `<path d="${outlineStitchedD}" fill-rule="evenodd" fill="#ffffff" />`;
  } else if (shape.type === "circle" && shape.circle) {
    const { cx, cy, r } = shape.circle;
    clipShapeSvg = `<circle cx="${cx}" cy="${cy}" r="${r}" />`;
    substrateSvg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${substrateBg}" stroke="${substrateBorder}" stroke-width="0.5" />`;
    maskBgSvg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" />`;
  } else if (shape.type === "region" && shape.regionD) {
    clipShapeSvg = `<path d="${shape.regionD}" fill-rule="evenodd" />`;
    substrateSvg = `<path d="${shape.regionD}" fill="${substrateBg}" stroke="${substrateBorder}" stroke-width="0.5" />`;
    maskBgSvg = `<path d="${shape.regionD}" fill="#ffffff" />`;
  } else {
    const { x, y, w, h } = shape.rect || { x: activeBounds.minX, y: activeBounds.minY, w: activeBounds.width, h: activeBounds.height };
    clipShapeSvg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" />`;
    substrateSvg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${substrateBg}" stroke="${substrateBorder}" stroke-width="0.5" />`;
    maskBgSvg = `<rect x="${x - 100}" y="${y - 100}" width="${w + 200}" height="${h + 200}" fill="#ffffff" />`;
  }


  // Inner region cutouts (e.g., LCD screen window or cutout slots)
  let innerCutoutsSvg = "";
  if (outlineLayer && outlineLayer.geometry) {
    const regionGeoms = outlineLayer.geometry.filter(
      (g): g is RegionGeometry => g.type === "region" && Array.isArray((g as RegionGeometry).contours) && (g as RegionGeometry).contours.length > 1
    );
    if (regionGeoms.length > 0) {
      const cutoutPaths: string[] = [];
      for (const reg of regionGeoms) {
        for (let i = 1; i < reg.contours.length; i++) {
          const c = reg.contours[i];
          const pathD = c.map((pt: { x: number; y: number }, idx: number) => `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ") + " Z";
          cutoutPaths.push(pathD);
        }
      }
      if (cutoutPaths.length > 0) {
        innerCutoutsSvg = `<path d="${cutoutPaths.join(" ")}" fill="#000000" />`;
      }
    }
  }



  // Render Layer Polarity Blocks for ALL layers belonging to requested side
  const copperSvg = copperLayers
    .map((l) => renderPolarityBlocksToSvg(l.polarityBlocks || [{ polarity: "dark", geometry: l.geometry }], copperColor, "copper", activeBounds))
    .filter(Boolean)
    .join("\n");

  const silkSvg = silkLayers
    .map((l) => renderPolarityBlocksToSvg(l.polarityBlocks || [{ polarity: "dark", geometry: l.geometry }], silkscreenColor, "silk", activeBounds))
    .filter(Boolean)
    .join("\n");

  const outlineSvg = outlineLayer
    ? renderPolarityBlocksToSvg(outlineLayer.polarityBlocks || [{ polarity: "dark", geometry: outlineLayer.geometry }], "#ffffff", "outline", activeBounds)
    : "";

  // Mask Openings SVG (black #000000 cuts out green soldermask to reveal gold copper pads underneath)
  const maskOpeningSvg = isBareBack
    ? ""
    : maskLayers
        .map((l) => renderPolarityBlocksToSvg(l.polarityBlocks || [{ polarity: "dark", geometry: l.geometry }], "#000000", "mask-opening", activeBounds))
        .filter(Boolean)
        .join("\n");


  // Drill Hole Cutouts (black #000000 punches physical holes through the board)
  let drillHolesCutoutSvg = "";
  let drillsSvg = "";
  if (options.showDrills !== false && drillData && drillData.holes.length > 0) {
    drillHolesCutoutSvg = drillData.holes
      .map((h) => `<circle cx="${h.x}" cy="${h.y}" r="${h.diameter / 2}" fill="#000000" />`)
      .join("\n");

    drillsSvg = drillData.holes
      .map((h) => `<circle cx="${h.x}" cy="${h.y}" r="${h.diameter / 2}" fill="none" stroke="${isBareBack ? "#8a854d" : "#e5a93c"}" stroke-width="0.25" />`)
      .join("\n");
  }

  // Grid SVG
  let gridSvg = "";
  if (options.showGrid) {
    const gridStep = 10;
    const gridLines: string[] = [];
    for (let x = Math.floor(bounds.minX); x <= bounds.maxX; x += gridStep) {
      gridLines.push(`<line x1="${x}" y1="${bounds.minY}" x2="${x}" y2="${bounds.maxY}" stroke="rgba(255,255,255,0.15)" stroke-width="0.2" stroke-dasharray="1 1" />`);
    }
    for (let y = Math.floor(bounds.minY); y <= bounds.maxY; y += gridStep) {
      gridLines.push(`<line x1="${bounds.minX}" y1="${y}" x2="${bounds.maxX}" y2="${y}" stroke="rgba(255,255,255,0.15)" stroke-width="0.2" stroke-dasharray="1 1" />`);
    }
    gridSvg = gridLines.join("\n");
  }

  // Gerber Y-axis increases UPWARDS while SVG Y increases DOWNWARDS.
  // We apply vertical Y-flip scale(1, -1) and scale(-1, -1) for Bottom View.
  const transformAttr = side === "bottom"
    ? `transform="translate(${bounds.minX + bounds.maxX}, ${bounds.minY + bounds.maxY}) scale(-1, -1)"`
    : `transform="translate(0, ${bounds.minY + bounds.maxY}) scale(1, -1)"`;


  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}" width="100%" height="100%" style="background-color: transparent;">
      <g id="pcb-view-wrapper" ${transformAttr}>
        <defs>
          <clipPath id="board-shape-clip-${side}">
            ${clipShapeSvg}
          </clipPath>
          <mask id="soldermask-openings-${side}">
            ${maskBgSvg}
            ${maskOpeningSvg}
          </mask>
          <mask id="board-holes-${side}">
            ${maskBgSvg}
            ${drillHolesCutoutSvg}
            ${innerCutoutsSvg}
          </mask>

        </defs>

        <!-- Board Content Clipped to Exact PCB Shape (Circle, Polygon, Custom Shape) -->
        <g id="pcb-board-content" clip-path="url(#board-shape-clip-${side})">
          <!-- Board Substrate with Physical Hole Cutouts -->
          <g id="board-substrate" mask="url(#board-holes-${side})">
            ${substrateSvg}
          </g>

          ${gridSvg ? `<g id="grid-lines">${gridSvg}</g>` : ""}

          <!-- Copper Layer -->
          <g id="copper-layer" mask="url(#board-holes-${side})">${copperSvg}</g>

          <!-- Solder Mask Overlay with Exposure Openings & Hole Cutouts -->
          <g id="solder-mask-overlay" mask="url(#soldermask-openings-${side})">
            <g mask="url(#board-holes-${side})">
              ${substrateSvg}
            </g>
          </g>

          <!-- Silkscreen Layer -->
          <g id="silkscreen-layer">${silkSvg}</g>
        </g>

        <!-- Board Outline -->
        ${options.showOutline !== false ? `<g id="board-outline">${outlineSvg}</g>` : ""}

        <!-- Drill Hole Gold Rings with Transparent Hole Interior -->
        <g id="drill-holes">${drillsSvg}</g>
      </g>
    </svg>
  `;

}


export async function renderPCBHdRaster(
  layers: ParsedLayerData[],
  bounds: BoundingBox,
  drillData?: DrillData,
  options: RenderOptions = { side: "top" },
  targetWidth: number = 3840
): Promise<string> {
  const svgMarkup = generatePCBSvgMarkup(layers, bounds, drillData, options);
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgMarkup);
  }

  return new Promise((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const aspectRatio = bounds.height / bounds.width || 0.75;
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = Math.round(targetWidth * aspectRatio);
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(url);
        resolve(pngUrl);
      } else {
        URL.revokeObjectURL(url);
        resolve("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgMarkup));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgMarkup));
    };

    img.src = url;
  });
}


