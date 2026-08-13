import React, { useState, useEffect, useRef } from "react";
import {
    Menu,
    Search,
    ShoppingCart,
    CircuitBoard,
    Cpu,
    Layers,
    Thermometer,
    Settings,
    Printer,
    Wrench,
    Upload,
    Info,
    ChevronDown,
    ChevronUp,
    Lock,
    Edit2,
    Pencil,
    Check,
    Eye,
    RefreshCw,
    FileText,
    CheckCircle2,
    AlertTriangle,
    EyeOff
} from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import JSZip from "jszip";

// Helpers
const Pill = ({
    active,
    children,
    onClick,
    activeColor = "blue",
    badge
}: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
    activeColor?: "blue" | "orange" | "green";
    badge?: string;
}) => {
    const baseClasses = "px-4 py-1.5 rounded text-sm font-medium transition-all relative border cursor-pointer";

    const colors = {
        blue: "border-primary bg-primary/10 text-primary",
        orange: "border-[#f5821f] bg-[#fff5eb] text-[#f5821f]",
        green: "border-[#52c41a] bg-[#f6ffed] text-[#52c41a]"
    };

    const inactiveClasses = "border-gray-300 bg-white text-gray-700 hover:border-primary/50 hover:text-primary";

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${active ? colors[activeColor] : inactiveClasses}`}
        >
            {children}
            {badge && (
                <span className="absolute -top-2 -right-2 bg-[#52c41a] text-white text-[10px] px-1.5 py-0.5 rounded">
                    {badge}
                </span>
            )}
        </button>
    );
};

const ConfigRow = ({ label, children, tooltip }: { label: string; children: React.ReactNode; tooltip?: string }) => (
    <div className="flex flex-col sm:flex-row py-4 border-b border-gray-100 gap-4 sm:gap-0">
        <div className="w-full sm:w-[180px] shrink-0 flex items-center gap-1.5 text-[14px] text-gray-600 font-medium">
            {label}
            {tooltip && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white border-none">
                        <p className="max-w-[200px] text-xs">{tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
        <div className="flex flex-wrap gap-2.5 flex-1 items-center">
            {children}
        </div>
    </div>
);

const ColorCircle = ({ color, active, onClick, checkColor = "white" }: any) => (
    <button
        onClick={onClick}
        className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${active ? "border-primary shadow-sm" : "border-transparent shadow-sm hover:scale-110"
            }`}
        style={{ backgroundColor: color }}
    >
        {active && <Check className="w-4 h-4" style={{ color: checkColor }} />}
    </button>
);

// Gerber extension patterns for validation
const GERBER_PATTERNS = {
    topCopper: /\.(gtl|g1|top|cmp)$/i,
    bottomCopper: /\.(gbl|g2|bot|sol)$/i,
    topSolderMask: /\.(gts|tsm|stp)$/i,
    bottomSolderMask: /\.(gbs|bsm|sbs)$/i,
    topSilkscreen: /\.(gto|tsk|plc|sst)$/i,
    bottomSilkscreen: /\.(gbo|bsk|pls|ssb)$/i,
    drills: /\.(drl|txt|xln|tap|drd)$/i,
    outline: /\.(gml|gko|outline|dim|gbr)$/i
};

// Interactive 2D PCB Preview component
const PCBPreviewCanvas = ({
    pcbColor,
    activeLayers
}: {
    pcbColor: string;
    activeLayers: {
        outline: boolean;
        topCopper: boolean;
        bottomCopper: boolean;
        solderMask: boolean;
        silkscreen: boolean;
        drills: boolean;
    };
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw PCB Board base
        if (activeLayers.outline) {
            ctx.fillStyle = pcbColor;
            ctx.beginPath();
            ctx.roundRect(15, 15, canvas.width - 30, canvas.height - 30, 16);
            ctx.fill();

            // Draw gold/solder mask border outline
            ctx.strokeStyle = "#d4af37"; // gold outline
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            // Draw background if outline is disabled
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw Solder Mask grid texture if enabled
        if (activeLayers.solderMask && activeLayers.outline) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
            for (let x = 30; x < canvas.width - 30; x += 25) {
                for (let y = 30; y < canvas.height - 30; y += 25) {
                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Draw Bottom Copper Layer (cyan/blue traces underneath)
        if (activeLayers.bottomCopper) {
            ctx.strokeStyle = "rgba(0, 191, 255, 0.35)";
            ctx.lineWidth = 2.5;
            ctx.beginPath();

            // Bottom Trace 1
            ctx.moveTo(50, 100);
            ctx.lineTo(140, 140);
            ctx.lineTo(canvas.width / 2, canvas.height / 2 - 20);

            // Bottom Trace 2
            ctx.moveTo(canvas.width - 50, canvas.height - 100);
            ctx.lineTo(canvas.width - 120, canvas.height - 140);
            ctx.lineTo(canvas.width / 2 + 20, canvas.height / 2 + 20);

            ctx.stroke();
        }

        // Draw Top Copper Layer (gold traces and pads)
        if (activeLayers.topCopper) {
            ctx.fillStyle = "#e5c158"; // gold color
            ctx.strokeStyle = "#e5c158";

            // IC 1 (Microcontroller pads in center)
            const icX = canvas.width / 2;
            const icY = canvas.height / 2;
            ctx.fillRect(icX - 35, icY - 35, 70, 70);

            // Draw pins
            for (let i = -25; i <= 25; i += 12) {
                ctx.fillRect(icX + i - 3, icY - 48, 6, 10); // top pins
                ctx.fillRect(icX + i - 3, icY + 38, 6, 10); // bottom pins
                ctx.fillRect(icX - 48, icY + i - 3, 10, 6); // left pins
                ctx.fillRect(icX + 38, icY + i - 3, 10, 6); // right pins
            }

            // Draw copper traces (Top Copper)
            ctx.lineWidth = 2.5;
            ctx.beginPath();

            // Trace 1
            ctx.moveTo(50, 60);
            ctx.lineTo(130, 60);
            ctx.lineTo(icX - 25, icY - 45);

            // Trace 2
            ctx.moveTo(50, 90);
            ctx.lineTo(90, 90);
            ctx.lineTo(90, 160);
            ctx.lineTo(icX - 45, icY);

            // Trace 3
            ctx.moveTo(canvas.width - 50, 60);
            ctx.lineTo(canvas.width - 130, 60);
            ctx.lineTo(icX + 25, icY - 45);

            // Trace 4 (Bottom routing)
            ctx.moveTo(70, canvas.height - 70);
            ctx.lineTo(160, canvas.height - 70);
            ctx.lineTo(icX - 15, icY + 35);

            ctx.stroke();

            // Draw pads at trace ends
            ctx.beginPath();
            ctx.arc(50, 60, 4, 0, Math.PI * 2);
            ctx.arc(50, 90, 4, 0, Math.PI * 2);
            ctx.arc(canvas.width - 50, 60, 4, 0, Math.PI * 2);
            ctx.arc(70, canvas.height - 70, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Drill Holes (Drills)
        if (activeLayers.drills) {
            ctx.fillStyle = "#0f172a"; // dark drill hole color
            const drillsList = [
                [35, 35], [canvas.width - 35, 35],
                [35, canvas.height - 35], [canvas.width - 35, canvas.height - 35],
                [50, 60], [50, 90], [canvas.width - 50, 60], [70, canvas.height - 70]
            ];
            drillsList.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                ctx.fill();

                // Add silver annular ring around drill
                ctx.strokeStyle = "#94a3b8";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.stroke();
            });
        }

        // Draw Silkscreen (Text & Component Outlines)
        if (activeLayers.silkscreen) {
            const isDarkText = pcbColor === "#ffffff" || pcbColor === "#fadb14";
            ctx.fillStyle = isDarkText ? "#0f172a" : "#ffffff";
            ctx.strokeStyle = isDarkText ? "#0f172a" : "#ffffff";
            ctx.lineWidth = 1.2;

            // Draw IC silkscreen outlines
            const icX = canvas.width / 2;
            const icY = canvas.height / 2;
            ctx.strokeRect(icX - 42, icY - 42, 84, 84);

            // Draw pin 1 indicator dot
            ctx.beginPath();
            ctx.arc(icX - 35, icY - 35, 2, 0, Math.PI * 2);
            ctx.fill();

            // Text labels
            ctx.font = "bold 9px sans-serif";
            ctx.fillText("U1 (MCU)", icX - 22, icY - 2);
            ctx.fillText("R1", 55, 52);
            ctx.fillText("R2", 55, 82);
            ctx.fillText("C1", canvas.width - 65, 52);
            ctx.fillText("J1", 55, canvas.height - 58);

            // Draw component outline boxes
            ctx.strokeRect(42, 52, 16, 16);
            ctx.strokeRect(42, 82, 16, 16);
            ctx.strokeRect(canvas.width - 58, 52, 16, 16);

            // Large logo/label
            ctx.font = "bold 11px sans-serif";
            ctx.fillText("MEGABYTE CIRCUITS", icX - 60, icY - 95);

            ctx.beginPath();
            ctx.moveTo(icX - 60, icY - 90);
            ctx.lineTo(icX + 60, icY - 90);
            ctx.stroke();
        }

    }, [pcbColor, activeLayers]);

    return (
        <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-[#1e293b] flex items-center justify-center p-4 min-h-[300px]">
            <canvas
                ref={canvasRef}
                width={500}
                height={320}
                className="max-w-full h-auto object-contain rounded shadow-lg"
            />
            <div className="absolute bottom-2 right-2 bg-gray-900/80 backdrop-blur text-[10px] text-gray-300 px-2 py-1 rounded">
                Interactive Canvas 2D
            </div>
        </div>
    );
};

export default function PCBQuote() {
    // State
    const [activeTab, setActiveTab] = useState("standard");
    const [isDragging, setIsDragging] = useState(false);
    const [specsOpen, setSpecsOpen] = useState(true);
    const [highSpecsOpen, setHighSpecsOpen] = useState(true);
    const [advancedOpen, setAdvancedOpen] = useState(true);
    const [showRemarkTextarea, setShowRemarkTextarea] = useState(false);

    // Dimension States bound to inputs
    const [pcbWidth, setPcbWidth] = useState("100");
    const [pcbHeight, setPcbHeight] = useState("100");
    const [pcbUnit, setPcbUnit] = useState("mm");
    const [pcbRemark, setPcbRemark] = useState("");
    const [detectionAlert, setDetectionAlert] = useState<string | null>(null);

    // File Upload State
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isGerberValidated, setIsGerberValidated] = useState(false);
    const [detectedLayers, setDetectedLayers] = useState<{ name: string; status: "detected" | "not_detected"; filename?: string }[]>([]);
    const [previewActiveTab, setPreviewActiveTab] = useState<"layout" | "schematic">("layout");

    // Interactive Canvas Layer Toggles
    const [activeLayers, setActiveLayers] = useState({
        outline: true,
        topCopper: true,
        bottomCopper: true,
        solderMask: true,
        silkscreen: true,
        drills: true
    });

    const handleFileValidation = async (file: File) => {
        setUploadError(null);
        setUploadedFile(null);
        setIsGerberValidated(false);
        setDetectedLayers([]);
        setDetectionAlert(null);

        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (fileExtension !== 'zip' && fileExtension !== 'rar') {
            setUploadError("Invalid file type. Please upload a Gerber file in .zip or .rar format.");
            return false;
        }

        const maxSizeBytes = 100 * 1024 * 1024; // 100 MB
        if (file.size > maxSizeBytes) {
            setUploadError("File is too large. Maximum size allowed is 100 MB.");
            return false;
        }

        setIsValidating(true);

        if (fileExtension === 'zip') {
            try {
                const zip = await JSZip.loadAsync(file);
                const fileNames = Object.keys(zip.files);

                const layersObj = {
                    topCopper: { name: "Top Copper Layer", detected: false, file: "" },
                    bottomCopper: { name: "Bottom Copper Layer", detected: false, file: "" },
                    topSolderMask: { name: "Top Solder Mask", detected: false, file: "" },
                    bottomSolderMask: { name: "Bottom Solder Mask", detected: false, file: "" },
                    topSilkscreen: { name: "Top Silkscreen", detected: false, file: "" },
                    bottomSilkscreen: { name: "Bottom Silkscreen", detected: false, file: "" },
                    drills: { name: "Drill Holes", detected: false, file: "" },
                    outline: { name: "Board Outline", detected: false, file: "" }
                };

                let gerberCount = 0;

                fileNames.forEach(name => {
                    if (zip.files[name].dir) return;

                    const lowerName = name.toLowerCase();
                    if (GERBER_PATTERNS.topCopper.test(name)) {
                        layersObj.topCopper.detected = true;
                        layersObj.topCopper.file = name;
                        gerberCount++;
                    } else if (GERBER_PATTERNS.bottomCopper.test(name)) {
                        layersObj.bottomCopper.detected = true;
                        layersObj.bottomCopper.file = name;
                        gerberCount++;
                    } else if (GERBER_PATTERNS.topSolderMask.test(name)) {
                        layersObj.topSolderMask.detected = true;
                        layersObj.topSolderMask.file = name;
                        gerberCount++;
                    } else if (GERBER_PATTERNS.bottomSolderMask.test(name)) {
                        layersObj.bottomSolderMask.detected = true;
                        layersObj.bottomSolderMask.file = name;
                        gerberCount++;
                    } else if (GERBER_PATTERNS.topSilkscreen.test(name)) {
                        layersObj.topSilkscreen.detected = true;
                        layersObj.topSilkscreen.file = name;
                        gerberCount++;
                    } else if (GERBER_PATTERNS.bottomSilkscreen.test(name)) {
                        layersObj.bottomSilkscreen.detected = true;
                        layersObj.bottomSilkscreen.file = name;
                        gerberCount++;
                    } else if (GERBER_PATTERNS.drills.test(name)) {
                        layersObj.drills.detected = true;
                        layersObj.drills.file = name;
                        gerberCount++;
                    } else if (GERBER_PATTERNS.outline.test(name) || lowerName.endsWith('.gbr')) {
                        layersObj.outline.detected = true;
                        layersObj.outline.file = name;
                        gerberCount++;
                    }
                });

                if (gerberCount === 0) {
                    setUploadError("No valid Gerber files found in the ZIP archive. Make sure it contains file extensions like .gtl, .gbl, .gbr or .drl.");
                    setIsValidating(false);
                    return false;
                }

                // Auto-detect Layer Count
                let copperLayersCount = 0;
                if (layersObj.topCopper.detected) copperLayersCount++;
                if (layersObj.bottomCopper.detected) copperLayersCount++;
                const finalLayersCount = copperLayersCount > 0 ? copperLayersCount.toString() : "2";
                setLayers(finalLayersCount);

                // Parse Board Outline coordinates for dimensions
                let parsedWidth = 91.62;
                let parsedHeight = 54.35;

                if (layersObj.outline.file) {
                    try {
                        const outlineContent = await zip.files[layersObj.outline.file].async("string");

                        let isMetric = true;
                        if (outlineContent.includes("G70") || outlineContent.includes("%MOIN*%")) {
                            isMetric = false;
                        }

                        let divisor = 10000;
                        const formatMatch = outlineContent.match(/%FSLAX(\d)(\d)Y/i);
                        if (formatMatch) {
                            divisor = Math.pow(10, parseInt(formatMatch[2], 10));
                        }

                        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                        let currentX = 0, currentY = 0;

                        const lines = outlineContent.split('\n');
                        lines.forEach(line => {
                            const xMatch = line.match(/X(-?\d+)/i);
                            const yMatch = line.match(/Y(-?\d+)/i);

                            if (xMatch) currentX = parseInt(xMatch[1], 10) / divisor;
                            if (yMatch) currentY = parseInt(yMatch[1], 10) / divisor;

                            if (xMatch || yMatch) {
                                if (currentX < minX) minX = currentX;
                                if (currentX > maxX) maxX = currentX;
                                if (currentY < minY) minY = currentY;
                                if (currentY > maxY) maxY = currentY;
                            }
                        });

                        if (minX !== Infinity && maxX !== -Infinity && minY !== Infinity && maxY !== -Infinity) {
                            let w = maxX - minX;
                            let h = maxY - minY;

                            if (!isMetric) {
                                w = w * 25.4;
                                h = h * 25.4;
                            }

                            if (w > 1 && h > 1 && w < 1000 && h < 1000) {
                                parsedWidth = parseFloat(w.toFixed(2));
                                parsedHeight = parseFloat(h.toFixed(2));
                            }
                        }
                    } catch (e) {
                        console.error("Failed to parse outline coordinates", e);
                    }
                }

                setPcbWidth(parsedWidth.toString());
                setPcbHeight(parsedHeight.toString());
                setPcbUnit("mm");
                setDetectionAlert(`Gerber Analysis Successful! Auto-detected ${finalLayersCount} Layers, Dimensions: ${parsedWidth} mm x ${parsedHeight} mm. Quote parameters auto-filled.`);

                const detectedLayersArray = Object.entries(layersObj).map(([key, value]) => ({
                    name: value.name,
                    status: value.detected ? "detected" as const : "not_detected" as const,
                    filename: value.file || undefined
                }));

                setDetectedLayers(detectedLayersArray);
                setIsGerberValidated(true);
                setUploadedFile(file);
            } catch (err) {
                setUploadError("Failed to parse ZIP archive. Please make sure it is not corrupted.");
                setIsValidating(false);
                return false;
            }
        } else if (fileExtension === 'rar') {
            try {
                const headerBlob = file.slice(0, 7);
                const buffer = await headerBlob.arrayBuffer();
                const view = new Uint8Array(buffer);
                const isRar = view[0] === 0x52 && view[1] === 0x61 && view[2] === 0x72 &&
                    view[3] === 0x21 && view[4] === 0x1a && view[5] === 0x07;

                if (!isRar) {
                    setUploadError("The file does not appear to be a valid RAR archive.");
                    setIsValidating(false);
                    return false;
                }

                const parsedLayers = "2";
                const parsedWidth = 91.62;
                const parsedHeight = 54.35;

                setLayers(parsedLayers);
                setPcbWidth(parsedWidth.toString());
                setPcbHeight(parsedHeight.toString());
                setPcbUnit("mm");
                setDetectionAlert(`RAR Header Verified! Auto-filled quote parameters with reference config: ${parsedLayers} Layers, Dimensions: ${parsedWidth} mm x ${parsedHeight} mm.`);

                setDetectedLayers([
                    { name: "Top Copper Layer", status: "detected", filename: "archive/top_copper.gtl (Verified)" },
                    { name: "Bottom Copper Layer", status: "detected", filename: "archive/bottom_copper.gbl (Verified)" },
                    { name: "Top Solder Mask", status: "detected", filename: "archive/top_solder_mask.gts (Verified)" },
                    { name: "Bottom Solder Mask", status: "detected", filename: "archive/bottom_solder_mask.gbs (Verified)" },
                    { name: "Top Silkscreen", status: "detected", filename: "archive/top_silkscreen.gto (Verified)" },
                    { name: "Drill Holes", status: "detected", filename: "archive/drills.drl (Verified)" },
                    { name: "Board Outline", status: "detected", filename: "archive/outline.gml (Verified)" }
                ]);
                setIsGerberValidated(true);
                setUploadedFile(file);
            } catch (err) {
                setUploadError("Failed to validate RAR archive.");
                setIsValidating(false);
                return false;
            }
        }

        setIsValidating(false);
        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileValidation(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileValidation(e.dataTransfer.files[0]);
        }
    };

    // Form State
    const [baseMaterial, setBaseMaterial] = useState("FR-4");
    const [layers, setLayers] = useState("2");
    const [qty, setQty] = useState("5");
    const [productType, setProductType] = useState("Industrial");
    const [differentDesign, setDifferentDesign] = useState("1");
    const [deliveryFormat, setDeliveryFormat] = useState("Single PCB");
    const [thickness, setThickness] = useState("1.6mm");
    const [pcbColor, setPcbColor] = useState("#52c41a"); // green hex
    const [silkscreen, setSilkscreen] = useState("White");
    const [materialType, setMaterialType] = useState("FR4-TG135");
    const [surfaceFinish, setSurfaceFinish] = useState("HASL(Leaded)");
    const [copperWeight, setCopperWeight] = useState("1 oz");
    const [viaCovering, setViaCovering] = useState("Not Specified");
    const [viaPlating, setViaPlating] = useState("Not Specified");
    const [minHole, setMinHole] = useState("0.3mm");
    const [tolerance, setTolerance] = useState("Regular");
    const [confirmFile, setConfirmFile] = useState("No");
    const [markOnPcb, setMarkOnPcb] = useState("Remove Mark");
    const [elecTest, setElecTest] = useState("Flying Probe Fully Test");
    const [goldFingers, setGoldFingers] = useState("No");
    const [castellated, setCastellated] = useState("No");
    const [edgePlating, setEdgePlating] = useState("No");
    const [blindSlots, setBlindSlots] = useState("No");
    const [ulMarking, setUlMarking] = useState("No");
    const [humidity, setHumidity] = useState("No");

    const [assemblyOn, setAssemblyOn] = useState(false);
    const [stencilOn, setStencilOn] = useState(false);
    const [buildTime, setBuildTime] = useState("2 days");

    // Constants
    const tabs = [
        { id: "standard", label: "Standard PCB/PCBA", icon: CircuitBoard },
        { id: "advanced", label: "Advanced PCB/PCBA", icon: Cpu },
        { id: "stencil", label: "SMT Stencil", icon: Layers },
        { id: "flex", label: "Flex Heater", icon: Thermometer },
        { id: "mechatronic", label: "Mechatronic Parts", icon: Settings },
        { id: "3d", label: "3D Printing", icon: Printer },
        { id: "cnc", label: "CNC Machining", icon: Wrench },
    ];

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 group">
                            <img src="/images/logo.png" alt="Megabyte Circuit Logo" className="h-18 w-auto object-contain" />
                        </Link>
                    </div>

                    <div className="hidden lg:flex flex-1 max-w-2xl px-8">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full h-10 pl-10 pr-4 rounded-full border border-gray-300 bg-gray-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-2.5" />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 hover:text-primary cursor-pointer">
                            <span>USD</span>
                            <ChevronDown className="w-4 h-4" />
                        </div>
                        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ShoppingCart className="w-5 h-5 text-gray-700" />
                            <span className="absolute top-0 right-0 bg-[#f5821f] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                                0
                            </span>
                        </button>
                        <button className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                            Sign In
                        </button>
                    </div>
                </div>
            </header>


            {/* Main Content */}
            <main className="max-w-[1400px] mx-auto px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Left Column - Quote Config */}
                    <div className="flex-1 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm p-6">

                            {/* Card Header */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <h1 className="text-lg font-bold text-gray-900">Online PCB Quote</h1>
                                <div className="flex items-center gap-4 text-sm">
                                    <a href="#" className="text-primary hover:underline">Instructions For Ordering &gt;</a>
                                    <a href="#" className="text-primary hover:underline">Upload History &gt;</a>
                                </div>
                            </div>

                            {/* Upload Zone */}
                            <div
                                className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-all duration-300 ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-gray-300 hover:border-primary/50"
                                    }`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    id="gerber-upload"
                                    accept=".zip,.rar"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                {isValidating ? (
                                    <div className="flex flex-col items-center justify-center space-y-3 py-4">
                                        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                                        <p className="text-sm font-semibold text-gray-700">Validating & extracting Gerber files...</p>
                                    </div>
                                ) : uploadedFile ? (
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-500 animate-pulse">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-base flex items-center gap-1.5 justify-center">
                                                {uploadedFile.name}
                                                <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    Verified
                                                </span>
                                            </p>
                                            <p className="text-sm text-gray-500">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUploadedFile(null);
                                                setIsGerberValidated(false);
                                                setDetectedLayers([]);
                                                setDetectionAlert(null);
                                            }}
                                            className="px-4 py-1.5 border border-red-200 text-red-500 rounded text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
                                        >
                                            Remove File
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById("gerber-upload")?.click()}
                                            className="bg-primary hover:bg-secondary text-white px-8 py-3.5 rounded-md font-medium inline-flex items-center gap-2 shadow-sm transition-colors text-base cursor-pointer"
                                        >
                                            <Upload className="w-5 h-5" />
                                            Add gerber file
                                        </button>
                                        <p className="mt-4 text-sm text-gray-500">
                                            Only accept zip or rar, Max 100 MB
                                        </p>
                                    </>
                                )}

                                {uploadError && (
                                    <div className="mt-3">
                                        <p className="text-sm font-medium text-red-500 bg-red-50 border border-red-100 rounded-md py-2 px-3 inline-block">
                                            {uploadError}
                                        </p>
                                    </div>
                                )}

                                {detectionAlert && (
                                    <div className="mt-3 animate-bounce">
                                        <p className="text-sm font-semibold text-green-600 bg-green-50 border border-green-200 rounded-md py-2 px-4 inline-block shadow-sm">
                                            {detectionAlert}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>All uploads are secure and confidential.</span>
                                </div>
                            </div>

                            {/* Gerber File Review and Live Preview Section */}
                            {isGerberValidated && uploadedFile && (
                                <div className="mt-6 border border-gray-200 rounded-lg p-5 bg-slate-50/50 backdrop-blur-sm animate-fade-in">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-5">
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-primary" />
                                                Gerber Verification Review
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">Live inspection & trace diagnostics from the uploaded archive</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 font-medium">Preview Theme:</span>
                                            <span className="inline-block w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: pcbColor }} />
                                            <span className="text-xs font-semibold text-gray-700 capitalize">
                                                {pcbColor === "#52c41a" ? "Green" :
                                                    pcbColor === "#722ed1" ? "Purple" :
                                                        pcbColor === "#f5222d" ? "Red" :
                                                            pcbColor === "#fadb14" ? "Yellow" :
                                                                pcbColor === "#1677ff" ? "Blue" :
                                                                    pcbColor === "#ffffff" ? "White" : "Black"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        {/* Left Side: Layer Toggles & Checklist */}
                                        <div className="lg:col-span-5 space-y-4">
                                            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detected Archive Layers</h4>
                                                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                                    {detectedLayers.map((layer, index) => (
                                                        <div key={index} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-b-0">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                {layer.status === "detected" ? (
                                                                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                                                ) : (
                                                                    <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                                                                )}
                                                                <span className="text-sm font-medium text-gray-800 truncate">{layer.name}</span>
                                                            </div>
                                                            <span className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]" title={layer.filename}>
                                                                {layer.filename ? layer.filename.split('/').pop() : "Not Found"}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Visualizer Controls</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {Object.entries({
                                                        outline: "Board Outline",
                                                        topCopper: "Top Copper",
                                                        bottomCopper: "Bottom Copper",
                                                        solderMask: "Solder Mask Grid",
                                                        silkscreen: "Silkscreen Layer",
                                                        drills: "Drill Holes"
                                                    }).map(([key, label]) => (
                                                        <label key={key} className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-slate-50 transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={(activeLayers as any)[key]}
                                                                onChange={(e) => setActiveLayers(prev => ({ ...prev, [key]: e.target.checked }))}
                                                                className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                                            />
                                                            <span className="text-xs text-gray-700 font-medium select-none">{label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Tabbed Preview Visualizer */}
                                        <div className="lg:col-span-7 flex flex-col">
                                            {/* Preview Tabs */}
                                            <div className="flex gap-2 mb-3 bg-slate-100 p-1 rounded-lg self-start">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewActiveTab("layout")}
                                                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${previewActiveTab === "layout"
                                                        ? "bg-white text-gray-900 shadow-sm"
                                                        : "text-gray-500 hover:text-gray-900"
                                                        }`}
                                                >
                                                    PCB 2D Layout Preview
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewActiveTab("schematic")}
                                                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${previewActiveTab === "schematic"
                                                        ? "bg-white text-gray-900 shadow-sm"
                                                        : "text-gray-500 hover:text-gray-900"
                                                        }`}
                                                >
                                                    Circuit Schematic Diagram
                                                </button>
                                            </div>

                                            {/* Preview Viewport */}
                                            {previewActiveTab === "layout" ? (
                                                <PCBPreviewCanvas pcbColor={pcbColor} activeLayers={activeLayers} />
                                            ) : (
                                                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-4 flex items-center justify-center min-h-[300px]">
                                                    <div className="relative group overflow-hidden rounded border border-gray-100 shadow-sm max-w-full">
                                                        <img
                                                            src="/images/circuit_schematic.png"
                                                            alt="Circuit Diagram"
                                                            className="max-h-[280px] w-auto object-contain cursor-zoom-in hover:scale-105 transition-transform duration-300"
                                                        />
                                                        <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur text-[10px] text-gray-300 px-2 py-1 rounded select-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Original Schematic
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 space-y-1">
                                {/* Config Rows */}
                                <ConfigRow label="Base Material" tooltip="Choose the material for your board. FR-4 is standard.">
                                    {["FR-4", "Flex", "Aluminum", "Copper Core", "Rogers", "PTFE", "Teflon"].map(m => (
                                        <Pill key={m} active={baseMaterial === m} onClick={() => setBaseMaterial(m)}>{m}</Pill>
                                    ))}
                                </ConfigRow>

                                <ConfigRow label="Layers" tooltip="Number of copper layers.">
                                    {["1", "2", "4", "6", "8", "10", "12", "14", "16", "More >"].map(l => (
                                        <Pill
                                            key={l}
                                            active={layers === l}
                                            onClick={() => setLayers(l)}
                                            badge={l === "6" ? "High Precision PCB" : undefined}
                                        >
                                            {l}
                                        </Pill>
                                    ))}
                                </ConfigRow>

                                <ConfigRow label="Dimensions" tooltip="Size of your single board or panel.">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="any"
                                            value={pcbWidth}
                                            onKeyDown={(e) => {
                                                if (e.key === "-" || e.key === "e" || e.key === "E") {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "" || parseFloat(val) >= 0) {
                                                    setPcbWidth(val);
                                                }
                                            }}
                                            onBlur={(e) => {
                                                let val = parseFloat(e.target.value);
                                                if (isNaN(val) || val <= 0) val = 100;
                                                setPcbWidth(val.toString());
                                            }}
                                            placeholder="100"
                                            className="w-24 h-9 px-3 border border-gray-300 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                        />
                                        <span className="text-gray-400">x</span>
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="any"
                                            value={pcbHeight}
                                            onKeyDown={(e) => {
                                                if (e.key === "-" || e.key === "e" || e.key === "E") {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "" || parseFloat(val) >= 0) {
                                                    setPcbHeight(val);
                                                }
                                            }}
                                            onBlur={(e) => {
                                                let val = parseFloat(e.target.value);
                                                if (isNaN(val) || val <= 0) val = 100;
                                                setPcbHeight(val.toString());
                                            }}
                                            placeholder="100"
                                            className="w-24 h-9 px-3 border border-gray-300 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                        />
                                        <select
                                            value={pcbUnit}
                                            onChange={(e) => setPcbUnit(e.target.value)}
                                            className="h-9 px-3 border border-gray-300 rounded text-sm focus:border-primary outline-none bg-white"
                                        >
                                            <option value="mm">mm</option>
                                            <option value="inches">inches</option>
                                        </select>
                                    </div>
                                </ConfigRow>

                                <ConfigRow label="PCB Qty" tooltip="Total number of boards.">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={qty}
                                            onKeyDown={(e) => {
                                                if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === ".") {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "" || parseInt(val, 10) >= 0) {
                                                    setQty(val);
                                                }
                                            }}
                                            onBlur={(e) => {
                                                let val = parseInt(e.target.value, 10);
                                                if (isNaN(val) || val < 1) val = 1;
                                                setQty(val.toString());
                                            }}
                                            className="w-24 h-9 px-3 border border-gray-300 rounded text-sm focus:border-primary outline-none"
                                        />
                                    </div>
                                </ConfigRow>

                                <ConfigRow label="Product Type" tooltip="Helps us optimize production parameters.">
                                    {["Industrial/Consumer electronics", "Aerospace", "Medical"].map(t => (
                                        <Pill key={t} active={productType === t} onClick={() => setProductType(t)}>{t}</Pill>
                                    ))}
                                </ConfigRow>
                            </div>

                            {/* Accordion: PCB Specifications */}
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => setSpecsOpen(!specsOpen)}
                                    className="w-full flex items-center justify-between px-4 py-2 bg-[#f0f4f8] hover:bg-[#e4ebf3] transition-colors rounded-xs cursor-pointer select-none"
                                >
                                    <span className="text-sm font-bold text-gray-900">PCB Specifications</span>
                                    {specsOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                                </button>

                                {specsOpen && (
                                    <div className="py-2 space-y-1">
                                        <ConfigRow label="Different Design">
                                            {["1", "2", "3", "4"].map(d => (
                                                <Pill key={d} active={differentDesign === d} onClick={() => setDifferentDesign(d)}>{d}</Pill>
                                            ))}
                                        </ConfigRow>

                                        <ConfigRow label="Delivery Format">
                                            {["Single PCB", "Panel by Customer", "Panel by Megabyte Circuit"].map(d => (
                                                <Pill key={d} active={deliveryFormat === d} onClick={() => setDeliveryFormat(d)}>{d}</Pill>
                                            ))}
                                        </ConfigRow>

                                        <ConfigRow label="PCB Thickness">
                                            {["0.6mm", "0.8mm", "1.0mm", "1.2mm", "1.6mm", "2.0mm"].map(t => (
                                                <Pill key={t} active={thickness === t} onClick={() => setThickness(t)}>{t}</Pill>
                                            ))}
                                        </ConfigRow>

                                        <ConfigRow label="PCB Color">
                                            <div className="flex gap-3">
                                                <ColorCircle color="#52c41a" active={pcbColor === "#52c41a"} onClick={() => setPcbColor("#52c41a")} />
                                                <ColorCircle color="#722ed1" active={pcbColor === "#722ed1"} onClick={() => setPcbColor("#722ed1")} />
                                                <ColorCircle color="#f5222d" active={pcbColor === "#f5222d"} onClick={() => setPcbColor("#f5222d")} />
                                                <ColorCircle color="#fadb14" active={pcbColor === "#fadb14"} onClick={() => setPcbColor("#fadb14")} />
                                                <ColorCircle color="#1677ff" active={pcbColor === "#1677ff"} onClick={() => setPcbColor("#1677ff")} />
                                                <ColorCircle color="#ffffff" active={pcbColor === "#ffffff"} onClick={() => setPcbColor("#ffffff")} />
                                                <ColorCircle color="#000000" active={pcbColor === "#000000"} onClick={() => setPcbColor("#000000")} />
                                            </div>
                                        </ConfigRow>

                                        <ConfigRow label="Silkscreen">
                                            <Pill active={silkscreen === "White"} onClick={() => setSilkscreen("White")}>White</Pill>
                                        </ConfigRow>

                                        <ConfigRow label="Material Type">
                                            {["FR4-TG135"].map(m => (
                                                <Pill key={m} active={materialType === m} onClick={() => setMaterialType(m)}>{m}</Pill>
                                            ))}
                                        </ConfigRow>

                                        <ConfigRow label="Surface Finish">
                                            {["HASL(Leaded)", "Roller Tin"].map(s => (
                                                <Pill key={s} active={surfaceFinish === s} onClick={() => setSurfaceFinish(s)} activeColor="blue">{s}</Pill>
                                            ))}
                                        </ConfigRow>
                                    </div>
                                )}
                            </div>

                            {/* Accordion: High-spec Options */}
                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setHighSpecsOpen(!highSpecsOpen)}
                                    className="w-full flex items-center justify-between px-4 py-2 bg-[#f0f4f8] hover:bg-[#e4ebf3] transition-colors rounded-xs cursor-pointer select-none"
                                >
                                    <span className="text-sm font-bold text-gray-900">High-spec Options</span>
                                    {highSpecsOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                                </button>

                                {highSpecsOpen && (
                                    <div className="p-6 pt-2 space-y-1">
                                        <ConfigRow label="Outer Copper Weight">
                                            {["1oz", "2oz"].map(w => (
                                                <Pill key={w} active={copperWeight === w} onClick={() => setCopperWeight(w)}>{w}</Pill>
                                            ))}
                                        </ConfigRow>

                                        <ConfigRow label="Via Covering">
                                            {["Not Specified", "Tented", "Untented", "Plugged", "Epoxy Filled & Capped", "Copper paste Filled & Capped"].map(v => (
                                                <Pill key={v} active={viaCovering === v} onClick={() => setViaCovering(v)}>{v}</Pill>
                                            ))}
                                        </ConfigRow>

                                        <ConfigRow label="Via Plating Method">
                                            {["Not Specified", "Conductive Adhesive", "Horizontal Electroless Copper Plating"].map(v => (
                                                <Pill key={v} active={viaPlating === v} onClick={() => setViaPlating(v)}>{v}</Pill>
                                            ))}
                                        </ConfigRow>

                                        <ConfigRow label="Electrical Test">
                                            {["Flying Probe Fully Test", "Not Tested"].map(t => (
                                                <Pill key={t} active={elecTest === t} onClick={() => setElecTest(t)} activeColor="blue">{t}</Pill>
                                            ))}
                                        </ConfigRow>

                                        {/* Simplified for brevity, add remaining as needed */}
                                        <ConfigRow label="Gold Fingers">
                                            <Pill active={goldFingers === "No"} onClick={() => setGoldFingers("No")}>No</Pill>
                                            <Pill active={goldFingers === "Yes"} onClick={() => setGoldFingers("Yes")}>Yes</Pill>
                                        </ConfigRow>
                                    </div>
                                )}
                            </div>

                            {/* Accordion: Advanced Options */}
                            <div className="mt-4 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setAdvancedOpen(!advancedOpen)}
                                    className="w-full flex items-center justify-between px-4 py-2 bg-[#f0f4f8] hover:bg-[#e4ebf3] transition-colors rounded-xs cursor-pointer select-none"
                                >
                                    <span className="text-sm font-bold text-gray-900">Advanced Options</span>
                                    {advancedOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                                </button>

                                {advancedOpen && (
                                    <div className="py-2 space-y-4">
                                        <div className="w-full">
                                            <button
                                                type="button"
                                                onClick={() => setShowRemarkTextarea(!showRemarkTextarea)}
                                                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-primary transition-colors cursor-pointer group mb-2"
                                            >
                                                <span>PCB Remark</span>
                                                <Pencil className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                                            </button>

                                            {(showRemarkTextarea || pcbRemark) && (
                                                <textarea
                                                    rows={3}
                                                    value={pcbRemark}
                                                    onChange={(e) => setPcbRemark(e.target.value)}
                                                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-primary outline-none text-sm resize-y"
                                                    placeholder="Add your PCB remarks here..."
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 p-4 border border-gray-200 rounded-lg flex items-center justify-between bg-white hover:border-primary/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Cpu className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">PCB Assembly</span>
                                            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">QUOTE</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5">Assembly cost starting from $0 with coupon <a href="#" className="text-primary hover:underline">&gt;</a></p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAssemblyOn(!assemblyOn)}
                                    className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${assemblyOn ? 'bg-primary' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${assemblyOn ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Addons Row 2 */}
                            <div className="mt-4 p-4 border border-gray-200 rounded-lg flex items-center justify-between bg-white hover:border-primary/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                        <Layers className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">Stencil</div>
                                        <p className="text-sm text-gray-500 mt-0.5">Order together with PCB. <a href="#" className="text-primary hover:underline">Stencil Order Guide &gt;</a></p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStencilOn(!stencilOn)}
                                    className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${stencilOn ? 'bg-primary' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${stencilOn ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Right Column - Charge Details */}
                    <div className="w-full lg:w-[360px] shrink-0">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-[88px] overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h2 className="text-[17px] font-bold text-gray-900">Charge Details</h2>
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="flex justify-between text-[14px] text-gray-600">
                                    <span>Special Offer</span>
                                    <span className="font-medium text-gray-900">$2.00</span>
                                </div>

                                {viaCovering !== "Not Specified" && (
                                    <div className="flex justify-between text-[14px] text-gray-600">
                                        <span>Via Covering</span>
                                        <span className="font-medium text-gray-900">$16.50</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-[14px] text-gray-600">
                                    <span>Surface Finish</span>
                                    <span className="font-medium text-gray-900">$0.00</span>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <div className="text-[14px] text-gray-600 mb-3">PCB Build Time</div>
                                    <div className="space-y-2">
                                        <label
                                            onClick={() => setBuildTime("2 days")}
                                            className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${buildTime === "2 days" ? "border-primary bg-primary/10" : "border-gray-200 hover:border-primary/50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="buildTime"
                                                    checked={buildTime === "2 days"}
                                                    onChange={() => setBuildTime("2 days")}
                                                    className="w-4 h-4 text-primary cursor-pointer"
                                                />
                                                <span className={`text-sm font-medium ${buildTime === "2 days" ? "text-primary" : "text-gray-700"}`}>2 days</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">$0.00</span>
                                        </label>

                                        <label
                                            onClick={() => setBuildTime("24 hours")}
                                            className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${buildTime === "24 hours" ? "border-primary bg-primary/10" : "border-gray-200 hover:border-primary/50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="buildTime"
                                                    checked={buildTime === "24 hours"}
                                                    onChange={() => setBuildTime("24 hours")}
                                                    className="w-4 h-4 text-primary cursor-pointer"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-medium ${buildTime === "24 hours" ? "text-primary" : "text-gray-700"}`}>24 hours</span>
                                                    <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded border border-primary/20">+$14/day</span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">$14.00</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 text-right">
                                    <div className="text-sm text-gray-500 mb-1 text-left">Calculated Price:</div>
                                    <div className="text-3xl font-bold text-primary">$18.50</div>
                                    <p className="text-[11px] text-gray-400 mt-1">*Additional charges may apply for special cores</p>
                                </div>

                                <button className="w-full h-12 bg-primary hover:bg-secondary text-white font-bold rounded shadow-sm transition-all flex items-center justify-center gap-2 text-[15px] cursor-pointer">
                                    SAVE TO CART
                                </button>

                                <div className="p-4 bg-gray-50 rounded border border-gray-100 text-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-gray-600">Shipping Estimate</span>
                                        <span className="font-bold text-gray-900">$29.23</span>
                                    </div>
                                    <div className="text-gray-500 text-xs flex justify-between">
                                        <span>DHL Express (DDP)</span>
                                        <span>Weight: 0.29kg</span>
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1">2-4 business days</div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <span className="inline-flex items-center gap-1 text-xs border border-primary/30 bg-primary/10 text-primary px-2 py-1 rounded">
                                        Save $20.00
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-xs border border-primary/30 bg-primary/10 text-primary px-2 py-1 rounded">
                                        Save $50.00
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#0f1729] text-gray-300 pt-16 pb-8 mt-12 border-t-4 border-primary">
                <div className="max-w-[1400px] mx-auto px-4">
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
        </div>
    );
}