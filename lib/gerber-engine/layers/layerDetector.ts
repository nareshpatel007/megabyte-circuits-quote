import { LayerSide, LayerType } from "../types/gerber";

export interface DetectedLayerInfo {
  filename: string;
  type: LayerType;
  side?: LayerSide;
  confidence: "high" | "medium" | "low";
  layerIndex?: number;
}

export function detectLayerType(filename: string, content?: string): DetectedLayerInfo {
  const name = filename.toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";

  // 1. Ignore documentation and report files
  if (name.includes("readme") || name.endsWith(".rpt") || name.endsWith(".csv")) {
    return { filename, type: "other", confidence: "high" };
  }

  // 2. KiCad Specific Naming Conventions (F_Cu, B_Cu, F_Mask, B_Mask, Edge_Cuts, etc.)
  if (name.includes("f_cu") || name.includes("f.cu") || (name.includes("top") && name.includes("cu"))) {
    return { filename, type: "copper", side: "top", confidence: "high" };
  }
  if (name.includes("b_cu") || name.includes("b.cu") || (name.includes("bottom") && name.includes("cu"))) {
    return { filename, type: "copper", side: "bottom", confidence: "high" };
  }
  if (name.includes("f_mask") || name.includes("f.mask")) {
    return { filename, type: "solder-mask", side: "top", confidence: "high" };
  }
  if (name.includes("b_mask") || name.includes("b.mask")) {
    return { filename, type: "solder-mask", side: "bottom", confidence: "high" };
  }
  if (name.includes("f_silk") || name.includes("f.silk") || name.includes("f_silkscreen")) {
    return { filename, type: "silkscreen", side: "top", confidence: "high" };
  }
  if (name.includes("b_silk") || name.includes("b.silk") || name.includes("b_silkscreen")) {
    return { filename, type: "silkscreen", side: "bottom", confidence: "high" };
  }
  if (name.includes("edge_cuts") || name.includes("edge.cuts") || name.includes("edge_cut")) {
    return { filename, type: "outline", confidence: "high" };
  }

  // 3. Extension matching
  const extMap: Record<string, { type: LayerType; side?: LayerSide; confidence: "high" | "medium" }> = {
    // Top Copper
    ".gtl": { type: "copper", side: "top", confidence: "high" },
    ".top": { type: "copper", side: "top", confidence: "high" },
    ".cmp": { type: "copper", side: "top", confidence: "high" },
    ".g1": { type: "copper", side: "top", confidence: "high" },
    ".l1": { type: "copper", side: "top", confidence: "high" },

    // Bottom Copper
    ".gbl": { type: "copper", side: "bottom", confidence: "high" },
    ".bot": { type: "copper", side: "bottom", confidence: "high" },
    ".sol": { type: "copper", side: "bottom", confidence: "high" },
    ".g2": { type: "copper", side: "bottom", confidence: "high" },
    ".l2": { type: "copper", side: "bottom", confidence: "high" },

    // Top Solder Mask
    ".gts": { type: "solder-mask", side: "top", confidence: "high" },
    ".stc": { type: "solder-mask", side: "top", confidence: "high" },
    ".smt": { type: "solder-mask", side: "top", confidence: "high" },
    ".tsm": { type: "solder-mask", side: "top", confidence: "high" },

    // Bottom Solder Mask
    ".gbs": { type: "solder-mask", side: "bottom", confidence: "high" },
    ".sts": { type: "solder-mask", side: "bottom", confidence: "high" },
    ".smb": { type: "solder-mask", side: "bottom", confidence: "high" },
    ".bsm": { type: "solder-mask", side: "bottom", confidence: "high" },

    // Top Silkscreen
    ".gto": { type: "silkscreen", side: "top", confidence: "high" },
    ".plc": { type: "silkscreen", side: "top", confidence: "high" },
    ".sst": { type: "silkscreen", side: "top", confidence: "high" },
    ".tsk": { type: "silkscreen", side: "top", confidence: "high" },

    // Bottom Silkscreen
    ".gbo": { type: "silkscreen", side: "bottom", confidence: "high" },
    ".pls": { type: "silkscreen", side: "bottom", confidence: "high" },
    ".ssb": { type: "silkscreen", side: "bottom", confidence: "high" },
    ".bsk": { type: "silkscreen", side: "bottom", confidence: "high" },

    // Paste
    ".gtp": { type: "paste", side: "top", confidence: "high" },
    ".spt": { type: "paste", side: "top", confidence: "high" },
    ".gbp": { type: "paste", side: "bottom", confidence: "high" },
    ".spb": { type: "paste", side: "bottom", confidence: "high" },

    // Outline / Mechanical
    ".gko": { type: "outline", confidence: "high" },
    ".gm1": { type: "outline", confidence: "high" },
    ".gml": { type: "outline", confidence: "high" },
    ".outline": { type: "outline", confidence: "high" },
    ".profile": { type: "outline", confidence: "high" },
    ".cut": { type: "outline", confidence: "high" },

    // Drill
    ".drl": { type: "drill", confidence: "high" },
    ".xln": { type: "drill", confidence: "high" },
    ".exc": { type: "drill", confidence: "high" }
  };

  if (extMap[ext]) {
    return {
      filename,
      ...extMap[ext]
    };
  }

  // 4. Keyword matching in filename
  if (name.includes("top") && (name.includes("copper") || name.includes("cu") || name.includes("layer1"))) {
    return { filename, type: "copper", side: "top", confidence: "high" };
  }
  if (name.includes("bottom") && (name.includes("copper") || name.includes("cu") || name.includes("layer2"))) {
    return { filename, type: "copper", side: "bottom", confidence: "high" };
  }
  if (name.includes("inner") || name.includes("in1") || name.includes("in2") || name.includes("g3") || name.includes("g4")) {
    return { filename, type: "copper", side: "inner", confidence: "medium" };
  }

  if (name.includes("mask") || name.includes("soldermask")) {
    const side = name.includes("bot") || name.includes("b") ? "bottom" : "top";
    return { filename, type: "solder-mask", side, confidence: "high" };
  }

  if (name.includes("silk") || name.includes("legend") || name.includes("overlay")) {
    const side = name.includes("bot") || name.includes("b") ? "bottom" : "top";
    return { filename, type: "silkscreen", side, confidence: "high" };
  }

  if (name.includes("outline") || name.includes("border") || name.includes("edge") || name.includes("profile")) {
    return { filename, type: "outline", confidence: "high" };
  }

  if (name.includes("drill") || name.includes("ncdrill") || name.includes("holes")) {
    return { filename, type: "drill", confidence: "high" };
  }


  // 3. Inspect Gerber file attributes if content is present
  if (content && content.includes("%TF.FileFunction")) {
    const ffMatch = content.match(/%TF\.FileFunction,([^%]+)%/);
    if (ffMatch) {
      const func = ffMatch[1].toLowerCase();
      if (func.includes("copper")) {
        const side = func.includes("top") ? "top" : func.includes("bot") ? "bottom" : "inner";
        return { filename, type: "copper", side, confidence: "high" };
      }
      if (func.includes("soldermask")) {
        const side = func.includes("top") ? "top" : "bottom";
        return { filename, type: "solder-mask", side, confidence: "high" };
      }
      if (func.includes("legend")) {
        const side = func.includes("top") ? "top" : "bottom";
        return { filename, type: "silkscreen", side, confidence: "high" };
      }
      if (func.includes("profile") || func.includes("outline")) {
        return { filename, type: "outline", confidence: "high" };
      }
    }
  }

  return {
    filename,
    type: "other",
    confidence: "low"
  };
}
