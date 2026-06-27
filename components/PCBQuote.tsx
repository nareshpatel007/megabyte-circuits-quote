import React, { useState } from "react";
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
    Check
} from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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
    const baseClasses = "px-4 py-1.5 rounded text-sm font-medium transition-all relative border";

    const colors = {
        blue: "border-primary bg-[#e6f0ff] text-primary",
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
        className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${active ? "border-primary shadow-sm" : "border-transparent shadow-sm hover:scale-110"
            }`}
        style={{ backgroundColor: color }}
    >
        {active && <Check className="w-4 h-4" style={{ color: checkColor }} />}
    </button>
);

export default function PCBQuote() {
    // State
    const [activeTab, setActiveTab] = useState("standard");
    const [isDragging, setIsDragging] = useState(false);
    const [specsOpen, setSpecsOpen] = useState(true);
    const [highSpecsOpen, setHighSpecsOpen] = useState(false);
    const [advancedOpen, setAdvancedOpen] = useState(false);

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
    const [surfaceFinish, setSurfaceFinish] = useState("HASL(with lead)");
    const [copperWeight, setCopperWeight] = useState("1oz");
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
                <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 group">
                            <CircuitBoard className="w-7 h-7 text-primary" />
                            <span className="text-xl font-bold text-primary tracking-tight">Megabyte Circuit</span>
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
                                <h1 className="text-[22px] font-bold text-gray-900">Online PCB Quote</h1>
                                <div className="flex items-center gap-4 text-sm">
                                    <a href="#" className="text-primary hover:underline">Instructions For Ordering &gt;</a>
                                    <a href="#" className="text-primary hover:underline">Upload History &gt;</a>
                                </div>
                            </div>

                            {/* Upload Zone */}
                            <div
                                className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"
                                    }`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
                            >
                                <button className="bg-primary hover:bg-blue-600 text-white px-8 py-3.5 rounded-md font-medium inline-flex items-center gap-2 shadow-sm transition-colors text-base">
                                    <Upload className="w-5 h-5" />
                                    Add gerber file
                                </button>
                                <p className="mt-4 text-sm text-gray-500">
                                    Only accept zip or rar, Max 100 MB. <a href="#" className="text-primary hover:underline">View example &gt;</a>
                                </p>
                                <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>All uploads are secure and confidential.</span>
                                </div>
                            </div>

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
                                            badge={l === "4" ? "High Precision PCB" : undefined}
                                        >
                                            {l}
                                        </Pill>
                                    ))}
                                </ConfigRow>

                                <ConfigRow label="Dimensions" tooltip="Size of your single board or panel.">
                                    <div className="flex items-center gap-2">
                                        <input type="number" placeholder="100" className="w-24 h-9 px-3 border border-gray-300 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                                        <span className="text-gray-400">x</span>
                                        <input type="number" placeholder="100" className="w-24 h-9 px-3 border border-gray-300 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                                        <select className="h-9 px-3 border border-gray-300 rounded text-sm focus:border-primary outline-none bg-white">
                                            <option>mm</option>
                                            <option>inches</option>
                                        </select>
                                    </div>
                                </ConfigRow>

                                <ConfigRow label="PCB Qty" tooltip="Total number of boards.">
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="w-24 h-9 px-3 border border-gray-300 rounded text-sm focus:border-primary outline-none" />
                                    </div>
                                </ConfigRow>

                                <ConfigRow label="Product Type" tooltip="Helps us optimize production parameters.">
                                    {["Industrial/Consumer electronics", "Aerospace", "Medical"].map(t => (
                                        <Pill key={t} active={productType === t} onClick={() => setProductType(t)}>{t}</Pill>
                                    ))}
                                </ConfigRow>
                            </div>

                            {/* Accordion: PCB Specifications */}
                            <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setSpecsOpen(!specsOpen)}
                                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 transition-colors border-b border-gray-200"
                                >
                                    <span className="text-base font-bold text-gray-900">PCB Specifications</span>
                                    {specsOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                </button>

                                {specsOpen && (
                                    <div className="p-6 pt-2 space-y-1">
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
                                            {["0.4mm", "0.6mm", "0.8mm", "1.0mm", "1.2mm", "1.6mm", "2.0mm"].map(t => (
                                                <Pill key={t} active={thickness === t} onClick={() => setThickness(t)}>{t}</Pill>
                                            ))}
                                        </ConfigRow>

                                        <ConfigRow label="PCB Color">
                                            <div className="flex gap-3">
                                                <ColorCircle color="#52c41a" active={pcbColor === "#52c41a"} onClick={() => setPcbColor("#52c41a")} />
                                                <ColorCircle color="#722ed1" active={pcbColor === "#722ed1"} onClick={() => setPcbColor("#722ed1")} />
                                                <ColorCircle color="#f5222d" active={pcbColor === "#f5222d"} onClick={() => setPcbColor("#f5222d")} />
                                                <ColorCircle color="#fadb14" active={pcbColor === "#fadb14"} onClick={() => setPcbColor("#fadb14")} checkColor="black" />
                                                <ColorCircle color="#1677ff" active={pcbColor === "#1677ff"} onClick={() => setPcbColor("#1677ff")} />
                                                <ColorCircle color="#ffffff" active={pcbColor === "#ffffff"} onClick={() => setPcbColor("#ffffff")} checkColor="black" />
                                                <ColorCircle color="#000000" active={pcbColor === "#000000"} onClick={() => setPcbColor("#000000")} />
                                            </div>
                                        </ConfigRow>

                                        <ConfigRow label="Silkscreen">
                                            <Pill active={silkscreen === "White"} onClick={() => setSilkscreen("White")}>White</Pill>
                                        </ConfigRow>

                                        <ConfigRow label="Material Type">
                                            {["FR4-TG135", "KB6164-TG135", "Nan Ya NP-140F", "S1141-TG140", "S1000H-TG155"].map(m => (
                                                <Pill key={m} active={materialType === m} onClick={() => setMaterialType(m)}>{m}</Pill>
                                            ))}
                                        </ConfigRow>

                                        <ConfigRow label="Surface Finish">
                                            {["HASL(with lead)", "LeadFree HASL", "ENIG"].map(s => (
                                                <Pill key={s} active={surfaceFinish === s} onClick={() => setSurfaceFinish(s)} activeColor={s.includes("HASL") ? "orange" : "blue"}>{s}</Pill>
                                            ))}
                                        </ConfigRow>
                                    </div>
                                )}
                            </div>

                            {/* Accordion: High-spec Options */}
                            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setHighSpecsOpen(!highSpecsOpen)}
                                    className={`w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 transition-colors ${highSpecsOpen ? "border-b border-gray-200" : ""}`}
                                >
                                    <span className="text-base font-bold text-gray-900">High-spec Options</span>
                                    {highSpecsOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                </button>

                                {highSpecsOpen && (
                                    <div className="p-6 pt-2 space-y-1">
                                        <ConfigRow label="Outer Copper Weight">
                                            {["1oz", "2oz", "3oz", "3.5oz", "4.5oz"].map(w => (
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
                                                <Pill key={t} active={elecTest === t} onClick={() => setElecTest(t)} activeColor={t.includes("Test") ? "green" : "blue"}>{t}</Pill>
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
                            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden mb-6">
                                <button
                                    onClick={() => setAdvancedOpen(!advancedOpen)}
                                    className={`w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 transition-colors ${advancedOpen ? "border-b border-gray-200" : ""}`}
                                >
                                    <span className="text-base font-bold text-gray-900">Advanced Options</span>
                                    {advancedOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                </button>

                                {advancedOpen && (
                                    <div className="p-6 pt-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                PCB Remark <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                                            </label>
                                            <input type="text" className="w-full max-w-md h-10 px-3 border border-gray-300 rounded focus:border-primary outline-none text-sm" placeholder="Add remark..." />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Addons Row 1 */}
                            <div className="mt-4 p-4 border border-gray-200 rounded-lg flex items-center justify-between bg-white hover:border-primary/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                                        <Cpu className="w-5 h-5 text-[#f5821f]" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">PCB Assembly</span>
                                            <span className="bg-[#f5821f] text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">QUOTE</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5">Assembly cost starting from $0 with coupon <a href="#" className="text-primary hover:underline">&gt;</a></p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAssemblyOn(!assemblyOn)}
                                    className={`w-11 h-6 rounded-full relative transition-colors ${assemblyOn ? 'bg-primary' : 'bg-gray-200'}`}
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
                                    className={`w-11 h-6 rounded-full relative transition-colors ${stencilOn ? 'bg-primary' : 'bg-gray-200'}`}
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
                                        <label className="flex items-center justify-between p-3 rounded border border-primary bg-[#e6f0ff]/50 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <input type="radio" name="buildTime" defaultChecked className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-medium text-primary">2 days</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">$0.00</span>
                                        </label>

                                        <label className="flex items-center justify-between p-3 rounded border border-gray-200 hover:border-primary/50 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <input type="radio" name="buildTime" className="w-4 h-4 text-primary" />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-700">24 hours</span>
                                                    <span className="bg-[#fff5eb] text-[#f5821f] text-[10px] px-1.5 py-0.5 rounded border border-[#f5821f]/20">+$14/day</span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">$14.00</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 text-right">
                                    <div className="text-sm text-gray-500 mb-1 text-left">Calculated Price:</div>
                                    <div className="text-3xl font-bold text-[#f5821f]">$18.50</div>
                                    <p className="text-[11px] text-gray-400 mt-1">*Additional charges may apply for special cores</p>
                                </div>

                                <button className="w-full h-12 bg-gradient-to-r from-[#f5821f] to-[#ff9e40] hover:from-[#e67312] hover:to-[#f5821f] text-white font-bold rounded shadow-sm transition-all flex items-center justify-center gap-2 text-[15px]">
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
                                    <span className="inline-flex items-center gap-1 text-xs border border-[#f5821f]/30 bg-[#fff5eb] text-[#f5821f] px-2 py-1 rounded">
                                        Save $20.00
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-xs border border-[#f5821f]/30 bg-[#fff5eb] text-[#f5821f] px-2 py-1 rounded">
                                        Save $50.00
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#1f2329] text-gray-300 pt-16 pb-8 mt-12 border-t-4 border-primary">
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
                                <CircuitBoard className="w-8 h-8 text-primary" />
                                <span className="text-2xl font-bold text-white tracking-tight">Megabyte Circuit</span>
                            </div>
                            <p className="text-sm mb-6 max-w-sm lg:text-right">
                                Accelerating hardware innovation globally with high-quality, reliable, and rapid electronics manufacturing.
                            </p>
                            <div className="flex gap-4">
                                <div className="bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-700 transition-colors">
                                    <span className="text-xs font-bold block text-center mb-1">APP</span>
                                    <div className="flex gap-2">
                                        <span className="text-[10px]">iOS</span>
                                        <span className="text-[10px]">Android</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                        <div>© 2026 Megabyte Circuit. All Rights Reserved.</div>
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