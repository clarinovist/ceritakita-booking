---
name: planning-implementation
description: Generates detailed implementation plans for complex coding tasks. Use when the user has requirements but needs a structured plan before coding.
---

# Planning Implementation

## When to use this skill
- When the user has a spec or requirements for a multi-step task.
- Before writing any code for a complex feature.
- When you need to break down a large task into bite-sized steps.

## Workflow
- [ ] Understand the goal and architecture.
- [ ] Create a dedicated plan file in `docs/plans/`.
- [ ] Define the plan header with Goal, Architecture, and Tech Stack.
- [ ] Break down work into bite-sized tasks (2-5 mins each).
- [ ] Review the plan with the user.

## Instructions
**Assumptions**: Write plans implementation assuming the engineer has zero context. Document everything: files to touch, code to write, tests to run.

**Bite-Sized Task Granularity**:
Each step is one atomic action:
1. "Write the failing test"
2. "Run it to make sure it fails"
3. "Implement the minimal code"
4. "Run the tests and make sure they pass"
5. "Commit"

**Plan File Location**: `docs/plans/YYYY-MM-DD-<feature-name>.md`

**Plan Header Template**:
```markdown
# [Feature Name] Implementation Plan
**Goal:** [One sentence describing what this builds]
**Architecture:** [2-3 sentences about approach]
**Tech Stack:** [Key technologies/libraries]
```

**Task Structure Template**:
```markdown
### Task N: [Component Name]
**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`

**Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
```

**Principals**:
- Exact file paths always.
- Complete code in plan (not "add validation").
- Exact commands with expected output.
- DRY, YAGNI, TDD.
