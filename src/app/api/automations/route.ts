import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { TriggerType } from '@prisma/client'
import { requireAuth } from '@/lib/auth-server'

const createAutomationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  enabled: z.boolean().optional(),
  triggerType: z.enum([
    'LEAD_CREATED',
    'STAGE_CHANGED',
    'EMAIL_OPENED',
    'EMAIL_REPLIED',
    'LINK_CLICKED',
    'SMS_REPLIED',
    'CALL_COMPLETED',
    'FORM_SUBMITTED',
    'DAYS_IN_FUNNEL',
    'TASK_OVERDUE',
    'LEAD_INACTIVE',
  ]),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  actions: z.array(z.record(z.string(), z.unknown())).min(1, 'Actions must be a non-empty array'),
})

const updateAutomationSchema = z.object({
  id: z.string().min(1, 'Automation ID is required'),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  enabled: z.boolean().optional(),
  triggerType: z.enum([
    'LEAD_CREATED',
    'STAGE_CHANGED',
    'EMAIL_OPENED',
    'EMAIL_REPLIED',
    'LINK_CLICKED',
    'SMS_REPLIED',
    'CALL_COMPLETED',
    'FORM_SUBMITTED',
    'DAYS_IN_FUNNEL',
    'TASK_OVERDUE',
    'LEAD_INACTIVE',
  ]).optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  actions: z.array(z.record(z.string(), z.unknown())).optional(),
})

// GET /api/automations - List automations
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const enabledOnly = searchParams.get('enabledOnly') === 'true'
    const triggerType = searchParams.get('triggerType') as TriggerType | null

    const where: Record<string, unknown> = {}
    if (enabledOnly) where.enabled = true
    if (triggerType) where.triggerType = triggerType

    const automations = await db.automation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Parse JSON fields for each automation
    const parsed = automations.map((auto) => ({
      ...auto,
      triggerConfig: JSON.parse(auto.triggerConfig),
      actions: JSON.parse(auto.actions),
    }))

    return NextResponse.json({ automations: parsed })
  } catch (error) {
    console.error('Error fetching automations:', error)
    return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 })
  }
}

// POST /api/automations - Create automation
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()

    const parsed = createAutomationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }
    const data = parsed.data

    const automation = await db.automation.create({
      data: {
        name: data.name,
        description: data.description || null,
        enabled: data.enabled !== false,
        triggerType: data.triggerType,
        triggerConfig: JSON.stringify(data.triggerConfig || {}),
        actions: JSON.stringify(data.actions),
      },
    })

    return NextResponse.json(
      {
        ...automation,
        triggerConfig: JSON.parse(automation.triggerConfig),
        actions: JSON.parse(automation.actions),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating automation:', error)
    return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 })
  }
}

// PUT /api/automations - Update automation (toggle, edit)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()

    const parsed = updateAutomationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }
    const { id, ...updateData } = parsed.data

    const existing = await db.automation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    // Build Prisma-safe data with JSON stringified fields
    const dbData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'triggerConfig' && value && typeof value === 'object') {
        dbData[key] = JSON.stringify(value)
      } else if (key === 'actions' && value && typeof value === 'object') {
        dbData[key] = JSON.stringify(value)
      } else {
        dbData[key] = value
      }
    }

    const automation = await db.automation.update({
      where: { id },
      data: dbData,
    })

    return NextResponse.json({
      ...automation,
      triggerConfig: JSON.parse(automation.triggerConfig),
      actions: JSON.parse(automation.actions),
    })
  } catch (error) {
    console.error('Error updating automation:', error)
    return NextResponse.json({ error: 'Failed to update automation' }, { status: 500 })
  }
}

// DELETE /api/automations - Delete automation
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Automation ID is required' }, { status: 400 })
    }

    const existing = await db.automation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    await db.automation.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting automation:', error)
    return NextResponse.json({ error: 'Failed to delete automation' }, { status: 500 })
  }
}
