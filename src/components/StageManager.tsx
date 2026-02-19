import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { useStages, PRESET_COLORS, type UserStage } from "@/hooks/useStages";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StageManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobCountByStage?: Record<string, number>;
}

const StageManager = ({ open, onOpenChange, jobCountByStage = {} }: StageManagerProps) => {
  const { rawStages, addStage, deleteStage, reorderStages } = useStages();
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleAdd = useCallback(async () => {
    if (!newTitle.trim()) return;
    const result = await addStage(newTitle.trim(), newColor);
    if (result?.error) {
      toast({ title: "Failed to add stage", variant: "destructive" });
    } else {
      setNewTitle("");
      toast({ title: `"${newTitle.trim()}" stage added` });
    }
  }, [newTitle, newColor, addStage, toast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    if (rawStages.length <= 2) {
      toast({ title: "Minimum 2 stages required", variant: "destructive" });
      setDeleteTarget(null);
      return;
    }
    await deleteStage(deleteTarget);
    toast({ title: "Stage deleted" });
    setDeleteTarget(null);
  }, [deleteTarget, rawStages.length, deleteStage, toast]);

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...rawStages];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    const updated = reordered.map((s, i) => ({ ...s, position: i }));
    setDragIdx(idx);
    reorderStages(updated);
  };

  const handleDragEnd = () => setDragIdx(null);

  const deleteTargetStage = deleteTarget ? rawStages.find((s) => s.stage_id === deleteTarget) : null;
  const deleteTargetJobCount = deleteTarget ? (jobCountByStage[deleteTarget] ?? 0) : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Manage Pipeline Stages</DialogTitle>
          </DialogHeader>

          <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
            {rawStages.map((stage, idx) => (
              <div
                key={stage.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 rounded-lg border border-border/50 bg-card/80 px-3 py-2 transition-all ${
                  dragIdx === idx ? "opacity-50 scale-95" : ""
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0" />
                <div className={`h-3 w-3 rounded-full ${stage.color_class} shrink-0`} />
                <span className="text-sm font-medium text-foreground flex-1 truncate">{stage.title}</span>
                {jobCountByStage[stage.stage_id] ? (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {jobCountByStage[stage.stage_id]} job{jobCountByStage[stage.stage_id] !== 1 ? "s" : ""}
                  </span>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(stage.stage_id)}
                  disabled={rawStages.length <= 2}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add new stage */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <Label className="text-xs text-muted-foreground">Add New Stage</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Stage name"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim()} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className={`h-6 w-6 rounded-full ${color} transition-all ${
                    newColor === color ? "ring-2 ring-offset-1 ring-offset-background ring-primary scale-110" : "opacity-60 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTargetStage?.title}" stage?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargetJobCount > 0
                ? `There are ${deleteTargetJobCount} job(s) in this stage. Move them to another stage before deleting, or they will remain with an orphaned stage.`
                : "This stage has no jobs. It will be permanently removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StageManager;
