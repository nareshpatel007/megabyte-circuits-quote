import type { ImageTree } from "@tracespace/plotter";

export type GerberLayerType =
    | "copper_top"
    | "copper_bottom"
    | "solder_mask_top"
    | "solder_mask_bottom"
    | "silkscreen_top"
    | "silkscreen_bottom"
    | "outline"
    | "drill"
    | "mechanical"
    | "inner"
    | "unknown";

export interface ParsedGerberFile {
    name: string;
    type: GerberLayerType;
    units: "mm" | "in";
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    imageTree: ImageTree; // From @tracespace/plotter
}

export interface GerberFile {
    name: string;
    type: GerberLayerType;
    content?: string;
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
    boardName: string;
    userMobile: string;
    userEmail: string;
    gstNumber: string;
    customerName: string;
    billingAddress: string;
    shippingAddress: string;
}

export interface PCBInfo {
    width: number;
    height: number;
    layers: number;
    detectedFiles: { name: string; type: string; found: boolean }[];
    drillFileDetected: boolean;
    outlineFileDetected: boolean;
    debugInfo?: string;
    warnings: string[];
    boardShape: "Rectangle" | "Square" | "Circular" | "Custom";
    outlineType: "Outline Layer" | "Computed Bounding Box";
    drillCount: number;
}

export interface UploadResponse {
    success: boolean;
    folder?: string;
    files?: { name: string; type: string }[];
    info?: PCBInfo;
    parsedGerberFiles?: ParsedGerberFile[];
    error?: string;

    // Exact requested output fields
    width_mm?: number;
    height_mm?: number;
    boardShape?: string;
    layerCount?: number;
    drillCount?: number;
    topCopper?: boolean;
    bottomCopper?: boolean;
    topMask?: boolean;
    bottomMask?: boolean;
    topSilk?: boolean;
    bottomSilk?: boolean;
    outline?: boolean;
    warnings?: string[];
    previewFront?: string;
    previewBack?: string;
}
