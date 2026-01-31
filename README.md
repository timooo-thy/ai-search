# CodeOrient - AI-Powered Code Navigation

<div align="center">

**Reduce time-to-first-commit with intelligent codebase exploration**

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Usage](#usage) • [Architecture](#architecture)

</div>

---

## Problem

New developers often struggle to understand unfamiliar codebases, leading to delays in making their first meaningful contributions. Traditional search methods can be inefficient and overwhelming, making it difficult to quickly find relevant information. While AI code assistants exist, they often hallucinate and lack deep understanding of complex codebases.

## Solution

CodeOrient is an AI-powered code navigation tool that helps developers understand and explore codebases through natural language queries and intelligent visualisation. It combines semantic code search, interactive graph visualisation, and contextual AI responses to accelerate developer onboarding.

---

## Features

### 🔍 Natural Language Code Search

- Search any GitHub repository using natural language queries
- AI understands context and finds relevant code across files
- Supports both live GitHub API search and indexed RAG-based search for faster results

### 📊 Code Graph Visualisation

- Interactive graph showing file relationships and dependencies
- AI-generated visualisations based on user queries
- Nodes represent files, functions, classes, and components
- Edges show imports, calls, and usage relationships
- Built with React Flow for smooth pan/zoom interactions

### 🗂️ Repository Indexing (RAG)

- Index your repositories for lightning-fast semantic search
- Chunked code storage with vector embeddings
- Supports multiple languages: TypeScript, JavaScript, Python, Java, Go, Rust, and more
- Progress tracking and status monitoring

### 💬 Conversational AI Chat

- Context-aware AI responses using OpenAI models
- Persistent chat history with bookmarking
- Share conversations via public links
- Real-time streaming responses

### 📌 Chat Management

- **Bookmark** important conversations for quick access
- **Share** chats with unique public URLs
- Organised sidebar with recent and bookmarked chats
- Delete and manage chat history

### 🌤️ Contextual Widgets

- Weather information display
- Repository browser with quick actions
- Time and stock market widgets on the dashboard

### 🔐 Authentication & Settings

- GitHub OAuth integration via BetterAuth
- Personal Access Token (PAT) management for GitHub API access
- User profile customisation

---

## Tech Stack

| Category            | Technology                         |
| ------------------- | ---------------------------------- |
| **Framework**       | Next.js 16 (App Router, Turbopack) |
| **AI/LLM**          | Vercel AI SDK, OpenAI GPT models   |
| **Database**        | PostgreSQL (Neon), Prisma ORM      |
| **Vector Store**    | Upstash Vector                     |
| **Caching**         | Upstash Redis                      |
| **Auth**            | BetterAuth (GitHub OAuth)          |
| **Visualisation**   | React Flow, Dagre layout           |
| **Styling**         | Tailwind CSS, shadcn/ui            |
| **Monitoring**      | Sentry (errors, tracing, logs)     |
| **Hosting**         | Vercel                             |
| **Code Processing** | LangChain                          |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Neon account)
- GitHub OAuth app credentials
- OpenAI API key
- Upstash Vector & Redis accounts

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/codeorient.git
   cd codeorient
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Configure the following:

   ```env
   # Database
   DATABASE_URL=your_postgresql_url

   # OpenAI
   OPENAI_API_KEY=your_openai_key
   NEXT_PUBLIC_OPENAI_CHAT_MODEL=gpt-4o

   # GitHub OAuth (BetterAuth)
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret

   # Upstash
   UPSTASH_VECTOR_REST_URL=your_vector_url
   UPSTASH_VECTOR_REST_TOKEN=your_vector_token
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token

   # Sentry
   SENTRY_DSN=your_sentry_dsn

   # External APIs (optional widgets)
   NEXT_PUBLIC_OPENWEATHER_KEY=your_openweather_key
   NEXT_PUBLIC_API_NINJAS_KEY=your_api_ninjas_key
   NEXT_PUBLIC_ALPHA_VANTAGE_KEY=your_alphavantage_key
   ```

4. **Run database migrations**

   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Usage

### Starting a Conversation

1. Sign in with your GitHub account
2. Add your GitHub Personal Access Token in Settings
3. Go to Chat and type a natural language query like:
   - _"How does authentication work in this codebase?"_
   - _"Show me the API routes structure"_
   - _"Visualise the dependencies in owner/repo"_

### Indexing a Repository

1. Navigate to Settings
2. Select a repository from your GitHub account
3. Click "Index Repository" to enable fast RAG-based search
4. Monitor indexing progress in real-time

### Sharing Chats

1. Open any chat conversation
2. Click the Share icon in the header
3. Enable sharing to generate a public link
4. Copy and share the URL with others

---

## Architecture

```text
src/
├── actions/         # Server actions (GitHub, messages)
├── ai/              # AI tools, prompts, and agents
├── app/
│   ├── api/         # API routes (chat, auth)
│   ├── auth/        # Authentication pages
│   ├── chat/        # Chat interface & components
│   ├── dashboard/   # User dashboard
│   └── settings/    # User settings
├── components/      # Reusable UI components
├── hooks/           # Custom React hooks
├── lib/             # Utilities (auth, prisma, redis, vector)
├── services/        # Business logic (repo indexer)
└── types/           # TypeScript type definitions
```

---

## Success Metrics

- **Time-to-First-Commit**: Reduce onboarding time for new developers
- **User Satisfaction**: Improve codebase understanding experience
- **Search Efficiency**: Faster discovery of relevant code compared to traditional search

---

## License

This project is part of a Final Year Project (FYP) for academic purposes.

---

<div align="center">

Built with ❤️ using Next.js, Vercel AI SDK, and shadcn/ui

</div>
