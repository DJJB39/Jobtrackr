import { useState, useMemo } from "react";
import { parseSalary } from "@/lib/salary";
import { type JobApplication, type ColumnId } from "@/types/job";
import { useStages } from "@/hooks/useStages";
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ListViewProps {
  jobs: JobApplication[];
  onSelectJob: (job: JobApplication) => void;
  searchQuery: string;
}

type SortKey = "company" | "role" | "columnId" | "applicationType" | "createdAt" | "salary";
type SortDir = "asc" | "desc";

const ListView = ({ jobs, onSelectJob, searchQuery }: ListViewProps) => {
  const { stages } = useStages();
  const stageMap = Object.fromEntries(stages.map((c) => [c.id, c.title]));
  const stageOrder = Object.fromEntries(stages.map((c, i) => [c.id, i]));

  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter(
      (j) =>
        j.company.toLowerCase().includes(q) ||
        j.role.toLowerCase().includes(q) ||
        (j.notes ?? "").toLowerCase().includes(q) ||
        (j.description ?? "").toLowerCase().includes(q) ||
        (j.location ?? "").toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  const sorted = useMemo(() => {
    const mult = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "company":
          return mult * a.company.localeCompare(b.company);
        case "role":
          return mult * a.role.localeCompare(b.role);
        case "columnId":
          return mult * ((stageOrder[a.columnId] ?? 99) - (stageOrder[b.columnId] ?? 99));
        case "applicationType":
          return mult * a.applicationType.localeCompare(b.applicationType);
        case "createdAt":
          return mult * a.createdAt.localeCompare(b.createdAt);
        case "salary": {
          return mult * ((parseSalary(a.salary)?.min ?? 0) - (parseSalary(b.salary)?.min ?? 0));
        }
        default:
          return 0;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const SortableHead = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === field ? "text-primary" : "text-muted-foreground/40"}`} />
      </span>
    </TableHead>
  );

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableHead label="Company" field="company" />
              <SortableHead label="Role" field="role" />
              <SortableHead label="Stage" field="columnId" />
              <SortableHead label="Type" field="applicationType" />
              <SortableHead label="Date" field="createdAt" />
              <SortableHead label="Salary" field="salary" />
              <TableHead className="hidden lg:table-cell">Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((job) => {
              const col = stages.find((c) => c.id === job.columnId);
              return (
                <TableRow
                  key={job.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onSelectJob(job)}
                >
                  <TableCell className="font-medium text-foreground">{job.company}</TableCell>
                  <TableCell className="text-muted-foreground">{job.role}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1.5 text-xs">
                      {col && <div className={`h-2 w-2 rounded-full ${col.colorClass}`} />}
                      {stageMap[job.columnId] ?? job.columnId}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{job.applicationType}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {format(new Date(job.createdAt), "MMM d")}
                  </TableCell>
                  <TableCell className="text-foreground text-xs font-mono">{job.salary ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs hidden lg:table-cell">{job.location ?? "—"}</TableCell>
                </TableRow>
              );
            })}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-12">
                  {searchQuery ? "No applications match your search" : "No applications yet"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ListView;
