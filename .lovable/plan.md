

## Detail Panel Redesign -- Match the Screenshot

Close the gap between the landing page "Application Details" screenshot and the actual user experience.

---

### Gap Analysis

| Element | Screenshot Shows | Current Panel Has |
|---------|-----------------|-------------------|
| **Panel width** | Wide view, almost full-screen feel | Narrow `sm:max-w-lg` (~32rem) Sheet |
| **Company name** | Very large, bold heading (24-28px) | Small `text-lg` (18px) in header |
| **Role title** | Prominent subtitle below company | Buried as a form Input field |
| **Salary** | Displayed prominently near top as text | Hidden in a form Input mid-section |
| **Location** | Colored badge (green/teal pill) | Plain Input field |
| **Layout** | Two-column: left (description/notes), right (metadata/events) | Single column, everything stacked |
| **Display mode** | Read-first with clean typography | Form-heavy, every field is an Input |
| **Visual weight** | Strong hierarchy: huge heading, clear sections | Flat, uniform form fields |

---

### Planned Changes (1 file: `src/components/JobDetailPanel.tsx`)

#### 1. Widen the Panel

Change `sm:max-w-lg` to `sm:max-w-2xl` to give the content room for a two-column layout.

#### 2. Redesigned Hero Header

Replace the current small header with a large, impactful hero block:

- Company name: `text-2xl font-bold` (much larger)
- Role: `text-lg text-muted-foreground` displayed as text (not an Input)
- Salary: displayed as a prominent `text-base font-semibold font-mono` value
- Location: rendered as a colored Badge pill (`bg-emerald-500/15 text-emerald-400`)
- Applied date and stage badge in a row below
- "View Original Posting" link moved into the header area
- An "Edit" toggle button in the header corner to switch between view and edit modes

#### 3. Two-Column Content Layout

Below the hero header, split into two columns on wider viewports:

**Left column (2/3 width):**
- Description (read-only text by default, Textarea when editing)
- Notes section card
- Next Steps checklist card

**Right column (1/3 width):**
- Quick Info card: Application Type, Deadline (compact read-only display)
- Contacts card
- Events card (with colored left borders per type)
- Links card

On mobile, these stack into a single column.

#### 4. Read-First Display with Edit Toggle

Instead of every field being an Input at all times:

- Default state shows clean typography (text, not inputs)
- An "Edit" button in the header toggles `isEditing` state
- When editing: fields become Inputs/Textareas/Selects
- When viewing: fields render as styled `<p>` / `<span>` elements
- This matches the polished, read-first feel of the screenshot

#### 5. Colored Location Badge

Replace the plain location Input with:

```text
View mode: <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
             <MapPin /> San Francisco, CA
           </Badge>
Edit mode: <Input placeholder="e.g. San Francisco, CA" ... />
```

#### 6. Prominent Salary Display

In the hero header area, salary shows as:

```text
View mode: <span className="text-base font-semibold font-mono text-primary">$180k-$220k</span>
Edit mode: <Input ... />
```

---

### Technical Details

**State addition:**
```tsx
const [isEditing, setIsEditing] = useState(false);
```

**Hero header structure:**
```tsx
<SheetHeader className="sticky top-0 z-10 bg-gradient-to-r from-card to-secondary/30 backdrop-blur-sm border-b border-border px-6 py-5">
  <div className="flex items-start justify-between">
    <div className="space-y-1.5">
      {/* Stage badge */}
      <div className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${column.colorClass}`} />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{column?.title}</span>
        {saveStatus !== "idle" && <span className="text-[10px] ...">...</span>}
      </div>
      {/* Company - large */}
      {isEditing
        ? <Input value={editedJob.company} onChange={...} className="text-2xl font-bold h-auto" />
        : <h2 className="text-2xl font-bold text-foreground">{editedJob.company}</h2>}
      {/* Role */}
      {isEditing
        ? <Input value={editedJob.role} onChange={...} className="text-lg" />
        : <p className="text-lg text-muted-foreground">{editedJob.role}</p>}
      {/* Salary + Location row */}
      <div className="flex items-center gap-3 flex-wrap pt-1">
        {editedJob.salary && <span className="text-base font-semibold font-mono text-primary">{editedJob.salary}</span>}
        {editedJob.location && (
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
            <MapPin className="h-3 w-3 mr-1" />{editedJob.location}
          </Badge>
        )}
      </div>
    </div>
    {/* Edit toggle */}
    <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
      <Pencil className="h-3.5 w-3.5 mr-1" /> {isEditing ? "Done" : "Edit"}
    </Button>
  </div>
  {/* View posting link */}
  {editedJob.links?.[0] && (
    <a href={editedJob.links[0]} ...>View Original Posting</a>
  )}
</SheetHeader>
```

**Two-column body:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-5 gap-4 px-6 py-5">
  {/* Left column */}
  <div className="sm:col-span-3 space-y-4">
    {/* Description section */}
    {/* Notes section */}
    {/* Next Steps section */}
  </div>
  {/* Right column */}
  <div className="sm:col-span-2 space-y-4">
    {/* Quick Info card (type, deadline, applied date) */}
    {/* Contacts section */}
    {/* Events section */}
    {/* Links section */}
  </div>
</div>
```

**Read/Edit toggle for fields:**
```tsx
{/* Example: Description */}
{isEditing ? (
  <Textarea value={editedJob.description ?? ""} onChange={...} />
) : (
  <p className="text-sm text-muted-foreground leading-relaxed">
    {editedJob.description || "No description added"}
  </p>
)}
```

**Panel width change:**
```tsx
<SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
```

---

### What This Achieves

- Panel widens to give content room to breathe, matching the screenshot proportions
- Company name and role become the dominant visual element (large heading, not a form field)
- Salary and location are immediately visible with colored badges (matching the green pill in the screenshot)
- Two-column layout mirrors the screenshot: description/notes on the left, metadata/events on the right
- Read-first mode shows clean typography by default; edit toggle reveals form fields when needed
- The overall feel shifts from "filling out a form" to "viewing a polished application summary"
- Zero new dependencies -- uses existing Badge, Button, Input components

