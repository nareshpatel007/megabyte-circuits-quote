"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { ShoppingCart, ChevronDown, ChevronUp, Cpu, Layers, Search, Menu, X, Settings, Loader2, Check, Upload } from "lucide-react";
import Link from "next/link";
import GerberUploader from "../GerberUploader";
import GerberStackupPreview from "../GerberStackupPreview";
import QuoteForm from "../QuoteForm";
import { GerberFile, QuoteFormData, UploadResponse } from "../../lib/gerber/types";
import { loadLayers, renderStack, renderWithGerbersRenderer, type RenderOptions, type InputLayer, COLORS, FINISHES } from "../../lib/gerber/clientRenderer";

import { submitOrder, OrderFormData } from "../../lib/api/orderService";
import { fetchPublicHolidays, PublicHoliday, getJlcpcbQuotationDate } from "../../lib/api/deliveryService";
import Toast, { ToastType } from "../Toast";
import { saveCartToBackend, loadCartFromBackend } from "@/lib/cartSession";
import { useCurrency } from "../../context/CurrencyContext";
import { isJlcpcbRequired } from "@/lib/jlcpcbCondition";
import { fetchActiveProviderRules } from "@/lib/manufacturingProviderResolver";
import ChargeDetails from "../ChargeDetails";

const INITIAL_FORM_DATA: QuoteFormData = {
    pnNumber: "",
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
    coverlayColor: "",
    silkscreen: "White",
    materialType: "FR4-TG135",
    surfaceFinish: "HASL(Leaded)",
    goldThickness: "N/A",
    copperWeight: "1 oz",
    copperType: "",
    viaCovering: "Not Specified",
    viaPlating: "Not Specified",
    minHole: "0.3mm",
    tolerance: "Regular",
    confirmFile: "No",
    markOnPcb: "",
    elecTest: "",
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

const calculateCartDeliveryDate = (targetWorkingDays: number): string => {
    const d = new Date();
    let workingDaysAdded = 0;
    while (workingDaysAdded < targetWorkingDays) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0) { // Skip Sunday
            workingDaysAdded++;
        }
    }
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function PCBSpecification({ selectedProduct = "pcb", isLoggedIn = false }: { selectedProduct?: "pcb" | "stencil"; isLoggedIn?: boolean }) {
    const { formatPrice } = useCurrency();
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadedGerberFileId, setUploadedGerberFileId] = useState<number | null>(null);
    const [jlcpcbFileKey, setJlcpcbFileKey] = useState<string | null>(null);
    const [clientLayers, setClientLayers] = useState<InputLayer[]>([]);
    const [detectedInfo, setDetectedInfo] = useState<{ layers: string; width: string; height: string } | null>(null);
    const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);
    const [editingCartItemName, setEditingCartItemName] = useState<string>("");

    const [formData, setFormData] = useState<QuoteFormData>(INITIAL_FORM_DATA);
    const [pricingConfig, setPricingConfig] = useState<{ fixedCosts: any; priceTiers: any; shippingOptions?: any[]; gstPercentage?: number; minPartsOrderAmount?: number } | null>(null);

    // Fetch active quotation provider routing rules from admin / DB
    React.useEffect(() => {
        fetchActiveProviderRules().catch(() => {});
    }, []);

    // Read URL search params for prefilling parameters passed from main site or cart item edit
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const cartItemId = params.get("cart_item_id");

        if (cartItemId) {
            (async () => {
                try {
                    let cartItems: any[] = [];
                    const savedCart = localStorage.getItem("megabyte_cart");
                    if (savedCart) {
                        try { cartItems = JSON.parse(savedCart); } catch (e) {}
                    }
                    if (!cartItems || !cartItems.length) {
                        cartItems = await loadCartFromBackend();
                    }
                    const item = cartItems.find((it: any) => String(it.id) === String(cartItemId));
                    if (item) {
                        setEditingCartItemId(String(item.id));
                        setEditingCartItemName(item.boardName || item.pn_number || item.gerberFileName || "PCB Item");

                        const colorNameToHex: Record<string, string> = {
                            "Green": "#52c41a",
                            "Purple": "#722ed1",
                            "Red": "#f5222d",
                            "Yellow": "#fadb14",
                            "Blue": "#1677ff",
                            "White": "#ffffff",
                            "Black": "#000000"
                        };

                        let rawLayers = String(item.layers || "2").replace(/\D/g, "");
                        if (!rawLayers) rawLayers = "2";

                        let w = String(item.width || "");
                        let h = String(item.height || "");
                        if ((!w || !h) && item.dimensions) {
                            const match = String(item.dimensions).match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
                            if (match) {
                                w = match[1];
                                h = match[2];
                            }
                        }

                        setFormData(prev => ({
                            ...prev,
                            baseMaterial: item.baseMaterial || item.material || "FR-4",
                            layers: rawLayers,
                            width: w || "100",
                            height: h || "100",
                            unit: item.unit || "mm",
                            qty: String(item.qty || "5"),
                            thickness: item.thickness || "1.6mm",
                            pcbColor: colorNameToHex[item.pcbColor] || item.pcbColor || "#52c41a",
                            silkscreen: item.silkscreen || "White",
                            materialType: item.materialType || "FR4-TG135",
                            surfaceFinish: item.surfaceFinish || "HASL(Leaded)",
                            copperWeight: item.copperWeight || "1 oz",
                            differentDesign: String(item.differentDesign || "1"),
                            deliveryFormat: item.deliveryFormat || "Single PCB",
                            panelColumn: item.panelColumn || "",
                            panelRow: item.panelRow || "",
                            goldThickness: (item.surfaceFinish === "ENIG" || item.baseMaterial === "Flex") ? (item.goldThickness && item.goldThickness !== "N/A" && item.goldThickness !== "1 U*" ? item.goldThickness : '1 U"') : "N/A",
                            viaCovering: (item.viaCovering === "Tented" || item.viaCovering === "Untented") ? "Not Specified" : (item.viaCovering || "Not Specified"),
                            viaPlating: item.viaPlating || item.viaPlatingMethod || "Not Specified",
                            minHole: item.minHole || "0.3mm/(0.4/0.45mm)",
                            confirmFile: item.confirmFile || "No",
                            markOnPcb: item.markOnPcb || "",
                            elecTest: (item.baseMaterial === "Rogers" || item.material === "Rogers") ? "Flying Probe Fully Test" : (item.elecTest || ""),
                            goldFingers: item.goldFingers || "No",
                            castellated: item.castellated || "No",
                            edgePlating: item.edgePlating || "No",
                            blindSlots: item.blindSlots || "No",
                            ulMarking: item.ulMarking || "No",
                            humidity: item.humidity || "No",
                            kelvinTest: item.kelvinTest || "No",
                            paperBetween: item.paperBetween || "No",
                            appearanceQuality: item.appearanceQuality || "IPC Class 2 Standard",
                            silkscreenTech: item.silkscreenTech || "Ink-jet Printing Silkscreen",
                            inspectionReport: item.inspectionReport || "No",
                            pcbRemark: item.pcbRemark || "",
                            pnNumber: item.pnNumber || item.pn_number || "",
                            boardName: item.boardName || "",
                            substrateType: item.substrateType || "",
                            coverlayColor: item.coverlayColor || "",
                            coverlayThickness: item.coverlayThickness || "",
                            copperType: item.copperType || "",
                            stiffener: item.stiffener || "",
                            emiShielding: item.emiShielding || "",
                            cuttingMethod: item.cuttingMethod || "",
                            edaSoftware: item.edaSoftware || "",
                            silkscreenOnStiffener: item.silkscreenOnStiffener || ""
                        }));

                        const gId = item.gerber_file_id || item.uploadedGerberFileId;
                        if (gId) {
                            setUploadedGerberFileId(gId);
                        }
                        const fKey = item.jlcpcb_file_key || item.jlcpcbFileKey;
                        if (fKey) {
                            setJlcpcbFileKey(fKey);
                        }

                        const fileName = item.gerberFileName || item.boardName || "Gerber.zip";
                        const fakeFile = new File([""], fileName, { type: "application/zip" });
                        setUploadedFile(fakeFile);

                        setDetectedInfo({
                            layers: rawLayers,
                            width: w || "100",
                            height: h || "100"
                        });

                        if (item.gerberPreview || item.topSvg || item.preview_data) {
                            setTopSvg(item.topSvg || item.gerberPreview || item.preview_data || "");
                        }
                        if (item.bottomSvg) {
                            setBottomSvg(item.bottomSvg);
                        }

                        if (item.selectedDay) {
                            setSelectedDay(Number(item.selectedDay));
                        } else if (item.buildTime) {
                            const days = parseInt(String(item.buildTime).replace(/\D/g, ""), 10);
                            if (days) setSelectedDay(days);
                        }

                        if (item.shippingOptionKey) {
                            setShippingOptionKey(item.shippingOptionKey);
                        }
                    }
                } catch (err) {
                    console.error("Failed to load cart item for edit:", err);
                }
            })();
            return;
        }

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
                    updates.elecTest = "Flying Probe Fully Test";
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

    // Load reorder specifications & Gerber file if arriving from Reorder flow
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const rawSpec = sessionStorage.getItem("megabyte_reorder_spec") || localStorage.getItem("megabyte_reorder_spec");
            if (rawSpec) {
                const spec = JSON.parse(rawSpec);
                const updates: Partial<QuoteFormData> = {};

                if (spec.layers) updates.layers = String(spec.layers);
                if (spec.width) updates.width = String(spec.width);
                if (spec.height) updates.height = String(spec.height);
                if (spec.qty) updates.qty = String(spec.qty);
                if (spec.thickness) updates.thickness = String(spec.thickness);
                if (spec.pcbColor) updates.pcbColor = String(spec.pcbColor);
                if (spec.surfaceFinish) updates.surfaceFinish = String(spec.surfaceFinish);
                if (spec.copperWeight) updates.copperWeight = String(spec.copperWeight);
                if (spec.baseMaterial) {
                    updates.baseMaterial = String(spec.baseMaterial);
                    if (String(spec.baseMaterial) === "Rogers") {
                        updates.elecTest = "Flying Probe Fully Test";
                    }
                }
                if (spec.boardName) updates.boardName = String(spec.boardName);

                if (Object.keys(updates).length > 0) {
                    setFormData(prev => ({ ...prev, ...updates }));
                }

                if (spec.gerber_file_id) {
                    setUploadedGerberFileId(spec.gerber_file_id);
                }

                const fileName = spec.gerber_name || spec.boardName || "gerber.zip";
                const fakeFile = new File([""], fileName, { type: "application/zip" });
                setUploadedFile(fakeFile);

                setDetectedInfo({
                    layers: String(spec.layers || "2"),
                    width: String(spec.width || "100"),
                    height: String(spec.height || "100")
                });

                if (spec.gerber_preview_data) {
                    let prevData = spec.gerber_preview_data;
                    if (typeof prevData === "string" && prevData.startsWith("{")) {
                        try { prevData = JSON.parse(prevData); } catch (e) { }
                    }
                    if (typeof prevData === "object" && prevData !== null) {
                        if (prevData.top || prevData.topSvg) setTopSvg(prevData.top || prevData.topSvg);
                        if (prevData.bottom || prevData.bottomSvg) setBottomSvg(prevData.bottom || prevData.bottomSvg);
                    }
                }

                sessionStorage.removeItem("megabyte_reorder_spec");
                localStorage.removeItem("megabyte_reorder_spec");
            }
        } catch (e) {
            console.error("Error restoring reorder specification:", e);
        }
    }, []);

    // Load dynamic PCB calculation parameters from backend API
    const fetchedPricingConfigRef = React.useRef(false);
    React.useEffect(() => {
        if (fetchedPricingConfigRef.current) return;
        fetchedPricingConfigRef.current = true;
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
    const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);

    React.useEffect(() => {
        let active = true;
        async function loadPublicHolidays() {
            const today = new Date();
            const future = new Date();
            future.setDate(today.getDate() + 60);

            const formatYmd = (d: Date) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                return `${y}-${m}-${day}`;
            };

            const startStr = formatYmd(today);
            const endStr = formatYmd(future);
            const list = await fetchPublicHolidays(startStr, endStr);
            if (active) {
                setPublicHolidays(list);
            }
        }
        loadPublicHolidays();
        return () => { active = false; };
    }, []);
    const [shippingOptionKey, setShippingOptionKey] = useState<string>("standard");
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

    // Live JLCPCB API quote state for > 2 layers
    const [jlcpcbQuote, setJlcpcbQuote] = useState<any>(null);
    const [isJlcpcbLoading, setIsJlcpcbLoading] = useState<boolean>(false);
    const [jlcpcbError, setJlcpcbError] = useState<string | null>(null);
    const [quoteTrigger, setQuoteTrigger] = useState<number>(0);
    const quoteReqVersion = React.useRef(0);

    // Fetch JLCPCB live quotation whenever any JLCPCB triggering option or layers > 2 is selected
    React.useEffect(() => {
        const layersCount = parseInt(formData.layers, 10) || 1;
        const shouldCallJlcpcb = isJlcpcbRequired(formData);

        if (!shouldCallJlcpcb) {
            ++quoteReqVersion.current;
            setJlcpcbQuote(null);
            setIsJlcpcbLoading(false);
            setJlcpcbError(null);
            return;
        }

        const currentReqId = ++quoteReqVersion.current;
        const abortController = new AbortController();
        setIsJlcpcbLoading(true);
        setJlcpcbError(null);

        const timer = setTimeout(async () => {
            if (currentReqId !== quoteReqVersion.current) return;

            const unitMultiplier = formData.unit === "inches" ? 25.4 : 1;
            const width = Math.max(1, Math.round((parseFloat(formData.width) || 100) * unitMultiplier));
            const height = Math.max(1, Math.round((parseFloat(formData.height) || 100) * unitMultiplier));
            const qty = Math.max(5, parseInt(formData.qty, 10) || 5);

            const colorMap: Record<string, number> = {
                "#52c41a": 0, // Green
                "#f5222d": 1, // Red
                "#fadb14": 2, // Yellow
                "#1677ff": 3, // Blue
                "#ffffff": 4, // White
                "#000000": 5, // Black
                "#722ed1": 6  // Purple
            };

            const finishMap: Record<string, number> = {
                "HASL(with lead)": 0,
                "HASL(Leaded)": 0,
                "HASL": 0,
                "LeadFree HASL": 1,
                "LeadFree HASL (RoHS)": 1,
                "ENIG": 2,
                "OSP": 3
            };

            let plateTypeVal = 1; // 1-FR-4
            const mat = (formData.baseMaterial || "").toLowerCase();
            if (mat.includes("flex")) plateTypeVal = 7;
            else if (mat.includes("roger")) plateTypeVal = 5;
            else if (mat.includes("ptfe") || mat.includes("teflon")) plateTypeVal = 6;
            else if (mat.includes("aluminum")) plateTypeVal = 2;
            else if (mat.includes("hdi")) plateTypeVal = layersCount >= 4 ? 8 : 1;

            let surfaceFinishVal = finishMap[formData.surfaceFinish] ?? 0;
            if (plateTypeVal === 7 || (layersCount >= 6 && surfaceFinishVal === 0)) {
                surfaceFinishVal = 2; // Flex PCBs and 6+ layer PCBs only support ENIG
            }

            let copperWeightVal = formData.copperWeight?.includes("2") ? 2 : 1;
            if (plateTypeVal === 7) {
                // For Flex PCB: 1-2 layers uses 0.33 oz (12µm foil); 4 layers uses 1 oz
                copperWeightVal = layersCount >= 4 ? 1 : 0.33;
            }

            let viaCoveringVal = 1;
            const vc = (formData.viaCovering || "").toLowerCase();
            if (vc.includes("copper") || (vc.includes("paste") && vc.includes("fill"))) {
                viaCoveringVal = 5;
            } else if (vc.includes("epoxy")) {
                viaCoveringVal = 4;
            } else if (vc.includes("plugged")) {
                viaCoveringVal = 3;
            } else if (vc.includes("untented")) {
                viaCoveringVal = 2;
            } else {
                viaCoveringVal = 1;
            }

            let minHoleVal = 0.3;
            const mh = (formData.minHole || "").toLowerCase();
            if (mh.includes("0.15")) minHoleVal = 0.15;
            else if (mh.includes("0.2mm") || mh.startsWith("0.2/")) minHoleVal = 0.2;
            else if (mh.includes("0.25")) minHoleVal = 0.25;

            const rawThickness = parseFloat((formData.thickness || "1.6").toString().replace(/[^0-9.]/g, "")) || 1.6;

            const serviceConfigs: any[] = [];
            if (plateTypeVal === 7) {
                // FPC Coverlay Thickness
                const ctcOption = formData.substrateType === "Transparent"
                    ? "PET:25um/AD:25um"
                    : (layersCount >= 4 ? "PI:25um/AD:25um" : "PI:12.5um/AD:15um");
                serviceConfigs.push({
                    serviceConfigCode: "CTC",
                    configOptionShow: ctcOption
                });
                if (formData.coverlayColor) {
                    serviceConfigs.push({
                        serviceConfigCode: "PCYB",
                        configOptionShow: formData.coverlayColor
                    });
                }
                if (formData.copperType) {
                    serviceConfigs.push({
                        serviceConfigCode: "CT",
                        configOptionShow: formData.copperType
                    });
                }
            } else if (plateTypeVal === 5) {
                serviceConfigs.push({
                    serviceConfigCode: "HFMT",
                    configOptionShow: formData.materialType || "RO4350B(Dk=3.48,Df=0.0037)"
                });
            } else if (plateTypeVal === 6) {
                serviceConfigs.push({
                    serviceConfigCode: "HFMT",
                    configOptionShow: formData.materialType || "ZYF300CA-C(Dk=2.94,Df=0.0016)"
                });
            }

            if (formData.viaPlating && formData.viaPlating !== "Not Specified") {
                serviceConfigs.push({
                    serviceConfigCode: "VAPG",
                    configOptionShow: formData.viaPlating
                });
            }

            if (formData.confirmFile === "Yes") {
                serviceConfigs.push({
                    serviceConfigCode: "CPF",
                    configOptionShow: "Yes"
                });
            }

            const payload = {
                orderType: 1,
                achieveDate: 48,
                country: "IN",
                gerber_id: uploadedGerberFileId || undefined,
                fileKey: jlcpcbFileKey || "",
                pcbParam: {
                    layer: layersCount,
                    width: width,
                    length: height,
                    qty: qty,
                    thickness: rawThickness,
                    pcbColor: colorMap[formData.pcbColor] ?? 0,
                    surfaceFinish: surfaceFinishVal,
                    ...(surfaceFinishVal === 2 || plateTypeVal === 7 ? {
                        goldThickness: (formData.goldThickness && String(formData.goldThickness).includes("2")) ? 2 : 1
                    } : {}),
                    copperWeight: copperWeightVal,
                    ...(layersCount >= 4 ? { insideCuprumThickness: "0.5" } : {}),
                    goldFinger: formData.goldFingers === "Yes" ? 1 : 0,
                    materialDetails: (() => {
                        const mtLower = (formData.materialType || "").toLowerCase();
                        if (mtLower.includes("kb6164")) return 1;
                        if (mtLower.includes("nan ya") || mtLower.includes("np-140f")) return 2;
                        if (mtLower.includes("s1141")) return 3;
                        if (mtLower.includes("s1000h")) return 4;
                        return 0;
                    })(),
                    panelFlag: 0,
                    differentDesign: parseInt(formData.differentDesign || "1", 10) || 1,
                    flyingProbeTest: (plateTypeVal === 7 || plateTypeVal === 5 || formData.elecTest === "Flying Probe Fully Test") ? 2 : 1,
                    castellatedHoles: formData.castellated === "Yes" ? 1 : 0,
                    orderDetailsRemark: "Web Quotation",
                    impedanceFlag: "no",
                    isAddCustomerCode: "nocode",
                    plateType: plateTypeVal,
                    autoConfirmProductionFile: formData.confirmFile === "Yes" ? false : true,
                    confirmFile: formData.confirmFile || "No",
                    markOnPcb: (formData.markOnPcb || "").toLowerCase().includes("barcode") ? 2 : 1,
                    viaCovering: viaCoveringVal,
                    needTechnics: 0,
                    edgeRounding: formData.edgePlating === "Yes",
                    blindSlots: formData.blindSlots === "Yes" ? 1 : 0,
                    minHole: minHoleVal,
                    serviceConfigVos: serviceConfigs
                }
            };

            try {
                const res = await fetch("/api/jlcpcb/calculate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    signal: abortController.signal
                });
                const json = await res.json();
                if (currentReqId !== quoteReqVersion.current) return;
                    if (json.success && json.code === 200) {
                        setJlcpcbQuote(json);
                        if (json.fileKey && !jlcpcbFileKey) {
                            setJlcpcbFileKey(json.fileKey);
                        }
                        // Auto-calculate single target JLCPCB delivery date (Today + 12 days, Sunday adjusted)
                        const targetDate = getJlcpcbQuotationDate(new Date(), publicHolidays);
                        const todayDate = new Date();
                        todayDate.setHours(0, 0, 0, 0);
                        const diffDays = Math.max(1, Math.round((targetDate.getTime() - todayDate.getTime()) / (1000 * 3600 * 24)));
                        setSelectedDay(diffDays);
                    } else {
                        console.warn("JLCPCB Quote API response error:", json);
                        setJlcpcbQuote(null);
                        setJlcpcbError(json.message || "Unable to calculate JLCPCB quotation. Please try again.");
                    }
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                console.error("Error calling JLCPCB quotation API:", err);
                if (currentReqId === quoteReqVersion.current) {
                    setJlcpcbQuote(null);
                    setJlcpcbError("Unable to calculate PCB price. Please try again.");
                }
            } finally {
                if (currentReqId === quoteReqVersion.current) {
                    setIsJlcpcbLoading(false);
                }
            }
        }, 400);

        return () => {
            clearTimeout(timer);
            abortController.abort();
        };
    }, [
        quoteTrigger,
        formData.layers,
        formData.baseMaterial,
        formData.substrateType,
        formData.materialType,
        formData.width,
        formData.height,
        formData.qty,
        formData.thickness,
        formData.pcbColor,
        formData.coverlayColor,
        formData.surfaceFinish,
        formData.goldThickness,
        formData.copperWeight,
        formData.copperType,
        formData.unit,
        formData.goldFingers,
        formData.differentDesign,
        formData.elecTest,
        formData.castellated,
        formData.viaCovering,
        formData.viaPlating,
        formData.minHole,
        formData.edgePlating,
        formData.blindSlots,
        formData.markOnPcb,
        formData.confirmFile,
        uploadedGerberFileId,
        jlcpcbFileKey
    ]);

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

    const colorCache = React.useRef<Record<string, { top: string; bottom: string }>>({});

    // Python Gerber processing service provides the source-of-truth 2D preview images.
    // Realtime preview update when PCB color selection or uploaded file changes.
    React.useEffect(() => {
        if (!uploadedGerberFileId) return;

        const hexToSlug: Record<string, string> = {
            "#52c41a": "green",
            "#722ed1": "purple",
            "#f5222d": "red",
            "#fadb14": "yellow",
            "#1677ff": "blue",
            "#ffffff": "white",
            "#000000": "black"
        };

        const rawColor = (formData.pcbColor || "green").toLowerCase().trim();
        const colorSlug = hexToSlug[rawColor] || (
            ["green", "purple", "red", "yellow", "blue", "white", "black"].includes(rawColor)
                ? rawColor
                : "green"
        );

        const newTopUrl = `/api/gerber/${uploadedGerberFileId}/preview/front?color=${colorSlug}`;
        const newBottomUrl = `/api/gerber/${uploadedGerberFileId}/preview/back?color=${colorSlug}`;

        setTopSvg(newTopUrl);
        setBottomSvg(newBottomUrl);
        colorCache.current[colorSlug] = { top: newTopUrl, bottom: newBottomUrl };
    }, [uploadedGerberFileId, formData.pcbColor]);

    // Dynamic lead time-based pricing calculation
    const getLeadTimePricing = () => {
        const layers = parseInt(formData.layers, 10) || 1;
        const unitMultiplier = formData.unit === "inches" ? 25.4 : 1;
        const length = (parseFloat(formData.width) || 0) * unitMultiplier;
        const width = (parseFloat(formData.height) || 0) * unitMultiplier;
        const quantity = Math.max(parseInt(formData.qty, 10) || 5, 5);
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

        // If JLCPCB is required, use live JLCPCB API quote when available
        if (isJlcpcbRequired(formData)) {
            if (jlcpcbQuote) {
                const usdTotalFee = parseFloat(
                    jlcpcbQuote?.normalized_quote?.basePcbPrice ||
                    jlcpcbQuote?.calculated_price_usd ||
                    jlcpcbQuote?.base_usd ||
                    jlcpcbQuote?.pcbCostInfo?.stencilFee ||
                    jlcpcbQuote?.pcbCostInfo?.totalFee ||
                    jlcpcbQuote?.priceWithoutFreight ||
                    0
                );
                if (usdTotalFee > 0) {
                    const inrTotalFee = Math.max(Math.round(usdTotalFee * 88.5), 100);
                    const daysList = [1, 3, 5, 7, 10, 13, 15, 17, 20];
                    const options = daysList.map((day) => {
                        const unitPrice = inrTotalFee / quantity;
                        return {
                            day,
                            unitPrice: unitPrice.toFixed(2),
                            orderValue: inrTotalFee.toFixed(2),
                            visible: true
                        };
                    });
                    return { options, showContact: false, totalAreaInSqM };
                }
            }

            // Fallback calculation when JLCPCB option selected and live quote is pending
            const layerFactor = 1 + Math.max(0, layers - 2) * 0.4;
            const baseCost = Math.round(5500 * layerFactor + (areaInSqCm * 1.2 * layerFactor));
            const daysList = [1, 3, 5, 7, 10, 13, 15, 17, 20];
            const options = daysList.map((day) => {
                const dayFactor = day === 1 ? 1.5 : day === 3 ? 1.3 : day === 5 ? 1.1 : 1.0;
                const totalCost = Math.round(baseCost * dayFactor);
                const unitPrice = totalCost / quantity;
                return {
                    day,
                    unitPrice: unitPrice.toFixed(2),
                    orderValue: totalCost.toFixed(2),
                    visible: true
                };
            });
            return { options, showContact: false, totalAreaInSqM };
        }


        const fixedCosts: Record<string, Record<number, number>> = pricingConfig?.fixedCosts || {
            '1': { 1: 3100, 3: 2100, 5: 1600, 7: 1500, 10: 1400, 13: 1280, 15: 1200, 17: 1120, 20: 1000 },
            '2': { 1: 8100, 3: 4100, 5: 2600, 7: 2200, 10: 1900, 13: 1750, 15: 1650, 17: 1550, 20: 1400 },
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
        else tierKey = "3.01 to 9.99";

        const applicablePrices = priceTiers[layers.toString()]?.[tierKey];
        if (!applicablePrices) {
            return { options: [], showContact: false, totalAreaInSqM };
        }

        // Days setup
        const daysList = [1, 3, 5, 7, 10, 13, 15, 17, 20];
        const options = daysList.map((day, idx) => {
            let costPerSqCm = applicablePrices[idx] !== undefined ? applicablePrices[idx] : (applicablePrices[4] ?? applicablePrices[0]);
            if (day === 20 && applicablePrices[8] === undefined) {
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

        // Apply visibility overrides based on lead times (always keep calculations enabled)
        if (layers >= 4 && layers <= 10) {
            options.forEach(opt => {
                if (opt.day !== 20) opt.visible = false;
            });
        } else if (layers === 1 || layers === 2) {
            // Lead time availability based on area
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

        return { options, showContact: false, totalAreaInSqM };
    };

    const handleUploadSuccess = async (res: UploadResponse, file: File) => {
        setUploadedFile(file);
        setPreviewLoading(false);

        if (res?.gerber_file_id) {
            setUploadedGerberFileId(res.gerber_file_id);
        }

        if ((res as any)?.jlcpcb_file_key) {
            setJlcpcbFileKey((res as any).jlcpcb_file_key);
        }

        const frontUrl = res?.preview_front || (res?.gerber_file_id ? `/api/gerber/${res.gerber_file_id}/preview/front` : "");
        const backUrl = res?.preview_back || (res?.gerber_file_id ? `/api/gerber/${res.gerber_file_id}/preview/back` : "");

        setTopSvg(frontUrl);
        setBottomSvg(backUrl);

        const widthVal = res?.board_width ? Number(res.board_width).toFixed(2) : formData.width;
        const heightVal = res?.board_height ? Number(res.board_height).toFixed(2) : formData.height;
        const layerCountVal = res?.layer_count ? String(res.layer_count) : formData.layers;

        try {
            const layers = await loadLayers(file);
            if (layers && layers.length > 0) {
                setClientLayers(layers);
            }
        } catch (err) {
            console.warn("Client layer parsing during upload success:", err);
        }

        setDetectedInfo({
            layers: layerCountVal,
            width: widthVal,
            height: heightVal
        });

        setFormData(prev => ({
            ...prev,
            layers: layerCountVal,
            width: widthVal,
            height: heightVal,
            unit: "mm",
            pnNumber: prev.pnNumber || file.name,
            boardName: prev.boardName || file.name
        }));
    };

    const handleReset = () => {
        setUploadedFile(null);
        setUploadedGerberFileId(null);
        setJlcpcbFileKey(null);
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
        if (isNaN(qty) || qty < 5) {
            setToast({ message: 'Minimum order quantity is 5', type: 'warning' });
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
            gold_thickness: (formData.surfaceFinish === "ENIG" || formData.baseMaterial === "Flex") ? (formData.goldThickness && formData.goldThickness !== "N/A" && formData.goldThickness !== "1 U*" ? formData.goldThickness : "1 U\"") : "N/A",

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
            pn_number: formData.pnNumber || (uploadedFile ? (uploadedFile as any).name : formData.boardName),
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

            // Canonical Quotation Source & Routing
            quotation_source: isJlcpcbRequired(formData) ? "jlcpcb" : "internal",
            order_type: isJlcpcbRequired(formData) ? "jlcpcb" : "normal",
            jlcpcb_file_key: isJlcpcbRequired(formData) ? (jlcpcbFileKey || undefined) : undefined,
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

    const quoteCalculation = React.useMemo(() => {
        const layers = parseInt(formData.layers, 10) || 1;
        const { options, totalAreaInSqM = 0 } = getLeadTimePricing();

        const unitMultiplier = formData.unit === "inches" ? 25.4 : 1;
        const length = (parseFloat(formData.width) || 0) * unitMultiplier;
        const width = (parseFloat(formData.height) || 0) * unitMultiplier;
        const quantity = Math.max(parseInt(formData.qty, 10) || 5, 5);

        const defaultOrderValue = Math.max(Math.round(length * width * 0.05 * quantity), 100);
        const defaultUnitPrice = (defaultOrderValue / quantity).toFixed(2);

        const getOption = (dayNum: number) => options.find(o => o.day === dayNum && o.visible);

        let workingDayCounter = 0;

        const getShortMonthYear = (d: Date) => {
            const monthStr = d.toLocaleDateString("en-IN", { month: "short" });
            const formattedMonth = monthStr === "Sep" ? "Sept" : monthStr;
            return `${formattedMonth} ${d.getFullYear()}`;
        };

        let next20Days: any[] = [];
        const isJLCPCB = isJlcpcbRequired(formData);

        if (isJLCPCB) {
            const jlcDate = getJlcpcbQuotationDate(new Date(), publicHolidays);
            const yyyy = jlcDate.getFullYear();
            const mm = String(jlcDate.getMonth() + 1).padStart(2, "0");
            const dd = String(jlcDate.getDate()).padStart(2, "0");
            const jlcIsoDateStr = `${yyyy}-${mm}-${dd}`;

            let matchedVal = 0;
            let pcbPriceVal = 0;
            let shippingChargeVal = 0;
            let subtotalVal = 0;
            let gstAmountVal = 0;
            let finalTotalVal = 0;

            if (jlcpcbQuote) {
                if (jlcpcbQuote.dates && Array.isArray(jlcpcbQuote.dates) && jlcpcbQuote.dates.length > 0) {
                    const firstDate = jlcpcbQuote.dates[0];
                    subtotalVal = parseFloat(firstDate.subtotal ?? jlcpcbQuote.subtotal ?? jlcpcbQuote.selling_price_before_gst ?? 0);
                    gstAmountVal = parseFloat(firstDate.gst_amount ?? jlcpcbQuote.gst_amount ?? (subtotalVal * 0.18));
                    finalTotalVal = parseFloat(firstDate.final_total ?? jlcpcbQuote.final_total ?? (subtotalVal + gstAmountVal));
                } else {
                    subtotalVal = parseFloat(jlcpcbQuote.subtotal ?? jlcpcbQuote.selling_price_before_gst ?? jlcpcbQuote.without_gst ?? 0);
                    gstAmountVal = parseFloat(jlcpcbQuote.gst_amount ?? jlcpcbQuote.sales_gst_amount ?? (subtotalVal * 0.18));
                    finalTotalVal = parseFloat(jlcpcbQuote.final_total ?? jlcpcbQuote.with_gst ?? (subtotalVal + gstAmountVal));
                }
                matchedVal = subtotalVal;
            }

            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            const targetDateZero = new Date(jlcDate.getTime());
            targetDateZero.setHours(0, 0, 0, 0);
            const diffDays = Math.max(1, Math.round((targetDateZero.getTime() - todayDate.getTime()) / (1000 * 3600 * 24)));

            const singleItem = {
                day: diffDays,
                dateObj: jlcDate,
                isoDateStr: jlcIsoDateStr,
                dateNum: jlcDate.getDate(),
                monthStr: jlcDate.toLocaleDateString("en-IN", { month: "short" }),
                fullMonthYear: jlcDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
                shortMonthYear: getShortMonthYear(jlcDate),
                weekday: jlcDate.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase(),
                formattedDate: jlcDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                orderValue: matchedVal.toFixed(2),
                pcb_price: pcbPriceVal,
                shipping_charge: shippingChargeVal,
                subtotal: subtotalVal,
                gst_amount: gstAmountVal,
                final_total: finalTotalVal,
                unitPrice: (matchedVal / quantity).toFixed(2),
                visible: true,
                isSunday: false,
                isHoliday: false,
                holidayName: null,
                isUnavailable: false,
                workingDayNum: diffDays
            };

            next20Days = [singleItem];
        } else {
            next20Days = Array.from({ length: 20 }, (_, i) => {
                const daysAhead = i + 1;
                const date = new Date();
                date.setDate(date.getDate() + daysAhead);

                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const dayOfMonth = String(date.getDate()).padStart(2, "0");
                const isoDateStr = `${year}-${month}-${dayOfMonth}`;

                const isSunday = date.getDay() === 0;
                const activeHoliday = publicHolidays.find(h => (typeof h.date === "string" ? h.date.split("T")[0] : "") === isoDateStr);
                const isHoliday = !!activeHoliday;

                let matchedOrderValue = defaultOrderValue;
                let matchedUnitPrice = parseFloat(defaultUnitPrice);
                let visible = false;
                let workingDayNum = 0;

                if (!isSunday && !isHoliday) {
                    workingDayCounter++;
                    workingDayNum = workingDayCounter;

                    const visibleAnchors = options.filter(o => o.visible).sort((a, b) => a.day - b.day);
                    const directOpt = visibleAnchors.find(o => o.day === workingDayNum);
                    if (directOpt) {
                        matchedOrderValue = parseFloat(directOpt.orderValue);
                        matchedUnitPrice = parseFloat(directOpt.unitPrice);
                        visible = true;
                    } else if (visibleAnchors.length > 0) {
                        let prevAnchor: (typeof visibleAnchors)[0] | null = null;
                        let nextAnchor: (typeof visibleAnchors)[0] | null = null;
                        for (const a of visibleAnchors) {
                            if (a.day < workingDayNum) {
                                prevAnchor = a;
                            } else if (a.day > workingDayNum && !nextAnchor) {
                                nextAnchor = a;
                                break;
                            }
                        }

                        if (prevAnchor && nextAnchor) {
                            const ratio = (workingDayNum - prevAnchor.day) / (nextAnchor.day - prevAnchor.day);
                            const val1 = parseFloat(prevAnchor.orderValue);
                            const val2 = parseFloat(nextAnchor.orderValue);
                            const u1 = parseFloat(prevAnchor.unitPrice);
                            const u2 = parseFloat(nextAnchor.unitPrice);
                            matchedOrderValue = val1 + (val2 - val1) * ratio;
                            matchedUnitPrice = u1 + (u2 - u1) * ratio;
                            visible = true;
                        } else if (prevAnchor) {
                            matchedOrderValue = parseFloat(prevAnchor.orderValue);
                            matchedUnitPrice = parseFloat(prevAnchor.unitPrice);
                            visible = true;
                        } else if (nextAnchor) {
                            matchedOrderValue = parseFloat(nextAnchor.orderValue);
                            matchedUnitPrice = parseFloat(nextAnchor.unitPrice);
                            visible = true;
                        }
                    }
                }

                const isUnavailable = isSunday || isHoliday || !visible;

                return {
                    day: daysAhead,
                    dateObj: date,
                    isoDateStr,
                    dateNum: date.getDate(),
                    monthStr: date.toLocaleDateString("en-IN", { month: "short" }),
                    fullMonthYear: date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
                    shortMonthYear: getShortMonthYear(date),
                    weekday: date.toLocaleDateString("en-IN", { weekday: "short" }),
                    formattedDate: date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                    orderValue: isUnavailable ? "0.00" : matchedOrderValue.toFixed(2),
                    unitPrice: isUnavailable ? "0.00" : matchedUnitPrice.toFixed(2),
                    visible,
                    isSunday,
                    isHoliday,
                    holidayName: activeHoliday?.name || null,
                    isUnavailable,
                    workingDayNum
                };
            });
        }

        const uniqueMonths = Array.from(new Set(next20Days.map(item => item.shortMonthYear)));
        const calendarHeaderTitle = uniqueMonths.length > 1
            ? `${uniqueMonths[0]} - ${uniqueMonths[uniqueMonths.length - 1]}`
            : uniqueMonths[0] || getShortMonthYear(new Date());

        const selectedDayData = next20Days.find(item => item.day === selectedDay && !item.isUnavailable) || next20Days.find(item => !item.isUnavailable);

        // Weight & Shipping calculation
        let jlcWeightKg: number | null = null;
        if (isJLCPCB && jlcpcbQuote) {
            if (jlcpcbQuote.weight_kg !== undefined && jlcpcbQuote.weight_kg !== null && parseFloat(jlcpcbQuote.weight_kg) > 0) {
                jlcWeightKg = parseFloat(jlcpcbQuote.weight_kg);
            } else if (jlcpcbQuote.pcbCostInfo?.weight !== undefined && parseFloat(jlcpcbQuote.pcbCostInfo.weight) > 0) {
                jlcWeightKg = parseFloat(jlcpcbQuote.pcbCostInfo.weight);
            } else if (jlcpcbQuote.orderTotalWeight !== undefined && parseFloat(jlcpcbQuote.orderTotalWeight) > 0) {
                const w = parseFloat(jlcpcbQuote.orderTotalWeight);
                jlcWeightKg = w > 10 ? w / 1000.0 : w;
            } else if (jlcpcbQuote.weight !== undefined && parseFloat(jlcpcbQuote.weight) > 0) {
                const w = parseFloat(jlcpcbQuote.weight);
                jlcWeightKg = w > 10 ? w / 1000.0 : w;
            }
        }

        const thicknessMm = parseFloat((formData.thickness || "1.6").toString().replace(/[^0-9.]/g, "")) || 1.6;
        const weightPerSqM = formData.baseMaterial === "Flex" ? 0.3 : 3.8 * (thicknessMm / 1.6);
        const calculatedEstWeightKg = Math.max(0.1, parseFloat((totalAreaInSqM * weightPerSqM).toFixed(2)));
        const estimatedWeightKg = (jlcWeightKg !== null && jlcWeightKg > 0) ? parseFloat(jlcWeightKg.toFixed(2)) : calculatedEstWeightKg;
        const chargedWeightKg = Math.max(1.0, estimatedWeightKg);

        const defaultShippingOptions = [
            { key: "standard", location: "Standard", method: "Standard", rate: 0 },
            { key: "plus", location: "Plus", method: "Plus", rate: 150 },
            { key: "fasttrack", location: "Fasttrack", method: "Fasttrack", rate: 450 },
        ];
        const shippingOptions = pricingConfig?.shippingOptions && Array.isArray(pricingConfig.shippingOptions) && pricingConfig.shippingOptions.length > 0
            ? pricingConfig.shippingOptions
            : defaultShippingOptions;

        const activeShipping = shippingOptions.find((o: any) => o.key === shippingOptionKey) || shippingOptions[0];
        const shippingCharge = Math.round(activeShipping.rate * chargedWeightKg);

        let pcbPrice = 0;
        let gstPercentage = 18;

        if (isJLCPCB && jlcpcbQuote) {
            if (selectedDayData) {
                pcbPrice = selectedDayData.subtotal !== undefined ? parseFloat(selectedDayData.subtotal) : (jlcpcbQuote.subtotal || jlcpcbQuote.selling_price_before_gst || 0);
            } else {
                pcbPrice = jlcpcbQuote.subtotal !== undefined ? jlcpcbQuote.subtotal : (jlcpcbQuote.selling_price_before_gst || 0);
            }
            gstPercentage = jlcpcbQuote.gst_percentage !== undefined ? Number(jlcpcbQuote.gst_percentage) : (pricingConfig?.gstPercentage !== undefined ? Number(pricingConfig.gstPercentage) : 18);
        } else {
            pcbPrice = selectedDayData ? parseFloat(selectedDayData.orderValue) : 0;
            gstPercentage = pricingConfig?.gstPercentage !== undefined ? Number(pricingConfig.gstPercentage) : 18;
        }

        const taxableTotal = pcbPrice > 0 ? pcbPrice + shippingCharge : 0;
        const gstAmount = taxableTotal > 0 ? Math.round(((taxableTotal * gstPercentage) / 100) * 100) / 100 : 0;
        const mainTotal = Math.round((taxableTotal + gstAmount) * 100) / 100;

        return {
            next20Days,
            calendarHeaderTitle,
            selectedDayData,
            totalAreaInSqM,
            estimatedWeightKg,
            chargedWeightKg,
            shippingOptions,
            activeShipping,
            shippingCharge,
            pcbPrice,
            gstPercentage,
            taxableTotal,
            gstAmount,
            mainTotal,
            isJLCPCB
        };
    }, [formData, pricingConfig, selectedDay, shippingOptionKey, publicHolidays, jlcpcbQuote, isJlcpcbLoading, jlcpcbError]);

    const handleSaveToCart = async () => {
        setIsSavingCart(true);
        try {
            const savedCart = localStorage.getItem("megabyte_cart");
            let existingCart = savedCart ? JSON.parse(savedCart) : [];
            if (!Array.isArray(existingCart)) existingCart = [];

            const {
                pcbPrice,
                shippingCharge,
                gstPercentage,
                gstAmount,
                taxableTotal,
                mainTotal,
                selectedDayData,
                activeShipping,
                isJLCPCB
            } = quoteCalculation;

            if (!selectedDayData) {
                setToast({ message: "Please pick a valid delivery date", type: "warning" });
                return;
            }

            const hexToColorName: Record<string, string> = {
                "#52c41a": "Green",
                "#722ed1": "Purple",
                "#f5222d": "Red",
                "#fadb14": "Yellow",
                "#1677ff": "Blue",
                "#ffffff": "White",
                "#000000": "Black"
            };

            const pcbColorName = hexToColorName[formData.pcbColor] || formData.pcbColor || "Green";
            const colorSlug = pcbColorName.toLowerCase();
            const defaultPnFromFilename = uploadedFile
                ? (typeof uploadedFile === 'string' ? uploadedFile : (uploadedFile.name || (uploadedFile as any).filename || ""))
                : "";
            const pnNumberVal = formData.pnNumber || defaultPnFromFilename || formData.boardName || "";
            const gerberName = uploadedFile
                ? (typeof uploadedFile === 'string' ? uploadedFile : (uploadedFile.name || (uploadedFile as any).filename || "Gerber_Board.zip"))
                : "";
            const previewSvg = (uploadedGerberFileId ? `/api/gerber/${uploadedGerberFileId}/preview/front?color=${colorSlug}` : (topSvg || bottomSvg || ""));
            const generatedBoardId = "Y2-" + Math.floor(10000000 + Math.random() * 90000000);

            const isJlcpcbCart = isJLCPCB && !!jlcpcbQuote;
            const targetFormattedDate = selectedDayData.formattedDate;
            const targetIsoDate = selectedDayData.isoDateStr;
            const targetDays = selectedDayData.day;

            const cartItemId = editingCartItemId || ('cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));

            const newItem = {
                id: cartItemId,
                productType: selectedProduct || "pcb",
                boardName: formData.boardName || pnNumberVal || (uploadedFile ? gerberName : "PCB_Board"),
                pn_number: pnNumberVal,
                pnNumber: pnNumberVal,
                gerberFileName: uploadedFile ? gerberName : undefined,
                gerber_file_id: uploadedGerberFileId || undefined,
                jlcpcb_file_key: isJlcpcbCart ? (jlcpcbFileKey || undefined) : undefined,
                quotation_source: isJlcpcbCart ? "jlcpcb" : "internal",
                order_type: isJlcpcbCart ? "jlcpcb" : "normal",
                jlcpcb_price: isJlcpcbCart ? pcbPrice : undefined,
                jlcpcb_quote: isJlcpcbCart ? jlcpcbQuote : undefined,
                jlcpcb_quotation_snapshot: isJlcpcbCart ? jlcpcbQuote : undefined,
                gerberPreview: previewSvg,
                boardId: generatedBoardId,
                pcbColor: pcbColorName,
                layers: `${formData.layers || '2'} Layer${(Number(formData.layers) || 2) > 1 ? 's' : ''}`,
                dimensions: `${formData.width || 100}x${formData.height || 100}${formData.unit || 'mm'}`,
                width: Number(formData.width) || 100,
                height: Number(formData.height) || 100,
                unit: formData.unit || "mm",
                qty: Number(formData.qty) || 5,
                buildTime: `${targetDays} days`,
                build_days: targetDays,
                working_days: selectedDayData.workingDayNum,
                selectedDay: targetDays,
                date: targetFormattedDate,
                deliveryDate: targetFormattedDate,
                delivery_date: targetIsoDate,
                price: mainTotal,
                total_price: mainTotal,
                pcb_price: pcbPrice,
                pcbPrice: pcbPrice,
                subtotal: taxableTotal,
                shippingOption: (!activeShipping.method || activeShipping.location === activeShipping.method) ? (activeShipping.location || activeShipping.method) : `${activeShipping.location} - ${activeShipping.method}`,
                shippingOptionKey: activeShipping.key,
                shippingCharge: shippingCharge,
                shipping_charge: shippingCharge,
                gst_rate: gstPercentage,
                gstRate: gstPercentage,
                gst_amount: gstAmount,
                gstAmount: gstAmount,
                pricing_breakdown: {
                    pcb_price: pcbPrice,
                    delivery_charge: shippingCharge,
                    gst_rate: gstPercentage,
                    gst_amount: gstAmount,
                    total: mainTotal
                },
                material: formData.baseMaterial || "FR-4",
                baseMaterial: formData.baseMaterial || "FR-4",
                materialType: formData.materialType || (formData.baseMaterial === "Flex" ? "Polyimide (PI)" : formData.baseMaterial === "Rogers" ? "RO4350B(Dk=3.48,Df=0.0037)" : formData.baseMaterial === "PTFE Teflon" ? "ZYF300CA-P(Dk=3.0,Df=0.0016)" : "FR4-TG135"),
                thickness: `${formData.thickness || (formData.baseMaterial === "Flex" ? '0.12mm' : '1.6mm')}`,
                surfaceFinish: formData.surfaceFinish || (formData.baseMaterial === "Flex" ? "ENIG" : "HASL(Leaded)"),
                copperWeight: formData.copperWeight || (formData.baseMaterial === "Flex" ? "0.5 oz" : "1 oz"),
                silkscreen: formData.silkscreen || "White",
                differentDesign: formData.differentDesign || "1",
                deliveryFormat: formData.deliveryFormat || "Single PCB",
                panelColumn: formData.panelColumn || "",
                panelRow: formData.panelRow || "",
                goldThickness: ((formData.surfaceFinish || (formData.baseMaterial === "Flex" ? "ENIG" : "HASL(Leaded)")) === "ENIG" || formData.baseMaterial === "Flex") ? (formData.goldThickness && formData.goldThickness !== "N/A" && formData.goldThickness !== "1 U*" ? formData.goldThickness : "1 U\"") : "N/A",
                viaCovering: formData.viaCovering || "Not Specified",
                viaPlating: formData.viaPlating || "Not Specified",
                minHole: formData.minHole || "0.3mm/(0.4/0.45mm)",
                confirmFile: formData.confirmFile || "No",
                markOnPcb: formData.markOnPcb || "",
                elecTest: formData.baseMaterial === "Rogers" ? "Flying Probe Fully Test" : (formData.elecTest || ""),
                goldFingers: formData.goldFingers || "No",
                castellated: formData.castellated || "No",
                edgePlating: formData.edgePlating || "No",
                blindSlots: formData.blindSlots || "No",
                ulMarking: formData.ulMarking || "No",
                humidity: formData.humidity || "No",
                kelvinTest: formData.kelvinTest || "No",
                paperBetween: formData.paperBetween || "No",
                appearanceQuality: formData.appearanceQuality || "IPC Class 2 Standard",
                silkscreenTech: formData.silkscreenTech || "Ink-jet Printing Silkscreen",
                inspectionReport: formData.inspectionReport || "No",
                pcbRemark: formData.pcbRemark || "",
                ...(formData.substrateType ? { substrateType: formData.substrateType } : {}),
                ...(formData.coverlayColor ? { coverlayColor: formData.coverlayColor } : {}),
                ...(formData.coverlayThickness ? { coverlayThickness: formData.coverlayThickness } : {}),
                ...(formData.copperType ? { copperType: formData.copperType } : {}),
                ...(formData.stiffener ? { stiffener: formData.stiffener } : {}),
                ...(formData.emiShielding ? { emiShielding: formData.emiShielding } : {}),
                ...(formData.cuttingMethod ? { cuttingMethod: formData.cuttingMethod } : {}),
                ...(formData.edaSoftware ? { edaSoftware: formData.edaSoftware } : {}),
                ...(formData.silkscreenOnStiffener ? { silkscreenOnStiffener: formData.silkscreenOnStiffener } : {})
            };

            let updatedCart: any[];
            if (editingCartItemId) {
                const existingIndex = existingCart.findIndex((it: any) => String(it.id) === String(editingCartItemId));
                if (existingIndex !== -1) {
                    updatedCart = [...existingCart];
                    updatedCart[existingIndex] = { ...existingCart[existingIndex], ...newItem, id: editingCartItemId };
                } else {
                    updatedCart = [...existingCart, newItem];
                }
            } else {
                updatedCart = [...existingCart, newItem];
            }

            await saveCartToBackend(updatedCart);
            setToast({ message: editingCartItemId ? "Cart item updated!" : "Item saved to cart!", type: "success" });
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
                {editingCartItemId && (
                    <div className="mb-4 bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-sm animate-in fade-in">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Editing Cart Item</p>
                                <p className="text-sm font-extrabold text-amber-950">{editingCartItemName || "PCB Board"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-amber-700 font-medium hidden md:inline">Make changes below and click UPDATE CART</span>
                            <Link href="/cart" className="px-3 py-1.5 bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-all">
                                Cancel Edit
                            </Link>
                        </div>
                    </div>
                )}
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
                                    <div className="bg-[#f0f4f8] rounded-2xl p-4 sm:p-6 flex items-center justify-center border border-gray-100 min-h-[260px] sm:min-h-[340px] max-h-[380px] overflow-hidden">
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
                            <div className="p-5 space-y-4 bg-white">

                                {/* Sticky Notes Board Delivery Calendar */}
                                {(() => {
                                    const { next20Days, calendarHeaderTitle, selectedDayData } = quoteCalculation;
                                    const hasValidGerber = !!uploadedFile && detectedInfo?.layers !== "0" && (!!topSvg || !!bottomSvg || previewLoading);

                                    if (isJlcpcbRequired(formData) && isJlcpcbLoading) {
                                        return (
                                            <div className="space-y-4 animate-pulse">
                                                <div className="bg-[#8DD3A5]/15 dark:bg-[#0F7438]/20 p-5 rounded-2xl border border-[#41A96A]/30 space-y-3">
                                                    <div className="flex justify-between items-center pb-2 border-b border-[#41A96A]/20">
                                                        <div className="h-4 w-36 bg-slate-300 dark:bg-slate-700 rounded" />
                                                        <div className="h-5 w-24 bg-slate-300 dark:bg-slate-700 rounded-md" />
                                                    </div>
                                                    <div className="flex justify-center py-2">
                                                        <div className="w-36 h-28 bg-slate-300 dark:bg-slate-700 rounded-xl" />
                                                    </div>
                                                </div>

                                                <div className="bg-[#8DD3A5]/10 border border-[#41A96A]/30 rounded-xl p-4 space-y-3">
                                                    <div className="h-4 w-full bg-slate-300 dark:bg-slate-700 rounded" />
                                                    <div className="h-4 w-3/4 bg-slate-300 dark:bg-slate-700 rounded" />
                                                    <div className="h-4 w-1/2 bg-slate-300 dark:bg-slate-700 rounded" />
                                                    <div className="h-8 w-full bg-slate-300 dark:bg-slate-700 rounded-lg" />
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (isJlcpcbRequired(formData) && jlcpcbError) {
                                        return (
                                            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-center space-y-3">
                                                <p className="text-xs font-bold text-red-600 dark:text-red-400">
                                                    {jlcpcbError || "Unable to calculate PCB price."}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setQuoteTrigger(prev => prev + 1)}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer"
                                                >
                                                    Try Again
                                                </button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-4">
                                            <div className="bg-[#8DD3A5]/15 dark:bg-[#0F7438]/20 p-3 sm:p-4 rounded-2xl border border-[#41A96A]/30 shadow-inner relative overflow-hidden">
                                                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[#41A96A]/20 dark:border-[#69C48A]/30 relative z-10 gap-2">
                                                    <div className="min-w-0">
                                                        <h3 className="text-xs sm:text-sm font-bold text-[#0F7438] dark:text-[#8DD3A5] uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                                                             <span className="w-2 h-2 rounded-full bg-[#238E4E] inline-block ring-2 ring-[#8DD3A5]/50 shrink-0" />
                                                            <span>Select Delivery Date</span>
                                                        </h3>
                                                        <p className="text-[10px] sm:text-[11px] text-[#238E4E] dark:text-[#69C48A] font-medium mt-0.5 whitespace-nowrap">
                                                            Prices are per order
                                                        </p>
                                                    </div>
                                                    <div className="bg-white dark:bg-[#0F7438]/80 text-[#0F7438] dark:text-[#8DD3A5] px-2.5 py-1 rounded-md text-xs font-bold shadow-xs border border-[#69C48A]/60 dark:border-[#41A96A]/60 flex items-center gap-1 whitespace-nowrap shrink-0">
                                                        <span>{calendarHeaderTitle}</span>
                                                    </div>
                                                </div>

                                                <div className={isJlcpcbRequired(formData) ? "flex justify-center max-w-[180px] mx-auto relative z-10" : "grid grid-cols-5 gap-1.5 sm:gap-2 relative z-10"}>
                                                    {next20Days.map((item, idx) => {
                                                        const isSelected = selectedDayData?.day === item.day;
                                                        const stickyColors = [
                                                            { bg: "bg-[#8DD3A5]/20", border: "border-[#8DD3A5]", text: "text-[#0F7438]", subtext: "text-[#0F7438]", pin: "bg-[#0F7438]", activeBg: "bg-[#8DD3A5]/50" },
                                                            { bg: "bg-[#69C48A]/20", border: "border-[#69C48A]", text: "text-[#0F7438]", subtext: "text-[#0F7438]", pin: "bg-[#238E4E]", activeBg: "bg-[#69C48A]/50" },
                                                            { bg: "bg-[#41A96A]/15", border: "border-[#41A96A]/60", text: "text-[#0F7438]", subtext: "text-[#0F7438]", pin: "bg-[#41A96A]", activeBg: "bg-[#41A96A]/40" },
                                                            { bg: "bg-[#8DD3A5]/30", border: "border-[#69C48A]", text: "text-[#0F7438]", subtext: "text-[#0F7438]", pin: "bg-[#238E4E]", activeBg: "bg-[#8DD3A5]/60" },
                                                            { bg: "bg-[#69C48A]/15", border: "border-[#8DD3A5]/80", text: "text-[#0F7438]", subtext: "text-[#0F7438]", pin: "bg-[#0F7438]", activeBg: "bg-[#69C48A]/40" },
                                                        ];
                                                        const color = stickyColors[idx % stickyColors.length];
                                                        const rotations = ["rotate-[-1.5deg]", "rotate-[1deg]", "rotate-[-0.5deg]", "rotate-[2deg]", "rotate-[-1deg]"];
                                                        const rotation = rotations[idx % rotations.length];

                                                        if (item.isSunday) {
                                                            return (
                                                                <div
                                                                    key={item.day}
                                                                    aria-disabled="true"
                                                                    title={`${item.formattedDate} - Sunday - Unavailable`}
                                                                    className={`relative flex flex-col items-center justify-between px-1 py-1.5 sm:px-1.5 sm:py-2 rounded-md select-none aspect-square shadow-2xs opacity-80 bg-slate-100 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 cursor-not-allowed ${rotation}`}
                                                                >
                                                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20">
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-white/80 shadow-2xs" />
                                                                    </div>
                                                                    <span className="text-[8.5px] sm:text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 leading-none mt-0.5">{item.weekday}</span>
                                                                    <span className="text-xs sm:text-sm font-extrabold my-0.5 leading-tight text-slate-600 dark:text-slate-300">{item.dateNum}</span>
                                                                    <div className="flex flex-col items-center leading-none pb-0.5">
                                                                        <span className="text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-tight text-slate-500 bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded-xs">Sunday</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        if (item.isHoliday) {
                                                            return (
                                                                <div
                                                                    key={item.day}
                                                                    aria-disabled="true"
                                                                    title={`${item.formattedDate} - ${item.holidayName} - Holiday`}
                                                                    className={`relative flex flex-col items-center justify-between px-1 py-1.5 sm:px-1.5 sm:py-2 rounded-md select-none aspect-square shadow-2xs bg-amber-50 dark:bg-amber-950/30 border border-amber-400/80 dark:border-amber-600/60 cursor-not-allowed ${rotation}`}
                                                                >
                                                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20">
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white/80 shadow-2xs" />
                                                                    </div>
                                                                    <span className="text-[8.5px] sm:text-[9px] font-bold uppercase text-amber-700 dark:text-amber-400 leading-none mt-0.5">{item.weekday}</span>
                                                                    <span className="text-[9px] sm:text-[9.5px] font-bold my-0.5 leading-tight text-amber-900 dark:text-amber-200 text-center truncate max-w-full px-0.5" title={item.holidayName || "Holiday"}>
                                                                        {item.holidayName || "Holiday"}
                                                                    </span>
                                                                    <div className="flex flex-col items-center leading-none pb-0.5">
                                                                        <span className="text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-tight text-amber-800 dark:text-amber-300 bg-amber-200/80 dark:bg-amber-900/60 px-1 py-0.5 rounded-xs">Holiday</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        if (item.isUnavailable) {
                                                            return (
                                                                <div
                                                                    key={item.day}
                                                                    aria-disabled="true"
                                                                    title={`${item.formattedDate} - Unavailable for this order area`}
                                                                    className={`relative flex flex-col items-center justify-between px-1 py-1.5 sm:px-1.5 sm:py-2 rounded-md select-none aspect-square shadow-2xs opacity-60 bg-gray-100 dark:bg-slate-800/40 border border-gray-300 dark:border-slate-700 cursor-not-allowed ${rotation}`}
                                                                >
                                                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20">
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-white/80 shadow-2xs" />
                                                                    </div>
                                                                    <span className="text-[8.5px] sm:text-[9px] font-bold uppercase text-gray-400 leading-none mt-0.5">{item.weekday}</span>
                                                                    <span className="text-xs sm:text-sm font-extrabold my-0.5 leading-tight text-gray-400 line-through">{item.dateNum}</span>
                                                                    <div className="flex flex-col items-center leading-none pb-0.5"></div>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div
                                                                key={item.day}
                                                                onClick={() => setSelectedDay(item.day)}
                                                                className={`relative flex flex-col items-center justify-between px-1 py-1.5 sm:px-1.5 sm:py-2 rounded-md transition-all duration-200 cursor-pointer select-none aspect-square shadow-sm ${rotation} ${isSelected
                                                                    ? `${color.activeBg} ring-2 ring-[#238E4E] border-2 border-[#0F7438] scale-[1.06] z-20 shadow-md rotate-0`
                                                                    : `${color.bg} border ${color.border} hover:scale-[1.03] hover:rotate-0 hover:z-10 hover:shadow-md`
                                                                    }`}
                                                            >
                                                                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20">
                                                                    <div className={`w-2.5 h-2.5 rounded-full ${color.pin} border border-white/80 shadow-xs`} />
                                                                </div>

                                                                <span className="text-[8.5px] sm:text-[9px] font-bold uppercase text-[#0F7438]/80 dark:text-[#8DD3A5]/80 leading-none mt-0.5">{item.weekday}</span>
                                                                <span className={`text-xs sm:text-sm font-extrabold my-0.5 leading-tight ${color.text}`}>{item.dateNum}</span>
                                                                <span className={`text-[8.5px] sm:text-[9.5px] font-bold ${color.subtext} leading-none pb-0.5 tracking-tight whitespace-nowrap text-center max-w-full inline-block`}>
                                                                    {formatPrice(item.orderValue)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Shipping Options & Total Calculation */}
                                            {(() => {
                                                const {
                                                    shippingOptions,
                                                    activeShipping,
                                                    chargedWeightKg,
                                                    totalAreaInSqM,
                                                    estimatedWeightKg,
                                                    shippingCharge,
                                                    pcbPrice,
                                                    gstPercentage,
                                                    taxableTotal,
                                                    gstAmount,
                                                    mainTotal,
                                                    isJLCPCB
                                                } = quoteCalculation;

                                                return (
                                                    <div className="space-y-3">
                                                        {isJLCPCB && jlcpcbQuote?.normalized_quote && (
                                                            <ChargeDetails
                                                                normalizedQuote={jlcpcbQuote.normalized_quote}
                                                                currencySymbol="$"
                                                            />
                                                        )}
                                                        <div className="bg-[#8DD3A5]/10 border border-[#41A96A]/30 rounded-xl p-3.5 shadow-2xs space-y-3">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-600 dark:text-slate-300 font-semibold">Total Area:</span>
                                                            <span className="font-extrabold text-[#0F7438] dark:text-[#8DD3A5]">
                                                                {totalAreaInSqM.toFixed(2)} m²
                                                                <span className="text-[10px] font-normal text-slate-500"> ({estimatedWeightKg} kg est.{estimatedWeightKg < 1 ? ' → 1 kg min' : ''})</span>
                                                            </span>
                                                        </div>

                                                        {/* Shipping Option Selection */}
                                                        <div className="pt-2 border-t border-[#41A96A]/20 space-y-2">
                                                            <div className="flex justify-between items-center text-xs font-bold text-[#0F7438] dark:text-[#8DD3A5]">
                                                                <span>Shipping Method</span>
                                                                <span className="text-[10px] font-medium text-slate-500">Select delivery method</span>
                                                            </div>

                                                            <div className="bg-[#8DD3A5]/15 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-[#41A96A]/25 grid grid-cols-3 gap-2">
                                                                {shippingOptions.map((opt: any) => {
                                                                    const charge = Math.round(opt.rate * chargedWeightKg);
                                                                    const isSelected = shippingOptionKey === opt.key;
                                                                    const title = (!opt.method || opt.location === opt.method) ? (opt.location || opt.method) : `${opt.location} - ${opt.method}`;

                                                                    return (
                                                                        <label
                                                                            key={opt.key}
                                                                            onClick={() => setShippingOptionKey(opt.key)}
                                                                            className={`flex items-start gap-2 p-2 rounded-xl transition-all cursor-pointer select-none ${isSelected
                                                                                ? "bg-white/90 dark:bg-slate-700/80 shadow-2xs border border-[#238E4E]"
                                                                                : "bg-white/40 dark:bg-slate-800/40 border border-transparent hover:bg-white/60"
                                                                                }`}
                                                                        >
                                                                            <input
                                                                                type="radio"
                                                                                name="shippingOption"
                                                                                checked={isSelected}
                                                                                onChange={() => setShippingOptionKey(opt.key)}
                                                                                className="w-4 h-4 mt-0.5 text-[#238E4E] focus:ring-[#238E4E] accent-[#238E4E] cursor-pointer shrink-0"
                                                                            />
                                                                            <div className="flex flex-col min-w-0">
                                                                                <span className={`text-xs font-bold leading-tight ${isSelected ? "text-[#0F7438] dark:text-[#8DD3A5]" : "text-slate-800 dark:text-slate-200"}`}>
                                                                                    {title}
                                                                                </span>
                                                                                <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? "text-[#0F7438]" : "text-slate-600 dark:text-slate-300"}`}>
                                                                                    +₹{charge} <span className="font-normal text-slate-400 text-[9px]">(₹{opt.rate}/kg)</span>
                                                                                </span>
                                                                            </div>
                                                                        </label>
                                                                    );
                                                                })}
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
                                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatPrice(pcbPrice)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-slate-600 dark:text-slate-300 font-semibold">Delivery Charges:</span>
                                                                    <span className="font-bold text-slate-700 dark:text-slate-300">₹{shippingCharge.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-slate-600 dark:text-slate-300 font-semibold">GST ({gstPercentage}%):</span>
                                                                    <span className="font-bold text-slate-700 dark:text-slate-300">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                </div>
                                                                <div className="flex justify-between items-baseline pt-1 border-t border-dashed border-[#41A96A]/30">
                                                                    <span className="text-slate-800 dark:text-slate-200 text-xs font-black">Main Total:</span>
                                                                    <span className="text-xl font-black text-[#0F7438] dark:text-[#69C48A]">
                                                                        {formatPrice(mainTotal)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="pt-2 border-t border-[#41A96A]/20 space-y-2">
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-slate-600 dark:text-slate-300 font-semibold">Delivery Charges:</span>
                                                                    <span className="font-bold text-slate-700 dark:text-slate-300">₹{shippingCharge.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                                                </div>
                                                                <div className="text-center pt-1 text-xs font-semibold text-slate-500 italic border-t border-[#41A96A]/10">
                                                                    Tap on any sticky note above to pick a delivery date.
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                            })()}
                                        </div>
                                    );
                                })()}

                                {(() => {
                                    const hasValidDimensions = (parseFloat(formData.width) || 0) > 0 && (parseFloat(formData.height) || 0) > 0 && (parseInt(formData.qty, 10) || 0) > 0;
                                    const hasSelectedDelivery = selectedDay !== null && selectedDay !== undefined;
                                    const hasRequiredSpecs = Boolean(formData.layers && formData.thickness && formData.surfaceFinish && formData.copperWeight);

                                    const layersCount = parseInt(formData.layers, 10) || 1;
                                    const isJlcValid = !isJlcpcbRequired(formData) || (!isJlcpcbLoading && !jlcpcbError && !!jlcpcbQuote);
                                    const isCanSaveToCart = hasValidDimensions && hasSelectedDelivery && hasRequiredSpecs && isJlcValid;

                                    let validationMessage = "";
                                    if (!hasValidDimensions) {
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
                                                    <span>{editingCartItemId ? "UPDATE CART" : "SAVE TO CART"}</span>
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
