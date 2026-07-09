# Spacing

Scale cố định (px): `2 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`

Map 1:1 với Tailwind (`8` → `gap-2`, `16` → `gap-4`).

## Khi dùng

- `Stack spacing={12}` — layout dọc
- `Grid spacing={12}` — layout lưới
- `Box padding={16}` — padding đơn

## Không dùng khi

- `mt-[18px]`, `gap-3.5` tùy ý
- Margin trực tiếp trong workspace — dùng `Stack` / `PageSection`

## Ví dụ

```tsx
<Stack spacing={32}>
  <PageSection title="Trends">...</PageSection>
</Stack>
```
