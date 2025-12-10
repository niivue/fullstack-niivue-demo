import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ScenesService } from "@/client";
import { Trash2 } from "lucide-react";

export default function DeleteAllScenes() {
  const queryClient = useQueryClient();

  const deleteScenes = async () => {
    await ScenesService.deleteAllScenes();
  };

  const mutation = useMutation({
    mutationFn: deleteScenes,
    onSuccess: () => {},
    onError: () => {
      // Handle error, e.g., show a toast notification
    },
    onSettled: () => {
      queryClient.invalidateQueries();
    },
  });

  const onSubmit = async () => {
    if (confirm("Are you sure you want to clear all processing history?")) {
      mutation.mutate();
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={onSubmit}>
      <Trash2 className="h-4 w-4 mr-1" />
      Clear All
    </Button>
  );
}
