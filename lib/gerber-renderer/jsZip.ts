import JSZip from "jszip";

const GERBER_EXTENSIONS = [
    ".gbr",
    ".gbl",
    ".gtl",
    ".gto",
    ".gbo",
    ".gts",
    ".gbs",
    ".gko",
    ".gm1",
    ".drl",
    '.gbrx',
    '.gblx',
    ".txt"
];

export async function handleZip(file: File, { gerberOnly = true } = {}): Promise<File[]> {
    const zip = await JSZip.loadAsync(file);
    const entries = Object.values(zip.files);
    const extractedFiles: File[] = [];

    await Promise.all(
        entries.map(async (zipEntry) => {
            if (!zipEntry.dir) {
                const content = await zipEntry.async('blob');
                const name = zipEntry.name.split('/').pop() || "";
                const lowerName = name.toLowerCase();

                if (gerberOnly) {
                    const isGerber = GERBER_EXTENSIONS.some(ext => lowerName.endsWith(ext));
                    if (!isGerber) return;
                }

                const extractedFile = new File([content], name, { type: content.type });
                extractedFiles.push(extractedFile);
            }
        })
    );

    return extractedFiles;
}
