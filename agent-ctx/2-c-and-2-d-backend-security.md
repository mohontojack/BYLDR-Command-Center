# Task 2-c-and-2-d — Backend Security Developer

## Task
Add authentication checks (`requireAuth`) and Zod input validation to ALL API routes.

## Completed
All 10 API route files updated:

### Authentication (`requireAuth`)
- `/api/dashboard` — GET ✅
- `/api/leads` — GET, POST, PUT, DELETE ✅
- `/api/leads/[id]` — GET ✅
- `/api/tasks` — GET, POST, PUT ✅
- `/api/tasks/[id]` — GET ✅
- `/api/activities` — GET, POST ✅
- `/api/notifications` — GET, PUT, POST ✅
- `/api/automations` — GET, POST, PUT, DELETE ✅
- `/api/users` — GET ✅ (POST/POST kept as-is per requirements)
- `/api/seed` — POST with ADMIN role check ✅

### Zod Validation Schemas Added
- **tasks/route.ts**: `createTaskSchema`, `updateTaskSchema`
- **activities/route.ts**: `createActivitySchema` (18 ActivityType enum values)
- **notifications/route.ts**: `createNotificationSchema` (8 NotificationType enum values)
- **automations/route.ts**: `createAutomationSchema`, `updateAutomationSchema` (11 TriggerType enum values)
- **leads/route.ts**: Already had schemas — kept unchanged

### Pattern Used
```typescript
const auth = await requireAuth(request)
if (auth instanceof NextResponse) return auth  // 401
```

### Lint
- `bun run lint` → 0 errors
