'use client'

import { useEffect } from 'react'
import { AppLayout } from '@/components/app-layout'
import { LoginPage } from '@/components/login-page'
import { useAppStore } from '@/lib/store'
import { setAuthToken } from '@/lib/api'
import dynamic from 'next/dynamic'

const DashboardView = dynamic(() => import('@/components/dashboard-view'), { ssr: false })
const PipelineView = dynamic(() => import('@/components/pipeline-view'), { ssr: false })
const TasksView = dynamic(() => import('@/components/tasks-view'), { ssr: false })
const LeadsView = dynamic(() => import('@/components/leads-view'), { ssr: false })
const NotificationsView = dynamic(() => import('@/components/notifications-view'), { ssr: false })
const AutomationsView = dynamic(() => import('@/components/automations-view'), { ssr: false })
const TeamView = dynamic(() => import('@/components/team-view'), { ssr: false })

const viewMap = {
  dashboard: DashboardView,
  pipeline: PipelineView,
  tasks: TasksView,
  leads: LeadsView,
  notifications: NotificationsView,
  automations: AutomationsView,
  team: TeamView,
} as const

export default function Home() {
  const { isAuthenticated, currentView, login } = useAppStore()

  // Restore session from localStorage on mount
  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('bldr_user')
        const storedToken = localStorage.getItem('bldr_token')
        if (stored && storedToken) {
          const user = JSON.parse(stored)
          login(user, storedToken)
        }
      } catch {
        // Invalid stored data, ignore
      }
    }
  }, [])

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />
  }

  const ActiveView = viewMap[currentView]

  return (
    <AppLayout>
      <ActiveView />
    </AppLayout>
  )
}
