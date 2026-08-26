declare module "gerbers-renderer" {
  export type BoardGeom = any;
  export type ViewerLayers = any;
  export type ViewerSideMode = "top" | "bottom";

  export type RenderResult = {
    boardGeom: BoardGeom;
    layers: ViewerLayers;
    revoke: () => void;
  };

  export interface IntegratedViewerOptions {
    onDownload?: () => void;
    showDownloadButton?: boolean;
  }

  export interface IntegratedViewer {
    setData(data: { boardGeom: BoardGeom; layers: ViewerLayers }): void;
    setSideMode(mode: ViewerSideMode): void;
    fit(): void;
    dispose(): void;
    viewer: any;
    visibility: any;
    addMarker(marker: any): void;
    addMarkers(markers: any[]): void;
    removeMarker(id: string): void;
    exportPng(target?: "view" | "board"): void;
    exportSvg(): void;
    copyShareLink(): Promise<string>;
    getViewState(): any;
    setViewState(state: any): void;
  }

  export function createIntegratedViewer(
    container: HTMLElement,
    options?: IntegratedViewerOptions
  ): IntegratedViewer;

  export function renderGerbers(
    input: ArrayBuffer | Uint8Array,
    options?: { archiveWorkerUrl?: string }
  ): Promise<RenderResult>;

  export function renderGerbersZip(
    input: File | Blob | ArrayBuffer | Uint8Array
  ): Promise<RenderResult>;

  export function renderGerbersFiles(
    files: Record<string, Uint8Array>
  ): Promise<RenderResult>;
}
