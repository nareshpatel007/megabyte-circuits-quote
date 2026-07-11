import JSZip from "jszip";

export interface ExtractedFile {
    name: string;
    content: string;
}

/**
 * Recursively extracts all files from a ZIP archive.
 * Supports nested directories and filters out OS-specific metadata files.
 */
export async function extractZipRecursively(buffer: ArrayBuffer): Promise<ExtractedFile[]> {
    const zip = await JSZip.loadAsync(buffer);
    const extracted: ExtractedFile[] = [];
    
    for (const name of Object.keys(zip.files)) {
        const fileEntry = zip.files[name];
        
        // Skip directories and metadata/OS files
        if (fileEntry.dir) continue;
        const normalized = name.toLowerCase();
        if (normalized.includes("__macosx") || normalized.endsWith(".ds_store") || normalized.startsWith(".")) {
            continue;
        }
        
        const content = await fileEntry.async("string");
        extracted.push({
            name,
            content
        });
    }
    
    return extracted;
}
