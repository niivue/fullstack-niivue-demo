"use client"

import { useState } from "react"
import { PanelLeft, PanelRight, Send, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import ViewSelector from "@/components/view-selector"
import ProcessingHistory, { type ProcessingHistoryItem } from "@/components/processing-history"
import { cn } from "@/lib/utils"
import { useRef } from 'react'
import { DocumentData, Niivue, NVDocument, NVImage } from '@niivue/niivue'
import '../App.css'
import ImageUploader from "./image-uploader"
import ImageCanvas from "./image-canvas"
import { sliceTypeMap } from "./image-canvas"
import { ViewMode } from "./view-selector"

type ImageFile = {
  id: string
  name: string
  selected: boolean
}

type ProcessingTool = {
  id: string
  name: string
  description: string
}

const nv = new Niivue({
  loadingText: "Drag-drop images",
  dragAndDropEnabled: true,
  textHeight: 0.02,
  backColor: [0, 0, 0, 1],
  crosshairColor: [244, 243, 238, 0.5],
  multiplanarForceRender: false
});

export default function MedicalImageProcessor() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [processingHistory, setProcessingHistory] = useState<ProcessingHistoryItem[]>([])
  const [viewMode, setViewMode] = useState<"axial" | "coronal" | "sagittal" | "multi" | "render">("axial")
  const nvRef = useRef<Niivue | null>(nv)

  const processingTools: ProcessingTool[] = [
    { id: "segmentation", name: "Segmentation", description: "Segment different regions in the image" },
    { id: "registration", name: "Image Registration", description: "Align multiple images" },
  ]

  // Add uploaded files to Niivue
  let handleFileUpload = async (files: File[]) => {
    if (!nvRef.current) return;
    const nv = nvRef.current
    files.forEach(async (file) => {
      const nvimage = await NVImage.loadFromFile({
        file: file,
      });
      console.log("nv", nv)

      nv.addVolume(nvimage);

      const newImage = {
        id: nvimage.id,
        name: nvimage.name,
        selected: false,
      }
      setImages((prev) => [...prev, ...[newImage]])
    })

    if (currentImageIndex === null && files.length > 0) {
      setCurrentImageIndex(images.length)
    }
  }

  const toggleImageSelection = (id: string) => {
    setImages(images.map((img) => (img.id === id ? { ...img, selected: !img.selected } : img)))
  }

  // Define an async function to fetch scene data
  const fetchScene = async (): Promise<Partial<DocumentData>> => {
    // Adjust the URL to match the backend endpoint you've set up.
    const response = await fetch('/scene')
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    console.log("Response from /scene:", response)
    // Assume the backend returns an array of scenes.
    const nvdFile = await response.json()
    console.log(nvdFile)
    return nvdFile
  }

  const handleProcessImages = () => {
    const selectedImages = images.filter((img) => img.selected)
    if (selectedImages.length === 0 || !selectedTool) {
      alert("Please select at least one image and a processing tool")
      return
    }

    // Make a copy of the Niivue instance to avoid issues with state updates
    const nvCopy = nvRef.current
    if (!nvCopy) return;

    // Remove unselected volumes from Niivue (in reverse order to avoid index shift)
    images
      .map((img, idx) => ({ img, idx }))
      .filter(({ img }) => !img.selected)
      .reverse()
      .forEach(({ idx }) => {
        nvCopy.removeVolumeByIndex(idx);
      });

    // Create Partial DocumentData for selected images for processing request
    const nvd = nvCopy.json()
    console.log("NVDocument for processing:", nvd)
    // Get the tool name from the processing tools array
    const tool = processingTools.find((t) => t.id === selectedTool)

    // Create a new history item
    const historyItem: ProcessingHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      nvDocument: nvd,
      toolName: tool?.name || selectedTool,
      status: "pending",
    }

    // Add to history
    setProcessingHistory((prev) => [historyItem, ...prev])

    console.log("Processing images:", selectedImages, "with tool:", selectedTool)

    // Simulate processing with a timeout
    setTimeout(async () => {
      try {
        const doc = await fetchScene();
        console.log("Processing scene URL:", doc);
        const resultDocument = await NVDocument.loadFromJSON(doc);
        await resultDocument.fetchLinkedData();

        setProcessingHistory((prev) =>
          prev.map((item) =>
            item.id === historyItem.id
              ? { ...item, status: "completed", result: resultDocument }
              : item,
          ),
        );
      } catch (error) {
        console.error("Processing failed:", error);
        setProcessingHistory((prev) =>
          prev.map((item) =>
            item.id === historyItem.id
              ? {
                  ...item,
                  status: "failed",
                  error:
                    error && typeof error === "object" && "message" in error
                      ? (error as { message: string }).message
                      : String(error),
                }
              : item,
          ),
        );
      }
    }, 9000);
  }

    // Implement viewing the result
  const handleViewResult = async (item: ProcessingHistoryItem) => {
    console.log("Viewing result for", item)
    if (!item.result) {
      alert("No result available for this item")
      return
    }
    console.log("Loading volumes for result", item.result)
    if (!nvRef.current) {
      alert("Niivue instance is not available")
      return
    }
    if (item.error) {
      alert(`Process returned error message ${item.error}`)
    }
    if (item.result.data.imageOptionsArray!.length === 0) {
      alert("No image options available in the result")
      return
    }
    await nvRef.current?.loadVolumes(item.result.data.imageOptionsArray!)
  }

  const handleDeleteHistoryItem = (id: string) => {
    setProcessingHistory((prev) => prev.filter((item) => item.id !== id))
  }

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all processing history?")) {
      setProcessingHistory([])
    }
  }

  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    if (nvRef.current) {
      nvRef.current.setSliceType(sliceTypeMap[mode] || 0) // Default to axial if mode is invalid
    }
  }

  const handleVisibility = (id: number) => {
    setCurrentImageIndex(id)
    images.map((img, index) => {
      console.log("img", img, "index", index, "id", id)
      if (index === id) {
        nv.setOpacity(nv.getVolumeIndexByID(img.id), 1);
      } else {
        nv.setOpacity(nv.getVolumeIndexByID(img.id), 0);
      }
    })
    nv.updateGLVolume();
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Medical Image Processing</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <PanelRight className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              <span className="ml-2 sr-only md:not-sr-only md:inline-block">
                {sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            {currentImageIndex === null ? (
              <div className="flex h-full items-center justify-center">
                <ImageUploader onUpload={handleFileUpload} />
              </div>
            ) : (
              <div className="relative flex h-full flex-col">
                <div className="flex-1 overflow-hidden">
                  {<ImageCanvas viewMode={viewMode} nvRef={nv}/>}
                </div>
                <div className="border-t bg-background p-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <ViewSelector currentView={viewMode} onViewChange={handleViewMode} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {sidebarOpen && (
          <aside className={cn("border-l bg-background w-80 overflow-hidden flex flex-col")}>
            <Tabs defaultValue="images">
              <TabsList className="w-full justify-start border-b rounded-none px-2 h-12">
                <TabsTrigger value="images" className="data-[state=active]:bg-muted">
                  Images
                </TabsTrigger>
                <TabsTrigger value="tools" className="data-[state=active]:bg-muted">
                  Processing Tools
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-muted">
                  History
                  {processingHistory.length > 0 && (
                    <span className="ml-1 rounded-full bg-primary w-5 h-5 text-[10px] flex items-center justify-center text-primary-foreground">
                      {processingHistory.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="images" className="flex-1 p-0">
                <div className="flex flex-col h-full">

                  <ScrollArea className="flex-1">
                    {images.length > 0 ? (
                      <div className="grid gap-2 p-4">
                        {images.map((image, index) => (
                          <div
                            key={image.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-md cursor-pointer",
                              currentImageIndex === index ? "bg-muted" : "hover:bg-muted/50",
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
                              <p className="text-sm font-medium truncate">{image.name}</p>
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
              </TabsContent>

              <TabsContent value="tools" className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <RadioGroup value={selectedTool || ""} onValueChange={setSelectedTool}>
                      {processingTools.map((tool) => (
                        <div key={tool.id} className="flex items-start space-x-2 mb-4">
                          <RadioGroupItem value={tool.id} id={tool.id} />
                          <div className="grid gap-1.5">
                            <Label htmlFor={tool.id} className="font-medium">
                              {tool.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">{tool.description}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="flex-1 p-0">
                <ProcessingHistory
                  history={processingHistory}
                  onViewResult={handleViewResult}
                  onDeleteItem={handleDeleteHistoryItem}
                  onClearHistory={handleClearHistory}
                />
              </TabsContent>
            </Tabs>

            <div className="border-t p-4 bg-background">
              <Button
                className="w-full"
                onClick={handleProcessImages}
                disabled={!images.some((img) => img.selected) || !selectedTool}
              >
                <Send className="mr-2 h-4 w-4" />
                Process Selected Images
              </Button>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
