import { Folder, Star } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  ActionMenu,
  Drawer,
  EmptyState,
  FilterField,
  FolderTile,
  HeroCard,
  InfoPanel,
  MetricCard,
  Page,
  PageSection,
  SearchField,
  SectionHeader,
  StatusChip,
} from '@/components/product';
import { Badge } from '@/components/ui/badge';
import { Box } from '@/components/ui/Box';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Grid } from '@/components/ui/Grid';
import { Row } from '@/components/ui/Row';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { TooltipProvider, InfoTip } from '@/components/ui/tooltip';
import { semanticBg, semanticText } from '@/design/tokens/colors';
import { elevationShadow } from '@/design/tokens/shadows';
import { radius } from '@/design/tokens/radius';
import { spacing } from '@/design/tokens/spacing';
import { cn } from '@/lib/utils';

/**
 * Màn nội bộ — xem nhanh toàn bộ Design System mà không cần Storybook.
 * Mở từ Settings → Design System.
 *
 * Thứ tự showcase = thứ tự Foundation Freeze Review.
 */
export function DesignPlayground(): ReactNode {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  return (
    <TooltipProvider>
      <Page>
        <SectionHeader
          title="Design Playground"
          description="Golden components — thêm component mới thì showcase tại đây trước khi rollout workspace."
        />

        <PageSection title="Typography">
          <Stack spacing={8}>
            <Text variant="display">Display</Text>
            <Text variant="h1">H1 — Page title</Text>
            <Text variant="h2">H2 — Section</Text>
            <Text variant="h3">H3 — Card title</Text>
            <Text variant="body">Body — nội dung chính</Text>
            <Text variant="small" muted>
              Small muted — phụ đề
            </Text>
            <Text variant="caption" accent>
              Caption accent — eyebrow
            </Text>
            <Text variant="metric">1,234,567</Text>
            <Text variant="mono" accent>
              ▁▂▃▅▇
            </Text>
          </Stack>
        </PageSection>

        <PageSection title="Colors">
          <Grid spacing={12} columns={4}>
            {(
              [
                'background',
                'surface',
                'primary',
                'secondary',
                'muted',
                'accent',
                'success',
                'warning',
                'danger',
              ] as const
            ).map((name) => (
              <Card key={name} elevation="1">
                <CardContent padding={12}>
                  <Stack spacing={8}>
                    <Box className={cn('h-10 w-full border', radius.sm, semanticBg[name])} />
                    <Text variant="small" muted>
                      {name}
                    </Text>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Grid>
          <Stack spacing={8}>
            <Text variant="small" muted>
              Text semantics
            </Text>
            <Row spacing={12}>
              <Text variant="body" className={semanticText.foreground}>
                foreground
              </Text>
              <Text variant="body" className={semanticText.muted}>
                muted
              </Text>
              <Text variant="body" className={semanticText.primary}>
                primary
              </Text>
              <Text variant="body" className={semanticText.success}>
                success
              </Text>
              <Text variant="body" className={semanticText.danger}>
                danger
              </Text>
            </Row>
          </Stack>
        </PageSection>

        <PageSection title="Spacing">
          <Stack spacing={8}>
            {(Object.keys(spacing) as Array<keyof typeof spacing>).map((key) => (
              <Row key={key} spacing={16} align="center">
                <Text variant="small" className="w-8 tabular-nums">
                  {key}
                </Text>
                <Box className="h-4 bg-primary/30" style={{ width: spacing[key] }} />
                <Text variant="caption" muted>
                  {spacing[key]}px
                </Text>
              </Row>
            ))}
          </Stack>
        </PageSection>

        <PageSection title="Buttons">
          <Stack spacing={12}>
            <Row spacing={8}>
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </Row>
            <Row spacing={8}>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" variant="outline" aria-label="Icon button">
                ★
              </Button>
              <InfoTip label="Tooltip on icon button — dùng Button size=icon + Tooltip" />
            </Row>
          </Stack>
        </PageSection>

        <PageSection title="Cards">
          <Stack spacing={16}>
            <Text variant="h3">Elevations</Text>
            <Grid spacing={12} columns={3}>
              {(['0', '1', '2', 'popup', 'overlay'] as const).map((elevation) => (
                <Card key={elevation} elevation={elevation}>
                  <CardContent padding={16}>
                    <Text variant="h3">elevation={elevation}</Text>
                    <Text variant="small" muted>
                      {elevationShadow[elevation]}
                    </Text>
                  </CardContent>
                </Card>
              ))}
            </Grid>
            <Text variant="h3">Tones</Text>
            <Grid spacing={12} columns={3}>
              {(['default', 'highlight', 'accent', 'warning', 'danger', 'dashed'] as const).map(
                (tone) => (
                  <Card key={tone} tone={tone} elevation="2">
                    <CardContent padding={16}>
                      <Text variant="h3">tone="{tone}"</Text>
                    </CardContent>
                  </Card>
                ),
              )}
            </Grid>
          </Stack>
        </PageSection>

        <PageSection title="Badge & StatusChip">
          <Stack spacing={12}>
            <Row spacing={8}>
              <Badge>Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
            </Row>
            <Row spacing={8}>
              <StatusChip label="Muted" tone="muted" />
              <StatusChip label="Warning" tone="warning" />
              <StatusChip label="Success" tone="success" />
              <StatusChip label="Strong" tone="success-strong" />
              <StatusChip label="Lost" tone="danger" />
            </Row>
          </Stack>
        </PageSection>

        <PageSection title="Drawer">
          <Stack spacing={12}>
            <Button type="button" onClick={() => setDrawerOpen(true)}>
              Mở Compare Drawer
            </Button>
            <Drawer
              open={drawerOpen}
              title="So sánh session"
              subtitle="Session A vs Session B"
              onClose={() => setDrawerOpen(false)}
            >
              <Stack spacing={8}>
                <Text variant="body" muted>
                  Metric · Left · Right · Δ
                </Text>
                <Text variant="body">Win rate: 62% vs 48% · +14%</Text>
                <Text variant="body">Max bet: 450K vs 380K · +70K</Text>
              </Stack>
            </Drawer>
          </Stack>
        </PageSection>

        <PageSection title="Toolbar">
          <Card elevation="2">
            <CardContent padding={16}>
              <Stack spacing={12}>
                <SearchField
                  value={searchQuery}
                  placeholder="Tìm session, tag…"
                  onChange={setSearchQuery}
                />
                <Grid spacing={8} columns={3}>
                  <FilterField
                    label="Trạng thái"
                    value={filterStatus}
                    onChange={setFilterStatus}
                    options={[
                      { value: 'all', label: 'Tất cả' },
                      { value: 'playing', label: 'Playing' },
                      { value: 'won', label: 'Won' },
                    ]}
                  />
                  <FilterField
                    label="Game"
                    value="all"
                    onChange={() => undefined}
                    options={[{ value: 'all', label: 'Tất cả' }]}
                  />
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </PageSection>

        <PageSection title="Product — HeroCard · MetricCard · InfoPanel">
          <Stack spacing={16}>
            <HeroCard
              eyebrow="30 phiên gần nhất"
              lines={['Win rate ổn định.', 'Vốn không vượt ngưỡng.']}
              closingLine="=> Tiếp tục chiến lược hiện tại."
              statusLabel="High"
              statusTone="success"
            />
            <Grid spacing={12} columns={3}>
              <MetricCard label="Win rate" value="62%" detail="12 phiên gần nhất" />
              <MetricCard
                label="Sparkline"
                value={<Text variant="mono" accent>▁▂▄▆█</Text>}
                footer="Gần nhất: +12%"
                statusLabel="Medium"
                statusTone="warning"
              />
              <MetricCard
                label="Best session"
                value="+450K"
                footer="Mở Session →"
                interactive
                onClick={() => undefined}
              />
            </Grid>
            <InfoPanel
              emoji="💡"
              title="Quick insight"
              body="Phiên cuối kết thúc sớm hơn trung bình."
              actionLabel="Mở Session"
              onAction={() => undefined}
            />
          </Stack>
        </PageSection>

        <PageSection title="Product — FolderTile · ActionMenu">
          <Grid spacing={8} columns={3}>
            <FolderTile
              icon={<Star className="h-5 w-5 text-warning-foreground" />}
              name="Favorite"
              count={12}
              active
              onClick={() => undefined}
            />
            <FolderTile
              icon={<Folder className="h-5 w-5 text-muted-foreground" />}
              name="Strategy"
              count={4}
              onClick={() => undefined}
            />
            <Card elevation="2">
              <CardContent padding={16}>
                <Row align="between">
                  <Text variant="body" emphasis>
                    Export menu
                  </Text>
                  <ActionMenu
                    sections={[
                      {
                        title: 'Export',
                        items: [
                          { label: 'JSON', onClick: () => undefined },
                          { label: 'PDF', onClick: () => undefined },
                        ],
                      },
                    ]}
                  />
                </Row>
              </CardContent>
            </Card>
          </Grid>
        </PageSection>

        <PageSection title="EmptyState">
          <EmptyState
            title="Chưa đủ dữ liệu từ Session Library."
            description="Hoàn thành 3 phiên để bắt đầu nhận insight."
            actionLabel="Tạo phiên đầu tiên"
            onAction={() => undefined}
          />
        </PageSection>
      </Page>
    </TooltipProvider>
  );
}
