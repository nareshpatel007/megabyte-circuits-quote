export interface GbrJobData {
  header?: {
    fileFunction?: string;
  };
  generalSpecs?: {
    boardThickness?: number;
    layerCount?: number;
    finish?: string;
  };
  filesAttributes?: Array<{
    path: string;
    fileFunction: string;
  }>;
}

export function parseGbrJobContent(content: string): GbrJobData | null {
  try {
    const json = JSON.parse(content);
    const filesAttributes: Array<{ path: string; fileFunction: string }> = [];

    if (Array.isArray(json.FilesAttributes)) {
      for (const attr of json.FilesAttributes) {
        if (attr.Path && attr.FileFunction) {
          filesAttributes.push({
            path: attr.Path,
            fileFunction: Array.isArray(attr.FileFunction) ? attr.FileFunction.join(",") : String(attr.FileFunction)
          });
        }
      }
    }

    return {
      header: json.Header ? { fileFunction: json.Header.FileFunction } : undefined,
      generalSpecs: json.GeneralSpecs
        ? {
            boardThickness: json.GeneralSpecs.BoardThickness,
            layerCount: json.GeneralSpecs.LayerCount,
            finish: json.GeneralSpecs.Finish
          }
        : undefined,
      filesAttributes
    };
  } catch (e) {
    return null;
  }
}
