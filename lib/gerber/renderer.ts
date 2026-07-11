import { ParsedGerberFile, GerberDrawCommand, Aperture } from "./types";

interface SolderMaskTheme {
    baseColor: string;       // FR4 substrate
    maskColor: string;       // Solder mask color
    copperColor: string;     // Copper under mask
    silkscreenColor: string; // Silkscreen color
}

// Visual themes matching different solder mask colors
const COLOR_THEMES: { [key: string]: SolderMaskTheme } = {
    // Green (default)
    "#52c41a": {
        baseColor: "#134A23",
        maskColor: "#1F7A35",
        copperColor: "#c49486", // Raw copper
        silkscreenColor: "#FFFFFF"
    },
    // Purple
    "#722ed1": {
        baseColor: "#2E0854",
        maskColor: "#5B21B6",
        copperColor: "#C4927C",
        silkscreenColor: "#FFFFFF"
    },
    // Red
    "#f5222d": {
        baseColor: "#4A0E0E",
        maskColor: "#991B1B",
        copperColor: "#C4927C",
        silkscreenColor: "#FFFFFF"
    },
    // Yellow
    "#fadb14": {
        baseColor: "#5C3E00",
        maskColor: "#D97706",
        copperColor: "#C4927C",
        silkscreenColor: "#0F172A"
    },
    // Blue
    "#1677ff": {
        baseColor: "#0A2540",
        maskColor: "#1E3A8A",
        copperColor: "#C4927C",
        silkscreenColor: "#FFFFFF"
    },
    // White
    "#ffffff": {
        baseColor: "#D1D5DB",
        maskColor: "#F3F4F6",
        copperColor: "#C4927C",
        silkscreenColor: "#1F2937"
    },
    // Black
    "#000000": {
        baseColor: "#111827",
        maskColor: "#1F2937",
        copperColor: "#C4927C",
        silkscreenColor: "#F3F4F6"
    },
    // Matte Black
    "#18181b": {
        baseColor: "#09090B",
        maskColor: "#18181B",
        copperColor: "#C4927C",
        silkscreenColor: "#F3F4F6"
    }
};

export function renderPCBVectorToCanvas(
    canvas: HTMLCanvasElement,
    parsedFiles: ParsedGerberFile[],
    side: "top" | "bottom",
    pcbColor: string,
    activeLayers: {
        outline: boolean;
        topCopper: boolean;
        bottomCopper: boolean;
        solderMask: boolean;
        silkscreen: boolean;
        drills: boolean;
    }
) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Enable high quality antialiasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 1. Draw Background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get color theme
    const theme = COLOR_THEMES[pcbColor.toLowerCase()] || COLOR_THEMES["#195628"];

    // Calculate Bounding Box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    parsedFiles.forEach(f => {
        if (f.bounds.maxX > f.bounds.minX && f.bounds.maxY > f.bounds.minY) {
            if (f.bounds.minX < minX) minX = f.bounds.minX;
            if (f.bounds.maxX > maxX) maxX = f.bounds.maxX;
            if (f.bounds.minY < minY) minY = f.bounds.minY;
            if (f.bounds.maxY > maxY) maxY = f.bounds.maxY;
        }
    });

    const outlineFile = parsedFiles.find(f => f.type === "outline");

    if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
        minX = 0; maxX = 100; minY = 0; maxY = 100;
    }

    const pcbW = maxX - minX;
    const pcbH = maxY - minY;
    const padding = 20;

    // Scale to fit viewport maintaining aspect ratio
    const scaleX = (canvas.width - padding * 2) / pcbW;
    const scaleY = (canvas.height - padding * 2) / pcbH;
    const scale = Math.min(scaleX, scaleY);

    const dx = (canvas.width - pcbW * scale) / 2 - minX * scale;
    const dy = (canvas.height - pcbH * scale) / 2 - minY * scale;

    // Horizontal mirroring for bottom view
    const mapX = (x: number) => {
        const val = x * scale + dx;
        return side === "bottom" ? canvas.width - val : val;
    };
    const mapY = (y: number) => canvas.height - (y * scale + dy);

    // Helper to generate board shape path
    const buildBoardOutlinePath = (c: CanvasRenderingContext2D) => {
        c.beginPath();
        if (outlineFile && outlineFile.commands.length > 0) {
            let first = true;
            outlineFile.commands.forEach(cmd => {
                if (cmd.op === "poly" && cmd.polyPoints) {
                    cmd.polyPoints.forEach((p, idx) => {
                        if (idx === 0) c.moveTo(mapX(p.x), mapY(p.y));
                        else c.lineTo(mapX(p.x), mapY(p.y));
                    });
                } else if (cmd.op === "move" || first) {
                    c.moveTo(mapX(cmd.x), mapY(cmd.y));
                    first = false;
                } else if (cmd.op === "draw") {
                    c.lineTo(mapX(cmd.x), mapY(cmd.y));
                }
            });
            c.closePath();
        } else {
            const startX = side === "bottom" ? mapX(maxX) : mapX(minX);
            c.roundRect(startX, mapY(maxY), pcbW * scale, pcbH * scale, 12 * (scale / 5));
        }
    };

    // 2. Draw Board Outline, Shadow, and FR4 Substrate
    if (activeLayers.outline) {
        ctx.save();
        // Subtle drop shadow for realistic 3D appearance
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 5;

        buildBoardOutlinePath(ctx);
        ctx.fillStyle = theme.baseColor; // FR4 substrate
        ctx.fill();
        ctx.restore();

        // Draw light gray bezel border
        ctx.save();
        buildBoardOutlinePath(ctx);
        ctx.strokeStyle = "#BFBFBF";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }

    // Helper to draw Gerber draw/arc/poly commands for a file
    const drawGerberLayer = (file: ParsedGerberFile, drawAperture: (cmd: GerberDrawCommand, ap: Aperture | null) => void) => {
        file.commands.forEach(cmd => {
            const ap = cmd.apertureId ? file.apertures[cmd.apertureId] : null;

            if (cmd.op === "draw") {
                const width = ap ? (ap.dimensions[0] || 0.2) : 0.2;
                ctx.lineWidth = width * scale;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.beginPath();
                ctx.moveTo(mapX(cmd.startX ?? cmd.x), mapY(cmd.startY ?? cmd.y));
                ctx.lineTo(mapX(cmd.x), mapY(cmd.y));
                ctx.stroke();
            } else if (cmd.op === "arc" && cmd.startX !== undefined && cmd.startY !== undefined) {
                const width = ap ? (ap.dimensions[0] || 0.2) : 0.2;
                ctx.lineWidth = width * scale;
                ctx.lineCap = "round";
                const cx = cmd.startX + (cmd.i ?? 0);
                const cy = cmd.startY + (cmd.j ?? 0);
                const radius = Math.sqrt((cmd.i ?? 0) ** 2 + (cmd.j ?? 0) ** 2);
                const startAngle = Math.atan2(cmd.startY - cy, cmd.startX - cx);
                const endAngle = Math.atan2(cmd.y - cy, cmd.x - cx);
                ctx.beginPath();
                ctx.arc(mapX(cx), mapY(cy), radius * scale, startAngle, endAngle, cmd.arcDir === "ccw");
                ctx.stroke();
            } else if (cmd.op === "poly" && cmd.polyPoints) {
                ctx.beginPath();
                cmd.polyPoints.forEach((pt, index) => {
                    if (index === 0) ctx.moveTo(mapX(pt.x), mapY(pt.y));
                    else ctx.lineTo(mapX(pt.x), mapY(pt.y));
                });
                ctx.closePath();
                ctx.fill();
            } else if (cmd.op === "flash") {
                drawAperture(cmd, ap);
            }
        });
    };

    // 3. Render Copper Layer Under Solder Mask
    const activeCopper = side === "top" ? "copper_top" : "copper_bottom";
    const copperFile = parsedFiles.find(f => f.type === "copper_top" || f.type === "copper_bottom"); // find either top or bottom based on side

    if (copperFile && ((side === "top" && activeLayers.topCopper) || (side === "bottom" && activeLayers.bottomCopper))) {
        ctx.save();
        // Draw copper traces
        ctx.strokeStyle = theme.copperColor;
        ctx.fillStyle = theme.copperColor;

        const drawCopperFlash = (cmd: GerberDrawCommand, ap: Aperture | null) => {
            if (!ap) return;
            if (ap.shape === "C") {
                ctx.beginPath();
                ctx.arc(mapX(cmd.x), mapY(cmd.y), (ap.dimensions[0] / 2) * scale, 0, Math.PI * 2);
                ctx.fill();
            } else if (ap.shape === "R") {
                const w = (ap.dimensions[0] || 0.5) * scale;
                const h = (ap.dimensions[1] || 0.5) * scale;
                ctx.fillRect(mapX(cmd.x) - w / 2, mapY(cmd.y) - h / 2, w, h);
            } else if (ap.shape === "O") {
                const w = (ap.dimensions[0] || 0.5) * scale;
                const h = (ap.dimensions[1] || 0.5) * scale;
                ctx.beginPath();
                ctx.ellipse(mapX(cmd.x), mapY(cmd.y), w / 2, h / 2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        drawGerberLayer(copperFile, drawCopperFlash);
        ctx.restore();
    }

    // 4. Render Solder Mask Overlay
    if (activeLayers.outline && activeLayers.solderMask) {
        ctx.save();
        // Clip to board outline
        buildBoardOutlinePath(ctx);
        ctx.clip();

        // Semi-transparent solder mask overlay (75% opacity)
        ctx.fillStyle = theme.maskColor;
        ctx.globalAlpha = 0.75;
        buildBoardOutlinePath(ctx);
        ctx.fill();

        // 3D highlights & reflection on solder mask
        ctx.globalAlpha = 1.0;
        const reflectionGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        reflectionGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
        reflectionGrad.addColorStop(0.4, "rgba(255, 255, 255, 0.0)");
        reflectionGrad.addColorStop(0.8, "rgba(0, 0, 0, 0.12)");
        ctx.fillStyle = reflectionGrad;
        buildBoardOutlinePath(ctx);
        ctx.fill();
        ctx.restore();
    }

    // 5. Draw Exposed Pads (Above Solder Mask, Gold/Copper #C4927C)
    if (copperFile && activeLayers.solderMask) {
        ctx.save();
        ctx.fillStyle = "#C4927C";
        ctx.strokeStyle = "#C4927C";

        copperFile.commands.forEach(cmd => {
            if (cmd.op === "flash") {
                const ap = cmd.apertureId ? copperFile.apertures[cmd.apertureId] : null;
                if (!ap) return;

                if (ap.shape === "C") {
                    ctx.beginPath();
                    ctx.arc(mapX(cmd.x), mapY(cmd.y), (ap.dimensions[0] / 2) * scale, 0, Math.PI * 2);
                    ctx.fill();
                } else if (ap.shape === "R") {
                    const w = (ap.dimensions[0] || 0.5) * scale;
                    const h = (ap.dimensions[1] || 0.5) * scale;
                    ctx.fillRect(mapX(cmd.x) - w / 2, mapY(cmd.y) - h / 2, w, h);
                } else if (ap.shape === "O") {
                    const w = (ap.dimensions[0] || 0.5) * scale;
                    const h = (ap.dimensions[1] || 0.5) * scale;
                    ctx.beginPath();
                    ctx.ellipse(mapX(cmd.x), mapY(cmd.y), w / 2, h / 2, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else if (ap.shape === "T") {
                    const outerR = (ap.dimensions[0] / 2) * scale;
                    const innerR = (ap.dimensions[1] / 2) * scale;
                    ctx.beginPath();
                    ctx.arc(mapX(cmd.x), mapY(cmd.y), outerR, 0, Math.PI * 2);
                    ctx.arc(mapX(cmd.x), mapY(cmd.y), innerR, 0, Math.PI * 2, true);
                    ctx.fill();
                }
            }
        });
        ctx.restore();
    }

    // 6. Draw Silkscreen Legends (White #FFFFFF)
    const activeSilkscreen = side === "top" ? "silkscreen_top" : "silkscreen_bottom";
    const silkFile = parsedFiles.find(f => f.type === activeSilkscreen);

    if (silkFile && activeLayers.silkscreen) {
        ctx.save();
        ctx.strokeStyle = "#FFFFFF";
        ctx.fillStyle = "#FFFFFF";

        const drawSilkFlash = (cmd: GerberDrawCommand, ap: Aperture | null) => {
            if (!ap) return;
            if (ap.shape === "C") {
                ctx.beginPath();
                ctx.arc(mapX(cmd.x), mapY(cmd.y), (ap.dimensions[0] / 2) * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        drawGerberLayer(silkFile, drawSilkFlash);
        ctx.restore();
    }

    // 7. Draw Drill Holes (Annular Ring + Hole)
    const drillFile = parsedFiles.find(f => f.type === "drill");
    if (drillFile && activeLayers.drills) {
        ctx.save();

        // 1. Draw gold plated rings
        ctx.fillStyle = "#C4927C";
        drillFile.commands.forEach(cmd => {
            if (cmd.op === "flash") {
                const ap = cmd.apertureId ? drillFile.apertures[cmd.apertureId] : null;
                const diameter = ap ? (ap.dimensions[0] || 0.8) : 0.8;
                ctx.beginPath();
                ctx.arc(mapX(cmd.x), mapY(cmd.y), (diameter / 4 + 0.15) * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // 2. Erase the hole center to show the page background
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        drillFile.commands.forEach(cmd => {
            if (cmd.op === "flash") {
                const ap = cmd.apertureId ? drillFile.apertures[cmd.apertureId] : null;
                const diameter = ap ? (ap.dimensions[0] || 0.8) : 0.8;
                ctx.beginPath();
                ctx.arc(mapX(cmd.x), mapY(cmd.y), (diameter / 4) * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.restore();
    }
}
