import { extractAndAnalyzeGerber } from "../index";
import JSZip from "jszip";

describe("Gerber Parser Integration Tests", () => {
    it("should successfully extract, classify, parse, and render a zip containing Gerber files", async () => {
        // Create an in-memory ZIP containing a top copper file and a drill file
        const zip = new JSZip();
        
        const mockGerber = `
%FSLAX35Y35*%
%MOMM*%
%ADD10C,0.2*%
D10*
X0Y0D02*
X20000Y30000D01*
M02*
        `.trim();

        const mockDrill = `
M48
METRIC,TZ
T01C0.8
%
T01
X01000Y01000
M30
        `.trim();

        zip.file("board.gtl", mockGerber);
        zip.file("board.drl", mockDrill);
        
        const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
        const result = await extractAndAnalyzeGerber(zipBuffer);

        expect(result.files.length).toBe(2);
        expect(result.info.width).toBe(20); // 20000 / 1000 = 20mm
        expect(result.info.height).toBe(30); // 30000 / 1000 = 30mm
        expect(result.info.drillCount).toBe(1);
        expect(result.info.layers).toBe(2); // Top copper only, but default fallback to 2
        expect(result.previewFront).toContain("data:image/svg+xml;base64,");
        expect(result.previewBack).toContain("data:image/svg+xml;base64,");
    });
});
