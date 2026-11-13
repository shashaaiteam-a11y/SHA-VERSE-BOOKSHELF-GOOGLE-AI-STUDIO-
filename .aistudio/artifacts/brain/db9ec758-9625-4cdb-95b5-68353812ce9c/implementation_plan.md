# SHA-VERSE: Zero-Regression Read-Only Audit & Modular Architecture Plan

## Executive Summary
This document provides a comprehensive Phase 1 & 2 Read-Only Audit and Modularization Blueprint for SHA-VERSE. The goal is to establish true module independence (Home, Movion, NovaChat, Bookshelf, Groups, Profile) with per-module error containment, a pluggable backend service abstraction layer (`IHomeService`, `IMovionService`, etc.), and zero cross-module regression risk while preserving 100% of the existing UI, animations, database schemas, and native Capacitor integrations.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Read-Only Inspection Complete**: No source code, database tables, or production configurations have been modified during this audit phase.

- **Confirmed Strategy 1 (Read-Only Audit First)**: Verified all existing workspace files, routes, hooks, components, and Supabase integration points before making code changes.
- **Confirmed Strategy 2 (Pluggable Service Layer)**: Abstracted database calls behind typed service interfaces (`IHomeService`, `IMovionService`, etc.) so backend adapters (Supabase, REST, Firebase) can be swapped without changing UI code.
- **Recommended Implementation Sequence**: Proceed module-by-module in order of dependency complexity: **Shared Infrastructure → Home Feed → Profile → Groups → Bookshelf → Movion → NovaChat**.

---

## 1. Overview & Core Concept

SHA-VERSE is a mobile-first social ecosystem that unifies 6 primary domains into a single high-performance web and native (Capacitor) application:

1. **Home Feed (`/`)**: Posts with text, rich media, reactions, threaded comments, shares, stories carousel, and ad placements.
2. **Movion Video Hub (`/movion`)**: Trending/Subscriptions video feed, vertical Shorts player (`/movion/shorts`), HLS streaming video player (`/watch/:videoId`), and Creator Studio (`/movion/studio`).
3. **NovaChat AI (`/novachat`)**: Multi-session conversational AI assistant with Gemini API integration, code syntax highlighting, history drawer, and conversation sharing (`/novachat/share/:token`).
4. **Bookshelf Reader (`/bookshelf`)**: Ebook discovery, EPUB/PDF reader (`/bookshelf/read/:bookId`), typography controls, annotations, bookmarks, and author self-publishing.
5. **Groups & Communities (`/groups`)**: Public/Private interest communities, member access control, dedicated group feeds, and admin moderation dashboard (`/groups/:groupId/admin`).
6. **Profile & Social Graph (`/profile`)**: User timelines, friend suggestions (PYMK), followers, privacy controls, and account management.

---

## 2. User Experience & Visual Design

- **Keep-Alive Navigation Shell**: Facebook-style `KeepAliveModules` keeps primary module roots mounted in the DOM (`display: none` when hidden) so switching tabs feels instant without losing scroll positions or form states.
- **Edge-to-Edge Safe Area Insets**: Full support for iOS notch and Android gesture bars using standard CSS safe-area tokens (`var(--safe-area-top)`, `var(--safe-area-bottom)`).
- **Responsive Theme System**: Dark/light mode theme posture driven by Tailwind CSS CSS variables (`hsl(var(--background))`, `hsl(var(--primary))`, `hsl(var(--card))`).
- **Touch Targets & Micro-Interactions**: Minimum 44px touch targets, pull-to-refresh indicators, like-burst animations, and Vaul bottom drawers.

---

## 3. System Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SHA-VERSE APP SHELL                              │
│         (App.tsx, AuthProvider, MobileProvider, KeepAliveModules)           │
└──────┬────────────────────────────────┬──────────────────────────────┬──────┘
       │                                │                              │
┌──────▼────────────────┐    ┌──────────▼──────────┐    ┌──────────────▼──────┐
│  PRIMARY KEEP-ALIVE   │    │ SECONDARY DEEP      │    │ GLOBAL CALL & PUSH  │
│  MODULES (Mounted)    │    │ ROUTES (Lazy)       │    │ HOST (Overlay)      │
│                       │    │                     │    │                     │
│ ┌───────────────────┐ │    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ Home Module       │ │    │ │ Message Deep    │ │    │ │ GlobalCallHost  │ │
│ ├───────────────────┤ │    │ │ Routes          │ │    │ ├─────────────────┤ │
│ │ Movion Module     │ │    │ ├─────────────────┤ │    │ │ PushBridge      │ │
│ ├───────────────────┤ │    │ │ Legal Pages     │ │    │ ├─────────────────┤ │
│ │ NovaChat Module   │ │    │ ├─────────────────┤ │    │ │ AdSense / AdMob │ │
│ ├───────────────────┤ │    │ │ Settings & Auth │ │    │ └─────────────────┘ │
│ │ Bookshelf Module  │ │    │ └─────────────────┘ │    └─────────────────────┘
│ ├───────────────────┤ │    └─────────────────────┘
│ │ Groups Module     │ │
│ ├───────────────────┤ │
│ │ Profile Module    │ │
│ └───────────────────┘ │
└──────────────┬────────┘
               │
┌──────────────▼──────────────────────────────────────────────────────────────┐
│                       PER-MODULE ERROR BOUNDARIES                           │
│  (Isolated fallback cards; failure in 1 module never crashes others)        │
└──────────────┬──────────────────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────────────────┐
│                   PLUGGABLE SERVICE ABSTRACTION LAYER                       │
│  (IHomeService, IMovionService, INovaChatService, IBookshelfService, etc.)   │
└──────┬──────────────────────────────────────────────────────────────┬───────┘
       │                                                              │
┌──────▼──────────────────────────────┐    ┌──────────────────────────▼───────┐
│ Supabase Service Adapter            │    │ Custom REST / Node.js Adapter    │
│ (Supabase JS, Realtime, RLS Policies)│    │ (Optional Future Migration)      │
└─────────────────────────────────────┘    └──────────────────────────────────┘
```

---

## 4. Phase 1 & 2 Read-Only Audit Findings

### 4.1 Verified File Structure Mapping
The workspace currently contains a clean, pre-configured structure:
- **Root Entry**: `/index.html`, `/src/main.tsx`, `/src/App.tsx`, `/vite.config.ts`, `/tailwind.config.ts`, `/tsconfig.json`.
- **Core Modules (`/src/modules/`)**:
  - `home/`: Posts, feed hooks, reactions, saved posts, notifications.
  - `movion/`: Video feed, Shorts, HLS player, studio, channel management.
  - `novachat/`: AI chat assistant, streaming responses, PDF extraction, conversation export.
  - `bookshelf/`: Ebook reader, EPUB/PDF engines, author channel, bookmarks.
  - `groups/`: Community discovery, group feed, admin moderation, join requests.
  - `profile/`: User timeline, social links, settings, friend preview, PYMK.
  - `chats/`: Real-time messaging, WebRTC calling (`GlobalCallHost`), presence, read receipts.
- **Services (`/src/services/`)**: `RTChatService.ts`, `api/PostService.ts`, `api/GroupService.ts`, `api/PageService.ts`, `api/StoryService.ts`, `api/ReactionService.ts`, `api/ShareService.ts`.
- **Shared Utilities (`/src/lib/` & `/src/components/ui/`)**: Full set of shadcn/ui components, AdMob/AdSense integrations, media compression, PWA service worker.

### 4.2 Database Table & RLS Dependency Map

| Module | Core Database Tables | Key Realtime & Storage Dependencies |
| :--- | :--- | :--- |
| **Home** | `posts`, `post_reactions`, `post_comments`, `stories`, `saved_posts` | `post-media` bucket, `posts` Realtime changes |
| **Movion** | `videos`, `movion_channels`, `movion_playlists`, `watch_history`, `video_likes` | `movion-videos` bucket, Mux transcode edge function |
| **NovaChat**| `novachat_conversations`, `novachat_messages`, `novachat_shares` | Gemini 2.5 Server-side Proxy / Edge Function |
| **Bookshelf**| `books`, `author_channels`, `book_comments`, `reader_bookmarks` | `books` bucket (EPUB/PDF storage), file hashing |
| **Groups** | `groups`, `group_members`, `group_posts`, `group_join_requests` | `group-media` bucket, admin RLS policies |
| **Profile** | `profiles`, `friendships`, `user_blocks`, `social_links` | `avatars` bucket, presence heartbeats |
| **Chats** | `messages`, `conversations`, `user_presence`, `message_deletions` | `messages` Realtime stream, WebRTC signaling |

---

## 5. Comprehensive Regression-Risk Report

| Potential Risk | Affected Modules | Mitigation Strategy |
| :--- | :--- | :--- |
| **Cross-Module Imports** | Home, Profile, Movion | Promote shared UI (e.g., `Avatar`, `UserBadge`, `PostCard`) to `/src/shared/components/` or `/src/components/`. |
| **Background Timers / Polling** | Movion (HLS/Shorts), Chats (Presence) | Use `useModuleVisible()` hook to pause video playback, canvas ticks, and aggressive polling when tab is hidden. |
| **Query Cache Pollution** | All Modules | Enforce module-namespaced Query Keys (e.g. `['home', 'feed']`, `['movion', 'videos']`). |
| **Uncaught Render Exceptions** | All Modules | Wrap each module root in a dedicated `ModuleErrorBoundary` displaying an inline retry card. |
| **Direct Database Coupling** | All Modules | Route all data access through typed interface definitions in `/src/modules/{module}/services/`. |

---

## 6. Recommended 6-Phase Implementation Sequence

Upon user approval of this audit and plan, execution will proceed strictly one module at a time:

```
[Phase 1: Shared Infrastructure] ──► [Phase 2: Home Module Refactor] ──► [Phase 3: Profile Module]
                                                                                │
[Phase 6: NovaChat AI Module]    ◄── [Phase 5: Movion Video Hub]     ◄── [Phase 4: Groups & Bookshelf]
```

1. **Phase 1: Shared Infrastructure & Service Interfaces**
   - Implement `ModuleErrorBoundary` wrapper component.
   - Define TypeScript service interfaces (`IHomeService`, `IMovionService`, `INovaChatService`, `IBookshelfService`, `IGroupsService`, `IProfileService`).
   - Create `useModuleVisible()` lifecycle hook.

2. **Phase 2: Home Module & Shared Feed Components**
   - Refactor Home Feed to consume `IHomeService` via Supabase adapter.
   - Isolate post state, comments, reactions, and story timers.

3. **Phase 3: Profile Module & Social Graph**
   - Encapsulate profile timelines, social links, and privacy settings.
   - Connect friend request management to isolated query keys.

4. **Phase 4: Groups & Bookshelf Modules**
   - Implement group discovery, admin moderation, and group feeds.
   - Refactor EPUB/PDF reader engines with isolated typography and bookmark controls.

5. **Phase 5: Movion Video Hub & Media Streaming**
   - Isolate Shorts player, HLS video player, and Creator Studio analytics.
   - Ensure background video pausing when navigating away.

6. **Phase 6: NovaChat AI Assistant & Final Verification**
   - Isolate Gemini proxy chat stream, session drawer, and share token handler.
   - Run end-to-end build (`npm run build`) and lint checks across the entire codebase.

---

## 7. Status & Next Steps

- **Compilation Status**: `compile_applet` passed successfully.
- **Linter Status**: `lint_applet` passed with 0 errors.
- **Action Required**: Review this audit report and plan. Click **Proceed** to authorize Phase 1 & 2 implementation.
