# Foundation Freeze Report — Stake Planner

> **Ngày review:** 2026-06-25  
> **Phạm vi:** Kiến trúc Design System (`src/design/`, `src/components/ui/`, `src/components/product/`)  
> **Không phải:** Review toàn bộ workspace rollout

Khi mục **Foundation** đều PASS → coi DS layer **đã khóa**. Workspace rollout là track riêng (Session → Planning → …).

Playground: Settings → Design System · `src/design/playground/DesignPlayground.tsx`

---

## Tóm tắt

| Hạng mục                  | Kết quả                        |
| ------------------------- | ------------------------------ |
| Token Freeze              | ✅ PASS                        |
| Primitive Freeze          | ✅ PASS (có ghi chú)           |
| Product Component Freeze  | ✅ PASS                        |
| API Freeze                | ✅ PASS                        |
| Naming Freeze             | ✅ PASS                        |
| Insights pilot            | ✅ PASS                        |
| Library pilot             | ✅ PASS                        |
| Workspace grep (toàn app) | ⏳ PENDING — rollout chưa xong |

**Foundation Freeze:** 🔒 **LOCKED** — không thêm token/primitive/product mới nếu chưa có evidence.

**Workspace DS rollout:** ⏳ **IN PROGRESS** — chỉ Insights + Library đạt compose-only.

---

## 1. Token Freeze ✅ PASS

| Token      | File                              | Trạng thái |
| ---------- | --------------------------------- | ---------- |
| colors     | `src/design/tokens/colors.ts`     | ✅         |
| spacing    | `src/design/tokens/spacing.ts`    | ✅         |
| radius     | `src/design/tokens/radius.ts`     | ✅         |
| typography | `src/design/tokens/typography.ts` | ✅         |
| shadows    | `src/design/tokens/shadows.ts`    | ✅         |
| motion     | `src/design/tokens/motion.ts`     | ✅         |
| z-index    | `src/design/tokens/z-index.ts`    | ✅         |

**Scale spacing hiện tại:** `2 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64` (px)

### Quy tắc sau freeze

> 🔒 Không thêm token mới nếu chưa có evidence.

Ví dụ: Session migrate cần `spacing=18` → **không thêm** → sửa layout Session dùng `16` hoặc `20`.

**Evidence hợp lệ:** ≥2 màn product cùng cần pattern; không fit scale hiện tại; đã thử compose bằng token gần nhất.

**Ngoại lệ đã ghi nhận:** `statusChipTone.danger` thêm trong Library migrate (2026-06-25) — evidence: LOST badge trên SessionLibraryCard.

---

## 2. Primitive Freeze ✅ PASS (ghi chú)

### Primitives chính thức (frozen)

| Component | File             | API                                            |
| --------- | ---------------- | ---------------------------------------------- |
| Box       | `ui/Box.tsx`     | layout box                                     |
| Stack     | `ui/Stack.tsx`   | `spacing={SpacingKey}`                         |
| Grid      | `ui/Grid.tsx`    | `spacing`, `columns`                           |
| Row       | `ui/Row.tsx`     | `spacing`, `align` — layout ngang              |
| Card      | `ui/card.tsx`    | `tone`, `elevation`                            |
| Text      | `ui/Text.tsx`    | `variant`, `muted`, `emphasis`, `accent`       |
| Button    | `ui/button.tsx`  | `variant`, `size` — `size="icon"` = IconButton |
| Badge     | `ui/badge.tsx`   | `variant`, `size`                              |
| Divider   | `ui/Divider.tsx` | alias Separator                                |
| Input     | `ui/input.tsx`   | form text                                      |
| Tooltip   | `ui/tooltip.tsx` | TooltipProvider, InfoTip                       |

### Chưa có primitive riêng — deferred until evidence

| Primitive  | Hiện trạng                                      | Quyết định                                                        |
| ---------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| Select     | `FilterField` dùng `<select>` styled bằng token | Thêm `Select` primitive khi ≥2 màn cần dropdown ngoài FilterField |
| Textarea   | Chưa có                                         | Thêm khi Improve/Notes cần multi-line form chuẩn                  |
| IconButton | `Button size="icon"`                            | Không tách component — một API Button                             |

### App-level (không thuộc DS primitive)

| File                       | Lý do                                          |
| -------------------------- | ---------------------------------------------- |
| `ui/checkbox.tsx`          | Form control — giữ, không mở rộng thêm variant |
| `ui/label.tsx`             | Form label                                     |
| `ui/action-toast.tsx`      | App feedback                                   |
| `ui/coming-soon-toast.tsx` | App feedback                                   |

### Cấm sau freeze

```
GlassButton · OutlineCard · ModernCard · FancyCard · …
```

→ Thêm `tone` / `elevation` / `variant` vào primitive hiện có.

---

## 3. Product Component Freeze ✅ PASS

Catalog frozen (`src/components/product/`):

| Component         | Mục đích                                          |
| ----------------- | ------------------------------------------------- |
| Page              | Root layout màn hình                              |
| PageSection       | Section có tiêu đề                                |
| SectionHeader     | Tiêu đề + mô tả trang                             |
| HeroCard          | Reflection / hero insight                         |
| MetricCard        | Số liệu, KPI, stat box                            |
| InfoPanel         | Insight card có action                            |
| EmptyState        | Không có dữ liệu — **reuse, không \*Empty riêng** |
| StatusChip        | Trạng thái / confidence                           |
| Drawer            | Panel trượt (Compare, …)                          |
| FolderTile        | Collection folder                                 |
| ActionMenu        | Menu hành động (Export, …)                        |
| SearchField       | Search với icon                                   |
| FilterField       | Label + select                                    |
| NumberFilterField | Label + number input                              |

Sau freeze: **workspace chỉ compose** product components (+ Button khi cần hành động trực tiếp).

---

## 4. API Freeze ✅ PASS

Một API rõ ràng — không boolean rải rác:

```tsx
// ✅
<Card tone="warning" elevation="2" />
<Button variant="outline" size="sm" />
<Text variant="h3" muted />
<Stack spacing={16} />
<StatusChip label="Lost" tone="danger" />

// ❌
<Card warning yellow outlined />
```

| Primitive  | Props frozen                                                               |
| ---------- | -------------------------------------------------------------------------- |
| Card       | `tone`: default · highlight · accent · warning · danger · dashed           |
| Card       | `elevation`: 0 · 1 · 2 · popup · overlay                                   |
| Button     | `variant`: default · secondary · outline · ghost · destructive · link      |
| Button     | `size`: default · sm · lg · icon                                           |
| Text       | `variant`: display · h1 · h2 · h3 · body · small · caption · mono · metric |
| StatusChip | `tone`: muted · warning · success · success-strong · danger                |

---

## 5. Naming Freeze ✅ PASS

Quy ước: **{Purpose}{Kind}** — Kind ∈ {Card, Panel, Chip, Field, Tile, Menu, State}

| ✅ Đúng     | ❌ Không dùng                |
| ----------- | ---------------------------- |
| MetricCard  | StatisticsCard, DataCard     |
| HeroCard    | HeroMetric                   |
| InfoPanel   | InsightPanel                 |
| EmptyState  | LibraryEmpty, SessionEmpty   |
| FilterField | FilterSelect, StatusDropdown |

**Grep repo:** không phát hiện tên vi phạm.

---

## 6. Workspace grep

### Pilot PASS

| Màn              | `className=` trong Screen           | Hardcode `text-2xl` / `rounded-xl` / `shadow-md` |
| ---------------- | ----------------------------------- | ------------------------------------------------ |
| Insights         | 0                                   | 0                                                |
| Library (Screen) | 5 (semantic token + icon size only) | 0                                                |

Library sub-components (`SessionLibraryCard`, `SessionComparePanel`) vẫn có layout `className` — chấp nhận ở tầng feature card cho đến khi extract product `SessionCard` (deferred).

### Workspace PENDING ⏳

Các màn còn Tailwind rải rác (cần rollout):

```
DashboardScreen · CurrentSessionScreen · PlayingSessionScreen
GeneratePlanScreen · PlanTableScreen · PlanReadyScreen · DecisionScreen
CapitalPlannerScreen · ScenarioPlannerScreen · GameDesignerScreen
ImproveScreen · AnalysisScreen · AllocationScreen · SettingsScreen · SessionPlannerScreen
```

**Gate workspace hoàn chỉnh:** grep toàn `src/features/**/*Screen.tsx` = 0 vi phạm pattern cấm (giống Insights).

---

## 7. Design Playground ✅ PASS

`DesignPlayground.tsx` showcase đủ:

```
Typography → Colors → Spacing → Buttons → Cards → Badge → Drawer → Toolbar → Product → EmptyState
```

Thêm component product mới → **bắt buộc** thêm section vào Playground trước rollout.

---

## Hành động sau freeze

```text
① Foundation Freeze     ← DONE (layer locked)
② Core Services         ← NEXT (chỉ khi user bắt đầu scaffold)
   storage → clock → events → telemetry → logger → health → flags → sync
③ Workspace rollout     ← song song / sau Core Services
   Session → Planning → Capital → Scenario → Game Designer
```

**Không quay lại** `src/design/` hay `src/components/ui/` trừ khi có evidence + cập nhật Playground + freeze-report.

---

## ADR liên quan

- `docs/adr/0004-design-system-freeze.md`

---

_Review tiếp theo: sau Session rollout hoặc khi có yêu cầu mở token mới._
