import { ParsedGerberFile, GerberDrawCommand, Aperture } from "./types";

interface SolderMaskTheme {
    baseColor: string;
    darkColor: string;
    copperColor: string;
    silkscreenColor: string;
}

const COLOR_THEMES: { [key: string]: SolderMaskTheme } = {
    // Green
    "#52c41a": {
        baseColor: "#1F7A35",
        darkColor: "#155D27",
        copperColor: "#2C8A3E",
        silkscreenColor: "#FFFFFF"
    },
    // Purple
    "#722ed1": {
        baseColor: "#5B21B6",
        darkColor: "#4C1D95",
        copperColor: "#7C3AED",
        silkscreenColor: "#FFFFFF"
    },
    // Red
    "#f5222d": {
        baseColor: "#991B1B",
        darkColor: "#7F1D1D",
        copperColor: "#B91C1C",
        silkscreenColor: "#FFFFFF"
    },
    // Yellow
    "#fadb14": {
        baseColor: "#D97706",
        darkColor: "#B45309",
        copperColor: "#F59E0B",
        silkscreenColor: "#0F172A"
    },
    // Blue
    "#1677ff": {
        baseColor: "#1E3A8A",
        darkColor: "#1E1B4B",
        copperColor: "#2563EB",
        silkscreenColor: "#FFFFFF"
    },
    // White
    "#ffffff": {
        baseColor: "#F3F4F6",
        darkColor: "#E5E7EB",
        copperColor: "#D1D5DB",
        silkscreenColor: "#1F2937"
    },
    // Black
    "#000000": {
        baseColor: "#18181B",
        darkColor: "#09090B",
        copperColor: "#27272A",
        silkscreenColor: "#F3F4F6"
    },
    // Matte Black
    "#18181b": {
        baseColor: "#18181B",
        darkColor: "#09090B",
        copperColor: "#27272A",
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

    // Fill background
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get color configuration based on selection
    const theme = COLOR_THEMES[pcbColor.toLowerCase()] || COLOR_THEMES["#52c41a"];

    // 1. Calculate Bounding Box based primarily on Outline layer (or Copper Top layer)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    const outlineFile = parsedFiles.find(f => f.type === "outline");
    const copperTopFile = parsedFiles.find(f => f.type === "copper_top");
    const boundingFile = outlineFile || copperTopFile || (parsedFiles.length > 0 ? parsedFiles[0] : null);

    if (boundingFile) {
        minX = boundingFile.bounds.minX;
        maxX = boundingFile.bounds.maxX;
        minY = boundingFile.bounds.minY;
        maxY = boundingFile.bounds.maxY;
    }

    if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
        minX = 0; maxX = 100; minY = 0; maxY = 100;
    }

    const pcbW = maxX - minX;
    const pcbH = maxY - minY;
    const padding = 20;

    const scaleX = (canvas.width - padding * 2) / pcbW;
    const scaleY = (canvas.height - padding * 2) / pcbH;
    const scale = Math.min(scaleX, scaleY);

    const dx = (canvas.width - pcbW * scale) / 2 - minX * scale;
    const dy = (canvas.height - pcbH * scale) / 2 - minY * scale;

    // Flip horizontally if side is bottom
    const mapX = (x: number) => {
        const val = x * scale + dx;
        return side === "bottom" ? canvas.width - val : val;
    };
    const mapY = (y: number) => canvas.height - (y * scale + dy);

    // 1. Draw Board Outline and 2. Solder Mask Base Color
    if (activeLayers.outline) {
        ctx.fillStyle = theme.baseColor;
        ctx.strokeStyle = "#C5C5C5"; // Silver/gray bezel outline
        ctx.lineWidth = 2;

        if (outlineFile && outlineFile.commands.length > 0) {
            ctx.beginPath();
            let first = true;
            outlineFile.commands.forEach(cmd => {
                if (cmd.op === "poly" && cmd.polyPoints) {
                    cmd.polyPoints.forEach((p, idx) => {
                        if (idx === 0) ctx.moveTo(mapX(p.x), mapY(p.y));
                        else ctx.lineTo(mapX(p.x), mapY(p.y));
                    });
                } else if (cmd.op === "move" || first) {
                    ctx.moveTo(mapX(cmd.x), mapY(cmd.y));
                    first = false;
                } else if (cmd.op === "draw") {
                    ctx.lineTo(mapX(cmd.x), mapY(cmd.y));
                }
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            // Draw rounded fallback rectangle matching bounds
            ctx.beginPath();
            ctx.roundRect(mapX(minX), mapY(maxY), pcbW * scale, pcbH * scale, 12 * (scale / 5));
            ctx.fill();
            ctx.stroke();
        }
    }

    // 3. Render Copper Layers UNDER Solder Mask (Alpha blended 0.25 - 0.35)
    const activeCopper = side === "top" ? "copper_top" : "copper_bottom";
    const copperFile = parsedFiles.find(f => f.type === activeCopper);
    
    if (copperFile && ((side === "top" && activeLayers.topCopper) || (side === "bottom" && activeLayers.bottomCopper))) {
        ctx.save();
        ctx.globalAlpha = 0.30; // Blend into board mask
        ctx.strokeStyle = theme.copperColor;
        ctx.fillStyle = theme.copperColor;

        copperFile.commands.forEach(cmd => {
            const ap = cmd.apertureId ? copperFile.apertures[cmd.apertureId] : null;

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
            } else if (cmd.op === "flash" && ap) {
                // Flash copper shapes
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
            }
        });
        ctx.restore();
    }

    // 4. Draw Solder Mask Exposed Pads (Pads/Vias visible on top, colored Silver #D7D7D7)
    // Solder mask openings typically correspond to pad shapes on copper layers or explicit mask layers.
    // Drawing copper pad flashes on top in Silver creates the exact visual solder mask openings.
    if (copperFile && activeLayers.solderMask) {
        ctx.fillStyle = "#D7D7D7";
        ctx.strokeStyle = "#D7D7D7";

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
    }

    // 5. Draw Silkscreen Layers (White #FFFFFF text/lines)
    const activeSilkscreen = side === "top" ? "silkscreen_top" : "silkscreen_bottom";
    const silkFile = parsedFiles.find(f => f.type === activeSilkscreen);

    if (silkFile && activeLayers.silkscreen) {
        ctx.strokeStyle = theme.silkscreenColor;
        ctx.fillStyle = theme.silkscreenColor;

        silkFile.commands.forEach(cmd => {
            const ap = cmd.apertureId ? silkFile.apertures[cmd.apertureId] : null;

            if (cmd.op === "draw") {
                const width = ap ? (ap.dimensions[0] || 0.15) : 0.15;
                ctx.lineWidth = width * scale;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(mapX(cmd.startX ?? cmd.x), mapY(cmd.startY ?? cmd.y));
                ctx.lineTo(mapX(cmd.x), mapY(cmd.y));
                ctx.stroke();
            } else if (cmd.op === "arc" && cmd.startX !== undefined && cmd.startY !== undefined) {
                const width = ap ? (ap.dimensions[0] || 0.15) : 0.15;
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
            }
        });
    }

    // 6. Draw Drill Holes (NPTH / PTH)
    const drillFile = parsedFiles.find(f => f.type === "drill");
    if (drillFile && activeLayers.drills) {
        drillFile.commands.forEach(cmd => {
            if (cmd.op === "flash") {
                const ap = cmd.apertureId ? drillFile.apertures[cmd.apertureId] : null;
                const diameter = ap ? (ap.dimensions[0] || 0.8) : 0.8;

                // Draw outer silver pad ring (PTH structure)
                ctx.fillStyle = "#D9D9D9";
                ctx.beginPath();
                ctx.arc(mapX(cmd.x), mapY(cmd.y), (diameter / 2 + 0.3) * scale, 0, Math.PI * 2);
                ctx.fill();

                // Draw dark hole fill
                ctx.fillStyle = "#1B1B1B";
                ctx.beginPath();
                ctx.arc(mapX(cmd.x), mapY(cmd.y), (diameter / 2) * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
}
