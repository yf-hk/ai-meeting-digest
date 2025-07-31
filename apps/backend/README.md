# AI Meeting Digest Backend

A modern, type-safe backend API built with Hono.js, ORPC, and TypeScript for Node.js deployment.

## 🏗️ Architecture

### Separated Route Structure

The backend routes have been organized into separate files for better maintainability:

```
src/routers/
├── index.ts          # Main router aggregation
├── health.ts         # Health check endpoints
├── meetings.ts       # Meeting management
├── action-items.ts   # Action item operations
├── comments.ts       # Comment system
├── tags.ts           # Tag management
├── user.ts           # User profile
├── digest.ts         # Public digest sharing
├── workspaces.ts     # Workspace management
└── analytics.ts      # Analytics and insights
```

### Entry Point

- **Node.js**: `src/index.ts` (includes SSE routes)

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
bun install

# Start database
bun run db:start

# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:push

# Start development server
bun run dev
```

## 📦 Available Scripts

### Development
- `bun run dev` - Start development server with hot reload

### Building
- `bun run build` - Build for production

### Database
- `bun run db:start` - Start PostgreSQL with Docker
- `bun run db:generate` - Generate Prisma client
- `bun run db:push` - Push schema to database
- `bun run db:migrate` - Run database migrations
- `bun run db:studio` - Open Prisma Studio

### Testing
- `bun run test` - Run tests
- `bun run test:ui` - Run tests with UI

### Deployment
- `bun run start` - Start production server

## 🌐 API Routes

### Health Check
- `GET /` - Basic health check
- `GET /rpc/healthCheck` - ORPC health check

### Authentication
- `POST /api/auth/**` - Better Auth endpoints

### Meetings (via ORPC `/rpc/meetings.*`)
- `create` - Create new meeting
- `list` - Get user's meetings
- `getById` - Get meeting by ID
- `uploadFile` - Upload meeting file
- `update` - Update meeting
- `process` - Process meeting with AI
- `deleteFile` - Delete meeting file
- `delete` - Delete meeting

### Action Items (via ORPC `/rpc/actionItems.*`)
- `update` - Update action item status

### Comments (via ORPC `/rpc/comments.*`)
- `add` - Add comment to meeting

### Tags (via ORPC `/rpc/tags.*`)
- `create` - Create new tag
- `list` - Get workspace tags
- `update` - Update tag
- `delete` - Delete tag
- `addToMeeting` - Add tag to meeting
- `removeFromMeeting` - Remove tag from meeting

### User (via ORPC `/rpc/user.*`)
- `profile` - Get current user profile

### Digest (via ORPC `/rpc/digest.*`)
- `getByPublicId` - Get public digest (no auth required)

### Workspaces (via ORPC `/rpc/workspaces.*`)
- `create` - Create workspace
- `list` - Get user's workspaces
- `getById` - Get workspace by ID
- `update` - Update workspace
- `delete` - Delete workspace
- `addMember` - Add workspace member
- `removeMember` - Remove workspace member

### Analytics (via ORPC `/rpc/analytics.*`)
- `overview` - Get meeting analytics

### Server-Sent Events
- `GET /api/meetings/:meetingId/process-stream` - Stream meeting processing

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_meeting_digest"

# AI Service
OPENROUTER_API_KEY="your-openrouter-api-key"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"

# CORS
CORS_ORIGINS="http://localhost:3001,https://your-domain.com"
```

### Cloudflare Workers Secrets

```bash
wrangler secret put DATABASE_URL
wrangler secret put OPENROUTER_API_KEY
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put CORS_ORIGINS
```

## 🏗️ Technology Stack

- **Framework**: Hono.js
- **Type Safety**: ORPC (OpenAPI RPC)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **AI**: OpenRouter with Google Gemini
- **Deployment**: Node.js
- **Build Tool**: tsdown (Rolldown)

## 📁 Project Structure

```
apps/backend/
├── src/
│   ├── lib/                 # Core libraries
│   │   ├── ai.ts           # AI processing
│   │   ├── auth.ts         # Authentication
│   │   ├── context.ts      # Request context
│   │   ├── meeting-service.ts # Business logic
│   │   └── orpc.ts         # ORPC procedures
│   ├── routers/            # Route definitions
│   │   ├── index.ts        # Main router
│   │   ├── health.ts       # Health checks
│   │   ├── meetings.ts     # Meeting routes
│   │   ├── action-items.ts # Action item routes
│   │   ├── comments.ts     # Comment routes
│   │   ├── tags.ts         # Tag routes
│   │   ├── user.ts         # User routes
│   │   ├── digest.ts       # Digest routes
│   │   ├── workspaces.ts   # Workspace routes
│   │   └── analytics.ts    # Analytics routes
│   └── index.ts            # Main entry point (includes SSE)
└── prisma/                 # Database schema
```

## 🚀 Deployment

### Node.js Production

```bash
# Build
bun run build

# Start production server
bun run start
```

## 🔍 Type Safety

The backend maintains full type safety through:
- **ORPC**: Type-safe RPC with automatic client generation
- **Prisma**: Type-safe database operations
- **Zod**: Runtime type validation
- **TypeScript**: Compile-time type checking

Frontend automatically gets typed API client:
```typescript
import { orpc } from '@/utils/orpc'

// Fully typed API calls
const meetings = await orpc.meetings.list.query()
const meeting = await orpc.meetings.getById.query({ meetingId: 'uuid' })
```

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run tests with UI
bun run test:ui

# Run specific test file
bun run test src/lib/__tests__/ai.test.ts
```

## 📊 Monitoring

- **Development**: Console logs and error handling
- **Production**: Node.js process monitoring
- **Database**: Prisma query logging
- **Performance**: Built-in Hono.js metrics
