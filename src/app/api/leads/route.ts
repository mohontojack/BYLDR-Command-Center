import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { FunnelStage, LeadStatus } from '@prisma/client'

// GET /api/leads - List leads with filtering
export async function GET(request: NextRequest) {
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
    const orderBy = sortField[sort] ? { [sortField[sort]]: order } : { createdAt: 'desc' }

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
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      source,
      funnelStage,
      assignedToId,
      createdById,
      tags,
      notes,
      score,
    } = body

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 })
    }

    const lead = await db.lead.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        company: company || null,
        source: source || 'NXL BYLDR',
        funnelStage: funnelStage || 'AWARENESS',
        assignedToId: assignedToId || null,
        createdById: createdById || null,
        tags: tags || '',
        notes: notes || null,
        score: score || 0,
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
        description: `New lead created: ${firstName} ${lastName}${company ? ` from ${company}` : ''}`,
        leadId: lead.id,
        userId: createdById || null,
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
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const existingLead = await db.lead.findUnique({ where: { id } })
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Handle funnel stage changes
    const stageTimestamps: Partial<Record<string, Date | null>> = {}
    const stageChanged =
      updateData.funnelStage && updateData.funnelStage !== existingLead.funnelStage

    if (stageChanged) {
      const stageMap: Record<string, string> = {
        AWARENESS: 'enteredAwarenessAt',
        DISCOVERY: 'enteredDiscoveryAt',
        EVALUATION: 'enteredEvaluationAt',
        ASSESSMENT: 'enteredAssessmentAt',
        PURCHASE: 'enteredPurchaseAt',
        LOYALTY: 'enteredLoyaltyAt',
      }
      const timestampField = stageMap[updateData.funnelStage]
      if (timestampField) {
        stageTimestamps[timestampField] = new Date()
      }
      // Track previous stage
      updateData.previousStage = existingLead.funnelStage
      // Update last engagement
      updateData.lastEngagementAt = new Date()
    }

    // Handle status changes to WON/LOST
    if (updateData.status === 'WON' || updateData.status === 'LOST') {
      updateData.closedAt = new Date()
    }

    const lead = await db.lead.update({
      where: { id },
      data: {
        ...updateData,
        ...stageTimestamps,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    // Create activity for stage change
    if (stageChanged) {
      await db.activity.create({
        data: {
          type: 'STAGE_CHANGED',
          description: `${lead.firstName} ${lead.lastName} moved from ${existingLead.funnelStage} → ${updateData.funnelStage}`,
          leadId: id,
          userId: updateData.updatedById || null,
          metadata: JSON.stringify({ from: existingLead.funnelStage, to: updateData.funnelStage }),
        },
      })

      // Update dayInFunnel when stage changes
      const stageOrder = ['AWARENESS', 'DISCOVERY', 'EVALUATION', 'ASSESSMENT', 'PURCHASE', 'LOYALTY']
      const currentIndex = stageOrder.indexOf(updateData.funnelStage)
      const newDayInFunnel = (currentIndex + 1) * 2 + 1
      if (newDayInFunnel !== existingLead.dayInFunnel) {
        await db.lead.update({
          where: { id },
          data: { dayInFunnel: newDayInFunnel },
        })
      }
    }

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

// DELETE /api/leads - Archive a lead (set status to ARCHIVED)
export async function DELETE(request: NextRequest) {
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
        type: 'LEAD_CREATED',
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
