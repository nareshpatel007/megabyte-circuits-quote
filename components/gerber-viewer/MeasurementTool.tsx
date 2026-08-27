import React from "react";
import { Point } from "../../lib/gerber-engine/types/geometry";

export interface MeasurementToolProps {
  startPoint: Point | null;
  endPoint: Point | null;
  active: boolean;
}

export const MeasurementTool: React.FC<MeasurementToolProps> = ({
  startPoint,
  endPoint,
  active
}) => {
  if (!active || !startPoint || !endPoint) return null;

  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distMm = Math.hypot(dx, dy);
  const distInches = distMm / 25.4;

  const midX = (startPoint.x + endPoint.x) / 2;
  const midY = (startPoint.y + endPoint.y) / 2;

  return (
    <g id="measurement-overlay" className="pointer-events-none select-none">
      {/* Line */}
      <line
        x1={startPoint.x}
        y1={startPoint.y}
        x2={endPoint.x}
        y2={endPoint.y}
        stroke="#f59e0b"
        strokeWidth="0.5"
        strokeDasharray="2 1"
      />

      {/* Start Point marker */}
      <circle cx={startPoint.x} cy={startPoint.y} r="1" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.3" />

      {/* End Point marker */}
      <circle cx={endPoint.x} cy={endPoint.y} r="1" fill="#ef4444" stroke="#ffffff" strokeWidth="0.3" />

      {/* Distance Label */}
      <g transform={`translate(${midX}, ${midY})`}>
        <rect
          x="-20"
          y="-8"
          width="40"
          height="16"
          rx="3"
          fill="#1e293b"
          stroke="#f59e0b"
          strokeWidth="0.4"
          opacity="0.9"
        />
        <text
          x="0"
          y="0"
          fill="#ffffff"
          fontSize="4"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {distMm.toFixed(2)} mm ({distInches.toFixed(2)}″)
        </text>
      </g>
    </g>
  );
};
