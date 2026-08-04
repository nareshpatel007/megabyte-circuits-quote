"use client";

export function calculateCurrentPcbPrice(
    layersInput: number | string = 2,
    dimensionsInput: string = "100x100mm",
    quantityInput: number | string = 5,
    thicknessInput: number | string = 1.6,
    pcbColor: string = "Green",
    fallbackPrice: number = 0
): number {
    try {
        const layers = parseInt(String(layersInput), 10) || 2;
        const qty = Math.max(parseInt(String(quantityInput), 10) || 1, 1);

        let length = 100;
        let width = 100;
        if (dimensionsInput) {
            const dims = dimensionsInput.toLowerCase().replace(/[^0-9.x]/g, "").split("x");
            if (dims.length >= 2) {
                length = parseFloat(dims[0]) || 100;
                width = parseFloat(dims[1]) || 100;
            }
        }

        const areaPerBoard = (length * width) / 1000000;
        const totalAreaInSqM = areaPerBoard * qty;
        const areaInSqCm = totalAreaInSqM * 10000;

        const fixedCosts: Record<string, number> = {
            "1": 1400,
            "2": 1900,
            "4": 6000,
            "6": 7000,
            "8": 8000,
            "10": 9000
        };

        const baseFixed = fixedCosts[String(layers)] || 1900;
        const variableCost = areaInSqCm * (layers > 2 ? 0.35 : 0.22);
        const colorMultiplier = (pcbColor || "green").toLowerCase() === "green" ? 1.0 : 1.1;

        const calculated = Math.round((baseFixed + variableCost) * colorMultiplier);
        return calculated > 0 ? calculated : (fallbackPrice > 0 ? fallbackPrice : 1500);
    } catch (e) {
        console.error("PCB Price calculation error:", e);
        return fallbackPrice > 0 ? fallbackPrice : 1500;
    }
}
