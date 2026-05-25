'use client'

import React, { useMemo } from 'react'
import { useTheme } from 'next-themes'
import { useAppStore } from '@/lib/store'
import type { AppView } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'

import {
  Rocket,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  LayoutDashboard,
  GitFork,
  CheckSquare,
  Users,
  Zap,
  UserCog,
} from 'lucide-react'

// ── Navigation config ──────────────────────────────────────────
interface NavItem {
  view: AppView
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'pipeline', label: 'Pipeline', icon: GitFork },
  { view: 'tasks', label: 'Tasks', icon: CheckSquare },
  { view: 'leads', label: 'Leads', icon: Users },
  { view: 'notifications', label: 'Notifications', icon: Bell },
  { view: 'automations', label: 'Automations', icon: Zap },
  { view: 'team', label: 'Team', icon: UserCog },
]

// ── Sidebar Nav ────────────────────────────────────────────────
function SidebarNav({
  currentView,
  onNavigate,
  onNavigateMobile,
}: {
  currentView: AppView
  onNavigate: (view: AppView) => void
  onNavigateMobile?: (view: AppView) => void
}) {
  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = currentView === item.view
        const handleClick = () => {
          onNavigate(item.view)
          onNavigateMobile?.(item.view)
        }
        return (
          <Tooltip key={item.view}>
            <TooltipTrigger asChild>
              <button
                onClick={handleClick}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer
                  ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="md:hidden">
              {item.label}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}

// ── Theme Toggle ───────────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Toggle theme
      </TooltipContent>
    </Tooltip>
  )
}

// ── Main Layout ────────────────────────────────────────────────
export function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    currentView,
    setCurrentView,
    searchQuery,
    setSearchQuery,
    notifications,
    sidebarOpen,
    setSidebarOpen,
    currentUser,
    logout,
  } = useAppStore()

  // Unread notification count
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  // Mobile sidebar
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const handleNavigate = (view: AppView) => {
    setCurrentView(view)
  }

  const handleNavigateMobile = (_view: AppView) => {
    setMobileOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 h-16 flex items-center gap-4 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden size-9"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Rocket className="size-5 text-primary" />
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-base tracking-tight">BYLDR</span>
            <span className="hidden sm:inline text-muted-foreground text-xs">
              Command Center
            </span>
          </div>
        </div>

        {/* Search – center on desktop, right on mobile */}
        <div className="flex-1 flex justify-center max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search leads, tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-full bg-muted/60 border-0 focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Notification bell */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative size-9"
                onClick={() => setCurrentView('notifications')}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center text-[10px] font-bold leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </TooltipContent>
          </Tooltip>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative size-9 rounded-full p-0"
                aria-label="User menu"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                    {currentUser?.name
                      ? currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                      : '??'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">{currentUser?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground leading-none">
                    {currentUser?.role || 'Member'} · VSUAL Digital Media
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => setCurrentView('team')}>
                Team
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={logout}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ─── BODY: Sidebar + Main ─── */}
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
          <div className="flex-1 py-4">
            <SidebarNav
              currentView={currentView}
              onNavigate={handleNavigate}
            />
          </div>
          <Separator />
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">
              VSUAL Digital Media
            </p>
          </div>
        </aside>

        {/* Mobile sidebar (Sheet) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="px-4 pt-6 pb-2">
              <div className="flex items-center gap-2">
                <Rocket className="size-5 text-primary" />
                <div>
                  <SheetTitle className="text-base font-bold">BYLDR</SheetTitle>
                  <SheetDescription className="text-xs">
                    Command Center
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <Separator />
            <div className="py-4">
              <SidebarNav
                currentView={currentView}
                onNavigate={handleNavigate}
                onNavigateMobile={handleNavigateMobile}
              />
            </div>
            <Separator />
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground">
                VSUAL Digital Media
              </p>
            </div>
          </SheetContent>
        </Sheet>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* ─── STICKY FOOTER ─── */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} VSUAL Digital Media. All rights reserved.</p>
        <div className="flex items-center gap-3">
          {['NXL BYLDR', 'CA BYLDRS', 'BYLDRS GUARDIAN'].map((product) => (
            <span key={product} className="hidden sm:inline">{product}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}
