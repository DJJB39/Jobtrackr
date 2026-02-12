

## Dashboard Redesign -- Implementation

Rewrite `src/components/Dashboard.tsx` to match the screenshot layout with a 2-column grid, area chart, pie/donut chart, and sidebar.

---

### Single File Change: `src/components/Dashboard.tsx`

**Layout:** Replace `max-w-4xl` single column with `max-w-7xl` two-column grid (`lg:grid-cols-4`). Left column (`lg:col-span-3`) holds stats row, weekly area chart, and a bottom row with pie + bar charts. Right column (`lg:col-span-1`) holds a sticky upcoming events sidebar.

**New imports from recharts:** `AreaChart`, `Area`, `PieChart`, `Pie`, `Legend`, plus `defs`/`linearGradient`/`stop` for area chart gradient fill.

**New imports from date-fns:** `subWeeks`, `startOfWeek`, `endOfWeek`.

**New computed data:**
- `weeklyData`: Last 8 weeks of job creation counts using `startOfWeek`/`endOfWeek`/`subWeeks`
- Add 4th stat: "Active" count (not in found/rejected)

**Removals:**
- The 8 stage breakdown tile grid at the bottom
- The full-width "Upcoming This Week" card from the top

**Additions:**
- "Applications By Week" `AreaChart` with gold gradient fill, placed below stat row
- "Stages" `PieChart` with `innerRadius={50}` `outerRadius={80}`, placed in bottom-left card
- Existing bar chart moved to bottom-right card
- Upcoming events in a compact sticky sidebar card on the right column

**Stat cards:** 4 cards in a `grid-cols-2 sm:grid-cols-4` row -- Added This Week, Active, Response Rate, Total. More compact padding.

**Responsive:** On mobile (`< lg`), the grid collapses to single column with sidebar below charts.

### Technical Details

- All chart components (`AreaChart`, `PieChart`, `BarChart`) already available in the installed `recharts` package
- `subWeeks`, `startOfWeek`, `endOfWeek` already available in installed `date-fns`
- No new dependencies needed
- Existing `STATUS_COLORS` map reused for pie chart cells
- Existing `JobDetailPanel` integration preserved (click upcoming event to open panel)

