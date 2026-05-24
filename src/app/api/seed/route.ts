import { NextResponse } from 'next/server'

// Pre-computed bcrypt hashes (cost factor 12)
const SAL_HASH = '$2b$12$hC1SuTuwtHaCOJ07kOuQVe4H9YYOtfYzLKvHLRIY79B4dhWqCoKHC'
const GEO_HASH = '$2b$12$3hL.DAB78Eu19Rcg9GZXjOxiI48X2h0HKlQoK0SS69eh7ILs6JYYm'

// POST /api/seed - Reset and re-seed the database
export async function POST() {
  try {
    const { db } = await import('@/lib/db')

    // Clear all tables in dependency order
    await db.notification.deleteMany()
    await db.activity.deleteMany()
    await db.task.deleteMany()
    await db.lead.deleteMany()
    await db.automation.deleteMany()
    await db.user.deleteMany()

    // ── Re-seed with fresh data ──

    const NOW = new Date()
    const DAY = 24 * 60 * 60 * 1000
    const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY)
    const daysFromNow = (n: number) => new Date(NOW.getTime() + n * DAY)

    // Users
    const sal = await db.user.create({
      data: {
        name: 'Sal',
        email: 'sal@vsual.com',
        password: SAL_HASH,
        role: 'CSO',
        phone: '+1 (555) 100-2001',
        active: true,
        avatar: '',
      },
    })

    const geo = await db.user.create({
      data: {
        name: 'Geo',
        email: 'geo@vsual.com',
        password: GEO_HASH,
        role: 'TECH_LEAD',
        phone: '+1 (555) 100-2002',
        active: true,
        avatar: '',
      },
    })

    // Leads
    const leadsData = [
      { firstName: 'Marcus', lastName: 'Rivera', email: 'marcus@techvault.io', phone: '+1 (555) 301-0001', company: 'TechVault Solutions', source: 'NXL BYLDR', funnelStage: 'AWARENESS', status: 'ACTIVE', dayInFunnel: 2, score: 15, tags: 'saas,tech', assignedToId: sal.id, createdById: sal.id, enteredAwarenessAt: daysAgo(2), lastEngagementAt: daysAgo(1), nextActionDate: daysFromNow(1), nextActionType: 'email', createdAt: daysAgo(2) },
      { firstName: 'Priya', lastName: 'Sharma', email: 'priya@greenscape.co', phone: '+1 (555) 301-0002', company: 'GreenScape Landscaping', source: 'CA BYLDRS', funnelStage: 'AWARENESS', status: 'ACTIVE', dayInFunnel: 1, score: 8, tags: 'landscaping,local', assignedToId: sal.id, createdById: sal.id, enteredAwarenessAt: daysAgo(1), lastEngagementAt: daysAgo(0.5), nextActionDate: daysFromNow(2), nextActionType: 'sms', createdAt: daysAgo(1) },
      { firstName: 'James', lastName: 'Chen', email: 'james@novahomes.com', phone: '+1 (555) 302-0001', company: 'Nova Homes Realty', source: 'BYLDRS GUARDIAN', funnelStage: 'DISCOVERY', status: 'ACTIVE', dayInFunnel: 4, score: 32, tags: 'real-estate,high-value', assignedToId: sal.id, createdById: sal.id, enteredAwarenessAt: daysAgo(5), enteredDiscoveryAt: daysAgo(3), lastEngagementAt: daysAgo(1), lastContactAt: daysAgo(1), nextActionDate: daysFromNow(0), nextActionType: 'call', createdAt: daysAgo(5) },
      { firstName: 'Sophia', lastName: 'Martinez', email: 'sophia@blenderbeauty.com', phone: '+1 (555) 302-0002', company: 'Blender Beauty Co', source: 'REFERRAL', funnelStage: 'DISCOVERY', status: 'ACTIVE', dayInFunnel: 3, score: 28, tags: 'beauty,ecommerce', assignedToId: geo.id, createdById: sal.id, enteredAwarenessAt: daysAgo(4), enteredDiscoveryAt: daysAgo(2), lastEngagementAt: daysAgo(0.5), lastContactAt: daysAgo(1), nextActionDate: daysFromNow(1), nextActionType: 'email', createdAt: daysAgo(4) },
      { firstName: 'David', lastName: 'Okonkwo', email: 'david@fitforge.app', phone: '+1 (555) 303-0001', company: 'FitForge App', source: 'NXL BYLDR', funnelStage: 'EVALUATION', status: 'ACTIVE', dayInFunnel: 7, score: 55, tags: 'fitness,app,high-value', assignedToId: sal.id, createdById: sal.id, enteredAwarenessAt: daysAgo(9), enteredDiscoveryAt: daysAgo(7), enteredEvaluationAt: daysAgo(4), lastEngagementAt: daysAgo(0.5), lastContactAt: daysAgo(1), nextActionDate: daysFromNow(0), nextActionType: 'call', notes: 'Very interested in the full digital package.', createdAt: daysAgo(9) },
      { firstName: 'Rachel', lastName: 'Kim', email: 'rachel@urbanbite.com', phone: '+1 (555) 303-0002', company: 'UrbanBite Catering', source: 'CA BYLDRS', funnelStage: 'EVALUATION', status: 'ACTIVE', dayInFunnel: 6, score: 48, tags: 'food,local,restaurant', assignedToId: geo.id, createdById: sal.id, enteredAwarenessAt: daysAgo(8), enteredDiscoveryAt: daysAgo(6), enteredEvaluationAt: daysAgo(3), lastEngagementAt: daysAgo(1), lastContactAt: daysAgo(2), nextActionDate: daysFromNow(1), nextActionType: 'email', createdAt: daysAgo(8) },
      { firstName: 'Elena', lastName: 'Vasquez', email: 'elena@velvetroofing.com', phone: '+1 (555) 304-0001', company: 'Velvet Roofing Co', source: 'BYLDRS GUARDIAN', funnelStage: 'ASSESSMENT', status: 'ACTIVE', dayInFunnel: 9, score: 72, tags: 'roofing,construction,high-value', assignedToId: sal.id, createdById: sal.id, enteredAwarenessAt: daysAgo(12), enteredDiscoveryAt: daysAgo(10), enteredEvaluationAt: daysAgo(8), enteredAssessmentAt: daysAgo(5), lastEngagementAt: daysAgo(0.5), lastContactAt: daysAgo(1), nextActionDate: daysFromNow(0), nextActionType: 'call', notes: 'Needs proposal by end of week. Budget approved.', createdAt: daysAgo(12) },
      { firstName: 'Tom', lastName: 'Hargreaves', email: 'tom@hargreaveslaw.com', phone: '+1 (555) 304-0002', company: 'Hargreaves Law Firm', source: 'REFERRAL', funnelStage: 'ASSESSMENT', status: 'ACTIVE', dayInFunnel: 10, score: 65, tags: 'legal,professional-services', assignedToId: sal.id, createdById: sal.id, enteredAwarenessAt: daysAgo(13), enteredDiscoveryAt: daysAgo(11), enteredEvaluationAt: daysAgo(9), enteredAssessmentAt: daysAgo(6), lastEngagementAt: daysAgo(1), lastContactAt: daysAgo(2), nextActionDate: daysFromNow(0), nextActionType: 'email', createdAt: daysAgo(13) },
      { firstName: 'Amara', lastName: 'Johnson', email: 'amara@luxescents.com', phone: '+1 (555) 305-0001', company: 'LuxeScents Candle Co', source: 'NXL BYLDR', funnelStage: 'PURCHASE', status: 'WON', dayInFunnel: 12, score: 95, tags: 'ecommerce,candles,won', assignedToId: sal.id, createdById: sal.id, enteredAwarenessAt: daysAgo(16), enteredDiscoveryAt: daysAgo(14), enteredEvaluationAt: daysAgo(12), enteredAssessmentAt: daysAgo(10), enteredPurchaseAt: daysAgo(5), closedAt: daysAgo(5), lastEngagementAt: daysAgo(3), lastContactAt: daysAgo(4), notes: 'Signed $12K/month retainer.', createdAt: daysAgo(16) },
      { firstName: 'Carlos', lastName: 'Mendez', email: 'carlos@precisionauto.com', phone: '+1 (555) 305-0002', company: 'Precision Auto Detailing', source: 'CA BYLDRS', funnelStage: 'PURCHASE', status: 'WON', dayInFunnel: 11, score: 90, tags: 'auto,local,won', assignedToId: geo.id, createdById: sal.id, enteredAwarenessAt: daysAgo(14), enteredDiscoveryAt: daysAgo(12), enteredEvaluationAt: daysAgo(10), enteredAssessmentAt: daysAgo(8), enteredPurchaseAt: daysAgo(3), closedAt: daysAgo(3), lastEngagementAt: daysAgo(2), lastContactAt: daysAgo(3), notes: 'Full branding + social media package.', createdAt: daysAgo(14) },
      { firstName: 'Olivia', lastName: 'Turner', email: 'olivia@suncoastpt.com', phone: '+1 (555) 306-0001', company: 'Suncoast Physical Therapy', source: 'BYLDRS GUARDIAN', funnelStage: 'LOYALTY', status: 'WON', dayInFunnel: 14, score: 100, tags: 'healthcare,loyal,retainer', assignedToId: sal.id, createdById: sal.id, enteredAwarenessAt: daysAgo(21), enteredDiscoveryAt: daysAgo(19), enteredEvaluationAt: daysAgo(17), enteredAssessmentAt: daysAgo(15), enteredPurchaseAt: daysAgo(12), enteredLoyaltyAt: daysAgo(8), closedAt: daysAgo(12), lastEngagementAt: daysAgo(1), lastContactAt: daysAgo(2), notes: 'Month 3 retainer. Renewing next month.', createdAt: daysAgo(21) },
      { firstName: 'Nathan', lastName: 'Brooks', email: 'nathan@cloudninehost.com', phone: '+1 (555) 307-0001', company: 'CloudNine Hosting', source: 'NXL BYLDR', funnelStage: 'EVALUATION', status: 'LOST', dayInFunnel: 6, score: 20, tags: 'tech,lost,budget', previousStage: 'EVALUATION', assignedToId: geo.id, createdById: sal.id, enteredAwarenessAt: daysAgo(10), enteredDiscoveryAt: daysAgo(8), enteredEvaluationAt: daysAgo(5), closedAt: daysAgo(2), lastEngagementAt: daysAgo(4), notes: 'Went with cheaper competitor.', createdAt: daysAgo(10) },
      { firstName: 'Karen', lastName: 'Whitfield', email: 'karen@purelyyou.shop', phone: '+1 (555) 307-0002', company: 'Purely You Skincare', source: 'CA BYLDRS', funnelStage: 'DISCOVERY', status: 'LOST', dayInFunnel: 3, score: 12, tags: 'beauty,lost,no-response', previousStage: 'DISCOVERY', assignedToId: sal.id, createdById: sal.id, enteredAwarenessAt: daysAgo(8), enteredDiscoveryAt: daysAgo(6), closedAt: daysAgo(3), lastEngagementAt: daysAgo(5), notes: 'Stopped responding.', createdAt: daysAgo(8) },
    ]

    const leads = []
    for (const ld of leadsData) {
      leads.push(await db.lead.create({ data: ld }))
    }

    // Tasks
    const tasksData = [
      { title: 'Follow up with James Chen - Nova Homes', description: 'Call James to discuss the real estate digital marketing proposal.', status: 'PENDING', priority: 'HIGH', type: 'call', assignedToId: sal.id, createdById: sal.id, leadId: leads[2].id, dueDate: daysFromNow(0), createdAt: daysAgo(1) },
      { title: 'Send proposal to Elena Vasquez - Velvet Roofing', description: 'Prepare and send the full proposal document.', status: 'IN_PROGRESS', priority: 'URGENT', type: 'email', assignedToId: sal.id, createdById: sal.id, leadId: leads[6].id, dueDate: daysFromNow(0), createdAt: daysAgo(1) },
      { title: 'Discovery call with David Okonkwo', description: 'Deep dive on the full digital package.', status: 'COMPLETED', priority: 'HIGH', type: 'call', assignedToId: sal.id, createdById: sal.id, leadId: leads[4].id, completedAt: daysAgo(1), dueDate: daysAgo(1), createdAt: daysAgo(3) },
      { title: 'Onboard LuxeScents - account setup', description: 'Set up accounts across all platforms.', status: 'IN_PROGRESS', priority: 'HIGH', type: 'admin', assignedToId: sal.id, createdById: sal.id, leadId: leads[8].id, dueDate: daysFromNow(1), createdAt: daysAgo(4) },
      { title: 'Review monthly report for Suncoast PT', description: 'Prepare month 3 performance report.', status: 'PENDING', priority: 'MEDIUM', type: 'admin', assignedToId: sal.id, createdById: sal.id, leadId: leads[10].id, dueDate: daysFromNow(2), createdAt: daysAgo(2) },
      { title: 'Set up automation workflows for new funnel', description: 'Configure email sequences and triggers.', status: 'IN_PROGRESS', priority: 'URGENT', type: 'automation', assignedToId: geo.id, createdById: sal.id, dueDate: daysFromNow(1), createdAt: daysAgo(3) },
      { title: 'Research competitor analysis for FitForge', description: 'Pull competitor data and create comparison deck.', status: 'COMPLETED', priority: 'HIGH', type: 'research', assignedToId: geo.id, createdById: sal.id, leadId: leads[4].id, completedAt: daysAgo(2), dueDate: daysAgo(2), createdAt: daysAgo(5) },
      { title: 'Fix email template rendering on mobile', description: 'Discovery email template has broken layout on iOS Mail.', status: 'IN_PROGRESS', priority: 'HIGH', type: 'automation', assignedToId: geo.id, createdById: geo.id, dueDate: daysFromNow(0), createdAt: daysAgo(2) },
      { title: 'Analyze UrbanBite campaign metrics', description: 'Pull latest ad performance data.', status: 'PENDING', priority: 'MEDIUM', type: 'research', assignedToId: geo.id, createdById: sal.id, leadId: leads[5].id, dueDate: daysFromNow(1), createdAt: daysAgo(1) },
      { title: 'Strategy session with Geo - tech stack review', description: 'Review current automation tools.', status: 'PENDING', priority: 'MEDIUM', type: 'follow_up', assignedToId: sal.id, createdById: sal.id, dueDate: daysFromNow(4), createdAt: daysAgo(1) },
    ]

    const tasks = []
    for (const td of tasksData) {
      tasks.push(await db.task.create({ data: td }))
    }

    // Activities
    const activitiesData = [
      { type: 'LEAD_CREATED', description: 'New lead created: Marcus Rivera from TechVault Solutions', leadId: leads[0].id, userId: sal.id, createdAt: daysAgo(2) },
      { type: 'LEAD_CREATED', description: 'New lead created: Priya Sharma from GreenScape Landscaping', leadId: leads[1].id, userId: sal.id, createdAt: daysAgo(1) },
      { type: 'LEAD_CREATED', description: 'New lead created: David Okonkwo from FitForge App', leadId: leads[4].id, userId: sal.id, createdAt: daysAgo(9) },
      { type: 'LEAD_CREATED', description: 'New lead created: Amara Johnson from LuxeScents Candle Co', leadId: leads[8].id, userId: sal.id, createdAt: daysAgo(16) },
      { type: 'STAGE_CHANGED', description: 'James Chen moved from Awareness → Discovery', leadId: leads[2].id, userId: sal.id, metadata: '{"from":"AWARENESS","to":"DISCOVERY"}', createdAt: daysAgo(3) },
      { type: 'STAGE_CHANGED', description: 'Elena Vasquez moved from Evaluation → Assessment', leadId: leads[6].id, userId: sal.id, metadata: '{"from":"EVALUATION","to":"ASSESSMENT"}', createdAt: daysAgo(5) },
      { type: 'STAGE_CHANGED', description: 'Amara Johnson moved from Assessment → Purchase', leadId: leads[8].id, userId: sal.id, metadata: '{"from":"ASSESSMENT","to":"PURCHASE"}', createdAt: daysAgo(5) },
      { type: 'STAGE_CHANGED', description: 'Olivia Turner moved from Purchase → Loyalty', leadId: leads[10].id, userId: sal.id, metadata: '{"from":"PURCHASE","to":"LOYALTY"}', createdAt: daysAgo(8) },
      { type: 'EMAIL_SENT', description: 'Sent discovery email to James Chen', leadId: leads[2].id, userId: sal.id, createdAt: daysAgo(4) },
      { type: 'EMAIL_OPENED', description: 'James Chen opened the discovery email', leadId: leads[2].id, userId: sal.id, createdAt: daysAgo(3.5) },
      { type: 'EMAIL_REPLIED', description: 'David Okonkwo replied asking about pricing', leadId: leads[4].id, userId: sal.id, createdAt: daysAgo(2.5) },
      { type: 'CALL_COMPLETED', description: 'Discovery call with Elena Vasquez - 25 min', leadId: leads[6].id, userId: sal.id, metadata: '{"duration":"25min"}', createdAt: daysAgo(3) },
      { type: 'CALL_COMPLETED', description: 'Closing call with Amara Johnson - 30 min', leadId: leads[8].id, userId: sal.id, metadata: '{"duration":"30min","result":"signed"}', createdAt: daysAgo(5) },
      { type: 'SMS_SENT', description: 'SMS sent to Priya Sharma - welcome message', leadId: leads[1].id, userId: sal.id, createdAt: daysAgo(0.5) },
      { type: 'LINK_CLICKED', description: 'James Chen clicked pricing page link', leadId: leads[2].id, userId: sal.id, metadata: '{"url":"/pricing"}', createdAt: daysAgo(3) },
      { type: 'TASK_COMPLETED', description: 'Task completed: Discovery call with David Okonkwo', leadId: leads[4].id, userId: sal.id, createdAt: daysAgo(1) },
      { type: 'TASK_COMPLETED', description: 'Task completed: Set up SMS reply webhook', userId: geo.id, createdAt: daysAgo(1) },
      { type: 'AUTOMATION_TRIGGERED', description: 'Day 3 email automation fired for Sophia Martinez', leadId: leads[3].id, userId: sal.id, createdAt: daysAgo(1) },
      { type: 'NOTE_ADDED', description: 'Elena needs proposal by end of week. Budget approved.', leadId: leads[6].id, userId: sal.id, createdAt: daysAgo(2) },
      { type: 'NOTE_ADDED', description: 'LuxeScents signed contract for $12K/month retainer.', leadId: leads[8].id, userId: sal.id, createdAt: daysAgo(5) },
    ]

    for (const ad of activitiesData) {
      await db.activity.create({ data: ad })
    }

    // Notifications
    const notificationsData = [
      { type: 'LEAD_ASSIGNED', title: 'New lead assigned to you', message: 'Marcus Rivera from TechVault Solutions has been assigned to you.', userId: sal.id, leadId: leads[0].id, read: false, createdAt: daysAgo(2) },
      { type: 'STAGE_CHANGE', title: 'Lead stage updated', message: 'Amara Johnson (LuxeScents) has moved to Purchase stage.', userId: sal.id, leadId: leads[8].id, read: false, createdAt: daysAgo(5) },
      { type: 'TASK_DUE', title: 'Task due today', message: 'Follow up with James Chen is due today.', userId: sal.id, leadId: leads[2].id, read: false, createdAt: daysAgo(0.5) },
      { type: 'TASK_OVERDUE', title: 'Overdue task', message: 'Send proposal to Elena Vasquez is overdue!', userId: sal.id, leadId: leads[6].id, read: false, createdAt: daysAgo(0.1) },
      { type: 'LEAD_ENGAGEMENT', title: 'Lead opened your email', message: 'David Okonkwo opened your case study deck email.', userId: sal.id, leadId: leads[4].id, read: true, readAt: daysAgo(2.5), createdAt: daysAgo(3) },
      { type: 'AUTOMATION_ALERT', title: 'Automation triggered', message: 'Day 3 email automation fired for Sophia Martinez.', userId: geo.id, leadId: leads[3].id, read: true, readAt: daysAgo(0.8), createdAt: daysAgo(1) },
      { type: 'DAILY_SUMMARY', title: 'Daily Summary', message: 'You have 5 pending tasks, 3 leads needing follow-up, and 2 new leads today.', userId: sal.id, read: false, createdAt: daysAgo(0.2) },
      { type: 'SYSTEM', title: 'System update', message: 'Funnel automation system has been updated with new triggers.', userId: geo.id, read: true, readAt: daysAgo(1.5), createdAt: daysAgo(2) },
    ]

    for (const nd of notificationsData) {
      await db.notification.create({ data: nd })
    }

    // Automations
    const automationsData = [
      { name: 'Lead Clicks Email → Assign Task', description: 'When a lead clicks a link, create a follow-up task.', enabled: true, triggerType: 'LINK_CLICKED', triggerConfig: '{}', actions: JSON.stringify([{ type: 'assign_task', config: { assigneeId: sal.id, title: 'Follow up - lead clicked email link', priority: 'HIGH' } }]) },
      { name: 'Day 3 → Send Discovery Email', description: 'On day 3, send the discovery email sequence.', enabled: true, triggerType: 'DAYS_IN_FUNNEL', triggerConfig: '{"daysInFunnel":3}', actions: JSON.stringify([{ type: 'send_email', config: { template: 'discovery-email' } }]) },
      { name: 'Stage → Purchase → Notify Sal', description: 'When any lead moves to Purchase, notify Sal.', enabled: true, triggerType: 'STAGE_CHANGED', triggerConfig: '{"stage":"PURCHASE"}', actions: JSON.stringify([{ type: 'send_notification', config: { userId: sal.id, title: 'Lead moved to Purchase!' } }]) },
      { name: 'Lead Inactive 3 Days → Reminder', description: 'If a lead has no engagement for 3 days, create a reminder.', enabled: true, triggerType: 'LEAD_INACTIVE', triggerConfig: '{"inactivityDays":3}', actions: JSON.stringify([{ type: 'create_task', config: { title: 'Re-engage inactive lead', priority: 'MEDIUM' } }]) },
      { name: 'Email Reply → Boost Score +10', description: 'When a lead replies to an email, increase their score by 10.', enabled: true, triggerType: 'EMAIL_REPLIED', triggerConfig: '{}', actions: JSON.stringify([{ type: 'update_lead', config: { scoreIncrement: 10 } }]) },
      { name: 'Task Overdue → Escalation', description: 'When a task is overdue, send escalation notification.', enabled: false, triggerType: 'TASK_OVERDUE', triggerConfig: '{"overdueDays":1}', actions: JSON.stringify([{ type: 'send_notification', config: { title: 'Task overdue!' } }]) },
    ]

    for (const ad of automationsData) {
      await db.automation.create({ data: ad })
    }

    return NextResponse.json({
      success: true,
      message: `Database re-seeded successfully: ${2} users, ${leads.length} leads, ${tasks.length} tasks, ${activitiesData.length} activities, ${notificationsData.length} notifications, ${automationsData.length} automations`,
    })
  } catch (error) {
    console.error('Error running seed:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
