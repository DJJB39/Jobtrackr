
## Dark Mode Redesign -- Full Implementation

Complete dark-first theme overhaul across 7 files to match the premium, vibrant screenshots.

---

### 1. `src/index.css` -- Dark palette as default

- Swap `:root` to use dark values: `--background: 222 47% 6%`, `--card: 222 44% 10%`, `--primary: 36 95% 54%` (gold accent)
- Add gradient tokens: `--gradient-start`, `--gradient-end`
- Move current light values into a `.light` class for future toggle
- Brighter `--muted-foreground: 215 20% 60%` for readability
- `--ring` set to gold accent for focus states

### 2. `src/components/JobCard.tsx` -- Colored left borders + richer hover

- Add `columnId?: ColumnId` prop
- Add `STATUS_BORDER_COLORS` map (HSL values per stage)
- Apply `border-l-[3px]` via inline `borderLeftColor` style
- Card background: `bg-gradient-to-r from-card to-card/80`
- Hover: `hover:shadow-lg hover:shadow-primary/5`
- Dragging: `shadow-2xl shadow-primary/10` (replaces `opacity-50`)

### 3. `src/components/KanbanColumn.tsx` -- Tinted headers + count badges

- Add `STATUS_COLORS_HEX` map for tinting
- Column header row gets `style={{ backgroundColor: tintColor + "15" }}`
- Status dot: `h-3 w-3` (larger)
- Count badge: styled pill with `backgroundColor: tintColor + "20"`
- Column body: `bg-gradient-to-b from-column to-transparent`
- Pass `columnId={column.id}` to each `JobCard`

### 4. `src/components/KanbanBoard.tsx` -- Pass columnId in DragOverlay

- Single line change: add `columnId={activeJob.columnId}` to the DragOverlay JobCard

### 5. `src/components/Dashboard.tsx` -- Gradient stat cards + chart polish

- StatCard gets `accentColor` prop: colored left border (`borderLeftWidth: 3`), gradient bg (`from-card to-secondary/20`), tinted icon container
- Three accent colors: gold, blue, purple
- Upcoming card: gradient background
- Chart tooltip: dark background (`hsl(222, 44%, 12%)`)
- Stage breakdown cards: `bg-gradient-to-b from-card to-secondary/10` + `hover:shadow-md`

### 6. `src/components/JobDetailPanel.tsx` -- Section cards + gradient header

- Header: `bg-gradient-to-r from-card to-secondary/30 backdrop-blur-sm`
- Remove all `<Separator />` dividers
- Wrap each section (Company/Role, Notes, Contacts, Next Steps, Events, Links) in `rounded-xl border border-border bg-card/50 p-4`
- Section headings: `text-sm font-semibold` with colored icon circles (accent, blue, green, purple, orange)
- Event cards: `border-l-[3px]` colored by event type (blue=interview, amber=follow-up, red=deadline)

### 7. `src/pages/AppPage.tsx` -- Shell gradient + glass header

- Main container: `bg-gradient-to-br from-[hsl(var(--gradient-start))] via-background to-[hsl(var(--gradient-end))]`
- Header: `backdrop-blur-sm bg-background/80`

---

### Implementation Order

1. index.css (instant global theme switch)
2. JobCard.tsx (colored borders, gradient bg)
3. KanbanColumn.tsx (tinted headers, pass columnId)
4. KanbanBoard.tsx (DragOverlay fix)
5. Dashboard.tsx (gradient stat cards, chart)
6. JobDetailPanel.tsx (section cards, gradient header)
7. AppPage.tsx (shell gradient, glass header)

### What This Achieves

- Entire app switches to a premium dark theme matching the screenshots
- Color-coded left borders on Kanban cards per stage
- Tinted column headers with visual weight
- Dashboard stat cards and charts gain depth via gradients and accent borders
- Detail panel sections become distinct cards with colored icons
- Glass-effect header and gradient background on the app shell
- Zero new dependencies -- all existing Tailwind classes and CSS variables
