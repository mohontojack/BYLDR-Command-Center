import { db } from '../src/lib/db'

const NOW = new Date()
const DAY = 24 * 60 * 60 * 1000

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * DAY)
}

function daysFromNow(n: number): Date {
  return new Date(NOW.getTime() + n * DAY)
}

async function seed() {
  console.log('🌱 Starting seed...')

  // Clean existing data
  await db.notification.deleteMany()
  await db.activity.deleteMany()
  await db.task.deleteMany()
  await db.lead.deleteMany()
  await db.automation.deleteMany()
  await db.user.deleteMany()

  // ========== USERS ==========
  const sal = await db.user.create({
    data: {
      name: 'Sal',
      email: 'sal@vsual.com',
      password: 'sal2024',
      role: 'CSO',
      phone: '+1 (555) 100-2001',
      active: true,
      avatar: '',
    },
  })
  console.log(`✅ Created user: ${sal.name} (${sal.role})`)

  const geo = await db.user.create({
    data: {
      name: 'Geo',
      email: 'geo@vsual.com',
      password: 'geo2024',
      role: 'TECH_LEAD',
      phone: '+1 (555) 100-2002',
      active: true,
      avatar: '',
    },
  })
  console.log(`✅ Created user: ${geo.name} (${geo.role})`)

  // ========== LEADS ==========
  const leads = [
    // AWARENESS stage leads
    {
      firstName: 'Marcus',
      lastName: 'Rivera',
      email: 'marcus@techvault.io',
      phone: '+1 (555) 301-0001',
      company: 'TechVault Solutions',
      source: 'NXL BYLDR',
      funnelStage: 'AWARENESS' as const,
      status: 'ACTIVE' as const,
      dayInFunnel: 2,
      score: 15,
      tags: 'saas,tech',
      assignedToId: sal.id,
      createdById: sal.id,
      enteredAwarenessAt: daysAgo(2),
      lastEngagementAt: daysAgo(1),
      nextActionDate: daysFromNow(1),
      nextActionType: 'email',
      createdAt: daysAgo(2),
    },
    {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya@greenscape.co',
      phone: '+1 (555) 301-0002',
      company: 'GreenScape Landscaping',
      source: 'CA BYLDRS',
      funnelStage: 'AWARENESS' as const,
      status: 'ACTIVE' as const,
      dayInFunnel: 1,
      score: 8,
      tags: 'landscaping,local',
      assignedToId: sal.id,
      createdById: sal.id,
      enteredAwarenessAt: daysAgo(1),
      lastEngagementAt: daysAgo(0.5),
      nextActionDate: daysFromNow(2),
      nextActionType: 'sms',
      createdAt: daysAgo(1),
    },

    // DISCOVERY stage leads
    {
      firstName: 'James',
      lastName: 'Chen',
      email: 'james@novahomes.com',
      phone: '+1 (555) 302-0001',
      company: 'Nova Homes Realty',
      source: 'BYLDRS GUARDIAN',
      funnelStage: 'DISCOVERY' as const,
      status: 'ACTIVE' as const,
      dayInFunnel: 4,
      score: 32,
      tags: 'real-estate,high-value',
      assignedToId: sal.id,
      createdById: sal.id,
      enteredAwarenessAt: daysAgo(5),
      enteredDiscoveryAt: daysAgo(3),
      lastEngagementAt: daysAgo(1),
      lastContactAt: daysAgo(1),
      nextActionDate: daysFromNow(0),
      nextActionType: 'call',
      createdAt: daysAgo(5),
    },
    {
      firstName: 'Sophia',
      lastName: 'Martinez',
      email: 'sophia@blenderbeauty.com',
      phone: '+1 (555) 302-0002',
      company: 'Blender Beauty Co',
      source: 'REFERRAL',
      funnelStage: 'DISCOVERY' as const,
      status: 'ACTIVE' as const,
      dayInFunnel: 3,
      score: 28,
      tags: 'beauty,ecommerce',
      assignedToId: geo.id,
      createdById: sal.id,
      enteredAwarenessAt: daysAgo(4),
      enteredDiscoveryAt: daysAgo(2),
      lastEngagementAt: daysAgo(0.5),
      lastContactAt: daysAgo(1),
      nextActionDate: daysFromNow(1),
      nextActionType: 'email',
      createdAt: daysAgo(4),
    },

    // EVALUATION stage leads
    {
      firstName: 'David',
      lastName: 'Okonkwo',
      email: 'david@fitforge.app',
      phone: '+1 (555) 303-0001',
      company: 'FitForge App',
      source: 'NXL BYLDR',
      funnelStage: 'EVALUATION' as const,
      status: 'ACTIVE' as const,
      dayInFunnel: 7,
      score: 55,
      tags: 'fitness,app,high-value',
      assignedToId: sal.id,
      createdById: sal.id,
      enteredAwarenessAt: daysAgo(9),
      enteredDiscoveryAt: daysAgo(7),
      enteredEvaluationAt: daysAgo(4),
      lastEngagementAt: daysAgo(0.5),
      lastContactAt: daysAgo(1),
      nextActionDate: daysFromNow(0),
      nextActionType: 'call',
      notes: 'Very interested in the full digital package. Asked about pricing on last call.',
      createdAt: daysAgo(9),
    },
    {
      firstName: 'Rachel',
      lastName: 'Kim',
      email: 'rachel@urbanbite.com',
      phone: '+1 (555) 303-0002',
      company: 'UrbanBite Catering',
      source: 'CA BYLDRS',
      funnelStage: 'EVALUATION' as const,
      status: 'ACTIVE' as const,
      dayInFunnel: 6,
      score: 48,
      tags: 'food,local,restaurant',
      assignedToId: geo.id,
      createdById: sal.id,
      enteredAwarenessAt: daysAgo(8),
      enteredDiscoveryAt: daysAgo(6),
      enteredEvaluationAt: daysAgo(3),
      lastEngagementAt: daysAgo(1),
      lastContactAt: daysAgo(2),
      nextActionDate: daysFromNow(1),
      nextActionType: 'email',
      createdAt: daysAgo(8),
    },

    // ASSESSMENT stage leads
    {
      firstName: 'Elena',
      lastName: 'Vasquez',
      email: 'elena@velvetroofing.com',
      phone: '+1 (555) 304-0001',
      company: 'Velvet Roofing Co',
      source: 'BYLDRS GUARDIAN',
      funnelStage: 'ASSESSMENT' as const,
      status: 'ACTIVE' as const,
      dayInFunnel: 9,
      score: 72,
      tags: 'roofing,construction,high-value',
      assignedToId: sal.id,
      createdById: sal.id,
      enteredAwarenessAt: daysAgo(12),
      enteredDiscoveryAt: daysAgo(10),
      enteredEvaluationAt: daysAgo(8),
      enteredAssessmentAt: daysAgo(5),
      lastEngagementAt: daysAgo(0.5),
      lastContactAt: daysAgo(1),
      nextActionDate: daysFromNow(0),
      nextActionType: 'call',
      notes: 'Needs proposal by end of week. Budget approved.',
      createdAt: daysAgo(12),
    },
    {
      firstName: 'Tom',
      lastName: 'Hargreaves',
      email: 'tom@hargreaveslaw.com',
      phone: '+1 (555) 304-0002',
      company: 'Hargreaves Law Firm',
      source: 'REFERRAL',
      funnelStage: 'ASSESSMENT' as const,
      status: 'ACTIVE' as const,
      dayInFunnel: 10,
      score: 65,
      tags: 'legal,professional-services',
      assignedToId: sal.id,
      createdById: sal.id,
      enteredAwarenessAt: daysAgo(13),
      enteredDiscoveryAt: daysAgo(11),
      enteredEvaluationAt: daysAgo(9),
      enteredAssessmentAt: daysAgo(6),
      lastEngagementAt: daysAgo(1),
      lastContactAt: daysAgo(2),
      nextActionDate: daysFromNow(0),
      nextActionType: 'email',
      createdAt: daysAgo(13),
    },

    // PURCHASE stage leads (some WON)
    {
      firstName: 'Amara',
      lastName: 'Johnson',
      email: 'amara@luxescents.com',
      phone: '+1 (555) 305-0001',
      company: 'LuxeScents Candle Co',
      source: 'NXL BYLDR',
      funnelStage: 'PURCHASE' as const,
      status: 'WON' as const,
      dayInFunnel: 12,
      score: 95,
      tags: 'ecommerce,candles,won',
      assignedToId: sal.id,
      createdById: sal.id,
      enteredAwarenessAt: daysAgo(16),
      enteredDiscoveryAt: daysAgo(14),
      enteredEvaluationAt: daysAgo(12),
      enteredAssessmentAt: daysAgo(10),
      enteredPurchaseAt: daysAgo(5),
      closedAt: daysAgo(5),
      lastEngagementAt: daysAgo(3),
      lastContactAt: daysAgo(4),
      notes: 'Signed contract for $12K/month retainer. Onboarding scheduled.',
      createdAt: daysAgo(16),
    },
    {
      firstName: 'Carlos',
      lastName: 'Mendez',
      email: 'carlos@precisionauto.com',
      phone: '+1 (555) 305-0002',
      company: 'Precision Auto Detailing',
      source: 'CA BYLDRS',
      funnelStage: 'PURCHASE' as const,
      status: 'WON' as const,
      dayInFunnel: 11,
      score: 90,
      tags: 'auto,local,won',
      assignedToId: geo.id,
      createdById: sal.id,
      enteredAwarenessAt: daysAgo(14),
      enteredDiscoveryAt: daysAgo(12),
      enteredEvaluationAt: daysAgo(10),
      enteredAssessmentAt: daysAgo(8),
      enteredPurchaseAt: daysAgo(3),
      closedAt: daysAgo(3),
      lastEngagementAt: daysAgo(2),
      lastContactAt: daysAgo(3),
      notes: 'Signed! Full branding + social media package.',
      createdAt: daysAgo(14),
    },

    // LOYALTY stage leads (WON, ongoing clients)
    {
      firstName: 'Olivia',
      lastName: 'Turner',
      email: 'olivia@suncoastpt.com',
      phone: '+1 (555) 306-0001',
      company: 'Suncoast Physical Therapy',
      source: 'BYLDRS GUARDIAN',
      funnelStage: 'LOYALTY' as const,
      status: 'WON' as const,
      dayInFunnel: 14,
      score: 100,
      tags: 'healthcare,loyal,retainer',
      assignedToId: sal.id,
      createdById: sal.id,
      enteredAwarenessAt: daysAgo(21),
      enteredDiscoveryAt: daysAgo(19),
      enteredEvaluationAt: daysAgo(17),
      enteredAssessmentAt: daysAgo(15),
      enteredPurchaseAt: daysAgo(12),
      enteredLoyaltyAt: daysAgo(8),
      closedAt: daysAgo(12),
      lastEngagementAt: daysAgo(1),
      lastContactAt: daysAgo(2),
      notes: 'Month 3 of retainer. Renewing next month. Great client.',
      createdAt: daysAgo(21),
    },

    // LOST leads
    {
      firstName: 'Nathan',
      lastName: 'Brooks',
      email: 'nathan@cloudninehost.com',
      phone: '+1 (555) 307-0001',
      company: 'CloudNine Hosting',
      source: 'NXL BYLDR',
      funnelStage: 'EVALUATION' as const,
      status: 'LOST' as const,
      dayInFunnel: 6,
      score: 20,
      tags: 'tech,lost,budget',
      previousStage: 'EVALUATION' as const,
      assignedToId: geo.id,
      createdById: sal.id,
      enteredAwarenessAt: daysAgo(10),
      enteredDiscoveryAt: daysAgo(8),
      enteredEvaluationAt: daysAgo(5),
      closedAt: daysAgo(2),
      lastEngagementAt: daysAgo(4),
      notes: 'Went with a cheaper competitor. Budget was the deciding factor.',
      createdAt: daysAgo(10),
    },
    {
      firstName: 'Karen',
      lastName: 'Whitfield',
      email: 'karen@purelyyou.shop',
      phone: '+1 (555) 307-0002',
      company: 'Purely You Skincare',
      source: 'CA BYLDRS',
      funnelStage: 'DISCOVERY' as const,
      status: 'LOST' as const,
      dayInFunnel: 3,
      score: 12,
      tags: 'beauty,lost,no-response',
      previousStage: 'DISCOVERY' as const,
      assignedToId: sal.id,
      createdById: sal.id,
      enteredAwarenessAt: daysAgo(8),
      enteredDiscoveryAt: daysAgo(6),
      closedAt: daysAgo(3),
      lastEngagementAt: daysAgo(5),
      notes: 'Stopped responding after 2 emails. Marked as lost.',
      createdAt: daysAgo(8),
    },
  ]

  for (const leadData of leads) {
    await db.lead.create({ data: leadData })
  }
  console.log(`✅ Created ${leads.length} leads`)

  // ========== TASKS ==========
  const tasks = [
    // Tasks for Sal
    {
      title: 'Follow up with James Chen - Nova Homes',
      description: 'Call James to discuss the real estate digital marketing proposal. He showed high interest in our case studies.',
      status: 'PENDING' as const,
      priority: 'HIGH' as const,
      type: 'call',
      assignedToId: sal.id,
      createdById: sal.id,
      leadId: leads[2].id, // James Chen (Discovery)
      dueDate: daysFromNow(0),
      createdAt: daysAgo(1),
    },
    {
      title: 'Send proposal to Elena Vasquez - Velvet Roofing',
      description: 'Prepare and send the full proposal document. Budget has been approved on their end.',
      status: 'IN_PROGRESS' as const,
      priority: 'URGENT' as const,
      type: 'email',
      assignedToId: sal.id,
      createdById: sal.id,
      leadId: leads[6].id, // Elena Vasquez (Assessment)
      dueDate: daysFromNow(0),
      createdAt: daysAgo(1),
    },
    {
      title: 'Discovery call with David Okonkwo',
      description: 'David from FitForge is ready for a deep dive on the full digital package. Have pricing ready.',
      status: 'COMPLETED' as const,
      priority: 'HIGH' as const,
      type: 'call',
      assignedToId: sal.id,
      createdById: sal.id,
      leadId: leads[4].id, // David Okonkwo (Evaluation)
      completedAt: daysAgo(1),
      dueDate: daysAgo(1),
      createdAt: daysAgo(3),
    },
    {
      title: 'Onboard LuxeScents - account setup',
      description: 'Set up LuxeScents accounts across all platforms. Kickoff meeting scheduled for tomorrow.',
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      type: 'admin',
      assignedToId: sal.id,
      createdById: sal.id,
      leadId: leads[8].id, // Amara - LuxeScents (Won)
      dueDate: daysFromNow(1),
      createdAt: daysAgo(4),
    },
    {
      title: 'Review monthly report for Suncoast PT',
      description: 'Prepare the month 3 performance report. Client meeting on Friday.',
      status: 'PENDING' as const,
      priority: 'MEDIUM' as const,
      type: 'admin',
      assignedToId: sal.id,
      createdById: sal.id,
      leadId: leads[10].id, // Olivia - Suncoast PT (Loyalty)
      dueDate: daysFromNow(2),
      createdAt: daysAgo(2),
    },
    {
      title: 'Send follow-up email to Tom Hargreaves',
      description: 'Tom from Hargreaves Law needs the updated proposal with the SEO add-on pricing.',
      status: 'PENDING' as const,
      priority: 'MEDIUM' as const,
      type: 'email',
      assignedToId: sal.id,
      createdById: sal.id,
      leadId: leads[7].id, // Tom Hargreaves (Assessment)
      dueDate: daysFromNow(0),
      createdAt: daysAgo(1),
    },
    {
      title: 'Prepare NXL BYLDR campaign assets',
      description: 'Design new ad creatives for the upcoming NXL BYLDR campaign push.',
      status: 'PENDING' as const,
      priority: 'MEDIUM' as const,
      type: 'admin',
      assignedToId: sal.id,
      createdById: sal.id,
      dueDate: daysFromNow(3),
      createdAt: daysAgo(2),
    },
    {
      title: 'Send welcome package to Precision Auto',
      description: 'Welcome kit with branded materials for the new client onboarding.',
      status: 'PENDING' as const,
      priority: 'LOW' as const,
      type: 'admin',
      assignedToId: sal.id,
      createdById: sal.id,
      leadId: leads[9].id, // Carlos - Precision Auto (Won)
      dueDate: daysFromNow(5),
      createdAt: daysAgo(3),
    },
    {
      title: 'Strategy session with Geo - tech stack review',
      description: 'Review current automation tools and discuss upgrades for Q2.',
      status: 'PENDING' as const,
      priority: 'MEDIUM' as const,
      type: 'follow_up',
      assignedToId: sal.id,
      createdById: sal.id,
      dueDate: daysFromNow(4),
      createdAt: daysAgo(1),
    },
    {
      title: 'Update CRM pipeline for Q2 planning',
      description: 'Clean up lead statuses, update funnel stages, and prepare quarterly report.',
      status: 'IN_PROGRESS' as const,
      priority: 'LOW' as const,
      type: 'admin',
      assignedToId: sal.id,
      createdById: sal.id,
      dueDate: daysFromNow(7),
      createdAt: daysAgo(3),
    },
    {
      title: 'Call Marcus Rivera - initial intro',
      description: 'Reach out to Marcus for an intro call about TechVault Solutions marketing needs.',
      status: 'PENDING' as const,
      priority: 'MEDIUM' as const,
      type: 'call',
      assignedToId: sal.id,
      createdById: sal.id,
      leadId: leads[0].id, // Marcus Rivera (Awareness)
      dueDate: daysFromNow(2),
      createdAt: daysAgo(1),
    },

    // Tasks for Geo
    {
      title: 'Set up automation workflows for new funnel',
      description: 'Configure email sequences, triggers, and auto-assignments for the 14-day funnel system.',
      status: 'IN_PROGRESS' as const,
      priority: 'URGENT' as const,
      type: 'automation',
      assignedToId: geo.id,
      createdById: sal.id,
      dueDate: daysFromNow(1),
      createdAt: daysAgo(3),
    },
    {
      title: 'Research competitor analysis for FitForge',
      description: 'Pull competitor data and create a comparison deck for the FitForge proposal.',
      status: 'COMPLETED' as const,
      priority: 'HIGH' as const,
      type: 'research',
      assignedToId: geo.id,
      createdById: sal.id,
      leadId: leads[4].id, // David Okonkwo (Evaluation)
      completedAt: daysAgo(2),
      dueDate: daysAgo(2),
      createdAt: daysAgo(5),
    },
    {
      title: 'Fix email template rendering on mobile',
      description: 'Discovery email template has broken layout on iOS Mail. Needs urgent fix.',
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      type: 'automation',
      assignedToId: geo.id,
      createdById: geo.id,
      dueDate: daysFromNow(0),
      createdAt: daysAgo(2),
    },
    {
      title: 'Set up Precision Auto social accounts',
      description: 'Create and brand all social media profiles for Precision Auto Detailing.',
      status: 'PENDING' as const,
      priority: 'MEDIUM' as const,
      type: 'admin',
      assignedToId: geo.id,
      createdById: sal.id,
      leadId: leads[9].id, // Carlos - Precision Auto (Won)
      dueDate: daysFromNow(2),
      createdAt: daysAgo(3),
    },
    {
      title: 'Follow up with Sophia Martinez - Blender Beauty',
      description: 'Send the portfolio link and schedule a discovery call for next week.',
      status: 'PENDING' as const,
      priority: 'MEDIUM' as const,
      type: 'email',
      assignedToId: geo.id,
      createdById: sal.id,
      leadId: leads[3].id, // Sophia Martinez (Discovery)
      dueDate: daysFromNow(1),
      createdAt: daysAgo(2),
    },
    {
      title: 'Update funnel tracking dashboard',
      description: 'Add new conversion rate widgets and fix the funnel visualization bug.',
      status: 'PENDING' as const,
      priority: 'MEDIUM' as const,
      type: 'automation',
      assignedToId: geo.id,
      createdById: geo.id,
      dueDate: daysFromNow(3),
      createdAt: daysAgo(2),
    },
    {
      title: 'Analyze UrbanBite campaign metrics',
      description: 'Pull the latest ad performance data and prepare insights for the evaluation call.',
      status: 'PENDING' as const,
      priority: 'MEDIUM' as const,
      type: 'research',
      assignedToId: geo.id,
      createdById: sal.id,
      leadId: leads[5].id, // Rachel Kim (Evaluation)
      dueDate: daysFromNow(1),
      createdAt: daysAgo(1),
    },
    {
      title: 'Set up SMS reply webhook',
      description: 'Configure the webhook handler for SMS replies from leads in the funnel.',
      status: 'COMPLETED' as const,
      priority: 'HIGH' as const,
      type: 'automation',
      assignedToId: geo.id,
      createdById: geo.id,
      completedAt: daysAgo(1),
      dueDate: daysAgo(1),
      createdAt: daysAgo(4),
    },
    {
      title: 'Create onboarding checklist template',
      description: 'Build a reusable onboarding checklist for new client setup process.',
      status: 'PENDING' as const,
      priority: 'LOW' as const,
      type: 'admin',
      assignedToId: geo.id,
      createdById: sal.id,
      dueDate: daysFromNow(5),
      createdAt: daysAgo(2),
    },
    {
      title: 'Review Priya Sharma lead score',
      description: 'GreenScape lead came in through CA BYLDRS - check if score should be higher.',
      status: 'PENDING' as const,
      priority: 'LOW' as const,
      type: 'follow_up',
      assignedToId: geo.id,
      createdById: sal.id,
      leadId: leads[1].id, // Priya Sharma (Awareness)
      dueDate: daysFromNow(3),
      createdAt: daysAgo(1),
    },
    {
      title: 'Re-engage lost lead - Nathan Brooks',
      description: 'Send a casual check-in email to see if CloudNine Hosting situation has changed.',
      status: 'CANCELLED' as const,
      priority: 'LOW' as const,
      type: 'email',
      assignedToId: geo.id,
      createdById: sal.id,
      leadId: leads[11].id, // Nathan Brooks (Lost)
      dueDate: daysAgo(1),
      createdAt: daysAgo(5),
    },
  ]

  for (const taskData of tasks) {
    await db.task.create({ data: taskData })
  }
  console.log(`✅ Created ${tasks.length} tasks`)

  // ========== ACTIVITIES ==========
  const activities = [
    // Lead creation activities
    { type: 'LEAD_CREATED' as const, description: 'New lead created: Marcus Rivera from TechVault Solutions', leadId: leads[0].id, userId: sal.id, createdAt: daysAgo(2) },
    { type: 'LEAD_CREATED' as const, description: 'New lead created: Priya Sharma from GreenScape Landscaping', leadId: leads[1].id, userId: sal.id, createdAt: daysAgo(1) },
    { type: 'LEAD_CREATED' as const, description: 'New lead created: James Chen from Nova Homes Realty', leadId: leads[2].id, userId: sal.id, createdAt: daysAgo(5) },
    { type: 'LEAD_CREATED' as const, description: 'New lead created: Sophia Martinez from Blender Beauty Co', leadId: leads[3].id, userId: sal.id, createdAt: daysAgo(4) },
    { type: 'LEAD_CREATED' as const, description: 'New lead created: David Okonkwo from FitForge App', leadId: leads[4].id, userId: sal.id, createdAt: daysAgo(9) },
    { type: 'LEAD_CREATED' as const, description: 'New lead created: Elena Vasquez from Velvet Roofing Co', leadId: leads[6].id, userId: sal.id, createdAt: daysAgo(12) },
    { type: 'LEAD_CREATED' as const, description: 'New lead created: Amara Johnson from LuxeScents Candle Co', leadId: leads[8].id, userId: sal.id, createdAt: daysAgo(16) },
    { type: 'LEAD_CREATED' as const, description: 'New lead created: Olivia Turner from Suncoast Physical Therapy', leadId: leads[10].id, userId: sal.id, createdAt: daysAgo(21) },

    // Stage change activities
    { type: 'STAGE_CHANGED' as const, description: 'James Chen moved from Awareness → Discovery', leadId: leads[2].id, userId: sal.id, metadata: '{"from":"AWARENESS","to":"DISCOVERY"}', createdAt: daysAgo(3) },
    { type: 'STAGE_CHANGED' as const, description: 'Sophia Martinez moved from Awareness → Discovery', leadId: leads[3].id, userId: sal.id, metadata: '{"from":"AWARENESS","to":"DISCOVERY"}', createdAt: daysAgo(2) },
    { type: 'STAGE_CHANGED' as const, description: 'David Okonkwo moved from Discovery → Evaluation', leadId: leads[4].id, userId: sal.id, metadata: '{"from":"DISCOVERY","to":"EVALUATION"}', createdAt: daysAgo(4) },
    { type: 'STAGE_CHANGED' as const, description: 'Elena Vasquez moved from Evaluation → Assessment', leadId: leads[6].id, userId: sal.id, metadata: '{"from":"EVALUATION","to":"ASSESSMENT"}', createdAt: daysAgo(5) },
    { type: 'STAGE_CHANGED' as const, description: 'Amara Johnson moved from Assessment → Purchase', leadId: leads[8].id, userId: sal.id, metadata: '{"from":"ASSESSMENT","to":"PURCHASE"}', createdAt: daysAgo(5) },
    { type: 'STAGE_CHANGED' as const, description: 'Carlos Mendez moved from Assessment → Purchase', leadId: leads[9].id, userId: sal.id, metadata: '{"from":"ASSESSMENT","to":"PURCHASE"}', createdAt: daysAgo(3) },
    { type: 'STAGE_CHANGED' as const, description: 'Olivia Turner moved from Purchase → Loyalty', leadId: leads[10].id, userId: sal.id, metadata: '{"from":"PURCHASE","to":"LOYALTY"}', createdAt: daysAgo(8) },

    // Email activities
    { type: 'EMAIL_SENT' as const, description: 'Sent discovery email to James Chen', leadId: leads[2].id, userId: sal.id, createdAt: daysAgo(4) },
    { type: 'EMAIL_OPENED' as const, description: 'James Chen opened the discovery email', leadId: leads[2].id, userId: sal.id, createdAt: daysAgo(3.5) },
    { type: 'EMAIL_SENT' as const, description: 'Sent case study deck to David Okonkwo', leadId: leads[4].id, userId: sal.id, createdAt: daysAgo(3) },
    { type: 'EMAIL_REPLIED' as const, description: 'David Okonkwo replied asking about pricing', leadId: leads[4].id, userId: sal.id, createdAt: daysAgo(2.5) },
    { type: 'EMAIL_SENT' as const, description: 'Sent follow-up to Sophia Martinez with portfolio link', leadId: leads[3].id, userId: geo.id, createdAt: daysAgo(1) },
    { type: 'EMAIL_OPENED' as const, description: 'Sophia Martinez opened portfolio email (2x)', leadId: leads[3].id, userId: geo.id, createdAt: daysAgo(0.5) },

    // Call activities
    { type: 'CALL_MADE' as const, description: 'Call made to David Okonkwo - 12 min', leadId: leads[4].id, userId: sal.id, metadata: '{"duration":"12min"}', createdAt: daysAgo(1) },
    { type: 'CALL_COMPLETED' as const, description: 'Discovery call with Elena Vasquez - 25 min', leadId: leads[6].id, userId: sal.id, metadata: '{"duration":"25min"}', createdAt: daysAgo(3) },
    { type: 'CALL_COMPLETED' as const, description: 'Closing call with Amara Johnson - 30 min', leadId: leads[8].id, userId: sal.id, metadata: '{"duration":"30min","result":"signed"}', createdAt: daysAgo(5) },

    // SMS activities
    { type: 'SMS_SENT' as const, description: 'SMS sent to Priya Sharma - welcome message', leadId: leads[1].id, userId: sal.id, createdAt: daysAgo(0.5) },
    { type: 'SMS_REPLIED' as const, description: 'Priya Sharma replied "Thanks! Will review tonight"', leadId: leads[1].id, userId: sal.id, createdAt: daysAgo(0.3) },

    // Link clicked
    { type: 'LINK_CLICKED' as const, description: 'James Chen clicked pricing page link', leadId: leads[2].id, userId: sal.id, metadata: '{"url":"/pricing"}', createdAt: daysAgo(3) },
    { type: 'LINK_CLICKED' as const, description: 'David Okonkwo clicked case study link', leadId: leads[4].id, userId: sal.id, metadata: '{"url":"/case-studies/real-estate"}', createdAt: daysAgo(2) },

    // Video viewed
    { type: 'VIDEO_VIEWED' as const, description: 'Elena Vasquez watched the agency intro video (100%)', leadId: leads[6].id, userId: sal.id, metadata: '{"video":"agency-intro","watchPercent":100}', createdAt: daysAgo(2) },

    // Task activities
    { type: 'TASK_CREATED' as const, description: 'Task created: Send proposal to Elena Vasquez', leadId: leads[6].id, userId: sal.id, taskId: tasks[1].id, createdAt: daysAgo(1) },
    { type: 'TASK_COMPLETED' as const, description: 'Task completed: Discovery call with David Okonkwo', leadId: leads[4].id, userId: sal.id, taskId: tasks[2].id, createdAt: daysAgo(1) },
    { type: 'TASK_ASSIGNED' as const, description: 'Task assigned to Geo: Fix email template rendering', userId: geo.id, taskId: tasks[12].id, createdAt: daysAgo(2) },
    { type: 'TASK_COMPLETED' as const, description: 'Task completed: Set up SMS reply webhook', userId: geo.id, taskId: tasks[17].id, createdAt: daysAgo(1) },

    // Funnel day activities
    { type: 'FUNNEL_DAY_ADVANCED' as const, description: 'Marcus Rivera advanced to Day 2 in funnel', leadId: leads[0].id, userId: sal.id, metadata: '{"day":2}', createdAt: daysAgo(1) },
    { type: 'FUNNEL_DAY_ADVANCED' as const, description: 'Elena Vasquez advanced to Day 9 in funnel', leadId: leads[6].id, userId: sal.id, metadata: '{"day":9}', createdAt: daysAgo(1) },

    // Automation triggered
    { type: 'AUTOMATION_TRIGGERED' as const, description: 'Automation fired: Day 3 email for Sophia Martinez', leadId: leads[3].id, userId: sal.id, metadata: '{"automation":"Day 3 → Send discovery email"}', createdAt: daysAgo(1) },
    { type: 'AUTOMATION_TRIGGERED' as const, description: 'Automation fired: Lead score update for David Okonkwo (55 → 55)', leadId: leads[4].id, userId: sal.id, metadata: '{"automation":"Score update on email reply"}', createdAt: daysAgo(2.5) },

    // Notes
    { type: 'NOTE_ADDED' as const, description: 'Added note: Elena needs proposal by end of week. Budget approved.', leadId: leads[6].id, userId: sal.id, createdAt: daysAgo(2) },
    { type: 'NOTE_ADDED' as const, description: 'Added note: LuxeScents signed contract for $12K/month retainer.', leadId: leads[8].id, userId: sal.id, createdAt: daysAgo(5) },
  ]

  for (const act of activities) {
    await db.activity.create({ data: act })
  }
  console.log(`✅ Created ${activities.length} activities`)

  // ========== NOTIFICATIONS ==========
  const notifications = [
    {
      type: 'LEAD_ASSIGNED' as const,
      title: 'New lead assigned to you',
      message: 'Marcus Rivera from TechVault Solutions has been assigned to you.',
      userId: sal.id,
      leadId: leads[0].id,
      read: false,
      createdAt: daysAgo(2),
    },
    {
      type: 'STAGE_CHANGE' as const,
      title: 'Lead stage updated',
      message: 'Amara Johnson (LuxeScents) has moved to Purchase stage. 🎉',
      userId: sal.id,
      leadId: leads[8].id,
      read: false,
      createdAt: daysAgo(5),
    },
    {
      type: 'TASK_DUE' as const,
      title: 'Task due today',
      message: 'Follow up with James Chen - Nova Homes is due today.',
      userId: sal.id,
      leadId: leads[2].id,
      read: false,
      createdAt: daysAgo(0.5),
    },
    {
      type: 'TASK_OVERDUE' as const,
      title: 'Overdue task',
      message: 'Send proposal to Elena Vasquez is overdue!',
      userId: sal.id,
      leadId: leads[6].id,
      read: false,
      createdAt: daysAgo(0.1),
    },
    {
      type: 'LEAD_ENGAGEMENT' as const,
      title: 'Lead opened your email',
      message: 'David Okonkwo opened your case study deck email.',
      userId: sal.id,
      leadId: leads[4].id,
      read: true,
      readAt: daysAgo(2.5),
      createdAt: daysAgo(3),
    },
    {
      type: 'AUTOMATION_ALERT' as const,
      title: 'Automation triggered',
      message: 'Day 3 email automation fired for Sophia Martinez.',
      userId: geo.id,
      leadId: leads[3].id,
      read: true,
      readAt: daysAgo(0.8),
      createdAt: daysAgo(1),
    },
    {
      type: 'STAGE_CHANGE' as const,
      title: 'Lead moved to Loyalty',
      message: 'Olivia Turner (Suncoast PT) has entered the Loyalty stage!',
      userId: sal.id,
      leadId: leads[10].id,
      read: true,
      readAt: daysAgo(7),
      createdAt: daysAgo(8),
    },
    {
      type: 'LEAD_ENGAGEMENT' as const,
      title: 'Link clicked by lead',
      message: 'James Chen clicked the pricing page link in your email.',
      userId: sal.id,
      leadId: leads[2].id,
      read: false,
      createdAt: daysAgo(3),
    },
    {
      type: 'TASK_DUE' as const,
      title: 'Task due today',
      message: 'Fix email template rendering on mobile is due today.',
      userId: geo.id,
      read: false,
      createdAt: daysAgo(0.3),
    },
    {
      type: 'DAILY_SUMMARY' as const,
      title: 'Daily Summary',
      message: 'You have 5 pending tasks, 3 leads needing follow-up, and 2 new leads today.',
      userId: sal.id,
      read: false,
      createdAt: daysAgo(0.2),
    },
    {
      type: 'SYSTEM' as const,
      title: 'System update',
      message: 'Funnel automation system has been updated with new triggers.',
      userId: geo.id,
      read: true,
      readAt: daysAgo(1.5),
      createdAt: daysAgo(2),
    },
    {
      type: 'LEAD_ASSIGNED' as const,
      title: 'New lead assigned to you',
      message: 'Sophia Martinez from Blender Beauty Co has been assigned to you.',
      userId: geo.id,
      leadId: leads[3].id,
      read: false,
      createdAt: daysAgo(4),
    },
  ]

  for (const notif of notifications) {
    await db.notification.create({ data: notif })
  }
  console.log(`✅ Created ${notifications.length} notifications`)

  // ========== AUTOMATIONS ==========
  const automations = [
    {
      name: 'Lead Clicks Email → Assign Task to Sal',
      description: 'When a lead clicks a link in an email, automatically create a follow-up task assigned to Sal.',
      enabled: true,
      triggerType: 'LINK_CLICKED' as const,
      triggerConfig: '{}',
      actions: JSON.stringify([
        { type: 'assign_task', config: { assigneeId: sal.id, title: 'Follow up - lead clicked email link', type: 'follow_up', priority: 'HIGH' } },
      ]),
      createdAt: daysAgo(15),
    },
    {
      name: 'Day 3 → Send Discovery Email',
      description: 'On day 3 of the funnel, automatically send the discovery email sequence to the lead.',
      enabled: true,
      triggerType: 'DAYS_IN_FUNNEL' as const,
      triggerConfig: '{"daysInFunnel": 3}',
      actions: JSON.stringify([
        { type: 'send_email', config: { template: 'discovery-email', delayHours: 0 } },
        { type: 'create_activity', config: { type: 'EMAIL_SENT', description: 'Automated: Day 3 discovery email sent' } },
      ]),
      createdAt: daysAgo(15),
    },
    {
      name: 'Stage Change to Purchase → Notify Sal',
      description: 'When any lead moves to the Purchase stage, send a notification to Sal immediately.',
      enabled: true,
      triggerType: 'STAGE_CHANGED' as const,
      triggerConfig: '{"stage": "PURCHASE"}',
      actions: JSON.stringify([
        { type: 'send_notification', config: { userId: sal.id, type: 'STAGE_CHANGE', title: 'Lead moved to Purchase! 🎉', messageTemplate: '{leadName} has moved to the Purchase stage.' } },
      ]),
      createdAt: daysAgo(15),
    },
    {
      name: 'Lead Inactive 3 Days → Create Reminder',
      description: 'If a lead has had no engagement for 3 days, create a reminder task for the assigned user.',
      enabled: true,
      triggerType: 'LEAD_INACTIVE' as const,
      triggerConfig: '{"inactivityDays": 3}',
      actions: JSON.stringify([
        { type: 'create_task', config: { title: 'Re-engage: {leadName} has been inactive for 3 days', type: 'follow_up', priority: 'MEDIUM', dueDaysFromNow: 1 } },
        { type: 'send_notification', config: { type: 'LEAD_ENGAGEMENT', title: 'Lead inactive alert', messageTemplate: '{leadName} has not engaged in 3 days.' } },
      ]),
      createdAt: daysAgo(10),
    },
    {
      name: 'Email Reply → Boost Lead Score',
      description: 'When a lead replies to an email, increase their score by 10 points.',
      enabled: true,
      triggerType: 'EMAIL_REPLIED' as const,
      triggerConfig: '{}',
      actions: JSON.stringify([
        { type: 'update_lead', config: { scoreIncrement: 10 } },
        { type: 'create_activity', config: { type: 'AUTOMATION_TRIGGERED', description: 'Score boosted +10 for email reply' } },
      ]),
      createdAt: daysAgo(12),
    },
    {
      name: 'Task Overdue → Escalate Notification',
      description: 'When a task is overdue by 1 day, send an escalation notification to the assignee.',
      enabled: false,
      triggerType: 'TASK_OVERDUE' as const,
      triggerConfig: '{"overdueDays": 1}',
      actions: JSON.stringify([
        { type: 'send_notification', config: { type: 'TASK_OVERDUE', title: 'Task overdue!', messageTemplate: 'The task "{taskTitle}" is now overdue.' } },
      ]),
      createdAt: daysAgo(8),
    },
  ]

  for (const auto of automations) {
    await db.automation.create({ data: auto })
  }
  console.log(`✅ Created ${automations.length} automations`)

  console.log('\n🎉 Seed complete!')
  console.log(`   Users: 2`)
  console.log(`   Leads: ${leads.length}`)
  console.log(`   Tasks: ${tasks.length}`)
  console.log(`   Activities: ${activities.length}`)
  console.log(`   Notifications: ${notifications.length}`)
  console.log(`   Automations: ${automations.length}`)
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => {
    db.$disconnect()
  })
