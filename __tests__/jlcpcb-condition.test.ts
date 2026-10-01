import { isJlcpcbRequired, getMatchedJlcpcbConditions } from "../lib/jlcpcbCondition";

describe("JLCPCB Condition & Local Pricing Selection", () => {
    const standardSpecs = {
        baseMaterial: "FR-4",
        layers: 2,
        width: 100,
        height: 100,
        thickness: "1.6mm",
        surfaceFinish: "HASL(with lead)",
        viaCovering: "Tented",
        viaPlating: "Not Specified",
        minHole: "0.3mm/(0.4/0.45mm)",
        goldFingers: "No",
        castellated: "No",
        edgePlating: "No",
        blindSlots: "No",
    };

    test("Standard FR-4 options use LOCAL pricing (no JLCPCB trigger)", () => {
        expect(isJlcpcbRequired(standardSpecs)).toBe(false);
        expect(getMatchedJlcpcbConditions(standardSpecs)).toEqual([]);
    });

    test("Layer counts 1, 2, 4, 6, 8, 10 do NOT trigger JLCPCB on their own", () => {
        [1, 2, 4, 6, 8, 10].forEach(layer => {
            const specs = { ...standardSpecs, layers: layer };
            expect(isJlcpcbRequired(specs)).toBe(false);
            expect(getMatchedJlcpcbConditions(specs)).toEqual([]);
        });
    });

    test("Uploaded file key does NOT force JLCPCB when specs are standard", () => {
        const specs = { ...standardSpecs, layers: 4, fileKey: "some_gerber_key.zip", jlcpcb_file_key: "jlc_key_123" };
        expect(isJlcpcbRequired(specs)).toBe(false);
    });

    test("Triggers JLCPCB on Base Material: Flex, Rogers, PTFE Teflon", () => {
        expect(isJlcpcbRequired({ ...standardSpecs, baseMaterial: "Flex" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, baseMaterial: "Rogers" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, baseMaterial: "PTFE Teflon" })).toBe(true);
    });

    test("Triggers JLCPCB on Dimensions >= 350mm", () => {
        expect(isJlcpcbRequired({ ...standardSpecs, width: 350, height: 100 })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, width: 100, height: 350 })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, dimensions: "350x350mm" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, dimensions: "380x200mm" })).toBe(true);
    });

    test("Triggers JLCPCB on PCB Thickness 0.6mm", () => {
        expect(isJlcpcbRequired({ ...standardSpecs, thickness: "0.6mm" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, thickness: 0.6 })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, thickness: "1.6mm" })).toBe(false);
        expect(isJlcpcbRequired({ ...standardSpecs, thickness: "0.8mm" })).toBe(false);
    });

    test("Triggers JLCPCB on Surface Finish: LeadFree HASL, ENIG, OSP", () => {
        expect(isJlcpcbRequired({ ...standardSpecs, surfaceFinish: "LeadFree HASL" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, surfaceFinish: "ENIG" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, surfaceFinish: "OSP" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, surfaceFinish: "HASL(with lead)" })).toBe(false);
    });

    test("Triggers JLCPCB on Via Covering: Plugged, Epoxy Filled&Capped, Copper Paste Filled&Capped", () => {
        expect(isJlcpcbRequired({ ...standardSpecs, viaCovering: "Plugged" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, viaCovering: "Epoxy Filled & Capped" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, viaCovering: "Copper paste Filled & Capped" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, viaCovering: "Tented" })).toBe(false);
        expect(isJlcpcbRequired({ ...standardSpecs, viaCovering: "Untented" })).toBe(false);
    });

    test("Triggers JLCPCB on Via Plating Method: Conductive Adhesive, Horizontal Electroless Copper Plating", () => {
        expect(isJlcpcbRequired({ ...standardSpecs, viaPlating: "Conductive Adhesive" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, viaPlating: "Horizontal Electroless Copper Plating" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, viaPlating: "Not Specified" })).toBe(false);
    });

    test("Triggers JLCPCB on Min via hole <= 0.25mm", () => {
        expect(isJlcpcbRequired({ ...standardSpecs, minHole: "0.25mm/(0.35/0.4mm)" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, minHole: "0.2mm/(0.3/0.35mm)" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, minHole: "0.15mm/(0.25/0.3mm)" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, minHole: "0.3mm/(0.4/0.45mm)" })).toBe(false);
    });

    test("Triggers JLCPCB on Gold Fingers, Castellated Holes, Edge Plating, Blind Slots", () => {
        expect(isJlcpcbRequired({ ...standardSpecs, goldFingers: "Yes" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, castellated: "Yes" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, edgePlating: "Yes" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, blindSlots: "Yes" })).toBe(true);

        expect(isJlcpcbRequired({
            ...standardSpecs,
            goldFingers: "No",
            castellated: "No",
            edgePlating: "No",
            blindSlots: "No"
        })).toBe(false);
    });
});
