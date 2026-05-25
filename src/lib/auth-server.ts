/**
 * Server-Side Authentication Utilities
 *
 * Provides session validation for API routes.
 * Uses HMAC-signed tokens to prevent forgery.
 */

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createHmac, randomBytes } from 'crypto'

const TOKEN_PREFIX = 'bldr_'
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// HMAC secret — in production this should come from env var
const HMAC_SECRET = process.env.SESSION_SECRET || 'bldr-command-center-hmac-key-change-in-production'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  avatar?: string | null
  phone?: string | null
  active: boolean
}

/**
 * Create an HMAC-signed session token.
 * Format: bldr_<base64 payload>.<hex signature>
 */
export function createSessionToken(user: { id: string; email: string }): string {
  const payload = {
    userId: user.id,
    email: user.email,
    exp: Date.now() + TOKEN_EXPIRY_MS,
    // Random nonce prevents replay even if same payload
    nce: randomBytes(16).toString('hex'),
  }
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', HMAC_SECRET)
    .update(payloadB64)
    .digest('hex')
  return `${TOKEN_PREFIX}${payloadB64}.${sig}`
}

/**
 * Validate an HMAC-signed session token.
 * Returns null if invalid, expired, or tampered.
 */
export function validateSessionToken(token?: string): { userId: string; email: string } | null {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null

  try {
    const raw = token.slice(TOKEN_PREFIX.length)
    const dotIdx = raw.lastIndexOf('.')
    if (dotIdx === -1) return null

    const payloadB64 = raw.slice(0, dotIdx)
    const sig = raw.slice(dotIdx + 1)

    // Verify HMAC signature
    const expectedSig = createHmac('sha256', HMAC_SECRET)
      .update(payloadB64)
      .digest('hex')
    if (sig !== expectedSig) return null

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
    if (!payload.userId || !payload.email) return null
    if (payload.exp && payload.exp < Date.now()) return null
    return { userId: payload.userId, email: payload.email }
  } catch {
    return null
  }
}

/**
 * Get the current authenticated user from the request.
 * Checks both Authorization header and cookie for the session token.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser(request: Request): Promise<SessionUser | null> {
  // Check Authorization header first
  let token = request.headers.get('authorization')?.replace('Bearer ', '')

  // Fall back to cookie (lazy import to avoid Turbopack graph issues)
  if (!token) {
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      token = cookieStore.get('bldr_session')?.value
    } catch {
      // cookies() not available, continue without cookie fallback
    }
  }

  const session = validateSessionToken(token)
  if (!session) return null

  // Fetch user from database to ensure still valid and active
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      phone: true,
      active: true,
    },
  })

  if (!user || !user.active) return null

  return user
}

/**
 * Middleware helper to require authentication.
 * Returns a 401 response if not authenticated, or the user if authenticated.
 */
export async function requireAuth(request: Request): Promise<SessionUser | NextResponse> {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in.' },
      { status: 401 }
    )
  }
  return user
}

/**
 * Create a success response with session token cookie.
 */
export function authResponse(data: Record<string, unknown>, token: string) {
  const response = NextResponse.json(data)
  response.cookies.set('bldr_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })
  return response
}

/**
 * Create a logout response that clears the session cookie.
 */
export function logoutResponse() {
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
