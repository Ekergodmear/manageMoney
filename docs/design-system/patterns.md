# Patterns

## Workspace compose only

Workspace (`InsightsScreen`, `SessionLibraryScreen`, …) chỉ **compose** product components.

```
Page → PageSection → InfoPanel / MetricCard / EmptyState
```

Không có trong workspace:

- `text-xl font-bold`
- `shadow-sm`, `rounded-xl` trực tiếp
- `space-y-8`, `gap-3` hardcode

## Rollout thứ tự

1. Insights ✅ (pilot)
2. Library
3. Session
4. Planning
5. Capital
6. Scenario
7. Game Designer

## Pilot checklist (Insights)

- [x] Header → `Text` + `Stack`
- [x] Empty → `EmptyState`
- [x] Reflection → `HeroCard`
- [x] Cards → `InfoPanel`
- [x] Trends / Records → `MetricCard` + `Grid`

Nếu migrate Insights không cần token/component mới → rollout các màn còn lại.
