/**
 * Server-Side Authentication Utilities
 *
 * Provides session validation for API routes and middleware.
 * Uses a simple token-based approach compatible with the localStorage client store.
 */

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Token format: base64(JSON.stringify({ userId, email, exp }))
const TOKEN_PREFIX = 'bldr_'
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

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
 * Create a session token from user data.
 * Used after successful login.
 */
export function createSessionToken(user: { id: string; email: string }): string {
  const payload = {
    userId: user.id,
    email: user.email,
    exp: Date.now() + TOKEN_EXPIRY_MS,
  }
  return TOKEN_PREFIX + Buffer.from(JSON.stringify(payload)).toString('base64')
}

/**
 * Validate a session token and return the user data if valid.
 * Returns null if invalid or expired.
 */
export function validateSessionToken(token?: string): { userId: string; email: string } | null {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null

  try {
    const payload = JSON.parse(Buffer.from(token.slice(TOKEN_PREFIX.length), 'base64').toString())
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

  // Fall back to cookie
  if (!token) {
    const cookieStore = await cookies()
    token = cookieStore.get('bldr_session')?.value
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
 * Returns a 401 response if not authenticated, or null if authenticated.
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
