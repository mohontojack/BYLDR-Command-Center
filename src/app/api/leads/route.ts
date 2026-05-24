import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { FunnelStage, LeadStatus } from '@prisma/client'
import { requireAuth } from '@/lib/auth-server'

const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  source: z.string().max(50).optional(),
  funnelStage: z.enum(['AWARENESS','DISCOVERY','EVALUATION','ASSESSMENT','PURCHASE','LOYALTY']).optional(),
  assignedToId: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
  tags: z.string().max(500).optional(),
  notes: z.string().max(2000).optional().nullable(),
  score: z.number().int().min(0).max(100).optional(),
})

const updateLeadSchema = z.object({
  id: z.string().min(1, 'Lead ID is required'),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  source: z.string().max(50).optional(),
  funnelStage: z.enum(['AWARENESS','DISCOVERY','EVALUATION','ASSESSMENT','PURCHASE','LOYALTY']).optional(),
  status: z.enum(['ACTIVE','WON','LOST','ARCHIVED']).optional(),
  score: z.number().int().min(0).max(100).optional(),
  tags: z.string().max(500).optional(),
  notes: z.string().max(2000).optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
  dayInFunnel: z.number().int().min(1).max(14).optional(),
  updatedById: z.string().optional(),
})

// GET /api/leads - List leads with filtering
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage') as FunnelStage | null
    const status = searchParams.get('status') as LeadStatus | null
    const assignedTo = searchParams.get('assignedTo')
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (stage) where.funnelStage = stage
    if (status) where.status = status
    if (assignedTo) where.assignedToId = assignedTo
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ]
    }

    // Map sort field to Prisma field
    const sortField: Record<string, string> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      score: 'score',
      dayInFunnel: 'dayInFunnel',
      firstName: 'firstName',
      lastName: 'lastName',
      company: 'company',
    }
    const sortKey = sortField[sort] || 'createdAt'
    const orderDir = order === 'asc' ? 'asc' : 'desc'
    const orderBy = { [sortKey]: orderDir } as const

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true, activities: true, notifications: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.lead.count({ where }),
    ])

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()

    const parsed = createLeadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }
    const data = parsed.data

    const lead = await db.lead.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        company: data.company ?? null,
        source: data.source || 'NXL BYLDR',
        funnelStage: data.funnelStage || 'AWARENESS',
        assignedToId: data.assignedToId ?? null,
        createdById: data.createdById ?? null,
        tags: data.tags || '',
        notes: data.notes ?? null,
        score: data.score ?? 0,
        enteredAwarenessAt: new Date(),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    // Create activity for lead creation
    await db.activity.create({
      data: {
        type: 'LEAD_CREATED',
        description: `New lead created: ${data.firstName} ${data.lastName}${data.company ? ` from ${data.company}` : ''}`,
        leadId: lead.id,
        userId: data.createdById ?? null,
      },
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

// PUT /api/leads - Update a lead
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()

    const parsed = updateLeadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }
    const { id, ...updateData } = parsed.data

    const existingLead = await db.lead.findUnique({ where: { id } })
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Handle funnel stage changes
    const newStage = updateData.funnelStage || null
    const stageChanged = newStage && newStage !== existingLead.funnelStage

    // Whitelist safe update fields to prevent Prisma errors from unknown fields
    const safeFields: Record<string, unknown> = {}
    const allowedFields = ['firstName','lastName','email','phone','company','source','funnelStage','status','score','tags','notes','assignedToId','createdById','dayInFunnel']
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        safeFields[key] = updateData[key]
      }
    }

    const stageTimestamps: Partial<Record<string, Date | null>> = {}
    if (stageChanged) {
      const stageMap: Record<string, string> = {
        AWARENESS: 'enteredAwarenessAt',
        DISCOVERY: 'enteredDiscoveryAt',
        EVALUATION: 'enteredEvaluationAt',
        ASSESSMENT: 'enteredAssessmentAt',
        PURCHASE: 'enteredPurchaseAt',
        LOYALTY: 'enteredLoyaltyAt',
      }
      const timestampField = stageMap[newStage!]
      if (timestampField) {
        stageTimestamps[timestampField] = new Date()
      }
      // Track previous stage
      safeFields.previousStage = existingLead.funnelStage
      // Update last engagement
      safeFields.lastEngagementAt = new Date()
    }

    // Handle status changes to WON/LOST
    if (safeFields.status === 'WON' || safeFields.status === 'LOST') {
      safeFields.closedAt = new Date()
    }

    // Perform updates within a transaction for data consistency
    const lead = await db.$transaction(async (tx) => {
      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          ...safeFields,
          ...stageTimestamps,
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      })

      // Create activity for stage change
      if (stageChanged) {
        await tx.activity.create({
          data: {
            type: 'STAGE_CHANGED',
            description: `${updatedLead.firstName} ${updatedLead.lastName} moved from ${existingLead.funnelStage} → ${newStage}`,
            leadId: id,
            userId: updateData.updatedById || null,
            metadata: JSON.stringify({ from: existingLead.funnelStage, to: newStage }),
          },
        })

        // Update dayInFunnel when stage changes
        const stageOrder = ['AWARENESS', 'DISCOVERY', 'EVALUATION', 'ASSESSMENT', 'PURCHASE', 'LOYALTY']
        const currentIndex = stageOrder.indexOf(newStage)
        const newDayInFunnel = (currentIndex + 1) * 2 + 1
        if (newDayInFunnel !== existingLead.dayInFunnel) {
          await tx.lead.update({
            where: { id },
            data: { dayInFunnel: newDayInFunnel },
          })
        }
      }

      return updatedLead
    })

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

// DELETE /api/leads - Archive a lead (set status to ARCHIVED)
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const existingLead = await db.lead.findUnique({ where: { id } })
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const lead = await db.lead.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        closedAt: new Date(),
      },
    })

    await db.activity.create({
      data: {
        type: 'NOTE_ADDED',
        description: `${lead.firstName} ${lead.lastName} has been archived.`,
        leadId: id,
      },
    })

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Error archiving lead:', error)
    return NextResponse.json({ error: 'Failed to archive lead' }, { status: 500 })
  }
}
