import { useState, type ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, TrendingUp, History } from "lucide-react";

export type YouTab = "cv" | "progression" | "history";

interface YouViewProps {
  defaultTab?: YouTab;
  cvSlot: ReactNode;
  progressionSlot: ReactNode;
  historySlot: ReactNode;
}

const YouView = ({ defaultTab = "cv", cvSlot, progressionSlot, historySlot }: YouViewProps) => {
  const [tab, setTab] = useState<YouTab>(defaultTab);
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as YouTab)} className="flex flex-1 flex-col min-h-0">
      <div className="px-4 sm:px-6 pt-3">
        <TabsList className="bg-secondary/30 border border-border/50">
          <TabsTrigger value="cv" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" /> CV
          </TabsTrigger>
          <TabsTrigger value="progression" className="gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" /> Progression
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" /> History
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="cv" className="flex-1 mt-0 flex flex-col min-h-0">{cvSlot}</TabsContent>
      <TabsContent value="progression" className="flex-1 mt-0 flex flex-col min-h-0">{progressionSlot}</TabsContent>
      <TabsContent value="history" className="flex-1 mt-0 flex flex-col min-h-0">{historySlot}</TabsContent>
    </Tabs>
  );
};

export default YouView;