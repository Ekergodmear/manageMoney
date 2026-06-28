import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { GenerateResult } from '@/features/planner/plan-service';
import type { Round } from '@stake/constraint-engine';
import { formatAmount } from '@/lib/money-format';
import { cn } from '@/lib/utils';

interface PlanRow {
  index: number;
  betAmount: number;
  accumulatedSpent: number;
  completed: boolean;
}

const columnHelper = createColumnHelper<PlanRow>();

interface PlanTableScreenProps {
  readonly generated: GenerateResult;
  readonly completedThroughRound: number;
  readonly onToggleRound: (roundIndex: number, checked: boolean) => void;
  readonly onResetProgress: () => void;
  readonly onBackToDecision: () => void;
  readonly onEdit: () => void;
}

export function PlanTableScreen({
  generated,
  completedThroughRound,
  onToggleRound,
  onResetProgress,
  onBackToDecision,
  onEdit,
}: PlanTableScreenProps): React.ReactNode {
  const { strategy, statistics } = generated;
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function onScroll(): void {
      setShowScrollTop(window.scrollY > 200);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'done',
        header: '✓',
        cell: ({ row }) => (
          <Checkbox
            checked={row.original.completed}
            aria-label={`Đánh dấu đã cược đến vòng ${String(row.original.index)}`}
            onCheckedChange={(checked) => onToggleRound(row.original.index, checked === true)}
          />
        ),
      }),
      columnHelper.accessor('index', { header: 'Vòng' }),
      columnHelper.accessor('betAmount', {
        header: 'Cược',
        cell: (info) => formatAmount(info.getValue()),
      }),
      columnHelper.accessor('accumulatedSpent', {
        header: 'Tích lũy chi',
        cell: (info) => formatAmount(info.getValue()),
      }),
    ],
    [onToggleRound],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="scrollbar-none mx-auto h-full min-h-0 max-w-5xl space-y-4 overflow-y-auto">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 bg-background/95 py-2 backdrop-blur">
        <Button variant="outline" size="sm" onClick={onBackToDecision}>
          <ArrowLeft className="h-4 w-4" />
          Kết quả
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Sửa ý định
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Kế hoạch — {strategy.rounds.length} vòng</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            Đã cược: <strong className="text-foreground">{completedThroughRound}</strong> /{' '}
            {strategy.rounds.length}
            {completedThroughRound > 0
              ? ` · Tích lũy: ${formatAmount(strategy.rounds[completedThroughRound - 1]?.accumulatedSpent ?? 0)} đ`
              : ''}
          </span>
          {completedThroughRound > 0 ? (
            <Button variant="outline" size="sm" onClick={onResetProgress}>
              Đặt lại
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Bảng cược chi tiết</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 sm:p-0">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border text-left text-muted-foreground">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-border/70 transition-colors',
                    row.original.completed && 'bg-success/40',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="font-semibold">Vốn cần: {formatAmount(statistics.requiredBankrollAmount)} đ</p>

      {showScrollTop ? (
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-20 rounded-full shadow-lg"
          aria-label="Lên đầu trang"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
