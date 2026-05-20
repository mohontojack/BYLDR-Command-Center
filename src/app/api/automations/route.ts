import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TriggerType } from '@prisma/client'

// GET /api/automations - List automations
export async function GET(request: NextRequest) {
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
  try {
    const body = await request.json()
    const { name, description, enabled, triggerType, triggerConfig, actions } = body

    if (!name || !triggerType || !actions) {
      return NextResponse.json(
        { error: 'Name, triggerType, and actions are required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json({ error: 'Actions must be a non-empty array' }, { status: 400 })
    }

    const automation = await db.automation.create({
      data: {
        name,
        description: description || null,
        enabled: enabled !== false,
        triggerType,
        triggerConfig: JSON.stringify(triggerConfig || {}),
        actions: JSON.stringify(actions),
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
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Automation ID is required' }, { status: 400 })
    }

    const existing = await db.automation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    // Stringify JSON fields if they're objects
    if (updateData.triggerConfig && typeof updateData.triggerConfig === 'object') {
      updateData.triggerConfig = JSON.stringify(updateData.triggerConfig)
    }
    if (updateData.actions && typeof updateData.actions === 'object') {
      updateData.actions = JSON.stringify(updateData.actions)
    }

    const automation = await db.automation.update({
      where: { id },
      data: updateData,
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
