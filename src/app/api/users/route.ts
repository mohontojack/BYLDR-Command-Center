import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

// GET /api/users - List all users
export async function GET() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedLeads: true,
            assignedTasks: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, phone, avatar } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Check for existing user
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        role: (role as UserRole) || 'CONTRACTOR',
        phone: phone || null,
        avatar: avatar || null,
        active: true,
        // Default password 'changeme' (bcrypt cost 12)
        password: '$2b$12$yZYmZKTpIjIWVKoeF9NzkuDzmPMaIiqFrtYs2qH0Uy50b2EiF28v2',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// PUT /api/users - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If email is being changed, check for uniqueness
    if (updateData.email && updateData.email !== existing.email) {
      const emailExists = await db.user.findUnique({ where: { email: updateData.email } })
      if (emailExists) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
      }
    }

    // Whitelist safe update fields — exclude password and internal fields
    const safeFields: Record<string, unknown> = {}
    const allowedFields = ['name','email','role','phone','avatar','active']
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        safeFields[key] = updateData[key]
      }
    }

    const user = await db.user.update({
      where: { id },
      data: safeFields,
    })

    // Strip password from response
    const { password: _pw, ...safeUser } = user

    return NextResponse.json({ user: safeUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
