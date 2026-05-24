import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TaskStatus, TaskPriority } from '@prisma/client'

// GET /api/tasks - List tasks with filtering
export async function GET(request: NextRequest) {
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
  try {
    const body = await request.json()
    const {
      title,
      description,
      status,
      priority,
      type,
      assignedToId,
      createdById,
      leadId,
      dueDate,
      reminderAt,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const task = await db.task.create({
      data: {
        title,
        description: description || null,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        type: type || 'follow_up',
        assignedToId: assignedToId || null,
        createdById: createdById || null,
        leadId: leadId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        reminderAt: reminderAt ? new Date(reminderAt) : null,
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
        description: `Task created: ${title}`,
        leadId: leadId || null,
        userId: createdById || null,
        taskId: task.id,
      },
    })

    // If task is assigned, create assignment activity
    if (assignedToId) {
      await db.activity.create({
        data: {
          type: 'TASK_ASSIGNED',
          description: `Task assigned: ${title}`,
          leadId: leadId || null,
          userId: assignedToId,
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
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

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
