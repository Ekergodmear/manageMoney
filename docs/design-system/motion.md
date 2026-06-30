# Motion

| Token    | ms  | Dùng cho        |
| -------- | --- | --------------- |
| `fast`   | 150 | Hover, màu      |
| `normal` | 220 | Drawer, panel   |
| `slow`   | 320 | Page transition |

## Khi dùng

- `motionDuration.fast` trong primitive (`Card`, `Button`)
- CSS: `var(--motion-fast)` trong `index.css`

## Không dùng khi

- Mỗi component tự `duration-300` / `duration-500`

## Ví dụ

```tsx
import { motionDuration } from '@/design/tokens/motion';

className={cn(motionDuration.fast, 'transition-colors')}
```
