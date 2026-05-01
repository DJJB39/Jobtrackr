import { memo } from "react";
import { motion } from "framer-motion";
import { Briefcase, Columns3, Download, CalendarDays, X, List, Search, FileUp, Upload, LayoutDashboard, ArrowLeft, Sparkles } from "lucide-react";
import AddJobDialog from "@/components/AddJobDialog";
import UserMenu from "@/components/UserMenu";
import ShareStats from "@/components/ShareStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import type { JobApplication, ColumnId } from "@/types/job";

export type View = "board" | "dashboard" | "calendar" | "list" | "cv" | "ai";

export const VIEW_ITEMS = [
  { key: "board" as View, icon: Columns3, label: "Board" },
  { key: "list" as View, icon: List, label: "List" },
  { key: "dashboard" as View, icon: LayoutDashboard, label: "Insights" },
  { key: "calendar" as View, icon: CalendarDays, label: "Calendar" },
  { key: "cv" as View, icon: FileUp, label: "CV" },
  { key: "ai" as View, icon: Sparkles, label: "AI Studio" },
];

interface AppHeaderProps {
  jobs: JobApplication[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  view: View;
  setView: (v: View) => void;
  searchPulse: boolean;
  isMac: boolean;
  onImport: () => void;
  onExport: () => void;
  onAddJob: (company: string, role: string, columnId: ColumnId, applicationType?: string, extras?: {
    location?: string; description?: string; links?: string[]; salary?: string; closeDate?: string;
  }) => void;
  isDemo?: boolean;
}

const AppHeader = memo(({
  jobs, searchQuery, setSearchQuery, view, setView,
  searchPulse, isMac, onImport, onExport, onAddJob, isDemo,
}: AppHeaderProps) => {
  return (
    <>
      {isDemo && (
        <div className="flex items-center gap-2.5 border-b border-border/60 bg-card/40 px-6 py-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Demo · nothing saved
          </span>
          <Link
            to="/auth?tab=signup"
            className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-primary hover:text-primary/80 transition-colors"
          >
            Sign up →
          </Link>
        </div>
      )}
      <header className="border-b border-border/50 px-4 sm:px-6 py-3 glass sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDemo && (
              <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
            )}
            <div className="relative hidden sm:block">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-glow">
                <Briefcase className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-display tracking-tight text-foreground">Cornerman</h1>
              <p className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase hidden sm:block">
                {jobs.length} application{jobs.length !== 1 ? "s" : ""} tracked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className={`relative hidden md:block ${searchPulse ? "animate-pulse" : ""}`} data-tour="search-input">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-48 lg:w-64 pl-8 pr-14 text-sm bg-secondary/50 border-border/50 focus:border-primary/50 focus:shadow-glow transition-shadow"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/50 pointer-events-none">
                  {isMac ? "⌘K" : "Ctrl+K"}
                </kbd>
              )}
            </div>

            {/* View switcher */}
            <nav className="hidden sm:flex items-center rounded-xl border border-border/50 bg-secondary/30 p-0.5 mr-1" data-tour="view-switcher">
              {VIEW_ITEMS.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    view === key
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {view === key && (
                    <motion.div
                      layoutId={isDemo ? "demoViewIndicator" : "viewIndicator"}
                      className="absolute inset-0 bg-card/80 rounded-lg shadow-sm border border-border/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                </button>
              ))}
            </nav>

            {/* Mobile view switcher */}
            <div className="flex sm:hidden items-center rounded-xl border border-border/50 bg-secondary/30 p-0.5 mr-1">
              {VIEW_ITEMS.filter(({ key }) => key !== "list").map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`relative p-1.5 rounded-lg transition-all ${
                    view === key ? "bg-card/80 shadow-sm" : ""
                  }`}
                >
                  <Icon className={`h-4 w-4 ${view === key ? "text-foreground" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-2">
              {!isDemo && <ShareStats jobs={jobs} />}
              <Button variant="outline" size="sm" className="gap-2 border-border/50 hover:border-border" onClick={onImport}>
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2 border-border/50 hover:border-border" onClick={onExport} disabled={jobs.length === 0}>
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
            {!isDemo && (
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
                onClick={() => setView("ai")}
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI Studio</span>
              </Button>
            )}
            <div data-tour="add-button" className="hidden sm:block">
              <AddJobDialog onAdd={onAddJob} jobs={jobs} />
            </div>
            <span className="hidden sm:block">{!isDemo && <UserMenu />}</span>
          </div>
        </div>

        {/* Mobile search */}
        <div className={`mt-3 md:hidden relative ${searchPulse ? "animate-pulse" : ""}`}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8 pr-14 text-sm bg-secondary/50 border-border/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>
    </>
  );
});

AppHeader.displayName = "AppHeader";

export default AppHeader;
