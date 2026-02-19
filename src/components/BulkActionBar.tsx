import { type ColumnId } from "@/types/job";
import { useStages } from "@/hooks/useStages";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface BulkActionBarProps {
  selectedCount: number;
  onMove: (targetStage: ColumnId) => void;
  onDelete: () => void;
  onClear: () => void;
}

const BulkActionBar = ({ selectedCount, onMove, onDelete, onClear }: BulkActionBarProps) => {
  const { stages } = useStages();
  const [moveTarget, setMoveTarget] = useState<string>("");

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl glass px-5 py-3 shadow-glow-lg"
        >
          <span className="text-sm font-semibold text-foreground tabular-nums font-mono">
            {selectedCount} selected
          </span>

          <div className="h-5 w-px bg-border/50" />

          <div className="flex items-center gap-2">
            <Select value={moveTarget} onValueChange={(v) => { setMoveTarget(v); onMove(v as ColumnId); }}>
              <SelectTrigger className="h-8 w-[150px] text-xs border-border/50">
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Move to…" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {stages.map((col) => (
                  <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-8 gap-1.5 text-xs">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selectedCount} application{selectedCount !== 1 ? "s" : ""}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the selected applications and all their events.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={onDelete}
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={onClear}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkActionBar;
