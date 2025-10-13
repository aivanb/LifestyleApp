# Visual Formatting Guide - Tracking App

**Version**: 1.0  
**Last Updated**: October 11, 2025  
**Primary Font**: Roboto Mono  
**Design Philosophy**: Modern Minimalism with Functional Priority

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

The app supports **multiple color themes** for user customization. All themes follow the monotone + accent pattern.

#### Theme 1: Dark Mode (Default)
```css
--bg-primary: #0F1419        /* Main background - very dark blue-gray */
--bg-secondary: #1A1F2E      /* Cards, panels - dark slate */
--bg-tertiary: #252B3A       /* Elevated elements - lighter slate */
--bg-hover: #2D3448          /* Hover states */

--text-primary: #E8E9ED      /* Main text - off-white */
--text-secondary: #A0A5B8    /* Secondary text - muted blue-gray */
--text-tertiary: #6B7280     /* Tertiary text - gray */

--border-primary: #2D3448    /* Primary borders */
--border-secondary: #1A1F2E  /* Subtle borders */

--accent-primary: #3B82F6    /* Blue - primary actions */
--accent-secondary: #10B981  /* Green - success */
--accent-warning: #F59E0B    /* Amber - warnings */
--accent-danger: #EF4444     /* Red - errors */
--accent-info: #06B6D4       /* Cyan - information */
--accent-purple: #8B5CF6     /* Purple - special features */
```

#### Theme 2: Light Mode
```css
--bg-primary: #FFFFFF        /* Pure white */
--bg-secondary: #F9FAFB      /* Very light gray */
--bg-tertiary: #F3F4F6       /* Light gray */
--bg-hover: #E5E7EB          /* Hover - medium gray */

--text-primary: #111827      /* Almost black */
--text-secondary: #4B5563    /* Dark gray */
--text-tertiary: #9CA3AF     /* Medium gray */

--border-primary: #E5E7EB    /* Light borders */
--border-secondary: #F3F4F6  /* Subtle borders */

--accent-primary: #2563EB    /* Blue */
--accent-secondary: #059669  /* Green */
--accent-warning: #D97706    /* Amber */
--accent-danger: #DC2626     /* Red */
--accent-info: #0891B2       /* Cyan */
--accent-purple: #7C3AED     /* Purple */
```

#### Theme 3: High Contrast
```css
--bg-primary: #000000        /* Pure black */
--bg-secondary: #1A1A1A      /* Very dark gray */
--bg-tertiary: #2A2A2A       /* Dark gray */
--bg-hover: #3A3A3A          /* Medium gray */

--text-primary: #FFFFFF      /* Pure white */
--text-secondary: #E0E0E0    /* Light gray */
--text-tertiary: #B0B0B0     /* Medium gray */

--border-primary: #FFFFFF    /* White borders */
--border-secondary: #4A4A4A  /* Gray borders */

--accent-primary: #00BFFF    /* Bright cyan-blue */
--accent-secondary: #00FF7F  /* Bright green */
--accent-warning: #FFD700    /* Bright yellow */
--accent-danger: #FF4500     /* Bright red-orange */
--accent-info: #00FFFF       /* Bright cyan */
--accent-purple: #DA70D6     /* Bright orchid */
```

#### Theme 4: Warm Minimal
```css
--bg-primary: #FBF8F3        /* Warm white */
--bg-secondary: #F5EFE6      /* Warm beige */
--bg-tertiary: #EDE4D9       /* Warm tan */
--bg-hover: #E5D9CC          /* Warm hover */

--text-primary: #2D2520      /* Warm black */
--text-secondary: #5C534A    /* Warm gray */
--text-tertiary: #8A7F75     /* Warm muted */

--border-primary: #D4C4B0    /* Warm border */
--border-secondary: #E5D9CC  /* Subtle warm */

--accent-primary: #D97706    /* Warm amber */
--accent-secondary: #059669  /* Forest green */
--accent-warning: #F59E0B    /* Bright amber */
--accent-danger: #DC2626     /* Warm red */
--accent-info: #0891B2       /* Teal */
--accent-purple: #9333EA     /* Warm purple */
```

### Color Usage Rules

#### Backgrounds
- **Primary**: Main page backgrounds
- **Secondary**: Cards, panels, containers
- **Tertiary**: Elevated elements (modals, dropdowns, tooltips)
- **Hover**: Interactive element hover states

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
--font-primary: 'Roboto Mono', monospace;
--font-fallback: 'Courier New', 'Monaco', 'Consolas', monospace;
```

**Why Roboto Mono**:
- Excellent readability for data-heavy interfaces
- Clear distinction between similar characters (0 vs O, 1 vs l)
- Modern, technical aesthetic
- Monospace aids in table alignment

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

#### Primary Button
```css
.btn-primary {
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  filter: brightness(1.1);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
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
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  /* Rest same as primary */
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
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: var(--bg-hover);
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
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-secondary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-primary);
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
  border-radius: var(--radius-lg);
  overflow: hidden;
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
}

.table td {
  padding: var(--space-4);
  border-top: 1px solid var(--border-primary);
  color: var(--text-secondary);
  font-size: var(--text-base);
}

.table tbody tr {
  transition: background 0.15s ease;
}

.table tbody tr:hover {
  background: var(--bg-hover);
}
```

### Tabs

```css
.tabs {
  display: flex;
  gap: var(--space-2);
  border-bottom: 1px solid var(--border-primary);
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
  background: var(--bg-hover);
}

.tab.active {
  color: var(--accent-primary);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-primary);
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
  box-shadow: var(--shadow-2xl);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  z-index: var(--z-modal);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, -45%);
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
- [ ] Roboto Mono font applied
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
- **Roboto Mono**: https://fonts.google.com/specimen/Roboto+Mono
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

- **1.0** (October 11, 2025): Initial design system documentation

