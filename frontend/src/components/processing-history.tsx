"use client";
import {
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  XCircle,
  Hourglass,
  Download,
  RefreshCcw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ViewResult from "@/components/Scenes/ViewResult";
import { ScenePublic, ScenesService, type ProcessingStatus } from "@/client";
import { Niivue } from "@niivue/niivue";
import DeleteScene from "@/components/Scenes/DeleteScene";
import DeleteAllScenes from "./Scenes/DeleteAllScenes";
import DownloadDialog from "@/components/Scenes/DownloadScene";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  formatDate,
  formatDuration,
  getSceneProperty,
  getImageProperty,
  getImageArray,
  getImageCount,
  getSearchableText,
  getProcessingMessage,
} from "@/lib/scene-utils";

interface ProcessingHistoryProps {
  nvRef: React.RefObject<Niivue>;
}

function getItemsQueryOptions() {
  return {
    queryFn: () => ScenesService.readScenes(),
    queryKey: ["scenes"],
  };
}

export default function ProcessingHistory({ nvRef }: ProcessingHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<ScenePublic | null>(null);
  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getItemsQueryOptions(),
    placeholderData: (prevData) => prevData,
  });
  const history = data?.data ?? [];

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case "pending":
        return <Hourglass className="h-4 w-4 text-yellow-500" />;
      case "processing":
        return <RefreshCcw className="h-4 w-4 text-yellow-500 animate spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ProcessingStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          >
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/
              20 animate-pulse"
          >
            Processing
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-500 border-green-500/20"
          >
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-500 border-red-500/20"
          >
            Failed
          </Badge>
        );
    }
  };

  if (history?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
        <Clock className="h-12 w-12 mb-4 opacity-20" />
        <h3 className="text-lg font-medium mb-2">No processing history</h3>
        <p className="text-sm">
          Your processing history will appear here after you process images.
        </p>
      </div>
    );
  }

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleDownloadClick = (scene: ScenePublic) => {
    setSelectedHistoryItem(scene);
    setDownloadDialogOpen(true);
  };

  // Filter history based on search query - now searches all available properties
  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const searchableTexts = getSearchableText(item);

    // Search through all available text properties
    return searchableTexts.some((text) => text.toLowerCase().includes(query));
  });

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Processing History</h3>
            {history!.length > 0 && <DeleteAllScenes />}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tool, images, status, scene ID, or any text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchQuery && (
            <div className="text-xs text-muted-foreground">
              {filteredHistory.length} of {history.length} items match "
              {searchQuery}"
            </div>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No items match your search</p>
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isExpanded = expandedItems.has(item.id);

                return (
                  <div key={item.id} className="mb-3 last:mb-0">
                    <div className="rounded-lg border bg-card">
                      <Collapsible
                        open={isExpanded}
                        onOpenChange={() => toggleExpanded(item.id)}
                      >
                        <div className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(item.status as ProcessingStatus)}
                              <span className="ml-2 font-medium text-sm">
                                {getSceneProperty(
                                  item,
                                  "tool_name",
                                  "Unknown Tool"
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(item.status as ProcessingStatus)}
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                          </div>

                          {/* Start time */}
                          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 inline" />
                                {formatDate(item.timestamp as string)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>
                                {getImageCount(item)} image
                                {getImageCount(item) !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs mb-3">
                            <span className="text-muted-foreground">
                              Processing ID:{" "}
                            </span>
                            <span>{item.id}</span>
                          </div>

                          {/* Action Buttons */}
                          {item.status === "completed" && (
                            <div className="flex gap-2 justify-between mb-1">
                              <ViewResult item={item} nvRef={nvRef} />
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-fit"
                                onClick={() => handleDownloadClick(item)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          )}
                          <DeleteScene id={item.id} />
                        </div>

                        {/* Expanded Content */}
                        <CollapsibleContent>
                          <div className="border-t p-3 space-y-3">
                            {/* Selected Images Details */}
                            <div>
                              <h4 className="text-xs font-medium mb-2">
                                Selected Images:
                              </h4>
                              <div className="space-y-1">
                                {(() => {
                                  const imageArray = getImageArray(item);
                                  return imageArray.length > 0 ? (
                                    imageArray.map((imageObject, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-2 text-xs"
                                      >
                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                        <span className="truncate w-3xs">
                                          {getImageProperty(
                                            imageObject,
                                            "name",
                                            `Image ${index + 1}`
                                          )}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground">
                                      No images available
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Processing Message */}
                            <div className="text-xs mb-3 p-2 bg-muted/50 rounded text-muted-foreground">
                              {getProcessingMessage(item)}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
                );
              })
            )}

            {/* Show message when search returns no results */}
            {searchQuery && filteredHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-sm">
                  Try searching with different keywords or clear the search to
                  see all items.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Download Dialog */}
      <DownloadDialog
        open={downloadDialogOpen}
        onOpenChange={setDownloadDialogOpen}
        item={selectedHistoryItem ? selectedHistoryItem : ({} as ScenePublic)}
      />
    </>
  );
}
