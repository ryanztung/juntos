# Juntos — AWS Migration Handoff

## Project Overview

**Juntos** is a serverless travel-planning web app built around an AI chat interface. Users complete an onboarding intake, then chat with a Gemini-powered agent that plans itineraries and searches vectorized traveler reviews. The app supports 1:1 and group chats, file attachments, polls, and shared to-do lists.

**Current stack**: React + Vite (frontend) · Supabase (auth, database, realtime, storage, edge functions) · Gemini 2.5 Flash (LLM) · OpenAI `text-embedding-3-small` (embeddings) · Python CLI for RAG ingestion

---

## Repository Structure

```
juntos/
├── client/                        # React 18 + Vite 6 SPA
│   ├── src/
│   │   ├── App.jsx                # Root: auth/onboarding/chat state machine
│   │   ├── components/
│   │   │   ├── AuthForm.jsx       # Supabase email/password auth UI
│   │   │   ├── Onboarding.jsx     # 9-question user preferences intake
│   │   │   ├── ConversationList.jsx  # Sidebar: 1:1 + group convos, invite management
│   │   │   ├── ChatWindow.jsx     # Main chat UI (polls, todos, file upload, agent)
│   │   │   └── MessageBubble.jsx  # Per-message renderer (markdown, polls, todos)
│   │   └── lib/
│   │       └── supabase.js        # Supabase client init (hardcoded URL + anon key)
│   ├── vite.config.js
│   └── package.json
├── supabase/
│   └── functions/
│       └── agent/
│           └── index.ts           # Deno edge function — AI travel agent (716 lines)
├── rag/                           # Python RAG ingestion pipeline
│   ├── ingest.py                  # CLI: scrape → clean → embed → store
│   ├── scrapers/
│   │   ├── google_places.py       # Google Places API
│   │   ├── reddit.py              # Reddit RSS + listing scraping
│   │   ├── yelp.py
│   │   └── tripadvisor.py
│   └── pipeline/
│       ├── clean.py               # Text normalization
│       ├── embed.py               # OpenAI text-embedding-3-small
│       └── store.py               # Supabase pgvector upsert
└── requirements.txt               # Python deps
```

---

## Current Architecture

### Frontend
- **Framework**: React 18.3 + Vite 6.0, single-page app
- **Auth state**: 4-state machine → `loading → auth → onboarding → chat`
- **Realtime**: Supabase Realtime subscriptions for live message sync across group members
- **Styling**: Inline CSS; color palette `#106C54` (green), `#F3EFE8` (background); Cabin font
- **Build output**: `client/dist/` (static files, deployable to any CDN/S3)
- **Build command**: `npm run build`
- **Dev server**: `npm run dev` → `localhost:5173`

### Backend (Supabase Edge Function)
- **Runtime**: Deno (TypeScript), deployed as Supabase Edge Function
- **Entry**: `supabase/functions/agent/index.ts`
- **Pattern**: Agentic loop (max 5 iterations) — receives user message + history, calls Gemini with tool use, executes tools, loops until no tool calls remain
- **LLM**: Google Gemini 2.5 Flash (`gemini-2.5-flash-preview-04-17`)
- **Tools exposed to LLM**:
  - `create_itinerary(destination, days, preferences?)` — generates structured day-by-day plan
  - `search_reviews(query, city, count?, category?)` — pgvector similarity search via `match_reviews` RPC
- **RAG context**: Proactively fetches reviews for "maui" on each request (city is hardcoded; intended to expand to user's destination)
- **File handling**: Attachments fetched from Supabase Storage, base64-encoded, passed inline to Gemini
- **Auth**: Client sends JWT in request body; server validates against Supabase service role

### Database (Supabase / PostgreSQL + pgvector)
No migration files are tracked in the repo. Schema is inferred from application code:

| Table | Purpose | Notable Columns |
|-------|---------|-----------------|
| `user_profiles` | User preferences from onboarding | `id`, `display_name`, `budget`, `destination`, `trip_style`, `pace_morning`, `pace_evening`, `downtime`, `accommodation`, `dietary` (array), `onboarding_complete` |
| `conversations` | Chat sessions (1:1 and group) | `id`, `user_id`, `title`, `is_group` (bool), `group_name`, `created_at` |
| `messages` | All chat messages | `id`, `conversation_id`, `role` ('user'\|'assistant'), `content`, `is_agent` (bool), `sender_id`, `sender_display_name`, `attachments` (JSONB), `created_at` |
| `group_members` | Group chat membership | `conversation_id`, `user_id`, `display_name` |
| `group_invites` | Pending invitations | `id`, `conversation_id`, `invited_user_id`, `invited_by`, `status` ('pending'\|'accepted'\|'declined'), `inviter_display_name` |
| `reviews` | Scraped + embedded traveler reviews | `id`, `city`, `location_name`, `source`, `content`, `rating` (float), `category`, `embedding` (vector 1536-dim), `metadata` (JSONB), `created_at` |

**RPCs**:
- `create_group_conversation(p_group_name)` → returns new conversation UUID
- `accept_group_invite(p_invite_id)` / `decline_group_invite(p_invite_id)`
- `match_reviews(query_embedding, city_filter, match_count)` → similarity-ranked reviews (pgvector)

**Storage buckets**:
- `chat-attachments` — user-uploaded images and PDFs

### RAG Ingestion Pipeline
- **Language**: Python 3, runs as a local CLI (no server)
- **Command**: `python rag/ingest.py --city <city> --source <google|reddit|yelp|tripadvisor|all>`
- **Flow**: scrape → clean (`clean.py`) → embed via OpenAI (`embed.py`) → upsert to Supabase pgvector (`store.py`)
- **Embedding model**: `text-embedding-3-small` (1536 dimensions)
- **Currently triggered**: manually; no scheduler configured

---

## External Services & API Keys

| Service | Current Use | Environment Variable(s) |
|---------|------------|------------------------|
| Supabase | Auth, DB, Realtime, Storage, Edge Functions host | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, anon key (hardcoded in client) |
| Google Gemini | LLM (travel agent, itinerary generation) | `GEMINI_API_KEY` |
| OpenAI | Text embeddings (RAG ingestion + edge function fallback) | `OPENAI_API_KEY` (also: `OPEN_AI_API_KEY`) |
| Google Places | Review scraping | `GOOGLE_PLACES_API_KEY` |
| Reddit | RSS travel discussion scraping | `REDDIT_USER_AGENT`, `REDDIT_LIMIT_PER_QUERY`, `REDDIT_SLEEP_SECONDS` |
| Yelp / TripAdvisor | Review scraping (implementation status unclear) | TBD |

**Supabase project ref**: `nigvyotnrlgbqeeyueql`

---

## Special Message Encoding

Polls and to-do lists are serialized as special message content strings in the `messages` table (not separate tables):

| Prefix | Meaning |
|--------|---------|
| `__POLL__` + JSON | A poll with options and votes |
| `__TODO__` + JSON | A to-do list creation event |
| `__TODO_TOGGLE__` + JSON | A to-do item check/uncheck event |
| `__TODO_UPDATE__` + JSON | A to-do list edit event |

The `ChatWindow.jsx` component parses these on render.

---

## What Does NOT Exist Yet

- No Dockerfile or docker-compose
- No infrastructure-as-code (no Terraform, CDK, CloudFormation, SAM)
- No CI/CD pipeline (no GitHub Actions, etc.)
- No database migration files (schema only in Supabase dashboard)
- No tests (no Jest, Vitest, Pytest)
- No logging or error tracking (no Sentry, CloudWatch integration)
- No rate limiting on the agent endpoint
- Multi-city RAG is functional in scrapers but the agent hardcodes `"maui"` for RAG retrieval

---

## AWS Migration Target Map

Below is a direct mapping from current Supabase services to AWS equivalents. This is a starting point — the migrating developer should validate fit before committing.

| Current (Supabase) | AWS Equivalent | Notes |
|--------------------|----------------|-------|
| Supabase Auth (GoTrue) | **Amazon Cognito** User Pools | JWT-based; will require updating all `supabase.auth.*` calls in `App.jsx` and `AuthForm.jsx` |
| Supabase PostgreSQL + pgvector | **Amazon Aurora PostgreSQL Serverless v2** with pgvector extension | pgvector is supported on Aurora; `match_reviews` RPC becomes a stored function or Lambda-called query |
| Supabase Realtime | **AWS AppSync** (GraphQL subscriptions) or **API Gateway WebSockets** | Most impactful change — `ChatWindow.jsx` uses Supabase channel subscriptions extensively |
| Supabase Storage (`chat-attachments`) | **Amazon S3** + pre-signed URLs | Update upload/download logic in `ChatWindow.jsx` and attachment fetching in `index.ts` |
| Supabase Edge Functions (Deno) | **AWS Lambda** (Node.js 20 or container) | Deno-specific imports (`esm.sh`) will need to be replaced with npm packages; rewrite in TypeScript/Node |
| Frontend hosting (static SPA) | **Amazon S3 + CloudFront** | `vite build` output in `client/dist/` is ready for S3 static hosting |
| RAG ingestion CLI | **AWS Lambda + EventBridge** (scheduled) or **AWS Batch** | Containerize the Python pipeline; trigger via EventBridge cron |
| Supabase RPCs (DB functions) | **Lambda** or **RDS Data API** calls | Replace RPC calls with direct SQL via RDS Data API or a Lambda proxy |

---

## Migration Priorities & Key Challenges

### High Priority
1. **Auth migration (Supabase → Cognito)**: The entire app gates on auth state. All `supabase.auth.*` calls, JWT handling in the edge function, and RLS policies on tables must be updated together.
2. **Realtime migration**: `ChatWindow.jsx` subscribes to Supabase Realtime channels for live message delivery. This is the most frontend-invasive change — requires replacing the subscription model with AppSync subscriptions or WebSocket connections.
3. **Edge function rewrite**: The `index.ts` agent is Deno-native (imports from `esm.sh`, uses Deno APIs). It must be rewritten for Node.js before deploying to Lambda. Core logic (agentic loop, tool definitions) can be preserved.

### Medium Priority
4. **Database export + pgvector setup**: Export schema and data from Supabase; recreate in Aurora PostgreSQL with `pgvector` extension; migrate the `match_reviews` function as a PostgreSQL stored procedure.
5. **Storage migration**: Move `chat-attachments` bucket contents to S3; update presigned URL generation and file fetch logic.
6. **RAG pipeline containerization**: Wrap `rag/` in a Dockerfile; deploy as Lambda or ECS task; schedule via EventBridge.

### Lower Priority
7. **Frontend config**: Replace hardcoded Supabase URL/anon key in `client/src/lib/supabase.js` with Cognito pool ID and API Gateway/AppSync endpoint. Use Vite env vars (`VITE_*`).
8. **CI/CD**: Add GitHub Actions pipeline for `vite build` → S3 sync and Lambda deployment.
9. **Fix hardcoded city**: Update agent to use the authenticated user's `destination` from `user_profiles` for RAG retrieval instead of the hardcoded `"maui"` string.

---

## Frontend Environment Variables (Post-Migration)

Create `client/.env` (gitignored) with Vite-prefixed vars:

```env
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_APPSYNC_ENDPOINT=https://XXXXXX.appsync-api.us-east-1.amazonaws.com/graphql
VITE_API_GATEWAY_URL=https://XXXXXX.execute-api.us-east-1.amazonaws.com/prod
VITE_S3_BUCKET=juntos-chat-attachments
VITE_CLOUDFRONT_URL=https://XXXXXX.cloudfront.net
```

## Lambda / Backend Environment Variables (Post-Migration)

```env
GEMINI_API_KEY=
OPENAI_API_KEY=
DATABASE_URL=postgresql://...@aurora-cluster.cluster-XXXX.us-east-1.rds.amazonaws.com:5432/juntos
S3_BUCKET=juntos-chat-attachments
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXX
```

---

## RAG Ingestion CLI (Reference)

```bash
# Install deps
pip install -r requirements.txt

# Run ingestion (reads .env for keys)
python rag/ingest.py --city maui --source google
python rag/ingest.py --city maui --source reddit
python rag/ingest.py --city maui --source all
```

On AWS, this should be wrapped in a container and triggered via EventBridge Scheduler.

---

## Key Files for Migration Work

| File | Why It Matters |
|------|---------------|
| `client/src/App.jsx` | Auth state machine — update for Cognito |
| `client/src/components/AuthForm.jsx` | Login/signup UI — update for Cognito SDK |
| `client/src/components/ChatWindow.jsx` | Realtime subscriptions, file upload, attachment display |
| `client/src/lib/supabase.js` | Supabase client init — replace entirely |
| `supabase/functions/agent/index.ts` | Full agent logic — rewrite for Node.js Lambda |
| `rag/pipeline/store.py` | Supabase vector upsert — update for Aurora/pgvector |
| `rag/pipeline/embed.py` | OpenAI embeddings — no change needed |

---

*Generated 2026-04-22. Supabase project ref: `nigvyotnrlgbqeeyueql`. Git branch: `main`.*
