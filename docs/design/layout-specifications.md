# **Layout Specifications**

The Time Management application follows a consistent structural layout across all screens to promote clarity, predictability, and ease of use. This document defines the global layout regions, responsive behavior, and structural rules that all screens must follow.

---

## **1. Global Layout Regions**

Every authenticated screen is composed of three primary layout regions:

1. **Top Banner (Global Header)**
2. **Left Navigation Panel (Primary Navigation)**
3. **Main Content Area (Page Content)**

These regions define the spatial and functional foundation of the UI.

---

## **2. Top Banner (Global Header)**

The top banner appears on every screen and serves as a persistent anchor for identity, navigation control, and user actions.

### **Contents**

- **Branding block** (temporary text or future logo)
- **Hamburger menu button** (toggles the left navigation panel)
- **User avatar** (initial fallback; user-uploaded image when available)
  - Opens a menu containing:
    - Profile settings
    - User-specific tools or shortcuts
    - Application preferences
    - Sign-out action

### **Behavior**

- Height is fixed across screens to maintain rhythm.
- Must remain visible as the user scrolls (sticky positioning).
- On narrow screens, the hamburger icon is the primary control for navigation access.
- Avatar menu must open in a direction that avoids clipping and respects viewport boundaries.

### **Implementation Guidance**

Use a Shadcn-based layout wrapper (`<header>`) composed with:

- `flex`
- `items-center`
- `justify-between`
- Theme-sensitive backgrounds and borders (from CSS variables)

---

## **3. Left Navigation Panel**

The left navigation panel provides access to the primary sections of the application (Tasks, Calendar, Time Blocks, Settings, etc.).

### **Structure**

- Vertical list of navigation items
- Optional section labels for grouping
- Minimal iconography paired with concise text labels

### **Behavior**

- **Desktop:**
  The panel is visible by default and collapsible via the hamburger button.

- **Tablet / Narrow Desktop:**
  The panel collapses automatically to preserve main content space.

- **Mobile:**
  The panel becomes an overlay drawer that slides in from the left when opened.

- **Keyboard navigation:**
  - Arrow key support for list items
  - `Tab` cycles through header → navigation → content

### **Implementation Guidance**

Construct using Shadcn components such as:

- Navigation Menu
- Sheet / Drawer (mobile mode)
- Scrollable container when necessary

Width guidelines:

- Expanded: approximately 240–280px
- Collapsed: icon-only or hidden

---

## **4. Main Content Area**

The primary region for all screen-specific content.

### **Structure**

- Flexible layout that adapts to both short and long content
- Centered content for desktop when appropriate
- Responsive padding that scales with viewport size

### **Behavior**

- Scrolls independently of the top banner
- Must not allow horizontal scrolling except for intentional overflow (e.g., tables or timelines)
- Should maintain generous whitespace to support readability and focus

### **Implementation Guidance**

Use a responsive container pattern:

```tsx
<main className="flex-1 px-4 py-6 md:px-8 lg:px-12">{children}</main>
```

Ensure that:

- Typography scales appropriately
- Components follow consistent spacing
- Color tokens come from the theme’s CSS variables

---

## **5. Responsive Behavior**

The layout must adapt seamlessly to different screen sizes using the following breakpoints (guideline values):

- **Mobile:** 0–640px
- **Tablet:** 641–1024px
- **Desktop:** 1025–1440px
- **Wide Desktop:** 1441px+

### **Responsive Rules**

- The left navigation panel becomes a drawer below 1024px.
- Content padding increases on larger screens.
- The top banner remains constant across breakpoints.
- Avoid multi-column layouts on small screens.

---

## **6. Elevation and Surfaces**

To preserve simplicity:

- Use minimal elevation; avoid multi-layer shadows.
- Distinguish surfaces using subtle tonal changes rather than borders.
- Overlays (navigation, modals, sheets) use the theme’s overlay color token.

The style guide defines the exact grayscale surfaces used across themes.

---

## **7. Accessibility Requirements**

All layout regions must support:

- Full keyboard navigation
- Logical tab order (header → navigation → content)
- ARIA labeling for navigation landmarks
- WCAG-compliant contrast ratios for text and interactive elements

---

## **8. Layout Composition Rules**

When building screens:

- Do not modify the top banner or left navigation structure except through configuration.
- Do not introduce additional global regions without justification.
- Screen-specific layouts must be composed _within_ the main content area.
- Navigation must remain consistent across all authenticated screens.
- Maintain stable visual anchors to avoid disorientation during navigation.
