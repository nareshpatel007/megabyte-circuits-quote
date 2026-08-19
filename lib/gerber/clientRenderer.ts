import type { GerberProps, GerberSide, GerberType } from 'whats-that-gerber';
import promisify from 'pify';
import { unzip as _unzip } from 'fflate';
import stackup, { type InputLayer, type Stackup } from 'pcb-stackup';
import { Buffer } from 'buffer';

import JSZip from 'jszip';

const unzip = promisify(_unzip);

export async function loadLayers(file: File): Promise<InputLayer[]> {
    try {
        const buffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop()?.toLowerCase();

        let archiveBytes = new Uint8Array(buffer);

        if (ext === 'rar') {
            try {
                // If the user uploaded a RAR file (or ZIP saved as .rar), attempt in-memory ZIP conversion
                const zip = new JSZip();
                await zip.loadAsync(buffer);
                const generated = await zip.generateAsync({ type: 'uint8array' });
                archiveBytes = new Uint8Array(generated);
            } catch (rarErr) {
                // If fflate can unpack it directly
                try {
                    const entries = await unzip(archiveBytes);
                    return await readLayers(entries);
                } catch (e) {
                    console.warn("Direct fflate unpack failed:", e);
                }
            }
        }

        const entries = await unzip(archiveBytes);
        return await readLayers(entries);
    } catch (err) {
        console.warn("Failed to extract Gerber archive file:", err);
        return [];
    }
}

export async function readLayers(entries: Record<string, Uint8Array>): Promise<InputLayer[]> {
    const layers = <InputLayer[]>[];
    for (const name of Object.keys(entries)) {
        // Skip hidden files, system files, or directory entries
        if (name.startsWith('__MACOSX') || name.startsWith('.') || name.includes('/.') || name.endsWith('/')) {
            continue;
        }

        const ext = name.split('.').pop()?.toLowerCase() || '';
        // Skip obvious non-gerber documents & images
        if (['pdf', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'csv', 'bom', 'doc', 'docx', 'xlsx', 'xls', 'zip', 'rar', '7z', 'txt', 'html', 'json'].includes(ext)) {
            // Check if txt file is a drill file
            if (ext !== 'txt' || (!name.toLowerCase().includes('drl') && !name.toLowerCase().includes('drill'))) {
                continue;
            }
        }

        const { type, side } = mapLayerType(name);
        if (type !== null) {
            layers.push({ type, side, gerber: Buffer.from(entries[name]), filename: name });
        }
    }
    return layers;
}

export function mapLayerType(name: string): GerberProps {
    let type: GerberType = null;
    let side: GerberSide = null;

    const segments = name.toLowerCase().split(/_|-|\./);

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
        case 'gko': return { type: 'outline', side: 'all' };
        case 'drl': return { type: 'drill', side: 'all' };
        case 'txt': return { type: 'drill', side: 'all' };
        case 'xln': return { type: 'drill', side: 'all' };
        default:
            if (/^g[1-8]$/i.test(ext) || /^g[1-8]l$/i.test(ext) || /^in[1-8]$/i.test(ext) || /^l[1-8]$/i.test(ext) || /^gl[1-8]$/i.test(ext)) {
                return { type: 'copper', side: 'inner' };
            }
            break;
    }

    if (segments.find(s => s.includes('edge')) || segments.find(s => s.includes('outline'))) {
        return { type: 'outline', side: 'all' };
    }

    if (segments.includes('sm') || segments.find(s => s.includes('mask'))) {
        type = 'soldermask';
    } else if (segments.includes('sp') || segments.find(s => s.includes('paste'))) {
        type = 'solderpaste';
    } else if (segments.includes('ss') || segments.find(s => s.includes('silk'))) {
        type = 'silkscreen';
    } else if (segments.includes('cu') || segments.find(s => s.includes('copper'))) {
        type = 'copper';
    }

    if (segments.find(s => s.startsWith('in'))) {
        side = 'inner';
    } else if (segments.includes('f') || segments.find(s => s.includes('top'))) {
        side = 'top';
    } else if (segments.includes('b') || segments.find(s => s.includes('bottom'))) {
        side = 'bottom';
    }

    if (side === 'inner' && !type) {
        type = 'copper';
    }

    return { type, side };
}

export const COLORS: Record<string, [string, string]> = {
    'green': ['#004200bf', '#ffffff'],
    'red': ['#b20000bf', '#ffffff'],
    'yellow': ['#ff9900bf', '#ffffff'],
    'blue': ['#004284bf', '#ffffff'],
    'white': ['#ffffffbf', '#000000'],
    'black': ['#000000bf', '#ffffff'],
    'purple': ['#480084bf', '#ffffff'],
};

export const FINISHES: Record<string, string> = {
    'gold': '#cc9933',
    'tin': '#f5f5f5',
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

export async function renderStack(layers: InputLayer[], options: RenderOptions): Promise<Stackup<string, InputLayer>> {
    if (!layers || layers.length === 0) {
        return { top: null, bottom: null, layers: [] } as any;
    }

    const [sm, ss] = COLORS[options.sm] || COLORS['green'];
    const sp = options.sp ? PASTE : 'transparent';
    const cf = FINISHES[options.cf] || FINISHES['tin'];

    try {
        return await stackup(layers, {
            color: { sm, ss, sp, cf },
        });
    } catch (err) {
        console.warn("Gerber parser stackup error caught safely:", err);
        return { top: null, bottom: null, layers: [] } as any;
    }
}
