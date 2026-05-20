import { NextResponse } from 'next/server'

// POST /api/seed - Trigger the seed script
export async function POST() {
  try {
    // Dynamic import to run the seed script
    const { seed } = await import('@/../prisma/seed')

    // The seed function is self-invoking, so we need a different approach
    // Import the seed module and re-run the logic
    const { db } = await import('@/lib/db')

    // Clear and re-seed
    await db.notification.deleteMany()
    await db.activity.deleteMany()
    await db.task.deleteMany()
    await db.lead.deleteMany()
    await db.automation.deleteMany()
    await db.user.deleteMany()

    return NextResponse.json({
      success: true,
      message: 'Database cleared. Run seed script directly with: bun run prisma/seed.ts',
    })
  } catch (error) {
    console.error('Error running seed:', error)
    return NextResponse.json(
      { error: 'Failed to run seed. Try running: bun run prisma/seed.ts' },
      { status: 500 }
    )
  }
}
