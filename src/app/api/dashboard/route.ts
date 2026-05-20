import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/dashboard - Dashboard aggregated data
export async function GET() {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Run all queries in parallel for efficiency
    const [
      totalLeads,
      newLeadsToday,
      leadsByStage,
      activeLeads,
      wonLeads,
      lostLeads,
      totalTasks,
      overdueTasks,
      completedTasksToday,
      tasksByStatus,
      tasksByPriority,
      todaysActionItems,
      recentActivities,
      unreadNotificationCount,
      funnelConversionData,
      recentNotifications,
    ] = await Promise.all([
      // Total leads (non-archived)
      db.lead.count({ where: { status: { not: 'ARCHIVED' } } }),

      // New leads today
      db.lead.count({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { not: 'ARCHIVED' },
        },
      }),

      // Leads by stage (active only)
      db.lead.groupBy({
        by: ['funnelStage'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),

      // Active leads count
      db.lead.count({ where: { status: 'ACTIVE' } }),

      // Won leads count
      db.lead.count({ where: { status: 'WON' } }),

      // Lost leads count
      db.lead.count({ where: { status: 'LOST' } }),

      // Total tasks (non-cancelled)
      db.task.count({ where: { status: { not: 'CANCELLED' } } }),

      // Overdue tasks
      db.task.count({
        where: {
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { lt: new Date() },
        },
      }),

      // Completed tasks today
      db.task.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: todayStart, lte: todayEnd },
        },
      }),

      // Tasks by status
      db.task.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Tasks by priority
      db.task.groupBy({
        by: ['priority'],
        where: { status: { not: 'CANCELLED' } },
        _count: true,
      }),

      // Today's action items: tasks due today + leads needing follow-up (nextActionDate is today)
      db.task.findMany({
        where: {
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { gte: todayStart, lte: todayEnd },
        },
        include: {
          assignedTo: { select: { id: true, name: true, avatar: true } },
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
        },
        orderBy: { priority: 'desc' },
        take: 20,
      }),

      // Recent activities (last 20)
      db.activity.findMany({
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // Unread notification count
      db.notification.count({ where: { read: false } }),

      // Funnel conversion data - counts at each stage (all non-archived leads)
      db.lead.groupBy({
        by: ['funnelStage'],
        where: { status: { not: 'ARCHIVED' } },
        _count: true,
      }),

      // Recent notifications (last 5)
      db.notification.findMany({
        where: { read: false },
        include: {
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    // Get leads needing follow-up today
    const leadsNeedingFollowUp = await db.lead.findMany({
      where: {
        status: 'ACTIVE',
        nextActionDate: { gte: todayStart, lte: todayEnd },
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { score: 'desc' },
      take: 10,
    })

    // Format leads by stage into a clean object
    const stageOrder = ['AWARENESS', 'DISCOVERY', 'EVALUATION', 'ASSESSMENT', 'PURCHASE', 'LOYALTY']
    const leadsByStageMap: Record<string, number> = {}
    for (const stage of stageOrder) {
      leadsByStageMap[stage] = 0
    }
    for (const item of leadsByStage) {
      leadsByStageMap[item.funnelStage] = item._count
    }

    // Format funnel conversion data
    const funnelStages: Record<string, number> = {}
    for (const stage of stageOrder) {
      funnelStages[stage] = 0
    }
    for (const item of funnelConversionData) {
      funnelStages[item.funnelStage] = item._count
    }

    // Calculate funnel conversion rates (stage-to-stage)
    const funnelConversions: { stage: string; count: number; rate: number | null }[] = []
    let prevCount = funnelStages['AWARENESS']
    for (const stage of stageOrder) {
      const count = funnelStages[stage]
      funnelConversions.push({
        stage,
        count,
        rate: prevCount > 0 && stage !== 'AWARENESS' ? Math.round((count / prevCount) * 100) : null,
      })
      if (count > 0) prevCount = count
    }

    // Format tasks by status
    const tasksByStatusMap: Record<string, number> = {}
    for (const item of tasksByStatus) {
      tasksByStatusMap[item.status] = item._count
    }

    // Format tasks by priority
    const tasksByPriorityMap: Record<string, number> = {}
    for (const item of tasksByPriority) {
      tasksByPriorityMap[item.priority] = item._count
    }

    // Calculate overall conversion rate (WON / total non-archived)
    const overallConversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

    return NextResponse.json({
      leads: {
        total: totalLeads,
        newToday: newLeadsToday,
        active: activeLeads,
        won: wonLeads,
        lost: lostLeads,
        byStage: leadsByStageMap,
      },
      tasks: {
        total: totalTasks,
        overdue: overdueTasks,
        completedToday: completedTasksToday,
        byStatus: tasksByStatusMap,
        byPriority: tasksByPriorityMap,
      },
      todayActionItems: {
        tasksDueToday: todaysActionItems,
        leadsNeedingFollowUp: leadsNeedingFollowUp,
      },
      recentActivities,
      recentNotifications,
      funnel: {
        stages: funnelStages,
        conversions: funnelConversions,
        overallConversionRate,
      },
      unreadNotifications: unreadNotificationCount,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
