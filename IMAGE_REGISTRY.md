# Image Registry

This file tracks all images used in the Tracking App, including their paths, descriptions, sizes, color schemes, and copyright information.

---

## Guidelines

### Adding Images
When adding a new image to the application:
1. Add entry to this registry
2. Include complete path, description, and metadata
3. Document copyright/licensing information
4. Specify size and color scheme requirements
5. Note any accessibility considerations

### File Organization
```
frontend/public/images/
├── icons/              # App icons and favicons
├── logos/              # Brand logos
├── illustrations/      # Decorative illustrations
├── backgrounds/        # Background images/patterns
└── avatars/           # Default avatar images
```

---

## Registered Images

### Icons & Logos

#### App Icon
- **Path**: `frontend/public/images/icons/app-icon.svg`
- **Description**: Main application icon used in browser tab and PWA
- **Size**: 512x512px (SVG scalable)
- **Color Scheme**: Monotone, uses `currentColor` for theme adaptation
- **Usage**: Favicon, PWA icon, splash screen
- **Copyright**: Custom design, All Rights Reserved
- **Accessibility**: N/A (decorative)
- **Status**: 🔴 Not yet created

#### App Logo
- **Path**: `frontend/public/images/logos/tracking-app-logo.svg`
- **Description**: Main brand logo for navbar and marketing
- **Size**: 200x48px (SVG scalable)
- **Color Scheme**: Monotone with accent color highlight
- **Usage**: Navbar brand, login/register pages, emails
- **Copyright**: Custom design, All Rights Reserved
- **Accessibility**: Alt text required: "Tracking App Logo"
- **Status**: 🔴 Not yet created

### UI Icons (Heroicons)

All UI icons use **Heroicons** (https://heroicons.com/)
- **License**: MIT License
- **Copyright**: Copyright (c) 2020 Refactoring UI Inc.
- **Usage**: Free to use, modify, and distribute
- **Size**: 16px, 20px, 24px, 32px variants
- **Color**: Uses `currentColor` for theme adaptation
- **Implementation**: Inline SVG or icon component library

#### Icon List
- **Menu Icon**: Hamburger menu for mobile nav
- **Close Icon**: Close modals, dialogs
- **Search Icon**: Search inputs
- **Filter Icon**: Filter buttons
- **Sort Icons**: Sort ascending/descending
- **User Icon**: User profile, account
- **Settings Icon**: Settings, preferences
- **Dashboard Icon**: Dashboard navigation
- **Data Icon**: Database/data viewer
- **Chart Icon**: Analytics, statistics
- **Plus Icon**: Add new items
- **Edit Icon**: Edit actions
- **Delete Icon**: Delete actions
- **Check Icon**: Success states, checkboxes
- **X Icon**: Error states, close
- **Info Icon**: Information, help
- **Warning Icon**: Warnings, cautions
- **Calendar Icon**: Date inputs
- **Clock Icon**: Time inputs
- **Heart Icon**: Favorites, likes
- **Star Icon**: Ratings, featured
- **Download Icon**: Export, download
- **Upload Icon**: Import, upload
- **Chevron Icons**: Navigation, dropdowns

### Illustrations

#### Empty State - No Data
- **Path**: `frontend/public/images/illustrations/empty-state.svg`
- **Description**: Illustration for empty data states
- **Size**: 300x200px (SVG scalable)
- **Color Scheme**: Monotone gray with single accent color
- **Usage**: Empty tables, no results, no content
- **Copyright**: undraw.co illustrations (MIT License equivalent)
- **Accessibility**: Alt text: "No data available"
- **Status**: 🔴 Not yet created (can use text-only fallback)

#### Error State
- **Path**: `frontend/public/images/illustrations/error-state.svg`
- **Description**: Illustration for error states
- **Size**: 300x200px (SVG scalable)
- **Color Scheme**: Monotone with red accent
- **Usage**: API errors, loading failures
- **Copyright**: undraw.co illustrations (MIT License equivalent)
- **Accessibility**: Alt text: "An error occurred"
- **Status**: 🔴 Not yet created (can use text-only fallback)

### Background Patterns

#### Subtle Grid Pattern
- **Path**: `frontend/public/images/backgrounds/grid-pattern.svg`
- **Description**: Subtle grid pattern for backgrounds
- **Size**: 100x100px (tileable)
- **Color Scheme**: Very subtle, matches theme colors
- **Usage**: Page backgrounds, card backgrounds
- **Copyright**: Custom design, All Rights Reserved
- **Accessibility**: Decorative only, no alt text needed
- **Status**: 🟡 Optional enhancement

### Avatars

#### Default Avatar
- **Path**: `frontend/public/images/avatars/default-avatar.svg`
- **Description**: Default user avatar icon
- **Size**: 128x128px (SVG scalable)
- **Color Scheme**: Monotone, uses theme colors
- **Usage**: User profiles without custom avatar
- **Copyright**: Custom design, All Rights Reserved
- **Accessibility**: Alt text: "User avatar for [username]"
- **Status**: 🔴 Not yet created (using initials fallback)

---

## Current Implementation Status

### ✅ Implemented (No Images Required)
- Typography: Roboto Mono (Google Fonts)
- Icons: Inline SVG (Heroicons, MIT License)
- Colors: CSS variables (no images)
- Buttons: Pure CSS
- Forms: Pure CSS
- Cards: Pure CSS
- Animations: Pure CSS

### 🟡 Optional Enhancements
- Background patterns (subtle visual interest)
- Custom illustrations (better UX for empty/error states)
- Custom icons (brand consistency)

### 🔴 Not Yet Created (Placeholders Used)
- App icon/favicon
- App logo
- Default avatar
- Empty state illustrations
- Error state illustrations

---

## Third-Party Resources

### Fonts
- **Roboto Mono**
  - Source: Google Fonts
  - License: Apache License 2.0
  - URL: https://fonts.google.com/specimen/Roboto+Mono
  - Usage: Primary typeface for entire application

### Icon Library
- **Heroicons**
  - Source: https://heroicons.com/
  - License: MIT License
  - Copyright: © 2020 Refactoring UI Inc.
  - Usage: All UI icons throughout application
  - Implementation: Inline SVG or React component library

### Placeholder Images (Development Only)
- **Unsplash** (for development/testing only)
  - License: Unsplash License (free to use)
  - URL: https://unsplash.com/
  - Note: Replace with custom images for production

---

## Copyright Compliance

### Internal Assets
All custom-created assets (logos, icons, illustrations) are:
- Copyright: Tracking App © 2025
- License: All Rights Reserved
- Usage: Internal application use only

### External Assets
All third-party assets used in accordance with their respective licenses:
- **Google Fonts**: Apache License 2.0
- **Heroicons**: MIT License
- **Undraw**: Open source illustrations

### Attribution Requirements
When using third-party assets, maintain required attribution:
- Font attribution in footer or credits page
- Icon library attribution in documentation
- Illustration attribution if used

---

## Future Image Additions

When adding new images, update this registry with:
```markdown
#### [Image Name]
- **Path**: `path/to/image.ext`
- **Description**: What the image shows/represents
- **Size**: Dimensions (WxH) and file size
- **Color Scheme**: Theme-compatible colors used
- **Usage**: Where and how it's used
- **Copyright**: License and attribution info
- **Accessibility**: Alt text or ARIA label
- **Status**: ✅ Implemented | 🟡 Optional | 🔴 Planned
```

---

## Version History

- **1.0** (October 11, 2025): Initial image registry created
  - Documented Roboto Mono font usage
  - Documented Heroicons usage
  - Planned future image additions

