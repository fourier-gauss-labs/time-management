# **Navigation Specification**

The navigation system provides a consistent, predictable structure for moving through the Time Management application. It ensures users can reach primary and secondary destinations with minimal effort while maintaining clarity, accessibility, and responsiveness across devices.

This document defines the navigation hierarchy, interaction model, component usage, responsive behavior, and accessibility standards.

---

## **1. Navigation Philosophy**

Navigation must be:

- **Clear** — Users should always understand where they are and where they can go.
- **Predictable** — Navigation patterns remain stable across the app.
- **Minimal** — No unnecessary nesting or visual clutter.
- **Responsive** — Works elegantly across desktop, tablet, and mobile.
- **Accessible** — Fully operable via keyboard and screen readers.

The system leverages the established **top banner** and **left navigation panel** layout pattern.

---

## **2. Navigation Hierarchy**

The application organizes navigation into two layers:

### **Primary Navigation (Left Panel)**

Represents the main feature areas of the application, such as:

- Dashboard / Today
- Tasks
- Calendar
- Time Blocks
- Insights / Reports
- Settings

This list must remain short, stable, and high-level.

### **Secondary Navigation (In-Page)**

Within a page, secondary navigation may take the form of:

- Tabs
- Subsections
- Filters
- Breadcrumbs (rare; only for hierarchical content)

Secondary navigation must never appear in the left panel unless it represents a top-level concept.

---

## **3. Left Navigation Panel**

### **Structure**

Each navigation item consists of:

- An icon (optional but recommended for scannability)
- A label (required)
- An active-state indicator

Example:

```
[icon] Tasks
[icon] Calendar
[icon] Time Blocks
```

### **States**

Navigation items support:

- **default**
- **hover**
- **active / selected**
- **disabled** (sparingly used)

Active state should be clear but subtle, using tone instead of heavy color.

### **Behavior**

- Clicking an item navigates immediately.
- The panel collapses when toggled by the hamburger icon.
- The panel auto-collapses on narrow screens.
- Collapsed mode may show icons-only or become hidden.
- Expand/collapse state should persist across page loads when reasonable.

### **Interactions**

- Keyboard support:
  - Arrow keys move between items
  - Enter selects
  - Escape closes the drawer in mobile mode

- Screen reader support for landmark roles and labels

### **Component Implementation**

Use Shadcn components such as:

- `NavigationMenu` or custom list built on Radix primitives
- `Sheet` for mobile drawer behavior
- Tailwind classes for spacing, hover, and active states

---

## **4. Top Banner Navigation Elements**

The top banner contains:

- **Branding block**
- **Hamburger button**
- **User avatar + dropdown menu**

### Hamburger Menu Behavior

- Toggles the left navigation panel (desktop)
- Opens the navigation drawer (mobile)
- Should animate smoothly with no disorienting motion
- Should not overlap or obscure the avatar menu

### User Avatar Menu

Provides access to:

- Profile
- Settings
- User-specific actions
- Sign-out

This menu must align visually with the design system and open within safe viewport boundaries.

---

## **5. Routing and Page Structure**

Routing follows a simple, flat hierarchy where possible.

**Example mapping:**

```
/today
/tasks
/tasks/:id
/calendar
/time-blocks
/settings
```

Rules:

- Avoid deep nesting.
- Avoid multiple meanings for the same route.
- Preserve route stability over time to prevent bookmark breakage.
- All pages must include the global layout (header + nav + content).

---

## **6. Responsive Navigation**

Navigation behavior adapts based on viewport width:

### **Desktop (≥ 1025px)**

- Left navigation panel is visible by default.
- Collapsible via hamburger button.
- Content area adjusts width accordingly.

### **Tablet (641–1024px)**

- Panel collapses by default.
- User opens navigation when needed.
- Main content takes priority.

### **Mobile (≤ 640px)**

- Panel becomes a full-height drawer.
- Drawer uses overlay scrim (darkened background).
- Close actions include:
  - Tapping outside
  - Swiping (if enabled)
  - Pressing Escape
  - Tapping hamburger button

### **Motion Requirements**

- Motion must be subtle.
- Drawer transitions use small, consistent easing.

---

## **7. Visual and Interaction Standards**

### **Labels**

- Use clear, action-neutral labels (e.g., “Tasks,” not “My Tasks”).
- Keep labels short to avoid truncation.

### **Icons**

Icons must be:

- Simple
- Consistent in stroke weight
- Semantically meaningful
- Optional but recommended for quick recognition

### **Active State Indicators**

Indicate current location using:

- Subtle background tone
- A left-edge highlight bar (for desktop)
- Bold or high-contrast text

Avoid excessive color in navigation.

---

## **8. Accessibility Requirements**

Navigation must comply with WCAG and Radix defaults:

- Provide ARIA roles:
  - `role="navigation"` for the nav panel
  - `role="menu"` and `role="menuitem"` when appropriate

- Ensure tab order is logical (header → nav → content).
- Focus trap enabled in mobile drawer mode.
- Each item must have an accessible name (icon-only mode still requires text for screen readers).

---

## **9. Consistency and Extension Rules**

Before introducing a new navigation item or pattern:

1. Does it represent a top-level concept?
2. Can it be integrated into existing patterns?
3. Is it discoverable?
4. Does it preserve the simplicity of the left navigation?

New navigation features must not alter the fundamental structure without strong justification.

---

## **10. Examples (Non-Visual)**

### **Desktop (expanded)**

```
┌───────────────────────────────────────────────┐
│ Logo     [Today] [Tasks] [Calendar] [Avatar]  │
├───────────────┬───────────────────────────────┤
│ Nav Panel     │ Main Content                  │
│ - Today       │                                │
│ - Tasks       │                                │
│ - Calendar    │                                │
│ - ...         │                                │
└───────────────┴───────────────────────────────┘
```

### **Mobile**

```
[Top Banner]
[Hamburger] [Branding] [Avatar]

Drawer slides from left:
- Today
- Tasks
- Calendar
- ...
```
