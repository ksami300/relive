# Relive — Enterprise Stress Intelligence & Zen Wellness Ecosystem

Real-time stress telemetry, autonomous wellness interventions, and biometric wearable integration platform for individuals and enterprise organizations.

## Architecture & Tech Stack
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Socket.IO Client
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Socket.IO WebSockets
- **Security & Quality:** Zero-trust Tenant Isolation, Biometric Consent Shield, Refresh Token Rotation, Node Native Test Runner (24 passing tests)

## Quick Start
1. Start PostgreSQL on `localhost:5432`
2. Backend (Port `4000`):
   ```bash
   cd backend && cp .env.example .env && npm install && npx prisma db push && npm run dev
   ```
3. Frontend (Port `3001`):
   ```bash
   cd frontend && npm install && npm run dev
   ```
