# Cloudflare Workers Deployment Guide

This guide explains how to deploy the AI Meeting Digest backend to Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **Database**: Set up a PostgreSQL database (Neon, Supabase, or Cloudflare D1)

## Setup Steps

### 1. Install Dependencies

```bash
cd apps/backend
npm install
```

### 2. Configure Wrangler

Login to Cloudflare:
```bash
wrangler login
```

### 3. Set Environment Variables

Set the required secrets using Wrangler:

```bash
# OpenRouter API Key for AI processing
wrangler secret put OPENROUTER_API_KEY

# Database connection string
wrangler secret put DATABASE_URL

# Better Auth secret key
wrangler secret put BETTER_AUTH_SECRET

# CORS origins (comma-separated)
wrangler secret put CORS_ORIGINS
```

### 4. Update wrangler.toml

Edit `wrangler.toml` to match your project:

```toml
name = "your-project-name"
main = "dist/worker.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[build]
command = "npm run build:worker"

[vars]
NODE_ENV = "production"
```

### 5. Build and Deploy

```bash
# Build for Cloudflare Workers
npm run build:worker

# Deploy to Cloudflare Workers
npm run deploy
```

### 6. Test Deployment

```bash
# Test locally with Wrangler
npm run dev:worker
```

## Architecture Changes for Cloudflare Workers

### Separated Routes
- **Health Check**: `src/routers/health.ts`
- **Meetings**: `src/routers/meetings.ts`
- **Action Items**: `src/routers/action-items.ts`
- **Comments**: `src/routers/comments.ts`
- **Tags**: `src/routers/tags.ts`
- **User**: `src/routers/user.ts`
- **Digest**: `src/routers/digest.ts`
- **Workspaces**: `src/routers/workspaces.ts`
- **Analytics**: `src/routers/analytics.ts`

### Entry Points
- **Node.js**: `src/index.ts` (for local development)
- **Cloudflare Workers**: `src/worker.ts` (for production deployment)

### Key Differences

1. **Environment Variables**: Uses `Bun?.env` fallback for Cloudflare Workers
2. **CORS Configuration**: More flexible origin handling for Workers
3. **File Structure**: Modular router organization for better maintainability
4. **SSE Support**: Separated into `src/routes/sse.ts` for reusability

## Database Considerations

### Option 1: External PostgreSQL (Recommended)
- Use Neon, Supabase, or any PostgreSQL provider
- Set `DATABASE_URL` secret with connection string
- Prisma works seamlessly with external databases

### Option 2: Cloudflare D1 (SQLite)
- Uncomment D1 configuration in `wrangler.toml`
- Modify Prisma schema for SQLite compatibility
- Use Cloudflare's managed SQLite database

## File Storage

For file uploads, consider:
- **Cloudflare R2**: Object storage compatible with S3
- **External providers**: AWS S3, Google Cloud Storage
- Update `src/lib/meeting-service.ts` accordingly

## Monitoring and Logs

- View logs: `wrangler tail`
- Monitor performance in Cloudflare Dashboard
- Set up alerts for errors and performance issues

## Limitations

1. **Request Timeout**: 30 seconds for HTTP requests
2. **Memory**: 128MB limit
3. **CPU Time**: 50ms for free tier, 30s for paid
4. **File Size**: Consider streaming for large files

## Troubleshooting

### Common Issues

1. **Module Resolution**: Ensure all imports use relative paths
2. **Environment Variables**: Use Wrangler secrets, not .env files
3. **Database Connections**: Use connection pooling for better performance
4. **CORS**: Configure origins properly for your frontend domain

### Debug Commands

```bash
# Check configuration
wrangler whoami

# Validate wrangler.toml
wrangler validate

# View deployment logs
wrangler tail your-project-name
```

## Production Checklist

- [ ] Set all required secrets
- [ ] Configure custom domain
- [ ] Set up database with connection pooling
- [ ] Configure CORS for production domains
- [ ] Test all API endpoints
- [ ] Monitor performance and errors
- [ ] Set up backup strategy for database
