---
name: Task details description due date
overview: "Add optional description and due date to tasks with an expand-in-place (accordion) UX: collapsed row shows title + due-date badge + chevron; one tap expands to show and edit description and due date. Mobile-friendly tap targets and no hover-only behavior."
todos: []
isProject: false
---

# Task details (description + due date) with expand-in-place UX

## Data model and persistence

- **Types** ([src/types/index.ts](src/types/index.ts)): Extend `Task` with:
  - `description?: string`
  - `dueDate?: number` (timestamp, start-of-day in local time or UTC — pick one and document)
- **Migration** ([src/utils/storage.ts](src/utils/storage.ts)): In `migrateState`, ensure existing tasks get `description` and `dueDate` as undefined (no-op; new fields are optional). Optionally add an explicit migration step that sets missing fields so schema is consistent.
- **Context** ([src/context/TaskContext.tsx](src/context/TaskContext.tsx)): No signature changes. `addTask` already omits optional fields for new tasks; ensure new `Task` objects do not set `description`/`dueDate` so they stay undefined. `updateTask(updates: Partial<Task>)` already supports any `Task` field, so it will persist `description` and `dueDate` once they exist on the type. Firebase/localStorage will persist the full task object as they do today.

## Date formatting

- Add a small **date helper** (e.g. in [src/utils/taskUtils.ts](src/utils/taskUtils.ts) or a new `src/utils/dateUtils.ts`): one function to format `dueDate` (timestamp) for display (e.g. “Mar 12” or “Mar 12, 2025”) and optionally one for `input type="date"` value (YYYY-MM-DD). Reuse patterns from [EntryNode.tsx](src/components/plan-mode/EntryNode.tsx) / [PlanView.tsx](src/components/plan-mode/PlanView.tsx) (`toLocaleDateString`).

## Create mode: TaskNode (expand-in-place)

- **File**: [src/components/create-mode/TaskNode.tsx](src/components/create-mode/TaskNode.tsx)
- **Behavior**:
  - Only for `task.type === 'task'` (not notes/text-blocks/entries). Other types are unchanged.
  - **Collapsed row**: Left-to-right: drag handle, checkbox, title (editable as today), then **due-date badge** (if `task.dueDate`), then **chevron** (ChevronRight / ChevronDown). Optional: small “has description” indicator (e.g. FileText or dot) when `task.description` is non-empty.
  - **Tap target**: Whole row (or a clear “details” control) toggles expanded state. Use a min-height (e.g. 44px) and ensure the chevron is inside the tappable area. Do not rely on hover.
  - **Expanded section**: Below the row, indented block with:
    - **Description**: Label “Description” + `<textarea>` (controlled, value = `task.description ?? ''`, `onChange` → `updateTask(id, { description })` on blur or debounced).
    - **Due date**: Label “Due date” + native `<input type="date">` (value from `dueDate` in YYYY-MM-DD, onChange → `updateTask(id, { dueDate })` with timestamp for start-of-day).
  - **State**: Local `isDetailsExpanded` (useState). Sync from `task.description`/`task.dueDate` only for initial expand (e.g. auto-expand when both empty and user just created — optional).
  - **Drag**: Keep existing `useSortable` and drag handle. When expanding, ensure the expand toggle does not conflict with drag (e.g. same pattern as [NoteNode.tsx](src/components/create-mode/NoteNode.tsx): ignore expand when interacting with drag handle / checkbox / title input).
  - **Compact prop**: When `compact` is true (e.g. plan/entry views), keep the same structure but tighter padding so the row still meets ~44px where possible.

## Execution mode: TaskItem (expand-in-place)

- **File**: [src/components/execution-mode/TaskItem.tsx](src/components/execution-mode/TaskItem.tsx)
- **Behavior**:
  - Only for tasks (`!isNote && !isTextBlock`). Notes and text-blocks unchanged.
  - **Collapsed**: In the existing card, add a due-date badge next to (or below) the title and a chevron. Optional “has description” indicator.
  - **Tap**: Row or chevron toggles expanded state (no hover-only).
  - **Expanded**: Below the title row, show description (read-only or editable; if editable, same pattern as TaskNode) and due date (display + optional edit with native date input). Use the same date formatting helper.
  - **Layout**: Keep existing container badge and priority; add due date in a way that doesn’t clutter (e.g. same line as container or second line).

## Plan / entry views (TaskNode reused)

- **TaskNode** is already used in [ContainerNode](src/components/create-mode/ContainerNode.tsx), [EntryNode](src/components/plan-mode/EntryNode.tsx), [PlanView](src/components/plan-mode/PlanView.tsx), and [ContainerTree](src/components/create-mode/ContainerTree.tsx). No call-site changes required: once TaskNode supports description/due date and expand-in-place, plan and entry views get it automatically because they render `<TaskNode task={...} compact />`. Ensure `compact` layout still has a usable tap target.

## Mobile and a11y

- **Touch**: Tappable area for expand/collapse at least ~44px tall; chevron included in that area.
- **No hover-only**: All “show details”/expand behavior on click/tap.
- **Labels**: Use `<label>` or `aria-label` for “Description” and “Due date” so screen readers and taps work.
- **Focus**: When expanding, optional: focus description textarea or date input for keyboard users (can be deferred).

## Optional follow-ups (out of scope for this plan)

- Filter/sort by due date in execution mode.
- Overdue styling (e.g. red badge).
- Notifications or reminders (would require separate design).

## File summary


| Area      | File                                                                                     | Change                                                                            |
| --------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Types     | [src/types/index.ts](src/types/index.ts)                                                 | Add `description?: string`, `dueDate?: number` to `Task`                          |
| Storage   | [src/utils/storage.ts](src/utils/storage.ts)                                             | Optional migration for new fields (ensure no breakage)                            |
| Date      | New or [src/utils/taskUtils.ts](src/utils/taskUtils.ts)                                  | Format dueDate for display and for `<input type="date">`                          |
| Create    | [src/components/create-mode/TaskNode.tsx](src/components/create-mode/TaskNode.tsx)       | Expand-in-place UI, due-date badge, description textarea, date input (tasks only) |
| Execution | [src/components/execution-mode/TaskItem.tsx](src/components/execution-mode/TaskItem.tsx) | Due-date badge, expand-in-place for description + due date (tasks only)           |


No changes to TaskContext signatures; no new routes or modals. Firebase continues to persist the full state object, so new fields are stored automatically.