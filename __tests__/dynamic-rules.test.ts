import {
    resolveManufacturingProvider,
    DynamicProviderRule,
    setActiveProviderRules,
} from "../lib/manufacturingProviderResolver";

describe("Dynamic Database-Driven Provider Rules Evaluation", () => {
    const sampleSpecs = {
        productType: "pcb",
        baseMaterial: "FR-4",
        materialType: "FR4 TG135",
        layers: 2,
        thickness: "1.6mm",
        surfaceFinish: "HASL(Leaded)",
        pcbColor: "Green",
        copperWeight: "1 oz",
        minHole: "0.3mm",
        goldFingers: "No",
        castellated: "No",
        edgePlating: "No",
        blindSlots: "No",
    };

    afterEach(() => {
        // Clear cached dynamic rules after each test
        setActiveProviderRules([]);
    });

    test("Dynamic In-House rule matches when all conditions met", () => {
        const customRule: DynamicProviderRule = {
            id: 10,
            name: "Custom In-House Rule",
            provider: "IN_HOUSE",
            priority: 1,
            match_type: "all",
            is_active: 1,
            conditions: [
                { field: "base_material", operator: "equals", value: "FR-4" },
                { field: "layers", operator: "in", value: [1, 2] },
                { field: "surface_finish", operator: "equals", value: "HASL(Leaded)" },
            ],
        };

        const result = resolveManufacturingProvider(sampleSpecs, [customRule]);
        expect(result.provider).toBe("IN_HOUSE");
        expect(result.isEligible).toBe(true);
        expect(result.rule_name).toBe("Custom In-House Rule");
    });

    test("Dynamic In-House rule fails when condition violated -> defaults to JLCPCB", () => {
        const customRule: DynamicProviderRule = {
            id: 10,
            name: "Custom In-House Rule",
            provider: "IN_HOUSE",
            priority: 1,
            match_type: "all",
            is_active: 1,
            conditions: [
                { field: "base_material", operator: "equals", value: "FR-4" },
                { field: "layers", operator: "in", value: [1, 2] },
                { field: "surface_finish", operator: "equals", value: "HASL(Leaded)" },
            ],
        };

        // Surface finish is ENIG -> does not match custom In-House rule
        const enigSpecs = { ...sampleSpecs, surfaceFinish: "ENIG" };
        const result = resolveManufacturingProvider(enigSpecs, [customRule]);
        expect(result.provider).toBe("JLCPCB");
        expect(result.isEligible).toBe(false);
    });

    test("Priority order: higher priority (lower number) evaluated first", () => {
        const highPriorityJlcRule: DynamicProviderRule = {
            id: 1,
            name: "Force JLCPCB for 4+ layers",
            provider: "JLCPCB",
            priority: 1,
            match_type: "all",
            is_active: 1,
            conditions: [
                { field: "layers", operator: ">=", value: 4 },
            ],
        };

        const lowPriorityInHouseRule: DynamicProviderRule = {
            id: 2,
            name: "In-House general",
            provider: "IN_HOUSE",
            priority: 10,
            match_type: "all",
            is_active: 1,
            conditions: [
                { field: "base_material", operator: "equals", value: "FR-4" },
            ],
        };

        // 4 layers should match highPriorityJlcRule first
        const fourLayerSpecs = { ...sampleSpecs, layers: 4 };
        const result = resolveManufacturingProvider(fourLayerSpecs, [lowPriorityInHouseRule, highPriorityJlcRule]);
        expect(result.provider).toBe("JLCPCB");
        expect(result.rule_name).toBe("Force JLCPCB for 4+ layers");
    });

    test("Dynamic ANY condition logic works correctly", () => {
        const anyRule: DynamicProviderRule = {
            id: 5,
            name: "Any Specialty Feature forces JLCPCB",
            provider: "JLCPCB",
            priority: 1,
            match_type: "any",
            is_active: 1,
            conditions: [
                { field: "gold_fingers", operator: "equals", value: "Yes" },
                { field: "edge_plating", operator: "equals", value: "Yes" },
                { field: "castellated_holes", operator: "equals", value: "Yes" },
            ],
        };

        const specsWithEdgePlating = { ...sampleSpecs, edgePlating: "Yes" };
        const result = resolveManufacturingProvider(specsWithEdgePlating, [anyRule]);
        expect(result.provider).toBe("JLCPCB");
        expect(result.rule_name).toBe("Any Specialty Feature forces JLCPCB");
    });
});
