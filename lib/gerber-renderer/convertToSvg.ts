import { processGerberFiles } from "../gerber-engine/index";
import { generatePCBSvgMarkup } from "../gerber-engine/renderer/svgRenderer";

export interface ConvertResult {
    topSvg: SVGElement;
    bottomSvg: SVGElement;
    fullStackSvg: SVGElement;
    stackConfig: {
        viewbox: {
            viewboxX: number;
            viewboxY: number;
            viewboxW: number;
            viewboxH: number;
        };
        width: number;
        height: number;
    };
    id: string;
}

export default async function convertToSvg(files: File[]): Promise<ConvertResult> {
    const project = await processGerberFiles(files);

    const topMarkup = generatePCBSvgMarkup(project.layers, project.analysis.dimensions.bounds, project.drillData, {
        side: "top"
    });
    const bottomMarkup = generatePCBSvgMarkup(project.layers, project.analysis.dimensions.bounds, project.drillData, {
        side: "bottom"
    });

    const parser = new DOMParser();
    const topDoc = parser.parseFromString(topMarkup, "image/svg+xml");
    const bottomDoc = parser.parseFromString(bottomMarkup, "image/svg+xml");

    const topSvg = topDoc.documentElement as unknown as SVGElement;
    const bottomSvg = bottomDoc.documentElement as unknown as SVGElement;

    const b = project.analysis.dimensions.bounds;
    const margin = Math.max(b.width, b.height) * 0.05 + 2;

    return {
        topSvg,
        bottomSvg,
        fullStackSvg: topSvg,
        stackConfig: {
            viewbox: {
                viewboxX: b.minX - margin,
                viewboxY: b.minY - margin,
                viewboxW: b.width + margin * 2,
                viewboxH: b.height + margin * 2
            },
            width: project.analysis.dimensions.width,
            height: project.analysis.dimensions.height
        },
        id: `project-${Date.now()}`
    };
}
