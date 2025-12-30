# **Component Guidelines**

This document defines how components are selected, composed, implemented, and extended within the Time Management application. It ensures the UI remains consistent, accessible, and maintainable as the application grows. All components—atomic or composite—must adhere to these guidelines.

---

## **1. Component Philosophy**

The application follows a _component-first_ design strategy using **Shadcn/UI** as the foundation. Components must be:

- **Consistent** in structure, behavior, and visual tone
- **Composable**, supporting a modular UI architecture
- **Accessible**, preserving Radix behaviors and ARIA standards
- **Reusable**, avoiding duplication of patterns
- **Minimal**, avoiding unnecessary props, complexity, or visual ornamentation

A component is introduced only when it delivers clear functional value.

---

## **2. Atomic Components**

Atomic components are the smallest building blocks of the UI. They include:

- Buttons
- Inputs and Textareas
- Cards
- Dropdowns and Popovers
- Dialogs / Sheets
- Tabs
- Navigation elements
- Avatars
- Icons

### **Rules for Atomic Components**

1. **Use Shadcn/UI versions whenever available.**
   Atomic components must be imported using the Shadcn CLI (`npx shadcn-ui add <component>`).

2. **Do not create custom atomic components unless unavoidable.**
   Custom components should be built only when:
   - A needed atomic element does not exist in Shadcn.
   - A functional requirement cannot be met by composition.

3. **No inline styling except for layout scaffolding.**
   Use Tailwind utility classes following Shadcn conventions.

4. **Preserve accessibility.**
   All focus states, keyboard navigation, and ARIA properties must remain intact.

---

## **3. Composite Components**

Composite components are built from atomic components. Examples include:

- Task list rows
- Task creation controls
- Time-block cards
- Navigation sidebar
- User menu inside the avatar popover

### **Rules for Composite Components**

1. **Compose, don’t reinvent.**
   Composite components must be built from existing Shadcn primitives.

2. **Keep props minimal and explicit.**
   For example, prefer:

   ```tsx
   <TaskRow title="Buy groceries" dueDate={...} isCompleted={false} />
   ```

   rather than passing opaque objects or overloaded prop sets.

3. **Avoid deep nesting.**
   If a component has multiple layers of conditional rendering, consider splitting it.

4. **Encapsulate behavior.**
   Interactions such as “mark as done,” “expand details,” or “open menu” should be self-contained unless a higher-level controller manages state.

---

## **4. Layout Components**

Layout components structure content but do not encode business meaning. Examples:

- Page container
- Section wrapper
- Two-column layout
- Header bar
- Left navigation drawer

### **Rules for Layout Components**

1. **They control structure, not content.**
   A layout component never decides what data to show—only how it is arranged.

2. **Use consistent spacing and alignment.**
   Follow the spacing rhythm defined in the design principles.

3. **Layouts must be responsive by default.**
   They must degrade gracefully to narrow screens without requiring special variants.

4. **The left navigation panel must collapse predictably.**
   When screen width is constrained, it must auto-collapse or convert into a drawer.

---

## **5. State Management Inside Components**

To keep components predictable and maintainable, adhere to the following:

1. **Keep component state shallow.**
   A component should own only the state necessary for its functionality.

2. **Derived state should be computed, not stored.**

3. **Avoid prop drilling.**
   Prefer context providers or state libraries only when absolutely needed.

4. **Do not mix UI state and domain logic.**
   Domain logic should be handled in dedicated hooks or services.

---

## **6. Interaction Rules**

All interactive components must:

- Provide clear hover, active, and focus states
- Respond immediately to user input
- Avoid relying solely on color to indicate meaning
- Use animations sparingly and purposefully

**Confirmation patterns:**

- Prefer _undo_ over confirmation dialogs.
- If a destructive action requires confirmation, use a modal or alert dialog based on Shadcn.

---

## **7. Naming Conventions**

Component files follow:

```
ComponentName.tsx
ComponentName.test.tsx (optional)
ComponentName.stories.tsx (optional)
```

Directory structure:

```
components/
  ui/               # Shadcn-generated and atomic components
  layout/           # Layout scaffolding
  domain/           # App-specific composite components
```

Do not mix unrelated components in the same directory.

---

## **8. Theming and Visual Consistency**

These guidelines work in conjunction with the application’s separate color palette and style guide. Components must:

- Respect light/dark theme variables
- Never hardcode colors
- Use consistent padding, margin, and radius
- Avoid shadows unless used for elevation

---

## **9. Documentation and Component Evolution**

Every new component must answer:

1. What purpose does it serve?
2. Can it be built using existing Shadcn components?
3. Is it consistent with spacing, typography, and themes?
4. Does it follow the design principles?

Components should evolve as the system grows, but changes must remain backward-compatible unless a breaking change is explicitly documented.
