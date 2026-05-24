import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-server'

const createNotificationSchema = z.object({
  type: z.enum([
    'LEAD_ASSIGNED',
    'STAGE_CHANGE',
    'TASK_DUE',
    'TASK_OVERDUE',
    'LEAD_ENGAGEMENT',
    'AUTOMATION_ALERT',
    'DAILY_SUMMARY',
    'SYSTEM',
  ]),
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().min(1, 'Message is required').max(500),
  userId: z.string().optional(),
  leadId: z.string().optional(),
  actionUrl: z.string().optional(),
})

// GET /api/notifications - List notifications for a user
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (userId) where.userId = userId
    if (unreadOnly) where.read = false

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        include: {
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.notification.count({ where }),
      userId
        ? db.notification.count({ where: { userId, read: false } })
        : db.notification.count({ where: { read: false } }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// PUT /api/notifications - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { ids, userId, markAll } = body

    if (markAll && userId) {
      // Mark all notifications for a user as read
      const result = await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true, readAt: new Date() },
      })
      return NextResponse.json({ updated: result.count })
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
      const result = await db.notification.updateMany({
        where: { id: { in: ids } },
        data: { read: true, readAt: new Date() },
      })
      return NextResponse.json({ updated: result.count })
    }

    return NextResponse.json({ error: 'Provide ids array or markAll with userId' }, { status: 400 })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()

    const parsed = createNotificationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }
    const data = parsed.data

    const notification = await db.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId || null,
        leadId: data.leadId || null,
        actionUrl: data.actionUrl || null,
      },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true, company: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
