import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { GenerateResult } from '@/features/planner/plan-service';
import {
  accumulatedAtRound,
} from '@/features/planner/plan-display';
import type { Round } from '@stake/constraint-engine';
import { formatAmount } from '@/lib/money-format';
import { cn } from '@/lib/utils';

interface PlanRow {
  index: number;
  betAmount: number;
  accumulatedSpent: number;
  completed: boolean;
}

type RoundFilter = 'all' | 'selected' | 'unselected';

const columnHelper = createColumnHelper<PlanRow>();
const PAGE_SIZES = [15, 30, 50] as const;

interface PlanTableScreenProps {
  readonly generated: GenerateResult;
  readonly completedThroughRound: number;
  readonly sessionNumber?: number;
  readonly sessionStatus?: 'playing' | 'won' | 'lost';
  readonly onToggleRound: (roundIndex: number, checked: boolean) => void;
  readonly onJumpToRound?: (roundIndex: number) => void;
  readonly onResetProgress: () => void;
  readonly onEdit: () => void;
  readonly onContinue?: (targetRoundCount: number) => void;
  readonly hideContinue?: boolean;
}

export function PlanTableScreen({
  generated,
  completedThroughRound,
  sessionNumber = 1,
  sessionStatus = 'playing',
  onToggleRound,
  onJumpToRound,
  onResetProgress,
  onEdit,
  onContinue,
  hideContinue = false,
}: PlanTableScreenProps): React.ReactNode {
  const { strategy, statistics } = generated;
  const [roundFilter, setRoundFilter] = useState<RoundFilter>('all');
  const [search, setSearch] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const accumulated = accumulatedAtRound(strategy.rounds, completedThroughRound);
  const lastBet =
    completedThroughRound > 0
      ? (strategy.rounds[completedThroughRound - 1]?.betAmount ?? 0)
      : 0;
  const allRoundsDone =
    completedThroughRound >= strategy.rounds.length && sessionStatus === 'playing';
  const [continueTarget, setContinueTarget] = useState('');
  const [selectedContinue, setSelectedContinue] = useState<number | null>(null);
  const [jumpRound, setJumpRound] = useState('');
  const progressPct =
    strategy.rounds.length > 0
      ? Math.round((completedThroughRound / strategy.rounds.length) * 100)
      : 0;

  useEffect(() => {
    const main = document.querySelector('main');
    if (main === null) {
      return;
    }
    function onScroll(): void {
      setShowScrollTop(main.scrollTop > 200);
    }
    onScroll();
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, []);

  const data = useMemo<PlanRow[]>(
    () =>
      strategy.rounds.map((round: Round) => ({
        index: round.index,
        betAmount: round.betAmount,
        accumulatedSpent: round.accumulatedSpent,
        completed: round.index <= completedThroughRound,
      })),
    [strategy.rounds, completedThroughRound],
  );

  const filteredData = useMemo(() => {
    let rows = data;
    if (roundFilter === 'selected') {
      rows = rows.filter((row) => row.completed);
    } else if (roundFilter === 'unselected') {
      rows = rows.filter((row) => !row.completed);
    }
    const query = search.trim();
    if (query !== '') {
      rows = rows.filter((row) => String(row.index).includes(query));
    }
    return rows;
  }, [data, roundFilter, search]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'done',
        header: '',
        cell: ({ row }) => (
          <Checkbox
            checked={row.original.completed}
            disabled={sessionStatus !== 'playing'}
            aria-label={`Đã cược đến vòng ${String(row.original.index)}`}
            onCheckedChange={(checked) =>
              onToggleRound(row.original.index, checked === true)
            }
          />
        ),
      }),
      columnHelper.accessor('index', { header: 'Vòng' }),
      columnHelper.accessor('betAmount', {
        header: 'Cược (đ)',
        cell: (info) => formatAmount(info.getValue()),
      }),
      columnHelper.accessor('accumulatedSpent', {
        header: 'Tích lũy chi (đ)',
        cell: (info) => formatAmount(info.getValue()),
      }),
      columnHelper.display({
        id: 'status',
        header: 'Trạng thái',
        cell: ({ row }) =>
          row.original.completed ? (
            <Badge variant="success">Đã chọn</Badge>
          ) : (
            <Badge variant="muted">Chưa chọn</Badge>
          ),
      }),
    ],
    [onToggleRound, sessionStatus],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const totalRows = filteredData.length;
  const rangeStart = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = Math.min(totalRows, (pageIndex + 1) * pageSize);

  const filterTabs: { id: RoundFilter; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'selected', label: `Đã chọn (${String(completedThroughRound)})` },
    { id: 'unselected', label: 'Chưa chọn' },
  ];

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Phiên #{String(sessionNumber)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Đã chơi <strong className="text-foreground">{completedThroughRound}</strong> /{' '}
            {strategy.rounds.length} · Đã chi {formatAmount(accumulated)} đ
            {lastBet > 0 ? ` · Cược gần nhất ${formatAmount(lastBet)} đ` : ''}
            {sessionStatus === 'playing' ? (
              <>
                {' '}
                · Tick vòng <strong className="text-foreground">N</strong> = đã cược đến vòng N
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Sửa ý định
          </Button>
          <Button variant="outline" size="sm" onClick={onResetProgress}>
            <RefreshCw className="h-4 w-4" />
            Đặt lại
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setRoundFilter(tab.id);
                    table.setPageIndex(0);
                  }}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    roundFilter === tab.id
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onJumpToRound !== undefined && sessionStatus === 'playing' ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    className="h-9 w-20"
                    inputMode="numeric"
                    placeholder="Vòng"
                    value={jumpRound}
                    onChange={(e) => setJumpRound(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const n = Number(jumpRound);
                        if (n >= 1 && n <= strategy.rounds.length) {
                          onJumpToRound(n);
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      const n = Number(jumpRound);
                      if (n >= 1 && n <= strategy.rounds.length) {
                        onJumpToRound(n);
                      }
                    }}
                  >
                    Đến vòng
                  </Button>
                </div>
              ) : null}
              <div className="relative min-w-[180px] flex-1 sm:w-48 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-9"
                  placeholder="Tìm vòng..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    table.setPageIndex(0);
                  }}
                />
              </div>
              <Button variant="outline" size="sm" className="h-9" type="button" disabled>
                <Filter className="h-4 w-4" />
                Bộ lọc
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-border bg-muted/40 text-left">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 font-medium text-muted-foreground">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  const isCurrent =
                    sessionStatus === 'playing' &&
                    row.original.index === completedThroughRound &&
                    completedThroughRound > 0;
                  return (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-border/70 transition-colors',
                      row.original.completed && 'bg-success/30',
                      isCurrent && 'ring-1 ring-inset ring-primary/40',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span>Hiển thị</span>
              <select
                className="h-8 rounded-md border border-border bg-card px-2 text-foreground"
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span>/ trang</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                let page = i;
                if (pageCount > 5) {
                  if (pageIndex < 3) {
                    page = i;
                  } else if (pageIndex > pageCount - 4) {
                    page = pageCount - 5 + i;
                  } else {
                    page = pageIndex - 2 + i;
                  }
                }
                return (
                  <Button
                    key={page}
                    variant={pageIndex === page ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 min-w-8 px-2"
                    onClick={() => table.setPageIndex(page)}
                  >
                    {page + 1}
                  </Button>
                );
              })}
              {pageCount > 5 && pageIndex < pageCount - 3 ? (
                <span className="px-1">…</span>
              ) : null}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <span>
              {rangeStart} – {rangeEnd} của {totalRows}
            </span>
          </div>
        </CardContent>
      </Card>

      {allRoundsDone && !hideContinue ? (
        <Card className="border-dashed">
          <CardContent className="space-y-4 p-5">
            <p className="font-medium">Bạn đã hoàn thành kế hoạch.</p>
            <p className="text-sm text-muted-foreground">Không có lượt thắng.</p>
            <p className="text-sm font-medium">Continue to</p>
            <div className="flex flex-wrap gap-2">
              {[600, 700, 800, 1000]
                .filter((n) => n > strategy.rounds.length)
                .map((n) => (
                  <Button
                    key={n}
                    variant={selectedContinue === n ? 'default' : 'outline'}
                    size="sm"
                    type="button"
                    onClick={() => {
                      setSelectedContinue(n);
                      setContinueTarget(String(n));
                    }}
                  >
                    {n}
                  </Button>
                ))}
              <Button
                variant={selectedContinue === -1 ? 'default' : 'outline'}
                size="sm"
                type="button"
                onClick={() => setSelectedContinue(-1)}
              >
                Custom
              </Button>
            </div>
            {selectedContinue === -1 ? (
              <Input
                type="number"
                min={strategy.rounds.length + 1}
                placeholder={`Ví dụ: ${String(strategy.rounds.length + 100)}`}
                value={continueTarget}
                onChange={(e) => setContinueTarget(e.target.value)}
              />
            ) : null}
            <Button
              type="button"
              disabled={onContinue === undefined}
              onClick={() => {
                const target =
                  selectedContinue === -1
                    ? Number(continueTarget)
                    : (selectedContinue ?? strategy.rounds.length + 100);
                if (Number.isFinite(target) && target > strategy.rounds.length) {
                  onContinue?.(target);
                }
              }}
            >
              Tạo phần tiếp theo
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Progress {progressPct}% · Vốn cần {formatAmount(statistics.requiredBankrollAmount)} đ
      </p>

      {showScrollTop ? (
        <Button
          size="icon"
          className="fixed bottom-6 right-[calc(18rem+1.5rem)] z-20 h-10 w-10 rounded-full shadow-lg xl:right-[calc(20rem+1.5rem)]"
          aria-label="Lên đầu trang"
          onClick={() => {
            document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
