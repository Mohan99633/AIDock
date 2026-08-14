# AIDock - Project Guide

AIDock is a Chrome extension that provides an intelligent productivity layer on top of various AI platforms (ChatGPT, Claude, Gemini, etc.), acting as a unified workspace for AI interaction.

## 🚀 Vision
"One Dock. Every AI." — Transform AI websites into a unified, intelligent workspace for prompt organization, response saving, and productivity tracking.

## 🛠 Tech Stack
- **Extension Framework**: Plasmo
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Storage**: Local-first (IndexedDB / Chrome Storage API)
- **Charts**: Recharts
- **Testing**: Vitest, Playwright
- **Build Tool**: pnpm

## 🏗 Architecture
- **Adapter Pattern**: `src/adapters/` handles site-specific DOM interaction.
- **Core Engine**: `src/core/` defines contracts and business logic.
- **UI Layers**: `src/app/` (Popup & Options) and `src/features/` (Feature-specific UI/Logic).
- **Infrastructure**: `src/infrastructure/` handles storage and external API interactions.

## 🗺️ Roadmap

## 💰 Monetization
- **AIDock Pro** (freemium): Free tier = up to 30 prompts & 2 workspaces; Pro = unlimited + Model Comparison.
- **Pricing**: $19.99 lifetime or $2.99/month.
- **Config**: Checkout URL lives in `src/core/config/premium.ts` (`DEFAULT_CHECKOUT_URL`); license store in `src/features/premium/`.
- **Gating**: `src/features/premium/lib/gating.ts` powers prompt/workspace limits + Pro-only features.

### Phase 1: Foundation & Core Utility (Current)
- [x] **Storage Schema**: Define IndexedDB schemas for Prompts, Notes, and History.
- [x] **Prompt Enhancer**: UI for enhancement options $\rightarrow$ LLM integration $\rightarrow$ Injection.
- [x] **Smart Prompt Library**: CRUD for prompts with folders, tags, and favorites.
- [x] **Prompt History**: Background observer to auto-save prompts $\rightarrow$ Filterable History UI.
- [x] **AI Notes**: Markdown-supported notes linked to AI responses.
- [x] **Productivity Dashboard**: Custom SVG charts (bar, donut, sparkline), daily activity, platform usage, category breakdown, recent timeline, stat tiles. Built with inline SVG + Recharts-ready architecture.

### Phase 2: Advanced Intelligence
- [x] **Universal Search**: Full-text search across prompts, notes, and history.
- [x] **Templates**: Built-in prompt templates for various use cases.
- [x] **Prompt Optimizer**: Analysis of prompt quality and structural suggestions.
- [x] **Model Comparison**: Run prompts across multiple models and compare results.

### Phase 3: Ecosystem & Sync
- [ ] **Cloud Sync**: Cross-device synchronization of workspace.
- [ ] **Team Workspace**: Shared prompt libraries and collaboration.
- [ ] **AI Marketplace**: Community-shared prompts and templates.

### Phase 4: Platform Expansion
- [ ] **Desktop App**: Standalone productivity suite.
- [ ] **Mobile App**: On-the-go AI management.
- [ ] **Enterprise Features**: Advanced security and admin controls.

## 🎨 Design Principles
- **Aesthetics**: Inspired by Apple, Linear, Arc, Notion, Stripe, Vercel.
- **Goals**: Minimal, Premium, Fast, Clean, Beautiful, Responsive.

## 🛡️ Privacy
- Local-first storage.
- No hidden tracking.
- User owns all data.
