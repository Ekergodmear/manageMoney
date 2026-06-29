# Colors

Semantic colors — không dùng tên palette (`green500`).

## Tokens

| Token | CSS var | Dùng cho |
|-------|---------|----------|
| `background` | `--background` | Nền app |
| `surface` | `--card` | Card, panel |
| `primary` | `--primary` | CTA, link, accent |
| `muted` | `--muted` | Nền phụ, chip nhạt |
| `success` | `--success` (nền) / `--success-foreground` (chữ) | Lời, thắng |

**Quan trọng:** `text-success` = màu nền nhạt, gần như không đọc được. Luôn dùng `text-success-foreground` hoặc `semanticText.success` cho chữ.
| `warning` | `--warning` | Cảnh báo, outlier |
| `danger` | `--destructive` | Lỗi, outlier nghiêm trọng |

## Khi dùng

- Component primitive: `semanticBg`, `semanticText`, `semanticBorder` từ `@/design/tokens/colors`
- Theme values: `lightTheme` / `darkTheme` trong `@/design/theme`

## Không dùng khi

- Hardcode `#7c3aed` trong feature screen
- `text-emerald-700` trực tiếp — dùng `StatusChip` tone `success`

## Ví dụ

```tsx
import { semanticText } from '@/design/tokens/colors';

<Text className={semanticText.muted}>Phụ đề</Text>
```
