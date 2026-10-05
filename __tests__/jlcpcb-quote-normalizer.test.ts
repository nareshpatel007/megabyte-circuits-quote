import { normalizeJlcpcbQuote } from "@/lib/jlcpcbQuoteNormalizer";

describe("JLCPCB Quote Normalizer Tests", () => {
    test("TEST CASE 1: Real API response with LeadFree HASL & Confirm Production File", () => {
        const apiResponse1 = {
            orderTotalWeight: 166000,
            priceWithoutFreight: 4423.40,
            weight: 166,
            chargeWeight: 174415.5,
            pcbCostInfo: {
                projectFee: 8,
                spellFee: 0,
                adornPutFee: 253.10,
                stencilFee: 3729.40,
                testsFee: 430.10,
                fillFee: 2.80,
                achieveFee: 0,
                viaCoveringMoney: 0,
                goldThicknessMoney: 0,
                edgeGrindingMoney: 0,
                dummyMoney: 4423.40,
                specialMoney: 0,
                totalFee: 4423.40
            },
            serviceConfigFeeInfo: [
                {
                    serviceConfigCode: "CPF",
                    serviceConfigShow: "Confirm Production file",
                    serviceFee: 1.05
                }
            ],
            shipList: [
                {
                    options: "UPS EXPRESS",
                    showOptions: "UPS Worldwide Express Saver",
                    cost: "986.7500",
                    day: "6-9 business days"
                },
                {
                    options: "DHL Express",
                    showOptions: "DHL Express",
                    cost: "1555.3600",
                    day: "2-4 business days"
                },
                {
                    options: "Sea Shipment",
                    showOptions: "Sea Shipment",
                    cost: "378.8100",
                    day: "25-35 business days"
                }
            ],
            achieveDateList: [
                { achieveName: "5-6 days", achieveDate: "120", achieveChecked: "checked", achievePrice: 0 },
                { achieveName: "3-4 days", achieveDate: "70", achieveChecked: "", achievePrice: 0 }
            ]
        };

        const payload1 = {
            pcbParam: {
                surfaceFinish: 1, // LeadFree HASL
                serviceConfigVos: [
                    { serviceConfigCode: "CPF", configOptionShow: "Yes" }
                ]
            }
        };

        const normalized = normalizeJlcpcbQuote(apiResponse1, payload1);

        expect(normalized.basePcbPrice).toBe(3994.35);
        expect(normalized.providerTotalFee).toBe(4423.40);
        expect(normalized.basePcbPrice).not.toBe(normalized.providerTotalFee);

        const chargesMap = Object.fromEntries(normalized.pcbCharges.map(c => [c.code, c.amount]));

        expect(chargesMap["engineering_fee"]).toBe(8.00);
        expect(chargesMap["via_covering"]).toBe(0.00);
        expect(chargesMap["surface_finish"]).toBe(253.10);
        expect(chargesMap["film"]).toBe(2.80);
        expect(chargesMap["board"]).toBe(3729.40);
        expect(chargesMap["confirm_production_file"]).toBe(1.05);

        // Shipping remains separate
        expect(normalized.shippingOptions).toHaveLength(3);
        expect(normalized.shippingOptions[0].price).toBe(986.75);
    });

    test("TEST CASE 2: Real API response with HASL with lead requested by user", () => {
        const apiResponse2 = {
            priceWithoutFreight: 208.00,
            pcbCostInfo: {
                projectFee: 8.00,
                adornPutFee: 14.90,
                stencilFee: 149.20,
                testsFee: 33.10,
                fillFee: 2.80,
                viaCoveringMoney: 0,
                totalFee: 208.00
            }
        };

        const payload2 = {
            pcbParam: {
                surfaceFinish: 0 // HASL with lead requested by user
            }
        };

        const normalized = normalizeJlcpcbQuote(apiResponse2, payload2);

        expect(normalized.basePcbPrice).toBe(160.00);
        expect(normalized.providerTotalFee).toBe(208.00);
        expect(normalized.basePcbPrice).not.toBe(normalized.providerTotalFee);

        const chargesMap = Object.fromEntries(normalized.pcbCharges.map(c => [c.code, c.amount]));

        expect(chargesMap["engineering_fee"]).toBe(8.00);
        expect(chargesMap["via_covering"]).toBe(0.00);
        expect(chargesMap["surface_finish"]).toBe(0.00);
        expect(chargesMap["film"]).toBe(2.80);
        expect(chargesMap["board"]).toBe(149.20);
    });
});
