"use client";

import React, { useState, forwardRef } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ScenePublic } from "@/client";
import {
  getImageArray,
  getImageProperty,
  getDownloadableFiles,
} from "@/lib/scene-utils";

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ScenePublic;
}

const DownloadDialog = forwardRef<HTMLDivElement, DownloadDialogProps>(
  function DownloadDialog({ open, onOpenChange, item }, ref) {
    const [selectedImages, setSelectedImages] = useState<Set<string>>(
      new Set()
    );
    const [downloadFormat, setDownloadFormat] = useState<string>("original");
    const [isDownloading, setIsDownloading] = useState(false);

    // Safely get processed images array with type safety
    const processedImages = getImageArray(item);

    // Get total count of downloadable files
    const totalDownloadableFiles = processedImages.flatMap((img, index) =>
      getDownloadableFiles(img, index)
    ).length;

    const handleImageToggle = (imageId: string) => {
      const newSelected = new Set(selectedImages);
      if (newSelected.has(imageId)) {
        newSelected.delete(imageId);
      } else {
        newSelected.add(imageId);
      }
      setSelectedImages(newSelected);
    };

    const handleSelectAll = () => {
      // Get all downloadable files from all images
      const allDownloadableFiles = processedImages
        .flatMap((img, index) => getDownloadableFiles(img, index))
        .map((file) => file.id);

      if (selectedImages.size === allDownloadableFiles.length) {
        setSelectedImages(new Set());
      } else {
        setSelectedImages(new Set(allDownloadableFiles));
      }
    };

    const handleDownload = async () => {
      if (selectedImages.size === 0) {
        alert("Please select at least one image to download");
        return;
      }

      setIsDownloading(true);

      try {
        // Get all downloadable files and filter by selected IDs
        const selectedFiles = processedImages
          .flatMap((img, index) => getDownloadableFiles(img, index))
          .filter((file) => selectedImages.has(file.id));

        console.log("Downloading files:", selectedFiles);
        console.log("Download format:", downloadFormat);

        // Simulate download delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (selectedFiles.length === 1) {
          // Single file download
          const file = selectedFiles[0];
          const link = document.createElement("a");
          link.href = file.url;
          link.download = file.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Multiple files - create a ZIP download
          const link = document.createElement("a");
          link.href = `/downloads/${item?.id}/batch_download.zip`;
          link.download = `${getImageProperty(item, "tool_name", "processing")}_results_${new Date().toISOString().split("T")[0]}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        // Reset and close
        setSelectedImages(new Set());
        onOpenChange(false);
      } catch (error) {
        console.error("Download failed:", error);
        alert("Download failed. Please try again.");
      } finally {
        setIsDownloading(false);
      }
    };

    const getFormatBadgeColor = (format: string) => {
      switch (format.toLowerCase()) {
        case "nii":
        case "nii.gz":
          return "bg-blue-100 text-blue-800";
        case "dcm":
          return "bg-green-100 text-green-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    // Early return if no data
    if (!item) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] flex flex-col"
          ref={ref}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Processed Images
            </DialogTitle>
            <DialogDescription>
              Select the processed images you want to download from the{" "}
              {getImageProperty(item, "tool_name", "processing")} processing job
              completed on{" "}
              {getImageProperty(
                item,
                "timestamp",
                new Date()
              ).toLocaleDateString?.() || "Unknown date"}
              .
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-hidden">
            {/* Download Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Download Format</Label>
                <Select
                  value={downloadFormat}
                  onValueChange={setDownloadFormat}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original Format</SelectItem>
                    <SelectItem value="nii">NIfTI (.nii)</SelectItem>
                    <SelectItem value="nii.gz">
                      Compressed NIfTI (.nii.gz)
                    </SelectItem>
                    <SelectItem value="dicom">DICOM (.dcm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Files ({selectedImages.size} of {totalDownloadableFiles}{" "}
                  selected)
                </Label>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedImages.size === totalDownloadableFiles
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Image List */}
            <ScrollArea className="flex-1 max-h-96">
              <div className="space-y-2">
                {processedImages.map((image, index) => {
                  const downloadableFiles = getDownloadableFiles(image, index);

                  return (
                    <div key={`image-group-${index}`} className="space-y-2">
                      {downloadableFiles.map((file) => {
                        const format =
                          file.filename.split(".").pop() || "unknown";

                        return (
                          <div
                            key={file.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                              selectedImages.has(file.id)
                                ? "bg-blue-50 border-blue-200"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <Checkbox
                              id={file.id}
                              checked={selectedImages.has(file.id)}
                              onCheckedChange={() => handleImageToggle(file.id)}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium truncate">
                                  {file.displayName}
                                </p>
                                {selectedImages.has(file.id) && (
                                  <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${getFormatBadgeColor(format)}`}
                                >
                                  {format}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {file.type === "original"
                                    ? "Original"
                                    : "Processed"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Download Summary */}
            {selectedImages.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-900">
                    Download Summary
                  </span>
                  <span className="text-blue-700">
                    {selectedImages.size} file
                    {selectedImages.size !== 1 ? "s" : ""} selected
                  </span>
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  {selectedImages.size > 1
                    ? "Files will be downloaded as a ZIP archive"
                    : "File will be downloaded individually"}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDownloading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={selectedImages.size === 0 || isDownloading}
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download{" "}
                  {selectedImages.size > 0 ? `(${selectedImages.size})` : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export default DownloadDialog;
