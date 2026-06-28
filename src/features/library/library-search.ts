import type { LibraryCollection, LibraryFilters } from '@/features/library/library-types';
import type { Session } from '@/features/session/session-domain';
import { computeSessionStatistics } from '@/features/session/session-domain';
import { isActiveSession } from '@/features/library/library-stats';

function matchesCollection(session: Session, collectionId: string | null): boolean {
  if (collectionId === null || collectionId === 'all') {
    return true;
  }
  if (collectionId === 'favorite') {
    return session.favorite;
  }
  if (collectionId === 'archive') {
    return session.archived;
  }
  return false;
}

function matchesCustomCollection(
  session: Session,
  collectionId: string,
  collections: readonly LibraryCollection[],
): boolean {
  const collection = collections.find((c) => c.id === collectionId);
  if (collection === undefined) {
    return true;
  }
  return session.tags.includes(collection.tag);
}

export function filterLibrarySessions(
  sessions: readonly Session[],
  filters: LibraryFilters,
  collections: readonly LibraryCollection[],
): Session[] {
  const q = filters.query.trim().toLowerCase();

  return sessions.filter((session) => {
    if (!filters.includeArchived && session.archived && filters.collectionId !== 'archive') {
      return false;
    }

    if (filters.collectionId !== null && filters.collectionId !== 'all') {
      if (filters.collectionId === 'favorite' || filters.collectionId === 'archive') {
        if (!matchesCollection(session, filters.collectionId)) {
          return false;
        }
      } else if (!matchesCustomCollection(session, filters.collectionId, collections)) {
        return false;
      }
    }

    if (filters.status !== 'all' && session.status !== filters.status) {
      return false;
    }

    if (filters.presetId !== 'all' && session.presetId !== filters.presetId) {
      return false;
    }

    const stats = computeSessionStatistics(session);

    if (filters.minContinue !== null && stats.continueCount < filters.minContinue) {
      return false;
    }

    if (filters.minHighestBet !== null && stats.highestBet < filters.minHighestBet) {
      return false;
    }

    if (filters.tag !== null && filters.tag !== '' && !session.tags.includes(filters.tag)) {
      return false;
    }

    if (q !== '') {
      const haystack = [
        session.title,
        session.notes,
        session.presetId,
        session.status,
        ...session.tags,
      ]
        .join(' ')
        .toLowerCase();
      const statsText = `${String(stats.roundsPlayed)} rounds ${String(stats.planCount)} plans`;
      if (!haystack.includes(q) && !statsText.includes(q)) {
        return false;
      }
    }

    return true;
  });
}

export function partitionLibrarySessions(sessions: readonly Session[]): {
  readonly active: Session[];
  readonly recent: Session[];
} {
  const active = sessions.filter((s) => isActiveSession(s) && !s.archived);
  const recent = sessions
    .filter((s) => !isActiveSession(s) && !s.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { active, recent };
}

export function archivedSessions(sessions: readonly Session[]): Session[] {
  return sessions
    .filter((s) => s.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function allTagsFromSessions(sessions: readonly Session[]): string[] {
  const set = new Set<string>();
  for (const session of sessions) {
    for (const tag of session.tags) {
      set.add(tag);
    }
  }
  return [...set].sort();
}

export function countSessionsInCollection(
  sessions: readonly Session[],
  collectionId: string,
  collections: readonly LibraryCollection[],
): number {
  if (collectionId === 'favorite') {
    return sessions.filter((s) => s.favorite && !s.archived).length;
  }
  if (collectionId === 'archive') {
    return sessions.filter((s) => s.archived).length;
  }
  const collection = collections.find((c) => c.id === collectionId);
  if (collection === undefined) {
    return 0;
  }
  return sessions.filter((s) => s.tags.includes(collection.tag) && !s.archived).length;
}
