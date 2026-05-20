import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/notifications - List notifications for a user
export async function GET(request: NextRequest) {
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
  try {
    const body = await request.json()
    const { type, title, message, userId, leadId, actionUrl } = body

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Type, title, and message are required' }, { status: 400 })
    }

    const notification = await db.notification.create({
      data: {
        type,
        title,
        message,
        userId: userId || null,
        leadId: leadId || null,
        actionUrl: actionUrl || null,
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
