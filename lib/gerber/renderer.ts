import { ParsedGerberFile, GerberDrawCommand, Aperture } from "./types";

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter files relevant to the active viewport layers and view side
    const filesToDraw = parsedFiles.filter(f => {
        if (f.type === "outline" && activeLayers.outline) return true;
        if (f.type === "drill" && activeLayers.drills) return true;
        if (side === "top") {
            if (f.type === "copper_top" && activeLayers.topCopper) return true;
            if (f.type === "solder_mask_top" && activeLayers.solderMask) return true;
            if (f.type === "silkscreen_top" && activeLayers.silkscreen) return true;
        } else {
            if (f.type === "copper_bottom" && activeLayers.bottomCopper) return true;
            if (f.type === "solder_mask_bottom" && activeLayers.solderMask) return true;
            if (f.type === "silkscreen_bottom" && activeLayers.silkscreen) return true;
        }
        return false;
    });

    if (filesToDraw.length === 0) {
        // Draw empty background block
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // 1. Calculate Combined Bounding Box across active layers to fit view
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    filesToDraw.forEach(f => {
        if (f.bounds.minX < minX) minX = f.bounds.minX;
        if (f.bounds.maxX > maxX) maxX = f.bounds.maxX;
        if (f.bounds.minY < minY) minY = f.bounds.minY;
        if (f.bounds.maxY > maxY) maxY = f.bounds.maxY;
    });

    if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
        minX = 0; maxX = 100; minY = 0; maxY = 100;
    }

    const pcbW = maxX - minX;
    const pcbH = maxY - minY;
    const padding = 20;

    // Preserve aspect ratio
    const scaleX = (canvas.width - padding * 2) / pcbW;
    const scaleY = (canvas.height - padding * 2) / pcbH;
    const scale = Math.min(scaleX, scaleY);

    const dx = (canvas.width - pcbW * scale) / 2 - minX * scale;
    const dy = (canvas.height - pcbH * scale) / 2 - minY * scale;

    const mapX = (x: number) => x * scale + dx;
    // Gerbers use standard Y increasing upwards, canvas uses Y increasing downwards
    const mapY = (y: number) => canvas.height - (y * scale + dy);

    // 2. Draw Solder Mask Bezel Base (PCB Outline)
    const outlineFile = filesToDraw.find(f => f.type === "outline");
    if (activeLayers.outline) {
        ctx.fillStyle = pcbColor;
        if (outlineFile && outlineFile.commands.length > 0) {
            // Render exact vector board outline path if available
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

            // Draw Bezel Outline border
            ctx.strokeStyle = "#d4af37";
            ctx.lineWidth = 2.5;
            ctx.stroke();
        } else {
            // Draw rounded fallback rectangle matching bounds
            ctx.beginPath();
            ctx.roundRect(mapX(minX), mapY(maxY), pcbW * scale, pcbH * scale, 12 * (scale / 5));
            ctx.fill();

            ctx.strokeStyle = "#d4af37";
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }
    } else {
        ctx.fillStyle = "rgba(15, 23, 42, 0.98)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 3. Draw Gerber Elements in sequence
    filesToDraw.forEach(file => {
        // Outline drawn as PCB base shape, skip re-drawing unless outline layer specifically styled
        if (file.type === "outline") return;

        // Choose layer color scheme
        let strokeColor = "#d4af37"; // gold copper default
        let fillColor = "#d4af37";
        let isTransparent = false;

        if (file.type === "copper_bottom") {
            strokeColor = "rgba(0, 191, 255, 0.4)";
            fillColor = "rgba(0, 191, 255, 0.4)";
        } else if (file.type === "solder_mask_top" || file.type === "solder_mask_bottom") {
            strokeColor = "rgba(255, 255, 255, 0.05)";
            fillColor = "rgba(255, 255, 255, 0.05)";
        } else if (file.type === "silkscreen_top" || file.type === "silkscreen_bottom") {
            const isDark = pcbColor === "#ffffff" || pcbColor === "#fadb14";
            strokeColor = isDark ? "#0f172a" : "#ffffff";
            fillColor = isDark ? "#0f172a" : "#ffffff";
        } else if (file.type === "drill") {
            strokeColor = "#0f172a";
            fillColor = "#0f172a";
        }

        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = fillColor;

        file.commands.forEach(cmd => {
            const ap = cmd.apertureId ? file.apertures[cmd.apertureId] : null;

            if (cmd.op === "move") {
                // No-op for drawing state
            } else if (cmd.op === "draw") {
                // Line draw
                const width = ap ? (ap.dimensions[0] || 0.2) : 0.2;
                ctx.lineWidth = width * scale;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";

                ctx.beginPath();
                ctx.moveTo(mapX(cmd.startX ?? cmd.x), mapY(cmd.startY ?? cmd.y));
                ctx.lineTo(mapX(cmd.x), mapY(cmd.y));
                ctx.stroke();
            } else if (cmd.op === "arc" && cmd.startX !== undefined && cmd.startY !== undefined) {
                // Arc drawing
                const width = ap ? (ap.dimensions[0] || 0.2) : 0.2;
                ctx.lineWidth = width * scale;
                ctx.lineCap = "round";

                // Calculate center
                const cx = cmd.startX + (cmd.i ?? 0);
                const cy = cmd.startY + (cmd.j ?? 0);
                const radius = Math.sqrt((cmd.i ?? 0) ** 2 + (cmd.j ?? 0) ** 2);

                const startAngle = Math.atan2(cmd.startY - cy, cmd.startX - cx);
                const endAngle = Math.atan2(cmd.y - cy, cmd.x - cx);

                ctx.beginPath();
                ctx.arc(
                    mapX(cx),
                    mapY(cy),
                    radius * scale,
                    startAngle,
                    endAngle,
                    cmd.arcDir === "ccw"
                );
                ctx.stroke();
            } else if (cmd.op === "poly" && cmd.polyPoints) {
                // Filled Region
                ctx.beginPath();
                cmd.polyPoints.forEach((pt, index) => {
                    if (index === 0) ctx.moveTo(mapX(pt.x), mapY(pt.y));
                    else ctx.lineTo(mapX(pt.x), mapY(pt.y));
                });
                ctx.closePath();
                ctx.fill();
            } else if (cmd.op === "flash") {
                // Flash Apertures
                if (!ap) {
                    // Fallback dot
                    ctx.beginPath();
                    ctx.arc(mapX(cmd.x), mapY(cmd.y), 1.5 * scale, 0, Math.PI * 2);
                    ctx.fill();
                    return;
                }

                if (ap.shape === "C") {
                    // Circular Pad / Drill hole
                    const r = (ap.dimensions[0] / 2) * scale;
                    ctx.beginPath();
                    ctx.arc(mapX(cmd.x), mapY(cmd.y), r > 0.5 ? r : 0.5, 0, Math.PI * 2);
                    ctx.fill();
                } else if (ap.shape === "R") {
                    // Rectangular Pad
                    const w = (ap.dimensions[0] || 0.5) * scale;
                    const h = (ap.dimensions[1] || 0.5) * scale;
                    ctx.fillRect(mapX(cmd.x) - w / 2, mapY(cmd.y) - h / 2, w, h);
                } else if (ap.shape === "O") {
                    // Oval Pad
                    const w = (ap.dimensions[0] || 0.5) * scale;
                    const h = (ap.dimensions[1] || 0.5) * scale;
                    ctx.beginPath();
                    ctx.ellipse(mapX(cmd.x), mapY(cmd.y), w / 2, h / 2, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else if (ap.shape === "T") {
                    // Thermal Relief Pad (Render outer ring with clearance cutouts)
                    const outerR = (ap.dimensions[0] / 2) * scale;
                    const innerR = (ap.dimensions[1] / 2) * scale;

                    ctx.beginPath();
                    ctx.arc(mapX(cmd.x), mapY(cmd.y), outerR, 0, Math.PI * 2);
                    ctx.arc(mapX(cmd.x), mapY(cmd.y), innerR, 0, Math.PI * 2, true); // hole cutout
                    ctx.fill();
                }
            }
        });
    });
}
