import type { LogEntry, LogSink } from '@/services/logger/sinks/log-sink';

export class ConsoleSink implements LogSink {
  write(entry: LogEntry): void {
    if (entry.event.type === 'PlanGenerated') {
      const event = entry.event as { sessionId: string; planId: string };
      console.info(`[Planning] PlanGenerated session=${event.sessionId} plan=${event.planId}`);
      return;
    }
    if (entry.event.type === 'SessionCreated') {
      const event = entry.event as { sessionId: string; planId: string; originDraftId: string };
      console.info(
        `[Session] SessionCreated session=${event.sessionId} plan=${event.planId} draft=${event.originDraftId}`,
      );
      return;
    }
    if (entry.event.type === 'ImprovementCandidateCreated') {
      const event = entry.event as { candidateId: string; sessionId: string; source: string };
      console.info(
        `[Improve] CandidateCreated id=${event.candidateId} session=${event.sessionId} source=${event.source}`,
      );
      return;
    }
    if (entry.event.type === 'PlanPromoted') {
      const event = entry.event as { sessionId: string; planId: string; origin: string };
      console.info(
        `[Session] PlanPromoted session=${event.sessionId} plan=${event.planId} origin=${event.origin}`,
      );
      return;
    }

    const line = `[${entry.level}] ${entry.event.type} @ ${entry.event.occurredAt.toISOString()}`;
    if (entry.level === 'error') {
      console.error(line, entry.message, entry.event);
      return;
    }
    if (entry.level === 'warn') {
      console.warn(line, entry.message, entry.event);
      return;
    }
    console.info(line, entry.message, entry.event);
  }
}
