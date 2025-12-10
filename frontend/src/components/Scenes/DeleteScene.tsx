import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ScenesService } from "@/client";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export default function DeleteScene({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const deleteScene = async (id: string) => {
    await ScenesService.deleteScene({ id: id });
  };

  const mutation = useMutation({
    mutationFn: deleteScene,
    onSuccess: () => {
      setIsDeleting(false);
    },
    onError: () => {
      //   showErrorToast("An error occurred while deleting the item")
    },
    onSettled: () => {
      queryClient.invalidateQueries();
    },
  });

  const onSubmit = async () => {
    if (confirm("Are you sure you want to delete this scene?")) {
      setIsDeleting(true);
      mutation.mutate(id);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full text-red-500"
      onClick={() => onSubmit()}
    >
      <Trash2 className="h-3 w-3 mr-1" />
      Remove
    </Button>
  );
}
