# Design Spec

## Overview

| Field | Value |
|-------|-------|
| Feature / Surface | |
| Problem | |
| Goal / Success metric | |
| Non-goals | |

---

## Users & Scenarios

### Primary User
_Who is this for?_

### Key Scenarios

1. **Scenario**: _User wants to..._
   - Context:
   - Frequency:
   - Success:

2. **Scenario**: _User wants to..._
   - Context:
   - Frequency:
   - Success:

---

## Current Behavior

_If redesigning, describe what exists today:_

---

## Proposed Flow (Happy Path)

```
1. User [action]
   → System [response]
   → User sees [outcome]

2. User [action]
   → System [response]
   → User sees [outcome]

3. User [action]
   → System [response]
   → User sees [success state]
```

---

## Edge Cases & Failure Modes

### Validation Errors
- **Trigger**:
- **User sees**:
- **Recovery path**:

### Network Timeout
- **Trigger**:
- **User sees**:
- **Recovery path**:

### Permission Denied (401/403)
- **Trigger**:
- **User sees**:
- **Recovery path**:

### Empty State
- **Trigger**:
- **User sees**:
- **Next action offered**:

### Partial Success
- **Trigger**:
- **User sees**:
- **Recovery path**:

---

## Interaction Rules

### Primary Actions
| Action | Trigger | Result |
|--------|---------|--------|
| | Click / Enter | |
| | Click / Enter | |

### Secondary Actions
| Action | Trigger | Result |
|--------|---------|--------|
| | | |

### Keyboard Behavior
- **Tab order**:
- **Enter**:
- **Escape**:
- **Shortcuts** (if any):

### Focus Management
- **On open**: Focus moves to...
- **On close**: Focus returns to...
- **On error**: Focus moves to...

---

## States

### Loading
- **Visual**:
- **Duration before showing**:
- **Cancellable**: Yes / No

### Success
- **Visual**:
- **Duration**:
- **Next action**:

### Error
- **Visual**:
- **Message pattern**:
- **Actions available**:

### Empty
- **Visual**:
- **Message**:
- **Call to action**:

### Disabled
- **When**:
- **Visual**:
- **Tooltip/explanation**:

---

## Content & Microcopy

### Labels
| Element | Text |
|---------|------|
| Page title | |
| Primary button | |
| Secondary button | |

### Helper Text
| Field/Element | Helper text |
|---------------|-------------|
| | |

### Error Messages
| Condition | Message |
|-----------|---------|
| Required field empty | |
| Invalid format | |
| Server error | |
| Permission denied | |

### Success Messages
| Action | Message |
|--------|---------|
| | |

---

## Components & Design System

### Reuse Existing
| Component | Usage |
|-----------|-------|
| | |

### New Components (if unavoidable)
| Component | Justification |
|-----------|---------------|
| | |

### Layout Notes
_Information hierarchy, grouping, spacing intent:_

---

## Analytics & Instrumentation

### Events
| Event Name | Trigger | Properties |
|------------|---------|------------|
| | | |
| | | |

### Funnel Steps
1.
2.
3.

### Success Metrics
- Primary:
- Secondary:

---

## Acceptance Criteria

### AC1: [Core functionality]
```gherkin
Given [context]
When [action]
Then [outcome]
```

### AC2: [Error handling]
```gherkin
Given [context]
When [action]
Then [outcome]
```

### AC3: [Accessibility]
```gherkin
Given [context]
When [action]
Then [outcome]
```

### AC4: [Edge case]
```gherkin
Given [context]
When [action]
Then [outcome]
```

---

## QA Checklist

- [ ] Cross-browser: Chrome, Safari, Firefox, Edge
- [ ] Responsive: Mobile, tablet, desktop
- [ ] Accessibility: Keyboard nav, screen reader, focus visible
- [ ] Regression: [List areas that might be affected]

---

## Open Questions

1.
2.
3.
