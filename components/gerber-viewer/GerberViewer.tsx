import React, { useState } from "react";
import { PCBAnalysis, DrillData } from "../../lib/gerber-engine/types/analysis";
import { ParsedLayerData } from "../../lib/gerber-engine/geometry/geometryEngine";
import { GerberValidationResult } from "../../lib/gerber-engine/types/validation";
import { ViewerToolbar } from "./ViewerToolbar";
import { LayerPanel, LayerState } from "./LayerPanel";
import { PCBPreviewSVG } from "./PCBPreviewSVG";
import { ExtractionSummary } from "./ExtractionSummary";
import { DebugPanel } from "./DebugPanel";
import { renderPCBHdRaster } from "../../lib/gerber-engine/renderer/svgRenderer";
import { RefreshCw, Upload, FileText, CheckCircle2, Download } from "lucide-react";


export interface GerberViewerProps {
  layers: ParsedLayerData[];
  analysis: PCBAnalysis;
  drillData?: DrillData;
  validation?: GerberValidationResult;
  solderMaskColor?: string;
  silkscreenColor?: string;
  onReupload?: () => void;
  isLoading?: boolean;
  loadingProgress?: { stage: string; percent: number };
}

export const GerberViewer: React.FC<GerberViewerProps> = ({
  layers,
  analysis,
  drillData,
  validation,
  solderMaskColor = "green",
  silkscreenColor = "white",
  onReupload,
  isLoading,
  loadingProgress
}) => {
  const [side, setSide] = useState<"top" | "bottom" | "both">("both");
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [mirrored, setMirrored] = useState(false);

  const [showGrid, setShowGrid] = useState(false);
  const [showDrills, setShowDrills] = useState(true);
  const [showOutline, setShowOutline] = useState(true);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);


  // Layer Visibility & Opacity states
  const [layerStates, setLayerStates] = useState<Record<string, LayerState>>(() => {
    const map: Record<string, LayerState> = {};
    layers.forEach((l) => {
      map[l.filename] = { filename: l.filename, visible: true, opacity: 1.0 };
    });
    return map;
  });

  const handleToggleVisibility = (filename: string) => {
    setLayerStates((prev) => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        visible: !prev[filename]?.visible
      }
    }));
  };

  const handleOpacityChange = (filename: string, opacity: number) => {
    setLayerStates((prev) => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        opacity
      }
    }));
  };

  const handleSoloLayer = (filename: string) => {
    setLayerStates((prev) => {
      const next: Record<string, LayerState> = {};
      Object.keys(prev).forEach((key) => {
        next[key] = { ...prev[key], visible: key === filename };
      });
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="w-full h-[480px] bg-[#0b0f19] border border-gray-800 rounded-lg flex flex-col items-center justify-center text-white p-6">
        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <h3 className="text-base font-bold mb-1">{loadingProgress?.stage || "Processing Gerber Files..."}</h3>
        <p className="text-xs text-gray-400 mb-4">Parsing RS-274X commands, drill holes, and layer geometry...</p>
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${loadingProgress?.percent || 20}%` }}
          />
        </div>
        <span className="text-[11px] text-emerald-400 font-mono mt-2">{loadingProgress?.percent || 20}%</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg overflow-hidden flex flex-col shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#111827] border-b border-gray-800 text-white">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs tracking-wide">2D GERBER PCB PREVIEW</span>
          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono">
            {analysis.layers.copper} Layer Board
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              const dataUrl = await renderPCBHdRaster(layers, analysis.dimensions.bounds, drillData, { side: side === "bottom" ? "bottom" : "top", maskColor: solderMaskColor, silkscreenColor }, 3840);
              const anchor = document.createElement("a");

              anchor.href = dataUrl;
              anchor.download = `pcb_preview_hd_4k_${Date.now()}.png`;
              anchor.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs transition-colors font-medium"
            title="Export High Resolution 4K PNG Preview"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export 4K PNG</span>
          </button>

          {onReupload && (
            <button
              onClick={onReupload}
              className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs transition-colors border border-gray-700"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Re-upload Gerber</span>
            </button>
          )}
        </div>

      </div>

      {/* Toolbar */}
      <ViewerToolbar
        side={side}
        onSideChange={setSide}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(z * 1.2, 5))}
        onZoomOut={() => setZoom((z) => Math.max(z / 1.2, 0.4))}
        onFit={() => {
          setZoom(1.0);
          setRotation(0);
          setMirrored(false);
        }}
        onReset={() => {
          setZoom(1.0);
          setRotation(0);
          setMirrored(false);
        }}
        rotation={rotation}
        onRotate={() => setRotation((r) => (r + 90) % 360)}
        mirrored={mirrored}
        onToggleMirror={() => setMirrored((m) => !m)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((g) => !g)}
        showDrills={showDrills}
        onToggleDrills={() => setShowDrills((d) => !d)}
        showOutline={showOutline}
        onToggleOutline={() => setShowOutline((o) => !o)}
        isMeasuring={isMeasuring}
        onToggleMeasure={() => setIsMeasuring((m) => !m)}
        showLayerPanel={showLayerPanel}
        onToggleLayerPanel={() => setShowLayerPanel((p) => !p)}
        showDebugPanel={showDebugPanel}
        onToggleDebugPanel={() => setShowDebugPanel((d) => !d)}
      />

      {/* Developer Debug Panel */}
      {showDebugPanel && (
        <DebugPanel layers={layers} analysis={analysis} onClose={() => setShowDebugPanel(false)} />
      )}

      {/* Preview Canvas Area */}
      <div className="relative w-full h-[420px] flex overflow-hidden">
        {/* SVG Previews */}
        <div className="flex-1 flex w-full h-full">
          {side === "both" ? (
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-800">
              <PCBPreviewSVG
                layers={layers}
                analysis={analysis}
                drillData={drillData}
                side="top"
                zoom={zoom}
                rotation={rotation}
                mirrored={mirrored}
                showGrid={showGrid}
                showDrills={showDrills}
                showOutline={showOutline}
                isMeasuring={isMeasuring}
                solderMaskColor={solderMaskColor}
                silkscreenColor={silkscreenColor}
                layerStates={layerStates}
              />
              <PCBPreviewSVG
                layers={layers}
                analysis={analysis}
                drillData={drillData}
                side="bottom"
                zoom={zoom}
                rotation={rotation}
                mirrored={mirrored}
                showGrid={showGrid}
                showDrills={showDrills}
                showOutline={showOutline}
                isMeasuring={isMeasuring}
                solderMaskColor={solderMaskColor}
                silkscreenColor={silkscreenColor}
                layerStates={layerStates}
              />
            </div>
          ) : (
            <PCBPreviewSVG
              layers={layers}
              analysis={analysis}
              drillData={drillData}
              side={side}
              zoom={zoom}
              rotation={rotation}
              mirrored={mirrored}
              showGrid={showGrid}
              showDrills={showDrills}
              showOutline={showOutline}
              isMeasuring={isMeasuring}
              solderMaskColor={solderMaskColor}
              silkscreenColor={silkscreenColor}
              layerStates={layerStates}
            />
          )}
        </div>

        {/* Collapsible Layer Panel Sidebar */}
        {showLayerPanel && (
          <LayerPanel
            layers={layers}
            layerStates={layerStates}
            onToggleVisibility={handleToggleVisibility}
            onOpacityChange={handleOpacityChange}
            onSoloLayer={handleSoloLayer}
          />
        )}
      </div>

      {/* Extraction Summary */}
      <ExtractionSummary analysis={analysis} validation={validation} />
    </div>
  );
};
