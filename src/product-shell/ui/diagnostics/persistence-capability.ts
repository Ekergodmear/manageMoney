import type { DiagnosticSnapshot } from '@/product-shell/types/diagnostics';
import {
  buildPersistenceSnapshot,
  formatCheckedTimestamp,
  formatMigrationForDisplay,
  formatPersistenceSnapshotSummary,
} from '@/services/storage/persistence-snapshot';
import { formatStorageErrorCause } from '@/services/storage/storage-errors';
import type { AppServices } from '@/services/registry/app-services';
import { getAppServices } from '@/services/registry/app-services';

function mapStatus(snapshot: Awaited<ReturnType<typeof buildPersistenceSnapshot>>): {
  status: DiagnosticSnapshot['status'];
  severity: DiagnosticSnapshot['severity'];
} {
  switch (snapshot.status) {
    case 'healthy':
      return { status: 'ok', severity: 'info' };
    case 'degraded':
      return { status: 'warning', severity: 'warning' };
    case 'offline':
      return { status: 'error', severity: 'critical' };
    case 'critical':
      return { status: 'error', severity: 'critical' };
  }
}

function formatOperationalStatus(status: Awaited<ReturnType<typeof buildPersistenceSnapshot>>['status']): string {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'degraded':
      return 'Degraded';
    case 'offline':
      return 'Offline';
    case 'critical':
      return 'Critical';
  }
}

function formatLastError(
  lastError: Awaited<ReturnType<typeof buildPersistenceSnapshot>>['lastError'],
): string {
  if (lastError === null) {
    return 'None';
  }
  return `${formatStorageErrorCause(lastError.cause)} — ${lastError.message}`;
}

export async function refreshPersistenceCapability(
  services: AppServices = getAppServices(),
): Promise<DiagnosticSnapshot> {
  const persistenceSnapshot = await buildPersistenceSnapshot({
    driver: services.storageDriver,
    health: services.persistenceHealth.getView(),
  });

  if (persistenceSnapshot.status === 'offline') {
    services.persistenceHealth.setOffline(persistenceSnapshot.checkedAt);
  }

  const { status, severity } = mapStatus(persistenceSnapshot);

  return {
    status,
    severity,
    summary: formatPersistenceSnapshotSummary(persistenceSnapshot),
    checkedAt: persistenceSnapshot.checkedAt,
    rows: [
      { label: 'Status', value: formatOperationalStatus(persistenceSnapshot.status) },
      { label: 'Storage Driver', value: persistenceSnapshot.driverLabel },
      { label: 'Schema Version', value: String(persistenceSnapshot.schemaVersion) },
      {
        label: 'Last Migration',
        value: formatMigrationForDisplay(persistenceSnapshot.lastMigration),
      },
      { label: 'Last Save', value: formatCheckedTimestamp(persistenceSnapshot.lastSaveAt) },
      { label: 'Last Load', value: formatCheckedTimestamp(persistenceSnapshot.lastLoadAt) },
      {
        label: 'Last Error',
        value: formatLastError(persistenceSnapshot.lastError),
        ...(persistenceSnapshot.lastError === null
          ? {}
          : {
              severity:
                persistenceSnapshot.status === 'critical' ||
                persistenceSnapshot.status === 'offline'
                  ? ('critical' as const)
                  : ('warning' as const),
            }),
      },
      { label: 'Sessions', value: String(persistenceSnapshot.counts.sessions) },
      { label: 'Drafts', value: String(persistenceSnapshot.counts.drafts) },
      { label: 'Candidates', value: String(persistenceSnapshot.counts.candidates) },
      {
        label: 'Library Collections',
        value: String(persistenceSnapshot.counts.libraryCollections),
      },
      { label: 'Notifications', value: String(persistenceSnapshot.counts.notifications) },
      {
        label: 'Storage Size',
        value: persistenceSnapshot.storageSizeEstimate ?? '—',
      },
    ],
  };
}
