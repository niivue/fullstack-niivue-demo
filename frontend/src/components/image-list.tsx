"use client";

import { useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageFile } from "./image-processor";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageIcon } from "lucide-react";

interface ImageListProps {
  images: ImageFile[];
  currentImageIndex: number | null;
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  handleVisibility: (id: number) => void;
}

export default function ImageList({
  images,
  currentImageIndex,
  setImages,
  handleVisibility,
}: ImageListProps) {
  const toggleImageSelection = (id: string) => {
    setImages(
      images.map((img) =>
        img.id === id ? { ...img, selected: !img.selected } : img
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        {images.length > 0 ? (
          <div className="grid gap-2 p-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md cursor-pointer",
                  currentImageIndex === index ? "bg-muted" : "hover:bg-muted/50"
                )}
                onClick={() => handleVisibility(index)}
              >
                <div className="flex-shrink-0">
                  <Checkbox
                    id={`select-${image.id}`}
                    checked={image.selected}
                    onCheckedChange={() => toggleImageSelection(image.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-wrap">{image.name}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mb-2" />
            <p>No images uploaded yet</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
