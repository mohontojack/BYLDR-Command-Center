# Task 4-a - App Layout Shell

**Agent**: Layout Developer
**Status**: ✅ Completed

## Summary
Created the main application layout shell for BYLDR Command Center with responsive header, collapsible sidebar, theme provider, and proper view routing integration.

## Deliverables

### ThemeProvider (`src/components/theme-provider.tsx`)
- Thin wrapper around `next-themes` `ThemeProvider`
- `'use client'` directive for client-side theme switching
- Supports `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`

### App Layout (`src/components/app-layout.tsx`)
- **Header** (sticky, h-16, z-50, bg-background/95 backdrop-blur):
  - Left: Rocket icon + "BYLDR" bold text + "Command Center" muted subtitle
  - Center: Rounded search input with Search icon, updates `searchQuery` in Zustand store
  - Right: Notification bell with unread badge count (filtered from store), Theme toggle (Sun/Moon), User avatar dropdown (Sal / CSO)
  - Mobile: Hamburger menu button to open Sheet sidebar
- **Desktop Sidebar** (w-64, fixed, border-r, sidebar theme colors):
  - 7 nav items: Dashboard, Pipeline, Tasks, Leads, Notifications, Automations, Team
  - Active state highlighted with `bg-accent`
  - Clicking sets `currentView` in Zustand store
  - Bottom: "VSUAL Digital Media" agency name
- **Mobile Sidebar** (Sheet sliding from left):
  - Same navigation items
  - Auto-closes on navigation
  - Logo and description header
- **Main Content**: `flex-1 min-w-0 overflow-y-auto` with responsive padding (p-4 md:p-6 lg:p-8)

### Updated `src/app/layout.tsx`
- Wrapped children with `ThemeProvider` (attribute="class", defaultTheme="system", enableSystem, disableTransitionOnChange)
- Updated metadata: title "BYLDR Command Center", description about marketing agency operational hub
- Added keywords, openGraph, and twitter card metadata

### Updated `src/app/page.tsx`
- Wraps view routing in `AppLayout`
- Uses `dynamic()` imports for all 7 view components (ssr: false)
- Renders the active view based on `currentView` from Zustand store

## Components Used
- shadcn/ui: Avatar, Button, Input, Badge, Sheet, Separator, Tooltip, DropdownMenu
- Lucide icons: Rocket, Search, Bell, Sun, Moon, Menu, LayoutDashboard, GitFork, CheckSquare, Users, Zap, UserCog
- Zustand store: `useAppStore` for navigation, search, notifications

## Notes
- ESLint: 0 errors
- Dev server: Compiles successfully
- Fully responsive (mobile-first with md: breakpoints)
- All existing view components (dashboard, pipeline, tasks, leads, notifications, automations, team) properly integrated
