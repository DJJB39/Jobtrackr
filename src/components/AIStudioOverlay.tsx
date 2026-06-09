import { Sheet, SheetContent } from "@/components/ui/sheet";
import AIStudioView from "@/components/AIStudioView";
import type { JobApplication } from "@/types/job";

interface AIStudioOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: JobApplication[];
  onOpenCoach: (job: JobApplication) => void;
  onOpenBootcamp: (job: JobApplication) => void;
  onOpenTailor: (job: JobApplication) => void;
  onOpenAI: (job: JobApplication) => void;
  onOpenScreenshot: () => void;
  onSwitchToCV: () => void;
}

const AIStudioOverlay = ({ open, onOpenChange, ...rest }: AIStudioOverlayProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="right"
      className="w-screen sm:max-w-none p-0 overflow-hidden flex flex-col"
    >
      <AIStudioView
        {...rest}
        onSwitchToCV={() => { rest.onSwitchToCV(); onOpenChange(false); }}
        onOpenCoach={(j) => { rest.onOpenCoach(j); onOpenChange(false); }}
        onOpenBootcamp={(j) => { rest.onOpenBootcamp(j); onOpenChange(false); }}
        onOpenTailor={(j) => { rest.onOpenTailor(j); onOpenChange(false); }}
        onOpenAI={(j) => { rest.onOpenAI(j); onOpenChange(false); }}
        onOpenScreenshot={() => { rest.onOpenScreenshot(); onOpenChange(false); }}
      />
    </SheetContent>
  </Sheet>
);

export default AIStudioOverlay;