import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { requireAuth } from '@/lib/auth-server'

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address').max(200),
  role: z.enum(['ADMIN', 'CSO', 'TECH_LEAD', 'CONTRACTOR']).optional(),
  phone: z.string().max(30).optional().nullable(),
  avatar: z.string().max(500).optional().nullable(),
})

const updateUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(200).optional(),
  role: z.enum(['ADMIN', 'CSO', 'TECH_LEAD', 'CONTRACTOR']).optional(),
  phone: z.string().max(30).optional().nullable(),
  avatar: z.string().max(500).optional().nullable(),
  active: z.boolean().optional(),
})

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

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

// POST /api/users - Create user (auth required, ADMIN/CSO only)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  // Only ADMIN and CSO can create users
  if (auth.role !== 'ADMIN' && auth.role !== 'CSO') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { name, email, role, phone, avatar } = parsed.data

    // Check for existing user
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role: role || 'CONTRACTOR',
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

// PUT /api/users - Update user (auth required)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { id, ...updateData } = parsed.data

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
