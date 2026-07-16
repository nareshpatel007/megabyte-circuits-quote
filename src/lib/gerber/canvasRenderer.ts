import { ParsedGerberFile } from "./types";
import { toMM } from "./utils";

interface SolderMaskTheme {
    baseColor: string;       // Substrate base (Dark Green)
    maskColor: string;       // soldermask overlay
    copperColor: string;     // trace copper color (Dark Copper)
    silkscreenColor: string; // silkscreen markings (White)
}

const PCB_COLOR_THEMES: Record<string, SolderMaskTheme> = {
    "#52c41a": {
        baseColor: "#0A401F",
        maskColor: "rgba(13, 92, 45, 0.85)", // Dark Green Solder Mask
        copperColor: "#805A36",             // Dark Copper tracks
        silkscreenColor: "#FFFFFF"          // White silkscreen
    },
    "#722ed1": {
        baseColor: "#22043d",
        maskColor: "rgba(91, 33, 182, 0.82)",
        copperColor: "#805A36",
        silkscreenColor: "#FFFFFF"
    },
    "#f5222d": {
        baseColor: "#3a0606",
        maskColor: "rgba(153, 27, 27, 0.82)",
        copperColor: "#805A36",
        silkscreenColor: "#FFFFFF"
    },
    "#fadb14": {
        baseColor: "#422c00",
        maskColor: "rgba(217, 119, 6, 0.82)",
        copperColor: "#805A36",
        silkscreenColor: "#0F172A"
    },
    "#1677ff": {
        baseColor: "#05152a",
        maskColor: "rgba(30, 58, 138, 0.82)",
        copperColor: "#805A36",
        silkscreenColor: "#FFFFFF"
    },
    "#ffffff": {
        baseColor: "#b5b7bb",
        maskColor: "rgba(243, 244, 246, 0.88)",
        copperColor: "#805A36",
        silkscreenColor: "#1F2937"
    },
    "#000000": {
        baseColor: "#090c12",
        maskColor: "rgba(31, 41, 55, 0.92)",
        copperColor: "#805A36",
        silkscreenColor: "#F3F4F6"
    },
    "#18181b": {
        baseColor: "#050507",
        maskColor: "rgba(24, 24, 27, 0.94)",
        copperColor: "#805A36",
        silkscreenColor: "#F3F4F6"
    }
};

export function renderPCBToCanvas(
    canvas: HTMLCanvasElement,
    parsedFiles: ParsedGerberFile[],
    side: "top" | "bottom",
    pcbColor: string,
    dimensions: { width: number; height: number; minX: number; maxX: number; minY: number; maxY: number },
    zoom: number,
    pan: { x: number; y: number },
    dpr: number = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height, minX, maxX, minY, maxY } = dimensions;
    const theme = PCB_COLOR_THEMES[pcbColor.toLowerCase()] || PCB_COLOR_THEMES["#52c41a"];

    const viewW = width > 0 ? width : 100;
    const viewH = height > 0 ? height : 100;

    // Reset transformations and clear canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply high-DPI device scaling (anti-aliased look)
    ctx.scale(dpr, dpr);

    // Apply zoom and pan
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Mirror the bottom side view horizontally around the center of the board
    if (side === "bottom") {
        ctx.translate(viewW / 2, viewH / 2);
        ctx.scale(-1, 1);
        ctx.translate(-viewW / 2, -viewH / 2);
    }

    // Coordinates mapping relative to origin (same for both top/bottom because context handles mirroring)
    const mapX = (x: number, fileUnits: "mm" | "in") => {
        const mm = toMM(x, fileUnits);
        return mm - minX;
    };

    const mapY = (y: number, fileUnits: "mm" | "in") => {
        const mm = toMM(y, fileUnits);
        return viewH - (mm - minY);
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

    // Board rounded rectangle boundary
    const cornerRadius = Math.min(viewW, viewH) * 0.03;
    const drawBoardShape = (c: CanvasRenderingContext2D) => {
        c.beginPath();
        c.roundRect(0, 0, viewW, viewH, cornerRadius);
        c.closePath();
    };

    // 1. Board Substrate (Dark Green)
    ctx.save();
    ctx.fillStyle = theme.baseColor;
    drawBoardShape(ctx);
    ctx.fill();
    ctx.restore();

    // 2. Copper Tracks & pours (Dark Copper)
    if (copperFile) {
        ctx.save();
        ctx.fillStyle = theme.copperColor;
        ctx.strokeStyle = theme.copperColor;
        renderLayerContent(ctx, copperFile, "all");
        ctx.restore();
    }

    // 3. Solder Mask Overlay (translucent overlay)
    ctx.save();
    ctx.fillStyle = theme.maskColor;
    drawBoardShape(ctx);
    ctx.fill();

    // Gloss / shine specular gradient
    const shineGrad = ctx.createLinearGradient(0, 0, viewW, viewH);
    shineGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
    shineGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.0)");
    shineGrad.addColorStop(0.85, "rgba(0, 0, 0, 0.15)");
    ctx.fillStyle = shineGrad;
    drawBoardShape(ctx);
    ctx.fill();
    ctx.restore();

    // 4. Exposed Pads (ENIG Gold)
    const renderSourceFile = maskFile || copperFile;
    if (renderSourceFile) {
        ctx.save();
        const goldGrad = ctx.createLinearGradient(0, 0, viewW, viewH);
        goldGrad.addColorStop(0, "#FBE39A");
        goldGrad.addColorStop(0.5, "#D4AF37"); // ENIG Gold
        goldGrad.addColorStop(1, "#94701d");

        ctx.fillStyle = goldGrad;
        ctx.strokeStyle = goldGrad;
        renderLayerContent(ctx, renderSourceFile, maskFile ? "all" : "flash-only");
        ctx.restore();
    }

    // 5. Silkscreen Legend (White)
    if (silkFile) {
        ctx.save();
        ctx.fillStyle = theme.silkscreenColor;
        ctx.strokeStyle = theme.silkscreenColor;
        renderLayerContent(ctx, silkFile, "all");
        ctx.restore();
    }

    // 6. Drill Plated Rings (ENIG Gold)
    if (drillFile) {
        ctx.save();
        const goldGrad = ctx.createLinearGradient(0, 0, viewW, viewH);
        goldGrad.addColorStop(0, "#FBE39A");
        goldGrad.addColorStop(0.5, "#D4AF37");
        ctx.fillStyle = goldGrad;
        
        drillFile.imageTree.children.forEach(child => {
            if (child.type === "imageShape" && child.shape?.type === "circle") {
                const shape = child.shape as any;
                const cx = mapX(shape.cx, drillFile.units);
                const cy = mapY(shape.cy, drillFile.units);
                const r = mapDim(shape.r, drillFile.units) * 0.5;
                const rOuter = r + 0.15; // plated ring width

                ctx.beginPath();
                ctx.arc(cx, cy, rOuter, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
        ctx.restore();
    }

    // 7. Outline Layer (Yellow)
    if (outlineFile) {
        ctx.save();
        ctx.strokeStyle = "#FADB14"; // Yellow outline
        ctx.lineWidth = 0.45;
        outlineFile.imageTree.children.forEach(child => {
            ctx.beginPath();
            drawChildToContext(ctx, child, outlineFile.units);
            ctx.stroke();
        });
        ctx.restore();
    } else {
        ctx.save();
        ctx.strokeStyle = "rgba(250, 219, 20, 0.7)";
        ctx.lineWidth = 0.45;
        drawBoardShape(ctx);
        ctx.stroke();
        ctx.restore();
    }

    // 8. Drill Holes (Cutout / Transparency)
    if (drillFile) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "black";
        
        drillFile.imageTree.children.forEach(child => {
            if (child.type === "imageShape" && child.shape?.type === "circle") {
                const shape = child.shape as any;
                const cx = mapX(shape.cx, drillFile.units);
                const cy = mapY(shape.cy, drillFile.units);
                const r = mapDim(shape.r, drillFile.units) * 0.5;

                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
        ctx.restore();
    }

    // Helpers
    function renderLayerContent(c: CanvasRenderingContext2D, file: ParsedGerberFile, filterMode: "all" | "flash-only") {
        file.imageTree.children.forEach(child => {
            if (filterMode === "flash-only" && child.type !== "imageShape") return;

            if (child.type === "imageShape" && child.shape) {
                const shape = child.shape as any;
                const cx = mapX(shape.cx ?? shape.x ?? 0, file.units);
                const cy = mapY(shape.cy ?? shape.y ?? 0, file.units);

                if (shape.type === "circle") {
                    const r = mapDim(shape.r, file.units);
                    c.beginPath();
                    c.arc(cx, cy, r, 0, 2 * Math.PI);
                    c.fill();
                } else if (shape.type === "rectangle") {
                    const w = mapDim(shape.xSize, file.units);
                    const h = mapDim(shape.ySize, file.units);
                    const rx = cx - w / 2;
                    const ry = cy - h / 2;
                    c.beginPath();
                    c.roundRect(rx, ry, w, h, shape.r ? mapDim(shape.r, file.units) : 0);
                    c.fill();
                } else if (shape.type === "polygon" && shape.points) {
                    c.beginPath();
                    shape.points.forEach((p: any, idx: number) => {
                        const px = mapX(p[0], file.units);
                        const py = mapY(p[1], file.units);
                        if (idx === 0) c.moveTo(px, py);
                        else c.lineTo(px, py);
                    });
                    c.closePath();
                    c.fill();
                } else if (shape.type === "layeredShape" && shape.shapes) {
                    shape.shapes.forEach((subShape: any) => {
                        c.save();
                        if (subShape.erase) {
                            c.globalCompositeOperation = "destination-out";
                            c.fillStyle = "black";
                        }
                        const subCx = mapX(subShape.cx ?? subShape.x ?? 0, file.units);
                        const subCy = mapY(subShape.cy ?? subShape.y ?? 0, file.units);
                        if (subShape.type === "circle") {
                            const r = mapDim(subShape.r, file.units);
                            c.beginPath();
                            c.arc(subCx, subCy, r, 0, 2 * Math.PI);
                            c.fill();
                        } else if (subShape.type === "rectangle") {
                            const w = mapDim(subShape.xSize, file.units);
                            const h = mapDim(subShape.ySize, file.units);
                            c.beginPath();
                            c.roundRect(subCx - w/2, subCy - h/2, w, h, subShape.r ? mapDim(subShape.r, file.units) : 0);
                            c.fill();
                        }
                        c.restore();
                    });
                }
            } else if (child.type === "imagePath" && child.segments) {
                const widthVal = mapDim(child.width || 0.2, file.units);
                c.lineWidth = widthVal;
                c.lineCap = "round";
                c.lineJoin = "round";

                child.segments.forEach((seg: any) => {
                    const sx = mapX(seg.start[0], file.units);
                    const sy = mapY(seg.start[1], file.units);
                    const ex = mapX(seg.end[0], file.units);
                    const ey = mapY(seg.end[1], file.units);

                    c.beginPath();
                    if (seg.type === "line") {
                        c.moveTo(sx, sy);
                        c.lineTo(ex, ey);
                        c.stroke();
                    } else if (seg.type === "arc") {
                        const r = mapDim(seg.radius, file.units);
                        c.moveTo(sx, sy);
                        c.arcTo(sx + r, sy, ex, ey, r);
                        c.stroke();
                    }
                });
            } else if (child.type === "imageRegion" && child.segments) {
                c.beginPath();
                child.segments.forEach((seg: any, idx: number) => {
                    const sx = mapX(seg.start[0], file.units);
                    const sy = mapY(seg.start[1], file.units);
                    const ex = mapX(seg.end[0], file.units);
                    const ey = mapY(seg.end[1], file.units);

                    if (idx === 0) c.moveTo(sx, sy);
                    if (seg.type === "line") {
                        c.lineTo(ex, ey);
                    }
                });
                c.closePath();
                c.fill();
            }
        });
    }

    function drawChildToContext(c: CanvasRenderingContext2D, child: any, fileUnits: "mm" | "in") {
        if (child.type === "imageShape" && child.shape) {
            const shape = child.shape;
            const cx = mapX(shape.cx ?? shape.x ?? 0, fileUnits);
            const cy = mapY(shape.cy ?? shape.y ?? 0, fileUnits);
            if (shape.type === "circle") {
                const r = mapDim(shape.r, fileUnits);
                c.arc(cx, cy, r, 0, 2 * Math.PI);
            } else if (shape.type === "rectangle") {
                const w = mapDim(shape.xSize, fileUnits);
                const h = mapDim(shape.ySize, fileUnits);
                c.roundRect(cx - w / 2, cy - h / 2, w, h, shape.r ? mapDim(shape.r, fileUnits) : 0);
            } else if (shape.type === "polygon" && shape.points) {
                shape.points.forEach((p: any, idx: number) => {
                    const px = mapX(p[0], fileUnits);
                    const py = mapY(p[1], fileUnits);
                    if (idx === 0) c.moveTo(px, py);
                    else c.lineTo(px, py);
                });
                c.closePath();
            }
        } else if ((child.type === "imagePath" || child.type === "imageRegion") && child.segments) {
            child.segments.forEach((seg: any, idx: number) => {
                const sx = mapX(seg.start[0], fileUnits);
                const sy = mapY(seg.start[1], fileUnits);
                const ex = mapX(seg.end[0], fileUnits);
                const ey = mapY(seg.end[1], fileUnits);

                if (idx === 0) c.moveTo(sx, sy);
                if (seg.type === "line") {
                    c.lineTo(ex, ey);
                }
            });
        }
    }
}
