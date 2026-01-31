# UX Checklists for Web Apps

## Navigation & Information Architecture

### Structure
- [ ] Can a new user predict where to find common tasks?
- [ ] Is the current location obvious (active nav state, breadcrumbs)?
- [ ] Are labels based on user language, not internal jargon?
- [ ] Is there a "home" / reset path for complex filtering/search?
- [ ] Does the URL reflect the current state (for sharing/bookmarking)?

### Wayfinding
- [ ] Is there a clear primary navigation?
- [ ] Are related items grouped logically?
- [ ] Is search available for large content sets?
- [ ] Do users know how to get back to where they started?

---

## Forms (High ROI)

### Labels & Structure
- [ ] Clear field labels (not placeholder-only)
- [ ] Group related fields with visual hierarchy
- [ ] Required vs optional is explicit (prefer "optional" labels)
- [ ] Form length is minimized; only ask what's needed

### Input Assistance
- [ ] Use appropriate input types (`email`, `tel`, `number`, `date`)
- [ ] Use `autocomplete` attributes for common fields
- [ ] Provide sensible defaults where possible
- [ ] Show examples or format hints for ambiguous fields

### Validation & Errors
- [ ] Inline validation when helpful (on blur, not on every keystroke)
- [ ] Preserve entered data on validation errors
- [ ] Write errors that explain: what happened, why, and how to fix
- [ ] Autofocus first invalid field on submit error

### Submission
- [ ] Submit button clearly labeled with action ("Sign up", not "Submit")
- [ ] Disable submit only with clear explanation (or allow submit + highlight errors)
- [ ] Show loading state during submission
- [ ] Confirm success clearly; show what changed and next step

### Destructive Actions
- [ ] Confirm destructive actions with clear consequences
- [ ] Allow undo where possible
- [ ] Don't rely only on color to indicate danger

---

## Feedback & States

### Loading States
- [ ] Show progress or skeleton for operations > 400ms
- [ ] Avoid layout shift when content loads
- [ ] Indicate if operation can be cancelled
- [ ] Consider optimistic UI for low-risk actions

### Empty States
- [ ] Explain why empty + offer next action
- [ ] Provide helpful getting-started guidance
- [ ] Don't show empty tables/lists with no context

### Error States
- [ ] Human-readable message (no error codes)
- [ ] Include retry action where appropriate
- [ ] Provide alternative paths ("Contact support" / "Go back")
- [ ] Log correlation ID for debugging (hidden but accessible)

### Success States
- [ ] Confirm success explicitly
- [ ] Show what changed
- [ ] Offer clear next step

---

## Accessibility (WCAG 2.2 AA Baseline)

### Keyboard
- [ ] All interactive elements reachable via Tab
- [ ] Tab order follows visual/logical order
- [ ] No keyboard traps (can Tab away from any element)
- [ ] Skip link to main content for screen readers
- [ ] Escape closes modals/dropdowns

### Focus
- [ ] Visible focus indicator on all interactive elements
- [ ] Focus not hidden by sticky headers/overlays
- [ ] Focus managed appropriately after dynamic changes
- [ ] Focus returns to trigger after modal closes

### Screen Readers
- [ ] All images have meaningful alt text (or alt="" for decorative)
- [ ] Form inputs have associated labels
- [ ] Icons/buttons have accessible names (aria-label if needed)
- [ ] Dynamic content changes announced (aria-live regions)
- [ ] Headings create logical document outline

### Visual
- [ ] Color contrast meets 4.5:1 for text, 3:1 for UI components
- [ ] Information not conveyed by color alone
- [ ] Text resizable to 200% without horizontal scroll
- [ ] Touch targets minimum 44x44px (WCAG 2.2)

### Motion & Time
- [ ] Animations can be disabled (prefers-reduced-motion)
- [ ] No essential meaning conveyed only via animation
- [ ] Session timeouts warn user and allow extension
- [ ] Auto-updating content can be paused

---

## Responsive & Mobile

### Layout
- [ ] Works at narrow widths without horizontal scroll
- [ ] Content reflows logically at breakpoints
- [ ] Primary actions remain accessible at all sizes
- [ ] Text readable without zooming on mobile

### Touch
- [ ] Tap targets at least 44x44px with adequate spacing
- [ ] No hover-dependent interactions without touch alternative
- [ ] Swipe gestures have button alternatives
- [ ] Forms don't cause unexpected keyboard issues

### Tables & Complex Content
- [ ] Tables have responsive strategy (stacking, horizontal scroll with affordance, or summary view)
- [ ] Long content truncated with "show more" option
- [ ] Images scale appropriately

---

## Trust & Clarity

### Transparency
- [ ] Destructive actions clearly labeled and explained
- [ ] Permissions and access errors explained plainly
- [ ] Pricing/costs shown before commitment
- [ ] Data usage explained where relevant

### Data Protection
- [ ] Warn on navigation away from dirty forms
- [ ] Autosave for long forms where possible
- [ ] Confirm before bulk/irreversible operations
- [ ] Clear indication of saved vs unsaved state

### Error Recovery
- [ ] Don't lose user data on errors
- [ ] Provide clear path to retry or get help
- [ ] Don't blame the user in error messages

---

## Performance UX

### Perceived Performance
- [ ] Interactive within 3 seconds on average connection
- [ ] Visual feedback within 100ms of user action
- [ ] Skeleton screens for content-heavy pages
- [ ] Optimistic updates where appropriate

### Real Performance
- [ ] Lazy load below-fold content
- [ ] Prefetch likely next pages/actions
- [ ] Avoid blocking the main thread
- [ ] Images optimized and responsive
