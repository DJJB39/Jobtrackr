

## Fix: Kanban Drag-and-Drop Between Columns

### Problem
Cards can't be reliably dragged between columns because the droppable zone in each column is too small. The `setNodeRef` in `KanbanColumn.tsx` is attached only to the inner content `div` (the card list area), not the full column. This makes it hard for the collision detection algorithm to register drops on adjacent or empty columns.

### Changes

**1. `src/components/KanbanColumn.tsx`**
- Move `setNodeRef` from the inner content div (line 30) to the outer column wrapper div (line 18), making the entire column (including its header) a valid drop target.
- Keep `min-h-[120px]` on the inner div for visual spacing, but the droppable zone will now cover the full column height.

**2. `src/components/KanbanBoard.tsx`**
- Change collision detection from `closestCorners` to `closestCenter`, which is more forgiving for horizontal column layouts and better at detecting the nearest column when dragging across the board.

### Why This Fixes It
- `closestCorners` calculates distance to all four corners of each droppable rect -- in a horizontal kanban layout with tall, narrow columns, this often picks the wrong target or misses adjacent columns entirely.
- `closestCenter` uses a single center point per droppable, which maps naturally to "which column am I hovering over."
- Making the full column droppable eliminates dead zones in the header and padding areas.

### Technical Details
- Two files changed, ~4 lines modified total
- No impact on card-to-card sorting within a column (SortableContext handles that independently)
- No database or API changes needed

