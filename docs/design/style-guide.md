# Style Guide

## Overview

* Primary UX is **grayscale**
* Backgrounds are clean and neutral
* Foreground colors focus on contrast and readability
* Only accents use color (blue/green/orange/red if needed)
* Matches ChatGPT’s vibe: modern, calm, minimal

---

# 🌞 **Light Mode Palette**

| Token                 | Purpose                | Hex                   |
| --------------------- | ---------------------- | --------------------- |
| **Background**        | Main Surface           | `#F9FAFB`             |
| **Background Subtle** | Cards / Inset areas    | `#F3F4F6`             |
| **Foreground**        | Main text              | `#111827`             |
| **Foreground Muted**  | Secondary text         | `#4B5563`             |
| **Border**            | Dividers, card borders | `#E5E7EB`             |
| **Overlay**           | Modals / sheets        | `rgba(0, 0, 0, 0.45)` |

### ❇ Accent Colors (light mode)

Use accents sparingly:

| Accent                     | Use Case            | Hex       |
| -------------------------- | ------------------- | --------- |
| **Accent Primary (Blue)**  | Links, actions      | `#2563EB` |
| **Accent Success (Green)** | Completed tasks     | `#059669` |
| **Accent Warning (Amber)** | Deadlines nearing   | `#F59E0B` |
| **Accent Danger (Red)**    | Destructive actions | `#DC2626` |

These accents match modern UI conventions and Tailwind defaults.

---

# 🌙 **Dark Mode Palette**

Designed to match the clean, polished feel of ChatGPT’s dark theme.

| Token                 | Purpose            | Hex                   |
| --------------------- | ------------------ | --------------------- |
| **Background**        | Main Surface       | `#0D0D0D`             |
| **Background Subtle** | Card surfaces      | `#1A1A1A`             |
| **Foreground**        | Main text          | `#E5E7EB`             |
| **Foreground Muted**  | Secondary text     | `#9CA3AF`             |
| **Border**            | Dividers, outlines | `#2D2D2D`             |
| **Overlay**           | Modals / sheets    | `rgba(0, 0, 0, 0.65)` |

### ❇ Accent Colors (dark mode)

| Accent                     | Use Case            | Hex       |
| -------------------------- | ------------------- | --------- |
| **Accent Primary (Blue)**  | Links, actions      | `#3B82F6` |
| **Accent Success (Green)** | Completed tasks     | `#34D399` |
| **Accent Warning (Amber)** | Deadlines nearing   | `#FBBF24` |
| **Accent Danger (Red)**    | Destructive actions | `#F87171` |

These are the dark-mode equivalents of the light-mode accents with better luminance values.

---

# 🧱 **Tailwind-Ready Color Tokens**

If using Tailwind, you can map them like:

```ts
export const colors = {
  light: {
    background: "#F9FAFB",
    backgroundSubtle: "#F3F4F6",
    foreground: "#111827",
    foregroundMuted: "#4B5563",
    border: "#E5E7EB",
    overlay: "rgba(0,0,0,0.45)",

    primary: "#2563EB",
    success: "#059669",
    warning: "#F59E0B",
    danger: "#DC2626",
  },
  dark: {
    background: "#0D0D0D",
    backgroundSubtle: "#1A1A1A",
    foreground: "#E5E7EB",
    foregroundMuted: "#9CA3AF",
    border: "#2D2D2D",
    overlay: "rgba(0,0,0,0.65)",

    primary: "#3B82F6",
    success: "#34D399",
    warning: "#FBBF24",
    danger: "#F87171",
  }
}
```
