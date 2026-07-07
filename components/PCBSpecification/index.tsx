"use client";

import React, { useState } from "react";
import { ShoppingCart, ChevronDown, ChevronUp, Cpu, Layers } from "lucide-react";
import GerberUploader from "../GerberUploader";
import GerberPreview from "../GerberPreview";
import QuoteForm from "../QuoteForm";
import { GerberFile, PCBInfo, QuoteFormData, UploadResponse, ParsedGerberFile } from "../../lib/gerber/types";

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
    assemblyOn: false,
    stencilOn: false,
    buildTime: "2 days"
};

export default function PCBSpecification() {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [gerberFiles, setGerberFiles] = useState<GerberFile[]>([]);
    const [parsedGerberFiles, setParsedGerberFiles] = useState<ParsedGerberFile[]>([]);
    const [pcbInfo, setPcbInfo] = useState<PCBInfo | null>(null);

    const [formData, setFormData] = useState<QuoteFormData>(INITIAL_FORM_DATA);
    const [specsOpen, setSpecsOpen] = useState(true);
    const [highSpecsOpen, setHighSpecsOpen] = useState(false);

    // Dynamic price calculation
    const calculatePrice = () => {
        const qty = parseInt(formData.qty) || 5;
        const layers = parseInt(formData.layers) || 2;
        const width = parseFloat(formData.width) || 100;
        const height = parseFloat(formData.height) || 100;

        let basePrice = 2.0; // Special Offer base

        // Scale price with dimensions and layer count
        const area = (width * height) / 10000; // sq dm
        if (area > 1) {
            basePrice += (area - 1) * 3.5 * layers;
        }

        // Layer multiplier
        if (layers > 2) basePrice += (layers - 2) * 8.0;

        // Qty factor
        if (qty > 5) {
            basePrice += (qty - 5) * 1.25;
        }

        // High spec add-ons
        if (formData.viaCovering !== "Not Specified") basePrice += 16.5;
        if (formData.goldFingers === "Yes") basePrice += 20.0;
        if (formData.copperWeight !== "1oz") basePrice += 10.0;

        if (formData.assemblyOn) basePrice += 30.0;
        if (formData.stencilOn) basePrice += 9.5;

        if (formData.buildTime === "24 hours") basePrice += 14.0;

        return basePrice.toFixed(2);
    };

    const handleUploadSuccess = (res: UploadResponse, file: File) => {
        setUploadedFile(file);

        // Match response to mock format or parsed Gerber Files array
        if (res.info) {
            setPcbInfo(res.info);
            // Sync form details
            setFormData(prev => ({
                ...prev,
                layers: res.info!.layers.toString(),
                width: res.info!.width.toString(),
                height: res.info!.height.toString(),
                unit: "mm"
            }));
        }

        // Convert the files list to files metadata
        if (res.files) {
            const mappedFiles = res.files.map(f => ({
                name: f.name,
                type: f.type as any
            }));
            setGerberFiles(mappedFiles);
        }

        if (res.parsedGerberFiles) {
            setParsedGerberFiles(res.parsedGerberFiles);
        }
    };

    const handleReset = () => {
        setUploadedFile(null);
        setGerberFiles([]);
        setParsedGerberFiles([]);
        setPcbInfo(null);
        setFormData(INITIAL_FORM_DATA);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm backdrop-blur">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/images/logo.png" alt="Megabyte Circuit Logo" className="h-16 w-auto object-contain" />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary cursor-pointer">
                            <span>USD</span>
                            <ChevronDown className="w-4 h-4" />
                        </div>
                        <button className="relative p-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-slate-700">
                            <ShoppingCart className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 bg-[#f5821f] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                0
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main grid */}
            <main className="max-w-[1400px] mx-auto px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Quote Section */}
                    <div className="flex-1 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-6">
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">Online PCB Quote</h1>
                                <p className="text-xs text-slate-400 mt-1">Upload files to auto-detect board layers, sizes, and specs.</p>
                            </div>

                            <GerberUploader onUploadSuccess={handleUploadSuccess} onReset={handleReset} />

                            {uploadedFile && pcbInfo && (
                                <GerberPreview parsedFiles={parsedGerberFiles} info={pcbInfo} pcbColor={formData.pcbColor} />
                            )}

                            <QuoteForm
                                formData={formData}
                                setFormData={setFormData}
                                specsOpen={specsOpen}
                                setSpecsOpen={setSpecsOpen}
                                highSpecsOpen={highSpecsOpen}
                                setHighSpecsOpen={setHighSpecsOpen}
                            />
                        </div>
                    </div>

                    {/* Right Quote Cost Summary */}
                    <div className="w-full lg:w-[380px] shrink-0">
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg sticky top-24 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h2 className="text-[16px] font-bold text-slate-800">Charge Details</h2>
                                <ChevronUp className="w-5 h-5 text-slate-500" />
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="flex justify-between text-sm text-slate-500 font-semibold">
                                    <span>Special Offer Base</span>
                                    <span className="text-slate-800">$2.00</span>
                                </div>

                                {formData.viaCovering !== "Not Specified" && (
                                    <div className="flex justify-between text-sm text-slate-500 font-semibold">
                                        <span>Via Covering Add-on</span>
                                        <span className="text-slate-800">$16.50</span>
                                    </div>
                                )}

                                {formData.goldFingers === "Yes" && (
                                    <div className="flex justify-between text-sm text-slate-500 font-semibold">
                                        <span>Gold Finger Finish</span>
                                        <span className="text-slate-800">$20.00</span>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100">
                                    <span className="text-sm font-semibold text-slate-500">PCB Build Time</span>
                                    <div className="space-y-2.5 mt-3">
                                        {["2 days", "24 hours"].map(time => (
                                            <label
                                                key={time}
                                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${formData.buildTime === time
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-slate-200 hover:border-primary/50 text-slate-700"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="buildTimeRight"
                                                        checked={formData.buildTime === time}
                                                        onChange={() => setFormData(prev => ({ ...prev, buildTime: time }))}
                                                        className="w-4 h-4 text-primary cursor-pointer"
                                                    />
                                                    <span className="text-xs font-bold capitalize">{time}</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-800">
                                                    {time === "2 days" ? "$0.00" : "$14.00"}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-slate-400 font-semibold">Calculated Price</span>
                                        <div className="text-3xl font-extrabold text-primary mt-0.5">${calculatePrice()}</div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 max-w-[140px] text-right font-medium leading-normal">
                                        *Additional charge may apply for custom specifications
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="w-full h-12 bg-primary hover:bg-secondary text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-sm"
                                >
                                    SAVE TO CART
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
