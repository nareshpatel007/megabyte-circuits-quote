import React from "react";
import { PCBAnalysis } from "../../lib/gerber-engine/types/analysis";
import { GerberValidationResult } from "../../lib/gerber-engine/types/validation";
import { CheckCircle2, AlertTriangle, Info, Layers, Maximize2, CircleDot, Cpu } from "lucide-react";

export interface ExtractionSummaryProps {
  analysis: PCBAnalysis;
  validation?: GerberValidationResult;
}

export const ExtractionSummary: React.FC<ExtractionSummaryProps> = ({ analysis, validation }) => {
  const { dimensions, layers, drills, geometry } = analysis;
  const inchesW = (dimensions.width / 25.4).toFixed(2);
  const inchesH = (dimensions.height / 25.4).toFixed(2);

  return (
    <div className="bg-[#111827] text-white border-t border-gray-800 p-3 text-xs space-y-2">
      {/* Top Banner metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-800/80 p-2.5 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-medium">Board Layers</div>
            <div className="text-sm font-bold text-white">
              Detected <span className="text-emerald-400">{layers.copper} Layer</span> PCB
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <Maximize2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-medium">Board Dimensions</div>
            <div className="text-sm font-bold text-white">
              {dimensions.width} × {dimensions.height} mm
              <span className="text-[11px] text-gray-400 font-normal ml-1">
                ({inchesW} × {inchesH}″)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <CircleDot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-medium">Drill Holes</div>
            <div className="text-sm font-bold text-white">
              {drills.holeCount} holes{" "}
              {drills.minimumDiameter > 0 && (
                <span className="text-[11px] text-gray-400 font-normal ml-1">
                  (Min: {drills.minimumDiameter}mm)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-medium">Min Track / Pad</div>
            <div className="text-sm font-bold text-white">
              {geometry.minimumTrackWidth || 0.15} mm / {geometry.padCount} pads
            </div>
          </div>
        </div>
      </div>

      {/* Validation Warnings / Info */}
      {validation && validation.warnings.length > 0 && (
        <div className="space-y-1">
          {validation.warnings.map((w, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-amber-950/40 border border-amber-800/60 p-2 rounded text-[11px] text-amber-200"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{w.message}</span>
                {w.suggestion && <span className="text-amber-300/80 ml-1.5">— {w.suggestion}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
