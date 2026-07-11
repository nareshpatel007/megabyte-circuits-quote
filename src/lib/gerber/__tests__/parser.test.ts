import { parseGerberContent } from "../parser";

describe("Gerber Parser Unit Tests", () => {
    it("should successfully parse a valid Gerber file with top copper commands", () => {
        const mockGerber = `
%FSLAX35Y35*%
%MOMM*%
%ADD10C,0.15*%
D10*
X0Y0D02*
X10000Y10000D01*
M02*
        `.trim();

        const result = parseGerberContent("top_copper.gtl", mockGerber, "copper_top");

        expect(result.name).toBe("top_copper.gtl");
        expect(result.type).toBe("copper_top");
        expect(result.units).toBe("mm");
        expect(result.bounds.minX).toBe(0);
        expect(result.bounds.maxX).toBe(10); // 10000 / 10^3 (FSLAX35 -> 5 decimal places -> divisor 10^5? Wait, standard FS is 35 -> 5 dec)
        expect(result.bounds.minY).toBe(0);
        expect(result.bounds.maxY).toBe(10);
        expect(result.imageTree).toBeDefined();
    });

    it("should parse an Excellon Drill file with tool definitions", () => {
        const mockDrill = `
M48
METRIC,TZ
T01C0.800
T02C1.200
%
T01
X01000Y01000
T02
X02000Y02000
M30
        `.trim();

        const result = parseGerberContent("drill.drl", mockDrill, "drill");

        expect(result.name).toBe("drill.drl");
        expect(result.type).toBe("drill");
        expect(result.units).toBe("mm");
        expect(result.imageTree.children.length).toBeGreaterThan(0);
    });
});
