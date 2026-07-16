import { ParsedGerberFile, GerberLayerType } from "./types";
import { toMM } from "./utils";

interface SolderMaskTheme {
    baseColor: string;       // FR4 substrate
    maskColor: string;       // Solder mask overlay
    copperColor: string;     // Raw copper under mask
    silkscreenColor: string; // Silkscreen legend color
}

const PCB_COLOR_THEMES: Record<string, SolderMaskTheme> = {
    // Green (default)
    "#52c41a": {
        baseColor: "#195628",
        maskColor: "#2d7834",
        copperColor: "#cca43b", // Golden finish
        silkscreenColor: "#FFFFFF"
    },
    // Purple
    "#722ed1": {
        baseColor: "#2E0854",
        maskColor: "#5B21B6",
        copperColor: "#cca43b", // Golden finish
        silkscreenColor: "#FFFFFF"
    },
    // Red
    "#f5222d": {
        baseColor: "#4A0E0E",
        maskColor: "#991B1B",
        copperColor: "#cca43b", // Golden finish
        silkscreenColor: "#FFFFFF"
    },
    // Yellow
    "#fadb14": {
        baseColor: "#5C3E00",
        maskColor: "#D97706",
        copperColor: "#cca43b", // Golden finish
        silkscreenColor: "#0F172A"
    },
    // Blue
    "#1677ff": {
        baseColor: "#0A2540",
        maskColor: "#1E3A8A",
        copperColor: "#cca43b", // Golden finish
        silkscreenColor: "#FFFFFF"
    },
    // White
    "#ffffff": {
        baseColor: "#D1D5DB",
        maskColor: "#F3F4F6",
        copperColor: "#cca43b", // Golden finish
        silkscreenColor: "#1F2937"
    },
    // Black
    "#000000": {
        baseColor: "#111827",
        maskColor: "#1F2937",
        copperColor: "#cca43b", // Golden finish
        silkscreenColor: "#F3F4F6"
    },
    // Matte Black
    "#18181b": {
        baseColor: "#09090B",
        maskColor: "#18181B",
        copperColor: "#cca43b", // Golden finish
        silkscreenColor: "#F3F4F6"
    }
};

/**
 * Renders multiple Gerber/Drill layers into a composite vector SVG.
 */
export function renderPCBToSVG(
    parsedFiles: ParsedGerberFile[],
    side: "top" | "bottom",
    pcbColor: string,
    dimensions: { width: number; height: number; minX: number; maxX: number; minY: number; maxY: number }
): string {
    const { width, height, minX, maxX, minY, maxY } = dimensions;
    const theme = PCB_COLOR_THEMES[pcbColor.toLowerCase()] || PCB_COLOR_THEMES["#52c41a"];

    const viewW = width > 0 ? width : 100;
    const viewH = height > 0 ? height : 100;

    const mapX = (x: number, fileUnits: "mm" | "in") => {
        const mm = toMM(x, fileUnits);
        const rel = mm - minX;
        return side === "top" ? rel : (width - rel);
    };

    const mapY = (y: number, fileUnits: "mm" | "in") => {
        const mm = toMM(y, fileUnits);
        return height - (mm - minY);
    };

    const mapDim = (dim: number, fileUnits: "mm" | "in") => toMM(dim, fileUnits);

    // Identify layers
    const outlineFile = parsedFiles.find(f => f.type === "outline");
    const activeCopper = side === "top" ? "copper_top" : "copper_bottom";
    const copperFile = parsedFiles.find(f => f.type === activeCopper);
    const activeMask = side === "top" ? "solder_mask_top" : "solder_mask_bottom";
    const maskFile = parsedFiles.find(f => f.type === activeMask);
    const activeSilk = side === "top" ? "silkscreen_top" : "silkscreen_bottom";
    const silkFile = parsedFiles.find(f => f.type === activeSilk);
    const drillFile = parsedFiles.find(f => f.type === "drill");

    let svgElements: string[] = [];
    let maskHoles: string[] = [];

    // Calculate a clean closed rounded rectangle path of the board boundary.
    const cornerRadius = Math.min(viewW, viewH) * 0.03; // 3% corner radius
    const substratePath = `M ${cornerRadius},0 h ${viewW - 2 * cornerRadius} a ${cornerRadius},${cornerRadius} 0 0 1 ${cornerRadius},${cornerRadius} v ${viewH - 2 * cornerRadius} a ${cornerRadius},${cornerRadius} 0 0 1 -${cornerRadius},${cornerRadius} h -${viewW - 2 * cornerRadius} a ${cornerRadius},${cornerRadius} 0 0 1 -${cornerRadius},-${cornerRadius} v -${viewH - 2 * cornerRadius} a ${cornerRadius},${cornerRadius} 0 0 1 ${cornerRadius},-${cornerRadius} Z`;

    // Generate cutouts in mask for drill holes
    if (drillFile) {
        drillFile.imageTree.children.forEach(child => {
            if (child.type === "imageShape" && child.shape?.type === "circle") {
                const shape = child.shape as any;
                const cx = mapX(shape.cx, drillFile.units).toFixed(3);
                const cy = mapY(shape.cy, drillFile.units).toFixed(3);
                const r = (mapDim(shape.r, drillFile.units) * 0.5).toFixed(3);
                maskHoles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="black" />`);
            }
        });
    }

    // 1. Add FR4 substrate base shape (masked to cut out physical drill holes)
    svgElements.push(`<g mask="url(#board-mask-${side})">`);
    svgElements.push(`<path d="${substratePath}" fill="${theme.baseColor}" filter="url(#shadow-${side})" />`);

    // 2. Copper Layer (under mask, drawn in raw copper color)
    if (copperFile) {
        svgElements.push(`<g fill="${theme.copperColor}" stroke="${theme.copperColor}">`);
        renderLayerContent(copperFile);
        svgElements.push(`</g>`);
    }

    // 3. Solder Mask Overlay (semi-transparent green overlay with 3D glossy highlights)
    svgElements.push(`<path d="${substratePath}" fill="${theme.maskColor}" opacity="0.75" />`);
    svgElements.push(`<path d="${substratePath}" fill="url(#shine-${side})" />`);
    svgElements.push(`<path d="${substratePath}" fill="url(#vignette-${side})" />`);

    // 4. Exposed Pads (rendered in gold/copper themed color above the solder mask)
    const renderSourceFile = maskFile || copperFile;
    if (renderSourceFile) {
        svgElements.push(`<g fill="${theme.copperColor}" stroke="${theme.copperColor}">`);
        renderLayerContent(renderSourceFile, maskFile ? "all" : "flash-only");
        svgElements.push(`</g>`);
    }

    // 5. Silkscreen Legend (rendered in crisp white)
    if (silkFile) {
        svgElements.push(`<g fill="${theme.silkscreenColor}" stroke="${theme.silkscreenColor}">`);
        renderLayerContent(silkFile);
        svgElements.push(`</g>`);
    }

    // 6. Drill Plated Rings (rendered in gold/copper themed color above mask)
    if (drillFile) {
        svgElements.push(`<g fill="${theme.copperColor}">`);
        drillFile.imageTree.children.forEach(child => {
            if (child.type === "imageShape" && child.shape?.type === "circle") {
                const shape = child.shape as any;
                const cx = mapX(shape.cx, drillFile.units).toFixed(3);
                const cy = mapY(shape.cy, drillFile.units).toFixed(3);
                const r = (mapDim(shape.r, drillFile.units) * 0.5).toFixed(3);
                const rOuter = (parseFloat(r) + 0.15).toFixed(3);
                // Plated gold ring
                svgElements.push(`<circle cx="${cx}" cy="${cy}" r="${rOuter}" stroke="none" />`);
            }
        });
        svgElements.push(`</g>`);
    }

    // Close the masked board group
    svgElements.push(`</g>`);

    // 7. Bezel Border outline
    svgElements.push(`<path d="${substratePath}" fill="none" stroke="#BFBFBF" stroke-width="0.4" />`);

    // 8. Render explicit Gerber outline paths if available (for slot/cutout rendering)
    if (outlineFile) {
        let outlinePath = "";
        outlineFile.imageTree.children.forEach(child => {
            outlinePath += renderChildToSVGPath(child, outlineFile.units);
        });
        if (outlinePath) {
            svgElements.push(`<path d="${outlinePath}" fill="none" stroke="#BFBFBF" stroke-width="0.3" />`);
        }
    }

    function renderLayerContent(file: ParsedGerberFile, filterMode: "all" | "flash-only" = "all") {
        file.imageTree.children.forEach(child => {
            if (filterMode === "flash-only" && child.type !== "imageShape") return;

            if (child.type === "imageShape" && child.shape) {
                const shape = child.shape as any;
                const cx = mapX(shape.cx ?? shape.x ?? 0, file.units).toFixed(3);
                const cy = mapY(shape.cy ?? shape.y ?? 0, file.units).toFixed(3);

                if (shape.type === "circle") {
                    const r = mapDim(shape.r, file.units).toFixed(3);
                    svgElements.push(`<circle cx="${cx}" cy="${cy}" r="${r}" stroke="none" />`);
                } else if (shape.type === "rectangle") {
                    const w = mapDim(shape.xSize, file.units).toFixed(3);
                    const h = mapDim(shape.ySize, file.units).toFixed(3);
                    const rx = (parseFloat(cx) - parseFloat(w) / 2).toFixed(3);
                    const ry = (parseFloat(cy) - parseFloat(h) / 2).toFixed(3);
                    svgElements.push(`<rect x="${rx}" y="${ry}" width="${w}" height="${h}" rx="${shape.r ? mapDim(shape.r, file.units).toFixed(3) : 0}" stroke="none" />`);
                } else if (shape.type === "polygon" && shape.points) {
                    const pts = shape.points.map((p: any) => `${mapX(p[0], file.units).toFixed(3)},${mapY(p[1], file.units).toFixed(3)}`).join(" L ");
                    svgElements.push(`<path d="M ${pts} Z" stroke="none" />`);
                } else if (shape.type === "layeredShape" && shape.shapes) {
                    shape.shapes.forEach((subShape: any) => {
                        const subElement = renderChildToSVGPath({ type: "imageShape", shape: subShape }, file.units);
                        if (subElement) {
                            svgElements.push(`<path d="${subElement}" fill="${subShape.erase ? "none" : "currentColor"}" stroke="none" />`);
                        }
                    });
                }
            } else if (child.type === "imagePath" && child.segments) {
                const widthVal = mapDim(child.width || 0.2, file.units).toFixed(3);
                child.segments.forEach((seg: any) => {
                    const sx = mapX(seg.start[0], file.units).toFixed(3);
                    const sy = mapY(seg.start[1], file.units).toFixed(3);
                    const ex = mapX(seg.end[0], file.units).toFixed(3);
                    const ey = mapY(seg.end[1], file.units).toFixed(3);

                    if (seg.type === "line") {
                        svgElements.push(`<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke-width="${widthVal}" stroke-linecap="round" fill="none" />`);
                    } else if (seg.type === "arc") {
                        const r = mapDim(seg.radius, file.units).toFixed(3);
                        const sweep = seg.start[2] > seg.end[2] ? 0 : 1;
                        const finalSweep = side === "top" ? sweep : (sweep === 1 ? 0 : 1);
                        svgElements.push(`<path d="M ${sx} ${sy} A ${r} ${r} 0 0 ${finalSweep} ${ex} ${ey}" stroke-width="${widthVal}" stroke-linecap="round" fill="none" />`);
                    }
                });
            } else if (child.type === "imageRegion" && child.segments) {
                let pathD = "";
                child.segments.forEach((seg: any, idx: number) => {
                    const sx = mapX(seg.start[0], file.units).toFixed(3);
                    const sy = mapY(seg.start[1], file.units).toFixed(3);
                    const ex = mapX(seg.end[0], file.units).toFixed(3);
                    const ey = mapY(seg.end[1], file.units).toFixed(3);

                    if (idx === 0) pathD += `M ${sx} ${sy}`;
                    if (seg.type === "line") {
                        pathD += ` L ${ex} ${ey}`;
                    } else if (seg.type === "arc") {
                        const r = mapDim(seg.radius, file.units).toFixed(3);
                        const sweep = seg.start[2] > seg.end[2] ? 0 : 1;
                        const finalSweep = side === "top" ? sweep : (sweep === 1 ? 0 : 1);
                        pathD += ` A ${r} ${r} 0 0 ${finalSweep} ${ex} ${ey}`;
                    }
                });
                if (pathD) svgElements.push(`<path d="${pathD} Z" stroke="none" />`);
            }
        });
    }

    function renderChildToSVGPath(child: any, fileUnits: "mm" | "in"): string {
        let d = "";
        if (child.type === "imageShape" && child.shape) {
            const shape = child.shape;
            const cx = mapX(shape.cx ?? shape.x ?? 0, fileUnits);
            const cy = mapY(shape.cy ?? shape.y ?? 0, fileUnits);
            if (shape.type === "circle") {
                const r = mapDim(shape.r, fileUnits);
                d += ` M ${cx} ${cy} m -${r},0 a ${r},${r} 0 1,0 ${(r * 2)},0 a ${r},${r} 0 1,0 -${(r * 2)},0`;
            } else if (shape.type === "rectangle") {
                const w = mapDim(shape.xSize, fileUnits);
                const h = mapDim(shape.ySize, fileUnits);
                const rx = cx - w / 2;
                const ry = cy - h / 2;
                d += ` M ${rx} ${ry} h ${w} v ${h} h -${w} Z`;
            } else if (shape.type === "polygon" && shape.points) {
                const pts = shape.points.map((p: any) => `${mapX(p[0], fileUnits).toFixed(3)} ${mapY(p[1], fileUnits).toFixed(3)}`).join(" L ");
                d += ` M ${pts} Z`;
            }
        } else if ((child.type === "imagePath" || child.type === "imageRegion") && child.segments) {
            child.segments.forEach((seg: any, idx: number) => {
                const sx = mapX(seg.start[0], fileUnits).toFixed(3);
                const sy = mapY(seg.start[1], fileUnits).toFixed(3);
                const ex = mapX(seg.end[0], fileUnits).toFixed(3);
                const ey = mapY(seg.end[1], fileUnits).toFixed(3);

                if (idx === 0) d += ` M ${sx} ${sy}`;
                if (seg.type === "line") {
                    d += ` L ${ex} ${ey}`;
                } else if (seg.type === "arc") {
                    const r = mapDim(seg.radius, fileUnits).toFixed(3);
                    const sweep = seg.start[2] > seg.end[2] ? 0 : 1;
                    const finalSweep = side === "top" ? sweep : (sweep === 1 ? 0 : 1);
                    d += ` A ${r} ${r} 0 0 ${finalSweep} ${ex} ${ey}`;
                }
            });
        }
        return d;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}" width="100%" height="100%" style="background-color: transparent;">
        <defs>
            <!-- Mask to dynamically cut drill holes out of the board substrate -->
            <mask id="board-mask-${side}">
                <rect x="-10" y="-10" width="${viewW + 20}" height="${viewH + 20}" fill="white" />
                ${maskHoles.join("\n")}
            </mask>

            <!-- Drop shadow for the PCB board -->
            <filter id="shadow-${side}" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0.5" dy="1.0" stdDeviation="0.8" flood-color="#000000" flood-opacity="0.4" />
            </filter>

            <!-- Shiny glossy reflection highlight -->
            <linearGradient id="shine-${side}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08" />
                <stop offset="40%" stop-color="#ffffff" stop-opacity="0.0" />
                <stop offset="85%" stop-color="#000000" stop-opacity="0.12" />
            </linearGradient>

            <!-- Subtle vignette shadow towards the edges -->
            <radialGradient id="vignette-${side}" cx="50%" cy="50%" r="70%">
                <stop offset="60%" stop-color="#000000" stop-opacity="0.0" />
                <stop offset="100%" stop-color="#000000" stop-opacity="0.25" />
            </radialGradient>
        </defs>

        ${svgElements.join("\n")}
    </svg>`;
}
