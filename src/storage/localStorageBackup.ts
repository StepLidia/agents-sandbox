const APP_STORAGE_PREFIX = 'growly-';

type LocalStorageBackupItem = {
  key: string;
  value: string;
};

export type LocalStorageBackup = {
  app: 'growly-agent';
  exportedAt: string;
  items: LocalStorageBackupItem[];
  storagePrefix: typeof APP_STORAGE_PREFIX;
  version: 1;
};

export function createLocalStorageBackup(storage: Storage, exportedAt = new Date()): LocalStorageBackup {
  const items = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    .filter((key): key is string => Boolean(key?.startsWith(APP_STORAGE_PREFIX)))
    .sort()
    .map((key) => ({
      key,
      value: storage.getItem(key) ?? '',
    }));

  return {
    app: 'growly-agent',
    exportedAt: exportedAt.toISOString(),
    items,
    storagePrefix: APP_STORAGE_PREFIX,
    version: 1,
  };
}

export function downloadLocalStorageBackup(storage: Storage) {
  const backup = createLocalStorageBackup(storage);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `growly-backup-${formatBackupDate(new Date(backup.exportedAt))}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatBackupDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
