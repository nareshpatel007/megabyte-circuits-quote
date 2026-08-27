import React from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  FlipHorizontal,
  Ruler,
  Grid,
  Eye,
  Layers,
  CircleDot,
  Square,
  Bug
} from "lucide-react";

export interface ViewerToolbarProps {
  side: "top" | "bottom" | "both";
  onSideChange: (side: "top" | "bottom" | "both") => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  rotation: number;
  onRotate: () => void;
  mirrored: boolean;
  onToggleMirror: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showDrills: boolean;
  onToggleDrills: () => void;
  showOutline: boolean;
  onToggleOutline: () => void;
  isMeasuring: boolean;
  onToggleMeasure: () => void;
  showLayerPanel: boolean;
  onToggleLayerPanel: () => void;
  showDebugPanel?: boolean;
  onToggleDebugPanel?: () => void;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  side,
  onSideChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  rotation,
  onRotate,
  mirrored,
  onToggleMirror,
  showGrid,
  onToggleGrid,
  showDrills,
  onToggleDrills,
  showOutline,
  onToggleOutline,
  isMeasuring,
  onToggleMeasure,
  showLayerPanel,
  onToggleLayerPanel,
  showDebugPanel,
  onToggleDebugPanel
}) => {

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#111827] text-white rounded-t-lg border-b border-gray-800 text-xs">
      {/* Side Selectors */}
      <div className="flex items-center gap-1 bg-gray-800 p-1 rounded">
        <button
          onClick={() => onSideChange("both")}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            side === "both" ? "bg-emerald-600 text-white" : "text-gray-300 hover:text-white"
          }`}
        >
          DUAL VIEW
        </button>
        <button
          onClick={() => onSideChange("top")}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            side === "top" ? "bg-emerald-600 text-white" : "text-gray-300 hover:text-white"
          }`}
        >
          TOP SIDE
        </button>
        <button
          onClick={() => onSideChange("bottom")}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            side === "bottom" ? "bg-emerald-600 text-white" : "text-gray-300 hover:text-white"
          }`}
        >
          BOTTOM SIDE
        </button>
      </div>

      {/* Viewport Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-1.5 hover:bg-gray-800 rounded text-gray-300 hover:text-white"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-1.5 hover:bg-gray-800 rounded text-gray-300 hover:text-white"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="px-1 text-[11px] text-gray-400 font-mono">{Math.round(zoom * 100)}%</span>

        <button
          onClick={onFit}
          title="Fit to Screen"
          className="p-1.5 hover:bg-gray-800 rounded text-gray-300 hover:text-white ml-1"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRotate}
          title="Rotate 90°"
          className="p-1.5 hover:bg-gray-800 rounded text-gray-300 hover:text-white"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleMirror}
          title="Mirror View"
          className={`p-1.5 rounded transition-colors ${
            mirrored ? "bg-emerald-600 text-white" : "hover:bg-gray-800 text-gray-300 hover:text-white"
          }`}
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Toggle Tools */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleMeasure}
          title="Measure Tool"
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            isMeasuring ? "bg-amber-600 text-white font-medium" : "hover:bg-gray-800 text-gray-300 hover:text-white"
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Measure</span>
        </button>

        <button
          onClick={onToggleGrid}
          title="Toggle Grid Lines"
          className={`p-1.5 rounded transition-colors ${
            showGrid ? "bg-emerald-600 text-white" : "hover:bg-gray-800 text-gray-300 hover:text-white"
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleDrills}
          title="Toggle Drill Overlay"
          className={`p-1.5 rounded transition-colors ${
            showDrills ? "bg-emerald-600 text-white" : "hover:bg-gray-800 text-gray-300 hover:text-white"
          }`}
        >
          <CircleDot className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleOutline}
          title="Toggle Board Outline"
          className={`p-1.5 rounded transition-colors ${
            showOutline ? "bg-emerald-600 text-white" : "hover:bg-gray-800 text-gray-300 hover:text-white"
          }`}
        >
          <Square className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleLayerPanel}
          title="Toggle Layer Panel"
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ml-1 ${
            showLayerPanel ? "bg-emerald-600 text-white" : "hover:bg-gray-800 text-gray-300 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
        </button>

        {onToggleDebugPanel && (
          <button
            onClick={onToggleDebugPanel}
            title="Developer Diagnostics & Statistics"
            className={`p-1.5 rounded transition-colors ${
              showDebugPanel ? "bg-amber-600 text-white" : "hover:bg-gray-800 text-amber-400 hover:text-amber-300"
            }`}
          >
            <Bug className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

};
