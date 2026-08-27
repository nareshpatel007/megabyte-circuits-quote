import React, { useRef, useState } from "react";
import { DrillData, PCBAnalysis } from "../../lib/gerber-engine/types/analysis";
import { ParsedLayerData } from "../../lib/gerber-engine/geometry/geometryEngine";
import { generatePCBSvgMarkup } from "../../lib/gerber-engine/renderer/svgRenderer";
import { Point } from "../../lib/gerber-engine/types/geometry";
import { MeasurementTool } from "./MeasurementTool";

export interface PCBPreviewSVGProps {
  layers: ParsedLayerData[];
  analysis: PCBAnalysis;
  drillData?: DrillData;
  side: "top" | "bottom";
  zoom: number;
  rotation: number;
  mirrored: boolean;
  showGrid: boolean;
  showDrills: boolean;
  showOutline: boolean;
  isMeasuring: boolean;
  solderMaskColor?: string;
  silkscreenColor?: string;
  layerStates?: Record<string, { visible: boolean; opacity: number }>;
}

export const PCBPreviewSVG: React.FC<PCBPreviewSVGProps> = ({
  layers,
  analysis,
  drillData,
  side,
  zoom,
  rotation,
  mirrored,
  showGrid,
  showDrills,
  showOutline,
  isMeasuring,
  solderMaskColor = "green",
  silkscreenColor = "white",
  layerStates
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Measurement points
  const [measStart, setMeasStart] = useState<Point | null>(null);
  const [measEnd, setMeasEnd] = useState<Point | null>(null);

  const bounds = analysis.dimensions.bounds;

  // Filter visible layers
  const filteredLayers = layers.filter((l) => {
    if (layerStates && layerStates[l.filename]) {
      return layerStates[l.filename].visible;
    }
    return true;
  });

  const svgMarkup = generatePCBSvgMarkup(filteredLayers, bounds, drillData, {
    side,
    maskColor: solderMaskColor,
    silkscreenColor,
    showDrills,
    showOutline,
    showGrid
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMeasuring) {
      // Handle click measurement
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Convert pixel click to board mm coordinate approx
        const mmX = bounds.minX + (clickX / rect.width) * bounds.width;
        const mmY = bounds.minY + (clickY / rect.height) * bounds.height;

        if (!measStart || (measStart && measEnd)) {
          setMeasStart({ x: mmX, y: mmY });
          setMeasEnd(null);
        } else {
          setMeasEnd({ x: mmX, y: mmY });
        }
      }
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMeasuring && measStart && !measEnd && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const mmX = bounds.minX + (clickX / rect.width) * bounds.width;
      const mmY = bounds.minY + (clickY / rect.height) * bounds.height;

      setMeasEnd({ x: mmX, y: mmY });
      return;
    }

    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const sideLabel = side === "top" ? "TOP SIDE" : "BOTTOM SIDE";

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-full bg-transparent flex items-center justify-center overflow-hidden cursor-${
        isMeasuring ? "crosshair" : isDragging ? "grabbing" : "grab"
      }`}

    >
      {/* Side Title Tag */}
      <div className="absolute top-3 left-3 z-10 bg-gray-900/90 text-white border border-gray-700 px-3 py-1 rounded text-xs font-bold tracking-wider shadow-md">
        {sideLabel}
      </div>

      {/* SVG Canvas Container */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg) ${
            mirrored ? "scaleX(-1)" : ""
          }`,
          transformOrigin: "center center"
        }}
      >
        <div
          className="w-full h-full max-w-[90%] max-h-[90%] flex items-center justify-center relative"
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />

        {/* Measurement Overlay SVG */}
        {isMeasuring && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
          >
            <MeasurementTool startPoint={measStart} endPoint={measEnd} active={isMeasuring} />
          </svg>
        )}
      </div>
    </div>
  );
};
