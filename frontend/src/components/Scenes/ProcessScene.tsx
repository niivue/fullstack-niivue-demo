import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SceneUpdate, ScenesService } from "@/client";
import type { ApiError } from "@/client/core/ApiError";
import { useState } from "react";
import { Niivue } from "@niivue/niivue";
import { ImageFile } from "@/components/image-processor";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import type { SceneCreate } from "@/client/types.gen";
import { type NiimathOperation } from "@/components/niimath-config";

interface ProcessSceneProps {
  nvRef: React.RefObject<Niivue>;
  images: ImageFile[];
  sceneId: string | null;
  selectedTool: string | null;
  niimathOperations: NiimathOperation[];
}

export default function ProcessScene({
  images,
  sceneId,
  selectedTool,
  niimathOperations,
}: ProcessSceneProps) {
  const [currentProcessing, setCurrentProcessing] =
    useState<SceneCreate | null>(null);

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: SceneUpdate) =>
      ScenesService.createAndProcessScene({ id: sceneId!, requestBody: data }),
    onSuccess: () => {
      setCurrentProcessing(null);
    },
    onError: (error: ApiError) => {
      console.error("Error processing scene:", error);
      alert(`Error processing scene: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["scenes"] });
    },
  });

  const generateNiimathCommand = (operations: NiimathOperation[]) => {
    if (operations.length === 0) return "niimath input.nii output.nii";

    const operationsStr = operations
      .map((op) => {
        const args = op.args.filter((arg) => arg.trim() !== "").join(" ");
        return args ? `${op.operator} ${args}` : op.operator;
      })
      .join(" ");

    return operationsStr;
  };

  const handleProcessImages = () => {
    const selectedImages = images.filter((img) => img.selected);
    if (selectedImages.length === 0 || !selectedTool) {
      alert("Please select at least one image and a processing tool");
      return;
    }
    console.log("Processing images:", selectedImages, selectedTool);
    // Special handling for niimath
    if (selectedTool === "niimath" && niimathOperations.length === 0) {
      alert("Please add at least one niimath operation");
      return;
    }

    // Prepare parameters based on selected tool
    let parameters: Record<string, any> = {};
    if (selectedTool === "niimath") {
      parameters = {
        operations: niimathOperations.map((op) => ({
          operator: op.operator,
          args: op.args.filter((arg) => arg.trim() !== ""),
          description: op.description,
        })),
        command: `niimath input.nii ${generateNiimathCommand(niimathOperations)} output.nii`,
      };
    }

    mutation.mutate({
      tool_name: generateNiimathCommand(niimathOperations),
      status: "processing",
    });
  };

  return (
    <Button
      className="w-full"
      onClick={handleProcessImages}
      disabled={!images.some((img) => img.selected) || !selectedTool}
    >
      <Send className="mr-2 h-4 w-4" />
      Process Selected Images
    </Button>
  );
}
