"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { ShoppingCart, ChevronDown, ChevronUp, Cpu, Layers, Search, Menu, X, Settings, Loader2, Check, Upload } from "lucide-react";
import Link from "next/link";
import GerberUploader from "../GerberUploader";
import GerberStackupPreview from "../GerberStackupPreview";
import QuoteForm from "../QuoteForm";
import { GerberFile, QuoteFormData, UploadResponse } from "../../lib/gerber/types";
import { loadLayers, renderStack, type RenderOptions, COLORS, FINISHES } from "../../lib/gerber/clientRenderer";
import { type InputLayer } from "pcb-stackup";
import { submitOrder, OrderFormData } from "../../lib/api/orderService";
import Toast, { ToastType } from "../Toast";
import { saveCartToBackend } from "@/lib/cartSession";
import { useCurrency } from "../../context/CurrencyContext";

const INITIAL_FORM_DATA: QuoteFormData = {
    baseMaterial: "FR-4",
    layers: "2",
    width: "100",
    height: "100",
    unit: "mm",
    qty: "5",
    productType: "Industrial/Consumer electronics",
    differentDesign: "1",
    deliveryFormat: "Single PCB",
    thickness: "1.6mm",
    pcbColor: "#52c41a",
    silkscreen: "White",
    materialType: "FR4-TG135",
    surfaceFinish: "HASL(Leaded)",
    goldThickness: "1 U*",
    copperWeight: "1 oz",
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
    stencilType: "Frameless",
    stencilSide: "Top",
    stencilSize: "290x370mm",
    stencilThickness: "0.12mm",
    stencilFiducials: "Half Cut",
    electropolishing: "No",
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

function getPriceTiers(mask: string, weight: string, thickness: number, customTiers?: any) {
    const isThickness1_6 = Math.abs(thickness - 1.6) < 0.01;
    const thicknessKey = isThickness1_6 ? 1.6 : 'other';

    const defaultTiers: any = {
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

    const tiers = customTiers || defaultTiers;
    return tiers[mask]?.[weight]?.[thicknessKey] ?? tiers[mask]?.[weight]?.['other'] ?? tiers['Other']?.[weight]?.['other'] ?? null;
}

export default function PCBSpecification({ selectedProduct = "pcb", isLoggedIn = false }: { selectedProduct?: "pcb" | "stencil"; isLoggedIn?: boolean }) {
    const { formatPrice } = useCurrency();
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadedGerberFileId, setUploadedGerberFileId] = useState<number | null>(null);
    const [clientLayers, setClientLayers] = useState<InputLayer[]>([]);
    const [detectedInfo, setDetectedInfo] = useState<{ layers: string; width: string; height: string } | null>(null);

    const [formData, setFormData] = useState<QuoteFormData>(INITIAL_FORM_DATA);
    const [pricingConfig, setPricingConfig] = useState<{ fixedCosts: any; priceTiers: any } | null>(null);

    // Read URL search params for prefilling parameters passed from main site
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const updates: Partial<QuoteFormData> = {};

        if (params.get("layers")) updates.layers = params.get("layers")!;
        if (params.get("width") || params.get("boardWidth")) updates.width = params.get("width") || params.get("boardWidth")!;
        if (params.get("height") || params.get("boardHeight")) updates.height = params.get("height") || params.get("boardHeight")!;
        if (params.get("qty") || params.get("quantity")) updates.qty = params.get("qty") || params.get("quantity")!;
        if (params.get("thickness")) updates.thickness = params.get("thickness")!;
        if (params.get("copperWeight")) updates.copperWeight = params.get("copperWeight")!;
        if (params.get("surfaceFinish")) updates.surfaceFinish = params.get("surfaceFinish")!;

        const pcbTypeParam = params.get("pcbType") || params.get("baseMaterial");
        if (pcbTypeParam) {
            const lower = pcbTypeParam.toLowerCase();
            let matchedMaterial = "";
            if (lower.includes("flex")) {
                matchedMaterial = "Flex";
            } else if (lower.includes("roger")) {
                matchedMaterial = "Rogers";
            } else if (lower.includes("ptfe") || lower.includes("taflon") || lower.includes("teflon")) {
                matchedMaterial = "PTFE Teflon";
            } else if (lower.includes("rigid") || lower.includes("fr4") || lower.includes("standard")) {
                matchedMaterial = "FR-4";
            }
            if (matchedMaterial) {
                updates.baseMaterial = matchedMaterial;
                if (matchedMaterial === "Flex") {
                    updates.materialType = "Polyimide (PI)";
                    if (!params.get("thickness")) updates.thickness = "0.12mm";
                    if (!params.get("surfaceFinish")) updates.surfaceFinish = "ENIG";
                    if (!params.get("copperWeight")) updates.copperWeight = "0.5 oz";
                } else if (matchedMaterial === "Rogers") {
                    updates.materialType = "RO4350B(Dk=3.48,Df=0.0037)";
                } else if (matchedMaterial === "PTFE Teflon") {
                    updates.materialType = "ZYF300CA-P(Dk=3.0,Df=0.0016)";
                } else if (matchedMaterial === "FR-4") {
                    updates.materialType = "FR4-TG135";
                }
            }
        }

        if (Object.keys(updates).length > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
        }
    }, []);

    // Load dynamic PCB calculation parameters from backend API
    React.useEffect(() => {
        let active = true;
        async function fetchPricingConfig() {
            try {
                const res = await fetch("/api/pcb-pricing");
                const json = await res.json();
                if (active && json.success && json.data) {
                    setPricingConfig(json.data);
                }
            } catch (err) {
                console.error("Failed to load PCB pricing configuration from API:", err);
            }
        }
        fetchPricingConfig();
        return () => { active = false; };
    }, []);

    React.useEffect(() => {
        if (selectedProduct === "stencil") {
            setFormData(prev => ({ ...prev, stencilOn: true }));
        } else {
            setFormData(prev => ({ ...prev, stencilOn: false }));
        }
    }, [selectedProduct]);

    const [specsOpen, setSpecsOpen] = useState(true);
    const [highSpecsOpen, setHighSpecsOpen] = useState(true);

    // Charge Details & Build Time state
    const [isChargeDetailsOpen, setIsChargeDetailsOpen] = useState(true);
    const [selectedBuildTime, setSelectedBuildTime] = useState<"3days" | "24hours" | "24hours_pcba">("3days");
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [shippingOptionKey, setShippingOptionKey] = useState<string>("gujarat_road");
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
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingCart, setIsSavingCart] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Sync Gerber preview soldermask color and surface finish with form selections
    React.useEffect(() => {
        const hexToMask: Record<string, RenderOptions["sm"]> = {
            "#52c41a": "green",
            "#722ed1": "purple",
            "#f5222d": "red",
            "#fadb14": "yellow",
            "#1677ff": "blue",
            "#ffffff": "white",
            "#000000": "black"
        };
        const targetSm = hexToMask[formData.pcbColor] || "green";
        const targetCf: RenderOptions["cf"] = formData.surfaceFinish === "ENIG" ? "gold" : "tin";

        setRenderOptions(prev => {
            if (prev.sm === targetSm && prev.cf === targetCf) return prev;
            return { ...prev, sm: targetSm, cf: targetCf };
        });
    }, [formData.pcbColor, formData.surfaceFinish]);

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

    // Sync generated preview SVG with backend gerber_files record
    React.useEffect(() => {
        const previewSvg = topSvg || bottomSvg;
        if (uploadedGerberFileId && previewSvg) {
            fetch("/api/upload/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gerber_file_id: uploadedGerberFileId,
                    preview_data: previewSvg
                })
            }).catch(err => console.error("Failed to sync gerber preview data:", err));
        }
    }, [uploadedGerberFileId, topSvg, bottomSvg]);

    // Dynamic lead time-based pricing calculation
    const getLeadTimePricing = () => {
        const layers = parseInt(formData.layers, 10) || 1;
        const unitMultiplier = formData.unit === "inches" ? 25.4 : 1;
        const length = (parseFloat(formData.width) || 0) * unitMultiplier;
        const width = (parseFloat(formData.height) || 0) * unitMultiplier;
        const quantity = Math.max(parseInt(formData.qty, 10) || 3, 3);
        const solderMask = formData.pcbColor === "#52c41a" ? "Green" : "Other";
        const copperWeight = formData.copperWeight.replace(" ", "");
        const rawThicknessStr = (formData.thickness || "1.6").toString().replace(/[^0-9.]/g, "");
        const thickness = parseFloat(rawThicknessStr) || 1.6;

        if (length <= 0 || width <= 0 || quantity <= 0) {
            return { options: [], showContact: false, totalAreaInSqM: 0 };
        }

        const areaPerBoard = (length * width) / 1000000;
        const totalAreaInSqM = areaPerBoard * quantity;
        const areaInSqCm = totalAreaInSqM * 10000;

        const fixedCosts: Record<string, Record<number, number>> = pricingConfig?.fixedCosts || {
            '1': { 1: 3100, 3: 2100, 5: 1600, 7: 1500, 10: 1400, 20: 1000 },
            '2': { 1: 8100, 3: 4100, 5: 2600, 7: 2200, 10: 1900, 20: 1400 },
            '4': { 20: 6000 },
            '6': { 20: 7000 },
            '8': { 20: 8000 },
            '10': { 20: 9000 }
        };

        const priceTiers = getPriceTiers(solderMask, copperWeight, thickness, pricingConfig?.priceTiers);
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
            let costPerSqCm = applicablePrices[idx];
            if (day === 20) {
                costPerSqCm = (layers >= 4 && layers <= 10)
                    ? applicablePrices[0]
                    : (applicablePrices[4] ?? applicablePrices[0]) * 0.85;
            }

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
        if (res?.gerber_file_id) {
            setUploadedGerberFileId(res.gerber_file_id);
        }
        try {
            let fileToExtract = file;
            if (file.name.toLowerCase().endsWith('.rar') && res?.zip_url) {
                console.log(`[GerberExtraction] Backend returned zip_url: ${res.zip_url}. Fetching converted ZIP archive...`);
                try {
                    let zipFetchUrl = res.zip_url;
                    if (zipFetchUrl.includes('/storage/')) {
                        const pathPart = zipFetchUrl.split('/storage/')[1];
                        zipFetchUrl = `/storage/${pathPart}`;
                    }
                    const zipRes = await fetch(zipFetchUrl);
                    if (zipRes.ok) {
                        const zipBlob = await zipRes.blob();
                        fileToExtract = new File([zipBlob], file.name.replace(/\.rar$/i, '.zip'), { type: 'application/zip' });
                        console.log(`[GerberExtraction] Converted ZIP fetched successfully!`);
                    } else {
                        console.warn(`[GerberExtraction Warning] Converted ZIP fetch failed with HTTP ${zipRes.status} at ${zipFetchUrl}`);
                    }
                } catch (e) {
                    console.warn("[GerberExtraction Warning] Exception fetching converted ZIP from backend:", e);
                }
            }

            const layers = await loadLayers(fileToExtract);
            setClientLayers(layers);

            const copperLayers = layers.filter(l => l.type === 'copper');
            const detectedLayersCount = copperLayers.length;

            if (detectedLayersCount === 0) {
                if (res?.gerber_file_id) {
                    fetch("/api/upload/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ gerber_file_id: res.gerber_file_id })
                    }).catch(err => console.error("Failed to delete 0-layer Gerber file:", err));
                    setUploadedGerberFileId(null);
                }
                setDetectedInfo({
                    layers: "0",
                    width: "0.00",
                    height: "0.00"
                });
                return;
            }

            const stack = await renderStack(layers, renderOptions);

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
                widthVal = rawWidth.toFixed(2);
                heightVal = rawHeight.toFixed(2);
                unitVal = "mm";
            }

            let detectedLayersStr = "0";
            if (detectedLayersCount === 1) {
                detectedLayersStr = "1";
            } else if (detectedLayersCount > 1) {
                const evenCount = detectedLayersCount % 2 !== 0 ? detectedLayersCount + 1 : detectedLayersCount;
                detectedLayersStr = Math.min(16, evenCount).toString();
            }

            setDetectedInfo({
                layers: detectedLayersStr,
                width: widthVal || formData.width,
                height: heightVal || formData.height
            });

            setFormData(prev => ({
                ...prev,
                layers: detectedLayersStr,
                width: widthVal || prev.width,
                height: heightVal || prev.height,
                unit: unitVal || prev.unit
            }));
        } catch (err) {
            console.error("Failed to extract layers:", err);
            if (res?.gerber_file_id) {
                fetch("/api/upload/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ gerber_file_id: res.gerber_file_id })
                }).catch(err => console.error("Failed to delete invalid Gerber file:", err));
                setUploadedGerberFileId(null);
            }
            setDetectedInfo({
                layers: "0",
                width: "0.00",
                height: "0.00"
            });
        }
    };

    const handleReset = () => {
        setUploadedFile(null);
        setUploadedGerberFileId(null);
        setClientLayers([]);
        setDetectedInfo(null);
        setFormData(INITIAL_FORM_DATA);
        setSelectedDay(null);
    };

    const handleOrderSubmit = async (day: number, unitPrice: string, orderValue: string) => {
        if (!formData.boardName) {
            setToast({ message: 'Please Enter Board Name', type: 'warning' });
            return;
        }
        if (!formData.userMobile) {
            setToast({ message: 'Please Enter Mobile Number', type: 'warning' });
            return;
        }
        if (!/^\d{10}$/.test(formData.userMobile)) {
            setToast({ message: 'Please enter a valid 10-digit mobile number.', type: 'warning' });
            return;
        }
        if (!formData.userEmail) {
            setToast({ message: 'Please Enter Email', type: 'warning' });
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
            setToast({ message: 'Please enter a valid email address.', type: 'warning' });
            return;
        }

        const qty = parseInt(formData.qty, 10);
        if (isNaN(qty) || qty < 3) {
            setToast({ message: 'Minimum order quantity is 3', type: 'warning' });
            return;
        }

        const width = parseFloat(formData.width) || 0;
        const height = parseFloat(formData.height) || 0;
        if (width <= 0) {
            setToast({ message: 'Please Enter Length', type: 'warning' });
            return;
        }
        if (height <= 0) {
            setToast({ message: 'Please Enter Width', type: 'warning' });
            return;
        }

        // Calculate delivery date
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + day);

        // Calculate total area in sqm
        const unitMultiplier = formData.unit === "inches" ? 25.4 : 1;
        const length = width * unitMultiplier;
        const widthMm = height * unitMultiplier;
        const areaPerBoard = (length * widthMm) / 1000000;
        const totalAreaInSqM = areaPerBoard * qty;

        // Prepare order data
        const orderData: OrderFormData = {
            // Basic PCB Specifications
            base_material: formData.baseMaterial,
            layers: formData.layers,
            width: formData.width,
            height: formData.height,
            unit: formData.unit,
            qty: formData.qty,
            product_type: formData.productType,
            different_design: formData.differentDesign,
            delivery_format: formData.deliveryFormat || "Single PCB",

            // PCB Specifications
            thickness: formData.thickness,
            pcb_color: formData.pcbColor,
            silkscreen: formData.silkscreen,
            material_type: formData.materialType,
            surface_finish: formData.surfaceFinish,

            // High-spec Options
            copper_weight: formData.copperWeight,
            via_covering: formData.viaCovering,
            via_plating: formData.viaPlating,
            min_hole: formData.minHole,
            tolerance: formData.tolerance,
            confirm_file: formData.confirmFile,
            mark_on_pcb: formData.markOnPcb,
            elec_test: formData.elecTest,
            gold_fingers: formData.goldFingers,
            castellated: formData.castellated,
            edge_plating: formData.edgePlating,
            blind_slots: formData.blindSlots,
            ul_marking: formData.ulMarking,
            humidity: formData.humidity,

            // Advanced Options
            kelvin_test: formData.kelvinTest,
            paper_between: formData.paperBetween,
            appearance_quality: formData.appearanceQuality,
            silkscreen_tech: formData.silkscreenTech,
            inspection_report: formData.inspectionReport,
            pcb_remark: formData.pcbRemark,

            // Additional Options
            assembly_on: formData.assemblyOn,
            stencil_on: formData.stencilOn,
            build_time: formData.buildTime,

            // Customer Information
            board_name: formData.boardName,
            user_mobile: formData.userMobile,
            user_email: formData.userEmail,
            gst_number: formData.gstNumber,
            customer_name: formData.customerName,
            billing_address: formData.billingAddress,
            shipping_address: formData.shippingAddress,

            // Pricing Information
            lead_time_days: day,
            unit_price: unitPrice,
            order_value: orderValue,
            delivery_date: deliveryDate.toISOString().split('T')[0],
            total_area_sqm: totalAreaInSqM,

            // File Upload
            gerber_file: uploadedFile || undefined,
        };

        // Submit to backend
        setIsSubmitting(true);
        const response = await submitOrder(orderData);
        setIsSubmitting(false);

        if (response.success) {
            setToast({ message: 'Order submitted successfully!', type: 'success' });

            // Save order data to localStorage for thank you page
            const formattedDeliveryDate = response.data?.delivery_date || deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const orderDataForThankYou = {
                order_id: response.data?.order_id,
                order_number: response.data?.order_number,
                status: response.data?.status || 'Submitted',
                total_value: response.data?.total_value || orderValue,
                delivery_date: formattedDeliveryDate,
                board_name: formData.boardName,
                user_email: formData.userEmail,
                user_mobile: formData.userMobile,
            };
            localStorage.setItem('lastOrder', JSON.stringify(orderDataForThankYou));

            // Redirect to thank you page without reload
            setTimeout(() => {
                router.push('/thank-you');
            }, 1000);
        } else {
            setToast({ message: response.message || 'Failed to submit order', type: 'error' });
            if (response.errors) {
                console.error('Validation errors:', response.errors);
            }
        }
    };

    const getCalculatedOrderPrice = (targetDay: number | null): number => {
        if (!targetDay) return 0;

        const { options } = getLeadTimePricing();
        const unitMultiplier = formData.unit === "inches" ? 25.4 : 1;
        const length = (parseFloat(formData.width) || 0) * unitMultiplier;
        const width = (parseFloat(formData.height) || 0) * unitMultiplier;
        const quantity = Math.max(parseInt(formData.qty, 10) || 3, 3);
        const layers = parseInt(formData.layers, 10) || 1;

        const defaultOrderValue = Math.max(Math.round(length * width * 0.05 * quantity), 100);
        const getOption = (dayNum: number) => options.find(o => o.day === dayNum && o.visible);

        const daysAhead = targetDay;
        let matchedOrderValue = defaultOrderValue;

        if (layers >= 4 && layers <= 10) {
            const opt20 = getOption(20);
            if (opt20) {
                matchedOrderValue = parseFloat(opt20.orderValue);
            }
        } else {
            const interpolate = (d1: number, d2: number, ratio: number = 0.5) => {
                const o1 = getOption(d1);
                const o2 = getOption(d2);
                if (o1 && o2) {
                    const val1 = parseFloat(o1.orderValue);
                    const val2 = parseFloat(o2.orderValue);
                    return val1 + (val2 - val1) * ratio;
                } else if (o2) {
                    return parseFloat(o2.orderValue);
                } else if (o1) {
                    return parseFloat(o1.orderValue);
                }
                return null;
            };

            if (daysAhead === 1) {
                const o = getOption(1);
                if (o) matchedOrderValue = parseFloat(o.orderValue);
            } else if (daysAhead === 2) {
                const res = interpolate(1, 3, 0.5);
                if (res !== null) matchedOrderValue = res;
            } else if (daysAhead === 3) {
                const o = getOption(3);
                if (o) matchedOrderValue = parseFloat(o.orderValue);
            } else if (daysAhead === 4) {
                const res = interpolate(3, 5, 0.5);
                if (res !== null) matchedOrderValue = res;
            } else if (daysAhead === 5) {
                const o = getOption(5);
                if (o) matchedOrderValue = parseFloat(o.orderValue);
            } else if (daysAhead === 6) {
                const res = interpolate(5, 7, 0.5);
                if (res !== null) matchedOrderValue = res;
            } else if (daysAhead === 7) {
                const o = getOption(7);
                if (o) matchedOrderValue = parseFloat(o.orderValue);
            } else if (daysAhead === 8) {
                const res = interpolate(7, 10, 1 / 3);
                if (res !== null) matchedOrderValue = res;
            } else if (daysAhead === 9) {
                const res = interpolate(7, 10, 2 / 3);
                if (res !== null) matchedOrderValue = res;
            } else if (daysAhead >= 10 && daysAhead <= 20) {
                const ratio = (daysAhead - 10) / 10;
                const res = interpolate(10, 20, ratio);
                if (res !== null) matchedOrderValue = res;
            }
        }

        return Math.round(matchedOrderValue);
    };

    const handleSaveToCart = async () => {
        setIsSavingCart(true);
        try {
            const savedCart = localStorage.getItem("megabyte_cart");
            const existingCart = savedCart ? JSON.parse(savedCart) : [];
            const calculatedPrice = getCalculatedOrderPrice(selectedDay);

            const hexToColorName: Record<string, string> = {
                "#52c41a": "Green",
                "#722ed1": "Purple",
                "#f5222d": "Red",
                "#fadb14": "Yellow",
                "#1677ff": "Blue",
                "#ffffff": "White",
                "#000000": "Black"
            };

            const pcbColorName = hexToColorName[formData.pcbColor] || "Green";
            const gerberName = uploadedFile
                ? (typeof uploadedFile === 'string' ? uploadedFile : (uploadedFile.name || (uploadedFile as any).filename || "Gerber_Board.zip"))
                : (formData.boardName || "Gerber_Board.zip");
            const previewSvg = topSvg || bottomSvg || "";
            const generatedBoardId = "Y2-" + Math.floor(10000000 + Math.random() * 90000000);

            const newItem = {
                id: 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                productType: selectedProduct || "pcb",
                boardName: formData.boardName || gerberName,
                gerberFileName: gerberName,
                gerber_file_id: uploadedGerberFileId || undefined,
                gerberPreview: previewSvg,
                boardId: generatedBoardId,
                pcbColor: pcbColorName,
                layers: `${formData.layers || '2'} Layer${(Number(formData.layers) || 2) > 1 ? 's' : ''}`,
                dimensions: `${formData.width || 100}x${formData.height || 100}mm`,
                qty: Number(formData.qty) || 5,
                buildTime: `${selectedDay || 3} days`,
                price: Number(calculatedPrice) || 100,
                material: formData.baseMaterial || "FR-4",
                materialType: formData.materialType || (formData.baseMaterial === "Flex" ? "Polyimide (PI)" : formData.baseMaterial === "Rogers" ? "RO4350B(Dk=3.48,Df=0.0037)" : formData.baseMaterial === "PTFE Teflon" ? "ZYF300CA-P(Dk=3.0,Df=0.0016)" : "FR4-TG135"),
                thickness: `${formData.thickness || (formData.baseMaterial === "Flex" ? '0.12mm' : '1.6mm')}`,
                surfaceFinish: formData.surfaceFinish || (formData.baseMaterial === "Flex" ? "ENIG" : "HASL(Leaded)"),
                copperWeight: formData.copperWeight || (formData.baseMaterial === "Flex" ? "0.5 oz" : "1 oz"),
                ...(formData.substrateType ? { substrateType: formData.substrateType } : {}),
                ...(formData.coverlayColor ? { coverlayColor: formData.coverlayColor } : {}),
                ...(formData.coverlayThickness ? { coverlayThickness: formData.coverlayThickness } : {}),
                ...(formData.copperType ? { copperType: formData.copperType } : {}),
                ...(formData.stiffener ? { stiffener: formData.stiffener } : {}),
                ...(formData.emiShielding ? { emiShielding: formData.emiShielding } : {}),
                ...(formData.cuttingMethod ? { cuttingMethod: formData.cuttingMethod } : {}),
                ...(formData.edaSoftware ? { edaSoftware: formData.edaSoftware } : {}),
                ...(formData.silkscreenOnStiffener ? { silkscreenOnStiffener: formData.silkscreenOnStiffener } : {}),
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };
            const updatedCart = [...existingCart, newItem];
            await saveCartToBackend(updatedCart);
            setToast({ message: "Item saved to cart!", type: "success" });
            window.location.href = "/cart";
        } catch (e) {
            console.error("Failed to save item to cart", e);
        } finally {
            setIsSavingCart(false);
        }
    };

    return (
        <div className="bg-[#f0f2f5] dark:bg-transparent font-sans">
            {/* Main grid */}
            <main className={isLoggedIn ? "w-full py-2" : "max-w-[1550px] mx-auto px-4 py-6"}>
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* Left Quote Section */}
                    <div className="flex-1 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg p-6 space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <h1 className="text-lg font-bold text-gray-900">
                                    {selectedProduct === "stencil" ? "Online SMT Stencil Quote" : "Online PCB Quote"}
                                </h1>

                                {uploadedFile ? (
                                    <div className="flex items-center gap-5 text-sm font-semibold text-gray-600">
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                                        >
                                            <Upload className="w-4 h-4 text-gray-500" /> Re-Upload
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-5 text-xs sm:text-sm font-medium text-gray-600">
                                    </div>
                                )}
                            </div>

                            {!uploadedFile ? (
                                <GerberUploader
                                    onUploadSuccess={handleUploadSuccess}
                                    onReset={handleReset}
                                />
                            ) : (detectedInfo?.layers === "0" || (!topSvg && !bottomSvg && !previewLoading)) ? (
                                <div className="p-5 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-center space-y-1 shadow-2xs">
                                    <p className="text-sm font-extrabold text-amber-900">
                                        {detectedInfo?.layers === "0" ? "Detected 0 layers board." : "No preview detected."}
                                    </p>
                                    <p className="text-xs font-bold text-amber-700">Please reupload Gerber file.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-[#f0f4f8] rounded-2xl p-6 sm:p-8 flex items-center justify-center border border-gray-100">
                                        <GerberStackupPreview
                                            topSvg={topSvg}
                                            bottomSvg={bottomSvg}
                                            loading={previewLoading}
                                        />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">
                                        Detected {detectedInfo?.layers ?? formData.layers} layer board of {detectedInfo?.width || formData.width}×{detectedInfo?.height || formData.height}mm({((parseFloat(detectedInfo?.width || formData.width) || 0) / 25.4).toFixed(2)}×{((parseFloat(detectedInfo?.height || formData.height) || 0) / 25.4).toFixed(2)} inches).
                                    </p>
                                </div>
                            )}

                            <QuoteForm
                                formData={formData}
                                setFormData={setFormData}
                                specsOpen={specsOpen}
                                setSpecsOpen={setSpecsOpen}
                                highSpecsOpen={highSpecsOpen}
                                setHighSpecsOpen={setHighSpecsOpen}
                                isUploaded={!!uploadedFile && detectedInfo?.layers !== "0"}
                                parsedFiles={[]}
                                topSvg={topSvg}
                                bottomSvg={bottomSvg}
                            />
                        </div>
                    </div>
                    {/* Right Quote Cost Summary */}
                    <div className="w-full lg:w-[480px] shrink-0 sticky top-24">
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg overflow-hidden">
                            <div className="p-5 space-y-4 bg-white">                                 {/* Sticky Notes Board Delivery Calendar */}
                                {(() => {
                                    const { options, showContact, totalAreaInSqM = 0 } = getLeadTimePricing();

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
                                    const layers = parseInt(formData.layers, 10) || 1;

                                    const defaultOrderValue = Math.max(Math.round(length * width * 0.05 * quantity), 100);
                                    const defaultUnitPrice = (defaultOrderValue / quantity).toFixed(2);

                                    // Generate 20 days with interpolated/averaged pricing for intermediate days
                                    const getOption = (dayNum: number) => options.find(o => o.day === dayNum && o.visible);

                                    const next20Days = Array.from({ length: 20 }, (_, i) => {
                                        const daysAhead = i + 1;
                                        const date = new Date();
                                        date.setDate(date.getDate() + daysAhead);

                                        let matchedOrderValue = defaultOrderValue;
                                        let matchedUnitPrice = parseFloat(defaultUnitPrice);
                                        let visible = false;

                                        if (layers >= 4 && layers <= 10) {
                                            const opt20 = getOption(20);
                                            if (opt20) {
                                                matchedOrderValue = parseFloat(opt20.orderValue);
                                                matchedUnitPrice = parseFloat(opt20.unitPrice);
                                                visible = true;
                                            }
                                        } else {
                                            const interpolate = (d1: number, d2: number, ratio: number = 0.5) => {
                                                const o1 = getOption(d1);
                                                const o2 = getOption(d2);
                                                if (o1 && o2) {
                                                    const val1 = parseFloat(o1.orderValue);
                                                    const val2 = parseFloat(o2.orderValue);
                                                    const u1 = parseFloat(o1.unitPrice);
                                                    const u2 = parseFloat(o2.unitPrice);
                                                    return {
                                                        orderValue: val1 + (val2 - val1) * ratio,
                                                        unitPrice: u1 + (u2 - u1) * ratio,
                                                        visible: true
                                                    };
                                                } else if (o2) {
                                                    return { orderValue: parseFloat(o2.orderValue), unitPrice: parseFloat(o2.unitPrice), visible: true };
                                                } else if (o1) {
                                                    return { orderValue: parseFloat(o1.orderValue), unitPrice: parseFloat(o1.unitPrice), visible: true };
                                                }
                                                return null;
                                            };

                                            if (daysAhead === 1) {
                                                const o = getOption(1);
                                                if (o) { matchedOrderValue = parseFloat(o.orderValue); matchedUnitPrice = parseFloat(o.unitPrice); visible = true; }
                                            } else if (daysAhead === 2) {
                                                const res = interpolate(1, 3, 0.5); // Average of day 1 & day 3
                                                if (res) { matchedOrderValue = res.orderValue; matchedUnitPrice = res.unitPrice; visible = res.visible; }
                                            } else if (daysAhead === 3) {
                                                const o = getOption(3);
                                                if (o) { matchedOrderValue = parseFloat(o.orderValue); matchedUnitPrice = parseFloat(o.unitPrice); visible = true; }
                                            } else if (daysAhead === 4) {
                                                const res = interpolate(3, 5, 0.5); // Average of day 3 & day 5
                                                if (res) { matchedOrderValue = res.orderValue; matchedUnitPrice = res.unitPrice; visible = res.visible; }
                                            } else if (daysAhead === 5) {
                                                const o = getOption(5);
                                                if (o) { matchedOrderValue = parseFloat(o.orderValue); matchedUnitPrice = parseFloat(o.unitPrice); visible = true; }
                                            } else if (daysAhead === 6) {
                                                const res = interpolate(5, 7, 0.5); // Average of day 5 & day 7
                                                if (res) { matchedOrderValue = res.orderValue; matchedUnitPrice = res.unitPrice; visible = res.visible; }
                                            } else if (daysAhead === 7) {
                                                const o = getOption(7);
                                                if (o) { matchedOrderValue = parseFloat(o.orderValue); matchedUnitPrice = parseFloat(o.unitPrice); visible = true; }
                                            } else if (daysAhead === 8) {
                                                const res = interpolate(7, 10, 1 / 3); // Step 1 between 7 and 10
                                                if (res) { matchedOrderValue = res.orderValue; matchedUnitPrice = res.unitPrice; visible = res.visible; }
                                            } else if (daysAhead === 9) {
                                                const res = interpolate(7, 10, 2 / 3); // Step 2 between 7 and 10
                                                if (res) { matchedOrderValue = res.orderValue; matchedUnitPrice = res.unitPrice; visible = res.visible; }
                                            } else if (daysAhead >= 10 && daysAhead <= 20) {
                                                const ratio = (daysAhead - 10) / 10;
                                                const res = interpolate(10, 20, ratio);
                                                if (res) { matchedOrderValue = res.orderValue; matchedUnitPrice = res.unitPrice; visible = res.visible; }
                                            }
                                        }

                                        return {
                                            day: daysAhead,
                                            dateNum: date.getDate(),
                                            monthStr: date.toLocaleDateString("en-IN", { month: "short" }),
                                            fullMonthYear: date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
                                            weekday: date.toLocaleDateString("en-IN", { weekday: "short" }),
                                            formattedDate: date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                                            orderValue: matchedOrderValue.toFixed(2),
                                            unitPrice: matchedUnitPrice.toFixed(2),
                                            visible
                                        };
                                    });

                                    const uniqueMonths = Array.from(new Set(next20Days.map(item => item.fullMonthYear)));
                                    const calendarHeaderTitle = uniqueMonths.length > 1
                                        ? `${uniqueMonths[0]} - ${uniqueMonths[uniqueMonths.length - 1]}`
                                        : uniqueMonths[0] || new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

                                    const selectedDayData = next20Days.find(item => item.day === selectedDay);
                                    const hasValidGerber = !!uploadedFile && detectedInfo?.layers !== "0" && (!!topSvg || !!bottomSvg || previewLoading);

                                    return (
                                        <div className="space-y-4">
                                            <div className="bg-[#8DD3A5]/15 dark:bg-[#0F7438]/20 p-4 rounded-2xl border border-[#41A96A]/30 shadow-inner relative overflow-hidden">
                                                {/* Subtle brand theme grid texture background */}
                                                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#41A96A_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />

                                                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[#41A96A]/20 dark:border-[#69C48A]/30 relative z-10">
                                                    <div>
                                                        <h3 className="text-xs font-black text-[#0F7438] dark:text-[#8DD3A5] uppercase tracking-wider flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-[#238E4E] inline-block ring-2 ring-[#8DD3A5]/50" />
                                                            Select Delivery Date
                                                        </h3>
                                                        <p className="text-[10px] text-[#238E4E] dark:text-[#69C48A] font-semibold">
                                                            Prices are per order
                                                        </p>
                                                    </div>
                                                    <div className="bg-white dark:bg-[#0F7438]/80 text-[#0F7438] dark:text-[#8DD3A5] px-2.5 py-1 rounded-md text-xs font-black shadow-sm border border-[#69C48A]/60 dark:border-[#41A96A]/60 flex items-center gap-1">
                                                        <span>{calendarHeaderTitle}</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-5 gap-3 relative z-10">
                                                    {next20Days.map((item, idx) => {
                                                        const isSelected = selectedDay === item.day;
                                                        // Palette based sticky note colors using hex codes: #0F7438, #238E4E, #41A96A, #69C48A, #8DD3A5
                                                        const stickyColors = [
                                                            { bg: "bg-[#8DD3A5]/20", border: "border-[#8DD3A5]", text: "text-[#0F7438]", subtext: "text-[#238E4E]", pin: "bg-[#0F7438]", activeBg: "bg-[#8DD3A5]/50" },
                                                            { bg: "bg-[#69C48A]/20", border: "border-[#69C48A]", text: "text-[#0F7438]", subtext: "text-[#238E4E]", pin: "bg-[#238E4E]", activeBg: "bg-[#69C48A]/50" },
                                                            { bg: "bg-[#41A96A]/15", border: "border-[#41A96A]/60", text: "text-[#0F7438]", subtext: "text-[#238E4E]", pin: "bg-[#41A96A]", activeBg: "bg-[#41A96A]/40" },
                                                            { bg: "bg-[#8DD3A5]/30", border: "border-[#69C48A]", text: "text-[#0F7438]", subtext: "text-[#238E4E]", pin: "bg-[#238E4E]", activeBg: "bg-[#8DD3A5]/60" },
                                                            { bg: "bg-[#69C48A]/15", border: "border-[#8DD3A5]/80", text: "text-[#0F7438]", subtext: "text-[#238E4E]", pin: "bg-[#0F7438]", activeBg: "bg-[#69C48A]/40" },
                                                        ];
                                                        const color = stickyColors[idx % stickyColors.length];

                                                        // Slight natural rotations
                                                        const rotations = ["rotate-[-1.5deg]", "rotate-[1deg]", "rotate-[-0.5deg]", "rotate-[2deg]", "rotate-[-1deg]"];
                                                        const rotation = rotations[idx % rotations.length];

                                                        return (
                                                            <div
                                                                key={item.day}
                                                                onClick={() => setSelectedDay(item.day)}
                                                                className={`relative flex flex-col items-center justify-between p-1.5 rounded-sm transition-all duration-200 cursor-pointer select-none aspect-square shadow-sm ${rotation} ${isSelected
                                                                        ? `${color.activeBg} ring-2 ring-[#238E4E] border-2 border-[#0F7438] scale-[1.08] z-20 shadow-md rotate-0`
                                                                        : `${color.bg} border ${color.border} hover:scale-[1.04] hover:rotate-0 hover:z-10 hover:shadow-md`
                                                                    }`}
                                                            >
                                                                {/* Push Pin */}
                                                                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20">
                                                                    <div className={`w-2.5 h-2.5 rounded-full ${color.pin} border border-white/80 shadow-xs`} />
                                                                </div>

                                                                <span className="text-[8px] font-black uppercase text-[#0F7438]/70 dark:text-[#8DD3A5]/70 leading-none mt-1">{item.weekday}</span>
                                                                <span className={`text-xs font-black my-0.5 leading-tight ${color.text}`}>{item.dateNum}</span>
                                                                <span className={`text-[9px] font-extrabold ${color.subtext} leading-none pb-0.5`}>
                                                                    {formatPrice(item.orderValue)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Shipping Options & Total Calculation */}
                                            {(() => {
                                                // Estimate PCB weight in KG (standard 1.6mm FR4 PCB ~ 3.8kg per sq meter)
                                                const thicknessMm = parseFloat((formData.thickness || "1.6").toString().replace(/[^0-9.]/g, "")) || 1.6;
                                                const weightPerSqM = 3.8 * (thicknessMm / 1.6);
                                                const estimatedWeightKg = Math.max(0.1, parseFloat((totalAreaInSqM * weightPerSqM).toFixed(2)));

                                                const shippingOptions = [
                                                    { key: "gujarat_road", location: "In Gujarat", method: "By Road", rate: 40 },
                                                    { key: "out_road", location: "Out of Gujarat", method: "By Road", rate: 80 },
                                                    { key: "out_air", location: "Out of Gujarat", method: "By Air", rate: 150 },
                                                    { key: "out_fastrack", location: "Out of Gujarat", method: "Fastrack", rate: 450 },
                                                ];

                                                const activeShipping = shippingOptions.find(o => o.key === shippingOptionKey) || shippingOptions[0];
                                                const shippingCharge = Math.round(activeShipping.rate * estimatedWeightKg);

                                                const pcbPrice = selectedDayData ? parseFloat(selectedDayData.orderValue) : 0;
                                                const mainTotal = pcbPrice > 0 ? pcbPrice + shippingCharge : 0;

                                                return (
                                                    <div className="bg-[#8DD3A5]/10 border border-[#41A96A]/30 rounded-xl p-3.5 shadow-2xs space-y-3">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-600 dark:text-slate-300 font-semibold">Total Area:</span>
                                                            <span className="font-extrabold text-[#0F7438] dark:text-[#8DD3A5]">
                                                                {totalAreaInSqM.toFixed(2)} m² <span className="text-[10px] font-normal text-slate-500">({estimatedWeightKg} kg est.)</span>
                                                            </span>
                                                        </div>

                                                        {/* Shipping Option Selection */}
                                                        <div className="pt-2 border-t border-[#41A96A]/20 space-y-1.5">
                                                            <div className="flex justify-between items-center text-xs font-bold text-[#0F7438] dark:text-[#8DD3A5]">
                                                                <span>Shipping Option:</span>
                                                                <span className="text-[10px] font-medium text-slate-500">Select delivery method</span>
                                                            </div>
                                                            <select
                                                                value={shippingOptionKey}
                                                                onChange={(e) => setShippingOptionKey(e.target.value)}
                                                                className="w-full bg-white dark:bg-slate-800 border border-[#41A96A]/40 rounded-lg p-2 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-2xs focus:ring-2 focus:ring-[#238E4E] focus:outline-none"
                                                            >
                                                                {shippingOptions.map(opt => {
                                                                    const charge = Math.round(opt.rate * estimatedWeightKg);
                                                                    return (
                                                                        <option key={opt.key} value={opt.key}>
                                                                            {opt.location} - {opt.method} (₹{opt.rate}/kg) → +₹{charge}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                            <div className="flex justify-between items-center text-xs pt-1">
                                                                <span className="text-slate-600 dark:text-slate-300 font-medium">Shipping Charge:</span>
                                                                <span className="font-bold text-slate-800 dark:text-slate-200">₹{shippingCharge.toLocaleString('en-IN')}</span>
                                                            </div>
                                                        </div>

                                                        {/* Total Calculation */}
                                                        {selectedDayData ? (
                                                            <div className="pt-2 border-t border-[#41A96A]/20 space-y-2 animate-in fade-in duration-200">
                                                                <div className="flex justify-between items-center text-xs font-bold text-[#0F7438] dark:text-[#8DD3A5]">
                                                                    <span>Selected Delivery:</span>
                                                                    <span className="bg-[#238E4E] text-white px-2 py-0.5 rounded text-xs font-black">{selectedDayData.formattedDate}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-slate-600 dark:text-slate-300 font-semibold">PCB Price:</span>
                                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatPrice(selectedDayData.orderValue)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-baseline pt-1 border-t border-dashed border-[#41A96A]/30">
                                                                    <span className="text-slate-800 dark:text-slate-200 text-xs font-black">Main Total:</span>
                                                                    <span className="text-xl font-black text-[#0F7438] dark:text-[#69C48A]">
                                                                        {formatPrice(mainTotal)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center pt-2 text-xs font-semibold text-slate-500 italic border-t border-[#41A96A]/10">
                                                                Tap on any sticky note above to pick a delivery date.
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })()}

                                {(() => {
                                    const hasValidGerber = !!uploadedFile;
                                    const hasValidDimensions = (parseFloat(formData.width) || 0) > 0 && (parseFloat(formData.height) || 0) > 0 && (parseInt(formData.qty, 10) || 0) > 0;
                                    const hasSelectedDelivery = selectedDay !== null && selectedDay !== undefined;
                                    const hasRequiredSpecs = Boolean(formData.layers && formData.thickness && formData.surfaceFinish && formData.copperWeight);

                                    const isCanSaveToCart = hasValidGerber && hasValidDimensions && hasSelectedDelivery && hasRequiredSpecs;

                                    let validationMessage = "";
                                    if (!hasValidGerber) {
                                        validationMessage = "Please upload a Gerber file";
                                    } else if (!hasValidDimensions) {
                                        validationMessage = "Please specify valid dimensions & quantity";
                                    } else if (!hasSelectedDelivery) {
                                        validationMessage = "Please pick a delivery date";
                                    } else if (!hasRequiredSpecs) {
                                        validationMessage = "Please complete all specification fields";
                                    }

                                    return (
                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                disabled={!isCanSaveToCart || isSavingCart}
                                                onClick={handleSaveToCart}
                                                className={`w-full py-3.5 font-extrabold text-sm rounded-full shadow-md transition-all flex items-center justify-center gap-2 ${isCanSaveToCart && !isSavingCart
                                                    ? "bg-primary hover:bg-secondary text-white cursor-pointer active:scale-98"
                                                    : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none border border-gray-300/80 opacity-80"
                                                    }`}
                                            >
                                                {isSavingCart ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                        <span>SAVING...</span>
                                                    </>
                                                ) : (
                                                    <span>SAVE TO CART</span>
                                                )}
                                            </button>
                                            {!isCanSaveToCart && (
                                                <></>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {isModalOpen && checkoutData && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
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

                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                            <div className="flex justify-between items-center bg-amber-50/60 border border-amber-100/50 rounded-xl p-3.5">
                                <div>
                                    <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wider">Estimated Delivery</span>
                                    <span className="text-sm font-black text-slate-800 mt-0.5 block">{checkoutData.dateStr}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Total Value</span>
                                    <span className="text-lg font-black text-primary block">{formatPrice(checkoutData.orderValue)}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    handleOrderSubmit(checkoutData.day, checkoutData.unitPrice, checkoutData.orderValue);
                                }}
                                disabled={isSubmitting}
                                className="w-full h-11 bg-primary hover:bg-secondary disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-md transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Confirm and Place Order
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isConfigOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-150">
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

            {/* Toast Notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
