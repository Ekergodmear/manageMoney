export type PlanStatus = 'ready' | 'playing' | 'completed' | 'cancelled';

export interface PlanRecord {
  readonly id: number;
  readonly label: string;
  readonly roundCount: number;
  readonly status: PlanStatus;
  readonly createdAt: Date;
}
