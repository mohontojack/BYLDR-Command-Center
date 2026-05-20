'use client'

import { AppLayout } from '@/components/app-layout'
import { useAppStore } from '@/lib/store'
import dynamic from 'next/dynamic'

const DashboardView = dynamic(() => import('@/components/dashboard-view'), { ssr: false })
const PipelineView = dynamic(() => import('@/components/pipeline-view'), { ssr: false })
const TasksView = dynamic(() => import('@/components/tasks-view'), { ssr: false })
const LeadsView = dynamic(() => import('@/components/leads-view'), { ssr: false })
const NotificationsView = dynamic(() => import('@/components/notifications-view'), { ssr: false })
const AutomationsView = dynamic(() => import('@/components/automations-view'), { ssr: false })
const TeamView = dynamic(() => import('@/components/team-view'), { ssr: false })

export default function Home() {
  const currentView = useAppStore((s) => s.currentView)

  const viewMap = {
    dashboard: DashboardView,
    pipeline: PipelineView,
    tasks: TasksView,
    leads: LeadsView,
    notifications: NotificationsView,
    automations: AutomationsView,
    team: TeamView,
  } as const

  const ActiveView = viewMap[currentView]

  return (
    <AppLayout>
      <ActiveView />
    </AppLayout>
  )
}
