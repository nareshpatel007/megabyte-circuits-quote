import { ParsedGerberFile, GerberDrawCommand, Aperture } from "./types";

export function parseGerberFile(
    filename: string,
    content: string,
    type: ParsedGerberFile["type"],
    defaultUnits?: "mm" | "in",
    defaultDivisor?: number
): ParsedGerberFile {
    const commands: GerberDrawCommand[] = [];
    const apertures: { [id: string]: Aperture } = {};
    let units: "mm" | "in" = defaultUnits || "mm";
    let divisor = defaultDivisor || 100000; // default to 5 decimal places for mm
    let currentX = 0;
    let currentY = 0;
    let activeApertureId = "";
    let isRegion = false;
    let regionPoints: { x: number; y: number }[] = [];
    let interpolationMode: "linear" | "arc_cw" | "arc_ccw" = "linear";

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    const updateBounds = (x: number, y: number) => {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    };

    // Check if it's an Excellon Drill file (starts with METRIC, INCH, M48 or similar)
    const isDrill = type === "drill" || content.includes("M48") || content.includes("METRIC") || content.includes("INCH,TZ") || content.includes("INCH,LZ");

    if (isDrill) {
        // --- Excellon Drill Parsing ---
        let drillUnits: "mm" | "in" = "mm";
        let leadingZeros = false;
        let trailingZeros = true;
        let scale = 1.0;

        const lines = content.split("\n");
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            // Header directives
            if (line.includes("METRIC")) {
                drillUnits = "mm";
                units = "mm";
            }
            if (line.includes("INCH")) {
                drillUnits = "in";
                units = "in";
            }
            if (line.includes("TZ")) {
                trailingZeros = true;
                leadingZeros = false;
            }
            if (line.includes("LZ")) {
                leadingZeros = true;
                trailingZeros = false;
            }

            // Parse tool definition: T01C0.8 (Metric tool size 0.8mm) or T01C0.035 (Inch size 0.035 in)
            const toolDefMatch = line.match(/T(\d+)C([\d\.]+)/i);
            if (toolDefMatch) {
                const id = "T" + parseInt(toolDefMatch[1], 10);
                const diameter = parseFloat(toolDefMatch[2]);
                apertures[id] = {
                    id,
                    shape: "C",
                    dimensions: [diameter]
                };
                return;
            }

            // Parse Tool Selection: T01 or T1
            const toolSelMatch = line.match(/^T(\d+)(?!C)/i);
            if (toolSelMatch) {
                activeApertureId = "T" + parseInt(toolSelMatch[1], 10);
                return;
            }

            // Parse Drill Hits: e.g. X012345Y023456
            if (line.startsWith("X") || line.startsWith("Y")) {
                let xVal = currentX;
                let yVal = currentY;

                const xMatch = line.match(/X(-?\d+)/i);
                const yMatch = line.match(/Y(-?\d+)/i);

                // For drill files, parsing digits can depend on zero suppression.
                // Standard default: 3.3 for metric, 2.4 for inches.
                // If coordinate has decimal points, parse directly:
                if (line.includes(".")) {
                    if (xMatch) xVal = parseFloat(xMatch[1]);
                    if (yMatch) yVal = parseFloat(yMatch[1]);
                } else {
                    const decMultiplier = drillUnits === "mm" ? 1000 : 10000;
                    if (xMatch) xVal = parseInt(xMatch[1], 10) / decMultiplier;
                    if (yMatch) yVal = parseInt(yMatch[1], 10) / decMultiplier;
                }

                currentX = xVal;
                currentY = yVal;
                updateBounds(xVal, yVal);

                commands.push({
                    op: "flash",
                    x: xVal,
                    y: yVal,
                    apertureId: activeApertureId
                });
            }
        });
    } else {
        // --- Gerber RS-274X / X2 Parsing ---
        const lines = content.replace(/\r/g, "").split("*");
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            // 1. Units directives
            if (line.startsWith("%MOMM")) {
                units = "mm";
                return;
            }
            if (line.startsWith("%MOIN")) {
                units = "in";
                return;
            }
            if (line.startsWith("G70")) {
                units = "in";
                return;
            }
            if (line.startsWith("G71")) {
                units = "mm";
                return;
            }

            // 2. Coordinate format specifiers
            if (line.startsWith("%FS")) {
                const fsMatch = line.match(/X(\d)(\d)Y/i);
                if (fsMatch) {
                    const decDigits = parseInt(fsMatch[2], 10);
                    divisor = Math.pow(10, decDigits);
                }
                return;
            }

            // 3. Aperture Definitions: %ADD10C,0.2*%
            if (line.startsWith("%AD")) {
                const adMatch = line.match(/%ADD(\d+)([CROPT])(?:,([\d\.X]+))?/i);
                if (adMatch) {
                    const id = "D" + adMatch[1];
                    const shapeType = adMatch[2];
                    const rawDims = adMatch[3] || "";
                    const dimensions = rawDims.split("X").map(parseFloat);

                    let shape: Aperture["shape"] = "unknown";
                    if (shapeType === "C") shape = "C";
                    else if (shapeType === "R") shape = "R";
                    else if (shapeType === "O") shape = "O";
                    else if (shapeType === "P") shape = "P";
                    else if (shapeType === "T") shape = "T";

                    apertures[id] = { id, shape, dimensions };
                }
                return;
            }

            // 4. Region mode toggles
            if (line.startsWith("G36")) {
                isRegion = true;
                regionPoints = [];
                return;
            }
            if (line.startsWith("G37")) {
                isRegion = false;
                if (regionPoints.length > 0) {
                    commands.push({
                        op: "poly",
                        x: regionPoints[regionPoints.length - 1].x,
                        y: regionPoints[regionPoints.length - 1].y,
                        polyPoints: [...regionPoints]
                    });
                }
                return;
            }

            // 5. Drawing interpolation modes
            if (line.startsWith("G01")) {
                interpolationMode = "linear";
            } else if (line.startsWith("G02")) {
                interpolationMode = "arc_cw";
            } else if (line.startsWith("G03")) {
                interpolationMode = "arc_ccw";
            }

            // 6. Aperture selection: e.g. D10
            const apSelMatch = line.match(/^D(\d+)$/);
            if (apSelMatch) {
                activeApertureId = "D" + apSelMatch[1];
                return;
            }

            // 7. Vector coordinate instructions: e.g. X1000Y2000D01
            if (line.includes("X") || line.includes("Y") || line.includes("D")) {
                const xMatch = line.match(/X(-?\d+)/i);
                const yMatch = line.match(/Y(-?\d+)/i);
                const iMatch = line.match(/I(-?\d+)/i);
                const jMatch = line.match(/J(-?\d+)/i);

                let xVal = currentX;
                let yVal = currentY;

                if (xMatch) xVal = parseInt(xMatch[1], 10) / divisor;
                if (yMatch) yVal = parseInt(yMatch[1], 10) / divisor;

                let iVal = iMatch ? parseInt(iMatch[1], 10) / divisor : 0;
                let jVal = jMatch ? parseInt(jMatch[1], 10) / divisor : 0;

                // Match operation code D01 (draw), D02 (move), D03 (flash)
                let opCode = "D02"; // default move
                const opMatch = line.match(/D0([123])/i);
                if (opMatch) {
                    opCode = "D0" + opMatch[1];
                } else if (line.endsWith("D1") || line.endsWith("D01")) {
                    opCode = "D01";
                } else if (line.endsWith("D2") || line.endsWith("D02")) {
                    opCode = "D02";
                } else if (line.endsWith("D3") || line.endsWith("D03")) {
                    opCode = "D03";
                }

                const startX = currentX;
                const startY = currentY;

                currentX = xVal;
                currentY = yVal;
                updateBounds(xVal, yVal);

                if (isRegion) {
                    regionPoints.push({ x: xVal, y: yVal });
                } else if (opCode === "D03") {
                    // Flash aperture
                    commands.push({
                        op: "flash",
                        x: xVal,
                        y: yVal,
                        apertureId: activeApertureId
                    });
                } else if (opCode === "D01") {
                    // Draw path
                    if (interpolationMode === "linear") {
                        commands.push({
                            op: "draw",
                            x: xVal,
                            y: yVal,
                            startX,
                            startY,
                            apertureId: activeApertureId
                        });
                    } else {
                        // Arc drawing (G02/G03)
                        commands.push({
                            op: "arc",
                            x: xVal,
                            y: yVal,
                            startX,
                            startY,
                            apertureId: activeApertureId,
                            arcDir: interpolationMode === "arc_cw" ? "cw" : "ccw",
                            i: iVal,
                            j: jVal
                        });
                    }
                }
            }
        });
    }

    // Default reference bounds if no vector bounds detected
    if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
        minX = 0;
        maxX = 0;
        minY = 0;
        maxY = 0;
    }

    return {
        name: filename,
        type,
        commands,
        apertures,
        bounds: { minX, maxX, minY, maxY },
        units
    };
}

export function parseGerberOutline(
    content: string,
    defaultUnits?: "mm" | "in",
    defaultDivisor?: number
): { width: number; height: number; success: boolean } {
    const parsed = parseGerberFile("outline", content, "outline", defaultUnits, defaultDivisor);
    const w = parsed.bounds.maxX - parsed.bounds.minX;
    const h = parsed.bounds.maxY - parsed.bounds.minY;
    
    let width = w;
    let height = h;

    if (parsed.units === "in") {
        width = w * 25.4;
        height = h * 25.4;
    }

    return {
        width: parseFloat(width.toFixed(2)),
        height: parseFloat(height.toFixed(2)),
        success: w > 0 && h > 0
    };
}
