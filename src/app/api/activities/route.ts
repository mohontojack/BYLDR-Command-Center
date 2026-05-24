import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { ActivityType } from '@prisma/client'
import { requireAuth } from '@/lib/auth-server'

const createActivitySchema = z.object({
  type: z.enum([
    'LEAD_CREATED',
    'STAGE_CHANGED',
    'EMAIL_SENT',
    'EMAIL_OPENED',
    'EMAIL_REPLIED',
    'SMS_SENT',
    'SMS_REPLIED',
    'CALL_MADE',
    'CALL_COMPLETED',
    'LINK_CLICKED',
    'FORM_SUBMITTED',
    'VIDEO_VIEWED',
    'NOTE_ADDED',
    'TASK_CREATED',
    'TASK_COMPLETED',
    'TASK_ASSIGNED',
    'AUTOMATION_TRIGGERED',
    'FUNNEL_DAY_ADVANCED',
  ]),
  description: z.string().min(1, 'Description is required').max(500),
  leadId: z.string().optional(),
  userId: z.string().optional(),
  taskId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// GET /api/activities - List activities with filtering
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

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
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()

    const parsed = createActivitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }
    const data = parsed.data

    const activity = await db.activity.create({
      data: {
        type: data.type,
        description: data.description,
        leadId: data.leadId || null,
        userId: data.userId || null,
        taskId: data.taskId || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : '{}',
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
