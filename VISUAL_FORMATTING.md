# Visual Formatting Guide - Tracking App

**Version**: 2.0  
**Last Updated**: November 8, 2025  
**Primary Font**: Josefin Sans  
**Design Philosophy**: Luminous Minimalism with Functional Priority

---

## Overview

This guide defines the visual design system for the Tracking App. **All future development must adhere to these guidelines** to maintain a consistent, professional, and accessible user experience.

### Design Principles

1. **Functionality First**: Clarity and usability override decorative elements
2. **Minimalistic Approach**: Clean, uncluttered interfaces with purpose-driven design
3. **Accessibility**: High contrast, readable typography, clear interactive states
4. **Responsive**: Seamless experience across desktop and mobile devices
5. **Consistency**: Predictable patterns across all features

---

## Color System

### Color Themes

The app now ships with **two curated themes**. Both lean into neutral greys for page backgrounds, solid black/white section surfaces, and vibrant neon-inspired accents for maximum contrast.

#### Dark Mode (Default)
```css
--bg-primary: #1F2125        /* Page background - charcoal grey */
--bg-secondary: #08090D      /* Surface background - true black */
--bg-tertiary: #14171C       /* Elevated surfaces */
--bg-hover: #272B33          /* Hover overlays */
--surface-overlay: rgba(255, 255, 255, 0.08) /* Soft glass overlay */

--text-primary: #F4F5F7      /* Headings, key data */
--text-secondary: #C8CBD6    /* Body copy */
--text-tertiary: #949AAE     /* Muted metadata */

--border-primary: rgba(255, 255, 255, 0.08)  /* Minimal edge hint */
--border-secondary: rgba(255, 255, 255, 0.04)

--accent-primary: #5AA6FF    /* Electric blue */
--accent-secondary: #4ADE80  /* Vivid green */
--accent-warning: #FACC15    /* Bright amber */
--accent-danger: #FF6B6B     /* Punchy red */
--accent-info: #38BDF8       /* Neon cyan */
--accent-purple: #A855F7     /* Vibrant violet */

--accent-primary-alpha: rgba(90, 166, 255, 0.18)
--accent-secondary-alpha: rgba(74, 222, 128, 0.16)
--accent-danger-alpha: rgba(255, 107, 107, 0.15)
```

#### Light Mode
```css
--bg-primary: #E9ECF3        /* Page background - soft grey */
--bg-secondary: #FFFFFF      /* Surface background - white */
--bg-tertiary: #F7F9FC       /* Elevated surfaces */
--bg-hover: #EDF1FA          /* Hover overlays */
--surface-overlay: rgba(15, 23, 42, 0.08) /* Glass overlay */

--text-primary: #0F172A      /* Headings, key data */
--text-secondary: #3B4259    /* Body copy */
--text-tertiary: #6B7280     /* Muted metadata */

--border-primary: rgba(15, 23, 42, 0.10)   /* Minimal edge hint */
--border-secondary: rgba(15, 23, 42, 0.06)

--accent-primary: #1D4FFF    /* Electric royal blue */
--accent-secondary: #1ED292  /* Emerald */
--accent-warning: #FFB020    /* Honey amber */
--accent-danger: #F05252     /* Crimson */
--accent-info: #0EA5E9       /* Sky cyan */
--accent-purple: #7C3AED     /* Rich violet */

--accent-primary-alpha: rgba(29, 79, 255, 0.18)
--accent-secondary-alpha: rgba(30, 210, 146, 0.18)
--accent-danger-alpha: rgba(240, 82, 82, 0.18)
```

#### Component-Specific Backgrounds

Some components use custom background colors for visual hierarchy:

**Workout Logging Dashboard:**
- Dashboard background: `#25282d` (slightly lighter than `--bg-primary` for better contrast)
- Workout set group cards: `#181b22` (darker than dashboard background for depth)

These colors create a subtle layered effect where workout cards stand out against the dashboard background.

### Color Usage Rules

#### Backgrounds
- **Primary**: Page backdrop (neutral grey)
- **Secondary**: Major surfaces (cards, panels, modals) — always pure black or pure white depending on theme
- **Tertiary**: Elevated elements and inset containers
- **Hover / Overlay**: Use `--bg-hover` or `--surface-overlay` for glassy translucency

#### Text
- **Primary**: Headings, important text (contrast ratio ≥ 7:1)
- **Secondary**: Body text, descriptions (contrast ratio ≥ 4.5:1)
- **Tertiary**: Hints, metadata, disabled text

#### Accents (Use Sparingly)
- **Primary Blue**: Primary actions (buttons, links, focus states)
- **Secondary Green**: Success states, confirmations
- **Warning Amber**: Warnings, cautions
- **Danger Red**: Errors, destructive actions
- **Info Cyan**: Information, help text
- **Purple**: Special features, premium content

---

## Typography

### Font Family

```css
--font-primary: 'Josefin Sans', sans-serif;
--font-fallback: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
```

**Why Josefin Sans**:
- Geometric letterforms reinforce the modern, data-forward aesthetic
- High x-height for legibility on dense dashboards
- Distinct character shapes support quick scanning of metrics
- Works seamlessly across headings, labels, and body copy

### Font Weights

```css
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-bold: 700;
```

### Type Scale

```css
--text-xs: 0.75rem;    /* 12px - Meta info, labels */
--text-sm: 0.875rem;   /* 14px - Secondary text */
--text-base: 1rem;     /* 16px - Body text */
--text-lg: 1.125rem;   /* 18px - Emphasized text */
--text-xl: 1.25rem;    /* 20px - Small headings */
--text-2xl: 1.5rem;    /* 24px - Section headings */
--text-3xl: 1.875rem;  /* 30px - Page titles */
--text-4xl: 2.25rem;   /* 36px - Hero text */
```

### Line Height

```css
--leading-tight: 1.25;    /* Headings */
--leading-normal: 1.5;    /* Body text */
--leading-relaxed: 1.75;  /* Spacious text */
```

### Usage Examples

```css
/* Page Title */
h1 {
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

/* Section Heading */
h2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-medium);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

/* Body Text */
p {
  font-size: var(--text-base);
  font-weight: var(--font-weight-regular);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

/* Small Meta Text */
.meta {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-light);
  color: var(--text-tertiary);
}
```

---

## Spacing System

### Base Unit: 4px

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### Usage Guidelines

- **Micro spacing (4-8px)**: Between related elements (icon + label)
- **Small spacing (12-16px)**: Between components in a group
- **Medium spacing (20-24px)**: Between sections within a card
- **Large spacing (32-48px)**: Between major sections
- **XL spacing (64-80px)**: Page margins, hero sections

---

## Border Radius

### Rounded Edges (Required)

```css
--radius-sm: 0.25rem;   /* 4px - Small elements */
--radius-md: 0.5rem;    /* 8px - Buttons, inputs */
--radius-lg: 0.75rem;   /* 12px - Cards */
--radius-xl: 1rem;      /* 16px - Modals */
--radius-2xl: 1.5rem;   /* 24px - Hero elements */
--radius-full: 9999px;  /* Pills, avatars */
```

### Application

- **Buttons**: `--radius-md` (8px)
- **Input Fields**: `--radius-md` (8px)
- **Cards**: `--radius-lg` (12px)
- **Modals/Dialogs**: `--radius-xl` (16px)
- **Tabs**: `--radius-md` top corners only
- **Pills/Badges**: `--radius-full`
- **Avatars**: `--radius-full`

---

## Shadows & Layering

### Elevation System

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
```

### Z-Index Scale

```css
--z-base: 0;        /* Normal flow */
--z-dropdown: 100;  /* Dropdowns */
--z-sticky: 200;    /* Sticky headers */
--z-fixed: 300;     /* Fixed navigation */
--z-modal-bg: 400;  /* Modal backdrop */
--z-modal: 500;     /* Modal content */
--z-popover: 600;   /* Popovers, tooltips */
--z-toast: 700;     /* Toast notifications */
```

### Usage

- **Cards**: `--shadow-sm` default, `--shadow-md` on hover
- **Dropdowns**: `--shadow-lg`
- **Modals**: `--shadow-2xl`
- **Focused Inputs**: `--shadow-md` with accent color

---

## UI Elements

### Buttons

Floating actions are now the norm—high-contrast, pill-shaped buttons with deep shadows that remain legible against both dark and light surfaces.

#### Primary Button (Floating Action)
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  border: none;
  border-radius: var(--radius-full);
  color: #0B0D12;
  background: linear-gradient(135deg, var(--accent-secondary), var(--accent-primary));
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.45);
  transition: transform 0.25s var(--ease-out-cubic), box-shadow 0.25s var(--ease-out-cubic);
}

.btn-primary:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 32px 65px rgba(90, 166, 255, 0.35);
}

.btn-primary:active {
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

#### Secondary Button
```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: none;
  border-radius: var(--radius-full);
  color: #0B0D12;
  background: linear-gradient(135deg, var(--accent-info), var(--accent-primary));
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.42);
  transition: transform 0.25s var(--ease-out-cubic), box-shadow 0.25s var(--ease-out-cubic);
}

.btn-secondary:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 30px 60px rgba(56, 189, 248, 0.35);
}
```

#### Icon Button
```css
.btn-icon {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  transition: transform 0.2s var(--ease-out-cubic), color 0.2s var(--ease-out-cubic);
}

.btn-icon:hover {
  transform: translateY(-2px);
  color: var(--text-primary);
}
```

### Input Fields

```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  font-family: var(--font-primary);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: var(--bg-primary);
}

.input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--bg-tertiary);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

### Cards

```css
.card {
  background: var(--bg-secondary);
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  border: none;
  box-shadow: 0 24px 55px rgba(0, 0, 0, 0.35);
  transition: transform 0.3s var(--ease-in-out-cubic), box-shadow 0.3s var(--ease-in-out-cubic);
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 32px 70px rgba(0, 0, 0, 0.4);
}

.card-header {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
}

.card-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0;
}
```

### Tables

```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--bg-secondary);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.32);
}

.table thead {
  background: var(--bg-tertiary);
}

.table th {
  padding: var(--space-4);
  text-align: left;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: none;
}

.table td {
  padding: var(--space-4);
  color: var(--text-secondary);
  font-size: var(--text-base);
  border-top: none;
}

.table tbody tr {
  transition: background 0.15s var(--ease-out-cubic);
}

.table tbody tr:hover {
  background: var(--surface-overlay);
}
```

### Tabs

```css
.tabs {
  display: flex;
  gap: var(--space-2);
  padding: 0 var(--space-4);
}

.tab {
  padding: var(--space-3) var(--space-5);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.tab:hover {
  color: var(--text-primary);
  background: var(--surface-overlay);
}

.tab.active {
  color: var(--accent-primary);
  box-shadow: inset 0 -3px 0 0 var(--accent-primary);
}
```

### Modals

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal-bg);
  animation: fadeIn 0.2s ease;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  border: none;
  box-shadow: 0 32px 70px rgba(0, 0, 0, 0.45);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  z-index: var(--z-modal);
  animation: modalFloat 0.3s var(--ease-in-out-cubic);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalFloat {
  from {
    opacity: 0;
    transform: translate(-50%, -45%) scale(0.97);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.01);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
```

---

## Icons

### Guidelines

- **Use monotone icons** (single color, matches text color)
- **Size scale**: 16px, 20px, 24px, 32px
- **Pair with text** for primary actions
- **Icon-only** for secondary/tertiary actions with tooltip
- **Consistent style**: Use one icon library (e.g., Heroicons, Feather Icons)

### Implementation

```css
.icon {
  width: 1.25rem;  /* 20px default */
  height: 1.25rem;
  color: currentColor;
  transition: transform 0.2s ease;
}

.icon-sm { width: 1rem; height: 1rem; }      /* 16px */
.icon-md { width: 1.25rem; height: 1.25rem; } /* 20px */
.icon-lg { width: 1.5rem; height: 1.5rem; }  /* 24px */
.icon-xl { width: 2rem; height: 2rem; }      /* 32px */

.btn .icon {
  margin-right: var(--space-2);
}

.btn-icon-only .icon {
  margin: 0;
}
```

---

## Animations & Transitions

### Timing Functions (Spline Curves)

```css
--ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
--ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Standard Transitions

```css
/* Quick interactions */
.transition-fast {
  transition: all 0.15s var(--ease-out-cubic);
}

/* Standard interactions */
.transition-normal {
  transition: all 0.3s var(--ease-in-out-cubic);
}

/* Emphasized transitions */
.transition-slow {
  transition: all 0.5s var(--ease-in-out-cubic);
}
```

### Slide Animations

```css
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Interactive Feedback

```css
/* Hover lift */
.lift-on-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Click press */
.press-on-click:active {
  transform: scale(0.98);
}

/* Subtle scale */
.scale-on-hover:hover {
  transform: scale(1.02);
}

/* Glow effect */
.glow-on-focus:focus {
  box-shadow: 0 0 0 3px var(--accent-primary-alpha);
}
```

---

## Responsive Design

### Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet portrait */
--breakpoint-lg: 1024px;  /* Tablet landscape / small desktop */
--breakpoint-xl: 1280px;  /* Desktop */
--breakpoint-2xl: 1536px; /* Large desktop */
```

### Mobile-First Approach

```css
/* Mobile (default) */
.container {
  padding: var(--space-4);
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: var(--space-6);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    padding: var(--space-8);
  }
}
```

### Mobile Optimizations

- **Touch targets**: Minimum 44x44px for all interactive elements
- **Font sizes**: Minimum 16px to prevent zoom on iOS
- **Spacing**: Increase padding for easier touch interactions
- **Navigation**: Hamburger menu for mobile, full nav for desktop

---

## Accessibility

### Contrast Requirements

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text (18px+)**: Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio

### Focus States

```css
*:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### Screen Reader Support

- All interactive elements must have accessible labels
- Use `aria-label` for icon-only buttons
- Provide `alt` text for all images
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Logical tab order
- Visible focus indicators
- Escape key closes modals/dropdowns

---

## Component Shapes

### Variety of Shapes

- **Rectangles**: Cards, buttons, inputs (primary shape)
- **Rounded Rectangles**: Most UI elements with `border-radius`
- **Circles**: Avatars, icon buttons, badges
- **Pills**: Tags, status indicators (`border-radius: 9999px`)
- **Trapezoids**: Optional for nav elements (use with caution)

### Usage

```css
/* Standard rounded rectangle */
.shape-rect { border-radius: var(--radius-md); }

/* Pill shape */
.shape-pill { border-radius: var(--radius-full); }

/* Circle (square with equal dimensions) */
.shape-circle {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
}
```

---

## Implementation Checklist

When implementing a new feature, ensure:

- [ ] Uses defined color theme variables
- [ ] Josefin Sans font applied
- [ ] Proper spacing system (4px increments)
- [ ] Rounded corners on all interactive elements
- [ ] Smooth transitions (spline curves, not linear)
- [ ] Monotone icons with appropriate size
- [ ] High contrast text (meets WCAG standards)
- [ ] Responsive design (mobile and desktop)
- [ ] Interactive feedback (hover, active, focus states)
- [ ] Accessibility features (focus states, ARIA labels)
- [ ] Layered visual elements with proper z-index
- [ ] Consistent with existing components

---

## Examples

### Complete Button Example

```html
<button class="btn btn-primary btn-with-icon">
  <svg class="icon icon-md" /* icon markup */></svg>
  <span>Save Changes</span>
</button>
```

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all 0.2s var(--ease-out-cubic);
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: translateY(0);
}
```

### Complete Card Example

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Recent Activity</h3>
  </div>
  <div class="card-body">
    <p class="text-secondary">Content here...</p>
  </div>
</div>
```

---

## Resources

### Fonts
- **Josefin Sans**: https://fonts.google.com/specimen/Josefin+Sans
- Load via Google Fonts or self-host

### Icons
- **Heroicons**: https://heroicons.com/ (recommended)
- **Feather Icons**: https://feathericons.com/
- **Lucide**: https://lucide.dev/

### Color Tools
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Color Palette**: Use provided theme variables

### References
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Cubic Bezier Tool**: https://cubic-bezier.com/

---

## Version History

- **2.0** (November 8, 2025): Reduced to light/dark themes, introduced high-contrast floating actions, upgraded typography to Josefin Sans, refreshed card/table/modal styling
- **1.0** (October 11, 2025): Initial design system documentation

