# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

hitchhikers-ai is an Astro-based web application that generates Hitchhiker's Guide to the Galaxy-style articles using OpenAI's API. The application runs on Cloudflare Pages with server-side rendering, utilizing Cloudflare Workers for API routes and KV storage for caching.

## Development Commands

All commands use `pnpm` as the package manager:

```bash
# Install dependencies
pnpm install

# Start local development server
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Run Astro CLI commands
pnpm astro [command]
```

## Cloudflare Operations

The project is configured for deployment to Cloudflare Pages with Workers integration:

```bash
# Deploy to Cloudflare Pages (from dist/ after build)
pnpm wrangler pages deploy dist --project-name hitchhikers-ai

# Manage KV namespaces
pnpm wrangler kv namespace create TOKEN_USAGE
pnpm wrangler kv namespace create ARTICLES  
pnpm wrangler kv namespace create SEARCHES

# View live logs
pnpm wrangler pages deployment tail

# Manage secrets
pnpm wrangler secret put OPENAI_API_KEY

# Clear caches (uses custom script)
./scripts/clear-cache.sh
```

## Architecture

### Request Flow
1. **Astro SSR**: Handles initial page rendering and routing via `[...path].astro`
2. **API Routes**: Server endpoints in `src/pages/api/` handle dynamic content generation
3. **Rate Limiting**: `RateLimitedOpenAI` class enforces daily token/image limits via KV storage
4. **Caching Layer**: Articles and search results cached in Cloudflare KV namespaces
5. **AI Generation**: OpenAI GPT models generate content with Douglas Adams-style prompts

### Core Components

**Rate-Limited OpenAI Client** (`src/lib/openai.ts`):
- Wraps OpenAI API with daily usage limits (100k tokens, 10 images)
- Tracks usage in `TOKEN_USAGE` KV namespace with 24h TTL
- Handles moderation checks and timeout management

**Article Generation** (`src/lib/getArticle.ts`):
- Creates Guide entries with extensive cross-linking requirements
- Generates accompanying images via DALL-E when under limits
- Caches complete articles in `ARTICLES` KV namespace

**Search System** (`src/lib/getSearchResults.ts`):
- Generates themed search results using GPT
- Results cached in `SEARCHES` KV namespace
- Each result includes properly formatted internal links

### KV Storage Structure

- `TOKEN_USAGE`: Daily usage tracking with date-based keys
- `ARTICLES`: Full article content (markdown with embedded images)
- `SEARCHES`: Search result pages (markdown lists)

## Environment Setup

### Local Development
Copy `.dev.vars.example` to `.dev.vars` and configure:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### Production Secrets
Set via Wrangler CLI:

```bash
pnpm wrangler secret put OPENAI_API_KEY
```

### KV Namespace Bindings
Update `wrangler.jsonc` with your namespace IDs:

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "TOKEN_USAGE",
      "id": "your-token-usage-namespace-id"
    },
    {
      "binding": "ARTICLES", 
      "id": "your-articles-namespace-id"
    },
    {
      "binding": "SEARCHES",
      "id": "your-searches-namespace-id"
    }
  ]
}
```

## Cache Management

### Clearing All Caches
```bash
./scripts/clear-cache.sh
```

This script clears both article and search caches by iterating through all KV keys.

### Manual Cache Operations
```bash
# List cached articles
pnpm wrangler kv key list --binding=ARTICLES

# Get specific article
pnpm wrangler kv key get --binding=ARTICLES "article-path"

# Delete specific cache entry
pnpm wrangler kv key delete --binding=ARTICLES "article-path"
```

## Key Implementation Details

### Prompt Engineering
The system uses specific prompts that enforce:
- Douglas Adams writing style with humor and wit
- Minimum 5-7 cross-links per article using `[Text](/kebab-case-url)` format
- Prohibition of bold/italic formatting in favor of links
- Retro sci-fi aesthetic for generated images

### Rate Limiting Strategy
- Daily limits reset at midnight UTC using date-based KV keys
- Token usage tracked across all OpenAI API calls
- Image generation limited separately with timeout protection
- Graceful degradation with themed error messages

### Performance Optimizations
- Aggressive caching of all generated content
- Image generation runs with 10-second timeout
- KV entries use 24-hour TTL for automatic cleanup
- Cloudflare edge computing for global latency reduction

## Troubleshooting

### Common Issues

**Rate Limit Exceeded**: Check current usage with:
```bash
pnpm wrangler kv key get --binding=TOKEN_USAGE "$(date +%Y-%m-%d)"
```

**Missing Environment Variables**: Verify secrets are set:
```bash
pnpm wrangler secret list
```

**KV Access Issues**: Confirm namespace bindings match `wrangler.jsonc` configuration

**Image Generation Timeouts**: Normal behavior - system degrades gracefully to text-only articles