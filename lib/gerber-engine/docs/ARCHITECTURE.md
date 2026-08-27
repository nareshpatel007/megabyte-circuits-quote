# System Architecture: Gerber Engine & Viewer Package

```text
Uploaded ZIP / Gerber Files
            ↓
  [File Validation & Cache]
            ↓
  [Layer & Extension Detector]
            ↓
 ┌─────────────────────────────┐
 │    RS-274X Gerber Parser    │  <--->  [Excellon Drill Parser]
 └─────────────────────────────┘
            ↓
  [Geometry Engine (mm Normalized)]
            ↓
  [Board Bounds & Outline Extractor]
            ↓
  [PCB Analysis & Metrics Engine]
            ↓
  [Photorealistic SVG Renderer]
            ↓
 ┌─────────────────────────────┐
 │    React GerberViewer UI    │  <--->  [Toolbar / Measurement / Layers]
 └─────────────────────────────┘
            ↓
  [Extraction Mapper & Quote Auto-Selection]
```

## Layer Separation

1. **`lib/gerber-engine/`**: Pure TypeScript engine (zero React dependencies). Responsible for parsing raw RS-274X text, Excellon drill files, normalized geometry generation, bounds calculation, metrics extraction, and pure SVG string rendering.
2. **`components/gerber-viewer/`**: React visualizer UI package. Handles zoom/pan state, side switching, toolbar controls, interactive measurement overlay, and layer panel controls.
3. **`lib/pcb-quote-integration/`**: Mapper that consumes `PCBAnalysis` and produces auto-selection form inputs for the main PCB quotation system.
