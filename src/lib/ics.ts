const pad = (n: number) => String(n).padStart(2, "0");

const toICSDate = (date: string, time?: string | null, durationMinutes = 60) => {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time ? time.split(":").map(Number) : [9, 0];
  const start = `${y}${pad(m)}${pad(d)}T${pad(h)}${pad(min)}00`;

  const endDate = new Date(y, m - 1, d, h, min + durationMinutes);
  const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

  return { start, end };
};

export const generateICS = (event: {
  title: string;
  date: string;
  time?: string | null;
  location?: string | null;
  notes?: string | null;
  durationMinutes?: number;
}): string => {
  const { start, end } = toICSDate(event.date, event.time, event.durationMinutes ?? 60);
  const uid = crypto.randomUUID();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JobTrackr//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${(event.title || "").replace(/[,;\\]/g, " ")}`,
  ];

  if (event.location) lines.push(`LOCATION:${event.location.replace(/[,;\\]/g, " ")}`);
  if (event.notes) lines.push(`DESCRIPTION:${event.notes.replace(/\n/g, "\\n").replace(/[,;\\]/g, " ")}`);

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
};

export const downloadICS = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const googleCalendarUrl = (event: {
  title: string;
  date: string;
  time?: string | null;
  location?: string | null;
  durationMinutes?: number;
}): string => {
  const { start, end } = toICSDate(event.date, event.time, event.durationMinutes ?? 60);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
  });
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
