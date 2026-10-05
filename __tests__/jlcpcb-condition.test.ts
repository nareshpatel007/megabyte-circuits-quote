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

    test("Standard and custom FR-4 options for 1 and 2 layers use LOCAL pricing (no JLCPCB trigger)", () => {
        expect(isJlcpcbRequired(standardSpecs)).toBe(false);
        expect(getMatchedJlcpcbConditions(standardSpecs)).toEqual([]);

        // 1 layer FR-4
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 1 })).toBe(false);

        // 2 layer FR-4 with custom thickness (e.g. 0.76mm, 0.6mm) and ENIG surface finish
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 2, thickness: 0.76, surfaceFinish: "ENIG" })).toBe(false);
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 2, thickness: "0.6mm", surfaceFinish: "LeadFree HASL" })).toBe(false);
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 1, thickness: "1.0mm" })).toBe(false);
    });

    test("Multilayer boards (> 2 layers: 4, 6, 8, 10...) trigger JLCPCB", () => {
        [4, 6, 8, 10, 12, 16].forEach(layer => {
            const specs = { ...standardSpecs, layers: layer };
            expect(isJlcpcbRequired(specs)).toBe(true);
            expect(getMatchedJlcpcbConditions(specs)).toContain(`Multilayer PCB (${layer} Layers)`);
        });
    });

    test("Non-FR-4 base materials trigger JLCPCB even for 1 or 2 layers", () => {
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 2, baseMaterial: "Flex" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 1, baseMaterial: "Flex" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 2, baseMaterial: "Rogers" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 2, baseMaterial: "PTFE Teflon" })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 1, baseMaterial: "Aluminum" })).toBe(true);
    });

    test("Product type part or stencil does not trigger JLCPCB", () => {
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 4, productType: "stencil" })).toBe(false);
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 6, productType: "part" })).toBe(false);
    });

    test("Uploaded file key does not trigger JLCPCB for 1 or 2 layer FR-4", () => {
        const specs = { ...standardSpecs, layers: 2, fileKey: "some_gerber_key.zip", jlcpcb_file_key: "jlc_key_123" };
        expect(isJlcpcbRequired(specs)).toBe(false);
    });

    test("Transition Scenarios A-E: Provider switches back to Local when layers <= 2", () => {
        // Scenario A: 1 layer -> 2 layers -> 1 layer
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 1 })).toBe(false);
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 2 })).toBe(false);
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 1 })).toBe(false);

        // Scenario B: 2 layers -> 4 layers -> 2 layers
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 2 })).toBe(false);
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 4 })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 2 })).toBe(false);

        // Scenario C: 2 layers -> 6 layers -> 2 layers
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 2 })).toBe(false);
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 6 })).toBe(true);
        expect(isJlcpcbRequired({ ...standardSpecs, layers: 2 })).toBe(false);

        // Scenario D: 4 layers -> 2 layers (Critical bug regression test)
        const fourLayerSpecs = { ...standardSpecs, layers: 4 };
        expect(isJlcpcbRequired(fourLayerSpecs)).toBe(true);
        const switchedToTwoLayers = { ...fourLayerSpecs, layers: 2, jlcpcb_file_key: "stale_key", quotation_source: "jlcpcb" };
        expect(isJlcpcbRequired(switchedToTwoLayers)).toBe(false);

        // Scenario E: 6 layers -> 1 layer
        const sixLayerSpecs = { ...standardSpecs, layers: 6 };
        expect(isJlcpcbRequired(sixLayerSpecs)).toBe(true);
        const switchedToOneLayer = { ...sixLayerSpecs, layers: 1, jlcpcb_file_key: "stale_key", quotation_source: "jlcpcb" };
        expect(isJlcpcbRequired(switchedToOneLayer)).toBe(false);
    });
});


