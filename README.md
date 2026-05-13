# Juntos — AI-Powered Collaborative Travel Planning

Juntos lets groups of friends plan trips together through a shared AI chat. Instead of juggling spreadsheets, group texts, and browser tabs, travelers get a single workspace where an AI agent suggests itineraries, surfaces real traveler reviews, searches live flight prices, and keeps everyone aligned in real time.

---

## Why It Exists

Planning group travel fails in predictable ways: one person ends up doing all the research, preferences get lost in chat threads, and the final plan pleases no one. Juntos solves this by making the AI agent a participant in the group conversation — everyone can nudge, react to, and refine the plan together, and the agent adapts.

---

## Feature → Technical Component Map

### Personalized Recommendations

**What the user experiences:** The agent asks nine onboarding questions (budget, trip pace, dietary needs, etc.) and remembers answers across conversations.

**How it works:** Responses are stored in the `user_profiles` Postgres table. Every agent call reads this profile and injects it into the system prompt before querying Gemini 2.5 Flash, so recommendations are scoped to the user's stated preferences from the first message.

---

### Real Traveler Insights (RAG)

**What the user experiences:** The agent quotes specific restaurants, neighborhoods, and tips that match the destination — not generic advice.

**How it works:** A Python ingestion pipeline (`rag/`) scrapes Google Places, Reddit, Yelp, and TripAdvisor, cleans the text, generates 1536-dimension embeddings via OpenAI `text-embedding-3-small`, and upserts them into a `reviews` table backed by the pgvector Postgres extension. At query time the Supabase Edge Function calls `match_reviews()` — a pgvector cosine-similarity RPC — to retrieve the top relevant reviews and include them as grounded context for the LLM.

---

### AI Trip Planning Agent

**What the user experiences:** A conversational agent that can draft a full itinerary, refine it based on feedback, and respond to follow-up questions.

**How it works:** A Deno Edge Function (`supabase/functions/agent/index.ts`) runs an agentic loop (up to 5 iterations) using Gemini's native tool-use API. The agent has two registered tools: `create_itinerary` (writes a structured day-by-day plan to the conversation) and `search_reviews` (queries pgvector). The loop continues until Gemini issues no further tool calls, then the final response is streamed back.

---

### Reaction-Driven Feedback Loop

**What the user experiences:** Reacting to an agent message with 👍, 👎, ❤️, or ❌ visibly influences the next suggestion.

**How it works:** Reactions are stored as structured `__REACTION__` prefixed JSON records in the `messages` table. Before each agent call, the Edge Function aggregates reactions on prior agent messages and appends a natural-language feedback summary to the system prompt ("Users reacted negatively to the beach resort suggestion").

---

### Visual Itinerary Builder

**What the user experiences:** A drag-and-drop board that organizes activities by day, with editable titles, descriptions, and auto-assigned emoji icons.

**How it works:** The agent's `create_itinerary` tool emits Markdown that is parsed client-side by `ItineraryPanel.jsx` into a day-card grid. Edits are persisted back as updated Markdown in the messages table. Trip length is configurable from 1–14 days; the grid column count adjusts responsively.

---

### Group Collaboration & Real-Time Sync

**What the user experiences:** Invite friends to a group chat, plan together live, assign to-dos, vote in polls, and share files.

**How it works:** Supabase Realtime (WebSocket subscriptions) delivers messages to all group members the moment they are inserted. Group membership is managed through `group_members` and `group_invites` tables with RPC-based invite accept/decline flows. Polls, to-dos, and reactions are encoded as prefixed JSON in the `messages.content` column (`__POLL__`, `__TODO__`, `__REACTION__`) and decoded client-side by `MessageBubble.jsx`.

---

### Live Flight Search

**What the user experiences:** Ask for flights and get real pricing and schedules inline in the chat.

**How it works:** A standalone FastAPI micro-service (`flight_service/main.py`) wraps the `fast_flights` library, which queries Google Flights. The agent calls the `/search` endpoint as a tool, then formats the results into the chat response. Supports one-way and round-trip queries with configurable seat class and passenger count.

---

### Mobile App

**What the user experiences:** A native-feeling app on Android (iOS forthcoming) with the full feature set.

**How it works:** The React SPA is packaged for mobile via Capacitor (`capacitor.config.json`, App ID: `com.juntos.app`). The existing Vite build pipeline produces the web bundle; `cap sync` copies it into the `android/` native project. File upload and camera access use Capacitor's native bridge.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Clients                          │
│          React SPA (Vite)  ·  Android (Capacitor)  │
└────────────────────┬────────────────────────────────┘
                     │  HTTPS + WebSocket
┌────────────────────▼────────────────────────────────┐
│                  Supabase                           │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  Auth   │  │ Realtime │  │   Edge Functions   │ │
│  │  (JWT)  │  │(WebSocket│  │  agent/index.ts    │ │
│  └─────────┘  └──────────┘  └────────┬───────────┘ │
│  ┌──────────────────────────┐         │             │
│  │  PostgreSQL + pgvector   │◄────────┘             │
│  │  user_profiles           │                       │
│  │  conversations/messages  │                       │
│  │  reviews (embeddings)    │                       │
│  └──────────────────────────┘                       │
│  ┌────────────┐                                     │
│  │  Storage   │  (chat-attachments bucket)          │
│  └────────────┘                                     │
└─────────────────────────────────────────────────────┘
          │                          │
┌─────────▼──────────┐   ┌──────────▼──────────┐
│   Google Gemini    │   │  FastAPI Flight Svc  │
│   2.5 Flash (LLM)  │   │  flight_service/     │
└────────────────────┘   └─────────────────────┘
          │
┌─────────▼──────────┐
│  OpenAI Embeddings │
│  text-embedding-   │
│  3-small (RAG)     │
└────────────────────┘
```

---

## Tech Stack

| Layer         | Technology                     |
| ------------- | ------------------------------ |
| Frontend      | React 18, Vite 6               |
| Mobile        | Capacitor 8 (Android)          |
| Backend       | Supabase Edge Functions (Deno) |
| Database      | Supabase PostgreSQL + pgvector |
| Auth          | Supabase Auth (JWT)            |
| Realtime      | Supabase Realtime (WebSocket)  |
| Storage       | Supabase Storage               |
| LLM           | Google Gemini 2.5 Flash        |
| Embeddings    | OpenAI text-embedding-3-small  |
| Flight data   | FastAPI + fast_flights         |
| RAG ingestion | Python (OpenAI + Supabase)     |

---

## Project Structure

```
juntos/
├── client/                  # React SPA
│   └── src/
│       ├── App.jsx           # Auth → onboarding → chat state machine
│       ├── components/
│       │   ├── Onboarding.jsx       # Preference intake (9 questions)
│       │   ├── ConversationList.jsx # Sidebar + group invite management
│       │   ├── ChatWindow.jsx       # Realtime chat, polls, to-dos, uploads
│       │   ├── MessageBubble.jsx    # Markdown rendering, reactions, structured content
│       │   └── ItineraryPanel.jsx   # Drag-and-drop day planner
│       └── lib/supabase.js   # Supabase client
│
├── supabase/
│   └── functions/agent/
│       └── index.ts          # AI agent: agentic loop, tool use, RAG calls
│
├── rag/                      # Review ingestion pipeline
│   ├── ingest.py             # CLI entrypoint
│   ├── scrapers/             # Google Places, Reddit, Yelp, TripAdvisor
│   └── pipeline/             # clean → embed → store
│
└── flight_service/
    └── main.py               # FastAPI flight search endpoint
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase project with pgvector enabled
- API keys: Gemini, OpenAI, Google Places

### Frontend

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

### Agent (Edge Function)

```bash
supabase functions serve agent --env-file .env.local
```

### RAG Ingestion

```bash
pip install -r requirements.txt
python rag/ingest.py --location "Lisbon, Portugal"
```

### Flight Service

```bash
cd flight_service
uvicorn main:app --reload
```

### Environment Variables Needed

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
GOOGLE_PLACES_API_KEY=
```
