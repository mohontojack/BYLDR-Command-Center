import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { TaskStatus, TaskPriority } from '@prisma/client'
import { requireAuth } from '@/lib/auth-server'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  type: z.string().max(50).optional(),
  assignedToId: z.string().optional(),
  createdById: z.string().optional(),
  leadId: z.string().optional(),
  dueDate: z.string().optional(),
  reminderAt: z.string().optional(),
})

const updateTaskSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  type: z.string().max(50).optional(),
  assignedToId: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  reminderAt: z.string().optional().nullable(),
})

// GET /api/tasks - List tasks with filtering
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as TaskStatus | null
    const priority = searchParams.get('priority') as TaskPriority | null
    const assignedTo = searchParams.get('assignedTo')
    const type = searchParams.get('type')
    const dueDateFrom = searchParams.get('dueDateFrom')
    const dueDateTo = searchParams.get('dueDateTo')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const skip = (page - 1) * limit
    const includeCompleted = searchParams.get('includeCompleted') !== 'false'

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    else if (!includeCompleted) where.status = { not: 'COMPLETED' }

    if (priority) where.priority = priority
    if (assignedTo) where.assignedToId = assignedTo
    if (type) where.type = type
    if (dueDateFrom || dueDateTo) {
      where.dueDate = {}
      if (dueDateFrom) (where.dueDate as Record<string, unknown>).gte = new Date(dueDateFrom)
      if (dueDateTo) (where.dueDate as Record<string, unknown>).lte = new Date(dueDateTo)
    }

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      db.task.count({ where }),
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/tasks - Create task
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()

    const parsed = createTaskSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }
    const data = parsed.data

    const task = await db.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        status: data.status || 'PENDING',
        priority: data.priority || 'MEDIUM',
        type: data.type || 'follow_up',
        assignedToId: data.assignedToId || null,
        createdById: data.createdById || null,
        leadId: data.leadId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        reminderAt: data.reminderAt ? new Date(data.reminderAt) : null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, firstName: true, lastName: true, company: true } },
      },
    })

    // Create activity for task creation
    await db.activity.create({
      data: {
        type: 'TASK_CREATED',
        description: `Task created: ${data.title}`,
        leadId: data.leadId || null,
        userId: data.createdById || null,
        taskId: task.id,
      },
    })

    // If task is assigned, create assignment activity
    if (data.assignedToId) {
      await db.activity.create({
        data: {
          type: 'TASK_ASSIGNED',
          description: `Task assigned: ${data.title}`,
          leadId: data.leadId || null,
          userId: data.assignedToId,
          taskId: task.id,
        },
      })
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

// PUT /api/tasks - Update task
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()

    const parsed = updateTaskSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }
    const { id, ...updateData } = parsed.data

    const existingTask = await db.task.findUnique({ where: { id } })
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Whitelist safe update fields
    const safeFields: Record<string, unknown> = {}
    const allowedFields = ['title','description','status','priority','type','assignedToId','createdById','leadId','dueDate','reminderAt']
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        safeFields[key] = updateData[key]
      }
    }

    // Handle status changes
    if (safeFields.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      safeFields.completedAt = new Date()
    } else if (safeFields.status && safeFields.status !== 'COMPLETED') {
      safeFields.completedAt = null
    }

    const task = await db.task.update({
      where: { id },
      data: safeFields,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, firstName: true, lastName: true, company: true } },
      },
    })

    // Create activity for task completion
    if (safeFields.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      await db.activity.create({
        data: {
          type: 'TASK_COMPLETED',
          description: `Task completed: ${task.title}`,
          leadId: existingTask.leadId || null,
          userId: existingTask.assignedToId || null,
          taskId: id,
        },
      })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}
