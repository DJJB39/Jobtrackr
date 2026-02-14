import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import type { JobApplication } from "@/types/job";
import { differenceInHours, differenceInDays, parseISO } from "date-fns";

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

const isWithin2h = (dateStr: string, time: string | null): boolean => {
  try {
    const dt = time
      ? parseISO(`${dateStr}T${time}`)
      : parseISO(dateStr);
    const diff = differenceInHours(dt, new Date());
    return diff >= 0 && diff <= 2;
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

    const upcoming: Array<{ title: string; company: string; date: string; time: string | null }> = [];
    const urgent: Array<{ title: string; company: string; date: string }> = [];

    for (const job of jobs) {
      for (const evt of job.events ?? []) {
        if (isWithin24h(evt.date, evt.time)) {
          upcoming.push({ title: evt.title, company: job.company, date: evt.date, time: evt.time });
        }
        if (isWithin2h(evt.date, evt.time)) {
          urgent.push({ title: evt.title, company: job.company, date: evt.date });
        }
      }
      if (job.closeDate && isWithin24h(job.closeDate, null)) {
        upcoming.push({ title: "Deadline", company: job.company, date: job.closeDate, time: null });
      }
    }

    // Toast notifications
    upcoming.slice(0, 2).forEach((item) => {
      toast({
        title: `Coming up: ${item.title}`,
        description: `${item.company} — ${item.date}`,
      });
    });

    // Browser notifications for urgent events (within 2h)
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      urgent.slice(0, 3).forEach((item) => {
        try {
          new Notification(`⏰ ${item.title}`, {
            body: `${item.company} — ${item.date}`,
            icon: "/favicon.ico",
          });
        } catch { /* ignore */ }
      });
    }

    // Stale apps reminder
    const now = new Date();
    const staleCount = jobs.filter((j) => {
      if (["accepted", "rejected"].includes(j.columnId)) return false;
      const created = parseISO(j.createdAt);
      return differenceInDays(now, created) >= 14;
    }).length;

    if (staleCount > 0) {
      toast({
        title: `${staleCount} application(s) need attention`,
        description: "No updates in 14+ days — consider following up",
      });
    }
  }, [jobs.length, toast]);
};
