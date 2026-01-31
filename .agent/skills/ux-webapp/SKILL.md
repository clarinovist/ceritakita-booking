---
name: ux-webapp
description: UX audit + design spec for web apps. Use for usability reviews, accessibility checks, user flows, microcopy, wireframes, and implementation-ready acceptance criteria.
---

# UX for Web Apps

This skill helps you do high-quality UX work on web applications:

- **Evaluate** existing UX (heuristics + accessibility + flows)
- **Propose** concrete improvements (interaction + IA + content)
- **Produce** implementation-ready specs (states, rules, acceptance criteria, analytics)
- **Validate** with lightweight testing plans

## When to Use This Skill

Use this skill when the user asks for:

- UX review / audit / heuristic evaluation / usability critique
- Improve onboarding, forms, settings, dashboards, funnels
- Redesign a flow (signup, checkout, search, CRUD, etc.)
- Accessibility review (keyboard nav, focus, screen reader basics)
- Wireframes (textual), user flows, information architecture, microcopy
- "Write the spec" / "Define acceptance criteria" for UX changes

## Default Operating Mode

- Do **not** block on missing context. Make minimal assumptions, label them, and proceed.
- Ask at most **5** clarifying questions only if the answers would change recommendations materially.
- **Default to Quick UX Pass** (lightweight feedback). Only escalate to full audits/specs when explicitly requested or clearly warranted.
- Avoid "pixel" design. Provide **interaction rules + layout intent** and **component guidance**.
- **Capture your own screenshots** when browser tools are available (see Visual Inspection below). If visuals aren't available after requesting, proceed with a code-only review and label it clearly.

## Visual Inspection

**Always attempt to see the actual UI before giving advice.** Code alone is insufficient for UX evaluation.

### When Browser Tools Are Available

If you have access to browser/chrome-tester MCP tools:

1. **Launch the app** in the browser tool
2. **Capture screenshots** of the relevant flows/pages
3. **Interact with the UI** to understand real behavior
4. **Test keyboard navigation** and tab order
5. **Check responsive behavior** at different viewport sizes

### When No Browser Tools Available

If you cannot capture screenshots yourself:

1. **Ask the user for screenshots** of the relevant screens/flows
2. If screenshots aren't provided in the same turn, **proceed with a code-only review** and mark it as lower confidence
3. **Clearly label** any advice as "based on code review only" with lower confidence
4. **Focus on structural issues** (missing states, error handling, accessibility attributes)

**Do not hallucinate visual details.** If you haven't seen it, say so.

## Design Context

Adapt recommendations to the type of product:

| Context | Pattern Preference | Delight Level | Examples |
|---------|-------------------|---------------|----------|
| **B2B / SaaS / Internal Tools** | Conservative, conventional | Low | Admin dashboards, CRMs, dev tools |
| **Consumer Apps** | Balanced | Medium | Social apps, productivity, e-commerce |
| **Marketing / Landing Pages** | Creative, distinctive | High | Product launches, campaigns, portfolios |

Ask about context if unclear.

## Decision Tree

| Input | Action |
|-------|--------|
| Screenshots / URL / flow description | **Quick UX Pass** (default) or full audit if requested |
| Feature idea / problem statement only | Propose the flow + lightweight spec |
| Access to codebase | Capture screenshots first (if browser tools available), then Quick UX Pass |
| Browser tools available | **Use them.** Launch app, capture screenshots, then evaluate |

## Output Formats

**Default: Quick UX Pass.** Only escalate when explicitly requested or clearly warranted.

| Format | When to Use | Output |
|--------|-------------|--------|
| **Quick UX Pass** (default) | "Review this", "Is this good?", "Quick feedback" | Top 5-10 issues with severity, rationale, and fixes |
| **UX Audit** | "Full audit", "Comprehensive review", complex multi-screen flows | Flow map + issue backlog + prioritized roadmap |
| **Design Spec** | "Write the spec", "Acceptance criteria", new feature design | Interaction rules, states, copy, criteria, analytics |
| **Validation Plan** | "Test plan", "How do we validate this?" | Usability test script + tasks + success criteria |

**Escalation signals**: User says "thorough", "comprehensive", "full", "deep dive", or task involves 5+ screens/states.

## Issue Reporting Format

| ID | Location | Problem | Evidence | Principle | Sev | Impact | Confidence | Effort | Priority | Recommendation | Acceptance Criteria |
|----|----------|---------|----------|-----------|-----|--------|------------|--------|----------|----------------|---------------------|
| 1  | Login    | Submit button disabled with no explanation | Users click repeatedly | H5 / L4 | 3 | 3 | 4 | 2 | 6.0 | Show helper text | Given incomplete form, When user views submit, Then helper shows required fields |

**Severity Scale (0-4):**
- 0: Not a problem / nit
- 1: Cosmetic; doesn't impede task completion
- 2: Minor; causes friction or mild error risk
- 3: Major; frequently blocks tasks or causes serious mistakes
- 4: Critical; prevents task completion, causes data loss, or creates severe trust/safety issues

---

## Reference Materials

| File | Contents |
|------|----------|
| `reference/HEURISTICS.md` | Nielsen's 10 heuristics + cognitive laws + severity scale |
| `reference/CHECKLISTS.md` | Forms, navigation, a11y, responsive checklists |
| `templates/UX_AUDIT.md` | Audit output template |
| `templates/DESIGN_SPEC.md` | Implementation spec template |
| `templates/USABILITY_TEST.md` | User testing plan template |

---

## Deliverable Checklist

When responding, always deliver:

1. A prioritized list of issues/fixes OR a proposed flow/spec
2. Concrete acceptance criteria (Given/When/Then)
3. Any assumptions you made (labeled clearly)
4. Cite heuristics or cognitive laws for every recommendation (no "vibes")
