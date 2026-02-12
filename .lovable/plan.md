

## Consistent Location, Salary, and Deadline Pills on JobCard

The three pills already exist conditionally (lines 77-96). The changes needed are minor consistency fixes:

### What Changes

1. **Add `max-w-[120px]` to location and salary `<span>` elements** so long values like "$150,000 - $200,000 + equity" or "San Francisco, CA (Remote)" truncate cleanly instead of stretching the card.

2. **Add `shrink-0` to all three pill icons** (MapPin, DollarSign, CalendarDays) so icons never get squished by long text -- matching the pattern already used by Building2 and Briefcase above.

3. **Ensure consistent ordering**: location -> salary -> deadline -> next event. Already correct, no change needed.

### Exact Code Change

Replace lines 77-96 with:

```tsx
{job.location && (
  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
    <MapPin className="h-2.5 w-2.5 shrink-0" />
    <span className="truncate max-w-[120px]">{job.location}</span>
  </div>
)}
{job.salary && (
  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
    <DollarSign className="h-2.5 w-2.5 shrink-0" />
    <span className="truncate max-w-[120px]">{job.salary}</span>
  </div>
)}
{job.closeDate && (
  <div className={`mt-1 flex items-center gap-1 text-[10px] ${
    isClosingSoon(job.closeDate) ? "text-destructive font-medium" : "text-muted-foreground"
  }`}>
    <CalendarDays className="h-2.5 w-2.5 shrink-0" />
    <span className="truncate max-w-[120px]">{formatDeadline(job.closeDate)}</span>
  </div>
)}
```

### Summary of Differences from Current Code

- Added `shrink-0` to MapPin, DollarSign, CalendarDays icons (3 additions)
- Added `max-w-[120px]` to all three `<span>` elements (3 additions)

Single file changed: `src/components/JobCard.tsx`, lines 77-96. No new files, no new dependencies.

