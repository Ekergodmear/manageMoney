import { type CSSProperties, type ReactNode, useState, type JSX } from 'react';

import { palette, type ThemeMode } from './theme';

export type NavItemId =
  | 'create'
  | 'plans'
  | 'history'
  | 'simulation'
  | 'optimize'
  | 'allocate'
  | 'settings';

interface NavItem {
  readonly id: NavItemId;
  readonly label: string;
  readonly icon: string;
  readonly enabled: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: 'create', label: 'Tạo kế hoạch', icon: '✨', enabled: true },
  { id: 'plans', label: 'Kế hoạch của tôi', icon: '📋', enabled: false },
  { id: 'history', label: 'Lịch sử', icon: '🕐', enabled: false },
  { id: 'simulation', label: 'Mô phỏng', icon: '🎲', enabled: false },
  { id: 'optimize', label: 'Tối ưu kế hoạch', icon: '⚡', enabled: false },
  { id: 'allocate', label: 'Phân bổ vốn', icon: '💼', enabled: false },
  { id: 'settings', label: 'Cài đặt', icon: '⚙️', enabled: false },
];

export interface AppShellProps {
  readonly activeNav: NavItemId;
  readonly onNavSelect: (id: NavItemId) => void;
  readonly main: ReactNode;
  readonly rightPanel?: ReactNode;
  readonly showRightPanel?: boolean;
  readonly theme: ThemeMode;
  readonly onThemeChange: (mode: ThemeMode) => void;
}

export function AppShell({
  activeNav,
  onNavSelect,
  main,
  rightPanel,
  showRightPanel = true,
  theme,
  onThemeChange,
}: AppShellProps): JSX.Element {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const c = palette[theme];

  const shell: CSSProperties = {
    minHeight: '100vh',
    background: c.bg,
    color: c.text,
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    lineHeight: 1.5,
  };

  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: showRightPanel
      ? 'minmax(220px, 240px) minmax(0, 1fr) minmax(240px, 280px)'
      : 'minmax(220px, 240px) minmax(0, 1fr)',
    minHeight: '100vh',
  };

  const sidebar: CSSProperties = {
    background: c.surface,
    borderRight: `1px solid ${c.border}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '1.25rem 1rem',
    gap: '0.5rem',
  };

  const brand: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontWeight: 700,
    fontSize: '1.05rem',
    marginBottom: '1rem',
    padding: '0 0.35rem',
  };

  const navBtn = (active: boolean, enabled: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    width: '100%',
    textAlign: 'left',
    padding: '0.65rem 0.75rem',
    borderRadius: '10px',
    border: 'none',
    background: active ? c.primarySoft : 'transparent',
    color: active ? c.primaryText : enabled ? c.text : c.textMuted,
    fontWeight: active ? 600 : 500,
    fontSize: '0.9rem',
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.55,
  });

  const tipCard: CSSProperties = {
    marginTop: 'auto',
    background: c.surfaceMuted,
    border: `1px solid ${c.border}`,
    borderRadius: '12px',
    padding: '0.85rem',
    fontSize: '0.8rem',
    color: c.textMuted,
    lineHeight: 1.45,
  };

  const mainArea: CSSProperties = {
    padding: 'clamp(1rem, 3vw, 2rem)',
    overflow: 'auto',
  };

  const rightArea: CSSProperties = {
    background: c.surfaceMuted,
    borderLeft: `1px solid ${c.border}`,
    padding: 'clamp(1rem, 2vw, 1.5rem)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    overflow: 'auto',
  };

  const mobileBar: CSSProperties = {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    background: c.surface,
    borderBottom: `1px solid ${c.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 30,
  };

  return (
    <div style={shell}>
      <style>{`
        @media (max-width: 1100px) {
          .sp-shell-grid { grid-template-columns: minmax(200px, 220px) minmax(0, 1fr) !important; }
          .sp-right-panel { display: none !important; }
        }
        @media (max-width: 768px) {
          .sp-shell-grid { grid-template-columns: 1fr !important; }
          .sp-sidebar { display: none !important; }
          .sp-sidebar.open { display: flex !important; position: fixed; inset: 0 auto 0 0; width: min(280px, 85vw); z-index: 40; box-shadow: 4px 0 24px rgba(0,0,0,0.12); }
          .sp-mobile-bar { display: flex !important; }
        }
      `}</style>

      <div className="sp-mobile-bar" style={mobileBar}>
        <button
          type="button"
          aria-label="Mở menu"
          onClick={() => setMobileNavOpen(true)}
          style={{
            background: 'none',
            border: `1px solid ${c.border}`,
            borderRadius: '8px',
            padding: '0.35rem 0.6rem',
            cursor: 'pointer',
            color: c.text,
          }}
        >
          ☰
        </button>
        <span style={{ fontWeight: 700 }}>Stake Planner</span>
        <span style={{ width: '2rem' }} />
      </div>

      <div className="sp-shell-grid" style={grid}>
        <aside
          className={`sp-sidebar${mobileNavOpen ? ' open' : ''}`}
          style={sidebar}
          aria-label="Điều hướng chính"
        >
          <div style={brand}>
            <span
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${c.primary}, #a855f7)`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1rem',
              }}
              aria-hidden
            >
              📈
            </span>
            Stake Planner
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                style={navBtn(activeNav === item.id, item.enabled)}
                disabled={!item.enabled && activeNav !== item.id}
                onClick={() => {
                  setMobileNavOpen(false);
                  onNavSelect(item.id);
                }}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div style={tipCard}>
            <strong style={{ color: c.text, display: 'block', marginBottom: '0.35rem' }}>
              Mẹo sử dụng
            </strong>
            Điền đủ thông tin để nhận kế hoạch cược phù hợp nhất với mục tiêu của bạn.
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: c.textMuted,
              paddingTop: '0.5rem',
              borderTop: `1px solid ${c.border}`,
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={(e) => onThemeChange(e.target.checked ? 'dark' : 'light')}
              />
              Dark mode
            </label>
            <span>© 2026</span>
          </div>
        </aside>

        <main style={mainArea}>{main}</main>

        {showRightPanel && rightPanel !== undefined ? (
          <aside className="sp-right-panel" style={rightArea} aria-label="Thông tin bổ sung">
            {rightPanel}
          </aside>
        ) : null}
      </div>

      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            border: 'none',
            zIndex: 35,
            cursor: 'pointer',
          }}
        />
      ) : null}
    </div>
  );
}

export function PanelCard({
  title,
  children,
  theme,
}: {
  title: string;
  children: ReactNode;
  theme: ThemeMode;
}): JSX.Element {
  const c = palette[theme];
  return (
    <section
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: '14px',
        padding: '1rem 1.1rem',
        boxShadow: c.shadow,
      }}
    >
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>{title}</h3>
      {children}
    </section>
  );
}

export function ComingSoonToast({
  message,
  onClose,
  theme,
}: {
  message: string;
  onClose: () => void;
  theme: ThemeMode;
}): JSX.Element {
  const c = palette[theme];
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        maxWidth: 'min(90vw, 24rem)',
        fontSize: '0.9rem',
      }}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: c.primarySoft,
          border: 'none',
          borderRadius: '8px',
          padding: '0.25rem 0.5rem',
          cursor: 'pointer',
          color: c.primaryText,
          fontWeight: 600,
        }}
      >
        Đóng
      </button>
    </div>
  );
}
