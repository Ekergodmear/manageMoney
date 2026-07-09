# Components — Design System (Frozen)

> Catalog sau **Foundation Freeze** (2026-06-25).  
> Chi tiết PASS/FAIL: `freeze-report.md` · ADR: `../adr/0004-design-system-freeze.md`

Playground: Settings → Design System · `src/design/playground/DesignPlayground.tsx`

---

## Tầng primitive — `src/components/ui/`

| Component | Khi dùng                                                    |
| --------- | ----------------------------------------------------------- |
| `Box`     | Wrapper layout                                              |
| `Stack`   | Layout dọc — `spacing={SpacingKey}`                         |
| `Row`     | Layout ngang — `spacing`, `align`                           |
| `Grid`    | Lưới responsive — `columns`, `spacing`                      |
| `Text`    | Mọi typography — `variant="h1"` … `metric`                  |
| `Card`    | Container — `tone`, `elevation`                             |
| `Button`  | Hành động — `variant`, `size` (`size="icon"` = icon button) |
| `Badge`   | Nhãn inline                                                 |
| `Divider` | Phân cách                                                   |
| `Input`   | Form text                                                   |
| `Tooltip` | TooltipProvider, InfoTip                                    |

**Deferred (evidence required):** `Select`, `Textarea` — xem freeze-report.

**Không** dùng primitive trực tiếp trong workspace nếu đã có product component tương đương.

---

## Tầng product — `src/components/product/`

| Component           | Khi dùng                       |
| ------------------- | ------------------------------ |
| `Page`              | Root layout màn hình           |
| `PageSection`       | Section có tiêu đề             |
| `SectionHeader`     | Tiêu đề trang + mô tả          |
| `HeroCard`          | Reflection / hero insight      |
| `InfoPanel`         | Insight card có action         |
| `MetricCard`        | Số liệu, KPI, stat box         |
| `EmptyState`        | Không có dữ liệu — **reuse**   |
| `StatusChip`        | Confidence, trạng thái session |
| `Drawer`            | Panel trượt (Compare, …)       |
| `FolderTile`        | Collection folder              |
| `ActionMenu`        | Menu hành động dropdown        |
| `SearchField`       | Search có icon                 |
| `FilterField`       | Label + select                 |
| `NumberFilterField` | Label + number input           |

---

## API (frozen)

```tsx
<Card tone="warning" elevation="2" />
<Button variant="outline" size="sm" />
<Text variant="h3" muted />
<Stack spacing={16} />
<StatusChip label="Lost" tone="danger" />
```

Không: `<Card warning yellow outlined />`

---

## Naming

`{Purpose}{Kind}` — MetricCard, HeroCard, InfoPanel, EmptyState, FilterField.

Không: StatisticsCard, InsightPanel, LibraryEmpty.

---

## Ví dụ — Insights (pilot ✅)

```tsx
<Page>
  <HeroCard eyebrow="..." lines={...} closingLine="..." />
  <PageSection title="Quick Insights">
    <Stack spacing={12}>
      <InfoPanel title="..." body="..." />
    </Stack>
  </PageSection>
</Page>
```

---

## Không dùng khi

- Tạo `FancyCard`, `GlassCard` — thêm `tone` / `elevation` vào `Card`
- Copy-paste Tailwind từ màn cũ sang màn mới
- Thêm token/primitive mà chưa có evidence + Playground + freeze-report update
