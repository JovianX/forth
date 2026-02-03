# Task Ordering Logic Analysis & Improvement Recommendations

## Current Implementation Analysis

### Issues Found

#### 1. **addTask** (lines 174-204)
**Current behavior:**
- Uses `maxPriority + 1` (no rounding, no minimum)
- First task in empty container gets priority `-1 + 1 = 0` ❌
- No enforcement of minimum priority 50
- No rounding to nearest 10
- Priorities can be any integer (0, 1, 2, 3...)

**Expected behavior (per docs):**
- Empty container → priority 50
- New tasks → `maxPriority + 10` (rounded up to nearest 10)
- Minimum priority 50

**Edge cases NOT handled:**
- Empty container → gets 0 instead of 50
- Priority 0 provided → stays 0 instead of converting to 50
- Second task → gets 1 instead of 60 (if first is 50)

---

#### 2. **reorderTaskPriority** (lines 229-250)
**Current behavior:**
- Adjusts priorities by +1/-1 when moving
- No rounding to nearest 10
- No minimum enforcement
- Can create priorities < 50

**Expected behavior:**
- Round to nearest 10
- Ensure minimum 50
- Conflict detection

---

#### 3. **moveTaskPriority** (lines 252-277)
**Current behavior:**
- Formula: `sortedTasks.length - 1 - newIndex`
- For 3 tasks: priorities become 2, 1, 0 ❌
- Starts at 0, not 50

**Expected behavior:**
- Formula: `50 + (N - 1 - newIndex) * 10`
- For 3 tasks: priorities become 70, 60, 50 ✅

---

#### 4. **reorderTasks** (lines 279-304)
**Current behavior:**
- Formula: `sortedTasks.length - 1 - newIndex`
- Same issue as `moveTaskPriority` - starts at 0

**Expected behavior:**
- Formula: `50 + (N - 1 - newIndex) * 10`
- Normalizes all tasks starting from 50

---

#### 5. **reorderTasksInContainer** (lines 306-346)
**Current behavior:**
- Complex range-based logic trying to maintain container's position
- Uses `priorityRange / (containerTasks.length - 1)` formula
- Doesn't normalize starting from 50
- Can create fractional priorities

**Expected behavior:**
- Simple normalization: `50 + (N - 1 - newIndex) * 10`
- Only affects tasks in the container
- All tasks get priorities ≥ 50

**Issues:**
- Edge case: single task → uses `maxPriority` (could be < 50)
- Division by zero risk when `containerTasks.length === 1`

---

#### 6. **moveTaskToContainer** (lines 409-430)
**Current behavior:**
- Uses `maxPriority + 1`
- Empty container → gets `-1 + 1 = 0` ❌
- No minimum enforcement

**Expected behavior:**
- Empty container → priority 50
- Has tasks → `maxPriority + 10` (rounded up, min 50)

---

#### 7. **TaskDivider.getPriority()** (lines 36-49)
**Current behavior:**
- Returns average or ±0.5
- No rounding to nearest 10
- No conflict detection
- Can return fractional values

**Expected behavior:**
- Round to nearest 10
- Conflict detection
- Empty container → `undefined` (let addTask handle it)

---

## Edge Cases Analysis

### ❌ Edge Case 1: Empty Container
**Current:** First task gets priority 0  
**Expected:** First task gets priority 50

### ❌ Edge Case 2: Second Task
**Current:** Gets priority 1 (if first is 0)  
**Expected:** Gets priority 60 (if first is 50)

### ❌ Edge Case 3: Priority Normalization
**Current:** Normalizes to 0, 1, 2, 3...  
**Expected:** Normalizes to 50, 60, 70, 80...

### ❌ Edge Case 4: Single Task in Container
**Current:** `reorderTasksInContainer` uses `maxPriority` (could be < 50)  
**Expected:** Should get priority 50

### ❌ Edge Case 5: Priority Conflicts
**Current:** No conflict detection  
**Expected:** Detect conflicts and adjust

### ❌ Edge Case 6: Fractional Priorities
**Current:** Can create fractional priorities (0.5, 1.5, etc.)  
**Expected:** All priorities should be multiples of 10

---

## Proposed Improvements

### 1. Unified Priority Utility Functions

Create helper functions to ensure consistency:

```typescript
// Round to nearest 10, ensure minimum 50
const normalizePriority = (priority: number): number => {
  const rounded = Math.round(priority / 10) * 10;
  return Math.max(50, rounded);
};

// Get next priority for new task
const getNextPriority = (existingPriorities: number[]): number => {
  if (existingPriorities.length === 0) return 50;
  const maxPriority = Math.max(...existingPriorities);
  const normalizedMax = normalizePriority(maxPriority);
  return normalizedMax === maxPriority ? normalizedMax + 10 : normalizedMax;
};

// Normalize priorities for N tasks starting from 50
const normalizePriorities = (count: number, indices: number[]): Map<number, number> => {
  const priorityMap = new Map<number, number>();
  indices.forEach((newIndex) => {
    priorityMap.set(newIndex, 50 + (count - 1 - newIndex) * 10);
  });
  return priorityMap;
};

// Check for priority conflicts
const hasPriorityConflict = (priority: number, existingPriorities: number[], excludeId?: string): boolean => {
  const normalized = normalizePriority(priority);
  return existingPriorities.some((p, idx) => 
    normalizePriority(p) === normalized && idx !== excludeId
  );
};
```

### 2. Simplified addTask

```typescript
const addTask = useCallback((title: string, containerId: string, priority?: number, type: 'task' | 'note' | 'text-block' = 'task', content?: string) => {
  setState((prev) => {
    const existingTasks = prev.tasks.filter((t) => t.containerId === containerId);
    const existingPriorities = existingTasks.map((t) => t.priority);
    
    let taskPriority: number;
    if (priority !== undefined) {
      taskPriority = normalizePriority(priority);
      // Check for conflicts
      if (hasPriorityConflict(taskPriority, existingPriorities)) {
        taskPriority = getNextPriority(existingPriorities);
      }
    } else {
      taskPriority = getNextPriority(existingPriorities);
    }

    const newTask: Task = {
      id: generateId(),
      title,
      completed: false,
      priority: taskPriority,
      containerId,
      createdAt: getTimestamp(),
      type: type || 'task',
      content: (type === 'note' || type === 'text-block') ? (content || '') : undefined,
      blocks: type === 'note' ? [] : undefined,
      isQuickTask: false,
    };

    return {
      ...prev,
      tasks: [...prev.tasks, newTask],
    };
  });
}, [setState]);
```

### 3. Simplified reorderTasks

```typescript
const reorderTasks = useCallback((activeId: string, overId: string | null) => {
  if (!overId || activeId === overId) return;

  setState((prev) => {
    const sortedTasks = [...prev.tasks].sort((a, b) => b.priority - a.priority);
    
    const activeIndex = sortedTasks.findIndex((t) => t.id === activeId);
    const overIndex = sortedTasks.findIndex((t) => t.id === overId);
    
    if (activeIndex === -1 || overIndex === -1) return prev;

    // Remove active task and reinsert
    const [removed] = sortedTasks.splice(activeIndex, 1);
    sortedTasks.splice(overIndex, 0, removed);

    // Normalize all priorities starting from 50
    const updatedTasks = prev.tasks.map((t) => {
      const newIndex = sortedTasks.findIndex((st) => st.id === t.id);
      return { 
        ...t, 
        priority: 50 + (sortedTasks.length - 1 - newIndex) * 10 
      };
    });

    return { ...prev, tasks: updatedTasks };
  });
}, [setState]);
```

### 4. Simplified reorderTasksInContainer

```typescript
const reorderTasksInContainer = useCallback((containerId: string, activeId: string, overId: string | null) => {
  if (!overId || activeId === overId) return;

  setState((prev) => {
    const containerTasks = prev.tasks
      .filter((t) => t.containerId === containerId)
      .sort((a, b) => b.priority - a.priority);
    
    const activeIndex = containerTasks.findIndex((t) => t.id === activeId);
    const overIndex = containerTasks.findIndex((t) => t.id === overId);
    
    if (activeIndex === -1 || overIndex === -1) return prev;

    // Remove active task and reinsert
    const [removed] = containerTasks.splice(activeIndex, 1);
    containerTasks.splice(overIndex, 0, removed);

    // Normalize priorities within container starting from 50
    const updatedTasks = prev.tasks.map((t) => {
      if (t.containerId !== containerId) {
        return t; // Don't change tasks in other containers
      }
      const newIndex = containerTasks.findIndex((st) => st.id === t.id);
      return { 
        ...t, 
        priority: 50 + (containerTasks.length - 1 - newIndex) * 10 
      };
    });

    return { ...prev, tasks: updatedTasks };
  });
}, [setState]);
```

### 5. Improved TaskDivider.getPriority()

```typescript
const getPriority = (containerTasks: Task[]): number | undefined => {
  if (containerTasks.length === 0) {
    return undefined; // Let addTask use default 50
  }

  if (afterPriority !== undefined && beforePriority !== undefined) {
    // Between two tasks - use average rounded to nearest 10
    const avg = (afterPriority + beforePriority) / 2;
    const rounded = normalizePriority(avg);
    
    // Check for conflicts
    const existingPriorities = containerTasks.map((t) => t.priority);
    if (hasPriorityConflict(rounded, existingPriorities)) {
      // Use maxPriority + 10 instead
      const maxPriority = Math.max(...existingPriorities);
      return normalizePriority(maxPriority) + 10;
    }
    return rounded;
  } else if (afterPriority !== undefined) {
    // After a task - use priority + 10
    return normalizePriority(afterPriority) + 10;
  } else if (beforePriority !== undefined) {
    // Before a task - use priority - 10 (but min 50)
    return Math.max(50, normalizePriority(beforePriority) - 10);
  }
  
  return undefined;
};
```

---

## Benefits of Proposed Changes

1. **Consistency**: All functions use the same normalization logic
2. **Simplicity**: Removes complex range-based calculations
3. **Edge case handling**: Properly handles empty containers, single tasks, etc.
4. **Maintainability**: Centralized utility functions make changes easier
5. **Correctness**: Matches documented behavior
6. **Predictability**: Always uses multiples of 10, starting from 50

---

## Migration Considerations

1. **Existing data**: May need migration script to normalize existing priorities
2. **Testing**: Need to test all edge cases:
   - Empty container
   - Single task
   - Two tasks
   - Moving between containers
   - Drag & drop reordering
   - Priority conflicts

---

## Summary

The current implementation has significant discrepancies from the documented behavior:
- ❌ Priorities start at 0 instead of 50
- ❌ No rounding to nearest 10
- ❌ No minimum enforcement
- ❌ Complex, inconsistent logic
- ❌ Edge cases not handled

The proposed improvements:
- ✅ Unified, simple normalization logic
- ✅ Consistent behavior across all functions
- ✅ Proper edge case handling
- ✅ Matches documented behavior
- ✅ Easier to maintain and test
