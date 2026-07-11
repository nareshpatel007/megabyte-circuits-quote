import { createParser } from "@tracespace/parser";
import { plot } from "@tracespace/plotter";
import { ParsedGerberFile, GerberLayerType } from "./types";

/**
 * Parses the raw file content into an Abstract Syntax Tree (AST)
 * and plots it into a geometry ImageTree using the tracespace parser.
 */
export function parseGerberContent(
    filename: string,
    content: string,
    type: GerberLayerType
): ParsedGerberFile {
    try {
        // 1. Parse content to Gerber AST using @tracespace/parser
        const parser = createParser();
        parser.feed(content);
        const ast = parser.results();

        // 2. Plot Gerber AST to ImageTree containing vector coordinates
        const imageTree = plot(ast as any);

        // 3. Extract dimensions envelope [x1, y1, x2, y2]
        let minX = 0;
        let minY = 0;
        let maxX = 0;
        let maxY = 0;

        if (imageTree.size && imageTree.size.length === 4) {
            minX = imageTree.size[0];
            minY = imageTree.size[1];
            maxX = imageTree.size[2];
            maxY = imageTree.size[3];
        }

        return {
            name: filename,
            type,
            units: imageTree.units || "mm",
            bounds: { minX, maxX, minY, maxY },
            imageTree
        };
    } catch (err: any) {
        throw new Error(`Failed to parse file "${filename}": ${err.message || err}`);
    }
}
