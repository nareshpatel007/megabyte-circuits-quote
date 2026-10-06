import {
    isJlcpcbRequired,
    isEligibleForInHouse,
    getMatchedJlcpcbConditions,
    resolveManufacturingProvider
} from "../lib/manufacturingProviderResolver";

describe("Complete IN-HOUSE vs JLCPCB Production Routing - 14 Conditions", () => {
    // Canonical baseline: qualifies for IN-HOUSE on all 14 business rules
    const baselineInHouseSpecs = {
        productType: "pcb",
        baseMaterial: "FR-4",
        materialType: "FR4 TG135",
        layers: 2,
        width: 100,
        height: 100,
        thickness: "1.6mm",
        surfaceFinish: "HASL(Leaded)",
        pcbColor: "Green",
        copperWeight: "1 oz",
        minHole: "0.3mm/(0.4/0.45mm)",
        goldFingers: "No",
        castellated: "No",
        edgePlating: "No",
        blindSlots: "No",
        viaCovering: "Tented",
        viaPlating: "Not Specified",
    };

    test("Baseline configuration qualifies 100% for IN-HOUSE", () => {
        expect(isEligibleForInHouse(baselineInHouseSpecs)).toBe(true);
        expect(isJlcpcbRequired(baselineInHouseSpecs)).toBe(false);
        const res = resolveManufacturingProvider(baselineInHouseSpecs);
        expect(res.provider).toBe("IN_HOUSE");
        expect(res.quotationSource).toBe("internal");
        expect(res.orderType).toBe("normal");
        expect(res.series).toBe("M");
        expect(res.reasons).toEqual([]);
    });

    // Rule 1: Base Material (FR-4 only)
    describe("Rule 1: Base Material", () => {
        test("FR-4 qualifies for IN-HOUSE", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, baseMaterial: "FR-4" })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, baseMaterial: "FR4" })).toBe(false);
        });

        test("Non-FR-4 base materials force JLCPCB", () => {
            const nonFr4Materials = ["Flex", "Rogers", "PTFE Teflon", "Aluminum", "Copper Core"];
            nonFr4Materials.forEach(mat => {
                expect(isJlcpcbRequired({ ...baselineInHouseSpecs, baseMaterial: mat })).toBe(true);
            });
        });
    });

    // Rule 2: Material Type (FR4 TG135 only)
    describe("Rule 2: Material Type", () => {
        test("FR4 TG135 qualifies for IN-HOUSE", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, materialType: "FR4 TG135" })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, materialType: "FR4-TG135" })).toBe(false);
        });

        test("Other material types force JLCPCB even with FR-4 base material", () => {
            const otherMaterialTypes = [
                "KB6164 - TG135",
                "Nan Ya NP-140F",
                "S1141 TG140",
                "S1000H TG155",
                "RO4350B(Dk=3.48,Df=0.0037)",
                "Polyimide (PI)"
            ];
            otherMaterialTypes.forEach(mt => {
                const specs = { ...baselineInHouseSpecs, materialType: mt };
                expect(isJlcpcbRequired(specs)).toBe(true);
                expect(getMatchedJlcpcbConditions(specs).some(r => r.includes("Material Type"))).toBe(true);
            });
        });
    });

    // Rule 3: PCB Layers (1L and 2L only)
    describe("Rule 3: PCB Layers", () => {
        test("1 and 2 layers qualify for IN-HOUSE", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, layers: 1 })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, layers: "1" })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, layers: 2 })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, layers: "2 Layers" })).toBe(false);
        });

        test("4, 6, 8, 10, 12, 14, 16 layers force JLCPCB", () => {
            [4, 6, 8, 10, 12, 14, 16].forEach(layer => {
                const specs = { ...baselineInHouseSpecs, layers: layer };
                expect(isJlcpcbRequired(specs)).toBe(true);
                expect(getMatchedJlcpcbConditions(specs).some(r => r.includes("Layer Count"))).toBe(true);
            });
        });
    });

    // Rule 4: Surface Finish (HASL Leaded only)
    describe("Rule 4: Surface Finish", () => {
        test("HASL (Leaded) qualifies for IN-HOUSE", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, surfaceFinish: "HASL(Leaded)" })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, surfaceFinish: "HASL(with lead)" })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, surfaceFinish: "HASL" })).toBe(false);
        });

        test("LeadFree HASL, ENIG, OSP force JLCPCB", () => {
            const forbiddenFinishes = ["LeadFree HASL", "LeadFree HASL (RoHS)", "ENIG", "OSP", "Immersion Gold"];
            forbiddenFinishes.forEach(sf => {
                const specs = { ...baselineInHouseSpecs, surfaceFinish: sf };
                expect(isJlcpcbRequired(specs)).toBe(true);
                expect(getMatchedJlcpcbConditions(specs).some(r => r.includes("Surface Finish"))).toBe(true);
            });
        });
    });

    // Rule 5: PCB Thickness (Except 0.6 mm)
    describe("Rule 5: PCB Thickness", () => {
        test("0.6 mm forces JLCPCB", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, thickness: "0.6mm" })).toBe(true);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, thickness: 0.6 })).toBe(true);
        });

        test("0.8, 1.0, 1.2, 1.6, 2.0 mm qualify for IN-HOUSE", () => {
            ["0.8mm", "1.0mm", "1.2mm", "1.6mm", "2.0mm"].forEach(t => {
                expect(isJlcpcbRequired({ ...baselineInHouseSpecs, thickness: t })).toBe(false);
            });
        });
    });

    // Rule 6: PCB Color / Solder Mask (All supported colors qualify)
    describe("Rule 6: PCB Color / Solder Mask", () => {
        test("Every supported color qualifies for IN-HOUSE", () => {
            const supportedColors = ["Green", "Purple", "Red", "Yellow", "Blue", "White", "Black", "#52c41a", "#722ed1"];
            supportedColors.forEach(color => {
                expect(isJlcpcbRequired({ ...baselineInHouseSpecs, pcbColor: color })).toBe(false);
            });
        });
    });

    // Rule 7: Outer Copper Weight (All supported weights qualify)
    describe("Rule 7: Outer Copper Weight", () => {
        test("1 oz and 2 oz qualify for IN-HOUSE", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, copperWeight: "1 oz" })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, copperWeight: "2 oz" })).toBe(false);
        });
    });

    // Rule 8: Minimum Via Hole (>= 0.30 mm)
    describe("Rule 8: Minimum Via Hole", () => {
        test("0.30 mm qualifies for IN-HOUSE", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, minHole: "0.3mm/(0.4/0.45mm)" })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, minHole: "0.3mm" })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, minHole: "0.30mm" })).toBe(false);
        });

        test("< 0.30 mm (0.25, 0.20, 0.15 mm) forces JLCPCB", () => {
            const forbiddenHoles = [
                "0.25mm/(0.35/0.4mm)",
                "0.2mm/(0.3/0.35mm)",
                "0.15mm/(0.25/0.3mm)",
                "0.25mm",
                "0.20mm",
                "0.15mm"
            ];
            forbiddenHoles.forEach(h => {
                const specs = { ...baselineInHouseSpecs, minHole: h };
                expect(isJlcpcbRequired(specs)).toBe(true);
                expect(getMatchedJlcpcbConditions(specs).some(r => r.includes("Min Via Hole"))).toBe(true);
            });
        });
    });

    // Rule 9: Gold Fingers (No)
    describe("Rule 9: Gold Fingers", () => {
        test("No qualifies for IN-HOUSE", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, goldFingers: "No" })).toBe(false);
        });
        test("Yes forces JLCPCB", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, goldFingers: "Yes" })).toBe(true);
        });
    });

    // Rule 10: Castellated Holes (No)
    describe("Rule 10: Castellated Holes", () => {
        test("No qualifies for IN-HOUSE", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, castellated: "No" })).toBe(false);
        });
        test("Yes forces JLCPCB", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, castellated: "Yes" })).toBe(true);
        });
    });

    // Rule 11: Edge Plating (No)
    describe("Rule 11: Edge Plating", () => {
        test("No qualifies for IN-HOUSE", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, edgePlating: "No" })).toBe(false);
        });
        test("Yes forces JLCPCB", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, edgePlating: "Yes" })).toBe(true);
        });
    });

    // Rule 12: Blind Slots (No)
    describe("Rule 12: Blind Slots", () => {
        test("No qualifies for IN-HOUSE", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, blindSlots: "No" })).toBe(false);
        });
        test("Yes forces JLCPCB", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, blindSlots: "Yes" })).toBe(true);
        });
    });

    // Rule 13: Via Covering (Tented, Untented qualify; Plugged, Epoxy, Copper Paste force JLCPCB)
    describe("Rule 13: Via Covering", () => {
        test("Tented, Untented, and Not Specified qualify for IN-HOUSE", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, viaCovering: "Tented" })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, viaCovering: "Untented" })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, viaCovering: "Not Specified" })).toBe(false);
        });

        test("Plugged, Epoxy Filled & Capped, Copper Paste Filled & Capped force JLCPCB", () => {
            const forbiddenViaCovering = [
                "Plugged",
                "Epoxy Filled & Capped",
                "Copper paste Filled & Capped",
                "Copper Paste Filled & Capped"
            ];
            forbiddenViaCovering.forEach(vc => {
                const specs = { ...baselineInHouseSpecs, viaCovering: vc };
                expect(isJlcpcbRequired(specs)).toBe(true);
                expect(getMatchedJlcpcbConditions(specs).some(r => r.includes("Via Covering"))).toBe(true);
            });
        });
    });

    // Rule 14: Via Plating Method (Not Specified qualifies; Conductive Adhesive, Horizontal Electroless force JLCPCB)
    describe("Rule 14: Via Plating Method", () => {
        test("Not Specified qualifies for IN-HOUSE", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, viaPlating: "Not Specified" })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, viaPlating: "" })).toBe(false);
        });

        test("Conductive Adhesive and Horizontal Electroless Copper force JLCPCB", () => {
            const forbiddenViaPlating = [
                "Conductive Adhesive",
                "Horizontal Electroless Copper Plating"
            ];
            forbiddenViaPlating.forEach(vp => {
                const specs = { ...baselineInHouseSpecs, viaPlating: vp };
                expect(isJlcpcbRequired(specs)).toBe(true);
                expect(getMatchedJlcpcbConditions(specs).some(r => r.includes("Via Plating"))).toBe(true);
            });
        });
    });

    // Rule 15 & 16: Mark on PCB and Electrical Test are permanently removed and do not force JLCPCB
    describe("Mark on PCB and Electrical Test Removed", () => {
        test("Values do not force JLCPCB", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, markOnPcb: "Remove Mark" } as any)).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, elecTest: "Flying Probe Fully Test" } as any)).toBe(false);
        });
    });

    // Mandatory Regression & Transition Scenarios
    describe("Mandatory Transition and Regression Scenarios", () => {
        test("2 layers -> 4 layers -> 2 layers", () => {
            expect(isJlcpcbRequired(baselineInHouseSpecs)).toBe(false);
            const fourLayers = { ...baselineInHouseSpecs, layers: 4 };
            expect(isJlcpcbRequired(fourLayers)).toBe(true);
            const backToTwo = { ...fourLayers, layers: 2 };
            expect(isJlcpcbRequired(backToTwo)).toBe(false);
        });

        test("HASL Leaded -> ENIG -> HASL Leaded", () => {
            expect(isJlcpcbRequired(baselineInHouseSpecs)).toBe(false);
            const enig = { ...baselineInHouseSpecs, surfaceFinish: "ENIG" };
            expect(isJlcpcbRequired(enig)).toBe(true);
            const backToHasl = { ...enig, surfaceFinish: "HASL(Leaded)" };
            expect(isJlcpcbRequired(backToHasl)).toBe(false);
        });

        test("FR4 TG135 -> KB6164 TG135 -> FR4 TG135", () => {
            expect(isJlcpcbRequired(baselineInHouseSpecs)).toBe(false);
            const kb = { ...baselineInHouseSpecs, materialType: "KB6164 - TG135" };
            expect(isJlcpcbRequired(kb)).toBe(true);
            const backToFr4 = { ...kb, materialType: "FR4 TG135" };
            expect(isJlcpcbRequired(backToFr4)).toBe(false);
        });

        test("1.6 mm -> 0.6 mm -> 1.6 mm", () => {
            expect(isJlcpcbRequired(baselineInHouseSpecs)).toBe(false);
            const thin = { ...baselineInHouseSpecs, thickness: "0.6mm" };
            expect(isJlcpcbRequired(thin)).toBe(true);
            const backToStandard = { ...thin, thickness: "1.6mm" };
            expect(isJlcpcbRequired(backToStandard)).toBe(false);
        });

        test("Min via 0.30 mm -> 0.20 mm -> 0.30 mm", () => {
            expect(isJlcpcbRequired(baselineInHouseSpecs)).toBe(false);
            const tightHole = { ...baselineInHouseSpecs, minHole: "0.2mm/(0.3/0.35mm)" };
            expect(isJlcpcbRequired(tightHole)).toBe(true);
            const backToStandardHole = { ...tightHole, minHole: "0.3mm/(0.4/0.45mm)" };
            expect(isJlcpcbRequired(backToStandardHole)).toBe(false);
        });

        test("Gold Fingers: No -> Yes -> No", () => {
            expect(isJlcpcbRequired(baselineInHouseSpecs)).toBe(false);
            const withGold = { ...baselineInHouseSpecs, goldFingers: "Yes" };
            expect(isJlcpcbRequired(withGold)).toBe(true);
            const withoutGold = { ...withGold, goldFingers: "No" };
            expect(isJlcpcbRequired(withoutGold)).toBe(false);
        });

        test("Castellated Holes: No -> Yes -> No", () => {
            expect(isJlcpcbRequired(baselineInHouseSpecs)).toBe(false);
            const withCastellated = { ...baselineInHouseSpecs, castellated: "Yes" };
            expect(isJlcpcbRequired(withCastellated)).toBe(true);
            const withoutCastellated = { ...withCastellated, castellated: "No" };
            expect(isJlcpcbRequired(withoutCastellated)).toBe(false);
        });

        test("Edge Plating: No -> Yes -> No", () => {
            expect(isJlcpcbRequired(baselineInHouseSpecs)).toBe(false);
            const withEdgePlating = { ...baselineInHouseSpecs, edgePlating: "Yes" };
            expect(isJlcpcbRequired(withEdgePlating)).toBe(true);
            const withoutEdgePlating = { ...withEdgePlating, edgePlating: "No" };
            expect(isJlcpcbRequired(withoutEdgePlating)).toBe(false);
        });

        test("Blind Slots: No -> Yes -> No", () => {
            expect(isJlcpcbRequired(baselineInHouseSpecs)).toBe(false);
            const withBlindSlots = { ...baselineInHouseSpecs, blindSlots: "Yes" };
            expect(isJlcpcbRequired(withBlindSlots)).toBe(true);
            const withoutBlindSlots = { ...withBlindSlots, blindSlots: "No" };
            expect(isJlcpcbRequired(withoutBlindSlots)).toBe(false);
        });

        test("Via Covering: Tented -> Plugged -> Tented", () => {
            expect(isJlcpcbRequired(baselineInHouseSpecs)).toBe(false);
            const plugged = { ...baselineInHouseSpecs, viaCovering: "Plugged" };
            expect(isJlcpcbRequired(plugged)).toBe(true);
            const tented = { ...plugged, viaCovering: "Tented" };
            expect(isJlcpcbRequired(tented)).toBe(false);
        });

        test("Via Plating: Not Specified -> Conductive Adhesive -> Not Specified", () => {
            expect(isJlcpcbRequired(baselineInHouseSpecs)).toBe(false);
            const conductive = { ...baselineInHouseSpecs, viaPlating: "Conductive Adhesive" };
            expect(isJlcpcbRequired(conductive)).toBe(true);
            const notSpecified = { ...conductive, viaPlating: "Not Specified" };
            expect(isJlcpcbRequired(notSpecified)).toBe(false);
        });

        test("Stale jlcpcb file keys and quotation_source flags do NOT override 2-layer local board", () => {
            const stalePayload = {
                ...baselineInHouseSpecs,
                quotation_source: "jlcpcb",
                order_type: "jlcpcb",
                fileKey: "some_gerber_key.zip",
                jlcpcb_file_key: "jlc_key_123"
            };
            expect(isJlcpcbRequired(stalePayload)).toBe(false);
            const res = resolveManufacturingProvider(stalePayload);
            expect(res.provider).toBe("IN_HOUSE");
            expect(res.series).toBe("M");
        });

        test("Multiple failing conditions accumulate all failure reasons", () => {
            const multiFailSpecs = {
                ...baselineInHouseSpecs,
                layers: 4,
                surfaceFinish: "ENIG",
                thickness: "0.6mm",
                materialType: "Nan Ya NP-140F",
                minHole: "0.20mm"
            };
            expect(isJlcpcbRequired(multiFailSpecs)).toBe(true);
            const reasons = getMatchedJlcpcbConditions(multiFailSpecs);
            expect(reasons.length).toBeGreaterThanOrEqual(5);
        });

        test("Product type stencil and part always remain Local regardless of other specs", () => {
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, layers: 4, productType: "stencil" })).toBe(false);
            expect(isJlcpcbRequired({ ...baselineInHouseSpecs, layers: 6, productType: "part" })).toBe(false);
        });
    });
});
