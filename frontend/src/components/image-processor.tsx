"use client";

import { useRef, useState } from "react";
import { PanelLeft, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ProcessingHistory from "@/components/processing-history";
import { cn } from "@/lib/utils";
import { Niivue, NVImage } from "@niivue/niivue";
import ProcessScene from "./Scenes/ProcessScene";
import ImageUploader from "./Uploader/image-uploader";
import ImageCanvas from "./image-canvas";
import NiimathConfig, {
  type NiimathOperation,
} from "@/components/niimath-config";
import useAuth from "@/hooks/useAuth";
import ImageList from "./image-list";

export type ImageFile = {
  id: string;
  name: string;
  file: File;
  selected: boolean;
};

type ProcessingTool = {
  id: string;
  name: string;
  description: string;
};

export const nv = new Niivue({
  dragAndDropEnabled: false,
  textHeight: 0.02,
  backColor: [0, 0, 0, 1],
  crosshairColor: [244, 243, 238, 0.5],
  multiplanarForceRender: false,
});

export default function MedicalImageProcessor() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(
    null
  );
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [niimathOperations, setNiimathOperations] = useState<
    NiimathOperation[]
  >([]);
  const nvRef = useRef<Niivue | null>(nv);
  const { logout } = useAuth();
  const processingTools: ProcessingTool[] = [
    {
      id: "niimath",
      name: "Niimath",
      description: "Perform mathematical operations on images",
    },
  ];

  // Add uploaded files to Niivue
  let handleFileUpload = async (files: File[]) => {
    if (!nvRef.current) return;
    const nv = nvRef.current;

    files.forEach(async (file) => {
      const nvimage = await NVImage.loadFromFile({
        file: file,
      });
      console.log("nv", nv);

      nv.addVolume(nvimage);

      const newImage = {
        id: nvimage.id,
        name: nvimage.name,
        file: file,
        selected: false,
      };
      setImages((prev) => [...prev, ...[newImage]]);
    });
    setCurrentImageIndex(nv.volumes.length - 1);
  };

  const handleVisibility = (id: number) => {
    setCurrentImageIndex(id);
    images.map((img, index) => {
      console.log("img", img, "index", index, "id", id);
      if (index === id) {
        nv.setOpacity(nv.getVolumeIndexByID(img.id), 1);
      } else {
        nv.setOpacity(nv.getVolumeIndexByID(img.id), 0);
      }
    });
    nv.updateGLVolume();
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Medical Image Processing</h1>
          <div className="flex items-center gap-4">
            {/* <div className="text-sm text-muted-foreground">
              Welcome, {user.name}
            </div> */}
            <Button variant="outline" size="sm" onClick={logout}>
              Sign Out
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelRight className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
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
                <ImageUploader
                  onUpload={handleFileUpload}
                  onSetSceneId={setSceneId}
                />
              </div>
            ) : (
              <ImageCanvas
                nvRef={nv}
                onFileUpload={handleFileUpload}
                onSetSceneId={setSceneId}
              />
            )}
          </div>
        </main>

        {sidebarOpen && (
          <aside
            className={cn(
              "border-l bg-background w-80 overflow-scroll flex flex-col"
            )}
          >
            <Tabs defaultValue="images">
              <TabsList className="w-full justify-start border-b rounded-none px-2 h-12">
                <TabsTrigger
                  value="images"
                  className="data-[state=active]:bg-muted"
                >
                  Images
                </TabsTrigger>
                <TabsTrigger
                  value="tools"
                  className="data-[state=active]:bg-muted"
                >
                  Processing Tools
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-muted"
                >
                  History
                  {/* {processingHistory.length > 0 && (
                    <span className="ml-1 rounded-full bg-primary w-5 h-5 text-[10px] flex items-center justify-center text-primary-foreground">
                      {processingHistory.length}
                    </span>
                  )} */}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="images" className="flex-1 p-0">
                <ImageList
                  images={images}
                  currentImageIndex={currentImageIndex}
                  setImages={setImages}
                  handleVisibility={handleVisibility}
                />
              </TabsContent>

              <TabsContent value="tools" className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <RadioGroup
                      value={selectedTool || ""}
                      onValueChange={setSelectedTool}
                    >
                      {processingTools.map((tool) => (
                        <div
                          key={tool.id}
                          className="flex items-start space-x-2 mb-4"
                        >
                          <RadioGroupItem value={tool.id} id={tool.id} />
                          <div className="grid gap-1.5">
                            <Label htmlFor={tool.id} className="font-medium">
                              {tool.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                    {selectedTool === "niimath" && (
                      <div className="border-t pt-4">
                        <NiimathConfig
                          operations={niimathOperations}
                          onOperationsChange={setNiimathOperations}
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="flex-1 p-0">
                <ProcessingHistory
                  nvRef={nvRef}
                  onSetCurrentImageIndex={setCurrentImageIndex}
                  setImages={setImages}
                />
              </TabsContent>
            </Tabs>

            <div className="border-t p-4 bg-background">
              <ProcessScene
                nvRef={nvRef}
                images={images.filter((img) => img.selected)}
                sceneId={sceneId}
                selectedTool={selectedTool}
                niimathOperations={niimathOperations}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
