"use client";

import { useRef, useEffect, useState } from "react";
import { Niivue, NVImage } from "@niivue/niivue";
import ViewSelector from "@/components/view-selector";
import { ViewMode } from "./view-selector";
import ImageUploader from "./Uploader/image-uploader";

interface ImageCanvasProps {
  nvRef: Niivue;
  onFileUpload: (files: File[]) => Promise<void>;
  onSetSceneId: (sceneId: string) => void;
}

export const sliceTypeMap: { [type: string]: number } = {
  axial: 0,
  coronal: 1,
  sagittal: 2,
  multi: 3,
  render: 4,
};

export default function ImageCanvas({
  nvRef,
  onFileUpload,
  onSetSceneId,
}: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<
    "axial" | "coronal" | "sagittal" | "multi" | "render"
  >("axial");
  useEffect(() => {
    const canvas = canvasRef.current;
    const nv = nvRef;
    console.log("Niivue attached to canvas", nv);
    if (!canvas) return;
    if (!nv) return;
    nv.attachToCanvas(canvas);
    nv.setSliceType(sliceTypeMap[viewMode] || 0); // Default to axial if viewMode is invalid;
    setImageLoaded(true);
  }, []);

  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (nvRef) {
      nvRef.setSliceType(sliceTypeMap[mode] || 0); // Default to axial if mode is invalid
    }
  };

  const renderMultiView = () => {
    if (viewMode !== "multi") return null;

    return (
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-1 absolute top-0 left-0 pointer-events-none">
        <div className="border border-primary/30 bg-black/20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">Axial</span>
        </div>
        <div className="border border-primary/30 bg-black/20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">Coronal</span>
        </div>
        <div className="border border-primary/30 bg-black/20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">Sagittal</span>
        </div>
        <div className="border border-primary/30 bg-black/20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">3D</span>
        </div>
      </div>
    );
  };

  const getViewLabel = () => {
    if (viewMode === "multi") return null;
    return (
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-medium">
        {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
      </div>
    );
  };

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="niivue-canvas w-full h-full relative bg-[#111]"
        >
          <canvas ref={canvasRef}></canvas>
          {getViewLabel()}
          {renderMultiView()}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              Loading image...
            </div>
          )}
        </div>
      </div>
      <div className="border-t bg-background p-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <ViewSelector currentView={viewMode} onViewChange={handleViewMode} />
          <ImageUploader
            onUpload={onFileUpload}
            onSetSceneId={onSetSceneId}
            compact={true}
          />
        </div>
      </div>
    </div>
  );
}
