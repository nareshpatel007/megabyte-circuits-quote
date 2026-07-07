export interface Aperture {
    id: string;
    shape: "C" | "R" | "O" | "P" | "T" | "unknown"; // Circle, Rectangle, Oval, Polygon, Thermal Relief
    dimensions: number[]; // [diameter] or [width, height] or [outer, inner, gap]
}

export interface GerberDrawCommand {
    op: "draw" | "move" | "flash" | "poly" | "arc";
    x: number;
    y: number;
    startX?: number;
    startY?: number;
    apertureId?: string;
    region?: boolean;
    polyPoints?: { x: number; y: number }[];
    arcDir?: "cw" | "ccw";
    i?: number; // Arc center offset
    j?: number;
}

export interface ParsedGerberFile {
    name: string;
    type: "copper_top" | "copper_bottom" | "solder_mask_top" | "solder_mask_bottom" | "silkscreen_top" | "silkscreen_bottom" | "drill" | "outline" | "unknown";
    commands: GerberDrawCommand[];
    apertures: { [id: string]: Aperture };
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    units: "mm" | "in";
}

export interface GerberFile {
    name: string;
    type: ParsedGerberFile["type"];
    content?: string;
}

export interface PCBInfo {
    width: number;
    height: number;
    layers: number;
    detectedFiles: { name: string; type: string; found: boolean }[];
    drillFileDetected: boolean;
    outlineFileDetected: boolean;
}

export interface PCBPreview {
    topPreviewUrl: string;
    bottomPreviewUrl: string;
}

export interface QuoteFormData {
    baseMaterial: string;
    layers: string;
    width: string;
    height: string;
    unit: "mm" | "inches";
    qty: string;
    productType: string;
    differentDesign: string;
    deliveryFormat: string;
    thickness: string;
    pcbColor: string;
    silkscreen: string;
    materialType: string;
    surfaceFinish: string;
    copperWeight: string;
    viaCovering: string;
    viaPlating: string;
    minHole: string;
    tolerance: string;
    confirmFile: string;
    markOnPcb: string;
    elecTest: string;
    goldFingers: string;
    castellated: string;
    edgePlating: string;
    blindSlots: string;
    ulMarking: string;
    humidity: string;
    kelvinTest: string;
    paperBetween: string;
    appearanceQuality: string;
    silkscreenTech: string;
    packageBox: string;
    inspectionReport: string;
    pcbRemark: string;
    assemblyOn: boolean;
    stencilOn: boolean;
    buildTime: string;
}

export interface UploadResponse {
    success: boolean;
    folder?: string;
    files?: { name: string; type: string }[];
    info?: PCBInfo;
    parsedGerberFiles?: ParsedGerberFile[];
    error?: string;
}
