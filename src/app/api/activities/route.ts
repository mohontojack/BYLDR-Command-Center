import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ActivityType } from '@prisma/client'

// GET /api/activities - List activities with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const userId = searchParams.get('userId')
    const taskId = searchParams.get('taskId')
    const type = searchParams.get('type') as ActivityType | null
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (leadId) where.leadId = leadId
    if (userId) where.userId = userId
    if (taskId) where.taskId = taskId
    if (type) where.type = type

    const [activities, total] = await Promise.all([
      db.activity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
          task: { select: { id: true, title: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.activity.count({ where }),
    ])

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

// POST /api/activities - Create activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, description, leadId, userId, taskId, metadata } = body

    if (!type || !description) {
      return NextResponse.json({ error: 'Type and description are required' }, { status: 400 })
    }

    const activity = await db.activity.create({
      data: {
        type,
        description,
        leadId: leadId || null,
        userId: userId || null,
        taskId: taskId || null,
        metadata: metadata ? JSON.stringify(metadata) : '{}',
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        lead: { select: { id: true, firstName: true, lastName: true, company: true } },
        task: { select: { id: true, title: true, status: true } },
      },
    })

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}
