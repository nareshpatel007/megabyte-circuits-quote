# Integration Guide: Adding Gerber Engine to Next.js PCB Online Quotation

This document details how the `@megabyte/gerber-engine` and `@megabyte/gerber-viewer` packages are integrated into the Next.js online quotation workflow.

## Data Flow Pipeline

```text
User uploads Gerber ZIP / File
           ↓
`processGerberFiles(file)`
           ↓
ZIP Extraction (JSZip)
           ↓
Parse RS-274X (`parseGerberContent`) & Excellon (`parseExcellonContent`)
           ↓
Detect PCB Layers (`detectLayerType`)
           ↓
Extract Normalized Geometry (mm) & Calculate Board Bounds (`combineBoardBounds`)
           ↓
PCB Analysis Engine (`analyzePCBProject`) -> Generates `PCBAnalysis`
           ↓
Validation Engine (`validateGerberProject`)
           ↓
Map Analysis -> Quotation Options (`mapPCBAnalysisToQuoteOptions`)
           ↓
Auto-fill Form State (`setLayers`, `setPcbWidth`, `setPcbHeight`)
           ↓
Render `<GerberViewer />` photorealistic 2D SVG canvas (Top & Bottom sides)
           ↓
Show "✓ Auto detected from Gerber" badge on extracted fields
           ↓
User can manually change any option -> Badge switches to "✎ Manually selected"
```

## Form Integration Example

```tsx
import { processGerberFiles } from "@/lib/gerber-engine";
import { mapPCBAnalysisToQuoteOptions } from "@/lib/pcb-quote-integration/extractionMapper";
import { GerberViewer } from "@/components/gerber-viewer";

const handleUpload = async (file: File) => {
  const project = await processGerberFiles(file);
  setProcessedProject(project);

  const autoSelected = mapPCBAnalysisToQuoteOptions(project.analysis);
  setLayers(autoSelected.layers);
  setDimensions({ width: autoSelected.width, height: autoSelected.height });
  setFieldSources({ layers: "detected", dimensions: "detected" });
};
```
