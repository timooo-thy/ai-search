# Code Orientation AI Application

## Problem

New developers often struggle to understand unfamiliar codebases, leading to delays in making their first meaningful contributions. Traditional search methods can be inefficient and overwhelming, making it difficult to quickly find relevant information. Moreover, onboarding processes can be inconsistent, leading to varied experiences for new team members. While there are AI Code Assistants, they still tend to hallucinate and are not fully reliable for understanding complex codebases.

## Goal:

Reduce time-to-first-commit and onboarding time for engineers. This application aim to solve this problem using Natural Language driven search and actionable feature cards to measure success with onboarding metrics.

## Core Features:

1. Natural Language Search: Allow users to search the codebase using natural language queries, making it easier to find relevant information without needing to know specific file names or code structures.
2. Code Graph Visualisation: Generate a visual representation of the codebase structure, including file relationships and dependencies, to help users quickly understand the architecture.
3. Actionable Feature Cards: Provide users with feature cards that offer insights and actions based on their search queries and the code graph.
4. Search Template: Quick toggles for repo/org/path/language/filename.

## Sucess Metrics:

1. Time-to-First-Commit: Measure the time taken for new developers to make their first commit after joining the project.
2. User Satisfaction: Conduct surveys to assess the satisfaction levels of new developers regarding the onboarding process and their ability to navigate the codebase.
3. Onboarding Time: Measure the time taken for new developers to become familiar with the codebase and its structure.

## Tech Stack:

- Frontend and Backend: Next.js
- AI Integration: LangGraph, OpenAI
- Code Search: GitHub Search API
- Database: PostgreSQL
- ORM: Prisma
- Hosting: Vercel
- Authentication: BetterAuth
- State Management: React Query
- Styling: Tailwind CSS
- Component Library: Shadcn/UI
- Cache: Upstash Redis

## Example Flow

1. Input(User Query): "How does the authentication flow work in this codebase?"
2. AI Agent Search: The AI agent processes the natural language query and searches the codebase using the GitHub Search API to find relevant files and code snippets related to authentication.
3. Code Graph Generation: The AI agent generates a code graph that visualises the relationships between the relevant files and components involved in the authentication flow.
4. Actionable Feature Cards: The application presents the user with three actionable feature cards:
   - **Feature Card 1**: "Ownership & Activity" - Top committers, last modified dates, related issues/PRs for the authentication feature.
   - **Feature Card 2**: "Key Files" - A list of important files related to authentication, with links to view them directly in the codebase.
   - **Feature Card 3**: "Next Steps" - Suggestions for further exploration, such as related features or components that interact with the authentication flow.
