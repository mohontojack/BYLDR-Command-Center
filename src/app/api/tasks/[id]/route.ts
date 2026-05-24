import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-server'

// GET /api/tasks/[id] - Get task detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params

    const task = await db.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            funnelStage: true,
            status: true,
          },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error fetching task detail:', error)
    return NextResponse.json({ error: 'Failed to fetch task detail' }, { status: 500 })
  }
}
