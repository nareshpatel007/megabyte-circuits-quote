import React from "react";
import { ParsedLayerData } from "../../lib/gerber-engine/geometry/geometryEngine";
import { PCBAnalysis } from "../../lib/gerber-engine/types/analysis";
import { Bug, Download, FileText, CheckCircle2, AlertTriangle, Code } from "lucide-react";

export interface DebugPanelProps {
  layers: ParsedLayerData[];
  analysis: PCBAnalysis;
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ layers, analysis, onClose }) => {
  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ analysis, layers }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gerber_debug_report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full bg-[#111827] text-white border-t border-gray-800 p-4 text-xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2 font-bold text-emerald-400">
          <Bug className="w-4 h-4" />
          <span>GERBER ENGINE DEVELOPER DIAGNOSTICS & PARSER STATS</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Download Debug Report</span>
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-gray-800 text-[11px]"
          >
            Close
          </button>
        </div>
      </div>

      {/* Layer Statistics Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px] text-gray-300 border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 bg-gray-900/60 uppercase text-[10px]">
              <th className="py-1.5 px-2">Filename</th>
              <th className="py-1.5 px-2">Type / Side</th>
              <th className="py-1.5 px-2">Moves</th>
              <th className="py-1.5 px-2">Draws</th>
              <th className="py-1.5 px-2">Flashes</th>
              <th className="py-1.5 px-2">Arcs</th>
              <th className="py-1.5 px-2">Regions</th>
              <th className="py-1.5 px-2">Apertures / Macros</th>
              <th className="py-1.5 px-2">Bounds (W x H)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-mono">
            {layers.map((l, idx) => {
              const stats = l.statistics || {
                moveCount: 0,
                drawCount: 0,
                flashCount: 0,
                arcCount: 0,
                regionCount: 0,
                apertureCount: 0,
                macroCount: 0,
                warningCount: 0
              };
              const b = l.bounds;
              return (
                <tr key={idx} className="hover:bg-gray-800/40">
                  <td className="py-1.5 px-2 text-white font-semibold">{l.filename}</td>
                  <td className="py-1.5 px-2">
                    <span className="text-emerald-400">{l.type}</span>
                    {l.side && <span className="text-gray-500 ml-1">({l.side})</span>}
                  </td>
                  <td className="py-1.5 px-2">{stats.moveCount}</td>
                  <td className="py-1.5 px-2">{stats.drawCount}</td>
                  <td className="py-1.5 px-2">{stats.flashCount}</td>
                  <td className="py-1.5 px-2 text-amber-400">{stats.arcCount}</td>
                  <td className="py-1.5 px-2 text-purple-400">{stats.regionCount}</td>
                  <td className="py-1.5 px-2">
                    {stats.apertureCount} / <span className="text-sky-400">{stats.macroCount}</span>
                  </td>
                  <td className="py-1.5 px-2 text-gray-400">
                    {b ? `${b.width.toFixed(1)} x ${b.height.toFixed(1)} mm` : "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
