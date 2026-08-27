# @megabyte/gerber-engine & @megabyte/gerber-viewer

A production-ready, client-side **Gerber Parser, Geometry Engine, Excellon Drill Parser, PCB Analysis Engine, and SVG Viewer Package** built for React and Next.js applications.

## Key Features

- **Full RS-274X Gerber Parsing**: Supports units (mm/in), coordinate formats, apertures (Circle, Rectangle, Obround, Polygon, Macros), D01/D02/D03 commands, regions/polygons, circular arcs (CW/CCW), step & repeat, and polarity.
- **Excellon Drill Parser**: Handles tool definitions, diameters, hole coordinates, slots, and plated/non-plated classification.
- **Automatic Layer Detection**: Identifies Top/Bottom Copper, Solder Mask, Silkscreen, Paste, Board Outline, and Drill layers by extension, metadata, and `.gbrjob` attributes.
- **PCB Geometry & Feature Analysis**: Automatically calculates Board Width, Board Height, Board Area, Copper Layer Count, Drill Hole Counts, Min/Max Hole Diameters, Track Widths, and Pad Counts.
- **Crisp 2D SVG Rendering**: Generates photorealistic SVG stackups for Top Side and Bottom Side PCB previews, supporting customizable solder mask colors (Green, Blue, Red, Black, White, Purple, Yellow) and silkscreen themes.
- **Viewer Controls**: Includes Zoom, Pan, Fit-to-Screen, 90° Rotation, Horizontal Mirroring, Interactive Ruler Measurement, Grid Lines, and Layer Visibility Toggles.
- **Quote Option Auto-Selection**: Maps extracted `PCBAnalysis` data directly into quotation options with clear visual indicators ("✓ Auto detected" vs "✎ Manually selected").

## Installation & Reusability

This package is completely decoupled from the quotation business logic. To copy or reuse in another React / Next.js project:

1. Copy `lib/gerber-engine/` into your target project `lib/` directory.
2. Copy `components/gerber-viewer/` into your components folder.
3. Import and use:

```tsx
import { processGerberFiles } from "@/lib/gerber-engine";
import { GerberViewer } from "@/components/gerber-viewer";

const project = await processGerberFiles(file, (stage, percent) => {
  console.log(`${stage} - ${percent}%`);
});

<GerberViewer
  layers={project.layers}
  analysis={project.analysis}
  drillData={project.drillData}
  validation={project.validation}
/>
```
