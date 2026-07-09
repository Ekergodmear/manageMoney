# Product Shell — Wave A Design Sprint

**Trạng thái:** Design Sprint **HOÀN TẤT** — Product Shell API **KHÓA** (không viết thêm tài liệu kiến trúc)  
**Ngày:** 2026-06-30  
**Mục đích:** Thiết kế nền cuối cùng trước Cloud + Product Evolution

---

## Tóm tắt

Wave A không phải ba feature rời (`Command Palette`, `Diagnostics`, `Keyboard`). Đó là **một Product Shell** nằm trên mọi workspace:

```text
App Shell
│
├── Workspace Registry  ← workspace đăng ký vào shell
├── Command Registry
├── Action History      ← recent commands (không phải Notification)
├── Diagnostics
├── IndexProvider       ← stub (Session · Plan · Market · Workspace)
├── Shortcut Registry
├── Status Bar          ← clickable navigation phụ
└── Notifications       ← đã có (tách biệt Action History)
```

**Nguyên tắc:** Workspace **đăng ký** vào Shell — Shell **không import** workspace.

**Product Freeze:** Shell chỉ đọc state, điều hướng, hiển thị health — không đổi settlement, planning engine, collector logic, persistence schema.

---

## Product Shell Rule

```text
Workspace  →  registerWorkspace()  →  Shell
```

**Không được:**

```text
Shell  →  import Workspace
```

Shell không biết Planning. **Planning biết Shell** và gọi `registerWorkspace()`.

Từ đây: Command, Diagnostics, Navigation, Sidebar đều derive từ Workspace Registry — không hardcode `workspace-nav.ts` về lâu dài (migrate dần trong PR1).

---

## 1. Product Shell overview

### Vị trí trong kiến trúc

```text
┌─────────────────────────────────────────────────────────┐
│  Product Shell (Wave A)                                  │
│  CommandRegistry · Diagnostics · Shortcuts · StatusBar   │
├─────────────────────────────────────────────────────────┤
│  Workspaces (Dashboard · Session · Library · …)          │
├─────────────────────────────────────────────────────────┤
│  Use Cases · Domain (frozen — freeze-v1.md)              │
├─────────────────────────────────────────────────────────┤
│  Persistence · Collector (read-only từ Shell)            │
└─────────────────────────────────────────────────────────┘
```

### Hiện trạng codebase (điểm bám)

| Thành phần Shell | Hiện có | Wave A |
|------------------|---------|--------|
| Navigation | `AppLayout` + `workspace-nav.ts` (hardcode) | **Workspace Registry** |
| Command Palette | `z-index.commandPalette` trong design tokens | Implement overlay |
| Diagnostics | Rải rác: Game Monitor, Collector `/health` | Gom `DiagnosticsProvider` |
| Global Search | Library search cục bộ | `IndexProvider` stub |
| Keyboard | Không có registry | `ShortcutRegistry` |
| Status Bar | Badge rải rác trên Dashboard/Session | Một thanh cố định |
| Notifications | `NotificationBell` trong header | Giữ; Status Bar có thể mirror collector |

### Hai nhóm sản phẩm (roadmap dài hạn)

| Nhóm | Mục tiêu | Wave A | Sau Wave A |
|------|----------|--------|------------|
| **Productivity** | Thao tác nhanh | Palette, Keyboard, Search stub | Global Search, Backup, Bulk |
| **Operations** | Vận hành & quan sát | Diagnostics, Status Bar | Cockpit, Health Score, Release Notes |

---

## 1b. Workspace Registry

Workspace đăng ký một lần khi boot module:

```ts
interface WorkspaceDefinition {
  readonly id: WorkspaceId;
  readonly title: string;
  readonly icon: string;
  readonly route: string;
  readonly commands: () => readonly AppCommand[];
  readonly diagnostics: () => readonly DiagnosticCapability[];
}
```

```text
Planning.registerWorkspace(def)
        │
        ├── commands()   → CommandRegistry
        ├── diagnostics() → DiagnosticsProvider
        └── nav item     → Sidebar (derive, không hardcode)
```

Palette không cần biết Planning ở đâu — chỉ filter `CommandRegistry` theo `visible(ctx)`.

---

## 1c. Action History

**Không phải** Recent Activity / Notification timeline.

Là lịch sử **lệnh shell** gần đây (giống VS Code):

```text
execute(command)  →  ActionHistory.push(entry)  →  Palette "Recent"
```

Ctrl+K mở palette → section **Recent** đầu danh sách:

```text
Recent
  Continue Session
  Generate Plan
  Export
  Diagnostics
```

- Lưu local (sessionStorage hoặc persisted shell slice) — không domain event.
- Tối đa ~10 mục, dedupe theo `commandId`.

---

## 2. Command Registry contract

### Vai trò

**Command Registry là trung tâm.** Palette, Keyboard, Context Menu (sau này), Toolbar (sau này) đều là **UI consumer**:

```text
CommandRegistry
        │
        ├── CommandPalette      (Ctrl+K)
        ├── ShortcutRegistry      (G, S, L, …)
        ├── ContextMenu           (future)
        └── Toolbar               (future)
```

Workspace **không** tự render menu hành động toàn cục. Workspace đăng ký qua **Workspace Registry** (xem §1b).

### Registry thuần — không React hook

❌ `execute() { const nav = useNavigate(); }`

✅ `execute(ctx: AppContext) { ctx.navigate('session'); }`

`AppContext` do Shell inject khi boot (factory từ `App.tsx`):

```ts
interface AppContext {
  readonly activeWorkspace: WorkspaceId;
  readonly activeSession: Session | null;
  readonly persisted: Readonly<PersistedAppState>;
  readonly navigate: (workspace: WorkspaceId) => void;
  readonly services: ShellServices;   // persistence read, collector health, …
  readonly notifications: ShellNotificationApi;
  readonly actionHistory: ActionHistoryApi;
}
```

Command Registry + Workspace Registry **không import React** — test unit thuần TS.

### Types

```ts
type CommandCategory =
  | 'Planning'
  | 'Session'
  | 'Library'
  | 'Dashboard'
  | 'Navigation'
  | 'Developer';

interface Shortcut {
  readonly key: string;
  readonly modifiers?: readonly ('ctrl' | 'shift' | 'alt' | 'meta')[];
  readonly display?: string;
}

interface AppCommand {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly category: CommandCategory;
  readonly icon?: string;
  readonly keywords: readonly string[];
  readonly shortcut?: Shortcut;
  readonly visible: (ctx: AppContext) => boolean;
  readonly enabled: (ctx: AppContext) => boolean;
  readonly execute: (ctx: AppContext) => Promise<void>;
}
```

### Quy tắc `enabled` / `visible`

- **UI không tự `if (activeSession)`** — logic nằm trong command.
- Ví dụ `session.continue`:
  - `visible`: `ctx.activeSession !== null`
  - `enabled`: `ctx.activeSession?.status === 'playing'`
- Disabled command vẫn hiện trong Palette (gợi ý) với subtitle lý do, hoặc ẩn tùy `visible` — mặc định **visible=true, enabled=false** cho lệnh “gần đúng”.

### Command catalog v1 (draft — sprint hoàn thiện bảng đầy đủ)

| id | title | category | shortcut | enabled khi |
|----|-------|----------|----------|-------------|
| `planning.open` | Mở Planning | Planning | — | luôn |
| `capital.open` | Capital Planner | Planning | — | luôn |
| `session.open` | Mở Session | Session | `S` | luôn |
| `session.continue` | Continue Session | Session | — | `activeSession.status === 'playing'` |
| `library.open` | Open Library | Library | `L` | luôn |
| `dashboard.open` | Dashboard | Dashboard | `G` | luôn |
| `game-monitor.open` | Game Monitor | Dashboard | — | luôn |
| `diagnostics.open` | Diagnostics | Developer | `D` | luôn |
| `settings.open` | Settings | Navigation | — | luôn |
| `export.session` | Export CSV | Session | `Ctrl+Shift+E` | có session/plan context |
| `palette.search-sessions` | Search Session… | Library | — | stub → IndexProvider |

**Đăng ký:** mỗi workspace module export `readonly commands: readonly AppCommand[]` từ file `*-commands.ts`; `App.tsx` hoặc `shell/register-commands.ts` gọi `registry.registerAll()` một lần khi boot.

### Fuzzy search & palette modes

**Ba mode** (prefix khi gõ):

| Prefix | Mode | Ví dụ |
|--------|------|-------|
| *(none)* | Actions + Recent | `Continue`, `Export` |
| `>` | Action only (explicit) | `> Generate Plan` |
| `?` | Help / docs stub | `?continue`, `?collector` → mở help panel (không cần Wave B) |

- **Recent** section: từ `ActionHistory` (§1c), không từ Notifications.
- Thư viện fuzzy: fuse.js hoặc match đơn giản — quyết định lúc implement.

---

## 3. Diagnostics capability contract

### Vai trò

Diagnostics là **tập capability**, không phải widget cứng:

```text
DiagnosticsScreen
        │
        ▼
DiagnosticsProvider
        │
        ├── CollectorCapability
        ├── StorageCapability
        ├── StatisticsCapability
        ├── NotificationsCapability
        ├── RuntimeCapability
        └── CloudCapability        (stub: Disabled)
```

Thêm Cloud sau → chỉ thêm capability; **không sửa layout UI**.

### Types

```ts
type DiagnosticStatus = 'ok' | 'warning' | 'error' | 'disabled';

type Severity = 'info' | 'warning' | 'critical';

interface DiagnosticRow {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly severity?: Severity;  // row-level; không phải gì cũng đỏ
}

interface DiagnosticSnapshot {
  readonly status: DiagnosticStatus;
  readonly severity: Severity;       // capability-level rollup
  readonly summary: string;
  readonly rows: readonly DiagnosticRow[];
  readonly checkedAt: string;
}
```

**Severity ví dụ:**

| Tình huống | severity |
|------------|----------|
| Collector offline | `critical` |
| Statistics stale | `warning` |
| Cloud disabled | `info` |

interface DiagnosticCapability {
  readonly id: string;
  readonly title: string;
  readonly refresh: () => Promise<DiagnosticSnapshot>;
}
```

### Capability → nguồn dữ liệu (map sprint)

| Capability | id | Nguồn hiện tại | Ghi chú |
|------------|-----|----------------|---------|
| **Collector** | `collector` | `GET /health`, `/draws/latest` | `drawCount`, `lastDrawKey`, adapter id |
| **Storage** | `storage` | IndexedDB repos / `PersistenceService` | sessions count, rounds estimate, storage estimate |
| **Statistics** | `statistics` | `useGameStatistics` + collector | last refresh, rolling window size, fresh/stale |
| **Notifications** | `notifications` | `persisted.notifications` | count, unread |
| **Runtime** | `runtime` | `package.json` version, `reports/latest.json` (dev) | build, branch, commit, verify score |
| **Cloud** | `cloud` | — | `status: disabled` cố định Wave A |

### Layout màn Diagnostics (read-only)

```text
Diagnostics
────────────────────────────
Collector          🟢 Running
Latest Draw          20260630190500
Latency              118 sec
Draws in DB          19 429
────────────────────────────
Storage
IndexedDB            ~19 MB
Sessions             48
PlayedRounds         5 281
Notifications        127
────────────────────────────
Statistics
Last Refresh         19:06
Rolling window       1 000
Cache                Fresh | Stale
────────────────────────────
Runtime
Build                1.0.0-rc.1
Branch               release/internal-rc
Commit               dcdca90
Verify               100/100
────────────────────────────
Cloud                ⚪ Disabled
```

### Fresh / Stale (định nghĩa sprint)

| Trạng thái | Điều kiện |
|------------|-----------|
| **Fresh** | Collector OK + statistics refresh &lt; 2 phút |
| **Warning** | Collector degraded hoặc refresh 2–10 phút |
| **Error** | Collector unreachable hoặc refresh &gt; 10 phút |

### Acceptance — Diagnostics

- Mở workspace / route Diagnostics trong **&lt; 500ms** (shell render; capability refresh async).
- **Read-only** — không nút mutate persistence, collector, session.
- Nút **Refresh** chỉ gọi `capability.refresh()` — không side effect domain.
- Status Bar đọc `summary` từ Collector + Session capabilities.

---

## 4. Shortcut registry

### Vai trò

Không hardcode `keydown → if (key === 'k')` trong `App.tsx`.

```text
ShortcutRegistry
        │
        ▼
CommandId  (reference AppCommand.id)
```

Đăng ký:

```ts
shortcutRegistry.bind('palette.open', { key: 'k', modifiers: ['ctrl'] });
shortcutRegistry.bind('dashboard.open', { key: 'g' });
shortcutRegistry.bind('diagnostics.open', { key: 'd' });
```

Palette mở bằng command `palette.open` — cùng registry.

### Shortcut matrix v1

| Hiển thị | Command id | Ghi chú |
|----------|------------|---------|
| `Ctrl+K` | `palette.open` | Mở palette |
| `Ctrl+/` | `search.open` | Stub Global Search (Wave B) |
| `G` | `dashboard.open` | |
| `S` | `session.open` | |
| `L` | `library.open` | |
| `D` | `diagnostics.open` | |
| `Esc` | `shell.close-overlay` | Đóng palette / modal shell |

### Không intercept khi focus input

Shortcut **disabled** khi target là:

- `input`, `textarea`, `select`
- `[contenteditable="true"]`
- element có `data-shell-shortcuts="off"`

Palette khi mở: chỉ xử lý ↑↓ Enter Esc trong palette; không bubble ra global.

---

## 5. Global Search stub — IndexProvider

### Tên & vai trò

Không dùng `SearchService`. Dùng **IndexProvider** — cùng index cho Palette và Global Search (Wave B).

```text
IndexRegistry
        │
        ├── SessionIndexProvider
        ├── PlanIndexProvider
        ├── MarketIndexProvider
        └── WorkspaceIndexProvider
```

**v1 không index:** Notification, Statistics, Draw — giữ nhẹ.

### Interface (stub Wave A)

```ts
type IndexObjectType = 'session' | 'plan' | 'market' | 'workspace';

interface IndexEntry {
  readonly id: string;
  readonly type: IndexObjectType;
  readonly title: string;
  readonly subtitle?: string;
  readonly keywords: readonly string[];
  readonly navigate: () => void;
}

interface IndexProvider {
  readonly id: string;
  readonly rebuild: (ctx: AppContext) => Promise<readonly IndexEntry[]>;
}
```

### Wave A scope

- `SessionIndexProvider`, `PlanIndexProvider`, `MarketIndexProvider` (stub), `WorkspaceIndexProvider`.
- Palette mode `>` / default: commands + Action History Recent.
- `Ctrl+/` hoặc `?` prefix: index + help stub — reuse overlay component `mode: 'command' | 'index' | 'help'`.

---

## 6. Status Bar

### Mục tiêu

Thanh **28–32px**, cố định đáy (hoặc đỉnh — quyết sprint), luôn hiện — thay badge rải rác.

### Ví dụ nội dung

```text
Collector 🟢  ·  Playing  ·  3 rounds left  ·  Cloud OFF  ·  v1.0.0-rc.1  ·  Ctrl+K
```

### Nguồn dữ liệu

| Segment | Nguồn |
|---------|--------|
| Collector 🟢/🟡/🔴 | `CollectorCapability.summary` |
| Playing / Draft / — | `AppContext.activeSession?.status` |
| N rounds left | plan progress (read-only) |
| Cloud OFF | `CloudCapability` |
| Version | `RuntimeCapability` |
| Ctrl+K hint | static |

Click segment → **navigation phụ** (bắt buộc Wave A):

| Segment | Click → |
|---------|---------|
| Collector 🟢/🟡/🔴 | Diagnostics (scroll Collector) |
| Playing / `N rounds left` | Session workspace |
| Cloud OFF | Settings |
| Version | Diagnostics (Runtime) |
| Ctrl+K hint | Mở Palette |

### Vị trí code gợi ý

- Component: `src/shell/StatusBar.tsx`
- Mount trong `AppLayout`, dưới `main` content area
- `z-index`: `sticky` hoặc `raised` — dưới palette overlay

---

## 7. Acceptance criteria (Wave A)

### Command Palette

| # | Tiêu chí |
|---|----------|
| 1 | `Ctrl+K` mở palette **&lt; 100ms** (shell render; command list đã register sẵn) |
| 2 | Fuzzy search theo title/keywords |
| 3 | `Enter` → `execute()` command được chọn |
| 4 | `Esc` đóng |
| 5 | `↑` `↓` chọn |
| 6 | Command disabled hiển thị lý do (subtitle) |
| 7 | Không thêm gameplay |

### Diagnostics

| # | Tiêu chí |
|---|----------|
| 1 | Mở màn **&lt; 500ms** (skeleton + async refresh) |
| 2 | Read-only — không mutation |
| 3 | Refresh manual cập nhật tất cả capabilities |
| 4 | Mỗi capability có `ok` / `warning` / `error` / `disabled` |

### Keyboard

| # | Tiêu chí |
|---|----------|
| 1 | Shortcut bind qua `ShortcutRegistry` → `commandId` |
| 2 | Không fire khi focus `input` / `textarea` / `contenteditable` |
| 3 | `Esc` đóng overlay shell |

### Status Bar

| # | Tiêu chí |
|---|----------|
| 1 | Luôn hiện trên mọi workspace |
| 2 | Collector status khớp Diagnostics (cùng provider) |
| 3 | Chiều cao 28–32px, không che nội dung chính |

---

## 8. Out of scope (Wave A)

Shell Wave A **KHÔNG**:

| NO | Lý do |
|----|--------|
| Gameplay / settlement / stake rules | Product Freeze |
| Planning engine / generate plan logic | Domain frozen |
| Statistics computation mới | Chỉ đọc snapshot có sẵn |
| Collector ingest / sync / backfill | Chỉ đọc HTTP health |
| Persistence schema / migration | Chỉ đọc counts |
| Cloud sync / auth | Stub Disabled |
| Cockpit layout | Wave C |
| Backup / Restore `backup.json` | Wave B |
| Bulk actions / Tags / Archive | Wave D |
| Dashboard widget drag/resize | Sau Cockpit |

Wave A **CHỈ**: đăng ký lệnh, điều hướng workspace, đọc health, hiển thị status.

---

## 9. PR breakdown

### PR1 — Product Shell Runtime (no UI)

**Mục tiêu:** Runtime thuần TS, test unit — **khóa API sau merge**.

- `workspace-registry.ts`
- `command-registry.ts`
- `shortcut-registry.ts`
- `action-history.ts`
- `app-context.ts` + `ShellServices`
- `diagnostics/diagnostic-capability.ts` + providers (logic only)
- `index/index-provider.ts` + v1 providers
- Tests: enabled/visible, shortcut conflict, workspace register, action history dedupe

**Không** component React.

### PR2 — Product Shell UI

- `CommandPalette.tsx` — modes default / `>` / `?`, Recent từ ActionHistory
- `ShortcutRegistry` global listener (input guard)
- `StatusBar.tsx` — clickable segments
- `ShellProvider` boot + `registerWorkspace()` từ modules

### PR3 — Product Shell Diagnostics

- `DiagnosticsScreen.tsx`
- Command `diagnostics.open` + shortcut `D`
- Capability refresh + `Severity` display
- Dogfood 1 tuần

**Review order:** PR1 → PR2 → PR3.

---

## 10. Rollout plan

### Phase 0 — Design Sprint ✅ **DONE**

- [x] `product-shell-wave-a.md` — **API khóa, không viết thêm tài liệu kiến trúc**
- [x] Workspace Registry + Action History
- [x] Product Shell Rule + Registry thuần (no hooks)
- [x] PR naming: Runtime → UI → Diagnostics

### Phase 1 — Implement Wave A (3 PR)

1. **PR1 Product Shell Runtime**
2. **PR2 Product Shell UI**
3. **PR3 Product Shell Diagnostics**

### Phase 2 — Dogfood 1 tuần

Theo dõi trong `docs/product/feature-1-dogfood-notes.md`:

- Có dùng `Ctrl+K` mỗi ngày không?
- Diagnostics có giảm thời gian debug Collector/DB không?
- Status Bar có thay được badge rải rác không?

### Phase 3 — Wave B (sau dogfood)

- Global Search full (`IndexProvider` + `Ctrl+/`)
- Backup / Restore `backup.json`

### Phase 4 — Wave C

- **Cockpit** (read-only) — cùng capabilities với Diagnostics + session context

---

## Phụ lục A — File structure gợi ý

```text
src/shell/
├── app-context.ts
├── workspace-registry.ts
├── command-registry.ts
├── shortcut-registry.ts
├── action-history.ts
├── shell-provider.tsx          ← chỉ file React bootstrap; registry thuần TS
├── diagnostics/
│   ├── diagnostic-capability.ts
│   ├── diagnostics-provider.ts
│   └── capabilities/
├── index/
│   ├── index-provider.ts
│   ├── session-index-provider.ts
│   ├── plan-index-provider.ts
│   └── workspace-index-provider.ts
└── components/
    ├── CommandPalette.tsx
    ├── StatusBar.tsx
    └── DiagnosticsScreen.tsx
```

Workspaces (ví dụ `src/features/planning/`):

```text
planning-shell.ts   → registerWorkspace({ commands, diagnostics })
```

---

## Phụ lục D — Product Shell API Lock

**Sau merge PR1, các interface sau được coi là frozen:**

- `WorkspaceDefinition`
- `AppCommand` / `AppContext` / `CommandRegistry`
- `ShortcutRegistry`
- `ActionHistory` / `ActionHistoryEntry`
- `DiagnosticCapability` / `DiagnosticSnapshot` / `Severity`
- `IndexProvider` / `IndexEntry`

**Wave B/C chỉ mở rộng** (thêm provider, thêm command) — **không đổi signature**.

Vi phạm lock → cần ADR ngắn + dogfood evidence.

---

## Phụ lục B — Liên kết tài liệu

- Architecture freeze: [`docs/architecture/freeze-v1.md`](../architecture/freeze-v1.md)
- Product architecture: [`product-architecture.md`](product-architecture.md)
- Dogfood notes: [`feature-1-dogfood-notes.md`](feature-1-dogfood-notes.md)
- Verify / build info: [`reports/latest.json`](../../reports/latest.json)
- Collector API: [`apps/collector/README.md`](../../apps/collector/README.md)

---

## Phụ lục C — Sign-off

- [x] Platform Capability model (không spec theo feature)
- [x] Workspace Registry + Action History
- [x] Product Shell Rule
- [x] API lock policy
- [x] PR1/2/3 naming

**→ Bắt đầu PR1 Product Shell Runtime. Không viết thêm doc kiến trúc.**
