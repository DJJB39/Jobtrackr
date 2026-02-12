import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import type { JobApplication } from "@/types/job";
import { differenceInHours, parseISO } from "date-fns";

const isWithin24h = (dateStr: string, time: string | null): boolean => {
  try {
    const dt = time
      ? parseISO(`${dateStr}T${time}`)
      : parseISO(dateStr);
    const diff = differenceInHours(dt, new Date());
    return diff >= 0 && diff <= 24;
  } catch {
    return false;
  }
};

export const useLoginReminders = (jobs: JobApplication[]) => {
  const { toast } = useToast();
  const fired = useRef(false);

  useEffect(() => {
    if (!jobs.length || fired.current) return;
    fired.current = true;

    const upcoming: Array<{ title: string; company: string; date: string }> = [];

    for (const job of jobs) {
      for (const evt of job.events ?? []) {
        if (isWithin24h(evt.date, evt.time)) {
          upcoming.push({ title: evt.title, company: job.company, date: evt.date });
        }
      }
      if (job.closeDate && isWithin24h(job.closeDate, null)) {
        upcoming.push({ title: "Deadline", company: job.company, date: job.closeDate });
      }
    }

    upcoming.slice(0, 2).forEach((item) => {
      toast({
        title: `Coming up: ${item.title}`,
        description: `${item.company} — ${item.date}`,
      });
    });
  }, [jobs.length, toast]);
};
