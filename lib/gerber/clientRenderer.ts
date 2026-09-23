import { processGerberFiles, ProcessedGerberProject } from "../gerber-engine/index";
import { generatePCBSvgMarkup } from "../gerber-engine/renderer/svgRenderer";

export type GerberType = 'copper' | 'soldermask' | 'silkscreen' | 'solderpaste' | 'drill' | 'outline' | null;
export type GerberSide = 'top' | 'bottom' | 'inner' | 'all' | null;

export interface GerberProps {
    type: GerberType;
    side: GerberSide;
}

export interface InputLayer {
    type: GerberType;
    side: GerberSide;
    gerber: Buffer | string;
    filename: string;
}

export const COLORS: Record<string, [string, string]> = {
    'green': ['#0d5c2e', '#ffffff'],
    'red': ['#8b1a1a', '#ffffff'],
    'yellow': ['#b8860b', '#ffffff'],
    'blue': ['#104e8b', '#ffffff'],
    'white': ['#e6e6e6', '#000000'],
    'black': ['#1a1a1a', '#ffffff'],
    'purple': ['#4b0082', '#ffffff'],
};

export const FINISHES: Record<string, string> = {
    'gold': '#d4af37',
    'tin': '#cccccc',
};

export const PASTE = '#999999';

export type RenderSide = 'top' | 'bottom';
export type RenderSolderMask = keyof typeof COLORS;
export type RenderCopperFinish = keyof typeof FINISHES;

export interface RenderOptions {
    sm: RenderSolderMask;
    cf: RenderCopperFinish;
    sp: boolean;
}

let lastProcessedProject: ProcessedGerberProject | null = null;

export async function renderWithGerbersRenderer(file: File): Promise<{ top?: { svg: string }; bottom?: { svg: string } } | null> {
    try {
        console.log("[CustomGerberEngine] Processing ZIP archive with custom Gerber engine...");
        const project = await processGerberFiles(file);
        lastProcessedProject = project;
        
        const topSvg = generatePCBSvgMarkup(project.layers, project.analysis.dimensions.bounds, project.drillData, {
            side: "top"
        });

        const bottomSvg = generatePCBSvgMarkup(project.layers, project.analysis.dimensions.bounds, project.drillData, {
            side: "bottom"
        });

        return {
            top: { svg: topSvg },
            bottom: { svg: bottomSvg }
        };
    } catch (err) {
        console.warn("[CustomGerberEngine] Direct rendering error:", err);
        return null;
    }
}

export async function loadLayers(file: File): Promise<InputLayer[]> {
    console.log(`[CustomGerberEngine] Loading layers for file: "${file.name}"`);
    try {
        const project = await processGerberFiles(file);
        lastProcessedProject = project;

        return project.layers.map((l) => ({
            type: l.type as GerberType,
            side: (l.side || "all") as GerberSide,
            gerber: "",
            filename: l.filename
        }));
    } catch (err: any) {
        console.error(`[CustomGerberEngine Error] Failed during layer loading:`, err);
        return [];
    }
}

export async function readLayers(entries: Record<string, Uint8Array>): Promise<InputLayer[]> {
    const layers: InputLayer[] = [];
    for (const name of Object.keys(entries)) {
        const { type, side } = mapLayerType(name);
        if (type !== null) {
            layers.push({ type, side, gerber: "", filename: name });
        }
    }
    return layers;
}

export function mapLayerType(name: string): GerberProps {
    let type: GerberType = null;
    let side: GerberSide = null;

    const lowerName = name.toLowerCase();
    const segments = lowerName.split(/_|-|\./);
    const ext = segments[segments.length - 1];

    switch (ext) {
        case 'gtl': return { type: 'copper', side: 'top' };
        case 'gto': return { type: 'silkscreen', side: 'top' };
        case 'gtp': return { type: 'solderpaste', side: 'top' };
        case 'gts': return { type: 'soldermask', side: 'top' };
        case 'gbl': return { type: 'copper', side: 'bottom' };
        case 'gbo': return { type: 'silkscreen', side: 'bottom' };
        case 'gbp': return { type: 'solderpaste', side: 'bottom' };
        case 'gbs': return { type: 'soldermask', side: 'bottom' };
        case 'gko': case 'gml': case 'gm1': case 'gm2': case 'gm3': case 'g1': return { type: 'outline', side: 'all' };
        case 'drl': case 'txt': case 'xln': case 'drd': return { type: 'drill', side: 'all' };
        default:
            if (/^g[1-8]$/i.test(ext) || /^g[1-8]l$/i.test(ext) || /^in[1-8]$/i.test(ext) || /^l[1-8]$/i.test(ext) || /^gl[1-8]$/i.test(ext)) {
                return { type: 'copper', side: 'inner' };
            }
            break;
    }

    if (segments.some(s => s.includes('edge') || s.includes('outline') || s.includes('border') || s.includes('profile') || s.includes('cutout') || s.includes('keepout'))) {
        return { type: 'outline', side: 'all' };
    }

    if (segments.some(s => s.includes('drill') || s.includes('hole') || s.includes('drl') || s.includes('nc'))) {
        return { type: 'drill', side: 'all' };
    }

    if (segments.includes('sm') || segments.some(s => s.includes('mask') || s.includes('soldermask'))) {
        type = 'soldermask';
    } else if (segments.includes('sp') || segments.some(s => s.includes('paste') || s.includes('solderpaste'))) {
        type = 'solderpaste';
    } else if (segments.includes('ss') || segments.some(s => s.includes('silk') || s.includes('silkscreen') || s.includes('legend'))) {
        type = 'silkscreen';
    } else if (segments.includes('cu') || segments.some(s => s.includes('copper') || s.includes('art') || s.includes('layer'))) {
        type = 'copper';
    }

    if (segments.some(s => s.startsWith('in'))) {
        side = 'inner';
    } else if (segments.includes('f') || segments.some(s => s.includes('top') || s.includes('front') || s.includes('cmp'))) {
        side = 'top';
    } else if (segments.includes('b') || segments.some(s => s.includes('bottom') || s.includes('back') || s.includes('sol'))) {
        side = 'bottom';
    }

    if (side === 'inner' && !type) {
        type = 'copper';
    }

    return { type, side };
}

export async function renderStack(layers: InputLayer[], options: RenderOptions): Promise<any> {
    if (!lastProcessedProject) {
        return { top: null, bottom: null, layers };
    }

    const { width, height } = lastProcessedProject.analysis.dimensions;
    const topSvg = generatePCBSvgMarkup(
        lastProcessedProject.layers,
        lastProcessedProject.analysis.dimensions.bounds,
        lastProcessedProject.drillData,
        { side: "top", maskColor: options.sm }
    );

    const bottomSvg = generatePCBSvgMarkup(
        lastProcessedProject.layers,
        lastProcessedProject.analysis.dimensions.bounds,
        lastProcessedProject.drillData,
        { side: "bottom", maskColor: options.sm }
    );

    return {
        top: { width, height, units: "mm", svg: topSvg },
        bottom: { width, height, units: "mm", svg: bottomSvg },
        layers
    };
}
