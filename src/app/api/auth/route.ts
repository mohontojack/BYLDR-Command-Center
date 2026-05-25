import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash, compare } from 'bcryptjs'
import { createSessionToken, authResponse } from '@/lib/auth-server'
import { z } from 'zod'

// Input validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ─── In-memory rate limiter ─────────────────────────────────
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 10

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = loginAttempts.get(ip)
  if (!record) return false
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.delete(ip)
    return false
  }
  return record.count >= MAX_ATTEMPTS
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const record = loginAttempts.get(ip)
  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now })
  } else {
    record.count++
  }
}

function clearFailedAttempts(ip: string): void {
  loginAttempts.delete(ip)
}

// POST /api/auth - Login
export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate input with Zod
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        _count: {
          select: {
            assignedLeads: true,
            assignedTasks: true,
          },
        },
      },
    })

    if (!user) {
      recordFailedAttempt(ip)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if password is plaintext (legacy) or hashed — support both during migration
    const isPlainText = !user.password.startsWith('$2')
    const isValid = isPlainText
      ? user.password === password
      : await compare(password, user.password)

    // Auto-migrate: if valid plaintext password, hash it for next time
    if (isValid && isPlainText) {
      const hashedPw = await hash(password, 12)
      await db.user.update({
        where: { id: user.id },
        data: { password: hashedPw },
      })
    }

    if (!isValid) {
      recordFailedAttempt(ip)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Contact your administrator.' },
        { status: 403 }
      )
    }

    // Clear rate limit on successful login
    clearFailedAttempts(ip)

    // Return user data (exclude password) + session token
    const { password: _pw, ...safeUser } = user

    // Create session token
    const token = createSessionToken(user)

    return authResponse(
      {
        user: safeUser,
        token,
        message: 'Login successful',
      },
      token
    )
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}

// DELETE /api/auth - Logout
export async function DELETE() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const response = NextResponse.json({ success: true, message: 'Logged out' })
  response.cookies.set('bldr_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
