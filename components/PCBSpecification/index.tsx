"use client";

import React, { useState } from "react";

import { ShoppingCart, ChevronDown, ChevronUp, Cpu, Layers, Search, Menu, X, Settings } from "lucide-react";
import Link from "next/link";
import GerberUploader from "../GerberUploader";
import GerberStackupPreview from "../GerberStackupPreview";
import QuoteForm from "../QuoteForm";
import { GerberFile, QuoteFormData, UploadResponse } from "../../lib/gerber/types";
import { loadLayers, renderStack, type RenderOptions, COLORS, FINISHES } from "../../lib/gerber/clientRenderer";
import { type InputLayer } from "pcb-stackup";


const INITIAL_FORM_DATA: QuoteFormData = {
    baseMaterial: "FR-4",
    layers: "2",
    width: "100",
    height: "100",
    unit: "mm",
    qty: "5",
    productType: "Industrial/Consumer electronics",
    differentDesign: "1",
    thickness: "1.6mm",
    pcbColor: "#52c41a",
    silkscreen: "White",
    materialType: "FR4-TG135",
    surfaceFinish: "HASL(with lead)",
    copperWeight: "1oz",
    viaCovering: "Not Specified",
    viaPlating: "Not Specified",
    minHole: "0.3mm",
    tolerance: "Regular",
    confirmFile: "No",
    markOnPcb: "Remove Mark",
    elecTest: "Flying Probe Fully Test",
    goldFingers: "No",
    castellated: "No",
    edgePlating: "No",
    blindSlots: "No",
    ulMarking: "No",
    humidity: "No",
    kelvinTest: "No",
    paperBetween: "No",
    appearanceQuality: "IPC Class 2 Standard",
    silkscreenTech: "Ink-jet Printing Silkscreen",
    inspectionReport: "No",
    pcbRemark: "",
    assemblyOn: false,
    stencilOn: false,
    buildTime: "2 days",
    boardName: "",
    userMobile: "",
    userEmail: "",
    gstNumber: "",
    customerName: "",
    billingAddress: "",
    shippingAddress: ""
};

// --- Pricing Matrix Definitions (from PHP) ---
function getStandardPrices() {
    return {
        '1': {
            "0.5 or less": [4.62, 3.08, 2.31, 1.925, 1.54],
            "0.51 to 1": [4.62, 3.08, 2.31, 1.925, 1.54],
            "1.01 to 2": [3.08, 1.54, 1.386, 1.078, 0.77],
            "2.01 to 3": [3.08, 1.54, 1.386, 0.886, 0.539],
            "3.01 to 9.99": [0, 1.54, 1.155, 0.847, 0.539]
        },
        '2': {
            "0.5 or less": [5.28, 4.62, 3.3, 2.64, 1.98],
            "0.51 to 1": [5.28, 3.96, 2.64, 2.31, 1.98],
            "1.01 to 2": [0, 2.64, 2.31, 1.816, 1.32],
            "2.01 to 3": [0, 0, 1.848, 1.584, 1.32],
            "3.01 to 9.99": [0, 0, 0, 1.518, 1.32]
        },
        '4': {
            "0.5 or less": [7, 5.6, 4.2, 3.5, 2.8],
            "0.51 to 1": [7, 5.6, 4.2, 3.5, 2.8],
            "1.01 to 2": [4.2, 2.8, 2.52, 2.1, 1.68],
            "2.01 to 3": [4.2, 2.8, 2.1, 1.68, 1.4],
            "3.01 to 9.99": [4.2, 2.8, 2.1, 1.68, 1.4]
        },
        '6': {
            "0.5 or less": [9.8, 8.4, 6.3, 4.9, 4.2],
            "0.51 to 1": [9.8, 8.4, 6.3, 4.9, 4.2],
            "1.01 to 2": [7, 5.6, 4.9, 4.2, 3.5],
            "2.01 to 3": [7, 5.6, 4.2, 3.5, 2.8],
            "3.01 to 9.99": [7, 5.6, 4.2, 3.5, 2.8]
        },
        '8': {
            "0.5 or less": [7, 5.6, 4.2, 3.5, 2.8],
            "0.51 to 1": [7, 5.6, 4.2, 3.5, 2.8],
            "1.01 to 2": [4.2, 2.8, 2.52, 2.1, 1.68],
            "2.01 to 3": [4.2, 2.8, 2.1, 1.68, 1.4],
            "3.01 to 9.99": [4.2, 2.8, 2.1, 1.68, 1.4]
        },
        '10': {
            "0.5 or less": [9.8, 8.4, 6.3, 4.9, 4.2],
            "0.51 to 1": [9.8, 8.4, 6.3, 4.9, 4.2],
            "1.01 to 2": [7, 5.6, 4.9, 4.2, 3.5],
            "2.01 to 3": [7, 5.6, 4.2, 3.5, 2.8],
            "3.01 to 9.99": [7, 5.6, 4.2, 3.5, 2.8]
        }
    };
}

function getOtherMask1ozPrices() {
    return {
        '1': {
            "0.5 or less": [5.39, 3.85, 3.08, 2.695, 2.31],
            "0.51 to 1": [5.39, 3.85, 3.08, 2.695, 2.31],
            "1.01 to 2": [3.85, 1.694, 1.54, 1.232, 0.924],
            "2.01 to 3": [3.85, 1.694, 1.54, 0.979, 0.57],
            "3.01 to 9.99": [0, 1.694, 1.309, 0.939, 0.57]
        },
        '2': {
            "0.5 or less": [6.6, 5.94, 3.96, 3.136, 2.31],
            "0.51 to 1": [6.6, 5.28, 3.3, 2.806, 2.31],
            "1.01 to 2": [0, 3.036, 2.64, 2.146, 1.65],
            "2.01 to 3": [0, 0, 1.98, 1.782, 1.584],
            "3.01 to 9.99": [0, 0, 0, 1.65, 1.584]
        },
        '4': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '6': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        },
        '8': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '10': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        }
    };
}

function getGreenMask1ozOtherThicknessPrices() {
    return {
        '1': {
            "0.5 or less": [6.93, 4.62, 3.465, 2.888, 2.31],
            "0.51 to 1": [6.93, 4.62, 3.465, 2.888, 2.31],
            "1.01 to 2": [4.62, 2.31, 2.079, 1.617, 1.155],
            "2.01 to 3": [4.62, 2.31, 1.848, 1.617, 1.155],
            "3.01 to 9.99": [0, 2.31, 1.733, 1.271, 0.809]
        },
        '2': {
            "0.5 or less": [7.92, 6.93, 4.95, 3.96, 2.97],
            "0.51 to 1": [7.92, 5.94, 3.96, 3.466, 2.97],
            "1.01 to 2": [0, 3.96, 3.466, 2.723, 1.98],
            "2.01 to 3": [0, 0, 2.442, 2.212, 1.98],
            "3.01 to 9.99": [0, 0, 0, 2.278, 1.98]
        },
        '4': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '6': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        },
        '8': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '10': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        }
    };
}

function getOtherMask1ozOtherThicknessPrices() {
    return {
        '1': {
            "0.5 or less": [8.085, 5.775, 4.62, 4.043, 3.465],
            "0.51 to 1": [8.085, 5.775, 4.62, 4.043, 3.465],
            "1.01 to 2": [5.775, 2.541, 2.31, 1.848, 1.386],
            "2.01 to 3": [5.775, 2.541, 2.079, 1.467, 0.855],
            "3.01 to 9.99": [0, 2.541, 1.964, 1.41, 0.855]
        },
        '2': {
            "0.5 or less": [9.9, 8.91, 5.94, 4.712, 3.466],
            "0.51 to 1": [9.9, 7.92, 4.95, 4.208, 3.466],
            "1.01 to 2": [0, 4.554, 3.96, 3.234, 2.476],
            "2.01 to 3": [0, 0, 2.64, 2.508, 2.376],
            "3.01 to 9.99": [0, 0, 0, 2.508, 2.376]
        },
        '4': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '6': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        },
        '8': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '10': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        }
    };
}

function getGreenMask2ozPrices() {
    return {
        '1': {
            "0.5 or less": [9.24, 6.16, 4.62, 3.85, 3.08],
            "0.51 to 1": [9.24, 6.16, 4.62, 3.85, 3.08],
            "1.01 to 2": [6.16, 3.08, 2.772, 2.156, 1.54],
            "2.01 to 3": [6.16, 3.08, 2.464, 1.771, 1.078],
            "3.01 to 9.99": [0, 3.08, 2.31, 1.694, 1.078]
        },
        '2': {
            "0.5 or less": [10.56, 9.24, 6.6, 5.28, 3.96],
            "0.51 to 1": [10.56, 7.92, 5.28, 4.62, 3.96],
            "1.01 to 2": [0, 5.28, 4.62, 3.63, 2.64],
            "2.01 to 3": [0, 0, 3.3, 3.036, 2.64],
            "3.01 to 9.99": [0, 0, 0, 3.036, 2.64]
        },
        '4': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '6': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        },
        '8': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '10': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        }
    };
}

function getOtherMask2ozPrices() {
    return {
        '1': {
            "0.5 or less": [10.78, 7.7, 6.16, 5.39, 4.62],
            "0.51 to 1": [10.78, 7.7, 6.16, 5.39, 4.62],
            "1.01 to 2": [7.7, 3.388, 3.08, 2.464, 1.848],
            "2.01 to 3": [7.7, 3.388, 2.772, 1.956, 1.14],
            "3.01 to 9.99": [0, 3.388, 2.618, 1.879, 1.14]
        },
        '2': {
            "0.5 or less": [13.2, 11.88, 7.92, 6.27, 4.62],
            "0.51 to 1": [13.2, 10.56, 6.6, 5.61, 4.62],
            "1.01 to 2": [0, 6.072, 5.28, 4.29, 3.3],
            "2.01 to 3": [0, 0, 3.696, 3.432, 3.168],
            "3.01 to 9.99": [0, 0, 0, 3.3, 3.168]
        },
        '4': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '6': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        },
        '8': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '10': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        }
    };
}

function getGreenMask2ozOtherThicknessPrices() {
    return {
        '1': {
            "0.5 or less": [13.86, 9.24, 6.93, 5.775, 4.62],
            "0.51 to 1": [13.86, 9.24, 6.93, 5.775, 4.62],
            "1.01 to 2": [9.24, 4.62, 4.158, 3.234, 2.31],
            "2.01 to 3": [9.24, 4.62, 3.696, 2.657, 1.617],
            "3.01 to 9.99": [0, 4.62, 3.465, 2.541, 1.617]
        },
        '2': {
            "0.5 or less": [15.84, 13.86, 9.9, 7.92, 5.94],
            "0.51 to 1": [15.84, 11.88, 7.92, 6.93, 5.94],
            "1.01 to 2": [0, 7.92, 6.93, 5.446, 3.96],
            "2.01 to 3": [0, 0, 4.752, 4.554, 3.96],
            "3.01 to 9.99": [0, 0, 0, 4.554, 3.96]
        },
        '4': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '6': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        },
        '8': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '10': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        }
    };
}

function getOtherMask2ozOtherThicknessPrices() {
    return {
        '1': {
            "0.5 or less": [16.17, 11.55, 9.24, 8.085, 6.93],
            "0.51 to 1": [16.17, 11.55, 9.24, 8.085, 6.93],
            "1.01 to 2": [11.55, 5.082, 4.62, 3.696, 2.772],
            "2.01 to 3": [11.55, 5.082, 4.158, 2.941, 1.709],
            "3.01 to 9.99": [0, 5.082, 3.927, 2.818, 1.709]
        },
        '2': {
            "0.5 or less": [19.8, 17.82, 11.88, 9.406, 6.93],
            "0.51 to 1": [19.8, 15.84, 9.9, 8.416, 6.93],
            "1.01 to 2": [0, 9.108, 7.92, 6.436, 4.95],
            "2.01 to 3": [0, 0, 5.148, 4.95, 4.752],
            "3.01 to 9.99": [0, 0, 0, 4.95, 4.752]
        },
        '4': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '6': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        },
        '8': {
            "0.5 or less": [7],
            "0.51 to 1": [7],
            "1.01 to 2": [4.2],
            "2.01 to 3": [4.2],
            "3.01 to 9.99": [4.2]
        },
        '10': {
            "0.5 or less": [9.8],
            "0.51 to 1": [9.8],
            "1.01 to 2": [7],
            "2.01 to 3": [7],
            "3.01 to 9.99": [7]
        }
    };
}

function getPriceTiers(mask: string, weight: string, thickness: number) {
    const isThickness1_6 = Math.abs(thickness - 1.6) < 0.01;
    const thicknessKey = isThickness1_6 ? 1.6 : 'other';

    const tiers: any = {
        'Green': {
            '1oz': {
                1.6: getStandardPrices(),
                'other': getGreenMask1ozOtherThicknessPrices()
            },
            '2oz': {
                1.6: getGreenMask2ozPrices(),
                'other': getGreenMask2ozOtherThicknessPrices()
            }
        },
        'Other': {
            '1oz': {
                1.6: getOtherMask1ozPrices(),
                'other': getOtherMask1ozOtherThicknessPrices()
            },
            '2oz': {
                1.6: getOtherMask2ozPrices(),
                'other': getOtherMask2ozOtherThicknessPrices()
            }
        }
    };

    return tiers[mask]?.[weight]?.[thicknessKey] ?? tiers[mask]?.[weight]?.['other'] ?? tiers['Other']?.[weight]?.['other'] ?? null;
}

export default function PCBSpecification() {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [clientLayers, setClientLayers] = useState<InputLayer[]>([]);

    const [formData, setFormData] = useState<QuoteFormData>(INITIAL_FORM_DATA);
    const [specsOpen, setSpecsOpen] = useState(true);
    const [highSpecsOpen, setHighSpecsOpen] = useState(false);

    // Sticky Notes Calendar states
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [checkoutData, setCheckoutData] = useState<{ day: number; unitPrice: string; orderValue: string; dateStr: string } | null>(null);

    const [renderOptions, setRenderOptions] = useState<RenderOptions>({
        sm: "green",
        cf: "gold",
        sp: false
    });
    const [tempOptions, setTempOptions] = useState<RenderOptions>({ ...renderOptions });
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const [topSvg, setTopSvg] = useState<string>("");
    const [bottomSvg, setBottomSvg] = useState<string>("");
    const [previewLoading, setPreviewLoading] = useState(false);

    React.useEffect(() => {
        let active = true;
        async function runRender() {
            if (clientLayers.length === 0) return;
            setPreviewLoading(true);
            try {
                const stack = await renderStack(clientLayers, renderOptions);
                if (!active) return;
                setTopSvg(stack.top?.svg || "");
                setBottomSvg(stack.bottom?.svg || "");
            } catch (err) {
                console.error("Failed to render stackup:", err);
            } finally {
                setPreviewLoading(false);
            }
        }
        runRender();
        return () => {
            active = false;
        };
    }, [clientLayers, renderOptions]);

    // Dynamic lead time-based pricing calculation
    const getLeadTimePricing = () => {
        const layers = parseInt(formData.layers, 10) || 1;
        const unitMultiplier = formData.unit === "inches" ? 25.4 : 1;
        const length = (parseFloat(formData.width) || 0) * unitMultiplier;
        const width = (parseFloat(formData.height) || 0) * unitMultiplier;
        const quantity = Math.max(parseInt(formData.qty, 10) || 3, 3);
        const solderMask = formData.pcbColor === "#52c41a" ? "Green" : "Non-Green";
        const copperWeight = formData.copperWeight.replace(" ", "");
        const thickness = parseFloat(formData.thickness) || 1.6;

        if (length <= 0 || width <= 0 || quantity <= 0) {
            return { options: [], showContact: false, totalAreaInSqM: 0 };
        }

        const areaPerBoard = (length * width) / 1000000;
        const totalAreaInSqM = areaPerBoard * quantity;
        const areaInSqCm = totalAreaInSqM * 10000;

        const fixedCosts: Record<string, Record<number, number>> = {
            '1': { 1: 3100, 3: 2100, 5: 1600, 7: 1500, 10: 1400 },
            '2': { 1: 8100, 3: 4100, 5: 2600, 7: 2200, 10: 1900 },
            '4': { 20: 6000 },
            '6': { 20: 7000 },
            '8': { 20: 8000 },
            '10': { 20: 9000 }
        };

        const priceTiers = getPriceTiers(solderMask, copperWeight, thickness);
        if (!priceTiers) {
            return { options: [], showContact: false, totalAreaInSqM };
        }

        let tierKey = "";
        if (totalAreaInSqM <= 0.5) tierKey = "0.5 or less";
        else if (totalAreaInSqM <= 1) tierKey = "0.51 to 1";
        else if (totalAreaInSqM <= 2) tierKey = "1.01 to 2";
        else if (totalAreaInSqM <= 3) tierKey = "2.01 to 3";
        else if (totalAreaInSqM <= 9.99) tierKey = "3.01 to 9.99";
        else {
            return { options: [], showContact: true, totalAreaInSqM };
        }

        const applicablePrices = priceTiers[layers.toString()]?.[tierKey];
        if (!applicablePrices) {
            return { options: [], showContact: false, totalAreaInSqM };
        }

        // Days setup
        const daysList = [1, 3, 5, 7, 10, 20];
        const options = daysList.map((day, idx) => {
            const costPerSqCm = day === 20 ? applicablePrices[0] : applicablePrices[idx];
            const fixedCost = fixedCosts[layers.toString()]?.[day];
            if (fixedCost === undefined) {
                return { day, unitPrice: "0.00", orderValue: "0.00", visible: false };
            }
            const variableCost = areaInSqCm * costPerSqCm;
            const totalCost = fixedCost + variableCost;
            const unitPrice = totalCost / quantity;

            return {
                day,
                unitPrice: unitPrice.toFixed(2),
                orderValue: totalCost.toFixed(2),
                visible: true
            };
        });

        // Apply visibility overrides
        let showContact = false;
        if (layers >= 4 && layers <= 10) {
            options.forEach(opt => {
                if (opt.day !== 20) opt.visible = false;
            });
        } else if (layers === 1 || layers === 2) {
            options.forEach(opt => {
                if (opt.day === 20) opt.visible = false;
            });

            if (layers === 2 && totalAreaInSqM > 7) {
                options.forEach(opt => opt.visible = false);
                showContact = true;
            } else if (layers === 1 && totalAreaInSqM > 10) {
                options.forEach(opt => opt.visible = false);
                showContact = true;
            } else {
                // Area limits
                if (layers === 2) {
                    if (totalAreaInSqM > 2) {
                        options.forEach(opt => {
                            if ([1, 3, 5].includes(opt.day)) opt.visible = false;
                        });
                    } else if (totalAreaInSqM > 1.5) {
                        options.forEach(opt => {
                            if ([1, 3].includes(opt.day)) opt.visible = false;
                        });
                    } else if (totalAreaInSqM > 1) {
                        options.forEach(opt => {
                            if (opt.day === 1) opt.visible = false;
                        });
                    }
                } else if (layers === 1) {
                    if (totalAreaInSqM > 5) {
                        options.forEach(opt => {
                            if ([1, 3, 5].includes(opt.day)) opt.visible = false;
                        });
                    } else if (totalAreaInSqM > 3) {
                        options.forEach(opt => {
                            if ([1, 3].includes(opt.day)) opt.visible = false;
                        });
                    } else if (totalAreaInSqM > 2) {
                        options.forEach(opt => {
                            if (opt.day === 1) opt.visible = false;
                        });
                    }
                }
            }
        }

        return { options, showContact, totalAreaInSqM };
    };

    const handleUploadSuccess = async (res: UploadResponse, file: File) => {
        setUploadedFile(file);
        try {
            const layers = await loadLayers(file);
            setClientLayers(layers);

            const copperLayers = layers.filter(l => l.type === 'copper');
            const detectedLayersCount = copperLayers.length;

            const stack = await renderStack(layers, {
                sm: "green",
                cf: "gold",
                sp: false
            });

            const topSide = stack.top || stack.bottom;
            let widthVal = "";
            let heightVal = "";
            let unitVal: "mm" | "inches" = "mm";

            if (topSide) {
                let rawWidth = topSide.width;
                let rawHeight = topSide.height;
                const units = topSide.units;

                if (units === 'in') {
                    rawWidth = rawWidth * 25.4;
                    rawHeight = rawHeight * 25.4;
                }
                widthVal = rawWidth.toFixed(1);
                heightVal = rawHeight.toFixed(1);
                unitVal = "mm";
            }

            setFormData(prev => ({
                ...prev,
                layers: detectedLayersCount > 0 ? Math.max(2, detectedLayersCount).toString() : "2",
                width: widthVal || prev.width,
                height: heightVal || prev.height,
                unit: unitVal || prev.unit
            }));
        } catch (err) {
            console.error("Failed to extract layers:", err);
            alert("Failed to parse Gerber files.");
        }
    };

    const handleReset = () => {
        setUploadedFile(null);
        setClientLayers([]);
        setFormData(INITIAL_FORM_DATA);
        setSelectedDay(null);
    };

    const handleOrderSubmit = (day: number, unitPrice: string, orderValue: string) => {
        if (!formData.boardName) {
            alert('Please Enter Board Name');
            return;
        }
        if (!formData.userMobile) {
            alert('Please Enter Mobile Number');
            return;
        }
        if (!/^\d{10}$/.test(formData.userMobile)) {
            alert('Please enter a valid 10-digit mobile number.');
            return;
        }
        if (!formData.userEmail) {
            alert('Please Enter Email');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
            alert('Please enter a valid email address.');
            return;
        }

        const qty = parseInt(formData.qty, 10);
        if (isNaN(qty) || qty < 3) {
            alert('Minimum order quantity is 3');
            return;
        }

        const width = parseFloat(formData.width) || 0;
        const height = parseFloat(formData.height) || 0;
        if (width <= 0) {
            alert('Please Enter Length');
            return;
        }
        if (height <= 0) {
            alert('Please Enter Width');
            return;
        }

        const orderSummary = `
Order Submitted Successfully!
-----------------------------
Lead Time: ${day} Days
Unit Price: ₹${unitPrice}
Order Value: ₹${orderValue}
Board Name: ${formData.boardName}
Mobile: ${formData.userMobile}
Email: ${formData.userEmail}
Customer Name: ${formData.customerName || "N/A"}
GST Number: ${formData.gstNumber || "N/A"}
Billing Address: ${formData.billingAddress || "N/A"}
Shipping Address: ${formData.shippingAddress || "N/A"}
        `;
        alert(orderSummary);
        handleReset();
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-[1550px] mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 group">
                            <img src="/images/logo.png" alt="Megabyte Circuit Logo" className="h-18 w-auto object-contain" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main grid */}
            <main className="max-w-[1550px] mx-auto px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Left Quote Section */}
                    <div className="flex-1 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <h1 className="text-lg font-bold text-gray-900">Online PCB Quote</h1>
                            </div>

                            <GerberUploader
                                onUploadSuccess={handleUploadSuccess}
                                onReset={handleReset}
                                extraActions={
                                    uploadedFile && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTempOptions({ ...renderOptions });
                                                setIsConfigOpen(true);
                                            }}
                                            className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl shadow hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Settings className="w-3.5 h-3.5" /> Configuration Preview
                                        </button>
                                    )
                                }
                            />

                            {uploadedFile && clientLayers.length > 0 && (
                                <GerberStackupPreview
                                    topSvg={topSvg}
                                    bottomSvg={bottomSvg}
                                    loading={previewLoading}
                                />
                            )}

                            <QuoteForm
                                formData={formData}
                                setFormData={setFormData}
                                specsOpen={specsOpen}
                                setSpecsOpen={setSpecsOpen}
                                highSpecsOpen={highSpecsOpen}
                                setHighSpecsOpen={setHighSpecsOpen}
                                isUploaded={!!uploadedFile}
                                parsedFiles={[]}
                                topSvg={topSvg}
                                bottomSvg={bottomSvg}
                            />
                        </div>
                    </div>
                    {/* Right Quote Cost Summary */}
                    <div className="w-full lg:w-[420px] shrink-0">
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg sticky top-24 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h2 className="text-[16px] font-bold text-slate-800">Delivery Calendar</h2>
                                <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                                    INR (₹)
                                </span>
                            </div>

                            <div className="p-5 space-y-5 bg-white">
                                {/* Simple 10-Day Grid Calendar */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Estimated Delivery (Next 10 Days)
                                    </h3>
                                    {(() => {
                                        const { options, showContact } = getLeadTimePricing();

                                        if (showContact) {
                                            return (
                                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center shadow-sm">
                                                    <p className="text-xs font-bold text-red-800">
                                                        For larger orders, please contact us at:
                                                    </p>
                                                    <p className="text-sm font-extrabold text-red-900 mt-2">
                                                        <a href="tel:9898842942" className="hover:underline">9898842942</a> or <a href="tel:8160282840" className="hover:underline">8160282840</a>
                                                    </p>
                                                </div>
                                            );
                                        }

                                        const unitMultiplier = formData.unit === "inches" ? 25.4 : 1;
                                        const length = (parseFloat(formData.width) || 0) * unitMultiplier;
                                        const width = (parseFloat(formData.height) || 0) * unitMultiplier;
                                        const quantity = Math.max(parseInt(formData.qty, 10) || 3, 3);

                                        // Calculate default pricing values
                                        const defaultOrderValue = Math.max(Math.round(length * width * 0.05 * quantity), 100);
                                        const defaultUnitPrice = (defaultOrderValue / quantity).toFixed(2);

                                        // Generate tomorrow to +10 days
                                        const next10Days = Array.from({ length: 10 }, (_, i) => {
                                            const daysAhead = i + 1;
                                            const date = new Date();
                                            date.setDate(date.getDate() + daysAhead);

                                            // Map intermediate days to the higher price of the next shorter lead time
                                            let effectiveDay = daysAhead;
                                            if (daysAhead === 2) effectiveDay = 1;
                                            else if (daysAhead === 4) effectiveDay = 3;
                                            else if (daysAhead === 6) effectiveDay = 5;
                                            else if (daysAhead === 8 || daysAhead === 9) effectiveDay = 7;

                                            // Get price from computed options list
                                            const matchedOpt = options.find(o => o.day === effectiveDay);

                                            const orderValue = matchedOpt && parseFloat(matchedOpt.orderValue) > 0
                                                ? matchedOpt.orderValue
                                                : defaultOrderValue.toString();
                                            const unitPrice = matchedOpt && parseFloat(matchedOpt.unitPrice) > 0
                                                ? matchedOpt.unitPrice
                                                : defaultUnitPrice;

                                            const isLeadTimeOption = [1, 3, 5, 7, 10].includes(daysAhead);

                                            return {
                                                day: daysAhead,
                                                dateStr: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
                                                weekday: date.toLocaleDateString("en-IN", { weekday: "short" }),
                                                formattedDate: date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                                                orderValue,
                                                unitPrice,
                                                isLeadTimeOption
                                            };
                                        });

                                        const selectedDayData = next10Days.find(item => item.day === selectedDay);

                                        return (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-5 gap-2">
                                                    {next10Days.map(item => {
                                                        const isSelected = selectedDay === item.day;

                                                        return (
                                                            <div
                                                                key={item.day}
                                                                onClick={() => setSelectedDay(item.day)}
                                                                className={`p-2 border rounded-xl flex flex-col items-center justify-between text-center cursor-pointer transition-all ${isSelected
                                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                                    : "border-slate-200 bg-white hover:border-primary/50"
                                                                    }`}
                                                            >
                                                                <span className="text-[9px] font-black text-slate-400 uppercase leading-none">{item.weekday}</span>
                                                                <span className="text-xs font-black text-slate-800 my-1">{item.dateStr}</span>
                                                                <span className="text-[9px] font-black text-primary leading-none">₹{parseInt(item.orderValue)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Selection Banner inside the dynamic render scope */}
                                                {selectedDayData ? (
                                                    <div className="bg-[#fffbeb] border border-amber-200 rounded-xl p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
                                                        <div className="flex justify-between items-center text-xs font-bold text-amber-800">
                                                            <span>Delivery Option Selected:</span>
                                                            <span className="bg-amber-100 px-2 py-0.5 rounded text-[10px] font-black">{selectedDayData.formattedDate}</span>
                                                        </div>
                                                        <div className="flex justify-between items-baseline">
                                                            <span className="text-slate-500 text-xs font-semibold">Order Value:</span>
                                                            <span className="text-lg font-black text-amber-900">₹{selectedDayData.orderValue}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCheckoutData({
                                                                    day: selectedDayData.day,
                                                                    unitPrice: selectedDayData.unitPrice,
                                                                    orderValue: selectedDayData.orderValue,
                                                                    dateStr: selectedDayData.formattedDate
                                                                });
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="w-full h-10 bg-primary hover:bg-secondary text-white font-extrabold rounded-lg shadow-sm transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            Confirm and Submit Order
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-500 italic">
                                                        Please tap on any delivery card in the calendar grid above to select a delivery date.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Total Square Meter */}
                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500">
                                    <span>Total Square Meter:</span>
                                    <span className="text-sm font-extrabold text-slate-800">
                                        {(() => {
                                            const { totalAreaInSqM } = getLeadTimePricing();
                                            return totalAreaInSqM.toFixed(2);
                                        })()} m²
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#0f1729] text-gray-300 pt-16 pb-8 mt-12 border-t-4 border-primary">
                <div className="max-w-[1550px] mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
                        <div>
                            <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">PCB Service</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">FR-4 PCBs</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Flexible PCBs</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Advanced PCBs</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">PCB Assembly</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">SMT Stencil</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Support</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Shipping Guide</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Payment Options</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Company</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Quality Assurance</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Factory Tour</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Certifications</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                            </ul>
                        </div>
                        <div className="lg:col-span-3 flex flex-col items-start lg:items-end">
                            <div className="flex items-center gap-2 mb-6">
                                <img src="/images/logo.png" alt="Megabyte Circuit Logo" className="h-24 w-auto object-contain brightness-0 invert" />
                            </div>
                            <p className="text-sm leading-relaxed mb-2 max-w-sm lg:text-right text-gray-400">
                                India's trusted PCB manufacturing partner delivering precision-engineered boards for startups, engineers, and enterprises.
                            </p>
                            <p className="text-xs text-primary font-semibold italic mb-6 lg:text-right">
                                "From Imagination To Innovation"
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                        <div>© {new Date().getFullYear()} Megabyte Circuit. All Rights Reserved.</div>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
                            <a href="#" className="hover:text-white transition-colors">Cookies Policy</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Checkout details Modal Popup */}
            {isModalOpen && checkoutData && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-black text-slate-800">Complete Your Order</h2>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">Please provide delivery and contact details</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 hover:bg-slate-200/60 rounded-full transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-600">Board Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.boardName || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, boardName: e.target.value }))}
                                        placeholder="Enter Board Name"
                                        className="h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary font-semibold text-slate-800 transition-all focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-600">Mobile Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        value={formData.userMobile || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, userMobile: e.target.value }))}
                                        placeholder="10-digit Mobile Number"
                                        maxLength={10}
                                        className="h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary font-semibold text-slate-800 transition-all focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-600">Email Address <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    value={formData.userEmail || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
                                    placeholder="Enter Email Address"
                                    className="h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary font-semibold text-slate-850 transition-all focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-600">Customer Name</label>
                                    <input
                                        type="text"
                                        value={formData.customerName || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                                        placeholder="Enter Customer Name"
                                        className="h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary font-semibold text-slate-850 transition-all focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-600">GST Number</label>
                                    <input
                                        type="text"
                                        value={formData.gstNumber || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, gstNumber: e.target.value }))}
                                        placeholder="Enter GST Number"
                                        className="h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary font-semibold text-slate-850 transition-all focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-600">Billing Address</label>
                                <textarea
                                    rows={2}
                                    value={formData.billingAddress || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, billingAddress: e.target.value }))}
                                    placeholder="Enter Billing Address"
                                    className="p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary font-semibold text-slate-850 resize-none transition-all focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-600">Shipping Address</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, shippingAddress: prev.billingAddress }))}
                                        className="text-[10px] text-primary font-black hover:underline cursor-pointer"
                                    >
                                        Same as Billing Address
                                    </button>
                                </div>
                                <textarea
                                    rows={2}
                                    value={formData.shippingAddress || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                                    placeholder="Enter Shipping Address"
                                    className="p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary font-semibold text-slate-850 resize-none transition-all focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                            <div className="flex justify-between items-center bg-amber-50/60 border border-amber-100/50 rounded-xl p-3.5">
                                <div>
                                    <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wider">Estimated Delivery</span>
                                    <span className="text-sm font-black text-slate-800 mt-0.5 block">{checkoutData.dateStr}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Total Value</span>
                                    <span className="text-lg font-black text-primary block">₹{checkoutData.orderValue}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    handleOrderSubmit(checkoutData.day, checkoutData.unitPrice, checkoutData.orderValue);
                                    setIsModalOpen(false);
                                }}
                                className="w-full h-11 bg-primary hover:bg-secondary text-white font-extrabold rounded-xl shadow-md transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                Confirm and Place Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Configuration Modal Popup */}
            {isConfigOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Preview Configuration</h3>
                                <p className="text-[11px] font-medium text-slate-400 mt-0.5">Customize soldermask color and copper finishes</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsConfigOpen(false)}
                                className="p-1.5 hover:bg-slate-200/60 rounded-full transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            setRenderOptions({ ...tempOptions });
                            setIsConfigOpen(false);
                        }} className="p-6 space-y-5">
                            {/* Soldermask color */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">Solder Mask Color</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {Object.keys(COLORS).map((cName) => (
                                        <button
                                            key={cName}
                                            type="button"
                                            onClick={() => setTempOptions(prev => ({ ...prev, sm: cName as any }))}
                                            className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all capitalize cursor-pointer ${tempOptions.sm === cName
                                                    ? "border-slate-900 bg-slate-900 text-white"
                                                    : "border-slate-200 hover:border-slate-400 text-slate-700 bg-white"
                                                }`}
                                        >
                                            {cName}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Copper Finish */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">Surface Finish</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.keys(FINISHES).map((fName) => (
                                        <button
                                            key={fName}
                                            type="button"
                                            onClick={() => setTempOptions(prev => ({ ...prev, cf: fName as any }))}
                                            className={`py-2.5 px-4 text-xs font-bold rounded-xl border text-center transition-all capitalize cursor-pointer ${tempOptions.cf === fName
                                                    ? "border-slate-900 bg-slate-900 text-white"
                                                    : "border-slate-200 hover:border-slate-400 text-slate-700 bg-white"
                                                }`}
                                        >
                                            {fName === "gold" ? "Gold (ENIG)" : "HASL (Tin)"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Solder Paste toggle */}
                            <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                <span className="text-xs font-bold text-slate-600">Include Solder Paste Layers</span>
                                <button
                                    type="button"
                                    onClick={() => setTempOptions(prev => ({ ...prev, sp: !prev.sp }))}
                                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${tempOptions.sp ? "bg-slate-900 justify-end" : "bg-slate-200 justify-start"
                                        }`}
                                >
                                    <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                                </button>
                            </div>

                            {/* Submit */}
                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsConfigOpen(false)}
                                    className="flex-1 py-2.5 border border-slate-200 hover:border-slate-350 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                                >
                                    Apply Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
