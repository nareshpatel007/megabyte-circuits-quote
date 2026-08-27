import React from "react";
import { Eye, EyeOff, Layers, ShieldAlert } from "lucide-react";
import { ParsedLayerData } from "../../lib/gerber-engine/geometry/geometryEngine";

export interface LayerState {
  filename: string;
  visible: boolean;
  opacity: number;
}

export interface LayerPanelProps {
  layers: ParsedLayerData[];
  layerStates: Record<string, LayerState>;
  onToggleVisibility: (filename: string) => void;
  onOpacityChange: (filename: string, opacity: number) => void;
  onSoloLayer: (filename: string) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  layerStates,
  onToggleVisibility,
  onOpacityChange,
  onSoloLayer
}) => {
  return (
    <div className="w-64 bg-[#1e293b] border-l border-gray-800 text-white flex flex-col h-full text-xs">
      <div className="p-3 border-b border-gray-800 font-bold flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gray-200">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>PCB Layer Manager</span>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
          {layers.length} layers
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {layers.map((l) => {
          const state = layerStates[l.filename] || { visible: true, opacity: 1.0 };
          const sideBadge = l.side ? l.side.toUpperCase() : "BOTH";
          const typeColor =
            l.type === "copper"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : l.type === "solder-mask"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              : l.type === "silkscreen"
              ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
              : "bg-purple-500/20 text-purple-300 border-purple-500/40";

          return (
            <div
              key={l.filename}
              className={`p-2.5 rounded border transition-all ${
                state.visible ? "bg-gray-800/80 border-gray-700" : "bg-gray-900/50 border-gray-800 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <button
                  onClick={() => onToggleVisibility(l.filename)}
                  className="flex items-center gap-1.5 font-medium truncate hover:text-emerald-400 text-left flex-1"
                >
                  {state.visible ? (
                    <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  )}
                  <span className="truncate text-gray-200" title={l.filename}>
                    {l.filename}
                  </span>
                </button>

                <button
                  onClick={() => onSoloLayer(l.filename)}
                  title="Solo Layer"
                  className="text-[10px] bg-gray-700 hover:bg-emerald-600 px-1.5 py-0.5 rounded text-gray-300 hover:text-white transition-colors"
                >
                  Solo
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                <span className={`px-1.5 py-0.2 border rounded ${typeColor}`}>{l.type}</span>
                <span>{sideBadge}</span>
              </div>

              {state.visible && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-gray-400 w-10">Opacity</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={state.opacity}
                    onChange={(e) => onOpacityChange(l.filename, parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-gray-700 rounded appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[10px] font-mono text-gray-400 w-6 text-right">
                    {Math.round(state.opacity * 100)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
