import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Calendar, ArrowRight, Flame } from "lucide-react";
import type { JobApplication } from "@/types/job";
import type { UserCV } from "@/hooks/useUserCV";
import {
  getCornerOrders,
  getFightRecord,
  getUpcomingEvents,
  getCornerTalk,
  roastHintFromCV,
  type CornerAction,
  type CornerOrder,
} from "@/lib/cornerLogic";

interface TodayViewProps {
  jobs: JobApplication[];
  cv: UserCV | null;
  onAction: (action: CornerAction) => void;
}

const TodayView = ({ jobs, cv, onAction }: TodayViewProps) => {
  const roast = useMemo(() => roastHintFromCV(cv), [cv]);
  const orders = useMemo(() => getCornerOrders(jobs, cv, roast), [jobs, cv, roast]);
  const record = useMemo(() => getFightRecord(jobs, roast), [jobs, roast]);
  const upcoming = useMemo(() => getUpcomingEvents(jobs, 14).slice(0, 6), [jobs]);
  const cornerTalk = useMemo(() => getCornerTalk(), []);

  const today = new Date();
  const [primary, ...rest] = orders;
  const secondaryOrders = rest.slice(0, 3);

  return (
    <div className="cornerman flex-1 overflow-y-auto pb-24 sm:pb-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 pt-8 sm:pt-10">
        {/* Header */}
        <div className="mb-6">
          <div className="cm-mono text-[10px] uppercase tracking-[0.28em] cm-text-dim">
            Today's Orders
          </div>
          <h1 className="cm-serif text-3xl sm:text-4xl mt-1.5 leading-tight" style={{ color: "var(--cm-text)" }}>
            {format(today, "EEEE, MMMM d")}
          </h1>
          <p className="cm-mono mt-2 text-xs italic cm-text-dim">&ldquo;{cornerTalk}&rdquo;</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Orders column */}
          <div className="flex flex-col gap-4">
            {primary && <PrimaryOrderCard order={primary} onAction={onAction} />}

            {secondaryOrders.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="cm-mono text-[10px] uppercase tracking-[0.24em] cm-text-dim px-1">
                  Next up
                </div>
                {secondaryOrders.map((o) => (
                  <SecondaryOrderRow key={o.id} order={o} onAction={onAction} />
                ))}
              </div>
            )}
          </div>

          {/* Right rail: Fight Record */}
          <FightRecordPanel record={record} />
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="mt-10">
            <div className="cm-mono text-[10px] uppercase tracking-[0.24em] cm-text-dim mb-3 flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Upcoming · next 14 days
            </div>
            <div className="cm-roast-card rounded-lg overflow-hidden">
              {upcoming.map((item, i) => {
                let dateLabel = item.date;
                try { dateLabel = format(parseISO(item.date), "EEE d MMM"); } catch { /* keep raw */ }
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-4 py-3 ${i < upcoming.length - 1 ? "border-b cm-border" : ""}`}
                  >
                    <div className="cm-mono text-[11px] uppercase tracking-wider cm-text-amber w-20 shrink-0">
                      {dateLabel}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate" style={{ color: "var(--cm-text)" }}>{item.title}</div>
                      <div className="text-xs cm-text-dim truncate">{item.company} · {item.role}</div>
                    </div>
                    {item.time && (
                      <div className="cm-mono text-[11px] cm-text-dim shrink-0">{item.time}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PrimaryOrderCard = ({ order, onAction }: { order: CornerOrder; onAction: (a: CornerAction) => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className="cm-roast-card relative rounded-xl p-6 sm:p-8 overflow-hidden"
  >
    <div className="cm-halo absolute inset-0 pointer-events-none" />
    <div className="relative">
      <div className="cm-mono text-[10px] uppercase tracking-[0.24em] cm-text-amber flex items-center gap-1.5">
        <Flame className="h-3 w-3" /> Order #1
      </div>
      <h2 className="cm-serif text-2xl sm:text-3xl mt-3 leading-tight" style={{ color: "var(--cm-text)" }}>
        {order.headline}
      </h2>
      <p className="text-sm sm:text-base cm-text-dim mt-2.5">{order.detail}</p>
      <div className="mt-6">
        <button
          onClick={() => onAction(order.primary)}
          className="cm-cta-primary inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm"
        >
          {order.primary.label}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  </motion.div>
);

const SecondaryOrderRow = ({ order, onAction }: { order: CornerOrder; onAction: (a: CornerAction) => void }) => (
  <div className="cm-roast-card cm-card-hover rounded-lg px-4 py-3 flex items-center gap-3">
    <div className="flex-1 min-w-0">
      <div className="text-sm truncate" style={{ color: "var(--cm-text)" }}>{order.headline}</div>
      <div className="text-xs cm-text-dim truncate">{order.detail}</div>
    </div>
    <button
      onClick={() => onAction(order.primary)}
      className="cm-cta-ghost shrink-0 rounded-md px-3 py-1.5 text-xs"
    >
      {order.primary.label}
    </button>
  </div>
);

const FightRecordPanel = ({ record }: { record: ReturnType<typeof getFightRecord> }) => {
  const rows: { label: string; value: string; sub?: string }[] = [
    {
      label: "Roast",
      value: record.roastScore != null ? String(record.roastScore) : "—",
      sub:
        record.roastDelta != null
          ? `${record.roastDelta >= 0 ? "+" : ""}${record.roastDelta}`
          : undefined,
    },
    { label: "Interviews", value: String(record.interviewsThisMonth), sub: "this month" },
    {
      label: "Response",
      value: record.responseRate != null ? `${record.responseRate}%` : "—",
    },
  ];
  return (
    <div className="cm-roast-card rounded-xl p-5">
      <div className="cm-mono text-[10px] uppercase tracking-[0.24em] cm-text-dim mb-3">
        Fight Record
      </div>
      <div className="grid grid-cols-3 lg:grid-cols-1 gap-4 lg:gap-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-0.5">
            <div className="cm-mono text-[10px] uppercase tracking-wider cm-text-dim">{r.label}</div>
            <div className="flex items-baseline gap-2">
              <div className="cm-mono text-lg" style={{ color: "var(--cm-text)" }}>{r.value}</div>
              {r.sub && <div className="cm-mono text-[10px] cm-text-amber">{r.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodayView;